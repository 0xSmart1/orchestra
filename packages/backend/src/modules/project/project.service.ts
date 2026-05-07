import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.ProjectCreateInput) {
    return this.prisma.project.create({ data });
  }

  findAll(options: { archived?: boolean } = {}) {
    return this.prisma.project.findMany({
      where: { archived: options.archived ?? false },
      orderBy: { createdAt: 'desc' },
      include: { defaultModelProfile: { select: { id: true, name: true, modelName: true } } },
    });
  }

  findOne(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: { defaultModelProfile: { select: { id: true, name: true, modelName: true } } },
    });
  }

  update(id: string, data: Prisma.ProjectUpdateInput) {
    return this.prisma.project.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }
}
