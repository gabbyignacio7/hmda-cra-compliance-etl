// CRA Wiz Transform - HMDA/CRA Compliance ETL
// Post-CRA Wiz processing (Step 6) - Transform 243 columns to 125 columns

import { read, utils, writeFile } from 'xlsx';

// Embedded branch list (fictional sample institution)
export const BRANCH_LIST: Record<string, string> = {
  '101': 'Main Street',
  '103': 'Riverside',
  '104': 'Lakeview',
  '107': 'Northgate',
  '108': 'Oak Hill',
  '109': 'Cedar Park',
  '110': 'Harbor Point',
  '114': 'Mill Creek',
  '116': 'Pine Ridge',
  '125': 'Westfield',
  '127': 'Eastgate',
  '129': 'Brookside',
  '131': 'Fairview',
  '134': 'Highland',
  '136': 'Meadowbrook',
  '137': 'Stonebridge',
  '201': 'Willow Bend',
  '203': 'Summit',
  '204': 'Bayside',
  '205': 'Kingsway',
  '206': 'Granite Falls',
  '208': 'Silver Lake',
  '209': 'Elm Court',
  '210': 'Ashford',
  '212': 'Clearwater',
  '213': 'Maple Grove',
  '216': 'Redwood',
  '218': 'Sunset Plaza',
  '219': 'Crescent',
  '220': 'Foxhollow',
  '221': 'Ironwood',
  '223': 'Juniper',
  '226': 'Laurel',
  '401': 'Magnolia',
  '402': 'Northfield',
  '403': 'Orchard',
  '404': 'Parkside',
  '405': 'Quarry',
  '406': 'Rosewood',
  '407': 'Sandpiper',
  '408': 'Timberline',
  '409': 'Union Square',
  '410': 'Valley View',
  '412': 'Wexford',
  '413': 'Yorktown',
  '414': 'Zephyr',
  '415': 'Hillcrest',
  '416': 'Lighthouse',
};

// Loan Officer to Branch Mapping - Maps loan officer names to branch numbers
// This is used to derive branch when no branch column exists in source data
export const LOAN_OFFICER_BRANCH_MAP: Record<string, string> = {
  // Fictional loan officers for the sample institution
  'Avery Collins': '402',
  'Jordan Patel': '402',
  'Morgan Reyes': '408',
  'Morgan  Reyes': '408', // Handle extra space variant
  'Taylor Brooks': '404',
  'Casey Nguyen': '401',
  'Riley Okafor': '403',
  'Quinn Harper': '415',
};

/**
 * Get branch number from loan officer name
 */
export const getBranchFromLoanOfficer = (loanOfficer: string): string => {
  if (!loanOfficer) return '';

  // Direct lookup
  const branch = LOAN_OFFICER_BRANCH_MAP[loanOfficer];
  if (branch) return branch;

  // Try normalized lookup (trim spaces, lowercase compare)
  const normalized = loanOfficer.trim();
  for (const [name, branchNum] of Object.entries(LOAN_OFFICER_BRANCH_MAP)) {
    if (name.toLowerCase().trim() === normalized.toLowerCase()) {
      return branchNum;
    }
  }

  return '';
};

// Work Item 125-Column Format (Phase 3 / Step 6 Output)
export const OUTPUT_COLUMNS: string[] = [
  'BRANCHNAME', // From input OR VLOOKUP
  'BRANCHNUMB', // Branch number
  'LEI',
  'ULI',
  'LASTNAME',
  'FIRSTNAME',
  'CLASTNAME', // Co-applicant last name
  'CFIRSTNAME', // Co-applicant first name
  'LENDER',
  'AA_LOANPROCESSOR',
  'LDP_POSTCLOSER',
  'ErrorMadeBy', // NEW - blank column
  'APPLDATE',
  'LOANTYPE',
  'PURPOSE',
  'CONSTRUCTIONMETHOD',
  'OCCUPANCYTYPE',
  'LOANAMOUNTINDOLLARS',
  'PREAPPROVAL',
  'ACTION',
  'ACTIONDATE',
  'ADDRESS',
  'CITY',
  'STATE_ABRV',
  'ZIP',
  'COUNTY_5',
  'TRACT_11',
  'ETHNICITY_1',
  'ETHNICITY_2',
  'ETHNICITY_3',
  'ETHNICITY_4',
  'ETHNICITY_5',
  'ETHNICITYOTHER',
  'COA_ETHNICITY_1',
  'COA_ETHNICITY_2',
  'COA_ETHNICITY_3',
  'COA_ETHNICITY_4',
  'COA_ETHNICITY_5',
  'COA_ETHNICITYOTHER',
  'ETHNICITY_DETERMINANT',
  'COA_ETHNICITY_DETERMINANT',
  'RACE_1',
  'RACE_2',
  'RACE_3',
  'RACE_4',
  'RACE_5',
  'RACE1_OTHER',
  'RACE27_OTHER',
  'RACE44_OTHER',
  'COARACE_1',
  'COARACE_2',
  'COARACE_3',
  'COARACE_4',
  'COARACE_5',
  'COARACE1_OTHER',
  'COARACE27_OTHER',
  'COARACE44_OTHER',
  'RACE_DETERMINANT',
  'COARACE_DETERMINANT',
  'SEX',
  'COASEX',
  'SEX_DETERMINANT',
  'COASEX_DETERMINANT',
  'AGE',
  'COA_AGE', // 9999 if no co-applicant
  'INCOME',
  'PURCHASER',
  'RATE_SPREAD',
  'HOEPA_STATUS',
  'LIEN_STATUS',
  'CREDITSCORE',
  'COA_CREDITSCORE', // 9999 if no co-applicant
  'CREDITMODEL',
  'CREDITMODELOTHER',
  'COA_CREDITMODEL',
  'COA_CREDITMODELOTHER',
  'DENIAL1',
  'DENIAL2',
  'DENIAL3',
  'DENIAL4',
  'DENIALOTHER',
  'TOTALLOANCOSTS',
  'TOTALPTSANDFEES',
  'ORIGFEES',
  'DISCOUNTPTS',
  'LENDERCREDTS',
  'INTERESTRATE',
  'APR',
  'RATE_LOCK_DATE',
  'PPPTERM',
  'DTIRATIO',
  'DSC', // NEW - blank column
  'CLTV',
  'LOAN_TERM',
  'LOAN_TERM_MONTHS',
  'INTRORATEPERIOD',
  'BALLOONPMT',
  'IOPMT',
  'NEGAM',
  'NONAMORTZ',
  'PROPERTYVALUE',
  'MHSECPROPTYPE',
  'MHLANDPROPINT',
  'TOTALUNITS',
  'MFAHU',
  'APPMETHOD',
  'PAYABLEINST',
  'NMLSRID',
  'AUSYSTEM1',
  'AUSYSTEM2',
  'AUSYSTEM3',
  'AUSYSTEM4',
  'AUSYSTEM5',
  'AUSYSTEMOTHER',
  'AUSRESULT1',
  'AUSRESULT2',
  'AUSRESULT3',
  'AUSRESULT4',
  'AUSRESULT5',
  'AUSRESULTOTHER',
  'REVMTG',
  'OPENLOC',
  'BUSCML',
  'EditStatus', // Blank (manual entry)
  'EditCkComments', // Blank (manual entry)
  'Comments', // Blank (manual entry)
  'RATETYPE', // Derived from IntroRatePeriod (1=Fixed, 2=Variable)
  'VAR_TERM', // Derived from IntroRatePeriod (months to years with half-year rounding; <=6 mo -> 1)
];

export interface CRAWizRow {
  [key: string]: any;
}

// Date columns that need Excel serial number conversion
const DATE_COLUMNS = ['APPLDATE', 'ACTIONDATE', 'RATE_LOCK_DATE'];

/**
 * Convert Excel serial date to MM/DD/YYYY format
 */
export const excelDateToString = (value: any): string => {
  if (typeof value === 'string' && value.includes('/')) {
    return value;
  }

  const serial = Number(value);
  if (isNaN(serial) || serial < 1000 || serial > 100000) {
    return String(value || '');
  }

  const date = new Date((serial - 25569) * 86400 * 1000);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear());

  return `${month}/${day}/${year}`;
};

/**
 * Get branch name with priority: preserve existing, then VLOOKUP
 */
export const getBranchName = (branchNumber: string | number, existingName?: string): string => {
  if (existingName && String(existingName).trim() !== '') {
    return String(existingName).trim();
  }
  const normalized = String(branchNumber).trim();
  return BRANCH_LIST[normalized] || '';
};

export interface TransformResult {
  data: CRAWizRow[];
  inputColumns: number;
  outputColumns: number;
  rowCount: number;
  branchMatchCount: number;
  branchMissCount: number;
}

export const parseCRAWizFile = async (file: File): Promise<CRAWizRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = utils.sheet_to_json(sheet) as CRAWizRow[];
        console.log(
          `Parsed CRA Wiz file: ${jsonData.length} rows, ${Object.keys(jsonData[0] || {}).length} columns`
        );
        resolve(jsonData);
      } catch (error) {
        console.error('Error parsing CRA Wiz file:', error);
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Transform CRA Wiz 243-column export to Work Item format
 * Updated per Jonathan's feedback to include RateType and Var_Term columns
 */
export const transformToWorkItemFormat = (data: any[]): any[] => {
  return data.map(row => {
    const output: Record<string, any> = {};

    OUTPUT_COLUMNS.forEach(col => {
      if (col === 'BRANCHNAME') {
        output[col] = getBranchName(
          row.BRANCHNUMB || row.Branch || row.BranchNumb || '',
          row.BRANCHNAME || row.BranchName || ''
        );
      } else if (
        col === 'ErrorMadeBy' ||
        col === 'DSC' ||
        col === 'EditStatus' ||
        col === 'EditCkComments' ||
        col === 'Comments'
      ) {
        // Blank columns for manual entry
        output[col] = '';
      } else if (col === 'COUNTY_5' || col === 'TRACT_11') {
        // Per Jonathan's feedback: Leave blank, CRAWiz will geocode
        output[col] = '';
      } else if (col === 'RATETYPE') {
        // Derive from INTRORATEPERIOD: N/A or blank = Fixed (1), number = Variable (2)
        const introRate = row.INTRORATEPERIOD ?? row.IntroRatePeriod ?? '';
        if (
          introRate === '' ||
          introRate === null ||
          introRate === 'NA' ||
          introRate === 'N/A' ||
          introRate === 'Exempt' ||
          introRate === '1111'
        ) {
          output[col] = '1'; // Fixed
        } else {
          const numVal = Number(introRate);
          output[col] = !isNaN(numVal) && numVal > 0 ? '2' : '1'; // Variable if positive number
        }
      } else if (col === 'VAR_TERM') {
        // Derive from INTRORATEPERIOD: months -> years with half-year rounding.
        // <=6 mo rounds UP to 1; otherwise remainder >6 rounds up, <=6 rounds down.
        const introRate = row.INTRORATEPERIOD ?? row.IntroRatePeriod ?? '';
        if (
          introRate === '' ||
          introRate === null ||
          introRate === 'NA' ||
          introRate === 'N/A' ||
          introRate === 'Exempt' ||
          introRate === '1111'
        ) {
          output[col] = ''; // Fixed rate loans have no Var_Term
        } else {
          const numVal = Number(introRate);
          if (!isNaN(numVal) && numVal > 0) {
            if (numVal <= 6) {
              output[col] = '1';
            } else {
              const years = Math.floor(numVal / 12);
              const remainder = numVal % 12;
              output[col] = String(remainder > 6 ? years + 1 : years);
            }
          } else {
            output[col] = '';
          }
        }
      } else if (col === 'LOAN_TERM') {
        // Loan_Term = months to years with half-year rounding (>6 mo rounds up, <=6 rounds down)
        const months =
          row.LOAN_TERM_MONTHS ?? row.Loan_Term_Months ?? row.LOAN_TERM ?? row.Loan_Term ?? '';
        const numMonths = Number(months);
        if (!isNaN(numMonths) && numMonths > 0) {
          const years = Math.floor(numMonths / 12);
          const remainder = numMonths % 12;
          output[col] = String(remainder > 6 ? years + 1 : years);
        } else {
          output[col] = '';
        }
      } else if (col === 'LOAN_TERM_MONTHS') {
        // Loan_Term_Months gets the raw months value
        const months =
          row.LOAN_TERM_MONTHS ?? row.Loan_Term_Months ?? row.LOAN_TERM ?? row.Loan_Term ?? '';
        const numMonths = Number(months);
        // If value is small (likely years), convert to months
        if (!isNaN(numMonths) && numMonths > 0) {
          output[col] = numMonths <= 50 ? String(Math.round(numMonths * 12)) : String(numMonths);
        } else {
          output[col] = '';
        }
      } else if (DATE_COLUMNS.includes(col)) {
        const rawValue = row[col] || row[col.toLowerCase()] || '';
        output[col] = excelDateToString(rawValue);
      } else if (col === 'COA_AGE' || col === 'COA_CREDITSCORE') {
        // Use ?? to preserve valid zero values, only default to 9999 if truly missing
        const value = row[col] ?? row[col.toLowerCase()] ?? '';
        output[col] = value !== '' && value !== null && value !== undefined ? value : '9999';
      } else {
        // IMPORTANT: Use ?? to preserve zeros (0, "0") - || would drop them
        const val = row[col] ?? row[col.toLowerCase()] ?? row[col.replace(/_/g, '')];
        output[col] = val !== undefined && val !== null ? val : '';
      }
    });

    return output;
  });
};

export const transformCRAWizExport = (
  inputData: CRAWizRow[],
  customBranchList?: Record<string, string>
): TransformResult => {
  const branchLookup = customBranchList || BRANCH_LIST;
  let branchMatchCount = 0;
  let branchMissCount = 0;

  const transformedData = inputData.map(row => {
    const inputBranchName = row.BRANCHNAME ? String(row.BRANCHNAME).trim() : '';
    const branchNum = String(row.BRANCHNUMB || '').trim();
    const lookupBranchName = branchLookup[branchNum] || '';

    const branchName = inputBranchName || lookupBranchName;

    if (branchName) {
      branchMatchCount++;
    } else {
      branchMissCount++;
    }

    const outputRow: CRAWizRow = {};

    OUTPUT_COLUMNS.forEach(col => {
      if (col === 'BRANCHNAME') {
        outputRow[col] = branchName;
      } else if (
        col === 'ErrorMadeBy' ||
        col === 'DSC' ||
        col === 'EditStatus' ||
        col === 'EditCkComments' ||
        col === 'Comments'
      ) {
        // Blank columns for manual entry
        outputRow[col] = '';
      } else if (col === 'COUNTY_5' || col === 'TRACT_11') {
        // Per Jonathan's feedback: Leave blank, CRAWiz will geocode
        outputRow[col] = '';
      } else if (col === 'RATETYPE') {
        // Derive from INTRORATEPERIOD: N/A or blank = Fixed (1), number = Variable (2)
        const introRate = row.INTRORATEPERIOD ?? row.IntroRatePeriod ?? row.PPPTERM ?? '';
        if (
          introRate === '' ||
          introRate === null ||
          introRate === 'NA' ||
          introRate === 'N/A' ||
          introRate === 'Exempt' ||
          introRate === '1111'
        ) {
          outputRow[col] = '1'; // Fixed
        } else {
          const numVal = Number(introRate);
          outputRow[col] = !isNaN(numVal) && numVal > 0 ? '2' : '1';
        }
      } else if (col === 'VAR_TERM') {
        // Derive from INTRORATEPERIOD: months -> years with half-year rounding.
        // <=6 mo rounds UP to 1; otherwise remainder >6 rounds up, <=6 rounds down.
        const introRate = row.INTRORATEPERIOD ?? row.IntroRatePeriod ?? '';
        if (
          introRate === '' ||
          introRate === null ||
          introRate === 'NA' ||
          introRate === 'N/A' ||
          introRate === 'Exempt' ||
          introRate === '1111'
        ) {
          outputRow[col] = '';
        } else {
          const numVal = Number(introRate);
          if (!isNaN(numVal) && numVal > 0) {
            if (numVal <= 6) {
              outputRow[col] = '1';
            } else {
              const years = Math.floor(numVal / 12);
              const remainder = numVal % 12;
              outputRow[col] = String(remainder > 6 ? years + 1 : years);
            }
          } else {
            outputRow[col] = '';
          }
        }
      } else if (col === 'LOAN_TERM') {
        // Loan_Term = months to years with half-year rounding (>6 mo rounds up, <=6 rounds down)
        const months = row.LOAN_TERM_MONTHS ?? row.Loan_Term_Months ?? row.LOAN_TERM ?? '';
        const numMonths = Number(months);
        if (!isNaN(numMonths) && numMonths > 0) {
          const years = Math.floor(numMonths / 12);
          const remainder = numMonths % 12;
          outputRow[col] = String(remainder > 6 ? years + 1 : years);
        } else {
          outputRow[col] = '';
        }
      } else if (col === 'LOAN_TERM_MONTHS') {
        // Loan_Term_Months gets the raw months value
        const months = row.LOAN_TERM_MONTHS ?? row.Loan_Term_Months ?? row.LOAN_TERM ?? '';
        const numMonths = Number(months);
        if (!isNaN(numMonths) && numMonths > 0) {
          outputRow[col] = numMonths <= 50 ? String(Math.round(numMonths * 12)) : String(numMonths);
        } else {
          outputRow[col] = '';
        }
      } else if (DATE_COLUMNS.includes(col)) {
        outputRow[col] = excelDateToString(row[col]);
      } else if (col === 'COA_AGE' || col === 'COA_CREDITSCORE') {
        // Use ?? to preserve valid zero values, only default to 9999 if truly missing
        const value = row[col] ?? '';
        outputRow[col] = value !== '' && value !== null && value !== undefined ? value : '9999';
      } else {
        outputRow[col] = row[col] !== undefined ? row[col] : '';
      }
    });

    return outputRow;
  });

  return {
    data: transformedData,
    inputColumns: Object.keys(inputData[0] || {}).length,
    outputColumns: OUTPUT_COLUMNS.length,
    rowCount: transformedData.length,
    branchMatchCount,
    branchMissCount,
  };
};

/**
 * Export Work Item file (Phase 3 / Step 6)
 */
export const exportWorkItemFile = (data: CRAWizRow[], filename?: string) => {
  const transformedData = transformToWorkItemFormat(data);

  const ws = utils.json_to_sheet(transformedData, {
    header: OUTPUT_COLUMNS,
  });

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Work Items');

  const now = new Date();
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const defaultFilename = `HMDA_WorkItem_${monthNames[now.getMonth()]}_${now.getFullYear()}.csv`;

  writeFile(wb, filename || defaultFilename, { bookType: 'csv' });
};

export const exportTransformSummary = (result: TransformResult) => {
  const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const filename = `HMDA_Transform_Summary_${monthYear.replace(' ', '_')}.xlsx`;

  const summaryData = [
    {
      'Transformation Date': new Date().toLocaleString(),
      'Input Columns': result.inputColumns,
      'Output Columns': result.outputColumns,
      'Total Rows': result.rowCount,
      'Branch Matches': result.branchMatchCount,
      'Branch Misses': result.branchMissCount,
      'New Columns Added': 'ErrorMadeBy, DSC',
      'Columns Removed': result.inputColumns - result.outputColumns + 2,
    },
  ];

  const ws = utils.json_to_sheet(summaryData);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Summary');

  const branchData = Object.entries(BRANCH_LIST).map(([num, name]) => ({
    'Branch Number': num,
    'Branch Name': name,
  }));
  const branchWs = utils.json_to_sheet(branchData);
  utils.book_append_sheet(wb, branchWs, 'Branch Reference');

  writeFile(wb, filename);
};

/**
 * Process CRA Wiz export file for Step 6 transformation
 */
export const processCRAWizExport = async (
  file: File
): Promise<{
  inputColumns: number;
  outputColumns: number;
  rowCount: number;
  branchMatches: number;
  dateConversions: number;
  data: any[];
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = utils.sheet_to_json(worksheet) as CRAWizRow[];

        const result = transformCRAWizExport(jsonData);

        resolve({
          inputColumns: result.inputColumns,
          outputColumns: result.outputColumns,
          rowCount: result.rowCount,
          branchMatches: result.branchMatchCount,
          dateConversions: result.rowCount * DATE_COLUMNS.length,
          data: result.data,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};
