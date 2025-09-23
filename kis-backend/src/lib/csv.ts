import { hashKnowledgeRow } from './hash.js';

// ============================================
// CSV Parser for Knowledge Tables
// ============================================

/**
 * Expected CSV header format (strict)
 */
const REQUIRED_HEADERS = [
  'brand',
  'series',
  'model',
  'af',
  'poles',
  'width_mm',
  'height_mm',
  'depth_mm',
  'meta'
];

/**
 * Parsed knowledge row type
 */
export interface ParsedKnowledgeRow {
  brand: string;
  series?: string;
  model?: string;
  af?: number;
  poles: string;
  widthMM: number;
  heightMM: number;
  depthMM: number;
  meta?: any;
  rowHash: string;
}

/**
 * Parse result type
 */
export interface CSVParseResult {
  success: boolean;
  rows: ParsedKnowledgeRow[];
  errors: string[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicateKeys: number;
  };
}

/**
 * Parse CSV content with strict validation
 */
export function parseKnowledgeCSV(csvContent: string): CSVParseResult {
  const result: CSVParseResult = {
    success: false,
    rows: [],
    errors: [],
    summary: {
      total: 0,
      valid: 0,
      invalid: 0,
      duplicateKeys: 0,
    },
  };

  try {
    const lines = csvContent.trim().split('\\n').map(line => line.trim());

    if (lines.length === 0) {
      result.errors.push('Empty CSV content');
      return result;
    }

    // Validate header
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase());

    const headerValidation = validateHeaders(headers);
    if (!headerValidation.valid) {
      result.errors.push(...headerValidation.errors);
      return result;
    }

    // Parse data rows
    const dataLines = lines.slice(1);
    result.summary.total = dataLines.length;

    const seenKeys = new Set<string>();

    for (let i = 0; i < dataLines.length; i++) {
      const lineNumber = i + 2; // +1 for header, +1 for 0-based index
      const line = dataLines[i];

      if (!line) continue; // Skip empty lines

      try {
        const row = parseLine(line, headers, lineNumber);

        // Check for duplicate keys
        const key = buildRowKey(row);
        if (seenKeys.has(key)) {
          result.errors.push(`Line ${lineNumber}: Duplicate key ${key}`);
          result.summary.duplicateKeys++;
        } else {
          seenKeys.add(key);
          result.rows.push(row);
          result.summary.valid++;
        }
      } catch (error: any) {
        result.errors.push(`Line ${lineNumber}: ${error.message}`);
        result.summary.invalid++;
      }
    }

    result.success = result.errors.length === 0;
    return result;
  } catch (error: any) {
    result.errors.push(`CSV parsing failed: ${error.message}`);
    return result;
  }
}

/**
 * Validate CSV headers
 */
function validateHeaders(headers: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for missing required headers
  for (const required of REQUIRED_HEADERS) {
    if (!headers.includes(required)) {
      errors.push(`Missing required column: ${required}`);
    }
  }

  // Check for extra headers (optional - just warn)
  for (const header of headers) {
    if (!REQUIRED_HEADERS.includes(header)) {
      console.warn(`Warning: Unknown column '${header}' will be ignored`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Parse a single CSV line
 */
function parseLine(line: string, headers: string[], lineNumber: number): ParsedKnowledgeRow {
  const values = parseCSVLine(line);

  if (values.length !== headers.length) {
    throw new Error(`Expected ${headers.length} columns, got ${values.length}`);
  }

  const rowData: any = {};

  // Map values to headers
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    const value = values[i].trim();
    rowData[header] = value || null;
  }

  // Validate and normalize values
  const row = normalizeRow(rowData, lineNumber);

  // Generate row hash
  row.rowHash = hashKnowledgeRow(row);

  return row;
}

/**
 * Normalize row data with validation
 */
function normalizeRow(data: any, lineNumber: number): Omit<ParsedKnowledgeRow, 'rowHash'> {
  // Brand validation (required)
  const brand = data.brand?.toUpperCase();
  if (!brand || !['SANGDO', 'LS'].includes(brand)) {
    throw new Error(`Invalid brand '${data.brand}'. Must be 'SANGDO' or 'LS'`);
  }

  // Series (optional, trim)
  const series = data.series?.trim() || undefined;

  // Model (optional, trim)
  const model = data.model?.trim() || undefined;

  // AF (optional for SANGDO, parse as integer)
  let af: number | undefined;
  if (data.af) {
    const afNumber = parseInt(data.af, 10);
    if (isNaN(afNumber) || afNumber <= 0) {
      throw new Error(`Invalid AF value '${data.af}'. Must be positive integer`);
    }
    af = afNumber;
  }

  // Poles validation (required)
  const poles = data.poles?.toUpperCase();
  if (!poles || !['1P', '2P', '3P', '4P'].includes(poles)) {
    throw new Error(`Invalid poles '${data.poles}'. Must be '1P', '2P', '3P', or '4P'`);
  }

  // Width validation (required)
  const widthMM = parseInt(data.width_mm, 10);
  if (isNaN(widthMM) || widthMM <= 0) {
    throw new Error(`Invalid width_mm '${data.width_mm}'. Must be positive integer`);
  }

  // Height validation (required)
  const heightMM = parseInt(data.height_mm, 10);
  if (isNaN(heightMM) || heightMM <= 0) {
    throw new Error(`Invalid height_mm '${data.height_mm}'. Must be positive integer`);
  }

  // Depth validation (required)
  const depthMM = parseInt(data.depth_mm, 10);
  if (isNaN(depthMM) || depthMM <= 0) {
    throw new Error(`Invalid depth_mm '${data.depth_mm}'. Must be positive integer`);
  }

  // Meta (optional JSON)
  let meta: any = undefined;
  if (data.meta) {
    try {
      meta = JSON.parse(data.meta);
    } catch (error) {
      // If not valid JSON, store as string
      meta = data.meta;
    }
  }

  return {
    brand,
    series,
    model,
    af,
    poles,
    widthMM,
    heightMM,
    depthMM,
    meta,
  };
}

/**
 * Build unique key for row (for duplicate detection)
 */
function buildRowKey(row: Omit<ParsedKnowledgeRow, 'rowHash'>): string {
  const { brand, series, model, af, poles } = row;

  if (brand === 'SANGDO') {
    return `SANGDO|${series || ''}|${model || ''}|${poles}`;
  } else if (brand === 'LS') {
    if (af) {
      return `LS|AF${af}|${poles}`;
    } else {
      return `LS|${series || ''}|${model || ''}|${poles}`;
    }
  }

  throw new Error(`Unsupported brand: ${brand}`);
}

/**
 * Simple CSV line parser (handles basic quoted fields)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Convert JSON array to CSV format (for testing/export)
 */
export function jsonToCSV(rows: ParsedKnowledgeRow[]): string {
  if (rows.length === 0) {
    return REQUIRED_HEADERS.join(',');
  }

  const headers = REQUIRED_HEADERS;
  const csvLines = [headers.join(',')];

  for (const row of rows) {
    const values = [
      row.brand,
      row.series || '',
      row.model || '',
      row.af || '',
      row.poles,
      row.widthMM.toString(),
      row.heightMM.toString(),
      row.depthMM.toString(),
      row.meta ? JSON.stringify(row.meta) : '',
    ];

    csvLines.push(values.join(','));
  }

  return csvLines.join('\\n');
}