import { Test } from '@nestjs/testing';
import { ModelGatewayService } from './model-gateway.service';
import { PrismaService } from '../../prisma.service';

describe('ModelGatewayService', () => {
  let service: ModelGatewayService;
  let prisma: {
    modelProvider: { create: jest.Mock; findMany: jest.Mock };
    modelProfile: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      modelProvider: { create: jest.fn(), findMany: jest.fn() },
      modelProfile: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
    };
    const module = await Test.createTestingModule({
      providers: [ModelGatewayService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ModelGatewayService);
  });

  it('creates a provider', async () => {
    const input = { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', authType: 'api_key' };
    prisma.modelProvider.create.mockResolvedValue({ id: 'clx1', ...input });
    const result = await service.createProvider(input);
    expect(result.name).toBe('OpenAI');
  });

  it('creates a profile', async () => {
    const input = { name: 'GPT-4', modelName: 'gpt-4', provider: { connect: { id: 'clx1' } } };
    prisma.modelProfile.create.mockResolvedValue({ id: 'clx2', ...input });
    const result = await service.createProfile(input);
    expect(result.name).toBe('GPT-4');
  });
});
