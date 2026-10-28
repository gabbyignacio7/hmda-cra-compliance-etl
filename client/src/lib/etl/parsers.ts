/**
 * ETL Parsers - File parsing functions for different source formats
 */

import type { SbslRow } from './types';
import {
  ENCOMPASS_FIELD_MAP,
  COMPLIANCE_REPORTER_FIELD_MAP,
  normalizeFieldName,
} from './field-maps';
import { detectDelimiter, excelDateToString } from './utils';
import { logInfo, trackETLStep } from '../error-tracker';

/**
 * Parse Encompass Excel file - handles various formats
 */
export const parseEncompassFile = (worksheet: any[][]): SbslRow[] => {
  const startTime = Date.now();
  logInfo('ETL:Parse', 'Starting Encompass file parsing', { totalRows: worksheet.length });

  console.log('=== PARSING ENCOMPASS FILE ===');
  console.log('Total rows:', worksheet.length);
  console.log('Row 0 (first 5 cells):', worksheet[0]?.slice(0, 5));
  console.log('Row 1 (first 5 cells):', worksheet[1]?.slice(0, 5));
  console.log('Row 2 (first 5 cells):', worksheet[2]?.slice(0, 5));

  // Find the real header row by looking for HMDA-like column names
  const headerIndicators = [
    'LEI',
    'ULI',
    'Loan',
    'Applicant',
    'Property',
    'Legal Entity',
    'Universal Loan',
    'Application Date',
    'Action',
    'Census',
  ];

  const metadataIndicators = [
    'Financial Institution',
    'Calendar Year',
    'Calendar Quarter',
    'Contact Person',
    'Phone Number',
    'Email',
  ];

  let headerRowIndex = 0;

  // Find the header row
  for (let i = 0; i < Math.min(10, worksheet.length); i++) {
    const row = worksheet[i];
    if (!row) continue;

    const rowString = row.map((c: any) => String(c ?? '')).join(' ');

    // Check if this is a metadata row to skip
    const isMetadata = metadataIndicators.some(ind => rowString.includes(ind));
    if (isMetadata) {
      console.log(`Row ${i} is metadata, skipping`);
      continue;
    }

    // Check if this looks like a header row
    const headerMatches = headerIndicators.filter(ind => rowString.includes(ind));
    if (headerMatches.length >= 2) {
      headerRowIndex = i;
      console.log(`Found header row at index ${i}, matches:`, headerMatches);
      break;
    }
  }

  console.log('Using header row index:', headerRowIndex);

  // Get headers from the identified row
  const rawHeaders = worksheet[headerRowIndex] || [];
  console.log('Raw headers (first 10):', rawHeaders.slice(0, 10));

  // Normalize header names
  const headers = rawHeaders.map((h: any) => normalizeFieldName(String(h ?? '').trim()));
  console.log('Normalized headers (first 10):', headers.slice(0, 10));

  // Get data rows (everything after the header)
  const dataRows = worksheet.slice(headerRowIndex + 1);
  console.log('Data rows count:', dataRows.length);

  // Map data rows to objects
  const results = dataRows
    .map((row, idx) => {
      const obj: SbslRow = {};

      headers.forEach((header: string, colIndex: number) => {
        if (header && row[colIndex] !== undefined && row[colIndex] !== null) {
          const value = row[colIndex];
          // Preserve zeros! Use nullish coalescing
          obj[header] = value;
        }
      });

      // Also keep the original Encompass names for debugging
      rawHeaders.forEach((rawHeader: any, colIndex: number) => {
        if (rawHeader && row[colIndex] !== undefined && row[colIndex] !== null) {
          const headerStr = String(rawHeader).trim();
          if (headerStr && !obj[headerStr]) {
            obj[headerStr] = row[colIndex];
          }
        }
      });

      if (idx === 0) {
        console.log('First data row keys:', Object.keys(obj).slice(0, 15));
        console.log('First data row values:', Object.values(obj).slice(0, 15));
      }

      return obj;
    })
    .filter(row => Object.keys(row).length > 0);

  console.log('Parsed rows:', results.length);

  const duration = Date.now() - startTime;
  trackETLStep(
    'ParseEncompass',
    worksheet.length,
    results.length,
    duration,
    [],
    [],
    results.length > 0 ? { firstRowKeys: Object.keys(results[0]).slice(0, 10) } : undefined
  );

  return results;
};

/**
 * Parse LaserPro/Compliance Reporter text file (auto-detects delimiter)
 * Supports: pipe (|), tilde (~), tab, semicolon delimited formats
 * Format: HMDA LAR field positions
 */
export const parseLaserProFile = (content: string): SbslRow[] => {
  console.info('=== PARSING LASERPRO FILE ===');
  const lines = content.split('\n');
  console.info('Total lines in LaserPro file:', lines.length);
  const results: SbslRow[] = [];

  // Auto-detect delimiter
  const delimiter = detectDelimiter(content);
  console.log(`LaserPro parser using delimiter: "${delimiter === '\t' ? 'TAB' : delimiter}"`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip metadata/header row (record type 1)
    const firstField = line.split(delimiter)[0];
    if (firstField === '1') {
      console.log('Skipping LaserPro/Compliance Reporter header row');
      continue;
    }

    // Split using auto-detected delimiter
    const values = line.split(delimiter);

    // Skip if this doesn't look like a data row (record type should be 2, or have enough fields)
    if (values[0] !== '2' && values.length < 50) {
      console.log(
        `Skipping non-data row at line ${i}: first field="${values[0]}", fields=${values.length}`
      );
      continue;
    }

    const row: SbslRow = {};
    Object.entries(COMPLIANCE_REPORTER_FIELD_MAP).forEach(([position, fieldName]) => {
      const index = parseInt(position);
      if (values[index] !== undefined && values[index] !== '') {
        row[fieldName] = values[index];
      }
    });

    // Store all values with Field_ prefix for any unmapped fields (for debugging)
    values.forEach((val, idx) => {
      if (val && !row[`Field_${idx}`]) {
        row[`Field_${idx}`] = val;
      }
    });

    // Mark as LaserPro source for tracking
    row['_source'] = 'LaserPro';

    results.push(row);
  }

  console.info(`LaserPro records parsed: ${results.length}`);
  console.info(
    `Parsed ${results.length} LaserPro/Compliance Reporter records (delimiter: "${delimiter === '\t' ? 'TAB' : delimiter}")`
  );
  if (results.length > 0) {
    console.info('First LaserPro record keys:', Object.keys(results[0]).slice(0, 15));
    console.info('First LaserPro record ApplNumb:', results[0].ApplNumb);
  }
  return results;
};

/**
 * Detect file type based on content or extension
 */
export const detectFileType = (
  file: File,
  content?: string
): 'encompass' | 'laserpro' | 'supplemental' | 'unknown' => {
  const name = file.name.toLowerCase();

  // Check extension first
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    if (name.includes('additional') || name.includes('supplemental')) {
      return 'supplemental';
    }
    return 'encompass';
  }

  if (name.endsWith('.txt') || name.endsWith('.csv')) {
    return 'laserpro';
  }

  // Check content if available
  if (content) {
    const firstLine = content.split('\n')[0] || '';
    if (firstLine.includes('|') || firstLine.includes('~')) {
      return 'laserpro';
    }
  }

  return 'unknown';
};
