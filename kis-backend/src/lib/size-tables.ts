import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// 타입 정의
// ============================================

export interface MCCBDimension {
  brand: string;
  series?: string;
  model?: string;
  frame?: string;
  af?: number;
  poles: string;
  width_mm: number;
  height_mm: number;
  depth_mm: number;
}

export interface SizeTableCache {
  lsMetasol: MCCBDimension[];
  sangdo: MCCBDimension[];
  lastLoaded: Date;
  checksum: string;
}

// ============================================
// 메모리 캐시
// ============================================

let cache: SizeTableCache | null = null;

// ============================================
// CSV 파서
// ============================================

function parseLSMetasolCSV(filePath: string): MCCBDimension[] {
  try {
    const csvContent = readFileSync(filePath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return records.map((record: any) => ({
      brand: record.brand || 'LS',
      series: record.series || 'METASOL',
      af: parseInt(record.af),
      poles: record.poles,
      width_mm: parseInt(record.width_mm),
      height_mm: parseInt(record.height_mm),
      depth_mm: parseInt(record.depth_mm),
    }));
  } catch (error) {
    console.error(`Error parsing LS Metasol CSV: ${error}`);
    return [];
  }
}

function parseSangdoCSV(filePath: string): MCCBDimension[] {
  try {
    const csvContent = readFileSync(filePath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return records.map((record: any) => ({
      brand: record.brand || 'SANGDO',
      series: record.series,
      model: record.model,
      frame: record.frame,
      poles: record.poles,
      width_mm: parseInt(record.width_mm),
      height_mm: parseInt(record.height_mm),
      depth_mm: parseInt(record.depth_mm),
    }));
  } catch (error) {
    console.error(`Error parsing Sangdo CSV: ${error}`);
    return [];
  }
}

// ============================================
// 캐시 로더
// ============================================

export function loadSizeTables(): SizeTableCache {
  console.log('Loading size tables from CSV files...');

  const dataDir = path.join(__dirname, '../data');
  const lsFile = path.join(dataDir, 'LS_Metasol_MCCB_dimensions_by_AF_and_poles.csv');
  const sangdoFile = path.join(dataDir, 'Sangdo_MCCB_dimensions_by_AF_model_poles.csv');

  const lsMetasol = parseLSMetasolCSV(lsFile);
  const sangdo = parseSangdoCSV(sangdoFile);

  // 체크섬 생성 (간단한 해시)
  const checksum = Buffer.from(
    JSON.stringify([lsMetasol.length, sangdo.length, Date.now()])
  ).toString('base64');

  cache = {
    lsMetasol,
    sangdo,
    lastLoaded: new Date(),
    checksum,
  };

  console.log(`Loaded ${lsMetasol.length} LS Metasol entries and ${sangdo.length} Sangdo entries`);
  return cache;
}

// ============================================
// 치수 조회 함수
// ============================================

export function getSize(
  brand: string,
  model?: string,
  af?: number,
  poles?: string
): MCCBDimension | null {
  if (!cache) {
    loadSizeTables();
  }

  const normalizedBrand = brand.toUpperCase();
  const normalizedPoles = poles?.toUpperCase();

  // ELCB 매핑 처리 (SANGDO only)
  let searchModel = model;
  if (normalizedBrand === 'SANGDO' && model) {
    // SBS → SES, SBE → SEE (치수 동일)
    if (model.startsWith('SBS')) {
      searchModel = model.replace('SBS', 'SES');
    } else if (model.startsWith('SBE')) {
      searchModel = model.replace('SBE', 'SEE');
    }
  }

  if (normalizedBrand === 'LS') {
    // LS는 AF와 poles로 검색
    return cache!.lsMetasol.find(
      (item) =>
        item.af === af &&
        item.poles === normalizedPoles
    ) || null;
  }

  if (normalizedBrand === 'SANGDO') {
    // SANGDO는 model과 poles로 검색 (AF는 보조)
    if (searchModel) {
      const result = cache!.sangdo.find(
        (item) =>
          item.model === searchModel &&
          item.poles === normalizedPoles
      );
      if (result) return result;
    }

    // model이 없거나 찾지 못한 경우 frame으로 추가 검색
    if (af) {
      // AF에서 프레임 추정
      let frame = '';
      if (af <= 50) frame = 'F50';
      else if (af <= 100) frame = 'F100';
      else if (af <= 225) frame = 'F225';
      else if (af <= 400) frame = 'F400';
      else if (af <= 630) frame = 'F630';

      if (frame) {
        return cache!.sangdo.find(
          (item) =>
            item.frame === frame &&
            item.poles === normalizedPoles
        ) || null;
      }
    }
  }

  return null;
}

// ============================================
// 브랜드별 사용 가능한 모델 조회
// ============================================

export function getAvailableModels(brand: string): string[] {
  if (!cache) {
    loadSizeTables();
  }

  const normalizedBrand = brand.toUpperCase();

  if (normalizedBrand === 'LS') {
    // LS는 모델명이 없고 AF + poles 조합만 있음
    return cache!.lsMetasol.map(item => `METASOL-${item.af}(${item.poles})`);
  }

  if (normalizedBrand === 'SANGDO') {
    return [...new Set(cache!.sangdo.map(item => item.model).filter(Boolean))];
  }

  return [];
}

// ============================================
// 브랜드별 사용 가능한 AF 조회
// ============================================

export function getAvailableAFs(brand: string): number[] {
  if (!cache) {
    loadSizeTables();
  }

  const normalizedBrand = brand.toUpperCase();

  if (normalizedBrand === 'LS') {
    return [...new Set(cache!.lsMetasol.map(item => item.af).filter(Boolean))].sort((a, b) => a - b);
  }

  if (normalizedBrand === 'SANGDO') {
    // SANGDO는 프레임에서 AF 추정
    const frames = [...new Set(cache!.sangdo.map(item => item.frame).filter(Boolean))];
    return frames.map(frame => {
      const match = frame.match(/F(\d+)/);
      return match ? parseInt(match[1]) : 0;
    }).filter(Boolean).sort((a, b) => a - b);
  }

  return [];
}

// ============================================
// 극수별 조회
// ============================================

export function getAvailablePoles(brand: string, af?: number, model?: string): string[] {
  if (!cache) {
    loadSizeTables();
  }

  const normalizedBrand = brand.toUpperCase();

  if (normalizedBrand === 'LS') {
    let results = cache!.lsMetasol;
    if (af) {
      results = results.filter(item => item.af === af);
    }
    return [...new Set(results.map(item => item.poles))];
  }

  if (normalizedBrand === 'SANGDO') {
    let results = cache!.sangdo;
    if (model) {
      results = results.filter(item => item.model === model);
    } else if (af) {
      // AF에서 프레임 추정
      let frame = '';
      if (af <= 50) frame = 'F50';
      else if (af <= 100) frame = 'F100';
      else if (af <= 225) frame = 'F225';
      else if (af <= 400) frame = 'F400';
      else if (af <= 630) frame = 'F630';

      if (frame) {
        results = results.filter(item => item.frame === frame);
      }
    }
    return [...new Set(results.map(item => item.poles))];
  }

  return [];
}

// ============================================
// 캐시 상태 조회
// ============================================

export function getCacheInfo(): {
  isLoaded: boolean;
  lastLoaded?: Date;
  lsCount?: number;
  sangdoCount?: number;
  checksum?: string;
} {
  if (!cache) {
    return { isLoaded: false };
  }

  return {
    isLoaded: true,
    lastLoaded: cache.lastLoaded,
    lsCount: cache.lsMetasol.length,
    sangdoCount: cache.sangdo.length,
    checksum: cache.checksum,
  };
}

// ============================================
// 캐시 리로드
// ============================================

export function reloadSizeTables(): SizeTableCache {
  console.log('Reloading size tables...');
  cache = null;
  return loadSizeTables();
}

// ============================================
// 초기화 (서버 부팅 시)
// ============================================

export function initSizeTables(): void {
  try {
    loadSizeTables();
    console.log('Size tables initialized successfully');
  } catch (error) {
    console.error('Failed to initialize size tables:', error);
    throw error;
  }
}

// ============================================
// 테이블 체크섬 조회 (증거 서명용)
// ============================================

export function getTableHashes(): Record<string, string> {
  if (!cache) {
    loadSizeTables();
  }

  // 각 테이블별 체크섬 생성
  const lsHash = createHash('sha256')
    .update(JSON.stringify(cache!.lsMetasol))
    .digest('hex');

  const sangdoHash = createHash('sha256')
    .update(JSON.stringify(cache!.sangdo))
    .digest('hex');

  return {
    'LS_Metasol_MCCB_dimensions_by_AF_and_poles.csv': lsHash,
    'Sangdo_MCCB_dimensions_by_AF_model_poles.csv': sangdoHash,
    'cache_checksum': cache!.checksum
  };
}

// ============================================
// 현재 지식 버전 조회
// ============================================

export function getCurrentKnowledgeVersion(): {
  rules: string;
  tables: string;
} {
  // Use default values for now - this will be properly implemented in config integration
  return {
    rules: '1.0.0',
    tables: '1.0.0',
  };
}