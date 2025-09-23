import { PrismaClient } from '@prisma/client';
import type { EmailGroup, EmailGroupCreate, EmailGroupUpdate, EmailThread, EmailThreadCreate, EmailThreadUpdate } from '../lib/validators.js';
import { errors } from '../lib/errors.js';

// ============================================
// 이메일 서비스
// ============================================

export class EmailService {
  constructor(private prisma: PrismaClient) {}

  // ========================================
  // 이메일 그룹 관리
  // ========================================

  async createGroup(data: EmailGroupCreate): Promise<EmailGroup> {
    // 중복 이름 검사
    const existing = await this.prisma.emailGroup.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw errors.conflict(`이메일 그룹 '${data.name}'이 이미 존재합니다.`);
    }

    const group = await this.prisma.emailGroup.create({
      data: {
        name: data.name,
        rules: data.rules,
      },
    });

    return this.toEmailGroup(group);
  }

  async getGroup(id: string): Promise<EmailGroup | null> {
    const group = await this.prisma.emailGroup.findUnique({
      where: { id },
      include: {
        threads: {
          orderBy: { createdAt: 'desc' },
          take: 10, // 최근 10개 스레드만
        },
      },
    });

    if (!group) {
      return null;
    }

    return this.toEmailGroup(group);
  }

  async getGroups(): Promise<EmailGroup[]> {
    const groups = await this.prisma.emailGroup.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { threads: true },
        },
      },
    });

    return groups.map(g => this.toEmailGroup(g));
  }

  async updateGroup(id: string, data: EmailGroupUpdate): Promise<EmailGroup> {
    const existing = await this.prisma.emailGroup.findUnique({
      where: { id },
    });

    if (!existing) {
      throw errors.notFound('이메일 그룹', id);
    }

    // 이름 중복 검사 (다른 그룹과)
    if (data.name && data.name !== existing.name) {
      const nameConflict = await this.prisma.emailGroup.findUnique({
        where: { name: data.name },
      });

      if (nameConflict) {
        throw errors.conflict(`이메일 그룹 '${data.name}'이 이미 존재합니다.`);
      }
    }

    const group = await this.prisma.emailGroup.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.rules && { rules: data.rules }),
      },
    });

    return this.toEmailGroup(group);
  }

  async deleteGroup(id: string): Promise<void> {
    const group = await this.prisma.emailGroup.findUnique({
      where: { id },
    });

    if (!group) {
      throw errors.notFound('이메일 그룹', id);
    }

    await this.prisma.emailGroup.delete({
      where: { id },
    });
  }

  // ========================================
  // 이메일 스레드 관리
  // ========================================

  async createThread(data: EmailThreadCreate): Promise<EmailThread> {
    // 그룹 자동 분류
    const groupId = data.groupId || await this.autoClassifyGroup(data.to, data.subject);

    const thread = await this.prisma.emailThread.create({
      data: {
        to: data.to,
        cc: data.cc,
        subject: data.subject,
        body: data.body || '',
        status: data.status || 'DRAFT',
        attachments: data.attachments || [],
        groupId,
      },
    });

    return this.toEmailThread(thread);
  }

  async getThread(id: string): Promise<EmailThread | null> {
    const thread = await this.prisma.emailThread.findUnique({
      where: { id },
      include: {
        group: true,
      },
    });

    if (!thread) {
      return null;
    }

    return this.toEmailThread(thread);
  }

  async getThreads(params: {
    groupId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    threads: EmailThread[];
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
    if (params.groupId) where.groupId = params.groupId;
    if (params.status) where.status = params.status;

    const [threads, total] = await Promise.all([
      this.prisma.emailThread.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          group: true,
        },
      }),
      this.prisma.emailThread.count({ where }),
    ]);

    return {
      threads: threads.map(t => this.toEmailThread(t)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateThread(id: string, data: EmailThreadUpdate): Promise<EmailThread> {
    const existing = await this.prisma.emailThread.findUnique({
      where: { id },
    });

    if (!existing) {
      throw errors.notFound('이메일 스레드', id);
    }

    const updateData: any = {};
    if (data.to !== undefined) updateData.to = data.to;
    if (data.cc !== undefined) updateData.cc = data.cc;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.body !== undefined) updateData.body = data.body;
    if (data.status) updateData.status = data.status;
    if (data.attachments) updateData.attachments = data.attachments;
    if (data.groupId !== undefined) updateData.groupId = data.groupId;

    const thread = await this.prisma.emailThread.update({
      where: { id },
      data: updateData,
    });

    return this.toEmailThread(thread);
  }

  async deleteThread(id: string): Promise<void> {
    const thread = await this.prisma.emailThread.findUnique({
      where: { id },
    });

    if (!thread) {
      throw errors.notFound('이메일 스레드', id);
    }

    await this.prisma.emailThread.delete({
      where: { id },
    });
  }

  // ========================================
  // 자동 분류
  // ========================================

  private async autoClassifyGroup(to?: string, subject?: string): Promise<string | null> {
    if (!to && !subject) {
      return null;
    }

    const groups = await this.prisma.emailGroup.findMany();

    for (const group of groups) {
      const rules = Array.isArray(group.rules) ? group.rules : [];

      for (const rule of rules) {
        if (rule.type === 'email' && to && to.includes(rule.value)) {
          return group.id;
        }
        if (rule.type === 'domain' && to && to.endsWith(rule.value)) {
          return group.id;
        }
      }
    }

    return null;
  }

  // ========================================
  // 통계 및 요약
  // ========================================

  async getEmailStats(): Promise<{
    totalThreads: number;
    threadsByStatus: Record<string, number>;
    threadsByGroup: Array<{ groupName: string; count: number }>;
    recentActivity: number; // 최근 7일
  }> {
    const [threads, groups] = await Promise.all([
      this.prisma.emailThread.findMany({
        select: {
          status: true,
          createdAt: true,
          group: {
            select: { name: true },
          },
        },
      }),
      this.prisma.emailGroup.findMany({
        include: {
          _count: {
            select: { threads: true },
          },
        },
      }),
    ]);

    const threadsByStatus: Record<string, number> = {};
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    let recentActivity = 0;

    threads.forEach(thread => {
      // 상태별 집계
      threadsByStatus[thread.status] = (threadsByStatus[thread.status] || 0) + 1;

      // 최근 활동 집계
      if (thread.createdAt >= weekAgo) {
        recentActivity++;
      }
    });

    const threadsByGroup = groups.map(group => ({
      groupName: group.name,
      count: group._count.threads,
    }));

    return {
      totalThreads: threads.length,
      threadsByStatus,
      threadsByGroup,
      recentActivity,
    };
  }

  // ========================================
  // 검색
  // ========================================

  async searchThreads(query: string, limit: number = 20): Promise<EmailThread[]> {
    const threads = await this.prisma.emailThread.findMany({
      where: {
        OR: [
          { subject: { contains: query, mode: 'insensitive' } },
          { body: { contains: query, mode: 'insensitive' } },
          { to: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        group: true,
      },
    });

    return threads.map(t => this.toEmailThread(t));
  }

  // ========================================
  // 헬퍼 함수들
  // ========================================

  private toEmailGroup(group: any): EmailGroup {
    return {
      id: group.id,
      name: group.name,
      rules: group.rules,
    };
  }

  private toEmailThread(thread: any): EmailThread {
    return {
      id: thread.id,
      to: thread.to,
      cc: thread.cc,
      subject: thread.subject,
      body: thread.body,
      status: thread.status,
      attachments: thread.attachments,
      groupId: thread.groupId,
    };
  }
}