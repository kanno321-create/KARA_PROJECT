import type { FastifyInstance } from 'fastify';
// import type { PrismaClient } from '@prisma/client'; // Unused: removed
import { parseKnowledgeCSV, type ParsedKnowledgeRow } from '../lib/csv.js';
import { generateTableHashes, hashKnowledgeRow } from '../lib/hash.js';
import { hotSwapKnowledge } from '../lib/size-tables-v2.js';
// import { findDimensionKeyed } from '../lib/size-tables-v2.js'; // Unused: removed
import { withTxn } from '../lib/with-txn.js';
import { runGoldenRegression, saveRegressionReport } from '../regression/golden.js';
import { toJson, fromJsonArray } from '../lib/json-utils.js';

// ============================================
// Admin Knowledge Management Routes
// ============================================

// Mutex for activation operations
let activationLock = false;

export async function adminKnowledgeRoutes(fastify: FastifyInstance) {
  // API Key middleware (applied to all routes)
  fastify.addHook('preHandler', async (request, reply) => {
    const apiKey = request.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Valid X-API-Key required' });
      return;
    }
  });

  // ========================================
  // POST /v1/knowledge/tables/import
  // ========================================
  fastify.post('/knowledge/tables/import', {
    schema: {
      summary: 'Import knowledge table data',
      description: 'Import CSV or JSON data for staging and validation',
      tags: ['admin'],
      headers: {
        type: 'object',
        properties: {
          'x-api-key': { type: 'string' },
        },
        required: ['x-api-key'],
      },
      body: {
        type: 'object',
        properties: {
          format: { type: 'string', enum: ['CSV', 'JSON'] },
          data: { type: 'string' }, // CSV content or JSON string
          actor: { type: 'string' },
        },
        required: ['format', 'data'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            stagingId: { type: 'string' },
            summary: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                valid: { type: 'number' },
                invalid: { type: 'number' },
                duplicateKeys: { type: 'number' },
              },
            },
            tableHashes: { type: 'array', items: { type: 'string' } },
          },
        },
        422: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { format, data, actor } = request.body as {
        format: 'CSV' | 'JSON';
        data: string;
        actor?: string;
      };

      try {
        let parsedRows: ParsedKnowledgeRow[];
        // const errors: string[] = []; // Unused: removed

        if (format === 'CSV') {
          const parseResult = parseKnowledgeCSV(data);
          if (!parseResult.success) {
            reply.status(422);
            return {
              code: 'CSV_PARSE_ERROR',
              message: 'CSV parsing failed',
              errors: parseResult.errors,
            };
          }
          parsedRows = parseResult.rows;
        } else if (format === 'JSON') {
          try {
            const jsonData = JSON.parse(data);
            if (!Array.isArray(jsonData)) {
              throw new Error('JSON data must be an array');
            }
            parsedRows = jsonData.map((row: any, index: number) => {
              try {
                return {
                  brand: row.brand?.toUpperCase(),
                  series: row.series || undefined,
                  model: row.model || undefined,
                  af: row.af || undefined,
                  poles: row.poles?.toUpperCase(),
                  widthMM: parseInt(row.widthMM || row.width_mm),
                  heightMM: parseInt(row.heightMM || row.height_mm),
                  depthMM: parseInt(row.depthMM || row.depth_mm),
                  meta: row.meta,
                  rowHash: hashKnowledgeRow({
                    brand: row.brand?.toUpperCase(),
                    series: row.series,
                    model: row.model,
                    af: row.af,
                    poles: row.poles?.toUpperCase(),
                    widthMM: parseInt(row.widthMM || row.width_mm),
                    heightMM: parseInt(row.heightMM || row.height_mm),
                    depthMM: parseInt(row.depthMM || row.depth_mm),
                    meta: row.meta,
                  }),
                };
              } catch (error: any) {
                throw new Error(`Row ${index + 1}: ${error.message}`);
              }
            });
          } catch (error: any) {
            reply.status(422);
            return {
              code: 'JSON_PARSE_ERROR',
              message: 'JSON parsing failed',
              errors: [error.message],
            };
          }
        } else {
          reply.status(422);
          return {
            code: 'INVALID_FORMAT',
            message: 'Format must be CSV or JSON',
            errors: [],
          };
        }

        // Generate table hashes
        const tableData = [{ name: 'imported_table', data: parsedRows }];
        const tableHashes = generateTableHashes(tableData);

        // Create staging record
        const staging = await fastify.prisma.knowledgeStaging.create({
          data: {
            actor: actor || 'unknown',
            format,
            payload: Buffer.from(data, 'utf-8'),
            parsed: toJson(parsedRows),
            summary: {
              total: parsedRows.length,
              valid: parsedRows.length,
              invalid: 0,
              duplicateKeys: 0,
            },
            tableHashes,
            status: 'UPLOADED',
          },
        });

        // Create audit log
        await fastify.prisma.knowledgeAudit.create({
          data: {
            actor: actor || 'unknown',
            action: 'IMPORT',
            detail: {
              stagingId: staging.id,
              format,
              summary: {
                total: parsedRows.length,
                valid: parsedRows.length,
                invalid: 0,
              },
            },
          },
        });

        return {
          stagingId: staging.id,
          summary: {
            total: parsedRows.length,
            valid: parsedRows.length,
            invalid: 0,
            duplicateKeys: 0,
          },
          tableHashes: Object.values(tableHashes),
        };
      } catch (error: any) {
        reply.status(422);
        return {
          code: 'IMPORT_ERROR',
          message: 'Import failed',
          errors: [error.message],
        };
      }
    },
  });

  // ========================================
  // POST /v1/knowledge/tables/validate
  // ========================================
  fastify.post('/knowledge/tables/validate', {
    schema: {
      summary: 'Validate staged knowledge data',
      description: 'Validate staged data with sample testing',
      tags: ['admin'],
      headers: {
        type: 'object',
        properties: {
          'x-api-key': { type: 'string' },
        },
        required: ['x-api-key'],
      },
      body: {
        type: 'object',
        properties: {
          stagingId: { type: 'string' },
        },
        required: ['stagingId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            samples: { type: 'array', items: { type: 'string' } },
            errors: { type: 'array', items: { type: 'string' } },
          },
        },
        404: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { stagingId } = request.body as { stagingId: string };

      try {
        const staging = await fastify.prisma.knowledgeStaging.findUnique({
          where: { id: stagingId },
        });

        if (!staging) {
          reply.status(404);
          return {
            code: 'STAGING_NOT_FOUND',
            message: `Staging record ${stagingId} not found`,
          };
        }

        const parsedRows = fromJsonArray<ParsedKnowledgeRow>(staging.parsed) || [];
        const errors: string[] = [];
        const samples: string[] = [];

        // Sample validation - test 3 representative combinations
        const sampleTests = [
          { brand: 'SANGDO' as const, series: 'SBS', model: 'SBS-603', poles: '3P' as const },
          { brand: 'SANGDO' as const, series: 'SBS', model: 'SBS-203', poles: '3P' as const },
          { brand: 'LS' as const, af: 630, poles: '3P' as const },
        ];

        for (const test of sampleTests) {
          // Check if this combination exists in the parsed data
          const found = parsedRows.find(row => {
            if (row.brand !== test.brand || row.poles !== test.poles) return false;
            if ('af' in test) return row.af === test.af;
            return row.series === test.series && row.model === test.model;
          });

          if (found) {
            const key = test.brand === 'LS' && 'af' in test
              ? `LS|AF${test.af}|${test.poles}`
              : `${test.brand}|${test.series}|${test.model}|${test.poles}`;
            samples.push(key);
          }
        }

        // Additional validations
        if (parsedRows.length === 0) {
          errors.push('No valid rows found');
        }

        // Check for minimum required data
        const sangdoRows = parsedRows.filter(r => r.brand === 'SANGDO');
        const lsRows = parsedRows.filter(r => r.brand === 'LS');

        if (sangdoRows.length === 0 && lsRows.length === 0) {
          errors.push('No SANGDO or LS brand data found');
        }

        const isValid = errors.length === 0 && samples.length > 0;

        // Update staging status
        await fastify.prisma.knowledgeStaging.update({
          where: { id: stagingId },
          data: {
            status: isValid ? 'VALIDATED' : 'REJECTED',
          },
        });

        return {
          ok: isValid,
          samples,
          errors,
        };
      } catch (error: any) {
        reply.status(404);
        return {
          code: 'VALIDATION_ERROR',
          message: error.message,
        };
      }
    },
  });

  // ========================================
  // POST /v1/knowledge/tables/activate
  // ========================================
  fastify.post('/knowledge/tables/activate', {
    schema: {
      summary: 'Activate staged knowledge data',
      description: 'Activate validated staging data as new version',
      tags: ['admin'],
      headers: {
        type: 'object',
        properties: {
          'x-api-key': { type: 'string' },
        },
        required: ['x-api-key'],
      },
      body: {
        type: 'object',
        properties: {
          stagingId: { type: 'string' },
          label: { type: 'string' },
        },
        required: ['stagingId', 'label'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            versionId: { type: 'number' },
            label: { type: 'string' },
            count: { type: 'number' },
            regression: {
              type: 'object',
              properties: {
                passed: { type: 'number' },
                changed: { type: 'number' },
                failed: { type: 'number' },
                total: { type: 'number' },
                reportId: { type: 'string' },
                reportPath: { type: 'string' },
              },
            },
          },
        },
        409: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { stagingId, label } = request.body as {
        stagingId: string;
        label: string;
      };

      // Activation lock
      if (activationLock) {
        reply.status(409);
        return {
          code: 'ACTIVATION_IN_PROGRESS',
          message: 'Another activation is in progress',
        };
      }

      activationLock = true;

      try {
        return await withTxn(fastify.prisma, async (tx) => {
          // Get staging data
          const staging = await tx.knowledgeStaging.findUnique({
            where: { id: stagingId },
          });

          if (!staging) {
            reply.status(409);
            throw new Error(`Staging record ${stagingId} not found`);
          }

          if (staging.status !== 'VALIDATED') {
            reply.status(409);
            throw new Error(`Staging status is ${staging.status}, must be VALIDATED`);
          }

          const parsedRows = fromJsonArray<ParsedKnowledgeRow>(staging.parsed) || [];

          // Create new version
          const newVersion = await tx.knowledgeVersion.create({
            data: {
              label,
              active: false, // Will be set to true after data is loaded
            },
          });

          // Bulk insert knowledge table data
          const knowledgeTableData = parsedRows.map(row => ({
            versionId: newVersion.id,
            brand: row.brand,
            series: row.series,
            model: row.model,
            af: row.af,
            poles: row.poles,
            widthMM: row.widthMM,
            heightMM: row.heightMM,
            depthMM: row.depthMM,
            meta: row.meta,
            rowHash: row.rowHash,
          }));

          await tx.knowledgeTable.createMany({
            data: knowledgeTableData,
          });

          // Deactivate previous active version
          await tx.knowledgeVersion.updateMany({
            where: { active: true },
            data: { active: false },
          });

          // Activate new version
          await tx.knowledgeVersion.update({
            where: { id: newVersion.id },
            data: { active: true },
          });

          // Update staging status
          await tx.knowledgeStaging.update({
            where: { id: stagingId },
            data: { status: 'ACTIVATED' },
          });

          // Create audit log
          const auditLog = await tx.knowledgeAudit.create({
            data: {
              actor: staging.actor || 'unknown',
              action: 'ACTIVATE',
              detail: {
                stagingId,
                versionId: newVersion.id,
                label,
                count: parsedRows.length,
              },
            },
          });

          // Hot swap the cache
          await hotSwapKnowledge(fastify.prisma, newVersion.id);

          // Run golden set regression testing
          console.log('🧪 Running golden set regression testing...');
          const regressionResult = await runGoldenRegression(fastify.prisma, {
            versionLabel: label,
          });

          // Save regression report
          const reportPath = await saveRegressionReport(
            regressionResult,
            label,
            auditLog.id
          );

          console.log(`📊 Regression testing completed: ${regressionResult.passed}/${regressionResult.total} passed`);

          const regressionSummary = {
            passed: regressionResult.passed,
            changed: regressionResult.changed,
            failed: regressionResult.failed,
            total: regressionResult.total,
            reportId: auditLog.id,
            reportPath,
          };

          return {
            versionId: newVersion.id,
            label: newVersion.label,
            count: parsedRows.length,
            regression: regressionSummary,
          };
        });
      } catch (error: any) {
        reply.status(409);
        throw error;
      } finally {
        activationLock = false;
      }
    },
  });

  // ========================================
  // POST /v1/knowledge/tables/rollback
  // ========================================
  fastify.post('/knowledge/tables/rollback', {
    schema: {
      summary: 'Rollback to previous knowledge version',
      description: 'Rollback to a specific knowledge version',
      tags: ['admin'],
      headers: {
        type: 'object',
        properties: {
          'x-api-key': { type: 'string' },
        },
        required: ['x-api-key'],
      },
      body: {
        type: 'object',
        properties: {
          toVersionId: { type: 'number' },
        },
        required: ['toVersionId'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            activeVersionId: { type: 'number' },
          },
        },
        404: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { toVersionId } = request.body as { toVersionId: number };

      try {
        return await withTxn(fastify.prisma, async (tx) => {
          // Check if target version exists
          const targetVersion = await tx.knowledgeVersion.findUnique({
            where: { id: toVersionId },
          });

          if (!targetVersion) {
            reply.status(404);
            throw new Error(`Version ${toVersionId} not found`);
          }

          // Deactivate current active version
          await tx.knowledgeVersion.updateMany({
            where: { active: true },
            data: { active: false },
          });

          // Activate target version
          await tx.knowledgeVersion.update({
            where: { id: toVersionId },
            data: { active: true },
          });

          // Create audit log
          await tx.knowledgeAudit.create({
            data: {
              action: 'ROLLBACK',
              detail: {
                toVersionId,
                toLabel: targetVersion.label,
              },
            },
          });

          // Hot swap the cache
          await hotSwapKnowledge(fastify.prisma, toVersionId);

          return {
            ok: true,
            activeVersionId: toVersionId,
          };
        });
      } catch (error: any) {
        reply.status(404);
        throw error;
      }
    },
  });
}