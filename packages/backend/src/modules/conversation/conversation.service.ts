import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConversationService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.ConversationCreateInput) {
    return this.prisma.conversation.create({ data });
  }

  findByProject(projectId: string) {
    return this.prisma.conversation.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  remove(id: string) {
    return this.prisma.conversation.delete({ where: { id } });
  }

  addMessage(data: Prisma.ConversationMessageCreateInput) {
    return this.prisma.conversationMessage.create({ data });
  }

  getMessages(conversationId: string) {
    return this.prisma.conversationMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async orchestratorRespond(
    conversationId: string,
    userMessage: string,
    _projectId: string,
  ) {
    // Save user message
    await this.addMessage({
      conversation: { connect: { id: conversationId } },
      role: 'user',
      content: userMessage,
    });

    // Simulate orchestrator thinking and responding
    // For MVP: just echo back with a structured response
    const orchestratorResponse = `[Orchestrator] Received: "${userMessage}". I'll analyze this and coordinate the team accordingly.`;

    const message = await this.addMessage({
      conversation: { connect: { id: conversationId } },
      role: 'orchestrator',
      content: orchestratorResponse,
    });

    // Update conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }
}
