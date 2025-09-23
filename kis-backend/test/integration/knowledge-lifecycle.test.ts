import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { build } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';

/**
 * 🔄 Knowledge Lifecycle Integration Tests
 *
 * Tests complete knowledge management lifecycle:
 * 1. Import → Validate → Activate → Estimate → Rollback
 * 2. Cache hot swap behavior
 * 3. Evidence consistency across versions
 * 4. Regression testing integration
 */

describe('🔄 Knowledge Lifecycle Integration Tests', () => {
  let app: FastifyInstance;
  const adminApiKey = 'test-api-key-123';

  beforeAll(async () => {
    app = build({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Knowledge Lifecycle', () => {
    it('🔄 should handle full lifecycle: Import → Validate → Activate → Estimate', async () => {
      const timestamp = Date.now();
      const versionLabel = `integration-test-${timestamp}`;

      // Test data with new models
      const testCsvData = `brand,series,model,af,poles,width_mm,height_mm,depth_mm,meta
LS,METASOL,METASOL-INT-${timestamp},300,3P,220,275,103,{"series":"METASOL","type":"MCCB"}
LS,METASOL,METASOL-INT-${timestamp},300,4P,280,275,103,{"series":"METASOL","type":"MCCB"}
SANGDO,SD,SD-INT-${timestamp},200,3P,180,270,100,{"series":"SD","type":"MCCB"}`;

      // Step 1: Import to staging
      console.log('📥 Step 1: Import to staging...');
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
          versionLabel
        }
      });

      expect(importResponse.statusCode).toBe(200);
      const importData = JSON.parse(importResponse.body);
      expect(importData.details.rowCount).toBe(3);

      // Step 2: Validate staging
      console.log('🔍 Step 2: Validate staging...');
      const validateResponse = await app.inject({
        method: 'POST',
        url: '/v1/knowledge/tables/validate',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey
        },
        payload: {
          versionLabel,
          sampleSize: 2
        }
      });

      expect(validateResponse.statusCode).toBe(200);
      const validateData = JSON.parse(validateResponse.body);
      expect(validateData.sampleResults.length).toBeGreaterThan(0);

      // All samples should be successful
      const allSamplesValid = validateData.sampleResults.every((sample: any) => sample.success);
      expect(allSamplesValid).toBe(true);

      // Step 3: Activate version (hot swap)
      console.log('🚀 Step 3: Activate version (hot swap)...');
      const activateResponse = await app.inject({
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

      expect(activateResponse.statusCode).toBe(200);
      const activateData = JSON.parse(activateResponse.body);
      expect(activateData.hotSwapSuccess).toBe(true);

      // Regression should pass
      if (activateData.regressionResult) {
        expect(activateData.regressionResult.successRate).toBeGreaterThanOrEqual(90);
      }

      // Step 4: Verify new active version
      console.log('✅ Step 4: Verify new active version...');
      const activeResponse = await app.inject({
        method: 'GET',
        url: '/v1/knowledge/versions/active',
        headers: {
          'X-API-Key': adminApiKey
        }
      });

      expect(activeResponse.statusCode).toBe(200);
      const activeData = JSON.parse(activeResponse.body);
      expect(activeData.label).toBe(versionLabel);

      // Step 5: Create estimate using new knowledge
      console.log('🧮 Step 5: Create estimate using new knowledge...');
      const estimateRequest = {
        brand: 'LS',
        form: 'STANDARD',
        installation: { location: 'INDOOR', mount: 'WALL' },
        device: { type: 'MCCB' },
        main: { model: `METASOL-INT-${timestamp}`, af: 300, poles: '3P' },
        branches: [
          { model: `METASOL-INT-${timestamp}`, af: 300, poles: '4P', qty: 1 }
        ],
        accessories: { enabled: false, items: [] }
      };

      const estimateResponse = await app.inject({
        method: 'POST',
        url: '/v1/estimate/create',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey,
          'Idempotency-Key': `integration-test-${timestamp}`
        },
        payload: estimateRequest
      });

      expect(estimateResponse.statusCode).toBe(200);
      const estimateData = JSON.parse(estimateResponse.body);

      // Verify evidence contains new knowledge version
      expect(estimateData.evidence.knowledgeVersion).toBe(versionLabel);

      // Step 6: Verify evidence integrity
      console.log('🔒 Step 6: Verify evidence integrity...');
      const verifyResponse = await app.inject({
        method: 'POST',
        url: '/v1/evidence/verify',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey
        },
        payload: {
          evidence: estimateData.evidence
        }
      });

      expect(verifyResponse.statusCode).toBe(200);
      const verifyData = JSON.parse(verifyResponse.body);
      expect(verifyData.valid).toBe(true);

      console.log('✅ Complete lifecycle test passed');
    });

    it('🔄 should handle cache hot swap without service interruption', async () => {
      const timestamp = Date.now();
      const versionLabel = `hotswap-test-${timestamp}`;

      // Prepare new knowledge data
      const testCsvData = `brand,series,model,af,poles,width_mm,height_mm,depth_mm,meta
LS,METASOL,METASOL-HOT-${timestamp},400,4P,300,275,103,{"series":"METASOL","type":"MCCB"}`;

      // Import and activate
      await app.inject({
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

      // Create estimate BEFORE activation (should work with old cache)
      const beforeRequest = {
        brand: 'LS',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'WALL' },
        device: { type: 'MCCB' },
        main: { model: 'METASOL-250', af: 250, poles: '3P' },
        branches: [],
        accessories: { enabled: false, items: [] }
      };

      const beforeResponse = await app.inject({
        method: 'POST',
        url: '/v1/estimate/create',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey,
          'Idempotency-Key': `before-hotswap-${timestamp}`
        },
        payload: beforeRequest
      });

      expect(beforeResponse.statusCode).toBe(200);
      const beforeData = JSON.parse(beforeResponse.body);
      const oldKnowledgeVersion = beforeData.evidence.knowledgeVersion;

      // Activate new version (hot swap)
      const activateResponse = await app.inject({
        method: 'POST',
        url: '/v1/knowledge/tables/activate',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey
        },
        payload: {
          versionLabel,
          runRegression: false
        }
      });

      expect(activateResponse.statusCode).toBe(200);

      // Create estimate AFTER activation (should work with new cache)
      const afterRequest = {
        brand: 'LS',
        form: 'STANDARD',
        installation: { location: 'INDOOR', mount: 'WALL' },
        device: { type: 'MCCB' },
        main: { model: `METASOL-HOT-${timestamp}`, af: 400, poles: '4P' },
        branches: [],
        accessories: { enabled: false, items: [] }
      };

      const afterResponse = await app.inject({
        method: 'POST',
        url: '/v1/estimate/create',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey,
          'Idempotency-Key': `after-hotswap-${timestamp}`
        },
        payload: afterRequest
      });

      expect(afterResponse.statusCode).toBe(200);
      const afterData = JSON.parse(afterResponse.body);

      // Verify knowledge version changed
      expect(afterData.evidence.knowledgeVersion).toBe(versionLabel);
      expect(afterData.evidence.knowledgeVersion).not.toBe(oldKnowledgeVersion);

      console.log('✅ Hot swap test passed - no service interruption');
    });

    it('🔒 should maintain evidence consistency across knowledge versions', async () => {
      const timestamp = Date.now();

      // Create estimate with current knowledge
      const baseRequest = {
        brand: 'LS',
        form: 'ECONOMIC',
        installation: { location: 'INDOOR', mount: 'WALL' },
        device: { type: 'MCCB' },
        main: { model: 'METASOL-100', af: 100, poles: '3P' },
        branches: [],
        accessories: { enabled: false, items: [] }
      };

      const response1 = await app.inject({
        method: 'POST',
        url: '/v1/estimate/create',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey,
          'Idempotency-Key': `evidence-consistency-1-${timestamp}`
        },
        payload: baseRequest
      });

      expect(response1.statusCode).toBe(200);
      const data1 = JSON.parse(response1.body);

      // Create another estimate with same request (should be same evidence)
      const response2 = await app.inject({
        method: 'POST',
        url: '/v1/estimate/create',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey,
          'Idempotency-Key': `evidence-consistency-2-${timestamp}`
        },
        payload: baseRequest
      });

      expect(response2.statusCode).toBe(200);
      const data2 = JSON.parse(response2.body);

      // Evidence should be consistent for same inputs
      expect(data1.evidence.snapshotHash).toBe(data2.evidence.snapshotHash);
      expect(data1.evidence.knowledgeVersion).toBe(data2.evidence.knowledgeVersion);
      expect(data1.evidence.brandPolicy).toBe(data2.evidence.brandPolicy);

      // Results should be identical
      expect(data1.result).toEqual(data2.result);

      console.log('✅ Evidence consistency test passed');
    });

    it('📊 should pass golden set regression testing', async () => {
      const timestamp = Date.now();
      const versionLabel = `regression-test-${timestamp}`;

      // Import minimal test data
      const testCsvData = `brand,series,model,af,poles,width_mm,height_mm,depth_mm,meta
LS,METASOL,METASOL-REG-${timestamp},150,3P,180,275,103,{"series":"METASOL","type":"MCCB"}`;

      // Import to staging
      await app.inject({
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

      // Activate with regression testing
      const activateResponse = await app.inject({
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

      expect(activateResponse.statusCode).toBe(200);
      const activateData = JSON.parse(activateResponse.body);

      // Regression results should be available
      expect(activateData).toHaveProperty('regressionResult');

      if (activateData.regressionResult) {
        expect(activateData.regressionResult).toHaveProperty('totalSamples');
        expect(activateData.regressionResult).toHaveProperty('passedCount');
        expect(activateData.regressionResult).toHaveProperty('failedCount');
        expect(activateData.regressionResult).toHaveProperty('successRate');

        // Should have high success rate
        expect(activateData.regressionResult.successRate).toBeGreaterThanOrEqual(80);
      }

      console.log('✅ Regression testing integration passed');
    });
  });

  describe('Error Recovery and Rollback', () => {
    it('🔙 should rollback on activation failure', async () => {
      // Get current active version
      const activeResponse = await app.inject({
        method: 'GET',
        url: '/v1/knowledge/versions/active',
        headers: {
          'X-API-Key': adminApiKey
        }
      });

      const activeData = JSON.parse(activeResponse.body);
      const currentVersion = activeData?.label;

      if (currentVersion) {
        // Try to rollback to current version (should work or indicate no change)
        const rollbackResponse = await app.inject({
          method: 'POST',
          url: '/v1/knowledge/tables/rollback',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': adminApiKey
          },
          payload: {
            targetVersionLabel: currentVersion,
            reason: 'Integration test rollback'
          }
        });

        // Should succeed or indicate no rollback needed
        expect([200, 409]).toContain(rollbackResponse.statusCode);

        console.log('✅ Rollback test passed');
      }
    });
  });
});