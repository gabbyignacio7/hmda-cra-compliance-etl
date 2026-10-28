/**
 * ETL Merge Functions - Data merging and deduplication
 */

import type { SbslRow, DeduplicationResult } from './types';
import { logInfo, logWarning, trackETLStep } from '../error-tracker';

/**
 * Detect and remove duplicate records between multiple data sources
 * Uses ULI as primary key, falls back to Address+City
 * Returns deduplicated data with source preference (Encompass > LaserPro)
 */
export const deduplicateData = (data: SbslRow[]): DeduplicationResult => {
  const seenByULI = new Map<string, { row: SbslRow; index: number }>();
  const seenByAddress = new Map<string, { row: SbslRow; index: number }>();
  const duplicateKeys: string[] = [];
  let duplicatesRemoved = 0;

  const deduplicated: SbslRow[] = [];

  data.forEach((row, index) => {
    const uli = String(row.ULI || row['Universal Loan Identifier'] || '')
      .trim()
      .toUpperCase();
    const address = String(row.Address || row['Street Address'] || '')
      .trim()
      .toLowerCase();
    const city = String(row.City || row['Property City'] || '')
      .trim()
      .toLowerCase();
    const addressKey = address && city ? `${address}|${city}` : '';
    const source = row._source || 'Encompass';

    // Check for duplicate by ULI
    if (uli && seenByULI.has(uli)) {
      const existing = seenByULI.get(uli)!;
      const existingSource = existing.row._source || 'Encompass';

      // Prefer Encompass over LaserPro
      if (source === 'Encompass' && existingSource === 'LaserPro') {
        const existingIndex = deduplicated.indexOf(existing.row);
        if (existingIndex !== -1) {
          deduplicated[existingIndex] = row;
          seenByULI.set(uli, { row, index });
        }
        duplicateKeys.push(`ULI:${uli} (LaserPro replaced by Encompass)`);
      } else {
        duplicateKeys.push(`ULI:${uli} (kept ${existingSource}, skipped ${source})`);
      }
      duplicatesRemoved++;
      return;
    }

    // Check for duplicate by Address+City
    if (addressKey && seenByAddress.has(addressKey)) {
      const existing = seenByAddress.get(addressKey)!;
      const existingSource = existing.row._source || 'Encompass';

      if (source === 'Encompass' && existingSource === 'LaserPro') {
        const existingIndex = deduplicated.indexOf(existing.row);
        if (existingIndex !== -1) {
          deduplicated[existingIndex] = row;
          seenByAddress.set(addressKey, { row, index });
          if (uli) seenByULI.set(uli, { row, index });
        }
        duplicateKeys.push(`Address:${addressKey} (LaserPro replaced by Encompass)`);
      } else {
        duplicateKeys.push(`Address:${addressKey} (kept ${existingSource}, skipped ${source})`);
      }
      duplicatesRemoved++;
      return;
    }

    // Not a duplicate, add to deduplicated list
    deduplicated.push(row);
    if (uli) seenByULI.set(uli, { row, index });
    if (addressKey) seenByAddress.set(addressKey, { row, index });
  });

  if (duplicatesRemoved > 0) {
    logInfo('ETL:Dedupe', `Removed ${duplicatesRemoved} duplicate records`, {
      originalCount: data.length,
      deduplicatedCount: deduplicated.length,
      sampleDuplicates: duplicateKeys.slice(0, 5),
    });
  }

  return { deduplicated, duplicatesRemoved, duplicateKeys };
};

/**
 * Merge supplemental data (Additional Fields file)
 */
export const mergeSupplementalData = (
  primaryData: SbslRow[],
  supplementalData: SbslRow[]
): SbslRow[] => {
  const startTime = Date.now();

  if (!supplementalData || supplementalData.length === 0) {
    console.log('No supplemental data to merge');
    logWarning('ETL:Merge', 'No supplemental data provided for merge');
    return primaryData;
  }

  logInfo('ETL:Merge', 'Starting supplemental data merge', {
    primaryRows: primaryData.length,
    supplementalRows: supplementalData.length,
  });

  console.log('=== MERGING SUPPLEMENTAL DATA ===');
  console.log('Primary data rows:', primaryData.length);
  console.log('Supplemental data rows:', supplementalData.length);

  if (supplementalData.length > 0) {
    console.log('Supplemental first row keys:', Object.keys(supplementalData[0]).slice(0, 15));
  }

  // Create lookup maps for supplemental data
  const suppByULI = new Map<string, SbslRow>();
  const suppByLoanNum = new Map<string, SbslRow>();
  const suppByAddress = new Map<string, SbslRow>();

  supplementalData.forEach((row, idx) => {
    const uli = String(
      row['ULI'] || row['Universal Loan Identifier'] || row['Universal Loan Identifier (ULI)'] || ''
    ).trim();

    const loanNum = String(
      row['ApplNumb'] ||
        row['Loan Number'] ||
        row['LoanNumber'] ||
        row['Loan ID'] ||
        row['Application Number'] ||
        ''
    ).trim();

    const address = String(
      row['Address'] ||
        row['Property Address'] ||
        row['Street Address'] ||
        row['Property Street'] ||
        row['Subject Property Address'] ||
        ''
    )
      .toLowerCase()
      .trim();

    const city = String(row['City'] || row['Property City'] || row['Subject Property City'] || '')
      .toLowerCase()
      .trim();

    if (uli) suppByULI.set(uli, row);
    if (loanNum) suppByLoanNum.set(loanNum, row);
    if (address && city) suppByAddress.set(`${address}|${city}`, row);

    if (idx === 0) {
      console.log(
        'First supplemental row - ULI:',
        uli,
        'LoanNum:',
        loanNum,
        'Address:',
        address,
        'City:',
        city
      );
    }
  });

  console.log(
    'Lookup maps - ULI:',
    suppByULI.size,
    'LoanNum:',
    suppByLoanNum.size,
    'Address:',
    suppByAddress.size
  );

  let matchCount = 0;
  const result = primaryData.map((row, idx) => {
    const uli = String(
      row['ULI'] || row['Universal Loan Identifier'] || row['Universal Loan Identifier (ULI)'] || ''
    ).trim();

    const loanNum = String(
      row['ApplNumb'] || row['Loan Number'] || row['LoanNumber'] || row['Loan ID'] || ''
    ).trim();

    const address = String(
      row['Address'] ||
        row['Property Address'] ||
        row['Street Address'] ||
        row['Subject Property Address'] ||
        ''
    )
      .toLowerCase()
      .trim();

    const city = String(row['City'] || row['Property City'] || row['Subject Property City'] || '')
      .toLowerCase()
      .trim();

    // Try to find matching supplemental data
    const supp =
      suppByULI.get(uli) || suppByLoanNum.get(loanNum) || suppByAddress.get(`${address}|${city}`);

    if (idx === 0) {
      console.log('First primary row - ULI:', uli, 'LoanNum:', loanNum, 'Address:', address);
      console.log('Match found:', !!supp);
    }

    if (supp) {
      matchCount++;
      // Helper to get trimmed value (handles space-only strings as empty)
      const getTrimmed = (val: any): string => {
        return String(val ?? '').trim();
      };

      // Get values from supplemental with all possible field name variations
      // Using new column names (uppercase format)
      const firstName = getTrimmed(
        supp['FIRSTNAME'] || supp['FirstName'] || supp['First Name'] || supp['Borrower First Name']
      );
      const lastName = getTrimmed(
        supp['LASTNAME'] || supp['LastName'] || supp['Last Name'] || supp['Borrower Last Name']
      );
      const coaFirstName = getTrimmed(
        supp['CFIRSTNAME'] ||
          supp['Coa_FirstName'] ||
          supp['Co-Borrower First Name'] ||
          supp['Co-Applicant First Name']
      );
      const coaLastName = getTrimmed(
        supp['CLASTNAME'] ||
          supp['Coa_LastName'] ||
          supp['Co-Borrower Last Name'] ||
          supp['Co-Applicant Last Name']
      );
      const lender = getTrimmed(
        supp['LENDER'] || supp['Lender'] || supp['Loan Officer'] || supp['Originator']
      );
      const processor = getTrimmed(
        supp['AA_LOANPROCESSOR'] ||
          supp['AA_Processor'] ||
          supp['Processor'] ||
          supp['Loan Processor']
      );
      const postCloser = getTrimmed(
        supp['LDP_POSTCLOSER'] ||
          supp['LDP_PostCloser'] ||
          supp['Post Closer'] ||
          supp['Loan Team Member Name - Post Closer']
      );
      const apr = getTrimmed(supp['APR'] || supp['Annual Percentage Rate']);
      const rateLockDate = getTrimmed(
        supp['RATE_LOCK_DATE'] ||
          supp['Rate_Lock_Date'] ||
          supp['Rate Lock Date'] ||
          supp['Lock Date']
      );
      // Branch information - comprehensive field lookups
      const branchNum = getTrimmed(
        supp['Branch'] ||
          supp['BranchNumber'] ||
          supp['Branch Number'] ||
          supp['Branch #'] ||
          supp['BranchNum'] ||
          supp['Branch Num'] ||
          supp['Branch Code'] ||
          supp['BRANCHNUMB'] ||
          supp['Originating Branch Number'] ||
          supp['OriginatingBranchNumber'] ||
          supp['Branch ID'] ||
          supp['BranchID'] ||
          supp['Location Code'] ||
          supp['LocationCode'] ||
          supp['Office Number'] ||
          supp['OfficeNumber'] ||
          supp['Office #'] ||
          supp['Loan Team Member Branch Number'] ||
          supp['Loan Team Member Branch #'] ||
          supp['FileStarterCostCenterID'] ||
          supp['Cost Center ID'] ||
          supp['CostCenterID'] ||
          supp['Cost Center'] ||
          supp['CostCenter']
      );
      const branchName = getTrimmed(
        supp['Branch_Name'] ||
          supp['BranchName'] ||
          supp['Branch Name'] ||
          supp['BRANCHNAME'] ||
          supp['Originating Branch'] ||
          supp['OriginatingBranch'] ||
          supp['Originating Branch Name'] ||
          supp['Branch Description'] ||
          supp['BranchDescription'] ||
          supp['Location Name'] ||
          supp['LocationName'] ||
          supp['Office Name'] ||
          supp['OfficeName'] ||
          supp['Branch Office'] ||
          supp['BranchOffice'] ||
          supp['Loan Team Member Branch Name'] ||
          supp['Loan Team Member Name - Branch']
      );

      // Co-applicant demographics
      const coaAge = getTrimmed(
        supp['COA_AGE'] ||
          supp['Coa_Age'] ||
          supp['Co-Applicant Age'] ||
          supp['Age of Co-Applicant or Co-Borrower'] ||
          supp['Co-Borrower Age']
      );
      const coaCreditScore = getTrimmed(
        supp['COA_CREDITSCORE'] ||
          supp['Coa_CreditScore'] ||
          supp['Co-Applicant Credit Score'] ||
          supp['Credit Score of Co-Applicant or Co-Borrower'] ||
          supp['Co-Borrower Credit Score']
      );
      const coaSex = getTrimmed(
        supp['COASEX'] ||
          supp['CoaSex'] ||
          supp['Co-Applicant Sex'] ||
          supp['Sex of Co-Applicant or Co-Borrower']
      );
      const coaCreditModel = getTrimmed(
        supp['COA_CREDITMODEL'] ||
          supp['Coa_CreditModel'] ||
          supp['Co-Applicant Credit Scoring Model'] ||
          supp['Credit Score Type of Co-Applicant or Co-Borrower']
      );

      // Co-applicant ethnicity
      const coaEthnicity1 = getTrimmed(
        supp['COA_ETHNICITY_1'] ||
          supp['Coa_Ethnicity_1'] ||
          supp['Co-Applicant Ethnicity 1'] ||
          supp['Ethnicity of Co-Applicant or Co-Borrower: 1']
      );
      const coaEthnicity2 = getTrimmed(
        supp['COA_ETHNICITY_2'] ||
          supp['Coa_Ethnicity_2'] ||
          supp['Co-Applicant Ethnicity 2'] ||
          supp['Ethnicity of Co-Applicant or Co-Borrower: 2']
      );
      const coaEthnicity3 = getTrimmed(
        supp['COA_ETHNICITY_3'] ||
          supp['Coa_Ethnicity_3'] ||
          supp['Co-Applicant Ethnicity 3'] ||
          supp['Ethnicity of Co-Applicant or Co-Borrower: 3']
      );
      const coaEthnicity4 = getTrimmed(
        supp['COA_ETHNICITY_4'] ||
          supp['Coa_Ethnicity_4'] ||
          supp['Co-Applicant Ethnicity 4'] ||
          supp['Ethnicity of Co-Applicant or Co-Borrower: 4']
      );
      const coaEthnicity5 = getTrimmed(
        supp['COA_ETHNICITY_5'] ||
          supp['Coa_Ethnicity_5'] ||
          supp['Co-Applicant Ethnicity 5'] ||
          supp['Ethnicity of Co-Applicant or Co-Borrower: 5']
      );

      // Co-applicant race
      const coaRace1 = getTrimmed(
        supp['COARACE_1'] ||
          supp['CoaRace_1'] ||
          supp['Co-Applicant Race 1'] ||
          supp['Race of Co-Applicant or Co-Borrower: 1']
      );
      const coaRace2 = getTrimmed(
        supp['COARACE_2'] ||
          supp['CoaRace_2'] ||
          supp['Co-Applicant Race 2'] ||
          supp['Race of Co-Applicant or Co-Borrower: 2']
      );
      const coaRace3 = getTrimmed(
        supp['COARACE_3'] ||
          supp['CoaRace_3'] ||
          supp['Co-Applicant Race 3'] ||
          supp['Race of Co-Applicant or Co-Borrower: 3']
      );
      const coaRace4 = getTrimmed(
        supp['COARACE_4'] ||
          supp['CoaRace_4'] ||
          supp['Co-Applicant Race 4'] ||
          supp['Race of Co-Applicant or Co-Borrower: 4']
      );
      const coaRace5 = getTrimmed(
        supp['COARACE_5'] ||
          supp['CoaRace_5'] ||
          supp['Co-Applicant Race 5'] ||
          supp['Race of Co-Applicant or Co-Borrower: 5']
      );

      // Address fields from supplemental
      const suppAddress = getTrimmed(
        supp['ADDRESS'] ||
          supp['Address'] ||
          supp['Subject Property Address'] ||
          supp['Street Address']
      );
      const suppCity = getTrimmed(supp['CITY'] || supp['City'] || supp['Subject Property City']);
      const suppState = getTrimmed(
        supp['STATE_ABRV'] || supp['State_abrv'] || supp['Subject Property State']
      );

      // Update only specific fields from supplemental data - don't spread original row
      // This prevents extra columns from being added
      // Use the correct output column names (mixed case format)
      row['FirstName'] = firstName || row['FirstName'];
      row['LastName'] = lastName || row['LastName'];
      row['Coa_FirstName'] = coaFirstName || row['Coa_FirstName'];
      row['Coa_LastName'] = coaLastName || row['Coa_LastName'];
      row['Coa_Age'] = coaAge || row['Coa_Age'];
      row['Coa_CreditScore'] = coaCreditScore || row['Coa_CreditScore'];
      row['CoaSex'] = coaSex || row['CoaSex'];
      row['Coa_CreditModel'] = coaCreditModel || row['Coa_CreditModel'];
      row['Coa_Ethnicity_1'] = coaEthnicity1 || row['Coa_Ethnicity_1'];
      row['Coa_Ethnicity_2'] = coaEthnicity2 || row['Coa_Ethnicity_2'];
      row['Coa_Ethnicity_3'] = coaEthnicity3 || row['Coa_Ethnicity_3'];
      row['Coa_Ethnicity_4'] = coaEthnicity4 || row['Coa_Ethnicity_4'];
      row['Coa_Ethnicity_5'] = coaEthnicity5 || row['Coa_Ethnicity_5'];
      row['CoaRace_1'] = coaRace1 || row['CoaRace_1'];
      row['CoaRace_2'] = coaRace2 || row['CoaRace_2'];
      row['CoaRace_3'] = coaRace3 || row['CoaRace_3'];
      row['CoaRace_4'] = coaRace4 || row['CoaRace_4'];
      row['CoaRace_5'] = coaRace5 || row['CoaRace_5'];
      row['Lender'] = lender || row['Lender'];
      row['AA_Processor'] = processor || row['AA_Processor'];
      row['LDP_PostCloser'] = postCloser || row['LDP_PostCloser'];
      row['APR'] = apr || row['APR'];
      row['Rate_Lock_Date'] = rateLockDate || row['Rate_Lock_Date'];
      row['Branch'] = branchNum || row['Branch'];
      row['Branch_Name'] = branchName || row['Branch_Name'];
      row['Address'] = row['Address'] || suppAddress;
      row['City'] = row['City'] || suppCity;
      row['State_abrv'] = row['State_abrv'] || suppState;
      row['_merged'] = true;

      return row;
    }

    return row;
  });

  console.log('Merge complete - matched', matchCount, 'of', primaryData.length, 'rows');

  const duration = Date.now() - startTime;
  const mergeWarnings: string[] = [];
  if (matchCount === 0) {
    mergeWarnings.push('No records matched - check if files have matching addresses');
  } else if (matchCount < primaryData.length * 0.5) {
    mergeWarnings.push(`Low match rate: only ${matchCount}/${primaryData.length} records matched`);
  }

  trackETLStep(
    'MergeSupplemental',
    primaryData.length,
    result.length,
    duration,
    [],
    mergeWarnings,
    {
      matchCount,
      matchRate: `${((matchCount / primaryData.length) * 100).toFixed(1)}%`,
      lookupMaps: {
        byULI: suppByULI.size,
        byLoanNum: suppByLoanNum.size,
        byAddress: suppByAddress.size,
      },
    }
  );

  return result;
};
