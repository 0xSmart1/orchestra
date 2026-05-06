import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ToolGatewayService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.ToolDefinitionCreateInput) {
    return this.prisma.toolDefinition.create({ data });
  }

  findAll() {
    return this.prisma.toolDefinition.findMany({ orderBy: { name: 'asc' } });
  }

  findOne(id: string) {
    return this.prisma.toolDefinition.findUnique({ where: { id } });
  }

  remove(id: string) {
    return this.prisma.toolDefinition.delete({ where: { id } });
  }
}
