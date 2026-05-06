import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { LlmClientService, ChatMessage } from '../model-gateway/llm-client.service';
import { Prisma } from '@prisma/client';

const ORCHESTRATOR_SYSTEM_PROMPT =
  'You are the Orchestrator agent for an AI team workspace. Your role is to: ' +
  'understand user intent, break down tasks, coordinate specialist workers, review their output, ' +
  'and synthesize results. Do NOT perform worker tasks yourself. When the user asks for work to be done, ' +
  'propose task assignments and team structure. Always ask clarifying questions when intent is ambiguous.';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private prisma: PrismaService,
    private llmClient: LlmClientService,
  ) {}

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
    projectId: string,
  ) {
    // Save user message
    await this.addMessage({
      conversation: { connect: { id: conversationId } },
      role: 'user',
      content: userMessage,
    });

    // Get project's default model profile
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { defaultModelProfileId: true },
    });

    let orchestratorContent: string;

    if (project?.defaultModelProfileId) {
      // Get conversation history for context
      const history = await this.getMessages(conversationId);
      const chatMessages: ChatMessage[] = history.map((m) => ({
        role: m.role === 'orchestrator' ? 'assistant' : (m.role as ChatMessage['role']),
        content: m.content,
      }));

      // Prepend system prompt
      const systemPrompt: ChatMessage = {
        role: 'system',
        content: ORCHESTRATOR_SYSTEM_PROMPT,
      };

      try {
        const result = await this.llmClient.chat(project.defaultModelProfileId, [
          systemPrompt,
          ...chatMessages,
        ]);
        orchestratorContent = result.content;
      } catch (error: any) {
        this.logger.error(`LLM call failed: ${error.message}`, error.stack);
        orchestratorContent = `[Orchestrator — LLM Error] ${error.message}. Falling back to stub mode.`;
      }
    } else {
      // No model profile configured — use stub
      orchestratorContent =
        `[Orchestrator — Stub] No model profile configured for this project. ` +
        `Configure one in the Models page. Your message: "${userMessage}"`;
    }

    const message = await this.addMessage({
      conversation: { connect: { id: conversationId } },
      role: 'orchestrator',
      content: orchestratorContent,
    });

    // Update conversation updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }
}
