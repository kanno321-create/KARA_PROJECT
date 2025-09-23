import type { FastifyInstance } from 'fastify';
import { EstimateService } from '../services/estimate.service.js';
import { EstimateRequestJSONSchema, EstimateResponseJSONSchema } from '../lib/json-schemas.js';
import { errors } from '../lib/errors.js';

// ============================================
// 견적 라우트
// ============================================

export async function estimateRoutes(fastify: FastifyInstance) {
  const estimateService = new EstimateService(fastify.prisma);

  // ========================================
  // POST /v1/estimate/validate - 견적 검증
  // ========================================

  fastify.post('/estimate/validate', {
    schema: {
      summary: '견적 요청 검증',
      description: '견적 요청을 검증하고 오류/경고를 반환합니다',
      tags: ['estimate'],
      body: EstimateRequestJSONSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            isValid: { type: 'boolean' },
            errors: { type: 'array', items: { type: 'string' } },
            warnings: { type: 'array', items: { type: 'string' } },
          },
        },
        422: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            path: { type: 'string' },
            hint: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const result = await estimateService.validateEstimate(request.body as any);
        return result;
      } catch (error: any) {
        if (error.statusCode === 422) {
          reply.status(422);
          return error.toJSON();
        }
        throw error;
      }
    },
  });

  // ========================================
  // POST /v1/estimate/create - 견적 생성
  // ========================================

  fastify.post('/estimate/create', {
    schema: {
      summary: '견적 생성',
      description: '견적을 검증하고 외함 크기를 계산하여 생성합니다',
      tags: ['estimate'],
      body: EstimateRequestJSONSchema,
      response: {
        201: EstimateResponseJSONSchema,
        422: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            path: { type: 'string' },
            hint: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const estimate = await estimateService.createEstimate(request.body as any);
        reply.status(201);
        return estimate;
      } catch (error: any) {
        if (error.statusCode === 422) {
          reply.status(422);
          return error.toJSON();
        }
        throw error;
      }
    },
  });

  // ========================================
  // GET /v1/estimate/:id - 견적 조회
  // ========================================

  fastify.get('/estimate/:id', {
    schema: {
      summary: '견적 조회',
      description: 'ID로 견적을 조회합니다',
      tags: ['estimate'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: EstimateResponseJSONSchema,
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
      const { id } = request.params as { id: string };
      const estimate = await estimateService.getEstimate(id);

      if (!estimate) {
        reply.status(404);
        return errors.notFound('견적', id).toJSON();
      }

      return estimate;
    },
  });

  // ========================================
  // GET /v1/estimate - 견적 목록 조회
  // ========================================

  fastify.get('/estimate', {
    schema: {
      summary: '견적 목록 조회',
      description: '견적 목록을 페이지네이션으로 조회합니다',
      tags: ['estimate'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          brand: { type: 'string', enum: ['SANGDO', 'LS', 'MIXED'] },
          status: { type: 'string', enum: ['draft', 'validated', 'completed', 'failed'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            estimates: { type: 'array', items: EstimateResponseJSONSchema },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    handler: async (request) => {
      const query = request.query as any;
      return await estimateService.getEstimates(query);
    },
  });

  // ========================================
  // DELETE /v1/estimate/:id - 견적 삭제
  // ========================================

  fastify.delete('/estimate/:id', {
    schema: {
      summary: '견적 삭제',
      description: 'ID로 견적을 삭제합니다',
      tags: ['estimate'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        204: { type: 'null' },
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
      const { id } = request.params as { id: string };

      try {
        await estimateService.deleteEstimate(id);
        reply.status(204);
        return null;
      } catch (error: any) {
        if (error.statusCode === 404) {
          reply.status(404);
          return error.toJSON();
        }
        throw error;
      }
    },
  });

  // ========================================
  // GET /v1/estimate/:id/evidence - 증거 패키지 조회
  // ========================================

  fastify.get('/estimate/:id/evidence', {
    schema: {
      summary: '증거 패키지 조회',
      description: '견적의 증거 패키지를 조회합니다',
      tags: ['estimate'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            estimateId: { type: 'string' },
            rulesDoc: { type: 'string' },
            tables: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  source: { type: 'string' },
                  rows: { type: 'array', items: { type: 'string' } },
                },
              },
            },
            brandPolicy: { type: 'string' },
            snapshot: { type: 'object' },
            version: {
              type: 'object',
              properties: {
                rules: { type: 'string' },
                tables: { type: 'string' },
              },
            },
            createdAt: { type: 'string' },
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
      const { id } = request.params as { id: string };

      try {
        const evidence = await estimateService.getEvidence(id);
        return {
          id: evidence.id,
          estimateId: evidence.estimateId,
          rulesDoc: evidence.rulesDoc,
          tables: evidence.tables,
          brandPolicy: evidence.brandPolicy,
          snapshot: evidence.snapshot,
          version: evidence.version,
          createdAt: evidence.createdAt.toISOString(),
        };
      } catch (error: any) {
        if (error.statusCode === 404) {
          reply.status(404);
          return error.toJSON();
        }
        throw error;
      }
    },
  });

  // ========================================
  // GET /v1/estimate/abstain - ABSTAIN 큐 조회
  // ========================================

  fastify.get('/estimate/abstain', {
    schema: {
      summary: 'ABSTAIN 큐 조회',
      description: '지식 부족으로 대기 중인 요청들을 조회합니다',
      tags: ['estimate'],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'resolved', 'ignored'] },
        },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              estimateId: { type: 'string' },
              requestPath: { type: 'string' },
              missingData: { type: 'string' },
              suggestion: { type: 'string' },
              status: { type: 'string' },
              resolution: { type: 'object' },
              createdAt: { type: 'string' },
              resolvedAt: { type: 'string' },
            },
          },
        },
      },
    },
    handler: async (request) => {
      const { status } = request.query as { status?: string };
      const abstains = await estimateService.getAbstainQueue(status);

      return abstains.map(abstain => ({
        id: abstain.id,
        estimateId: abstain.estimateId,
        requestPath: abstain.requestPath,
        missingData: abstain.missingData,
        suggestion: abstain.suggestion,
        status: abstain.status,
        resolution: abstain.resolution,
        createdAt: abstain.createdAt.toISOString(),
        resolvedAt: abstain.resolvedAt?.toISOString(),
      }));
    },
  });

  // ========================================
  // POST /v1/estimate/abstain/:id/resolve - ABSTAIN 해결
  // ========================================

  fastify.post('/estimate/abstain/:id/resolve', {
    schema: {
      summary: 'ABSTAIN 요청 해결',
      description: '지식 부족 요청에 대한 답변을 제공합니다',
      tags: ['estimate'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          providedData: { type: 'object' },
          updatedVersion: { type: 'string' },
        },
        required: ['providedData', 'updatedVersion'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
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
      const { id } = request.params as { id: string };
      const resolution = request.body as { providedData: any; updatedVersion: string };

      try {
        await estimateService.resolveAbstain(id, resolution);
        return {
          success: true,
          message: 'ABSTAIN 요청이 해결되었습니다.',
        };
      } catch (error: any) {
        if (error.statusCode === 404) {
          reply.status(404);
          return error.toJSON();
        }
        throw error;
      }
    },
  });
}