import { Test } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { PrismaService } from '../../prisma.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let prisma: {
    project: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      project: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ProjectService);
  });

  it('creates a project', async () => {
    const input = {
      name: 'Test Project',
      description: 'A test',
      workspacePath: 'C:\\projects\\test',
    };
    const expected = { id: 'clx1', ...input, createdAt: new Date(), updatedAt: new Date(), repoUrl: null, repoBranch: null, defaultModelProfileId: null, memoryPath: null };
    prisma.project.create.mockResolvedValue(expected);

    const result = await service.create(input);
    expect(result.name).toBe('Test Project');
    expect(prisma.project.create).toHaveBeenCalledWith({ data: input });
  });

  it('finds all projects', async () => {
    prisma.project.findMany.mockResolvedValue([]);
    const result = await service.findAll();
    expect(result).toEqual([]);
  });

  it('finds one project by id', async () => {
    const expected = { id: 'clx1', name: 'Test' };
    prisma.project.findUnique.mockResolvedValue(expected as any);
    const result = await service.findOne('clx1');
    expect(prisma.project.findUnique).toHaveBeenCalledWith({ where: { id: 'clx1' } });
  });

  it('deletes a project', async () => {
    prisma.project.delete.mockResolvedValue({ id: 'clx1' } as any);
    await service.remove('clx1');
    expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: 'clx1' } });
  });
});
