import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.EventCreateInput) {
    return this.prisma.event.create({ data });
  }

  findByProject(projectId: string, limit = 100) {
    return this.prisma.event.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  findByProjectAndType(projectId: string, type: string, limit = 100) {
    return this.prisma.event.findMany({
      where: { projectId, type },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
