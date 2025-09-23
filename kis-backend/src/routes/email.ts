import type { FastifyInstance } from 'fastify';
import { EmailService } from '../services/email.service.js';
import {
  EmailGroupJSONSchema,
  EmailGroupCreateJSONSchema,
  EmailGroupUpdateJSONSchema,
  EmailThreadJSONSchema,
  EmailThreadCreateJSONSchema,
  EmailThreadUpdateJSONSchema
} from '../lib/json-schemas.js';
import { errors } from '../lib/errors.js';

// ============================================
// 이메일 라우트
// ============================================

export async function emailRoutes(fastify: FastifyInstance) {
  const emailService = new EmailService(fastify.prisma);

  // ========================================
  // 이메일 그룹 관리
  // ========================================

  // POST /v1/email/groups - 그룹 생성
  fastify.post('/email/groups', {
    schema: {
      summary: '이메일 그룹 생성',
      description: '새로운 이메일 그룹을 생성합니다',
      tags: ['email'],
      body: EmailGroupCreateJSONSchema,
      response: {
        201: EmailGroupJSONSchema,
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
      try {
        const group = await emailService.createGroup(request.body as any);
        reply.status(201);
        return group;
      } catch (error: any) {
        if (error.statusCode === 409) {
          reply.status(409);
          return error.toJSON();
        }
        throw error;
      }
    },
  });

  // GET /v1/email/groups - 그룹 목록 조회
  fastify.get('/email/groups', {
    schema: {
      summary: '이메일 그룹 목록 조회',
      description: '모든 이메일 그룹을 조회합니다',
      tags: ['email'],
      response: {
        200: {
          type: 'array',
          items: EmailGroupJSONSchema,
        },
      },
    },
    handler: async () => {
      return await emailService.getGroups();
    },
  });

  // GET /v1/email/groups/:id - 그룹 조회
  fastify.get('/email/groups/:id', {
    schema: {
      summary: '이메일 그룹 조회',
      description: 'ID로 이메일 그룹을 조회합니다',
      tags: ['email'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: EmailGroupJSONSchema,
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
      const group = await emailService.getGroup(id);

      if (!group) {
        reply.status(404);
        return errors.notFound('이메일 그룹', id).toJSON();
      }

      return group;
    },
  });

  // PUT /v1/email/groups/:id - 그룹 수정
  fastify.put('/email/groups/:id', {
    schema: {
      summary: '이메일 그룹 수정',
      description: '이메일 그룹을 수정합니다',
      tags: ['email'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: EmailGroupUpdateJSONSchema,
      response: {
        200: EmailGroupJSONSchema,
        404: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
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
      const { id } = request.params as { id: string };

      try {
        const group = await emailService.updateGroup(id, request.body as any);
        return group;
      } catch (error: any) {
        if (error.statusCode === 404) {
          reply.status(404);
          return error.toJSON();
        }
        if (error.statusCode === 409) {
          reply.status(409);
          return error.toJSON();
        }
        throw error;
      }
    },
  });

  // DELETE /v1/email/groups/:id - 그룹 삭제
  fastify.delete('/email/groups/:id', {
    schema: {
      summary: '이메일 그룹 삭제',
      description: '이메일 그룹을 삭제합니다',
      tags: ['email'],
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
        await emailService.deleteGroup(id);
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
  // 이메일 스레드 관리
  // ========================================

  // POST /v1/email/threads - 스레드 생성
  fastify.post('/email/threads', {
    schema: {
      summary: '이메일 스레드 생성',
      description: '새로운 이메일 스레드를 생성합니다',
      tags: ['email'],
      body: EmailThreadCreateJSONSchema,
      response: {
        201: EmailThreadJSONSchema,
      },
    },
    handler: async (request, reply) => {
      const thread = await emailService.createThread(request.body as any);
      reply.status(201);
      return thread;
    },
  });

  // GET /v1/email/threads - 스레드 목록 조회
  fastify.get('/email/threads', {
    schema: {
      summary: '이메일 스레드 목록 조회',
      description: '이메일 스레드 목록을 조회합니다',
      tags: ['email'],
      querystring: {
        type: 'object',
        properties: {
          groupId: { type: 'string' },
          status: { type: 'string', enum: ['SENT', 'FAILED', 'DRAFT'] },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            threads: { type: 'array', items: EmailThreadJSONSchema },
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
      return await emailService.getThreads(query);
    },
  });

  // GET /v1/email/threads/:id - 스레드 조회
  fastify.get('/email/threads/:id', {
    schema: {
      summary: '이메일 스레드 조회',
      description: 'ID로 이메일 스레드를 조회합니다',
      tags: ['email'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: EmailThreadJSONSchema,
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
      const thread = await emailService.getThread(id);

      if (!thread) {
        reply.status(404);
        return errors.notFound('이메일 스레드', id).toJSON();
      }

      return thread;
    },
  });

  // PUT /v1/email/threads/:id - 스레드 수정
  fastify.put('/email/threads/:id', {
    schema: {
      summary: '이메일 스레드 수정',
      description: '이메일 스레드를 수정합니다',
      tags: ['email'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: EmailThreadUpdateJSONSchema,
      response: {
        200: EmailThreadJSONSchema,
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
        const thread = await emailService.updateThread(id, request.body as any);
        return thread;
      } catch (error: any) {
        if (error.statusCode === 404) {
          reply.status(404);
          return error.toJSON();
        }
        throw error;
      }
    },
  });

  // DELETE /v1/email/threads/:id - 스레드 삭제
  fastify.delete('/email/threads/:id', {
    schema: {
      summary: '이메일 스레드 삭제',
      description: '이메일 스레드를 삭제합니다',
      tags: ['email'],
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
        await emailService.deleteThread(id);
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
  // 통계 및 검색
  // ========================================

  // GET /v1/email/stats - 이메일 통계
  fastify.get('/email/stats', {
    schema: {
      summary: '이메일 통계',
      description: '이메일 스레드 및 그룹 통계를 조회합니다',
      tags: ['email'],
      response: {
        200: {
          type: 'object',
          properties: {
            totalThreads: { type: 'integer' },
            threadsByStatus: { type: 'object' },
            threadsByGroup: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  groupName: { type: 'string' },
                  count: { type: 'integer' },
                },
              },
            },
            recentActivity: { type: 'integer' },
          },
        },
      },
    },
    handler: async () => {
      return await emailService.getEmailStats();
    },
  });

  // GET /v1/email/search - 이메일 검색
  fastify.get('/email/search', {
    schema: {
      summary: '이메일 검색',
      description: '이메일 스레드를 검색합니다',
      tags: ['email'],
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
          items: EmailThreadJSONSchema,
        },
      },
    },
    handler: async (request) => {
      const { q, limit } = request.query as { q: string; limit?: number };
      return await emailService.searchThreads(q, limit);
    },
  });
}