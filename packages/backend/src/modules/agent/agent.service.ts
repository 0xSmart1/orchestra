import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AgentService {
  constructor(private prisma: PrismaService) {}

  createTemplate(data: Prisma.AgentTemplateCreateInput) {
    return this.prisma.agentTemplate.create({ data });
  }

  findAllTemplates() {
    return this.prisma.agentTemplate.findMany({ orderBy: { createdAt: 'desc' } });
  }

  createInstance(data: Prisma.AgentInstanceCreateInput) {
    return this.prisma.agentInstance.create({
      data,
      include: { project: true, template: true },
    });
  }

  findInstancesByProject(projectId: string) {
    return this.prisma.agentInstance.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOneInstance(id: string) {
    return this.prisma.agentInstance.findUnique({ where: { id } });
  }

  updateInstance(id: string, data: Prisma.AgentInstanceUpdateInput) {
    return this.prisma.agentInstance.update({ where: { id }, data });
  }

  removeInstance(id: string) {
    return this.prisma.agentInstance.delete({ where: { id } });
  }
}
