import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ModelGatewayService {
  private readonly logger = new Logger(ModelGatewayService.name);

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

  updateProvider(id: string, data: Prisma.ModelProviderUpdateInput) {
    return this.prisma.modelProvider.update({ where: { id }, data });
  }

  removeProvider(id: string) {
    return this.prisma.modelProvider.delete({ where: { id } });
  }

  updateProfile(id: string, data: Prisma.ModelProfileUpdateInput) {
    return this.prisma.modelProfile.update({ where: { id }, data });
  }

  removeProfile(id: string) {
    return this.prisma.modelProfile.delete({ where: { id } });
  }

  /**
   * List models available from a provider by calling its /v1/models endpoint.
   * Works with any OpenAI-compatible API (OmniRoute, OpenAI, etc.)
   */
  async listAvailableModels(providerId: string): Promise<{ id: string; object: string; owned_by?: string }[]> {
    const provider = await this.prisma.modelProvider.findUnique({ where: { id: providerId } });
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    const envKey = `LLM_API_KEY_${provider.name.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
    const apiKey = process.env[envKey] || process.env.LLM_API_KEY;
    if (!apiKey) {
      throw new Error(`No API key for provider "${provider.name}". Set ${envKey} or LLM_API_KEY.`);
    }

    const baseUrl = provider.baseUrl.replace(/\/$/, '');
    const url = `${baseUrl}/v1/models`;

    this.logger.log(`Fetching available models from ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Provider API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      data?: Array<{ id: string; object: string; owned_by?: string }>;
    };

    return data.data ?? [];
  }
}
