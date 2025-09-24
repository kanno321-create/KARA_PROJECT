import { PrismaClient } from '@prisma/client';
import type { Drawing, DrawingCreate, DrawingUpdate } from '../lib/validators.js';
import { errors } from '../lib/errors.js';
import { fromJsonArray } from '../lib/json-utils.js';

// ============================================
// 도면 서비스
// ============================================

export class DrawingService {
  constructor(private prisma: PrismaClient) {}

  // ========================================
  // 도면 생성
  // ========================================

  async createDrawing(data: DrawingCreate): Promise<Drawing> {
    // name+rev 유니크 검사
    const existing = await this.prisma.drawing.findFirst({
      where: {
        name: data.name,
        rev: data.rev,
      },
    });

    if (existing) {
      throw errors.conflict(
        `도면 '${data.name}' 리비전 '${data.rev}'가 이미 존재합니다.`,
        'name+rev 조합은 유일해야 합니다.'
      );
    }

    // 히스토리 엔트리 생성
    const initialHistory = [{
      ts: new Date().toISOString(),
      action: 'CREATE',
      note: '도면 생성',
    }];

    const drawing = await this.prisma.drawing.create({
      data: {
        name: data.name,
        rev: data.rev,
        date: data.date ? new Date(data.date) : undefined,
        author: data.author,
        tags: data.tags || [],
        memo: data.memo,
        history: data.history || initialHistory,
        links: data.links || {},
      },
    });

    return this.toDrawing(drawing);
  }

  // ========================================
  // 도면 조회
  // ========================================

  async getDrawing(id: string): Promise<Drawing | null> {
    const drawing = await this.prisma.drawing.findUnique({
      where: { id },
    });

    if (!drawing) {
      return null;
    }

    return this.toDrawing(drawing);
  }

  // ========================================
  // 도면 목록 조회
  // ========================================

  async getDrawings(params: {
    name?: string;
    author?: string;
    tags?: string[];
    page?: number;
    limit?: number;
  }): Promise<{
    drawings: Drawing[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    // 이름 필터 (부분 매칭)
    if (params.name) {
      where.name = {
        contains: params.name,
        mode: 'insensitive',
      };
    }

    // 작성자 필터
    if (params.author) {
      where.author = {
        contains: params.author,
        mode: 'insensitive',
      };
    }

    // 태그 필터 (배열 교집합)
    if (params.tags && params.tags.length > 0) {
      where.tags = {
        hasSome: params.tags,
      };
    }

    const [drawings, total] = await Promise.all([
      this.prisma.drawing.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { name: 'asc' },
          { rev: 'desc' }, // 같은 이름 내에서는 최신 리비전 우선
        ],
      }),
      this.prisma.drawing.count({ where }),
    ]);

    return {
      drawings: drawings.map(d => this.toDrawing(d)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ========================================
  // 도면 수정
  // ========================================

  async updateDrawing(id: string, data: DrawingUpdate): Promise<Drawing> {
    const existing = await this.prisma.drawing.findUnique({
      where: { id },
    });

    if (!existing) {
      throw errors.notFound('도면', id);
    }

    // 히스토리 업데이트
    const currentHistory = Array.isArray(existing.history) ? existing.history : [];
    const newHistoryEntry = {
      ts: new Date().toISOString(),
      action: 'UPDATE',
      note: '도면 정보 수정',
    };

    const updateData: any = {};
    if (data.date !== undefined) updateData.date = data.date ? new Date(data.date) : null;
    if (data.author !== undefined) updateData.author = data.author;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.memo !== undefined) updateData.memo = data.memo;
    if (data.links !== undefined) updateData.links = data.links;

    // 히스토리 추가
    updateData.history = [...currentHistory, newHistoryEntry];

    const drawing = await this.prisma.drawing.update({
      where: { id },
      data: updateData,
    });

    return this.toDrawing(drawing);
  }

  // ========================================
  // 도면 삭제
  // ========================================

  async deleteDrawing(id: string): Promise<void> {
    const drawing = await this.prisma.drawing.findUnique({
      where: { id },
    });

    if (!drawing) {
      throw errors.notFound('도면', id);
    }

    await this.prisma.drawing.delete({
      where: { id },
    });
  }

  // ========================================
  // 도면 리비전 조회
  // ========================================

  async getDrawingRevisions(name: string): Promise<Drawing[]> {
    const drawings = await this.prisma.drawing.findMany({
      where: { name },
      orderBy: { rev: 'desc' },
    });

    return drawings.map(d => this.toDrawing(d));
  }

  // ========================================
  // 최신 리비전 조회
  // ========================================

  async getLatestRevision(name: string): Promise<Drawing | null> {
    const drawing = await this.prisma.drawing.findFirst({
      where: { name },
      orderBy: { rev: 'desc' },
    });

    if (!drawing) {
      return null;
    }

    return this.toDrawing(drawing);
  }

  // ========================================
  // 도면 링크 관리
  // ========================================

  async linkToEstimate(drawingId: string, estimateId: string): Promise<void> {
    const drawing = await this.prisma.drawing.findUnique({
      where: { id: drawingId },
    });

    if (!drawing) {
      throw errors.notFound('도면', drawingId);
    }

    const currentLinks = drawing.links as any || {};
    const estimates = currentLinks.estimates || [];

    if (!estimates.includes(estimateId)) {
      estimates.push(estimateId);

      await this.prisma.drawing.update({
        where: { id: drawingId },
        data: {
          links: {
            ...currentLinks,
            estimates,
          },
        },
      });
    }
  }

  async unlinkFromEstimate(drawingId: string, estimateId: string): Promise<void> {
    const drawing = await this.prisma.drawing.findUnique({
      where: { id: drawingId },
    });

    if (!drawing) {
      throw errors.notFound('도면', drawingId);
    }

    const currentLinks = drawing.links as any || {};
    const estimates = currentLinks.estimates || [];
    const filteredEstimates = estimates.filter((id: string) => id !== estimateId);

    await this.prisma.drawing.update({
      where: { id: drawingId },
      data: {
        links: {
          ...currentLinks,
          estimates: filteredEstimates,
        },
      },
    });
  }

  async linkToEvent(drawingId: string, eventId: string): Promise<void> {
    const drawing = await this.prisma.drawing.findUnique({
      where: { id: drawingId },
    });

    if (!drawing) {
      throw errors.notFound('도면', drawingId);
    }

    const currentLinks = drawing.links as any || {};
    const events = currentLinks.events || [];

    if (!events.includes(eventId)) {
      events.push(eventId);

      await this.prisma.drawing.update({
        where: { id: drawingId },
        data: {
          links: {
            ...currentLinks,
            events,
          },
        },
      });
    }
  }

  // ========================================
  // 태그 관리
  // ========================================

  async getAllTags(): Promise<string[]> {
    const drawings = await this.prisma.drawing.findMany({
      select: { tags: true },
    });

    const allTags = new Set<string>();
    drawings.forEach(drawing => {
      const tags = fromJsonArray<string>(drawing.tags) || [];
      tags.forEach(tag => allTags.add(tag));
    });

    return Array.from(allTags).sort();
  }

  async getDrawingsByTag(tag: string): Promise<Drawing[]> {
    const drawings = await this.prisma.drawing.findMany({
      where: {
        // Use JSON path to search within array
        tags: {
          path: '$[*]',
          equals: tag,
        },
      },
      orderBy: [
        { name: 'asc' },
        { rev: 'desc' },
      ],
    });

    return drawings.map(d => this.toDrawing(d));
  }

  // ========================================
  // 검색
  // ========================================

  async searchDrawings(query: string, limit: number = 20): Promise<Drawing[]> {
    const drawings = await this.prisma.drawing.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { author: { contains: query } },
          { memo: { contains: query } },
          { tags: { path: '$[*]', equals: query } },
        ],
      },
      take: limit,
      orderBy: [
        { name: 'asc' },
        { rev: 'desc' },
      ],
    });

    return drawings.map(d => this.toDrawing(d));
  }

  // ========================================
  // 통계
  // ========================================

  async getDrawingStats(): Promise<{
    totalDrawings: number;
    uniqueNames: number;
    authorCount: number;
    tagCount: number;
    recentDrawings: number; // 최근 30일
  }> {
    const drawings = await this.prisma.drawing.findMany({
      select: {
        name: true,
        author: true,
        tags: true,
        createdAt: true,
      },
    });

    const uniqueNames = new Set(drawings.map(d => d.name)).size;
    const authors = new Set(drawings.map(d => d.author).filter(Boolean)).size;

    const allTags = new Set<string>();
    drawings.forEach(drawing => {
      const tags = fromJsonArray<string>(drawing.tags) || [];
      tags.forEach(tag => allTags.add(tag));
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentDrawings = drawings.filter(d => d.createdAt >= thirtyDaysAgo).length;

    return {
      totalDrawings: drawings.length,
      uniqueNames,
      authorCount: authors,
      tagCount: allTags.size,
      recentDrawings,
    };
  }

  // ========================================
  // 헬퍼 함수
  // ========================================

  private toDrawing(drawing: any): Drawing {
    return {
      id: drawing.id,
      name: drawing.name,
      rev: drawing.rev,
      date: drawing.date?.toISOString(),
      author: drawing.author,
      tags: drawing.tags,
      memo: drawing.memo,
      history: drawing.history,
      links: drawing.links,
    };
  }
}