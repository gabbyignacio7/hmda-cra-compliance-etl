/**
 * ETL Module - Main entry point
 * Re-exports all ETL functions for use in the application
 */

// Types
export type {
  SbslRow,
  ValidationResult,
  ColumnStats,
  RowComparison,
  ComparisonResult,
  ColumnAccuracy,
  RowComparisonResult,
  DeduplicationResult,
  FilterResult,
  SummaryStats,
} from './types';

// Field Maps
export {
  HMDA_COLUMN_ORDER, // 126-column HMDA template (single source of truth)
  CRA_WIZ_128_COLUMNS, // Alias for backwards compatibility
  ENCOMPASS_FIELD_MAP,
  COMPLIANCE_REPORTER_FIELD_MAP,
  FIELD_VARIATIONS,
  normalizeFieldName,
} from './field-maps';

// Utilities
export {
  excelDateToString,
  findFieldValue,
  parseBorrowerName,
  mapAUSResult,
  mapAUSystem,
  mapNonAmortz,
  convertLoanTermToYears,
  getLoanTermMonths,
  formatCensusTract,
  deriveRateType,
  deriveVarTerm,
  detectDelimiter,
  getTrimmedValue,
  filterByCurrentMonth,
  generateSummaryStats,
} from './utils';

// Parsers
export { parseEncompassFile, parseLaserProFile, detectFileType } from './parsers';

// Transform
export {
  transformToCRAWizFormat,
  validateData,
  autoCorrectData,
  transformEncompassData,
  cleanAndFormatData,
} from './transform';

// Merge
export { deduplicateData, mergeSupplementalData } from './merge';
