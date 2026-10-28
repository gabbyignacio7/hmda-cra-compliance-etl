import { SbslRow } from './etl-engine';

export interface DiffResult {
  identical: boolean;
  diffCount: number;
  differences: Difference[];
  actualRows: number;
  expectedRows: number;
  rowDiff: number;
}

export interface Difference {
  type: string;
  column?: string;
  rowsAffected?: number;
  sampleActual?: string;
  sampleExpected?: string;
  columns?: string;
}

export const compareDataframes = (actual: SbslRow[], expected: SbslRow[]): DiffResult => {
  const result: DiffResult = {
    identical: false,
    diffCount: 0,
    differences: [],
    actualRows: actual.length,
    expectedRows: expected.length,
    rowDiff: Math.abs(actual.length - expected.length),
  };

  // Compare row counts
  if (actual.length !== expected.length) {
    result.differences.push({
      type: 'Row Count',
      sampleActual: String(actual.length),
      sampleExpected: String(expected.length),
    });
  }

  if (actual.length === 0 || expected.length === 0) {
    // If one is empty but not both, we already logged row count diff.
    // If both empty, identical.
    if (actual.length === 0 && expected.length === 0) {
      result.identical = true;
    }
    result.diffCount = result.differences.length;
    return result;
  }

  // Compare columns (using first row as schema source for simplicity)
  const actualCols = Object.keys(actual[0]);
  const expectedCols = Object.keys(expected[0]);

  const missingInActual = expectedCols.filter(c => !actualCols.includes(c));
  const extraInActual = actualCols.filter(c => !expectedCols.includes(c));

  if (missingInActual.length > 0) {
    result.differences.push({
      type: 'Missing Columns in Actual',
      columns: missingInActual.join(', '),
    });
  }

  if (extraInActual.length > 0) {
    result.differences.push({
      type: 'Extra Columns in Actual',
      columns: extraInActual.join(', '),
    });
  }

  // Compare Values (Basic check on first 100 rows to save perf)
  const commonCols = actualCols.filter(c => expectedCols.includes(c));
  const rowsToCompare = Math.min(actual.length, expected.length);

  for (const col of commonCols) {
    let diffCount = 0;
    let sampleAct = '';
    let sampleExp = '';

    for (let i = 0; i < rowsToCompare; i++) {
      if (String(actual[i][col]) !== String(expected[i][col])) {
        diffCount++;
        if (!sampleAct) {
          sampleAct = String(actual[i][col]);
          sampleExp = String(expected[i][col]);
        }
      }
    }

    if (diffCount > 0) {
      result.differences.push({
        type: 'Value Difference',
        column: col,
        rowsAffected: diffCount,
        sampleActual: sampleAct,
        sampleExpected: sampleExp,
      });
    }
  }

  result.diffCount = result.differences.length;
  result.identical = result.diffCount === 0;

  return result;
};
