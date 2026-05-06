import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RuntimeService {
  constructor(private prisma: PrismaService) {}

  createRun(data: Prisma.RunCreateInput) {
    return this.prisma.run.create({ data });
  }

  findRunsByTask(taskId: string) {
    return this.prisma.run.findMany({ where: { taskId }, orderBy: { createdAt: 'desc' } });
  }

  findRunById(id: string) {
    return this.prisma.run.findUnique({ where: { id } });
  }

  updateRun(id: string, data: Prisma.RunUpdateInput) {
    return this.prisma.run.update({ where: { id }, data });
  }

  createArtifact(data: Prisma.ArtifactCreateInput) {
    return this.prisma.artifact.create({ data });
  }

  findArtifactsByRun(runId: string) {
    return this.prisma.artifact.findMany({ where: { runId } });
  }
}
