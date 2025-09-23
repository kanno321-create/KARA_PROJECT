import type { FastifyInstance } from 'fastify';
import { DrawingService } from '../services/drawing.service.js';
import { DrawingJSONSchema, DrawingCreateJSONSchema, DrawingUpdateJSONSchema } from '../lib/json-schemas.js';
import { errors } from '../lib/errors.js';

// ============================================
// 도면 라우트
// ============================================

export async function drawingRoutes(fastify: FastifyInstance) {
  const drawingService = new DrawingService(fastify.prisma);

  // ========================================
  // POST /v1/drawings - 도면 생성
  // ========================================

  fastify.post('/drawings', {
    schema: {
      summary: '도면 생성',
      description: '새로운 도면을 생성합니다',
      tags: ['drawings'],
      body: DrawingCreateJSONSchema,
      response: {
        201: DrawingJSONSchema,
        409: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            hint: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const drawing = await drawingService.createDrawing(request.body as any);
        reply.status(201);
        return drawing;
      } catch (error: any) {
        if (error.statusCode === 409) {
          reply.status(409);
          return error.toJSON();
        }
        throw error;
      }
    },
  });

  // ========================================
  // GET /v1/drawings/:id - 도면 조회
  // ========================================

  fastify.get('/drawings/:id', {
    schema: {
      summary: '도면 조회',
      description: 'ID로 도면을 조회합니다',
      tags: ['drawings'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: DrawingJSONSchema,
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
      const drawing = await drawingService.getDrawing(id);

      if (!drawing) {
        reply.status(404);
        return errors.notFound('도면', id).toJSON();
      }

      return drawing;
    },
  });

  // ========================================
  // GET /v1/drawings - 도면 목록 조회
  // ========================================

  fastify.get('/drawings', {
    schema: {
      summary: '도면 목록 조회',
      description: '도면 목록을 조회합니다',
      tags: ['drawings'],
      querystring: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          author: { type: 'string' },
          tags: {
            type: 'array',
            items: { type: 'string' },
          },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            drawings: { type: 'array', items: DrawingJSONSchema },
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
      return await drawingService.getDrawings(query);
    },
  });

  // ========================================
  // PUT /v1/drawings/:id - 도면 수정
  // ========================================

  fastify.put('/drawings/:id', {
    schema: {
      summary: '도면 수정',
      description: '도면을 수정합니다 (name, rev는 수정 불가)',
      tags: ['drawings'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: DrawingUpdateJSONSchema,
      response: {
        200: DrawingJSONSchema,
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
        const drawing = await drawingService.updateDrawing(id, request.body as any);
        return drawing;
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
  // DELETE /v1/drawings/:id - 도면 삭제
  // ========================================

  fastify.delete('/drawings/:id', {
    schema: {
      summary: '도면 삭제',
      description: '도면을 삭제합니다',
      tags: ['drawings'],
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
        await drawingService.deleteDrawing(id);
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
  // GET /v1/drawings/by-name/:name/revisions - 리비전 목록
  // ========================================

  fastify.get('/drawings/by-name/:name/revisions', {
    schema: {
      summary: '도면 리비전 목록',
      description: '특정 도면명의 모든 리비전을 조회합니다',
      tags: ['drawings'],
      params: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      },
      response: {
        200: {
          type: 'array',
          items: DrawingJSONSchema,
        },
      },
    },
    handler: async (request) => {
      const { name } = request.params as { name: string };
      return await drawingService.getDrawingRevisions(name);
    },
  });

  // ========================================
  // GET /v1/drawings/by-name/:name/latest - 최신 리비전
  // ========================================

  fastify.get('/drawings/by-name/:name/latest', {
    schema: {
      summary: '최신 리비전 조회',
      description: '특정 도면명의 최신 리비전을 조회합니다',
      tags: ['drawings'],
      params: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      },
      response: {
        200: DrawingJSONSchema,
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
      const { name } = request.params as { name: string };
      const drawing = await drawingService.getLatestRevision(name);

      if (!drawing) {
        reply.status(404);
        return errors.notFound('도면', name).toJSON();
      }

      return drawing;
    },
  });

  // ========================================
  // POST /v1/drawings/:id/links/estimates/:estimateId - 견적 연결
  // ========================================

  fastify.post('/drawings/:id/links/estimates/:estimateId', {
    schema: {
      summary: '도면-견적 연결',
      description: '도면을 견적에 연결합니다',
      tags: ['drawings'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          estimateId: { type: 'string' },
        },
        required: ['id', 'estimateId'],
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
      const { id, estimateId } = request.params as { id: string; estimateId: string };

      try {
        await drawingService.linkToEstimate(id, estimateId);
        return {
          success: true,
          message: '도면이 견적에 연결되었습니다.',
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
  // DELETE /v1/drawings/:id/links/estimates/:estimateId - 견적 연결 해제
  // ========================================

  fastify.delete('/drawings/:id/links/estimates/:estimateId', {
    schema: {
      summary: '도면-견적 연결 해제',
      description: '도면과 견적의 연결을 해제합니다',
      tags: ['drawings'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          estimateId: { type: 'string' },
        },
        required: ['id', 'estimateId'],
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
      const { id, estimateId } = request.params as { id: string; estimateId: string };

      try {
        await drawingService.unlinkFromEstimate(id, estimateId);
        return {
          success: true,
          message: '도면과 견적의 연결이 해제되었습니다.',
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
  // POST /v1/drawings/:id/links/events/:eventId - 이벤트 연결
  // ========================================

  fastify.post('/drawings/:id/links/events/:eventId', {
    schema: {
      summary: '도면-이벤트 연결',
      description: '도면을 캘린더 이벤트에 연결합니다',
      tags: ['drawings'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          eventId: { type: 'string' },
        },
        required: ['id', 'eventId'],
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
      const { id, eventId } = request.params as { id: string; eventId: string };

      try {
        await drawingService.linkToEvent(id, eventId);
        return {
          success: true,
          message: '도면이 이벤트에 연결되었습니다.',
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
  // GET /v1/drawings/tags - 모든 태그 조회
  // ========================================

  fastify.get('/drawings/tags', {
    schema: {
      summary: '도면 태그 목록',
      description: '모든 도면 태그를 조회합니다',
      tags: ['drawings'],
      response: {
        200: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
    handler: async () => {
      return await drawingService.getAllTags();
    },
  });

  // ========================================
  // GET /v1/drawings/by-tag/:tag - 태그별 도면 조회
  // ========================================

  fastify.get('/drawings/by-tag/:tag', {
    schema: {
      summary: '태그별 도면 조회',
      description: '특정 태그가 있는 도면들을 조회합니다',
      tags: ['drawings'],
      params: {
        type: 'object',
        properties: {
          tag: { type: 'string' },
        },
        required: ['tag'],
      },
      response: {
        200: {
          type: 'array',
          items: DrawingJSONSchema,
        },
      },
    },
    handler: async (request) => {
      const { tag } = request.params as { tag: string };
      return await drawingService.getDrawingsByTag(tag);
    },
  });

  // ========================================
  // GET /v1/drawings/search - 도면 검색
  // ========================================

  fastify.get('/drawings/search', {
    schema: {
      summary: '도면 검색',
      description: '도면을 검색합니다',
      tags: ['drawings'],
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string', minLength: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
        },
        required: ['q'],
      },
      response: {
        200: {
          type: 'array',
          items: DrawingJSONSchema,
        },
      },
    },
    handler: async (request) => {
      const { q, limit } = request.query as { q: string; limit?: number };
      return await drawingService.searchDrawings(q, limit);
    },
  });

  // ========================================
  // GET /v1/drawings/stats - 도면 통계
  // ========================================

  fastify.get('/drawings/stats', {
    schema: {
      summary: '도면 통계',
      description: '도면 관련 통계를 조회합니다',
      tags: ['drawings'],
      response: {
        200: {
          type: 'object',
          properties: {
            totalDrawings: { type: 'integer' },
            uniqueNames: { type: 'integer' },
            authorCount: { type: 'integer' },
            tagCount: { type: 'integer' },
            recentDrawings: { type: 'integer' },
          },
        },
      },
    },
    handler: async () => {
      return await drawingService.getDrawingStats();
    },
  });
}