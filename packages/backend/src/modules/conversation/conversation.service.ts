import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { LlmClientService, ChatMessage, ChatResult } from '../model-gateway/llm-client.service';
import { Prisma } from '@prisma/client';
import { ORCHESTRATOR_TOOLS } from './orchestrator-tools';
import { ToolExecutorService } from './tool-executor.service';

const ORCHESTRATOR_SYSTEM_PROMPT =
  'You are the Orchestrator agent for an AI team workspace. Your role is to: ' +
  'understand user intent, break down tasks, coordinate specialist workers, review their output, ' +
  'and synthesize results. Do NOT perform worker tasks yourself. When the user asks for work to be done, ' +
  'use your tools to create specialist agents, assign tasks to them, and run workers. ' +
  'Always ask clarifying questions when intent is ambiguous. ' +
  'When you create an agent, write a detailed system prompt that defines the agent role, constraints, and expected output format. ' +
  'When you create a task, write a detailed contract with goal, context, acceptance criteria, and evidence requirements.';

const MAX_REACT_ITERATIONS = 5;

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private prisma: PrismaService,
    private llmClient: LlmClientService,
    private toolExecutor: ToolExecutorService,
  ) {}

  create(data: Prisma.ConversationCreateInput) {
    return this.prisma.conversation.create({ data });
  }

  findByProject(projectId: string, options: { archived?: boolean } = {}) {
    return this.prisma.conversation.findMany({
      where: { projectId, archived: options.archived ?? false },
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

  update(id: string, data: Prisma.ConversationUpdateInput) {
    return this.prisma.conversation.update({ where: { id }, data });
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
    modelProfileIdOverride?: string,
  ) {
    // Save user message
    await this.addMessage({
      conversation: { connect: { id: conversationId } },
      role: 'user',
      content: userMessage,
    });

    // Resolve model profile: explicit override > project default
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { defaultModelProfileId: true },
    });
    const modelProfileId = modelProfileIdOverride ?? project?.defaultModelProfileId;

    if (!modelProfileId) {
      // No model profile configured — use stub
      const content =
        `[Orchestrator — Stub] No model profile configured for this project. ` +
        `Configure one in the Models page. Your message: "${userMessage}"`;
      const message = await this.addMessage({
        conversation: { connect: { id: conversationId } },
        role: 'orchestrator',
        content,
      });
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
      return message;
    }

    // Get conversation history for context
    const history = await this.getMessages(conversationId);
    const chatMessages: ChatMessage[] = history.map((m) => ({
      role:
        m.role === 'orchestrator'
          ? 'assistant'
          : m.role === 'user'
            ? 'user'
            : m.role === 'tool'
              ? 'tool'
              : 'user',
      content: m.content,
    }));

    // Prepend system prompt
    chatMessages.unshift({
      role: 'system',
      content: ORCHESTRATOR_SYSTEM_PROMPT,
    });

    // ReAct loop
    const actions: Array<{ tool: string; args: Record<string, any>; result: string }> = [];
    let lastResult: ChatResult | null = null;

    for (let i = 0; i < MAX_REACT_ITERATIONS; i++) {
      let result: ChatResult;
      try {
        result = await this.llmClient.chat(
          modelProfileId,
          chatMessages,
          ORCHESTRATOR_TOOLS,
        );
      } catch (error: any) {
        const message = await this.addMessage({
          conversation: { connect: { id: conversationId } },
          role: 'orchestrator',
          content: `[LLM Error] ${error.message}`,
        });

        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        return message;
      }
      lastResult = result;

      if (result.toolCalls.length === 0) {
        // No tool calls — final response
        const finalContent = result.content ?? '';

        const message = await this.addMessage({
          conversation: { connect: { id: conversationId } },
          role: 'orchestrator',
          content: finalContent,
          actions: JSON.stringify(actions),
        });

        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        return message;
      }

      // Process tool calls
      this.logger.log(
        `ReAct iteration ${i + 1}: ${result.toolCalls.length} tool call(s) — ${result.toolCalls.map((tc) => tc.function.name).join(', ')}`,
      );

      // Add assistant message with tool_calls to chat history
      chatMessages.push({
        role: 'assistant',
        content: result.content,
        toolCalls: result.toolCalls,
      });

      for (const toolCall of result.toolCalls) {
        let args: Record<string, any>;
        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch {
          args = {};
          this.logger.warn(`Failed to parse tool call arguments: ${toolCall.function.arguments}`);
        }

        const execution = await this.toolExecutor.executeTool(
          toolCall.function.name,
          args,
          projectId,
        );

        actions.push({
          tool: toolCall.function.name,
          args,
          result: execution.result,
        });

        // Feed tool result back to the LLM
        chatMessages.push({
          role: 'tool',
          content: execution.result,
          toolCallId: toolCall.id,
        });
      }
      // Loop continues — LLM sees tool results and decides next action
    }

    // Hit max iterations — save whatever we have
    this.logger.warn(`ReAct loop hit max iterations (${MAX_REACT_ITERATIONS})`);

    const content = lastResult?.content ?? '(reached maximum planning iterations, here is what I have so far)';
    const message = await this.addMessage({
      conversation: { connect: { id: conversationId } },
      role: 'orchestrator',
      content,
      actions: JSON.stringify(actions),
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }
}
