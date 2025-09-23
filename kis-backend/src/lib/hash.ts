import crypto from 'crypto';

// ============================================
// Hash Utilities for Knowledge Management
// ============================================

/**
 * Generate SHA-256 hash from string or buffer
 */
export const sha256 = (s: string | Buffer): string => {
  return crypto.createHash('sha256').update(s).digest('hex');
};

/**
 * Generate hash for knowledge table row
 */
export const hashKnowledgeRow = (row: {
  brand: string;
  series?: string;
  model?: string;
  af?: number;
  poles: string;
  widthMM: number;
  heightMM: number;
  depthMM: number;
  meta?: any;
}): string => {
  // Create a stable representation for hashing
  const normalized = {
    brand: row.brand,
    series: row.series || null,
    model: row.model || null,
    af: row.af || null,
    poles: row.poles,
    widthMM: row.widthMM,
    heightMM: row.heightMM,
    depthMM: row.depthMM,
    meta: row.meta || null,
  };

  const serialized = JSON.stringify(normalized, Object.keys(normalized).sort());
  return sha256(serialized);
};

/**
 * Generate hash for entire table data set
 */
export const hashTableData = (rows: any[]): string => {
  const sortedRows = rows
    .map(row => JSON.stringify(row, Object.keys(row).sort()))
    .sort()
    .join('|');

  return sha256(sortedRows);
};

/**
 * Generate combined table hashes for evidence
 */
export const generateTableHashes = (tables: { name: string; data: any[] }[]): Record<string, string> => {
  const hashes: Record<string, string> = {};

  for (const table of tables) {
    hashes[table.name] = hashTableData(table.data);
  }

  return hashes;
};