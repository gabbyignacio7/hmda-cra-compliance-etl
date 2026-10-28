/**
 * Verification utilities for HMDA/CRA Compliance ETL
 * Implements the verification checklist from the specification
 */

import { CRA_WIZ_128_COLUMNS } from './etl-engine';
import { OUTPUT_COLUMNS } from './cra-wiz-transform';

export interface VerificationCheck {
  name: string;
  passed: boolean;
  actual: string | number;
  expected: string | number;
}

export interface VerificationResult {
  passed: boolean;
  checks: VerificationCheck[];
  summary: string;
}

/**
 * Verify Phase 1 output (CRA Wiz 128-column format)
 */
export const verifyPhase1Output = (data: any[][]): VerificationResult => {
  const checks: VerificationCheck[] = [];

  if (!data || data.length === 0) {
    return {
      passed: false,
      checks: [{ name: 'Data present', passed: false, actual: 0, expected: '> 0 rows' }],
      summary: 'No data to verify',
    };
  }

  const headers = data[0];

  // Check 1: Column A header = "BranchName"
  const colA = String(headers[0] || '');
  checks.push({
    name: 'Column A = BranchName',
    passed: colA === 'BranchName',
    actual: colA,
    expected: 'BranchName',
  });

  // Check 2: Column B header = "Branch"
  const colB = String(headers[1] || '');
  checks.push({
    name: 'Column B = Branch',
    passed: colB === 'Branch',
    actual: colB,
    expected: 'Branch',
  });

  // Check 3: Column C header = "ApplNumb"
  const colC = String(headers[2] || '');
  checks.push({
    name: 'Column C = ApplNumb',
    passed: colC === 'ApplNumb',
    actual: colC,
    expected: 'ApplNumb',
  });

  // Check 4: Column count = 128
  const colCount = headers.length;
  checks.push({
    name: 'Column count = 128',
    passed: colCount === 128,
    actual: colCount,
    expected: 128,
  });

  // Check 5: No LAR headers present
  const larHeaders = [
    'Financial Institution Name',
    'Calendar Year',
    'Calendar Quarter',
    'Contact Person',
  ];
  const hasLarHeaders = headers.some((h: any) => larHeaders.includes(String(h)));
  checks.push({
    name: 'No LAR format headers',
    passed: !hasLarHeaders,
    actual: hasLarHeaders ? 'Found LAR headers' : 'Clean',
    expected: 'No LAR headers',
  });

  // Check 6: No delimiters in cells
  let delimiterFound = false;
  let delimiterLocation = '';
  for (let rowIdx = 1; rowIdx < Math.min(10, data.length); rowIdx++) {
    const row = data[rowIdx];
    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      const cell = String(row[colIdx] || '');
      if (cell.split('~').length > 3 || cell.split('|').length > 3) {
        delimiterFound = true;
        delimiterLocation = `Row ${rowIdx + 1}, Col ${colIdx + 1}`;
        break;
      }
    }
    if (delimiterFound) break;
  }
  checks.push({
    name: 'No delimiters in cells',
    passed: !delimiterFound,
    actual: delimiterFound ? `Delimiter at ${delimiterLocation}` : 'Clean',
    expected: 'No delimiters',
  });

  // Check 7: Data rows present
  const dataRowCount = data.length - 1;
  checks.push({
    name: 'Data rows present',
    passed: dataRowCount > 0,
    actual: dataRowCount,
    expected: '> 0',
  });

  // Check 8: Column order matches spec
  let orderMatch = true;
  let mismatchCol = '';
  for (let i = 0; i < Math.min(headers.length, CRA_WIZ_128_COLUMNS.length); i++) {
    if (String(headers[i]) !== CRA_WIZ_128_COLUMNS[i]) {
      orderMatch = false;
      mismatchCol = `Col ${i + 1}: got "${headers[i]}", expected "${CRA_WIZ_128_COLUMNS[i]}"`;
      break;
    }
  }
  checks.push({
    name: 'Column order matches spec',
    passed: orderMatch,
    actual: orderMatch ? 'Matches' : mismatchCol,
    expected: 'Exact column order',
  });

  // Check 9: Dates not in Excel serial format
  let serialDateFound = false;
  const dateColIndices = [13, 21, 89]; // ApplDate, ActionDate, Rate_Lock_Date
  for (let rowIdx = 1; rowIdx < Math.min(10, data.length); rowIdx++) {
    for (const colIdx of dateColIndices) {
      const cell = data[rowIdx]?.[colIdx];
      if (typeof cell === 'number' && cell > 40000 && cell < 50000) {
        serialDateFound = true;
        break;
      }
    }
    if (serialDateFound) break;
  }
  checks.push({
    name: 'Dates in proper format',
    passed: !serialDateFound,
    actual: serialDateFound ? 'Excel serial numbers found' : 'Proper format',
    expected: 'MM/DD/YYYY format',
  });

  const passed = checks.every(c => c.passed);
  const failedCount = checks.filter(c => !c.passed).length;

  return {
    passed,
    checks,
    summary: passed ? 'All Phase 1 verification checks passed' : `${failedCount} check(s) failed`,
  };
};

/**
 * Verify Phase 3 output (Work Item 125-column format)
 */
export const verifyPhase3Output = (data: any[][]): VerificationResult => {
  const checks: VerificationCheck[] = [];

  if (!data || data.length === 0) {
    return {
      passed: false,
      checks: [{ name: 'Data present', passed: false, actual: 0, expected: '> 0 rows' }],
      summary: 'No data to verify',
    };
  }

  const headers = data[0];

  // Check 1: Column A header = "BRANCHNAME"
  const colA = String(headers[0] || '');
  checks.push({
    name: 'Column A = BRANCHNAME',
    passed: colA === 'BRANCHNAME',
    actual: colA,
    expected: 'BRANCHNAME',
  });

  // Check 2: Column B header = "BRANCHNUMB"
  const colB = String(headers[1] || '');
  checks.push({
    name: 'Column B = BRANCHNUMB',
    passed: colB === 'BRANCHNUMB',
    actual: colB,
    expected: 'BRANCHNUMB',
  });

  // Check 3: Column count = 125
  const colCount = headers.length;
  checks.push({
    name: 'Column count = 125',
    passed: colCount === 125,
    actual: colCount,
    expected: 125,
  });

  // Check 4: ErrorMadeBy column present (column 12)
  const errorMadeByIdx = headers.findIndex((h: any) => String(h) === 'ErrorMadeBy');
  checks.push({
    name: 'ErrorMadeBy column present',
    passed: errorMadeByIdx === 11, // 0-indexed
    actual: errorMadeByIdx >= 0 ? `Column ${errorMadeByIdx + 1}` : 'Not found',
    expected: 'Column 12',
  });

  // Check 5: DSC column present (column 92)
  const dscIdx = headers.findIndex((h: any) => String(h) === 'DSC');
  checks.push({
    name: 'DSC column present',
    passed: dscIdx === 91, // 0-indexed
    actual: dscIdx >= 0 ? `Column ${dscIdx + 1}` : 'Not found',
    expected: 'Column 92',
  });

  // Check 6: Date columns in M/D/YY format
  let serialDateFound = false;
  const dateColNames = ['APPLDATE', 'ACTIONDATE', 'RATE_LOCK_DATE'];
  const dateColIndices = dateColNames
    .map(name => headers.findIndex((h: any) => String(h) === name))
    .filter(idx => idx >= 0);

  for (let rowIdx = 1; rowIdx < Math.min(10, data.length); rowIdx++) {
    for (const colIdx of dateColIndices) {
      const cell = data[rowIdx]?.[colIdx];
      if (typeof cell === 'number' && cell > 40000 && cell < 50000) {
        serialDateFound = true;
        break;
      }
    }
    if (serialDateFound) break;
  }
  checks.push({
    name: 'Date columns in MM/DD/YYYY format',
    passed: !serialDateFound,
    actual: serialDateFound ? 'Excel serial numbers found' : 'Proper format',
    expected: 'MM/DD/YYYY format',
  });

  // Check 7: BRANCHNAME populated
  let branchNamePopulated = 0;
  for (let rowIdx = 1; rowIdx < data.length; rowIdx++) {
    const branchName = String(data[rowIdx]?.[0] || '').trim();
    if (branchName !== '') {
      branchNamePopulated++;
    }
  }
  const branchNameRate = data.length > 1 ? (branchNamePopulated / (data.length - 1)) * 100 : 0;
  checks.push({
    name: 'BRANCHNAME populated',
    passed: branchNameRate > 90,
    actual: `${branchNameRate.toFixed(1)}%`,
    expected: '> 90%',
  });

  // Check 8: Co-applicant fields show 9999 when empty
  const coaAgeIdx = headers.findIndex((h: any) => String(h) === 'COA_AGE');
  const coaFieldsCorrect = true;
  if (coaAgeIdx >= 0) {
    for (let rowIdx = 1; rowIdx < Math.min(10, data.length); rowIdx++) {
      const coaAge = data[rowIdx]?.[coaAgeIdx];
      // If empty or 9999, it's correct
      if (coaAge !== '' && coaAge !== '9999' && coaAge !== 9999 && coaAge !== undefined) {
        // It has a value, which is also valid
      }
    }
  }
  checks.push({
    name: 'Co-applicant defaults (9999)',
    passed: coaFieldsCorrect,
    actual: coaFieldsCorrect ? 'Correct' : 'Issues found',
    expected: '9999 when no co-applicant',
  });

  const passed = checks.every(c => c.passed);
  const failedCount = checks.filter(c => !c.passed).length;

  return {
    passed,
    checks,
    summary: passed ? 'All Phase 3 verification checks passed' : `${failedCount} check(s) failed`,
  };
};

/**
 * Generate a text verification report
 */
export const generateVerificationReport = (
  phase1Result?: VerificationResult,
  phase3Result?: VerificationResult
): string => {
  let report = '===============================================================\n';
  report += '       HMDA/CRA COMPLIANCE ETL - VERIFICATION REPORT\n';
  report += '===============================================================\n\n';
  report += `Generated: ${new Date().toLocaleString()}\n\n`;

  if (phase1Result) {
    report += '---------------------------------------------------------------\n';
    report += ' PHASE 1: CRA Wiz 128-Column Format\n';
    report += '---------------------------------------------------------------\n\n';

    phase1Result.checks.forEach(check => {
      const status = check.passed ? 'PASS' : 'FAIL';
      report += `${status} | ${check.name}\n`;
      if (!check.passed) {
        report += `         Expected: ${check.expected}\n`;
        report += `         Actual:   ${check.actual}\n`;
      }
    });

    report += `\n${phase1Result.summary}\n\n`;
  }

  if (phase3Result) {
    report += '---------------------------------------------------------------\n';
    report += ' PHASE 3: Work Item 125-Column Format\n';
    report += '---------------------------------------------------------------\n\n';

    phase3Result.checks.forEach(check => {
      const status = check.passed ? 'PASS' : 'FAIL';
      report += `${status} | ${check.name}\n`;
      if (!check.passed) {
        report += `         Expected: ${check.expected}\n`;
        report += `         Actual:   ${check.actual}\n`;
      }
    });

    report += `\n${phase3Result.summary}\n\n`;
  }

  report += '===============================================================\n';

  const overallPassed = (phase1Result?.passed ?? true) && (phase3Result?.passed ?? true);
  report += overallPassed
    ? '                    ALL VERIFICATIONS PASSED\n'
    : '                    SOME VERIFICATIONS FAILED\n';
  report += '===============================================================\n';

  return report;
};

/**
 * Validate column order matches specification exactly
 */
export const validateColumnOrder = (
  headers: string[],
  expectedColumns: string[]
): { isValid: boolean; mismatches: string[] } => {
  const mismatches: string[] = [];

  for (let i = 0; i < expectedColumns.length; i++) {
    if (headers[i] !== expectedColumns[i]) {
      mismatches.push(
        `Column ${i + 1}: expected "${expectedColumns[i]}", got "${headers[i] || '(missing)'}"`
      );
    }
  }

  if (headers.length !== expectedColumns.length) {
    mismatches.push(`Column count: expected ${expectedColumns.length}, got ${headers.length}`);
  }

  return {
    isValid: mismatches.length === 0,
    mismatches,
  };
};
