import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MemoryService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.MemoryDocumentCreateInput) {
    return this.prisma.memoryDocument.create({ data });
  }

  findByProject(projectId: string) {
    return this.prisma.memoryDocument.findMany({ where: { projectId } });
  }

  findByAgent(projectId: string, agentId: string) {
    return this.prisma.memoryDocument.findMany({ where: { projectId, agentId } });
  }

  findOne(id: string) {
    return this.prisma.memoryDocument.findUnique({ where: { id } });
  }

  update(id: string, data: Prisma.MemoryDocumentUpdateInput) {
    return this.prisma.memoryDocument.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.memoryDocument.delete({ where: { id } });
  }
}
