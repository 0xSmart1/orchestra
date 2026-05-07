import { Test } from '@nestjs/testing';
import { AgentService } from './agent.service';
import { PrismaService } from '../../prisma.service';

describe('AgentService', () => {
  let service: AgentService;
  let prisma: {
    agentTemplate: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    agentInstance: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      agentTemplate: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
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

  it('finds one template', async () => {
    prisma.agentTemplate.findUnique.mockResolvedValue({ id: 'tpl1' } as any);
    await service.findOneTemplate('tpl1');
    expect(prisma.agentTemplate.findUnique).toHaveBeenCalledWith({ where: { id: 'tpl1' } });
  });

  it('updates a template', async () => {
    prisma.agentTemplate.update.mockResolvedValue({ id: 'tpl1', name: 'Reviewer' } as any);
    await service.updateTemplate('tpl1', { name: 'Reviewer' });
    expect(prisma.agentTemplate.update).toHaveBeenCalledWith({
      where: { id: 'tpl1' },
      data: { name: 'Reviewer' },
    });
  });

  it('deletes a template', async () => {
    prisma.agentTemplate.delete.mockResolvedValue({ id: 'tpl1' } as any);
    await service.removeTemplate('tpl1');
    expect(prisma.agentTemplate.delete).toHaveBeenCalledWith({ where: { id: 'tpl1' } });
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

  it('updates an instance with partial fields', async () => {
    prisma.agentInstance.update.mockResolvedValue({ id: 'agent1', name: 'QA-1' } as any);
    await service.updateInstance('agent1', { name: 'QA-1' });
    expect(prisma.agentInstance.update).toHaveBeenCalledWith({
      where: { id: 'agent1' },
      data: { name: 'QA-1' },
    });
  });
});
