import type { FastifyInstance } from 'fastify';
import { AbstainService } from '../services/abstain.service.js';
import { adminAuthMiddleware } from '../lib/security-middleware.js';
import { errors } from '../lib/errors.js';

// ============================================
// 관리자 라우트 (ABSTAIN 관리)
// ============================================

export async function adminRoutes(fastify: FastifyInstance) {
  const abstainService = new AbstainService(fastify.prisma);

  // 모든 관리자 라우트에 API 키 인증 적용
  fastify.addHook('preHandler', adminAuthMiddleware(fastify));

  // ========================================
  // GET /v1/admin/abstain/queue - ABSTAIN 큐 조회
  // ========================================

  fastify.get('/admin/abstain/queue', {
    schema: {
      summary: 'ABSTAIN 큐 조회 (관리자)',
      description: '모든 ABSTAIN 요청을 조회합니다 (관리자 전용)',
      tags: ['admin', 'abstain'],
      security: [{ apiKey: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['pending', 'resolved', 'ignored'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            items: {
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
                  estimate: { type: 'object' },
                },
              },
            },
            stats: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                pending: { type: 'number' },
                resolved: { type: 'number' },
                ignored: { type: 'number' },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (request) => {
      const { status } = request.query as { status?: string };

      const [items, stats] = await Promise.all([
        abstainService.getAbstainQueue(status),
        abstainService.getAbstainStats(),
      ]);

      return {
        items: items.map(item => ({
          id: item.id,
          estimateId: item.estimateId,
          requestPath: item.requestPath,
          missingData: item.missingData,
          suggestion: item.suggestion,
          status: item.status,
          resolution: item.resolution,
          createdAt: item.createdAt.toISOString(),
          resolvedAt: item.resolvedAt?.toISOString(),
          estimate: item.estimate,
        })),
        stats: {
          total: Object.values(stats.statusBreakdown).reduce((sum, count) => sum + count, 0),
          pending: stats.statusBreakdown.pending || 0,
          resolved: stats.statusBreakdown.resolved || 0,
          ignored: stats.statusBreakdown.ignored || 0,
        },
      };
    },
  });

  // ========================================
  // POST /v1/admin/abstain/:id/resolve - ABSTAIN 해결
  // ========================================

  fastify.post('/admin/abstain/:id/resolve', {
    schema: {
      summary: 'ABSTAIN 요청 해결 (관리자)',
      description: '지식 부족 요청에 대한 답변을 제공합니다 (관리자 전용)',
      tags: ['admin', 'abstain'],
      security: [{ apiKey: [] }],
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
          notes: { type: 'string' },
        },
        required: ['providedData', 'updatedVersion'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            abstainId: { type: 'string' },
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
            path: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const resolution = request.body as {
        providedData: any;
        updatedVersion: string;
        notes?: string;
      };

      try {
        await abstainService.resolveAbstainRequest(id, {
          providedData: resolution.providedData,
          updatedVersion: resolution.updatedVersion,
        });

        return {
          success: true,
          message: 'ABSTAIN 요청이 성공적으로 해결되었습니다.',
          abstainId: id,
        };
      } catch (error: any) {
        if (error.statusCode === 404) {
          reply.status(404);
          return error.toJSON();
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
  // POST /v1/admin/abstain/:id/ignore - ABSTAIN 무시
  // ========================================

  fastify.post('/admin/abstain/:id/ignore', {
    schema: {
      summary: 'ABSTAIN 요청 무시 (관리자)',
      description: 'ABSTAIN 요청을 무시 처리합니다 (관리자 전용)',
      tags: ['admin', 'abstain'],
      security: [{ apiKey: [] }],
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
          reason: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            abstainId: { type: 'string' },
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
      const { reason } = request.body as { reason?: string };

      try {
        await abstainService.ignoreAbstainRequest(id, reason);

        return {
          success: true,
          message: 'ABSTAIN 요청이 무시 처리되었습니다.',
          abstainId: id,
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
  // GET /v1/admin/abstain/stats - ABSTAIN 통계
  // ========================================

  fastify.get('/admin/abstain/stats', {
    schema: {
      summary: 'ABSTAIN 통계 조회 (관리자)',
      description: 'ABSTAIN 요청 통계를 조회합니다 (관리자 전용)',
      tags: ['admin', 'abstain'],
      security: [{ apiKey: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            statusBreakdown: {
              type: 'object',
              additionalProperties: { type: 'number' },
            },
            topMissingPaths: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string' },
                  count: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    handler: async () => {
      return await abstainService.getAbstainStats();
    },
  });
}