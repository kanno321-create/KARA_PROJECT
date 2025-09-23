import type { FastifyInstance } from 'fastify';
import { CalendarService } from '../services/calendar.service.js';
import { CalendarEventJSONSchema, CalendarEventCreateJSONSchema, CalendarEventUpdateJSONSchema } from '../lib/json-schemas.js';
import { errors } from '../lib/errors.js';

// ============================================
// 캘린더 라우트
// ============================================

export async function calendarRoutes(fastify: FastifyInstance) {
  const calendarService = new CalendarService(fastify.prisma);

  // ========================================
  // POST /v1/calendar - 이벤트 생성
  // ========================================

  fastify.post('/calendar', {
    schema: {
      summary: '캘린더 이벤트 생성',
      description: '새로운 캘린더 이벤트를 생성합니다',
      tags: ['calendar'],
      body: CalendarEventCreateJSONSchema,
      response: {
        201: CalendarEventJSONSchema,
      },
    },
    handler: async (request, reply) => {
      const event = await calendarService.createEvent(request.body as any);
      reply.status(201);
      return event;
    },
  });

  // ========================================
  // GET /v1/calendar/:id - 이벤트 조회
  // ========================================

  fastify.get('/calendar/:id', {
    schema: {
      summary: '캘린더 이벤트 조회',
      description: 'ID로 캘린더 이벤트를 조회합니다',
      tags: ['calendar'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: CalendarEventJSONSchema,
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
      const event = await calendarService.getEvent(id);

      if (!event) {
        reply.status(404);
        return errors.notFound('캘린더 이벤트', id).toJSON();
      }

      return event;
    },
  });

  // ========================================
  // GET /v1/calendar - 이벤트 목록 조회
  // ========================================

  fastify.get('/calendar', {
    schema: {
      summary: '캘린더 이벤트 목록 조회',
      description: '캘린더 이벤트 목록을 조회합니다',
      tags: ['calendar'],
      querystring: {
        type: 'object',
        properties: {
          start: { type: 'string', format: 'date-time' },
          end: { type: 'string', format: 'date-time' },
          type: { type: 'string', enum: ['estimate', 'install', 'inbound', 'misc'] },
          owner: { type: 'string' },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            events: { type: 'array', items: CalendarEventJSONSchema },
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
      return await calendarService.getEvents(query);
    },
  });

  // ========================================
  // PUT /v1/calendar/:id - 이벤트 수정
  // ========================================

  fastify.put('/calendar/:id', {
    schema: {
      summary: '캘린더 이벤트 수정',
      description: '캘린더 이벤트를 수정합니다',
      tags: ['calendar'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: CalendarEventUpdateJSONSchema,
      response: {
        200: CalendarEventJSONSchema,
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
        const event = await calendarService.updateEvent(id, request.body as any);
        return event;
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
  // DELETE /v1/calendar/:id - 이벤트 삭제
  // ========================================

  fastify.delete('/calendar/:id', {
    schema: {
      summary: '캘린더 이벤트 삭제',
      description: '캘린더 이벤트를 삭제합니다',
      tags: ['calendar'],
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
        await calendarService.deleteEvent(id);
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
  // GET /v1/calendar/export/ics - ICS 파일 내보내기
  // ========================================

  fastify.get('/calendar/export/ics', {
    schema: {
      summary: 'ICS 파일 내보내기',
      description: '캘린더 이벤트를 ICS 형식으로 내보냅니다',
      tags: ['calendar'],
      querystring: {
        type: 'object',
        properties: {
          start: { type: 'string', format: 'date-time' },
          end: { type: 'string', format: 'date-time' },
          type: { type: 'string', enum: ['estimate', 'install', 'inbound', 'misc'] },
          owner: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'string',
          headers: {
            'Content-Type': { type: 'string' },
            'Content-Disposition': { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const query = request.query as any;
      const icsContent = await calendarService.generateICS(query);

      reply
        .header('Content-Type', 'text/calendar; charset=utf-8')
        .header('Content-Disposition', 'attachment; filename="kis-calendar.ics"');

      return icsContent;
    },
  });

  // ========================================
  // GET /v1/calendar/summary/:year/:month - 월별 요약
  // ========================================

  fastify.get('/calendar/summary/:year/:month', {
    schema: {
      summary: '월별 캘린더 요약',
      description: '특정 월의 캘린더 이벤트 요약을 조회합니다',
      tags: ['calendar'],
      params: {
        type: 'object',
        properties: {
          year: { type: 'integer', minimum: 2020, maximum: 2030 },
          month: { type: 'integer', minimum: 1, maximum: 12 },
        },
        required: ['year', 'month'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            totalEvents: { type: 'integer' },
            eventsByType: { type: 'object' },
            busyDays: { type: 'integer' },
            conflicts: { type: 'integer' },
          },
        },
      },
    },
    handler: async (request) => {
      const { year, month } = request.params as { year: number; month: number };
      return await calendarService.getMonthSummary(year, month);
    },
  });
}