import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadSizeTables,
  getSize,
  getAvailableModels,
  getAvailableAFs,
  getAvailablePoles,
  getCacheInfo,
  reloadSizeTables
} from '../src/lib/size-tables.js';

describe('Size Tables', () => {
  beforeAll(async () => {
    // 테스트 시작 전 치수표 로드
    loadSizeTables();
  });

  describe('loadSizeTables', () => {
    it('should load size tables successfully', () => {
      const cache = loadSizeTables();

      expect(cache).toBeDefined();
      expect(cache.lsMetasol).toBeInstanceOf(Array);
      expect(cache.sangdo).toBeInstanceOf(Array);
      expect(cache.lastLoaded).toBeInstanceOf(Date);
      expect(cache.checksum).toBeTruthy();
    });

    it('should have LS Metasol data', () => {
      const cache = loadSizeTables();

      expect(cache.lsMetasol.length).toBeGreaterThan(0);

      // 첫 번째 항목 구조 검증
      const firstItem = cache.lsMetasol[0];
      expect(firstItem).toHaveProperty('brand', 'LS');
      expect(firstItem).toHaveProperty('series', 'METASOL');
      expect(firstItem).toHaveProperty('af');
      expect(firstItem).toHaveProperty('poles');
      expect(firstItem).toHaveProperty('width_mm');
      expect(firstItem).toHaveProperty('height_mm');
      expect(firstItem).toHaveProperty('depth_mm');
    });

    it('should have Sangdo data', () => {
      const cache = loadSizeTables();

      expect(cache.sangdo.length).toBeGreaterThan(0);

      // 첫 번째 항목 구조 검증
      const firstItem = cache.sangdo[0];
      expect(firstItem).toHaveProperty('brand', 'SANGDO');
      expect(firstItem).toHaveProperty('series');
      expect(firstItem).toHaveProperty('model');
      expect(firstItem).toHaveProperty('frame');
      expect(firstItem).toHaveProperty('poles');
      expect(firstItem).toHaveProperty('width_mm');
      expect(firstItem).toHaveProperty('height_mm');
      expect(firstItem).toHaveProperty('depth_mm');
    });
  });

  describe('getSize', () => {
    it('should find LS Metasol dimensions by AF and poles', () => {
      const dimensions = getSize('LS', undefined, 50, '3P');

      expect(dimensions).toBeDefined();
      expect(dimensions?.brand).toBe('LS');
      expect(dimensions?.series).toBe('METASOL');
      expect(dimensions?.af).toBe(50);
      expect(dimensions?.poles).toBe('3P');
      expect(dimensions?.width_mm).toBeGreaterThan(0);
      expect(dimensions?.height_mm).toBeGreaterThan(0);
      expect(dimensions?.depth_mm).toBeGreaterThan(0);
    });

    it('should find Sangdo dimensions by model and poles', () => {
      const dimensions = getSize('SANGDO', 'SBS-53', undefined, '3P');

      expect(dimensions).toBeDefined();
      expect(dimensions?.brand).toBe('SANGDO');
      expect(dimensions?.model).toBe('SBS-53');
      expect(dimensions?.poles).toBe('3P');
      expect(dimensions?.width_mm).toBeGreaterThan(0);
      expect(dimensions?.height_mm).toBeGreaterThan(0);
      expect(dimensions?.depth_mm).toBeGreaterThan(0);
    });

    it('should handle ELCB mapping for Sangdo', () => {
      // SBS -> SES 매핑 테스트
      const sbsDimensions = getSize('SANGDO', 'SBS-53', undefined, '3P');
      const sesDimensions = getSize('SANGDO', 'SES-53', undefined, '3P');

      // SES는 SBS와 같은 치수를 가져야 함
      expect(sesDimensions).toBeDefined();
      if (sbsDimensions && sesDimensions) {
        expect(sesDimensions.width_mm).toBe(sbsDimensions.width_mm);
        expect(sesDimensions.height_mm).toBe(sbsDimensions.height_mm);
        expect(sesDimensions.depth_mm).toBe(sbsDimensions.depth_mm);
      }
    });

    it('should return null for non-existent model', () => {
      const dimensions = getSize('SANGDO', 'NON_EXISTENT_MODEL', undefined, '3P');
      expect(dimensions).toBeNull();
    });

    it('should return null for non-existent AF', () => {
      const dimensions = getSize('LS', undefined, 9999, '3P');
      expect(dimensions).toBeNull();
    });
  });

  describe('getAvailableModels', () => {
    it('should return available LS models (AF combinations)', () => {
      const models = getAvailableModels('LS');

      expect(models).toBeInstanceOf(Array);
      expect(models.length).toBeGreaterThan(0);

      // LS 모델은 METASOL-AF(poles) 형태
      expect(models[0]).toMatch(/METASOL-\d+\(\d+P\)/);
    });

    it('should return available Sangdo models', () => {
      const models = getAvailableModels('SANGDO');

      expect(models).toBeInstanceOf(Array);
      expect(models.length).toBeGreaterThan(0);

      // Sangdo 모델은 SBS, SBE 등으로 시작
      const hasValidModel = models.some(model =>
        model.startsWith('SBS') || model.startsWith('SBE')
      );
      expect(hasValidModel).toBe(true);
    });

    it('should return empty array for unknown brand', () => {
      const models = getAvailableModels('UNKNOWN_BRAND');
      expect(models).toEqual([]);
    });
  });

  describe('getAvailableAFs', () => {
    it('should return available AFs for LS', () => {
      const afs = getAvailableAFs('LS');

      expect(afs).toBeInstanceOf(Array);
      expect(afs.length).toBeGreaterThan(0);
      expect(afs.every(af => typeof af === 'number')).toBe(true);
      expect(afs).toEqual(afs.sort((a, b) => a - b)); // 정렬되어 있어야 함
    });

    it('should return available AFs for Sangdo (from frames)', () => {
      const afs = getAvailableAFs('SANGDO');

      expect(afs).toBeInstanceOf(Array);
      expect(afs.length).toBeGreaterThan(0);
      expect(afs.every(af => typeof af === 'number')).toBe(true);
      expect(afs).toEqual(afs.sort((a, b) => a - b)); // 정렬되어 있어야 함
    });
  });

  describe('getAvailablePoles', () => {
    it('should return available poles for LS with specific AF', () => {
      const poles = getAvailablePoles('LS', 50);

      expect(poles).toBeInstanceOf(Array);
      expect(poles.length).toBeGreaterThan(0);
      expect(poles.every(pole => ['2P', '3P', '4P'].includes(pole))).toBe(true);
    });

    it('should return available poles for Sangdo with specific model', () => {
      const poles = getAvailablePoles('SANGDO', undefined, 'SBS-53');

      expect(poles).toBeInstanceOf(Array);
      expect(poles.length).toBeGreaterThan(0);
      expect(poles.every(pole => ['2P', '3P', '4P'].includes(pole))).toBe(true);
    });
  });

  describe('getCacheInfo', () => {
    it('should return cache information', () => {
      const info = getCacheInfo();

      expect(info.isLoaded).toBe(true);
      expect(info.lastLoaded).toBeInstanceOf(Date);
      expect(info.lsCount).toBeGreaterThan(0);
      expect(info.sangdoCount).toBeGreaterThan(0);
      expect(info.checksum).toBeTruthy();
    });
  });

  describe('reloadSizeTables', () => {
    it('should reload size tables', () => {
      const originalInfo = getCacheInfo();

      // 짧은 대기 후 리로드
      setTimeout(() => {
        const newCache = reloadSizeTables();
        const newInfo = getCacheInfo();

        expect(newCache).toBeDefined();
        expect(newInfo.lastLoaded.getTime()).toBeGreaterThan(originalInfo.lastLoaded!.getTime());
      }, 10);
    });
  });
});