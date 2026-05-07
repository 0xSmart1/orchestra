import { Test } from '@nestjs/testing';
import { EventService } from './event.service';
import { PrismaService } from '../../prisma.service';

describe('EventService', () => {
  let service: EventService;
  let prisma: { event: { create: jest.Mock; findMany: jest.Mock } };

  beforeEach(async () => {
    prisma = { event: { create: jest.fn(), findMany: jest.fn() } };
    const module = await Test.createTestingModule({
      providers: [EventService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(EventService);
  });

  it('creates an event', async () => {
    const input = { type: 'agent.created', project: { connect: { id: 'p1' } } };
    prisma.event.create.mockResolvedValue({ id: 'clx1', type: 'agent.created', payload: '{"name":"Agent"}' });
    const result = await service.create(input);
    expect(result.type).toBe('agent.created');
    expect(result.payload).toEqual({ name: 'Agent' });
  });

  it('finds events by project with limit', async () => {
    prisma.event.findMany.mockResolvedValue([{ id: 'evt1', payload: '{"status":"coding"}' }]);
    const result = await service.findByProject('p1', 50);
    expect(prisma.event.findMany).toHaveBeenCalledWith({
      where: { projectId: 'p1' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    expect(result[0].payload).toEqual({ status: 'coding' });
  });

  it('keeps malformed payloads as empty objects', async () => {
    prisma.event.findMany.mockResolvedValue([{ id: 'evt1', payload: 'not-json' }]);
    const result = await service.findByProject('p1', 1);
    expect(result[0].payload).toEqual({});
  });
});
