/**
 * ETL Transform Functions - Data transformation to CRA Wiz format
 */

import type { SbslRow, ValidationResult } from './types';
import { CRA_WIZ_128_COLUMNS } from './field-maps';
import {
  findFieldValue,
  parseBorrowerName,
  mapAUSResult,
  mapAUSystem,
  mapNonAmortz,
  convertLoanTermToYears,
  getLoanTermMonths,
  deriveRateType,
  deriveVarTerm,
  excelDateToString,
} from './utils';
import { BRANCH_LIST, getBranchFromLoanOfficer, getBranchName } from '../cra-wiz-transform';
import { logInfo, logWarning, logDebug, trackETLStep } from '../error-tracker';

/**
 * Transform data to CRA Wiz 128-column format
 * IMPORTANT: Output will contain EXACTLY 128 columns as specified in HMDA_COLUMN_ORDER
 * Updated per Jonathan's feedback to include RateType and Var_Term columns
 *
 * Input sources:
 * - Encompass Export: Main HMDA data (LEI, ULI, demographics, loan details)
 * - Additional Fields: Borrower names, Lender, Processor, PostCloser, Branch
 * - LaserPro Export: Alternative HMDA source
 */
export const transformToCRAWizFormat = (data: SbslRow[]): SbslRow[] => {
  const startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  logInfo('ETL:Transform', 'Starting CRA Wiz transformation', {
    inputRows: data.length,
    targetColumns: CRA_WIZ_128_COLUMNS.length,
  });

  console.log('=== TRANSFORMING TO CRA WIZ FORMAT ===');
  console.log('Input rows:', data.length);
  console.log('Target columns:', CRA_WIZ_128_COLUMNS.length);

  const result = data.map((row, idx) => {
    // Start with an empty output object - only add the 126 specified columns
    const output: SbslRow = {};

    // Initialize all 126 columns with empty string or found value
    CRA_WIZ_128_COLUMNS.forEach(col => {
      const value = findFieldValue(row, col);
      // IMPORTANT: Explicitly preserve numeric zeros (0, 0.0, "0")
      if (value === 0 || value === '0' || value === 0.0) {
        output[col] = value;
      } else {
        output[col] = value ?? '';
      }
    });

    // Parse Borrower Name if FirstName/LastName are missing
    if ((!output['FirstName'] || !output['LastName']) && row['BorrowerFullName']) {
      const { firstName, lastName } = parseBorrowerName(String(row['BorrowerFullName']));
      if (!output['FirstName']) output['FirstName'] = firstName;
      if (!output['LastName']) output['LastName'] = lastName;
    }

    // Also check for "Borrower Name" field directly
    if ((!output['FirstName'] || !output['LastName']) && row['Borrower Name']) {
      const { firstName, lastName } = parseBorrowerName(String(row['Borrower Name']));
      if (!output['FirstName']) output['FirstName'] = firstName;
      if (!output['LastName']) output['LastName'] = lastName;
    }

    // Fallback for LaserPro business loans: if LastName is still empty,
    // use BorrowerFullName (business name) as LastName
    if (!output['LastName']) {
      const businessName = String(row['BorrowerFullName'] || row['Borrower Name'] || '').trim();
      if (businessName) {
        output['LastName'] = businessName;
      }
    }

    // Branch lookup - try multiple sources for branch number
    // Priority: 1) Direct field, 2) Extract from ULI (Encompass), 3) Derive from Lender
    let branchNum = String(output['Branch'] || findFieldValue(row, 'Branch') || '').trim();
    const source = row._source || 'Encompass';

    // Debug log for first row
    if (idx === 0) {
      console.log(
        'Branch lookup - direct:',
        output['Branch'],
        'findFieldValue:',
        findFieldValue(row, 'Branch')
      );
      console.log(
        'Available row keys:',
        Object.keys(row).filter(k => k.toLowerCase().includes('branch'))
      );
    }

    // If no branch number and this is an Encompass record, extract from ULI
    // Per Jonathan's feedback: First 3 digits of application number = branch number
    // Application number immediately follows the 20-character LEI in the ULI
    const isLaserPro = source.toLowerCase() === 'laserpro';

    // LaserPro lender fields are not in a usable format - leave blank
    // Jonathan will populate via manual VLOOKUP from Encino reports
    if (isLaserPro) {
      output['Lender'] = '';
      output['AA_Processor'] = '';
      output['LDP_PostCloser'] = '';
    }

    if (!branchNum && !isLaserPro) {
      const uli = String(output['ULI'] || findFieldValue(row, 'ULI') || '').trim();
      // An LEI is always 20 characters, so branch is chars 21-23 (0-indexed: 20-22)
      if (uli.length > 23) {
        const extractedBranch = uli.substring(20, 23);
        // Verify it looks like a valid branch number (3 digits)
        if (/^\d{3}$/.test(extractedBranch) && BRANCH_LIST[extractedBranch]) {
          branchNum = extractedBranch;
          output['Branch'] = branchNum;
          logDebug('ETL:Transform', `Extracted branch ${branchNum} from ULI for Encompass record`);
        } else if (idx === 0) {
          console.log(
            `Branch extraction from ULI: extracted "${extractedBranch}" but not in BRANCH_LIST`
          );
        }
      }
    }

    // If still no branch number, try to derive from Lender/Loan Officer
    if (!branchNum) {
      const lender = output['Lender'] || findFieldValue(row, 'Lender') || '';
      if (lender) {
        branchNum = getBranchFromLoanOfficer(String(lender));
        if (branchNum) {
          output['Branch'] = branchNum;
          logDebug('ETL:Transform', `Derived branch ${branchNum} from Lender: ${lender}`);
        } else if (idx < 5) {
          // Only log first few warnings
          warnings.push(`Row ${idx}: Could not determine branch for Lender "${lender}"`);
        }
      }
    } else {
      // Branch number was found directly - ensure it's set in output
      output['Branch'] = branchNum;
    }

    // Set Branch_Name from branch number using VLOOKUP
    let branchName = String(
      output['Branch_Name'] || findFieldValue(row, 'Branch_Name') || ''
    ).trim();

    // If we have a branch number but no name, look it up
    if (branchNum && !branchName) {
      branchName = getBranchName(branchNum, '');
      if (branchName) {
        output['Branch_Name'] = branchName;
        logDebug('ETL:Transform', `Looked up branch name "${branchName}" for branch #${branchNum}`);
      } else if (idx < 5) {
        warnings.push(`Row ${idx}: Unknown branch number "${branchNum}" - not in BRANCH_LIST`);
      }
    } else if (branchName) {
      output['Branch_Name'] = branchName;
    }

    // Add required blank fields
    if (!output['ErrorMadeBy']) output['ErrorMadeBy'] = '';
    if (!output['DSC']) output['DSC'] = '';
    if (!output['EditStatus']) output['EditStatus'] = '';
    if (!output['EditCkComments']) output['EditCkComments'] = '';
    if (!output['Comments']) output['Comments'] = '';

    // Default co-applicant values if empty (per HMDA spec, 9999 = N/A)
    if (!output['Coa_Age'] || String(output['Coa_Age']) === '') output['Coa_Age'] = '9999';
    if (!output['Coa_CreditScore'] || String(output['Coa_CreditScore']) === '')
      output['Coa_CreditScore'] = '9999';

    // HMDA "No Co-Applicant" defaults for demographic fields
    // Per HMDA spec: Apply these codes ONLY if the source data is blank (no co-applicant present)
    // Ethnicity: 5 = No co-applicant, Determinant: 4 = Not applicable
    // Race: 8 = No co-applicant, Determinant: 4 = Not applicable
    // Sex: 5 = No co-applicant, Determinant: 4 = Not applicable
    if (!output['Coa_Ethnicity_1'] || String(output['Coa_Ethnicity_1']) === '') {
      output['Coa_Ethnicity_1'] = findFieldValue(row, 'Coa_Ethnicity_1') ?? '5';
    }
    if (
      !output['Coa_Ethnicity_Determinant'] ||
      String(output['Coa_Ethnicity_Determinant']) === ''
    ) {
      output['Coa_Ethnicity_Determinant'] = findFieldValue(row, 'Coa_Ethnicity_Determinant') ?? '4';
    }
    if (!output['CoaRace_1'] || String(output['CoaRace_1']) === '') {
      output['CoaRace_1'] = findFieldValue(row, 'CoaRace_1') ?? '8';
    }
    if (!output['CoaRace_Determinant'] || String(output['CoaRace_Determinant']) === '') {
      output['CoaRace_Determinant'] = findFieldValue(row, 'CoaRace_Determinant') ?? '4';
    }
    if (!output['CoaSex'] || String(output['CoaSex']) === '') {
      output['CoaSex'] = findFieldValue(row, 'CoaSex') ?? '5';
    }
    if (!output['CoaSex_Determinant'] || String(output['CoaSex_Determinant']) === '') {
      output['CoaSex_Determinant'] = findFieldValue(row, 'CoaSex_Determinant') ?? '4';
    }

    // DTIRatio: should be numeric value or "NA" (HMDA code for Exempt)
    if (
      output['DTIRatio'] === '' ||
      output['DTIRatio'] === null ||
      output['DTIRatio'] === undefined
    ) {
      output['DTIRatio'] = 'NA';
    }

    // CreditModel: Pull from source data first, default to '9' (Not applicable) only if truly missing
    const rawCreditModel = output['CreditModel'] ?? findFieldValue(row, 'CreditModel');
    if (
      rawCreditModel &&
      rawCreditModel !== '' &&
      rawCreditModel !== null &&
      rawCreditModel !== undefined
    ) {
      output['CreditModel'] = String(rawCreditModel);
    } else {
      output['CreditModel'] = '9'; // 9 = Not applicable per HMDA spec
    }
    // Debug log for CreditModel
    if (idx === 0) {
      console.info('CreditModel source values:', {
        outputCreditModel: output['CreditModel'],
        rawCreditModel,
        'Credit Score Type Used': row['Credit Score Type Used'],
        'Credit Scoring Model': row['Credit Scoring Model'],
      });
    }

    // Coa_CreditModel: Pull from source data first, default to '9' (Not applicable) only if truly missing
    const rawCoaCreditModel = output['Coa_CreditModel'] ?? findFieldValue(row, 'Coa_CreditModel');
    if (
      rawCoaCreditModel &&
      rawCoaCreditModel !== '' &&
      rawCoaCreditModel !== null &&
      rawCoaCreditModel !== undefined
    ) {
      output['Coa_CreditModel'] = String(rawCoaCreditModel);
    } else {
      output['Coa_CreditModel'] = '9'; // 9 = Not applicable per HMDA spec
    }

    // NonAmortz - Map to valid HMDA codes
    const rawNonAmortz = output['NonAmortz'] ?? findFieldValue(row, 'NonAmortz');
    const balloon = findFieldValue(row, 'BalloonPMT');
    const interestOnly = findFieldValue(row, 'IOPMT');
    const negAm = findFieldValue(row, 'NegAM');
    output['NonAmortz'] = mapNonAmortz(rawNonAmortz, balloon, interestOnly, negAm);

    // NMLSRID: should not be blank
    if (output['NMLSRID'] === '' || output['NMLSRID'] === null || output['NMLSRID'] === undefined) {
      const nmls = findFieldValue(row, 'NMLSRID');
      if (nmls) {
        output['NMLSRID'] = String(nmls)
          .replace(/^NMLS?#?\s*/i, '')
          .trim();
      }
    }

    // ConstructionMethod: HMDA values 1=Site-built, 2=Manufactured home
    if (
      output['ConstructionMethod'] === '' ||
      output['ConstructionMethod'] === null ||
      output['ConstructionMethod'] === undefined
    ) {
      const constructMethod = findFieldValue(row, 'ConstructionMethod');
      output['ConstructionMethod'] = constructMethod ?? '1';
    }

    // Loan Term handling - FIXED per Jonathan's feedback:
    // Source data contains months. Loan_Term_Months gets the raw months value.
    // Loan_Term gets months / 12 (years with floor rounding).
    const rawLoanTermMonths =
      findFieldValue(row, 'Loan_Term_Months') ||
      findFieldValue(row, 'LoanTermMonths') ||
      findFieldValue(row, 'Term in Months') ||
      findFieldValue(row, 'Loan_Term') ||
      findFieldValue(row, 'LoanTerm') ||
      findFieldValue(row, 'Term');

    if (rawLoanTermMonths) {
      // First, get the months value (raw or converted if needed)
      const monthsValue = getLoanTermMonths(rawLoanTermMonths);
      output['Loan_Term_Months'] = monthsValue;

      // Then calculate years with half-year rounding (>6 mo rounds up, <=6 rounds down)
      if (monthsValue) {
        const yearsValue = convertLoanTermToYears(monthsValue);
        output['Loan_Term'] = yearsValue;

        // Debug log for first row
        if (idx === 0) {
          console.log('=== LOAN TERM CONVERSION ===');
          console.log('Raw input:', rawLoanTermMonths);
          console.log('Months value:', monthsValue);
          console.log('Years value:', yearsValue);
        }
      }
    }

    // County_5 and Tract_11 - Leave BLANK per Jonathan's feedback
    // CRAWiz will perform a Geocode on all file locations and populate these fields
    output['County_5'] = '';
    output['Tract_11'] = '';

    // Debug log for first row
    if (idx === 0) {
      console.log('=== TRANSFORM OUTPUT (first row) ===');
      console.log('County_5:', output['County_5']);
      console.log('Tract_11:', output['Tract_11']);
      console.log('Loan_Term:', output['Loan_Term']);
      console.log('Loan_Term_Months:', output['Loan_Term_Months']);
    }

    // AUSystem1 - Map to valid HMDA codes (1-6)
    const rawAUSystem1 = output['AUSystem1'] ?? findFieldValue(row, 'AUSystem1');
    output['AUSystem1'] = mapAUSystem(rawAUSystem1);

    // AUSResult1 - Map to valid HMDA codes (1-17)
    const rawAUSResult1 = output['AUSResult1'] ?? findFieldValue(row, 'AUSResult1');
    output['AUSResult1'] = mapAUSResult(rawAUSResult1);

    // RateType and Var_Term - Derived from IntroRatePeriod per Jonathan's feedback
    // IntroRatePeriod = N/A or blank → Fixed (1), IntroRatePeriod = number → Variable (2)
    const introRatePeriod = output['IntroRatePeriod'] ?? findFieldValue(row, 'IntroRatePeriod');

    // Check multiple sources for RateType:
    // 1) Explicit RateType field
    // 2) LaserPro _LaserPro_RateType field (contains "Fixed" or "Variable" text)
    // 3) Derive from IntroRatePeriod
    const sourceRateType =
      findFieldValue(row, 'RateType') || findFieldValue(row, '_LaserPro_RateType');
    if (sourceRateType) {
      // Map text values to HMDA codes
      const rateTypeStr = String(sourceRateType).toLowerCase().trim();
      if (rateTypeStr === 'fixed' || rateTypeStr === '1') {
        output['RateType'] = '1';
      } else if (
        rateTypeStr === 'variable' ||
        rateTypeStr === '2' ||
        rateTypeStr === 'arm' ||
        rateTypeStr === 'adjustable'
      ) {
        output['RateType'] = '2';
      } else {
        output['RateType'] = deriveRateType(introRatePeriod);
      }
    } else {
      output['RateType'] = deriveRateType(introRatePeriod);
    }

    // Var_Term: convert IntroRatePeriod months to years (ceiling), blank for fixed rate
    // Only populate if RateType is Variable (2)
    if (output['RateType'] === '2') {
      output['Var_Term'] = deriveVarTerm(introRatePeriod);
    } else {
      output['Var_Term'] = '';
    }

    // Debug log for first row
    if (idx === 0) {
      console.log('=== RATE TYPE DERIVATION ===');
      console.log('IntroRatePeriod:', introRatePeriod);
      console.log('Source RateType:', sourceRateType);
      console.log('Derived RateType:', output['RateType']);
      console.log('Derived Var_Term:', output['Var_Term']);
    }

    // Convert dates
    ['ApplDate', 'ActionDate', 'Rate_Lock_Date'].forEach(field => {
      if (output[field]) {
        output[field] = excelDateToString(output[field]);
      }
    });

    if (idx === 0) {
      console.log('First transformed row (first 10 keys):', Object.keys(output).slice(0, 10));
      console.log('Total output columns:', Object.keys(output).length);
      logDebug('ETL:Transform', 'First row sample', {
        keys: Object.keys(output).slice(0, 15),
        values: Object.values(output).slice(0, 15),
      });
    }

    // Track missing critical fields
    if (!output['ULI'] && !output['LEI']) {
      warnings.push(`Row ${idx}: Missing ULI and LEI`);
    }
    if (
      !output['LoanAmountInDollars'] ||
      output['LoanAmountInDollars'] === '' ||
      output['LoanAmountInDollars'] === 0
    ) {
      warnings.push(`Row ${idx}: Missing or zero LoanAmountInDollars`);
    }

    return output;
  });

  const duration = Date.now() - startTime;
  trackETLStep(
    'TransformCRAWiz',
    data.length,
    result.length,
    duration,
    errors,
    warnings,
    result.length > 0
      ? {
          outputColumns: Object.keys(result[0]).length,
          expectedColumns: CRA_WIZ_128_COLUMNS.length,
          sampleRow: Object.fromEntries(Object.entries(result[0]).slice(0, 10)),
        }
      : undefined
  );

  if (warnings.length > 0) {
    logWarning('ETL:Transform', `Completed with ${warnings.length} warnings`, {
      warningsSample: warnings.slice(0, 5),
    });
  }

  console.log('=== TRANSFORM COMPLETE ===');
  console.log('Output rows:', result.length);
  console.log('Output columns per row:', result.length > 0 ? Object.keys(result[0]).length : 0);

  return result;
};

/**
 * Validate data rows
 */
export const validateData = (data: SbslRow[]): ValidationResult[] => {
  return data.map((row, idx) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const autoCorrected: Record<string, { from: any; to: any }> = {};

    // Required field validations (check both old and new column names for compatibility)
    if (!row.ULI && !row.LEI) {
      errors.push('Missing both ULI and LEI');
    }
    if (!row.LOANTYPE && !row.LoanType) {
      errors.push('Missing Loan Type');
    }
    if (!row.ACTION && !row.Action) {
      errors.push('Missing Action Taken');
    }

    // Warning-level validations
    if (!row.ADDRESS && !row.Address) {
      warnings.push('Missing Property Address');
    }
    const action = row.ACTION || row.Action;
    const income = row.INCOME || row.Income;
    if (!income && action === '1') {
      warnings.push('Missing Income for originated loan');
    }

    return {
      rowIdx: idx,
      applNumb: row.ApplNumb || row.ULI || `Row ${idx}`,
      isValid: errors.length === 0,
      errors,
      warnings,
      autoCorrected,
    };
  });
};

/**
 * Auto-correct common data issues
 */
export const autoCorrectData = (data: SbslRow[]): SbslRow[] => {
  return data.map(row => {
    const corrected = { ...row };

    // Standardize state abbreviations (check both old and new column names)
    const stateField = corrected.STATE_ABRV || corrected.State_abrv;
    if (stateField && String(stateField).length > 2) {
      const stateMap: Record<string, string> = {
        georgia: 'GA',
        florida: 'FL',
        alabama: 'AL',
        tennessee: 'TN',
        'south carolina': 'SC',
        'north carolina': 'NC',
      };
      const lower = String(stateField).toLowerCase();
      if (stateMap[lower]) {
        corrected.STATE_ABRV = stateMap[lower];
        corrected.State_abrv = stateMap[lower];
      }
    }

    // Clean up ZIP codes (check both old and new column names)
    const zipField = corrected.ZIP || corrected.Zip;
    if (zipField) {
      const cleanZip = String(zipField)
        .replace(/[^\d-]/g, '')
        .substring(0, 10);
      corrected.ZIP = cleanZip;
      corrected.Zip = cleanZip;
    }

    return corrected;
  });
};

/**
 * Transform Encompass data (alias for backward compatibility)
 */
export const transformEncompassData = (data: SbslRow[]): SbslRow[] => data;

/**
 * Clean and format data (alias for autoCorrectData)
 */
export const cleanAndFormatData = (data: SbslRow[]): SbslRow[] => autoCorrectData(data);
