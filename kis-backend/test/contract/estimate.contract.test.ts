import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';

/**
 * 📋 Estimate API Contract Tests
 *
 * Validates API contracts against OpenAPI specification:
 * - Request/response schema compliance
 * - Status code accuracy
 * - Error format consistency
 * - Security header requirements
 */

describe('📋 Estimate API Contract Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = build({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/estimate/create', () => {
    it('✅ should accept valid LS MCCB request', async () => {
      const validRequest = {
        brand: 'LS',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'WALL' },
        device: { type: 'MCCB' },
        main: { model: 'METASOL-250', af: 250, poles: '3P' },
        branches: [
          { model: 'METASOL-100', af: 100, poles: '3P', qty: 2 }
        ],
        accessories: { enabled: false, items: [] }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/estimate/create',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key-123',
          'Idempotency-Key': `test-${Date.now()}`
        },
        payload: validRequest
      });

      // Contract: Status 200 for successful creation
      expect(response.statusCode).toBe(200);

      const data = JSON.parse(response.body);

      // Contract: Response schema validation
      expect(data).toHaveProperty('estimateId');
      expect(data).toHaveProperty('result');
      expect(data).toHaveProperty('evidence');
      expect(data).toHaveProperty('timestamp');

      // Contract: EstimateId format (UUID)
      expect(data.estimateId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      // Contract: Result structure
      expect(data.result).toHaveProperty('W');
      expect(data.result).toHaveProperty('H');
      expect(data.result).toHaveProperty('D');
      expect(data.result).toHaveProperty('form');

      // Contract: Evidence structure
      expect(data.evidence).toHaveProperty('estimateId');
      expect(data.evidence).toHaveProperty('signature');
      expect(data.evidence).toHaveProperty('knowledgeVersion');
    });

    it('❌ should reject request without API key', async () => {
      const validRequest = {
        brand: 'LS',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'WALL' },
        device: { type: 'MCCB' },
        main: { model: 'METASOL-250', af: 250, poles: '3P' },
        branches: [],
        accessories: { enabled: false, items: [] }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/estimate/create',
        headers: { 'Content-Type': 'application/json' },
        payload: validRequest
      });

      // Contract: 401 for missing API key
      expect(response.statusCode).toBe(401);

      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('MISSING_API_KEY');
    });

    it('❌ should reject request without Idempotency-Key', async () => {
      const validRequest = {
        brand: 'LS',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'WALL' },
        device: { type: 'MCCB' },
        main: { model: 'METASOL-250', af: 250, poles: '3P' },
        branches: [],
        accessories: { enabled: false, items: [] }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/estimate/create',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key-123'
        },
        payload: validRequest
      });

      // Contract: 400 for missing Idempotency-Key
      expect(response.statusCode).toBe(400);

      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('MISSING_IDEMPOTENCY_KEY');
    });

    it('❌ should return 422 for invalid brand', async () => {
      const invalidRequest = {
        brand: 'INVALID_BRAND',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'WALL' },
        device: { type: 'MCCB' },
        main: { model: 'METASOL-250', af: 250, poles: '3P' },
        branches: [],
        accessories: { enabled: false, items: [] }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/estimate/create',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key-123',
          'Idempotency-Key': `test-${Date.now()}`
        },
        payload: invalidRequest
      });

      // Contract: 422 for validation errors
      expect(response.statusCode).toBe(422);

      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('details');
    });

    it('✅ should handle SANGDO brand correctly', async () => {
      const sangdoRequest = {
        brand: 'SANGDO',
        form: 'STANDARD',
        installation: { location: 'OUTDOOR', mount: 'POLE' },
        device: { type: 'MCCB' },
        main: { model: 'SD-200', af: 200, poles: '3P' },
        branches: [
          { model: 'SD-100', af: 100, poles: '2P', qty: 1 }
        ],
        accessories: { enabled: true, items: [{ type: 'SURGE_PROTECTOR', qty: 1 }] }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/estimate/create',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key-123',
          'Idempotency-Key': `test-sangdo-${Date.now()}`
        },
        payload: sangdoRequest
      });

      expect(response.statusCode).toBe(200);

      const data = JSON.parse(response.body);
      expect(data.result.form).toBe('STANDARD');
    });

    it('🔄 should return same result for duplicate idempotency key', async () => {
      const request = {
        brand: 'LS',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'WALL' },
        device: { type: 'MCCB' },
        main: { model: 'METASOL-100', af: 100, poles: '3P' },
        branches: [],
        accessories: { enabled: false, items: [] }
      };

      const idempotencyKey = `test-duplicate-${Date.now()}`;

      // First request
      const response1 = await app.inject({
        method: 'POST',
        url: '/v1/estimate/create',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key-123',
          'Idempotency-Key': idempotencyKey
        },
        payload: request
      });

      expect(response1.statusCode).toBe(200);
      const data1 = JSON.parse(response1.body);

      // Second request with same idempotency key
      const response2 = await app.inject({
        method: 'POST',
        url: '/v1/estimate/create',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key-123',
          'Idempotency-Key': idempotencyKey
        },
        payload: request
      });

      expect(response2.statusCode).toBe(200);
      const data2 = JSON.parse(response2.body);

      // Contract: Same estimateId for duplicate requests
      expect(data1.estimateId).toBe(data2.estimateId);
      expect(data1.result).toEqual(data2.result);
    });
  });

  describe('GET /v1/estimate/:id', () => {
    it('✅ should retrieve existing estimate', async () => {
      // First create an estimate
      const createRequest = {
        brand: 'LS',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'WALL' },
        device: { type: 'MCCB' },
        main: { model: 'METASOL-250', af: 250, poles: '3P' },
        branches: [],
        accessories: { enabled: false, items: [] }
      };

      const createResponse = await app.inject({
        method: 'POST',
        url: '/v1/estimate/create',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key-123',
          'Idempotency-Key': `test-retrieve-${Date.now()}`
        },
        payload: createRequest
      });

      const createData = JSON.parse(createResponse.body);
      const estimateId = createData.estimateId;

      // Now retrieve it
      const response = await app.inject({
        method: 'GET',
        url: `/v1/estimate/${estimateId}`,
        headers: {
          'X-API-Key': 'test-api-key-123'
        }
      });

      // Contract: 200 for existing estimate
      expect(response.statusCode).toBe(200);

      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('estimateId');
      expect(data.estimateId).toBe(estimateId);
      expect(data).toHaveProperty('result');
      expect(data).toHaveProperty('evidence');
    });

    it('❌ should return 404 for non-existent estimate', async () => {
      const fakeId = '12345678-1234-1234-1234-123456789012';

      const response = await app.inject({
        method: 'GET',
        url: `/v1/estimate/${fakeId}`,
        headers: {
          'X-API-Key': 'test-api-key-123'
        }
      });

      // Contract: 404 for non-existent estimate
      expect(response.statusCode).toBe(404);

      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('ESTIMATE_NOT_FOUND');
    });
  });

  describe('GET /v1/evidence/:estimateId', () => {
    it('✅ should retrieve evidence for existing estimate', async () => {
      // Create estimate first
      const createRequest = {
        brand: 'LS',
        form: 'STANDARD',
        installation: { location: 'INDOOR', mount: 'WALL' },
        device: { type: 'MCCB' },
        main: { model: 'METASOL-400', af: 400, poles: '4P' },
        branches: [
          { model: 'METASOL-225', af: 225, poles: '3P', qty: 1 }
        ],
        accessories: { enabled: false, items: [] }
      };

      const createResponse = await app.inject({
        method: 'POST',
        url: '/v1/estimate/create',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key-123',
          'Idempotency-Key': `test-evidence-${Date.now()}`
        },
        payload: createRequest
      });

      const createData = JSON.parse(createResponse.body);
      const estimateId = createData.estimateId;

      // Retrieve evidence
      const response = await app.inject({
        method: 'GET',
        url: `/v1/evidence/${estimateId}`,
        headers: {
          'X-API-Key': 'test-api-key-123'
        }
      });

      expect(response.statusCode).toBe(200);

      const data = JSON.parse(response.body);

      // Contract: Evidence structure
      expect(data).toHaveProperty('estimateId');
      expect(data).toHaveProperty('rulesDoc');
      expect(data).toHaveProperty('tables');
      expect(data).toHaveProperty('brandPolicy');
      expect(data).toHaveProperty('snapshot');
      expect(data).toHaveProperty('snapshotHash');
      expect(data).toHaveProperty('signature');
      expect(data).toHaveProperty('knowledgeVersion');
      expect(data).toHaveProperty('rulesVersion');

      // Contract: Tables array structure
      expect(Array.isArray(data.tables)).toBe(true);
      if (data.tables.length > 0) {
        expect(data.tables[0]).toHaveProperty('source');
        expect(data.tables[0]).toHaveProperty('rows');
      }

      // Contract: Signature is hex string
      expect(data.signature).toMatch(/^[0-9a-f]+$/i);
    });

    it('❌ should return 404 for evidence of non-existent estimate', async () => {
      const fakeId = '12345678-1234-1234-1234-123456789012';

      const response = await app.inject({
        method: 'GET',
        url: `/v1/evidence/${fakeId}`,
        headers: {
          'X-API-Key': 'test-api-key-123'
        }
      });

      expect(response.statusCode).toBe(404);

      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('EVIDENCE_NOT_FOUND');
    });
  });

  describe('POST /v1/evidence/verify', () => {
    it('✅ should verify valid evidence signature', async () => {
      // Create estimate to get evidence
      const createRequest = {
        brand: 'LS',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'WALL' },
        device: { type: 'MCCB' },
        main: { model: 'METASOL-100', af: 100, poles: '2P' },
        branches: [],
        accessories: { enabled: false, items: [] }
      };

      const createResponse = await app.inject({
        method: 'POST',
        url: '/v1/estimate/create',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key-123',
          'Idempotency-Key': `test-verify-${Date.now()}`
        },
        payload: createRequest
      });

      const createData = JSON.parse(createResponse.body);
      const evidence = createData.evidence;

      // Verify evidence
      const response = await app.inject({
        method: 'POST',
        url: '/v1/evidence/verify',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key-123'
        },
        payload: { evidence }
      });

      expect(response.statusCode).toBe(200);

      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('valid');
      expect(data.valid).toBe(true);
      expect(data).toHaveProperty('estimateId');
      expect(data).toHaveProperty('knowledgeVersion');
    });

    it('❌ should reject evidence with invalid signature', async () => {
      const invalidEvidence = {
        estimateId: '12345678-1234-1234-1234-123456789012',
        snapshotHash: 'invalid_hash',
        signature: 'invalid_signature',
        rulesVersion: 'v1.0.0',
        knowledgeVersion: 'v2025-09-24-01',
        usedRows: []
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/evidence/verify',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key-123'
        },
        payload: { evidence: invalidEvidence }
      });

      expect(response.statusCode).toBe(200);

      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('valid');
      expect(data.valid).toBe(false);
    });
  });
});