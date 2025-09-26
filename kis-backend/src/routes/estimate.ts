import type { FastifyInstance } from 'fastify';
import { EstimateService } from '../services/estimate.service.js';
import { EstimateRequestJSONSchema, EstimateResponseJSONSchema } from '../lib/json-schemas.js';
import { EstimateApiResponseJSONSchema } from '../lib/json-schemas-extended.js';
import { handleIdempotencyStart, handleIdempotencyFinish } from '../lib/idempotency.js';
import { normalizeResponse } from '../lib/normalize.js';
// import { logError } from '../lib/observability.js';
import { errors } from '../lib/errors.js';
import { preGateEstimateInput } from '../lib/pre-gates.js';

// ============================================
// 견적 라우트
// ============================================

/**
 * Normalize poles field: number -> string (temporary compatibility)
 * Standard contract: "2P"|"3P"|"4P"
 * Compatibility: 2|3|4 -> "2P"|"3P"|"4P"
 */
function normalizePoles(body: any): void {
  if (body.main?.poles && typeof body.main.poles === 'number') {
    body.main.poles = `${body.main.poles}P`;
  }
  if (body.branches && Array.isArray(body.branches)) {
    body.branches.forEach((branch: any) => {
      if (branch.poles && typeof branch.poles === 'number') {
        branch.poles = `${branch.poles}P`;
      }
    });
  }
}

export async function estimateRoutes(fastify: FastifyInstance) {
  const estimateService = new EstimateService(fastify.prisma, fastify.log);

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
      // Normalize poles: number -> string (compatibility layer)
      normalizePoles(request.body as any);

      // Pre-Gate 검증 (서비스 호출 전)
      const preGateResult = preGateEstimateInput(request.body);
      if (!preGateResult.ok) {
        reply.status(422);
        return {
          code: preGateResult.code,
          message: preGateResult.message,
          path: preGateResult.path,
          hint: preGateResult.hint,
        };
      }

      try {
        const result = await estimateService.validateEstimate(request.body as any);
        return {
          valid: result.isValid,
          resolved_brand: preGateResult.resolvedBrand,
          knowledge_hits: (result as any).knowledgeHits || [],
          warnings: result.warnings || [],
        };
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
        200: EstimateApiResponseJSONSchema,
        409: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            hint: { type: 'string' },
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
      // 0. 요청 추적 정보
      const startTime = Date.now();
      const requestId = request.headers['x-request-id'] as string || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 1. 멱등성 키 추출
      const idempotencyKey = request.headers['idempotency-key'] as string;
      const actor = request.headers['x-kis-actor'] as string;

      // 2. Normalize poles: number -> string (compatibility layer)
      normalizePoles(request.body as any);

      // 3. Pre-Gate 검증 (서비스 호출 전)
      const preGateResult = preGateEstimateInput(request.body);
      if (!preGateResult.ok) {
        reply.status(422);
        return {
          code: preGateResult.code,
          message: preGateResult.message,
          path: preGateResult.path,
          hint: preGateResult.hint,
        };
      }

      try {
        // 4. 멱등성 처리 시작
        const idempotencyResult = await handleIdempotencyStart(fastify.prisma, {
          key: idempotencyKey,
          scope: 'POST /v1/estimate/create',
          actor,
          body: request.body,
        });

        // 4. 멱등성 재생 모드
        if (idempotencyResult.mode === 'REPLAY') {
          reply.status(200);
          return idempotencyResult.response;
        }

        // 5. 바이패스 또는 신규 저장 모드
        const estimate = await estimateService.createEstimate(request.body as any, requestId, startTime);

        // 6. 멱등성 완료 처리 (신규 저장 모드만)
        if (idempotencyResult.mode === 'STORE') {
          const normalizedResponse = normalizeResponse(estimate);
          await handleIdempotencyFinish(fastify.prisma, {
            key: idempotencyKey,
            response: normalizedResponse,
          });
        }

        reply.status(200);
        return estimate;
      } catch (error: any) {
        if (error.statusCode === 409 && error.code === 'IDEMPOTENCY_BODY_MISMATCH') {
          reply.status(409);
          return {
            code: error.code,
            message: error.message,
            hint: error.hint,
          };
        }
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

  // ========================================
  // POST /v1/estimate/:id/evidence/verify - 증거 서명 검증
  // ========================================

  fastify.post('/estimate/:id/evidence/verify', {
    schema: {
      summary: '증거 패키지 서명 검증',
      description: '증거 패키지의 암호화 서명을 검증합니다',
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
            isValid: { type: 'boolean' },
            verifiedAt: { type: 'string' },
            signatureStatus: { type: 'string' },
            evidenceHash: { type: 'string' },
            verificationDetails: {
              type: 'object',
              properties: {
                snapshotHashValid: { type: 'boolean' },
                rulesVersionValid: { type: 'boolean' },
                knowledgeVersionValid: { type: 'boolean' },
                tableHashesValid: { type: 'boolean' },
                signatureValid: { type: 'boolean' },
              },
            },
          },
        },
        404: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
          },
        },
        422: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        const verificationResult = await estimateService.verifyEvidenceSignature(id);
        return verificationResult;
      } catch (error: any) {
        if (error.statusCode === 404) {
          reply.status(404);
          return error.toJSON();
        }
        if (error.statusCode === 422) {
          reply.status(422);
          return {
            code: 'SIGNATURE_VERIFICATION_FAILED',
            message: '증거 패키지 서명 검증에 실패했습니다',
            details: error.message,
          };
        }
        throw error;
      }
    },
  });
}