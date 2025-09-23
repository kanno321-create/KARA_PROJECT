import { describe, it, expect, beforeAll } from 'vitest';
import {
  validateSingleBrand,
  detectModelBrand,
  validate3Gates,
  validateDeviceType,
  validatePoles,
  validateEconomicDefault,
  validateModelExists,
  validateBrandRules
} from '../src/lib/brand-rules.js';
import { loadSizeTables } from '../src/lib/size-tables.js';
import { KISError } from '../src/lib/errors.js';
import type { EstimateRequest } from '../src/lib/validators.js';

describe('Brand Rules', () => {
  beforeAll(async () => {
    // 테스트 시작 전 치수표 로드
    loadSizeTables();
  });

  describe('detectModelBrand', () => {
    it('should detect SANGDO brand from SBS models', () => {
      expect(detectModelBrand('SBS-53')).toBe('SANGDO');
      expect(detectModelBrand('sbs-104')).toBe('SANGDO');
    });

    it('should detect SANGDO brand from SBE models', () => {
      expect(detectModelBrand('SBE-103')).toBe('SANGDO');
      expect(detectModelBrand('sbe-204')).toBe('SANGDO');
    });

    it('should detect SANGDO brand from SES models', () => {
      expect(detectModelBrand('SES-53')).toBe('SANGDO');
      expect(detectModelBrand('ses-104')).toBe('SANGDO');
    });

    it('should detect SANGDO brand from SEE models', () => {
      expect(detectModelBrand('SEE-103')).toBe('SANGDO');
      expect(detectModelBrand('see-204')).toBe('SANGDO');
    });

    it('should detect LS brand from METASOL models', () => {
      expect(detectModelBrand('METASOL-50')).toBe('LS');
      expect(detectModelBrand('metasol-100')).toBe('LS');
    });

    it('should detect LS brand from LS- models', () => {
      expect(detectModelBrand('LS-50')).toBe('LS');
      expect(detectModelBrand('ls-100')).toBe('LS');
    });

    it('should return null for unknown models', () => {
      expect(detectModelBrand('UNKNOWN-MODEL')).toBeNull();
      expect(detectModelBrand('ABC-123')).toBeNull();
    });
  });

  describe('validateSingleBrand', () => {
    it('should pass for consistent SANGDO brand', () => {
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

      expect(() => validateSingleBrand(request)).not.toThrow();
    });

    it('should pass for consistent LS brand', () => {
      const request: EstimateRequest = {
        brand: 'LS',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { model: 'METASOL-100', poles: '3P' },
        branches: [
          { model: 'METASOL-50', poles: '3P', qty: 2 },
          { af: 225, poles: '4P', qty: 1 },
        ],
        accessories: { enabled: false },
      };

      expect(() => validateSingleBrand(request)).not.toThrow();
    });

    it('should skip validation for MIXED brand', () => {
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

      expect(() => validateSingleBrand(request)).not.toThrow();
    });

    it('should throw error for brand conflict in main breaker', () => {
      const request: EstimateRequest = {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { model: 'METASOL-100', poles: '3P' }, // LS 모델
        branches: [
          { model: 'SBS-104', poles: '4P', qty: 1 },
        ],
        accessories: { enabled: false },
      };

      expect(() => validateSingleBrand(request)).toThrow(KISError);
    });

    it('should throw error for brand conflict in branch breaker', () => {
      const request: EstimateRequest = {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { model: 'SBS-53', poles: '3P' },
        branches: [
          { model: 'SBS-104', poles: '4P', qty: 1 },
          { model: 'METASOL-50', poles: '3P', qty: 1 }, // LS 모델
        ],
        accessories: { enabled: false },
      };

      expect(() => validateSingleBrand(request)).toThrow(KISError);
    });
  });

  describe('validate3Gates', () => {
    it('should pass for complete 3-gate request', () => {
      const request: EstimateRequest = {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { model: 'SBS-53', poles: '3P' },
        branches: [
          { model: 'SBS-104', poles: '4P', qty: 2 },
        ],
        accessories: { enabled: true, items: [{ name: 'Terminal', qty: 1 }] },
      };

      expect(() => validate3Gates(request)).not.toThrow();
    });

    it('should pass for accessories disabled', () => {
      const request: EstimateRequest = {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { af: 100, poles: '3P' },
        branches: [
          { af: 50, poles: '3P', qty: 2 },
        ],
        accessories: { enabled: false },
      };

      expect(() => validate3Gates(request)).not.toThrow();
    });

    it('should throw error for missing main model/af', () => {
      const request: EstimateRequest = {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { poles: '3P' }, // model과 af가 모두 없음
        branches: [
          { model: 'SBS-104', poles: '4P', qty: 1 },
        ],
        accessories: { enabled: false },
      };

      expect(() => validate3Gates(request)).toThrow(KISError);
    });

    it('should throw error for missing main poles', () => {
      const request: EstimateRequest = {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { model: 'SBS-53' } as any, // poles 없음
        branches: [
          { model: 'SBS-104', poles: '4P', qty: 1 },
        ],
        accessories: { enabled: false },
      };

      expect(() => validate3Gates(request)).toThrow(KISError);
    });

    it('should throw error for empty branches', () => {
      const request: EstimateRequest = {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { model: 'SBS-53', poles: '3P' },
        branches: [], // 빈 배열
        accessories: { enabled: false },
      };

      expect(() => validate3Gates(request)).toThrow(KISError);
    });

    it('should throw error for accessories enabled but no items', () => {
      const request: EstimateRequest = {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { model: 'SBS-53', poles: '3P' },
        branches: [
          { model: 'SBS-104', poles: '4P', qty: 1 },
        ],
        accessories: { enabled: true }, // items 없음
      };

      expect(() => validate3Gates(request)).toThrow(KISError);
    });
  });

  describe('validateDeviceType', () => {
    it('should pass for MCCB with SBS models', () => {
      const request: EstimateRequest = {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { model: 'SBS-53', poles: '3P' },
        branches: [
          { model: 'SBE-104', poles: '4P', qty: 1 },
        ],
        accessories: { enabled: false },
      };

      expect(() => validateDeviceType(request)).not.toThrow();
    });

    it('should pass for ELCB with SES models', () => {
      const request: EstimateRequest = {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'ELCB' },
        main: { model: 'SES-53', poles: '3P' },
        branches: [
          { model: 'SEE-104', poles: '4P', qty: 1 },
        ],
        accessories: { enabled: false },
      };

      expect(() => validateDeviceType(request)).not.toThrow();
    });

    it('should pass for LS METASOL with MCCB', () => {
      const request: EstimateRequest = {
        brand: 'LS',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { model: 'METASOL-100', poles: '3P' },
        branches: [
          { af: 50, poles: '3P', qty: 1 },
        ],
        accessories: { enabled: false },
      };

      expect(() => validateDeviceType(request)).not.toThrow();
    });

    it('should throw error for MCCB with SES models', () => {
      const request: EstimateRequest = {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' }, // MCCB
        main: { model: 'SES-53', poles: '3P' }, // SES는 ELCB
        branches: [
          { model: 'SBS-104', poles: '4P', qty: 1 },
        ],
        accessories: { enabled: false },
      };

      expect(() => validateDeviceType(request)).toThrow(KISError);
    });

    it('should throw error for ELCB with SBS models', () => {
      const request: EstimateRequest = {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'ELCB' }, // ELCB
        main: { model: 'SBS-53', poles: '3P' }, // SBS는 MCCB
        branches: [
          { model: 'SES-104', poles: '4P', qty: 1 },
        ],
        accessories: { enabled: false },
      };

      expect(() => validateDeviceType(request)).toThrow(KISError);
    });
  });

  describe('validateModelExists', () => {
    it('should return true for existing Sangdo models', () => {
      expect(validateModelExists('SANGDO', 'SBS-53')).toBe(true);
      expect(validateModelExists('SANGDO', 'SBE-103')).toBe(true);
    });

    it('should return true for ELCB models (mapped to MCCB)', () => {
      // SES-53은 SBS-53과 치수가 동일하므로 존재한다고 판단
      expect(validateModelExists('SANGDO', 'SES-53')).toBe(true);
      expect(validateModelExists('SANGDO', 'SEE-103')).toBe(true);
    });

    it('should return false for non-existent models', () => {
      expect(validateModelExists('SANGDO', 'NON-EXISTENT')).toBe(false);
      expect(validateModelExists('LS', 'INVALID-MODEL')).toBe(false);
    });
  });

  describe('validateBrandRules', () => {
    it('should pass complete validation for valid request', () => {
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
        accessories: { enabled: true, items: [{ name: 'Terminal', qty: 1 }] },
      };

      expect(() => validateBrandRules(request)).not.toThrow();
    });

    it('should throw error for any validation failure', () => {
      const request: EstimateRequest = {
        brand: 'SANGDO',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'FLUSH' },
        device: { type: 'MCCB' },
        main: { model: 'METASOL-100', poles: '3P' }, // 브랜드 충돌
        branches: [
          { model: 'SBS-104', poles: '4P', qty: 1 },
        ],
        accessories: { enabled: false },
      };

      expect(() => validateBrandRules(request)).toThrow(KISError);
    });
  });
});