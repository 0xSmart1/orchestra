import { Test } from '@nestjs/testing';
import { MemoryService } from './memory.service';
import { PrismaService } from '../../prisma.service';

describe('MemoryService', () => {
  let service: MemoryService;
  let prisma: { memoryDocument: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock } };

  beforeEach(async () => {
    prisma = { memoryDocument: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() } };
    const module = await Test.createTestingModule({
      providers: [MemoryService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(MemoryService);
  });

  it('creates a memory document', async () => {
    const input = { type: 'project_memory', filePath: 'PROJECT_MEMORY.md', project: { connect: { id: 'p1' } } };
    prisma.memoryDocument.create.mockResolvedValue({ id: 'clx1', ...input, version: 1 });
    const result = await service.create(input);
    expect(result.type).toBe('project_memory');
  });

  it('finds memory by project', async () => {
    prisma.memoryDocument.findMany.mockResolvedValue([]);
    const result = await service.findByProject('p1');
    expect(prisma.memoryDocument.findMany).toHaveBeenCalledWith({ where: { projectId: 'p1' } });
  });
});
