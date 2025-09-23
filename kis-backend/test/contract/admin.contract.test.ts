import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';

/**
 * 📋 Admin API Contract Tests
 *
 * Validates admin API contracts for knowledge management:
 * - Knowledge version management
 * - CSV import/validation/activation workflow
 * - Authentication and authorization
 * - Error handling consistency
 */

describe('📋 Admin API Contract Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = build({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  const adminApiKey = 'test-api-key-123'; // Should match your admin API key

  describe('GET /v1/knowledge/versions', () => {
    it('✅ should list knowledge versions with admin API key', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/knowledge/versions',
        headers: {
          'X-API-Key': adminApiKey
        }
      });

      expect(response.statusCode).toBe(200);

      const data = JSON.parse(response.body);
      expect(Array.isArray(data)).toBe(true);

      // Contract: Each version has required fields
      if (data.length > 0) {
        const version = data[0];
        expect(version).toHaveProperty('id');
        expect(version).toHaveProperty('label');
        expect(version).toHaveProperty('active');
        expect(version).toHaveProperty('createdAt');
        expect(typeof version.active).toBe('boolean');
      }
    });

    it('❌ should reject request without admin API key', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/knowledge/versions'
      });

      expect(response.statusCode).toBe(401);

      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('MISSING_API_KEY');
    });
  });

  describe('GET /v1/knowledge/versions/active', () => {
    it('✅ should return active knowledge version', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/knowledge/versions/active',
        headers: {
          'X-API-Key': adminApiKey
        }
      });

      expect(response.statusCode).toBe(200);

      const data = JSON.parse(response.body);

      if (data) {
        // Contract: Active version structure
        expect(data).toHaveProperty('id');
        expect(data).toHaveProperty('label');
        expect(data).toHaveProperty('active');
        expect(data.active).toBe(true);
        expect(data).toHaveProperty('createdAt');
      }
    });
  });

  describe('POST /v1/knowledge/tables/import', () => {
    const testCsvData = `brand,series,model,af,poles,width_mm,height_mm,depth_mm,meta
LS,METASOL,METASOL-TEST,100,2P,105,275,103,{"series":"METASOL","type":"MCCB"}
LS,METASOL,METASOL-TEST,100,3P,158,275,103,{"series":"METASOL","type":"MCCB"}`;

    it('✅ should import CSV data to staging', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/knowledge/tables/import',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey
        },
        payload: {
          format: 'csv',
          content: testCsvData,
          versionLabel: `test-import-${Date.now()}`
        }
      });

      expect(response.statusCode).toBe(200);

      const data = JSON.parse(response.body);

      // Contract: Import response structure
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('details');
      expect(data.details).toHaveProperty('versionLabel');
      expect(data.details).toHaveProperty('rowCount');
      expect(data.details).toHaveProperty('tableCount');

      expect(typeof data.details.rowCount).toBe('number');
      expect(data.details.rowCount).toBeGreaterThan(0);
    });

    it('❌ should reject invalid CSV format', async () => {
      const invalidCsv = `invalid,header
no,required,columns`;

      const response = await app.inject({
        method: 'POST',
        url: '/v1/knowledge/tables/import',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey
        },
        payload: {
          format: 'csv',
          content: invalidCsv,
          versionLabel: `test-invalid-${Date.now()}`
        }
      });

      expect(response.statusCode).toBe(422);

      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('details');
    });

    it('❌ should reject request without admin API key', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/knowledge/tables/import',
        headers: {
          'Content-Type': 'application/json'
        },
        payload: {
          format: 'csv',
          content: testCsvData,
          versionLabel: `test-noauth-${Date.now()}`
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('❌ should reject duplicate version label', async () => {
      const versionLabel = `test-duplicate-${Date.now()}`;

      // First import
      const response1 = await app.inject({
        method: 'POST',
        url: '/v1/knowledge/tables/import',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey
        },
        payload: {
          format: 'csv',
          content: testCsvData,
          versionLabel
        }
      });

      expect(response1.statusCode).toBe(200);

      // Second import with same label
      const response2 = await app.inject({
        method: 'POST',
        url: '/v1/knowledge/tables/import',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey
        },
        payload: {
          format: 'csv',
          content: testCsvData,
          versionLabel
        }
      });

      expect(response2.statusCode).toBe(409);

      const data = JSON.parse(response2.body);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('VERSION_ALREADY_EXISTS');
    });
  });

  describe('POST /v1/knowledge/tables/validate', () => {
    it('✅ should validate staging data', async () => {
      // First import some data
      const testCsvData = `brand,series,model,af,poles,width_mm,height_mm,depth_mm,meta
LS,METASOL,METASOL-VAL,150,3P,180,275,103,{"series":"METASOL","type":"MCCB"}`;

      const importResponse = await app.inject({
        method: 'POST',
        url: '/v1/knowledge/tables/import',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey
        },
        payload: {
          format: 'csv',
          content: testCsvData,
          versionLabel: `test-validate-${Date.now()}`
        }
      });

      const importData = JSON.parse(importResponse.body);
      const versionLabel = importData.details.versionLabel;

      // Now validate
      const response = await app.inject({
        method: 'POST',
        url: '/v1/knowledge/tables/validate',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey
        },
        payload: {
          versionLabel,
          sampleSize: 1
        }
      });

      expect(response.statusCode).toBe(200);

      const data = JSON.parse(response.body);

      // Contract: Validation response structure
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('versionLabel');
      expect(data).toHaveProperty('sampleResults');
      expect(Array.isArray(data.sampleResults)).toBe(true);

      if (data.sampleResults.length > 0) {
        const sample = data.sampleResults[0];
        expect(sample).toHaveProperty('request');
        expect(sample).toHaveProperty('estimateResult');
        expect(sample).toHaveProperty('success');
      }
    });

    it('❌ should reject validation for non-existent version', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/knowledge/tables/validate',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey
        },
        payload: {
          versionLabel: 'non-existent-version',
          sampleSize: 1
        }
      });

      expect(response.statusCode).toBe(404);

      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('VERSION_NOT_FOUND');
    });
  });

  describe('POST /v1/knowledge/tables/activate', () => {
    it('✅ should activate staging version with regression tests', async () => {
      // First import and validate
      const testCsvData = `brand,series,model,af,poles,width_mm,height_mm,depth_mm,meta
LS,METASOL,METASOL-ACT,200,3P,200,275,103,{"series":"METASOL","type":"MCCB"}
SANGDO,SD,SD-ACT,100,2P,100,270,100,{"series":"SD","type":"MCCB"}`;

      const importResponse = await app.inject({
        method: 'POST',
        url: '/v1/knowledge/tables/import',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey
        },
        payload: {
          format: 'csv',
          content: testCsvData,
          versionLabel: `test-activate-${Date.now()}`
        }
      });

      const importData = JSON.parse(importResponse.body);
      const versionLabel = importData.details.versionLabel;

      // Activation with regression
      const response = await app.inject({
        method: 'POST',
        url: '/v1/knowledge/tables/activate',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey
        },
        payload: {
          versionLabel,
          runRegression: true
        }
      });

      expect(response.statusCode).toBe(200);

      const data = JSON.parse(response.body);

      // Contract: Activation response structure
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('versionLabel');
      expect(data).toHaveProperty('hotSwapSuccess');
      expect(data).toHaveProperty('regressionResult');

      expect(typeof data.hotSwapSuccess).toBe('boolean');

      if (data.regressionResult) {
        expect(data.regressionResult).toHaveProperty('totalSamples');
        expect(data.regressionResult).toHaveProperty('passedCount');
        expect(data.regressionResult).toHaveProperty('failedCount');
        expect(data.regressionResult).toHaveProperty('successRate');
      }
    });

    it('❌ should reject activation of non-existent version', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/knowledge/tables/activate',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey
        },
        payload: {
          versionLabel: 'non-existent-version',
          runRegression: false
        }
      });

      expect(response.statusCode).toBe(404);

      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('VERSION_NOT_FOUND');
    });
  });

  describe('POST /v1/knowledge/tables/rollback', () => {
    it('✅ should rollback to previous version', async () => {
      // Get current active version first
      const activeResponse = await app.inject({
        method: 'GET',
        url: '/v1/knowledge/versions/active',
        headers: {
          'X-API-Key': adminApiKey
        }
      });

      if (activeResponse.statusCode === 200) {
        const activeData = JSON.parse(activeResponse.body);

        if (activeData) {
          const response = await app.inject({
            method: 'POST',
            url: '/v1/knowledge/tables/rollback',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': adminApiKey
            },
            payload: {
              targetVersionLabel: activeData.label,
              reason: 'Contract test rollback'
            }
          });

          // Contract: Rollback should succeed or indicate no change needed
          expect([200, 409]).toContain(response.statusCode);

          const data = JSON.parse(response.body);
          expect(data).toHaveProperty('message');

          if (response.statusCode === 200) {
            expect(data).toHaveProperty('previousVersion');
            expect(data).toHaveProperty('currentVersion');
          }
        }
      }
    });

    it('❌ should reject rollback to non-existent version', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/knowledge/tables/rollback',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey
        },
        payload: {
          targetVersionLabel: 'non-existent-version',
          reason: 'Contract test'
        }
      });

      expect(response.statusCode).toBe(404);

      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('VERSION_NOT_FOUND');
    });
  });

  describe('Error Response Format Consistency', () => {
    it('❌ should have consistent error format across all endpoints', async () => {
      const endpoints = [
        { method: 'GET', url: '/v1/knowledge/versions' },
        { method: 'POST', url: '/v1/knowledge/tables/import' },
        { method: 'POST', url: '/v1/knowledge/tables/validate' },
        { method: 'POST', url: '/v1/knowledge/tables/activate' }
      ];

      for (const endpoint of endpoints) {
        const response = await app.inject({
          method: endpoint.method,
          url: endpoint.url
          // No API key - should trigger auth error
        });

        expect(response.statusCode).toBe(401);

        const data = JSON.parse(response.body);

        // Contract: Consistent error format
        expect(data).toHaveProperty('error');
        expect(data).toHaveProperty('statusCode');
        expect(data).toHaveProperty('message');
        expect(data.statusCode).toBe(401);
        expect(data.error).toBe('MISSING_API_KEY');
      }
    });
  });
});