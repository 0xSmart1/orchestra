import { Test } from '@nestjs/testing';
import { ConversationService } from './conversation.service';
import { PrismaService } from '../../prisma.service';

describe('ConversationService', () => {
  let service: ConversationService;
  let prisma: {
    conversation: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
      update: jest.Mock;
    };
    conversationMessage: {
      create: jest.Mock;
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      conversation: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
      conversationMessage: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        ConversationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ConversationService);
  });

  it('creates a conversation', async () => {
    const input = {
      title: 'Test Conversation',
      project: { connect: { id: 'p1' } },
    };
    const expected = {
      id: 'clx1',
      projectId: 'p1',
      title: 'Test Conversation',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prisma.conversation.create.mockResolvedValue(expected);

    const result = await service.create(input);
    expect(result.title).toBe('Test Conversation');
    expect(prisma.conversation.create).toHaveBeenCalledWith({ data: input });
  });

  it('finds conversations by project', async () => {
    prisma.conversation.findMany.mockResolvedValue([]);
    const result = await service.findByProject('p1');
    expect(result).toEqual([]);
    expect(prisma.conversation.findMany).toHaveBeenCalledWith({
      where: { projectId: 'p1' },
      orderBy: { updatedAt: 'desc' },
    });
  });

  it('finds one conversation with messages', async () => {
    const expected = {
      id: 'clx1',
      projectId: 'p1',
      title: 'Test',
      messages: [],
    };
    prisma.conversation.findUnique.mockResolvedValue(expected as any);
    const result = await service.findOne('clx1');
    expect(prisma.conversation.findUnique).toHaveBeenCalledWith({
      where: { id: 'clx1' },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  });

  it('deletes a conversation', async () => {
    prisma.conversation.delete.mockResolvedValue({ id: 'clx1' } as any);
    await service.remove('clx1');
    expect(prisma.conversation.delete).toHaveBeenCalledWith({
      where: { id: 'clx1' },
    });
  });

  it('adds a message', async () => {
    const input = {
      conversation: { connect: { id: 'clx1' } },
      role: 'user',
      content: 'Hello',
    };
    const expected = {
      id: 'msg1',
      conversationId: 'clx1',
      role: 'user',
      content: 'Hello',
      createdAt: new Date(),
    };
    prisma.conversationMessage.create.mockResolvedValue(expected);

    const result = await service.addMessage(input);
    expect(result.content).toBe('Hello');
    expect(prisma.conversationMessage.create).toHaveBeenCalledWith({
      data: input,
    });
  });

  it('gets messages for a conversation', async () => {
    prisma.conversationMessage.findMany.mockResolvedValue([]);
    const result = await service.getMessages('clx1');
    expect(result).toEqual([]);
    expect(prisma.conversationMessage.findMany).toHaveBeenCalledWith({
      where: { conversationId: 'clx1' },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('orchestratorRespond saves user message then orchestrator message', async () => {
    const userMessage = { id: 'msg1', conversationId: 'clx1', role: 'user', content: 'Do something' };
    const orchestratorMessage = {
      id: 'msg2',
      conversationId: 'clx1',
      role: 'orchestrator',
      content: '[Orchestrator] Received: "Do something". I\'ll analyze this and coordinate the team accordingly.',
    };

    prisma.conversationMessage.create
      .mockResolvedValueOnce(userMessage)
      .mockResolvedValueOnce(orchestratorMessage);
    prisma.conversation.update.mockResolvedValue({} as any);

    const result = await service.orchestratorRespond('clx1', 'Do something', 'p1');

    expect(prisma.conversationMessage.create).toHaveBeenCalledTimes(2);
    expect(prisma.conversationMessage.create).toHaveBeenNthCalledWith(1, {
      data: {
        conversation: { connect: { id: 'clx1' } },
        role: 'user',
        content: 'Do something',
      },
    });
    expect(prisma.conversationMessage.create).toHaveBeenNthCalledWith(2, {
      data: {
        conversation: { connect: { id: 'clx1' } },
        role: 'orchestrator',
        content: '[Orchestrator] Received: "Do something". I\'ll analyze this and coordinate the team accordingly.',
      },
    });
    expect(prisma.conversation.update).toHaveBeenCalledWith({
      where: { id: 'clx1' },
      data: { updatedAt: expect.any(Date) },
    });
    expect(result.role).toBe('orchestrator');
  });
});
