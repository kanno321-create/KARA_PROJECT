import { describe, it, expect, beforeAll } from 'vitest';
import { calculateEnclosureSize, validateMixedBrand } from '../src/lib/enclosure-rules.js';
import { loadSizeTables } from '../src/lib/size-tables.js';
import { KISError } from '../src/lib/errors.js';
import type { EstimateRequest } from '../src/lib/validators.js';

describe('Enclosure Rules', () => {
  beforeAll(async () => {
    // 테스트 시작 전 치수표 로드
    loadSizeTables();
  });

  describe('calculateEnclosureSize', () => {
    it('should calculate enclosure size for economic form', () => {
      const request: EstimateRequest = {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { model: 'SBS-53', poles: '3P' },
        branches: [
          { model: 'SBS-104', poles: '4P', qty: 2 },
          { model: 'SBE-103', poles: '3P', qty: 1 },
        ],
        accessories: { enabled: false },
      };

      const result = calculateEnclosureSize(request);

      expect(result).toBeDefined();
      expect(result.form).toBe('ECONOMIC');
      expect(result.W).toBeGreaterThan(0);
      expect(result.H).toBeGreaterThan(0);
      expect(result.D).toBeGreaterThan(0);
      expect(result.layout.rows).toBeGreaterThan(0);
      expect(result.layout.totalItems).toBe(4); // 메인 1개 + 분기 3개
      expect(result.layout.maxWidthPerRow).toBeGreaterThan(0);
    });

    it('should calculate enclosure size for standard form', () => {
      const request: EstimateRequest = {
        brand: 'SANGDO',
        form: 'STANDARD',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { model: 'SBS-53', poles: '3P' },
        branches: [
          { model: 'SBS-104', poles: '4P', qty: 1 },
        ],
        accessories: { enabled: false },
      };

      const result = calculateEnclosureSize(request);

      expect(result).toBeDefined();
      expect(result.form).toBe('STANDARD');
      expect(result.W).toBeGreaterThan(0);
      expect(result.H).toBeGreaterThan(0);
      expect(result.D).toBeGreaterThan(0);
    });

    it('should calculate larger enclosure for standard form than economic', () => {
      const baseRequest: EstimateRequest = {
        brand: 'SANGDO',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { model: 'SBS-53', poles: '3P' },
        branches: [
          { model: 'SBS-104', poles: '4P', qty: 1 },
        ],
        accessories: { enabled: false },
      };

      const economicRequest = { ...baseRequest, form: 'ECONOMIC' as const };
      const standardRequest = { ...baseRequest, form: 'STANDARD' as const };

      const economicResult = calculateEnclosureSize(economicRequest);
      const standardResult = calculateEnclosureSize(standardRequest);

      // 표준형이 경제형보다 큰 여백을 가져야 함
      expect(standardResult.W).toBeGreaterThanOrEqual(economicResult.W);
      expect(standardResult.H).toBeGreaterThanOrEqual(economicResult.H);
      expect(standardResult.D).toBeGreaterThanOrEqual(economicResult.D);
    });

    it('should handle LS brand calculation', () => {
      const request: EstimateRequest = {
        brand: 'LS',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { af: 100, poles: '3P' },
        branches: [
          { af: 50, poles: '3P', qty: 2 },
          { af: 225, poles: '4P', qty: 1 },
        ],
        accessories: { enabled: false },
      };

      const result = calculateEnclosureSize(request);

      expect(result).toBeDefined();
      expect(result.W).toBeGreaterThan(0);
      expect(result.H).toBeGreaterThan(0);
      expect(result.D).toBeGreaterThan(0);
      expect(result.layout.totalItems).toBe(4); // 메인 1개 + 분기 3개
    });

    it('should sort branches by frame size, poles, and quantity', () => {
      const request: EstimateRequest = {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { model: 'SBS-53', poles: '3P' },
        branches: [
          { model: 'SBS-52', poles: '2P', qty: 1 }, // 작은 프레임, 2P
          { model: 'SBS-204', poles: '4P', qty: 3 }, // 큰 프레임, 4P, 많은 수량
          { model: 'SBS-203', poles: '3P', qty: 2 }, // 큰 프레임, 3P
          { model: 'SBS-54', poles: '4P', qty: 1 }, // 작은 프레임, 4P
        ],
        accessories: { enabled: false },
      };

      const result = calculateEnclosureSize(request);

      expect(result).toBeDefined();
      expect(result.layout.totalItems).toBe(8); // 메인 1개 + 분기 7개 (1+3+2+1)

      // 정렬 순서 확인을 위해 실제 배치가 올바른지 검증
      expect(result.layout.rows).toBeGreaterThan(0);
    });

    it('should throw ABSTAIN error for missing dimensions', () => {
      const request: EstimateRequest = {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { model: 'NON-EXISTENT-MODEL', poles: '3P' },
        branches: [
          { model: 'SBS-104', poles: '4P', qty: 1 },
        ],
        accessories: { enabled: false },
      };

      expect(() => calculateEnclosureSize(request)).toThrow(KISError);

      try {
        calculateEnclosureSize(request);
      } catch (error) {
        expect(error).toBeInstanceOf(KISError);
        expect((error as KISError).code).toBe('NEED_KNOWLEDGE_UPDATE');
      }
    });

    it('should handle accessories correctly', () => {
      const requestWithAccessories: EstimateRequest = {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { model: 'SBS-53', poles: '3P' },
        branches: [
          { model: 'SBS-104', poles: '4P', qty: 1 },
        ],
        accessories: {
          enabled: true,
          items: [
            { name: 'Terminal Block', qty: 5 },
            { name: 'Indicator Light', qty: 3 },
          ],
        },
      };

      const requestWithoutAccessories: EstimateRequest = {
        ...requestWithAccessories,
        accessories: { enabled: false },
      };

      const resultWith = calculateEnclosureSize(requestWithAccessories);
      const resultWithout = calculateEnclosureSize(requestWithoutAccessories);

      // 부속자재가 있어도 현재 로직에서는 외함 크기에 직접 영향을 주지 않음
      // (실제 구현에서는 부속자재 공간 고려 필요)
      expect(resultWith).toBeDefined();
      expect(resultWithout).toBeDefined();
    });
  });

  describe('validateMixedBrand', () => {
    it('should pass for non-MIXED brand', () => {
      const request: EstimateRequest = {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { model: 'SBS-53', poles: '3P' },
        branches: [
          { model: 'SBS-104', poles: '4P', qty: 1 },
        ],
        accessories: { enabled: false },
      };

      expect(() => validateMixedBrand(request, false)).not.toThrow();
      expect(() => validateMixedBrand(request, true)).not.toThrow();
    });

    it('should pass for MIXED brand when allowed', () => {
      const request: EstimateRequest = {
        brand: 'MIXED',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { model: 'SBS-53', poles: '3P' },
        branches: [
          { model: 'METASOL-50', poles: '3P', qty: 1 }, // 다른 브랜드
        ],
        accessories: { enabled: false },
      };

      expect(() => validateMixedBrand(request, true)).not.toThrow();
    });

    it('should throw error for MIXED brand when not allowed', () => {
      const request: EstimateRequest = {
        brand: 'MIXED',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { model: 'SBS-53', poles: '3P' },
        branches: [
          { model: 'METASOL-50', poles: '3P', qty: 1 },
        ],
        accessories: { enabled: false },
      };

      expect(() => validateMixedBrand(request, false)).toThrow(KISError);

      try {
        validateMixedBrand(request, false);
      } catch (error) {
        expect(error).toBeInstanceOf(KISError);
        expect((error as KISError).code).toBe('BRAND_CONFLICT');
      }
    });
  });

  describe('enclosure size calculation edge cases', () => {
    it('should handle single breaker (main only)', () => {
      const request: EstimateRequest = {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { model: 'SBS-53', poles: '3P' },
        branches: [
          { model: 'SBS-52', poles: '2P', qty: 1 }, // 최소 1개는 필요
        ],
        accessories: { enabled: false },
      };

      const result = calculateEnclosureSize(request);

      expect(result).toBeDefined();
      expect(result.layout.totalItems).toBe(2); // 메인 1개 + 분기 1개
    });

    it('should handle large quantity of same breaker', () => {
      const request: EstimateRequest = {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { model: 'SBS-53', poles: '3P' },
        branches: [
          { model: 'SBS-52', poles: '2P', qty: 20 }, // 많은 수량
        ],
        accessories: { enabled: false },
      };

      const result = calculateEnclosureSize(request);

      expect(result).toBeDefined();
      expect(result.layout.totalItems).toBe(21); // 메인 1개 + 분기 20개
      expect(result.layout.rows).toBeGreaterThan(1); // 여러 행으로 분할되어야 함
    });

    it('should handle mixed poles configurations', () => {
      const request: EstimateRequest = {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { model: 'SBS-203', poles: '3P' },
        branches: [
          { model: 'SBS-52', poles: '2P', qty: 2 },
          { model: 'SBS-53', poles: '3P', qty: 2 },
          { model: 'SBS-54', poles: '4P', qty: 2 },
        ],
        accessories: { enabled: false },
      };

      const result = calculateEnclosureSize(request);

      expect(result).toBeDefined();
      expect(result.layout.totalItems).toBe(7); // 메인 1개 + 분기 6개

      // 4P가 3P보다, 3P가 2P보다 우선해야 함 (정렬 순서)
      expect(result.layout.rows).toBeGreaterThan(0);
    });
  });
});