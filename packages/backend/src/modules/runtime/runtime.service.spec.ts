import { Test } from '@nestjs/testing';
import { RuntimeService } from './runtime.service';
import { PrismaService } from '../../prisma.service';

describe('RuntimeService', () => {
  let service: RuntimeService;
  let prisma: { run: { create: jest.Mock; findMany: jest.Mock; update: jest.Mock }; artifact: { create: jest.Mock; findMany: jest.Mock } };

  beforeEach(async () => {
    prisma = { run: { create: jest.fn(), findMany: jest.fn(), update: jest.fn() }, artifact: { create: jest.fn(), findMany: jest.fn() } };
    const module = await Test.createTestingModule({
      providers: [RuntimeService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(RuntimeService);
  });

  it('creates a run', async () => {
    const input = { task: { connect: { id: 't1' } } };
    prisma.run.create.mockResolvedValue({ id: 'clx1', ...input, status: 'pending' });
    const result = await service.createRun(input);
    expect(result.status).toBe('pending');
  });

  it('finds runs by task', async () => {
    prisma.run.findMany.mockResolvedValue([]);
    const result = await service.findRunsByTask('t1');
    expect(prisma.run.findMany).toHaveBeenCalledWith({ where: { taskId: 't1' }, orderBy: { createdAt: 'desc' } });
  });
});
