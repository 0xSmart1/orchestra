import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.EventCreateInput) {
    const event = await this.prisma.event.create({ data });
    return this.toDto(event);
  }

  async findByProject(projectId: string, limit = 100) {
    const events = await this.prisma.event.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return events.map((event) => this.toDto(event));
  }

  async findByProjectAndType(projectId: string, type: string, limit = 100) {
    const events = await this.prisma.event.findMany({
      where: { projectId, type },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return events.map((event) => this.toDto(event));
  }

  toDto<T extends { payload?: string | null }>(event: T): Omit<T, 'payload'> & { payload: Record<string, unknown> } {
    let payload: Record<string, unknown> = {};
    if (event.payload) {
      try {
        const parsed = JSON.parse(event.payload);
        payload = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
      } catch {
        payload = {};
      }
    }
    return { ...event, payload };
  }
}
