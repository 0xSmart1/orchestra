import { Test } from '@nestjs/testing';
import { ToolGatewayService } from './tool-gateway.service';
import { PrismaService } from '../../prisma.service';

describe('ToolGatewayService', () => {
  let service: ToolGatewayService;
  let prisma: { toolDefinition: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; delete: jest.Mock } };

  beforeEach(async () => {
    prisma = { toolDefinition: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), delete: jest.fn() } };
    const module = await Test.createTestingModule({
      providers: [ToolGatewayService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ToolGatewayService);
  });

  it('creates a tool', async () => {
    const input = { name: 'shell', type: 'local', description: 'Shell command execution' };
    prisma.toolDefinition.create.mockResolvedValue({ id: 'clx1', ...input });
    const result = await service.create(input);
    expect(result.name).toBe('shell');
  });
});
