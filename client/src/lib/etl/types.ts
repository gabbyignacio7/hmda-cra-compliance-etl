/**
 * ETL Types - Shared interfaces and types for the HMDA ETL pipeline
 */

/**
 * Generic row type for SBSL/HMDA data - allows dynamic field access
 */
export interface SbslRow {
  [key: string]: any;
}

/**
 * Result of validating a single row
 */
export interface ValidationResult {
  rowIdx: number;
  applNumb: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  autoCorrected: Record<string, { from: any; to: any }>;
}

/**
 * Statistics for a single column in comparison
 */
export interface ColumnStats {
  blank: number;
  nonBlank: number;
  uniqueValues: Set<string>;
}

/**
 * Comparison of a single row between old and new data
 */
export interface RowComparison {
  rowIndex: number;
  uli: string;
  column: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'removed' | 'changed';
}

/**
 * Column accuracy info for comparison UI
 */
export interface ColumnAccuracy {
  column: string;
  matchRate: number;
  mismatches: number;
}

/**
 * Row-level comparison result for UI display
 */
export interface RowComparisonResult {
  key: string;
  isMatch: boolean;
  isNewRecord: boolean;
  differences: Record<string, { old: string; new: string }>;
}

/**
 * Result of comparing two datasets
 */
export interface ComparisonResult {
  totalRowsOld: number;
  totalRowsNew: number;
  columnsCompared: string[];
  columnChanges: Record<
    string,
    {
      blanksOld: number;
      blanksNew: number;
      uniqueValuesOld: number;
      uniqueValuesNew: number;
      changedRows: number;
    }
  >;
  rowChanges: RowComparison[];
  summary: string;
  // Additional properties for UI display
  matchPercentage: number;
  matchedRecords: number;
  totalRecords: number;
  partialMatches: number;
  newRecords: number;
  worstColumns: ColumnAccuracy[];
  rowComparisons: RowComparisonResult[];
}

/**
 * Result of deduplication process
 */
export interface DeduplicationResult {
  deduplicated: SbslRow[];
  duplicatesRemoved: number;
  duplicateKeys: string[];
}

/**
 * Result of filtering by current month
 */
export interface FilterResult {
  filtered: SbslRow[];
  count: number;
}

/**
 * Summary statistics for processed data
 */
export interface SummaryStats {
  totalRecords: number;
  loanTypes: Record<string, number>;
  actionTypes: Record<string, number>;
  purposes: Record<string, number>;
}
