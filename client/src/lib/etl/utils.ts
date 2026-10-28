/**
 * ETL Utility Functions - Helper functions for data transformation and mapping
 */

import type { SbslRow } from './types';
import { FIELD_VARIATIONS } from './field-maps';

/**
 * Convert Excel serial date to MM/DD/YYYY format
 */
export const excelDateToString = (value: any): string => {
  if (!value) return '';

  // Already a date string
  if (typeof value === 'string' && (value.includes('/') || value.includes('-'))) {
    return value;
  }

  // YYYYMMDD format (like 20251006)
  const strValue = String(value);
  if (/^\d{8}$/.test(strValue)) {
    const year = strValue.substring(0, 4);
    const month = String(parseInt(strValue.substring(4, 6))).padStart(2, '0');
    const day = String(parseInt(strValue.substring(6, 8))).padStart(2, '0');
    return `${month}/${day}/${year}`;
  }

  // Excel serial number
  const serial = Number(value);
  if (isNaN(serial) || serial < 1000 || serial > 100000) {
    return String(value ?? '');
  }

  const date = new Date((serial - 25569) * 86400 * 1000);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear());

  return `${month}/${day}/${year}`;
};

/**
 * Find field value from various possible field names - COMPREHENSIVE version
 */
export const findFieldValue = (row: Record<string, any>, targetField: string): any => {
  // Direct match first
  if (row[targetField] !== undefined) return row[targetField];

  // Check variations from the map
  const variations = FIELD_VARIATIONS[targetField];
  if (variations) {
    for (const name of variations) {
      if (row[name] !== undefined) return row[name];
      // Try case-insensitive
      const lowerName = name.toLowerCase();
      const matchingKey = Object.keys(row).find(k => k.toLowerCase() === lowerName);
      if (matchingKey && row[matchingKey] !== undefined) return row[matchingKey];
    }
  }

  // Try direct case-insensitive match
  const targetLower = targetField.toLowerCase();
  const directMatch = Object.keys(row).find(k => k.toLowerCase() === targetLower);
  if (directMatch && row[directMatch] !== undefined) return row[directMatch];

  return null;
};

/**
 * Parse "Borrower Name" field (like "McKettrick III, Robert L") into FirstName and LastName
 */
export const parseBorrowerName = (fullName: string): { firstName: string; lastName: string } => {
  if (!fullName) return { firstName: '', lastName: '' };

  const parts = fullName.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    // Format: "LastName, FirstName MiddleName" or "LastName Suffix, FirstName"
    return {
      lastName: parts[0],
      firstName: parts[1].split(' ')[0], // Take first word after comma as first name
    };
  }

  // Fallback: split on space
  const spaceParts = fullName.trim().split(' ');
  if (spaceParts.length >= 2) {
    return {
      firstName: spaceParts[0],
      lastName: spaceParts.slice(1).join(' '),
    };
  }

  return { firstName: fullName, lastName: '' };
};

/**
 * Map AUS Result text/values to HMDA numeric codes (1-17)
 * HMDA Spec codes: 1=Approve/Eligible through 17=Exempt
 */
export const mapAUSResult = (value: string | number | null | undefined): string => {
  // If no value, return empty string - do NOT default to '17'
  if (value === null || value === undefined || value === '') {
    return '';
  }

  // Handle placeholder values
  if (value === '1111' || value === 1111) {
    return '';
  }

  const val = String(value).trim().toLowerCase();

  // If already a valid numeric code (1-17), return it as-is
  if (/^[1-9]$|^1[0-7]$/.test(val)) return val;

  // Map text values to HMDA codes
  const ausResultMap: Record<string, string> = {
    'approve/eligible': '1',
    'approve eligible': '1',
    'approved/eligible': '1',
    'approved eligible': '1',
    'approve/ineligible': '2',
    'approved/ineligible': '2',
    'refer/eligible': '3',
    'refer eligible': '3',
    'refer/ineligible': '4',
    'refer ineligible': '4',
    'refer with caution': '5',
    'out of scope': '6',
    error: '7',
    accept: '8',
    caution: '9',
    ineligible: '10',
    incomplete: '11',
    invalid: '12',
    'not applicable': '16',
    'n/a': '16',
    na: '16',
    'unable to determine': '14',
    other: '15',
    exempt: '17',
  };

  return ausResultMap[val] || String(value).trim();
};

/**
 * Map AUS System text/values to HMDA numeric codes (1-6)
 * HMDA Spec codes: 1=DU, 2=LP, 3=TOTAL, 4=GUS, 5=Other, 6=Not Applicable
 */
export const mapAUSystem = (value: string | number | null | undefined): string => {
  // If no value, return empty string - do NOT default to '6'
  if (value === null || value === undefined || value === '') {
    return '';
  }

  // Handle placeholder values
  if (value === '1111' || value === 1111) {
    return '';
  }

  const val = String(value).trim().toLowerCase();

  // If already a valid numeric code (1-6), return it as-is
  if (/^[1-6]$/.test(val)) return val;

  // Map text values to HMDA codes
  const ausSystemMap: Record<string, string> = {
    'desktop underwriter': '1',
    du: '1',
    'fannie mae': '1',
    fnma: '1',
    'loan prospector': '2',
    lp: '2',
    'loan product advisor': '2',
    lpa: '2',
    'freddie mac': '2',
    fhlmc: '2',
    total: '3',
    'total scorecard': '3',
    'fha total': '3',
    'fha total mortgage scorecard': '3',
    gus: '4',
    'guaranteed underwriting system': '4',
    usda: '4',
    'rural development': '4',
    other: '5',
    'not applicable': '6',
    'n/a': '6',
    na: '6',
    none: '6',
    exempt: '6',
  };

  return ausSystemMap[val] || String(value).trim();
};

/**
 * Map Non-Amortizing Features text/values to HMDA codes
 * HMDA Spec codes: 1=Balloon, 2=Interest-Only, 3=Negative Amortization, 1111=None/N/A
 */
export const mapNonAmortz = (
  value: string | number | null | undefined,
  balloonPmt?: any,
  ioPmt?: any,
  negAm?: any
): string => {
  // Check individual feature flags first
  if (balloonPmt === '1' || balloonPmt === 1 || String(balloonPmt).toLowerCase() === 'yes') {
    return '1'; // Balloon Payment
  }
  if (ioPmt === '1' || ioPmt === 1 || String(ioPmt).toLowerCase() === 'yes') {
    return '2'; // Interest-Only Payments
  }
  if (negAm === '1' || negAm === 1 || String(negAm).toLowerCase() === 'yes') {
    return '3'; // Negative Amortization
  }

  if (value === null || value === undefined || value === '' || value === '1111' || value === 1111) {
    return '2'; // Per client feedback: 1111s should be 2 (Interest-Only)
  }

  const val = String(value).trim().toLowerCase();

  // If already a valid code (1, 2, 3, or 1111), return it
  if (/^[123]$/.test(val)) return val;
  if (val === '1111') return '2';

  // Map text values
  const nonAmortzMap: Record<string, string> = {
    balloon: '1',
    'balloon payment': '1',
    'interest only': '2',
    'interest-only': '2',
    io: '2',
    'negative amortization': '3',
    'neg am': '3',
    'negative am': '3',
    none: '1111',
    no: '1111',
    'n/a': '1111',
    na: '1111',
    'not applicable': '1111',
  };

  return nonAmortzMap[val] || '2';
};

/**
 * Convert Loan Term to years with half-year rounding
 * Per compliance team review:
 *   - remainder > 6 months → round UP   (35 mo → 3 yr, 59 mo → 5 yr)
 *   - remainder <= 6 months → round DOWN (30 mo → 2 yr, 18 mo → 1 yr)
 * Input: months (e.g., 360, 180, 35)
 * Output: years as string (e.g., '30', '15', '3')
 */
export const convertLoanTermToYears = (months: any): string => {
  if (months === null || months === undefined || months === '') return '';

  const numMonths = Number(months);
  if (isNaN(numMonths) || numMonths <= 0) return '';

  const years = Math.floor(numMonths / 12);
  const remainder = numMonths % 12;
  return String(remainder > 6 ? years + 1 : years);
};

/**
 * Get Loan Term in Months (preserve raw monthly value)
 * Per Jonathan's feedback: HMDA source data contains months directly.
 * Common loan terms: 60 (5yr), 84 (7yr), 120 (10yr), 180 (15yr), 240 (20yr), 360 (30yr)
 *
 * Conversion heuristic:
 * - Values > 40: definitely months, return as-is
 * - Values 1-40: check if it's a common year term (multiply by 12) or months
 *   - Common year values: 5, 7, 10, 15, 20, 25, 30 -> convert to months
 *   - Other values in this range could be months (35, 36, etc.) -> return as-is
 */
export const getLoanTermMonths = (value: any): string => {
  if (value === null || value === undefined || value === '') return '';

  const numValue = Number(value);
  if (isNaN(numValue) || numValue <= 0) return '';

  // Values > 40 are definitely months
  if (numValue > 40) {
    return String(Math.round(numValue));
  }

  // Common year-based loan terms that should be converted to months
  const commonYearTerms = [1, 2, 3, 5, 7, 10, 15, 20, 25, 30, 40];
  if (commonYearTerms.includes(numValue)) {
    return String(Math.round(numValue * 12));
  }

  // For other values in the 1-40 range, assume they're already months
  // (e.g., 35 months, 36 months, 18 months)
  return String(Math.round(numValue));
};

/**
 * Format Census Tract with leading zeros (11 digits)
 */
export const formatCensusTract = (tract: any): string => {
  if (tract === null || tract === undefined || tract === '') return '';

  const tractStr = String(tract).trim();

  // If it's a special value (NA, Exempt), return as-is
  if (['NA', 'Exempt', 'na', 'exempt'].includes(tractStr)) {
    return tractStr.toUpperCase();
  }

  // Remove any decimal points and leading zeros, then pad to 11 digits
  const cleanTract = tractStr.replace(/\./g, '').replace(/^0+/, '');

  // If numeric, pad with leading zeros to 11 digits
  if (/^\d+$/.test(cleanTract)) {
    return cleanTract.padStart(11, '0');
  }

  return tractStr;
};

/**
 * Derive RateType from IntroRatePeriod
 * IntroRatePeriod = N/A → Fixed (1), IntroRatePeriod = number → Variable (2)
 */
export const deriveRateType = (introRatePeriod: string | number | null | undefined): string => {
  if (
    introRatePeriod === null ||
    introRatePeriod === undefined ||
    introRatePeriod === '' ||
    introRatePeriod === 'N/A' ||
    introRatePeriod === 'NA' ||
    introRatePeriod === 'n/a' ||
    introRatePeriod === 'na' ||
    introRatePeriod === 'Exempt' ||
    introRatePeriod === 'exempt' ||
    introRatePeriod === '1111' ||
    introRatePeriod === 1111
  ) {
    return '1'; // Fixed Rate
  }

  const numValue = Number(introRatePeriod);

  // If it's a valid positive number → Variable Rate (2)
  if (!isNaN(numValue) && numValue > 0) {
    return '2'; // Variable Rate
  }

  // Default to Fixed Rate
  return '1';
};

/**
 * Derive Var_Term from IntroRatePeriod - convert months to years with half-year rounding.
 * Per compliance team feedback:
 *   - Terms <= 6 months round UP to 1 year (minimum reportable term)
 *   - Otherwise: remainder > 6 months rounds UP, remainder <= 6 months rounds DOWN
 *     (e.g., 30 mo / 2.5 yr → 2, 42 mo / 3.5 yr → 3, 43 mo / ~3.6 yr → 4)
 * Matches the Loan_Term rounding rule used elsewhere (see convertLoanTermToYears).
 */
export const deriveVarTerm = (introRatePeriod: string | number | null | undefined): string => {
  if (
    introRatePeriod === null ||
    introRatePeriod === undefined ||
    introRatePeriod === '' ||
    introRatePeriod === 'N/A' ||
    introRatePeriod === 'NA' ||
    introRatePeriod === 'n/a' ||
    introRatePeriod === 'na' ||
    introRatePeriod === 'Exempt' ||
    introRatePeriod === 'exempt' ||
    introRatePeriod === '1111' ||
    introRatePeriod === 1111
  ) {
    return ''; // Fixed Rate loans have no Var_Term
  }

  const numValue = Number(introRatePeriod);

  if (!isNaN(numValue) && numValue > 0) {
    // Special case: terms of 6 months or less round UP to 1 year
    if (numValue <= 6) return '1';

    const years = Math.floor(numValue / 12);
    const remainder = numValue % 12;
    return String(remainder > 6 ? years + 1 : years);
  }

  return '';
};

/**
 * Auto-detect the delimiter used in a text file
 * Supports: pipe (|), tilde (~), tab (\t), semicolon (;)
 */
export const detectDelimiter = (content: string): string => {
  const lines = content
    .split('\n')
    .filter(l => l.trim().length > 0)
    .slice(0, 10);
  if (lines.length === 0) return '|';

  const delimiters = ['|', '~', '\t', ';'];
  const scores: Record<string, number> = {};

  for (const delimiter of delimiters) {
    // Count how many fields each delimiter produces
    const fieldCounts = lines.map(line => line.split(delimiter).length);

    // Calculate consistency score (prefer delimiters that produce consistent field counts)
    const avgFields = fieldCounts.reduce((a, b) => a + b, 0) / fieldCounts.length;
    const variance =
      fieldCounts.reduce((sum, count) => sum + Math.pow(count - avgFields, 2), 0) /
      fieldCounts.length;

    // Score = average fields / (1 + variance) - prefer more fields with less variance
    // Minimum 10 fields expected for HMDA LAR format
    scores[delimiter] = avgFields >= 10 ? avgFields / (1 + variance) : 0;
  }

  // Return delimiter with highest score
  const bestDelimiter = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  console.log('Delimiter detection scores:', scores, '-> Selected:', bestDelimiter[0]);
  return bestDelimiter[0];
};

/**
 * Get trimmed value - handles space-only strings as empty
 */
export const getTrimmedValue = (val: any): string => {
  return String(val ?? '').trim();
};

/**
 * Filter data by current month
 */
export const filterByCurrentMonth = (data: SbslRow[]): { filtered: SbslRow[]; count: number } => {
  // For now, return all data - implement date filtering as needed
  return { filtered: data, count: data.length };
};

/**
 * Generate summary statistics for processed data
 */
export const generateSummaryStats = (data: SbslRow[]) => {
  // Calculate total loan amount from various possible field names
  const totalLoanAmount = data.reduce((sum, row) => {
    const amount = Number(
      row.LoanAmountInDollars ||
        row.LoanAmount ||
        row['Loan Amount'] ||
        row['Loan Amount in Dollars'] ||
        0
    );
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  return {
    totalRecords: data.length,
    totalLoanAmount,
    loanTypes: {} as Record<string, number>,
    actionTypes: {} as Record<string, number>,
    purposes: {} as Record<string, number>,
  };
};
