import { Test } from '@nestjs/testing';
import { TaskService } from './task.service';
import { PrismaService } from '../../prisma.service';

describe('TaskService', () => {
  let service: TaskService;
  let prisma: { task: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock } };

  beforeEach(async () => {
    prisma = { task: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() } };
    const module = await Test.createTestingModule({
      providers: [TaskService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(TaskService);
  });

  it('creates a task', async () => {
    const input = { title: 'Build API', project: { connect: { id: 'p1' } } };
    prisma.task.create.mockResolvedValue({ id: 'clx1', ...input, status: 'backlog' });
    const result = await service.create(input);
    expect(result.title).toBe('Build API');
  });

  it('finds tasks by project', async () => {
    prisma.task.findMany.mockResolvedValue([]);
    const result = await service.findByProject('p1');
    expect(prisma.task.findMany).toHaveBeenCalledWith({ where: { projectId: 'p1' }, orderBy: { priority: 'desc' } });
  });
});
