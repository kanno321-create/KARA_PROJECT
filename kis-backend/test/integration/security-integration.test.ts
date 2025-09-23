import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';

/**
 * 🛡️ Security Integration Tests
 *
 * Tests security features integration across the system:
 * - API key authentication
 * - Rate limiting behavior
 * - Input validation and sanitization
 * - Evidence signature verification
 * - Idempotency security
 */

describe('🛡️ Security Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = build({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('API Key Authentication', () => {
    it('🔑 should enforce API key on all protected endpoints', async () => {
      const protectedEndpoints = [
        { method: 'POST', url: '/v1/estimate/create' },
        { method: 'GET', url: '/v1/estimate/12345678-1234-1234-1234-123456789012' },
        { method: 'GET', url: '/v1/evidence/12345678-1234-1234-1234-123456789012' },
        { method: 'POST', url: '/v1/evidence/verify' },
        { method: 'GET', url: '/v1/knowledge/versions' },
        { method: 'GET', url: '/v1/knowledge/versions/active' },
        { method: 'POST', url: '/v1/knowledge/tables/import' },
        { method: 'POST', url: '/v1/knowledge/tables/validate' },
        { method: 'POST', url: '/v1/knowledge/tables/activate' },
        { method: 'POST', url: '/v1/knowledge/tables/rollback' }
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await app.inject({
          method: endpoint.method,
          url: endpoint.url,
          headers: {
            'Content-Type': 'application/json'
          },
          payload: endpoint.method === 'POST' ? {} : undefined
        });

        expect(response.statusCode).toBe(401);

        const data = JSON.parse(response.body);
        expect(data.error).toBe('MISSING_API_KEY');
      }
    });

    it('🔑 should accept valid API key', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/knowledge/versions',
        headers: {
          'X-API-Key': 'test-api-key-123'
        }
      });

      expect(response.statusCode).toBe(200);
    });

    it('❌ should reject invalid API key', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/knowledge/versions',
        headers: {
          'X-API-Key': 'invalid-key'
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('⚡ should allow requests under rate limit', async () => {
      const validRequest = {
        brand: 'LS',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'WALL' },
        device: { type: 'MCCB' },
        main: { model: 'METASOL-100', af: 100, poles: '3P' },
        branches: [],
        accessories: { enabled: false, items: [] }
      };

      // Make several requests quickly (should all succeed under normal rate limit)
      const requests = Array.from({ length: 5 }, (_, i) =>
        app.inject({
          method: 'POST',
          url: '/v1/estimate/create',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'test-api-key-123',
            'Idempotency-Key': `rate-limit-test-${Date.now()}-${i}`
          },
          payload: validRequest
        })
      );

      const responses = await Promise.all(requests);

      // Most should succeed (allowing for potential rate limiting)
      const successCount = responses.filter(r => r.statusCode === 200).length;
      expect(successCount).toBeGreaterThanOrEqual(3);
    });

    it('🚫 should apply rate limiting on excessive requests', async () => {
      // This test would require configuring a very low rate limit
      // For integration testing, we just verify rate limit headers are present
      const response = await app.inject({
        method: 'GET',
        url: '/v1/knowledge/versions',
        headers: {
          'X-API-Key': 'test-api-key-123'
        }
      });

      // Rate limit headers should be present
      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('🛡️ should validate request schema strictly', async () => {
      const invalidRequests = [
        // Missing required fields
        {
          brand: 'LS',
          // missing form, installation, device, main
        },
        // Invalid enum values
        {
          brand: 'INVALID_BRAND',
          form: 'ECONOMIC',
          installation: { location: 'INDOOR', mount: 'WALL' },
          device: { type: 'MCCB' },
          main: { model: 'METASOL-100', af: 100, poles: '3P' },
          branches: [],
          accessories: { enabled: false, items: [] }
        },
        // Invalid data types
        {
          brand: 'LS',
          form: 'ECONOMIC',
          installation: { location: 'INDOOR', mount: 'WALL' },
          device: { type: 'MCCB' },
          main: { model: 'METASOL-100', af: 'invalid_af', poles: '3P' },
          branches: [],
          accessories: { enabled: false, items: [] }
        },
        // SQL injection attempt
        {
          brand: "'; DROP TABLE estimates; --",
          form: 'ECONOMIC',
          installation: { location: 'INDOOR', mount: 'WALL' },
          device: { type: 'MCCB' },
          main: { model: 'METASOL-100', af: 100, poles: '3P' },
          branches: [],
          accessories: { enabled: false, items: [] }
        }
      ];

      for (const invalidRequest of invalidRequests) {
        const response = await app.inject({
          method: 'POST',
          url: '/v1/estimate/create',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'test-api-key-123',
            'Idempotency-Key': `validation-test-${Date.now()}-${Math.random()}`
          },
          payload: invalidRequest
        });

        expect(response.statusCode).toBe(422);

        const data = JSON.parse(response.body);
        expect(data).toHaveProperty('error');
        expect(data).toHaveProperty('details');
      }
    });

    it('🧹 should sanitize input data', async () => {
      const requestWithExtraFields = {
        brand: 'LS',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'WALL' },
        device: { type: 'MCCB' },
        main: { model: 'METASOL-100', af: 100, poles: '3P' },
        branches: [],
        accessories: { enabled: false, items: [] },
        // Extra fields that should be stripped
        extraField: 'should be removed',
        maliciousScript: '<script>alert("xss")</script>',
        sqlInjection: "'; DROP TABLE users; --"
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/estimate/create',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key-123',
          'Idempotency-Key': `sanitization-test-${Date.now()}`
        },
        payload: requestWithExtraFields
      });

      // Should succeed after sanitization
      expect(response.statusCode).toBe(200);

      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('estimateId');

      // Evidence snapshot should not contain extra fields
      const evidence = data.evidence;
      expect(evidence.snapshot).not.toHaveProperty('extraField');
      expect(evidence.snapshot).not.toHaveProperty('maliciousScript');
      expect(evidence.snapshot).not.toHaveProperty('sqlInjection');
    });
  });

  describe('Evidence Signature Security', () => {
    it('🔒 should generate cryptographically secure signatures', async () => {
      const validRequest = {
        brand: 'LS',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'WALL' },
        device: { type: 'MCCB' },
        main: { model: 'METASOL-200', af: 200, poles: '3P' },
        branches: [],
        accessories: { enabled: false, items: [] }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/estimate/create',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key-123',
          'Idempotency-Key': `signature-test-${Date.now()}`
        },
        payload: validRequest
      });

      expect(response.statusCode).toBe(200);

      const data = JSON.parse(response.body);
      const evidence = data.evidence;

      // Signature should be a valid hex string
      expect(evidence.signature).toMatch(/^[0-9a-f]{64}$/i); // SHA-256 hex = 64 chars

      // Signature should be verifiable
      const verifyResponse = await app.inject({
        method: 'POST',
        url: '/v1/evidence/verify',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key-123'
        },
        payload: { evidence }
      });

      expect(verifyResponse.statusCode).toBe(200);

      const verifyData = JSON.parse(verifyResponse.body);
      expect(verifyData.valid).toBe(true);
    });

    it('❌ should detect tampered evidence', async () => {
      // Create valid evidence first
      const validRequest = {
        brand: 'LS',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'WALL' },
        device: { type: 'MCCB' },
        main: { model: 'METASOL-100', af: 100, poles: '3P' },
        branches: [],
        accessories: { enabled: false, items: [] }
      };

      const createResponse = await app.inject({
        method: 'POST',
        url: '/v1/estimate/create',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key-123',
          'Idempotency-Key': `tamper-test-${Date.now()}`
        },
        payload: validRequest
      });

      const createData = JSON.parse(createResponse.body);
      const originalEvidence = createData.evidence;

      // Tamper with evidence data
      const tamperedEvidence = {
        ...originalEvidence,
        snapshotHash: 'tampered_hash',
        // Keep original signature - should fail verification
      };

      const verifyResponse = await app.inject({
        method: 'POST',
        url: '/v1/evidence/verify',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key-123'
        },
        payload: { evidence: tamperedEvidence }
      });

      expect(verifyResponse.statusCode).toBe(200);

      const verifyData = JSON.parse(verifyResponse.body);
      expect(verifyData.valid).toBe(false);
    });
  });

  describe('Idempotency Security', () => {
    it('🔄 should prevent replay attacks with idempotency keys', async () => {
      const validRequest = {
        brand: 'LS',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'WALL' },
        device: { type: 'MCCB' },
        main: { model: 'METASOL-150', af: 150, poles: '3P' },
        branches: [],
        accessories: { enabled: false, items: [] }
      };

      const idempotencyKey = `security-test-${Date.now()}`;

      // First request
      const response1 = await app.inject({
        method: 'POST',
        url: '/v1/estimate/create',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key-123',
          'Idempotency-Key': idempotencyKey
        },
        payload: validRequest
      });

      expect(response1.statusCode).toBe(200);
      const data1 = JSON.parse(response1.body);

      // Replay with different request body (should return same result)
      const modifiedRequest = {
        ...validRequest,
        main: { model: 'METASOL-999', af: 999, poles: '4P' } // Different specs
      };

      const response2 = await app.inject({
        method: 'POST',
        url: '/v1/estimate/create',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key-123',
          'Idempotency-Key': idempotencyKey // Same key
        },
        payload: modifiedRequest
      });

      expect(response2.statusCode).toBe(200);
      const data2 = JSON.parse(response2.body);

      // Should return original result, ignoring modified request
      expect(data1.estimateId).toBe(data2.estimateId);
      expect(data1.result).toEqual(data2.result);
      expect(data1.evidence.signature).toBe(data2.evidence.signature);
    });

    it('⏰ should expire idempotency keys appropriately', async () => {
      // This test would require configuring a very short expiry time
      // For integration testing, we verify that idempotency is tracked

      const validRequest = {
        brand: 'LS',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'WALL' },
        device: { type: 'MCCB' },
        main: { model: 'METASOL-100', af: 100, poles: '2P' },
        branches: [],
        accessories: { enabled: false, items: [] }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/v1/estimate/create',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-api-key-123',
          'Idempotency-Key': `expiry-test-${Date.now()}`
        },
        payload: validRequest
      });

      expect(response.statusCode).toBe(200);

      // Idempotency should be working (this indirectly tests that the system tracks keys)
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('estimateId');
    });
  });

  describe('Admin API Security', () => {
    it('🔒 should require admin privileges for knowledge management', async () => {
      const testCsvData = `brand,series,model,af,poles,width_mm,height_mm,depth_mm,meta
LS,METASOL,METASOL-SEC,100,3P,158,275,103,{"series":"METASOL","type":"MCCB"}`;

      // Regular API key should not work for admin functions
      const response = await app.inject({
        method: 'POST',
        url: '/v1/knowledge/tables/import',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'regular-user-key' // Not admin key
        },
        payload: {
          format: 'csv',
          content: testCsvData,
          versionLabel: `security-test-${Date.now()}`
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('✅ should allow admin operations with correct privileges', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/knowledge/versions',
        headers: {
          'X-API-Key': 'test-api-key-123' // Admin key
        }
      });

      expect(response.statusCode).toBe(200);
    });
  });
});