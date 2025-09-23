import { PrismaClient } from '@prisma/client';
import type { CalendarEvent, CalendarCreate, CalendarUpdate } from '../lib/validators.js';
import { errors } from '../lib/errors.js';

// ============================================
// 캘린더 서비스
// ============================================

export class CalendarService {
  constructor(private prisma: PrismaClient) {}

  // ========================================
  // 캘린더 이벤트 생성
  // ========================================

  async createEvent(data: CalendarCreate): Promise<CalendarEvent> {
    // 시간 겹침 검사
    const conflicts = await this.checkConflicts(new Date(data.start), new Date(data.end));

    const event = await this.prisma.calendarEvent.create({
      data: {
        type: data.type,
        title: data.title,
        start: new Date(data.start),
        end: new Date(data.end),
        location: data.location,
        memo: data.memo,
        owner: data.owner,
        links: data.links || {},
        conflicts: conflicts.length > 0 ? conflicts : undefined,
      },
    });

    return this.toCalendarEvent(event);
  }

  // ========================================
  // 캘린더 이벤트 조회
  // ========================================

  async getEvent(id: string): Promise<CalendarEvent | null> {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!event) {
      return null;
    }

    return this.toCalendarEvent(event);
  }

  // ========================================
  // 캘린더 이벤트 목록 조회
  // ========================================

  async getEvents(params: {
    start?: string;
    end?: string;
    type?: string;
    owner?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    events: CalendarEvent[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    // 날짜 범위 필터
    if (params.start || params.end) {
      where.AND = [];
      if (params.start) {
        where.AND.push({ start: { gte: new Date(params.start) } });
      }
      if (params.end) {
        where.AND.push({ end: { lte: new Date(params.end) } });
      }
    }

    // 타입 필터
    if (params.type) {
      where.type = params.type;
    }

    // 소유자 필터
    if (params.owner) {
      where.owner = params.owner;
    }

    const [events, total] = await Promise.all([
      this.prisma.calendarEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { start: 'asc' },
      }),
      this.prisma.calendarEvent.count({ where }),
    ]);

    return {
      events: events.map(e => this.toCalendarEvent(e)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ========================================
  // 캘린더 이벤트 수정
  // ========================================

  async updateEvent(id: string, data: CalendarUpdate): Promise<CalendarEvent> {
    const existing = await this.prisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!existing) {
      throw errors.notFound('캘린더 이벤트', id);
    }

    // 시간이 변경된 경우 충돌 검사
    let conflicts: any[] = [];
    if (data.start || data.end) {
      const startTime = data.start ? new Date(data.start) : existing.start;
      const endTime = data.end ? new Date(data.end) : existing.end;
      conflicts = await this.checkConflicts(startTime, endTime, id);
    }

    const updateData: any = {};
    if (data.type) updateData.type = data.type;
    if (data.title) updateData.title = data.title;
    if (data.start) updateData.start = new Date(data.start);
    if (data.end) updateData.end = new Date(data.end);
    if (data.location !== undefined) updateData.location = data.location;
    if (data.memo !== undefined) updateData.memo = data.memo;
    if (data.owner !== undefined) updateData.owner = data.owner;
    if (data.links) updateData.links = data.links;
    if (conflicts.length > 0) updateData.conflicts = conflicts;

    const event = await this.prisma.calendarEvent.update({
      where: { id },
      data: updateData,
    });

    return this.toCalendarEvent(event);
  }

  // ========================================
  // 캘린더 이벤트 삭제
  // ========================================

  async deleteEvent(id: string): Promise<void> {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id },
    });

    if (!event) {
      throw errors.notFound('캘린더 이벤트', id);
    }

    await this.prisma.calendarEvent.delete({
      where: { id },
    });
  }

  // ========================================
  // 충돌 검사
  // ========================================

  private async checkConflicts(
    start: Date,
    end: Date,
    excludeId?: string
  ): Promise<Array<{ eventId: string; title: string }>> {
    const where: any = {
      AND: [
        { start: { lt: end } },
        { end: { gt: start } },
      ],
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const conflictingEvents = await this.prisma.calendarEvent.findMany({
      where,
      select: {
        id: true,
        title: true,
      },
    });

    return conflictingEvents.map(event => ({
      eventId: event.id,
      title: event.title,
    }));
  }

  // ========================================
  // ICS 파일 생성
  // ========================================

  async generateICS(params: {
    start?: string;
    end?: string;
    type?: string;
    owner?: string;
  }): Promise<string> {
    const { events } = await this.getEvents({ ...params, limit: 1000 });

    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//KIS ERP//Calendar//KO',
      'CALSCALE:GREGORIAN',
    ];

    for (const event of events) {
      icsLines.push(
        'BEGIN:VEVENT',
        `UID:${event.id}@kis-erp.com`,
        `DTSTART:${this.formatDateForICS(new Date(event.start))}`,
        `DTEND:${this.formatDateForICS(new Date(event.end))}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.memo || ''}`,
        `LOCATION:${event.location || ''}`,
        `CATEGORIES:${event.type.toUpperCase()}`,
        'END:VEVENT'
      );
    }

    icsLines.push('END:VCALENDAR');

    return icsLines.join('\r\n');
  }

  // ========================================
  // 월별 요약
  // ========================================

  async getMonthSummary(year: number, month: number): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    busyDays: number;
    conflicts: number;
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const events = await this.prisma.calendarEvent.findMany({
      where: {
        start: { gte: startDate },
        end: { lte: endDate },
      },
    });

    const eventsByType: Record<string, number> = {};
    const busyDates = new Set<string>();
    let conflictCount = 0;

    events.forEach(event => {
      // 타입별 집계
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;

      // 바쁜 날짜 집계
      const eventDate = event.start.toISOString().split('T')[0];
      busyDates.add(eventDate);

      // 충돌 집계
      if (event.conflicts && Array.isArray(event.conflicts) && event.conflicts.length > 0) {
        conflictCount++;
      }
    });

    return {
      totalEvents: events.length,
      eventsByType,
      busyDays: busyDates.size,
      conflicts: conflictCount,
    };
  }

  // ========================================
  // 헬퍼 함수들
  // ========================================

  private toCalendarEvent(event: any): CalendarEvent {
    return {
      id: event.id,
      type: event.type,
      title: event.title,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      location: event.location,
      memo: event.memo,
      owner: event.owner,
      links: event.links,
      conflicts: event.conflicts,
    };
  }

  private formatDateForICS(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
}