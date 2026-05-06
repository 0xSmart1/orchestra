import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ModelGatewayService {
  constructor(private prisma: PrismaService) {}

  createProvider(data: Prisma.ModelProviderCreateInput) {
    return this.prisma.modelProvider.create({ data });
  }

  findAllProviders() {
    return this.prisma.modelProvider.findMany({ include: { profiles: true } });
  }

  createProfile(data: Prisma.ModelProfileCreateInput) {
    return this.prisma.modelProfile.create({ data });
  }

  findAllProfiles() {
    return this.prisma.modelProfile.findMany({ include: { provider: true } });
  }

  findOneProfile(id: string) {
    return this.prisma.modelProfile.findUnique({ where: { id }, include: { provider: true, fallback: true } });
  }
}
