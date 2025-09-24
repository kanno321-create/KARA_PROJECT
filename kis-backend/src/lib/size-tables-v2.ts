import type { PrismaClient } from '@prisma/client';
import { hashTableData } from './hash.js';
// import { sha256 } from './hash.js'; // Unused: removed

// ============================================
// Knowledge Cache System with Hot Swap
// ============================================

type Key = string; // "SANGDO|SBS|SBS-603|3P" or "LS|AF630|3P" 등
export type MCCBDimension = { W: number; H: number; D: number; meta?: any };
type Dim = MCCBDimension;

interface KnowledgeCache {
  versionId: number;
  label: string;
  tableHashes: string[];
  rowsByKey: Map<Key, Dim>;
}

// Global cache instance
let currentCache: KnowledgeCache | null = null;

// Thread safety mutex for cache updates
let isLoading = false;

// ============================================
// Public API
// ============================================

/**
 * Load active knowledge version into cache (called at server startup)
 */
export async function loadActiveKnowledge(prisma: PrismaClient): Promise<void> {
  if (isLoading) {
    throw new Error('Knowledge loading already in progress');
  }

  isLoading = true;
  try {
    console.log('Loading active knowledge version...');

    // Find active version
    const activeVersion = await prisma.knowledgeVersion.findFirst({
      where: { active: true },
      include: {
        tables: true,
      },
    });

    if (!activeVersion) {
      // No active version - initialize with empty cache for now
      console.log('No active knowledge version found, initializing empty cache');
      currentCache = {
        versionId: 0,
        label: 'empty',
        tableHashes: [],
        rowsByKey: new Map(),
      };
      return;
    }

    // Build cache from database
    const cache = await buildCacheFromVersion(activeVersion);
    currentCache = cache;

    console.log(`Loaded knowledge version: ${cache.label} (ID: ${cache.versionId})`);
    console.log(`Cache contains ${cache.rowsByKey.size} dimension entries`);
  } finally {
    isLoading = false;
  }
}

/**
 * Get current knowledge version info
 */
export function getCurrentKnowledgeVersion(): { versionId: number; label: string } {
  if (!currentCache) {
    throw new Error('Knowledge cache not loaded. Call loadActiveKnowledge() first.');
  }

  return {
    versionId: currentCache.versionId,
    label: currentCache.label,
  };
}

/**
 * Get table hashes for evidence
 */
export function getTableHashes(): string[] {
  if (!currentCache) {
    throw new Error('Knowledge cache not loaded. Call loadActiveKnowledge() first.');
  }

  return [...currentCache.tableHashes];
}

/**
 * Find dimensions by key
 */
export function findDimensionKeyed(args: {
  brand: 'SANGDO' | 'LS';
  series?: string;
  model?: string;
  af?: number;
  poles: '1P' | '2P' | '3P' | '4P';
}): Dim | null {
  if (!currentCache) {
    throw new Error('Knowledge cache not loaded. Call loadActiveKnowledge() first.');
  }

  const key = buildLookupKey(args);
  return currentCache.rowsByKey.get(key) || null;
}

/**
 * Snapshot current cache (for debugging/evidence)
 */
export function snapshotKnowledge(): KnowledgeCache {
  if (!currentCache) {
    throw new Error('Knowledge cache not loaded. Call loadActiveKnowledge() first.');
  }

  return {
    versionId: currentCache.versionId,
    label: currentCache.label,
    tableHashes: [...currentCache.tableHashes],
    rowsByKey: new Map(currentCache.rowsByKey),
  };
}

/**
 * Hot swap to new version (thread-safe)
 */
export async function hotSwapKnowledge(prisma: PrismaClient, newVersionId: number): Promise<void> {
  if (isLoading) {
    throw new Error('Knowledge loading already in progress, cannot hot swap');
  }

  isLoading = true;
  try {
    console.log(`Hot swapping to knowledge version: ${newVersionId}`);

    // Load new version
    const newVersion = await prisma.knowledgeVersion.findUnique({
      where: { id: newVersionId },
      include: {
        tables: true,
      },
    });

    if (!newVersion) {
      throw new Error(`Knowledge version ${newVersionId} not found`);
    }

    // Build new cache
    const newCache = await buildCacheFromVersion(newVersion);

    // Atomic swap
    const oldCache = currentCache;
    currentCache = newCache;

    console.log(`Hot swap completed: ${oldCache?.label || 'empty'} → ${newCache.label}`);
    console.log(`Cache updated: ${newCache.rowsByKey.size} dimension entries`);
  } finally {
    isLoading = false;
  }
}

// ============================================
// Internal Implementation
// ============================================

/**
 * Build cache from version data
 */
async function buildCacheFromVersion(version: any): Promise<KnowledgeCache> {
  const rowsByKey = new Map<Key, Dim>();
  const tableHashes: string[] = [];

  // Group tables by brand/series for hash calculation
  const tableGroups = new Map<string, any[]>();

  for (const table of version.tables) {
    const key = buildLookupKey({
      brand: table.brand as 'SANGDO' | 'LS',
      series: table.series,
      model: table.model,
      af: table.af,
      poles: table.poles as '1P' | '2P' | '3P' | '4P',
    });

    const dim: Dim = {
      W: table.widthMM,
      H: table.heightMM,
      D: table.depthMM,
      meta: table.meta,
    };

    rowsByKey.set(key, dim);

    // Group for table hash calculation
    const groupKey = `${table.brand}_${table.series || 'default'}`;
    if (!tableGroups.has(groupKey)) {
      tableGroups.set(groupKey, []);
    }
    tableGroups.get(groupKey)!.push(table);
  }

  // Calculate table hashes
  for (const [_groupKey, tables] of tableGroups) {
    const hash = hashTableData(tables);
    tableHashes.push(hash);
  }

  return {
    versionId: version.id,
    label: version.label,
    tableHashes,
    rowsByKey,
  };
}

/**
 * Build lookup key from parameters
 */
function buildLookupKey(args: {
  brand: 'SANGDO' | 'LS';
  series?: string;
  model?: string;
  af?: number;
  poles: '1P' | '2P' | '3P' | '4P';
}): string {
  const { brand, series, model, af, poles } = args;

  if (brand === 'SANGDO') {
    // SANGDO key: "SANGDO|<series>|<model>|<poles>"
    return `SANGDO|${series || ''}|${model || ''}|${poles}`;
  } else if (brand === 'LS') {
    if (af) {
      // LS AF key: "LS|AF<af>|<poles>"
      return `LS|AF${af}|${poles}`;
    } else {
      // LS series/model key: "LS|<series>|<model>|<poles>"
      return `LS|${series || ''}|${model || ''}|${poles}`;
    }
  }

  throw new Error(`Unsupported brand: ${brand}`);
}

/**
 * Validate cache integrity
 */
export function validateCacheIntegrity(): boolean {
  if (!currentCache) {
    return false;
  }

  try {
    // Basic integrity checks
    if (currentCache.versionId < 0) return false;
    if (!currentCache.label) return false;
    if (!Array.isArray(currentCache.tableHashes)) return false;
    if (!(currentCache.rowsByKey instanceof Map)) return false;

    return true;
  } catch (error) {
    console.error('Cache integrity validation failed:', error);
    return false;
  }
}