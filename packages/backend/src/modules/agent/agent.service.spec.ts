import { Test } from '@nestjs/testing';
import { AgentService } from './agent.service';
import { PrismaService } from '../../prisma.service';

describe('AgentService', () => {
  let service: AgentService;
  let prisma: {
    agentTemplate: { create: jest.Mock; findMany: jest.Mock };
    agentInstance: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      agentTemplate: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      agentInstance: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AgentService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(AgentService);
  });

  it('creates a template', async () => {
    const input = { name: 'Frontend Dev', role: 'frontend', systemPrompt: 'You are a frontend dev' };
    prisma.agentTemplate.create.mockResolvedValue({ id: 'clx1', ...input });
    const result = await service.createTemplate(input);
    expect(result.name).toBe('Frontend Dev');
  });

  it('creates an instance', async () => {
    const input = {
      name: 'FE-1',
      role: 'frontend',
      systemPrompt: 'You are a frontend dev',
      project: { connect: { id: 'proj1' } },
    };
    prisma.agentInstance.create.mockResolvedValue({ id: 'clx2', ...input });
    const result = await service.createInstance(input);
    expect(result.name).toBe('FE-1');
  });

  it('finds instances by project', async () => {
    prisma.agentInstance.findMany.mockResolvedValue([]);
    const result = await service.findInstancesByProject('proj1');
    expect(prisma.agentInstance.findMany).toHaveBeenCalledWith({
      where: { projectId: 'proj1' },
      orderBy: { createdAt: 'desc' },
    });
  });
});
