import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  toolCalls?: ToolCall[]; // only for role='assistant' with tool calls
  toolCallId?: string; // only for role='tool', links to a ToolCall.id
}

export interface ChatResult {
  content: string | null; // null when tool_calls present
  toolCalls: ToolCall[]; // empty array when no tool calls
  tokensIn: number;
  tokensOut: number;
  finishReason: string | null; // "stop", "tool_calls", etc.
}

@Injectable()
export class LlmClientService {
  private readonly logger = new Logger(LlmClientService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Send a chat completion request to an OpenAI-compatible LLM API.
   * Looks up the model profile + provider from the database, resolves the
   * API key from environment variables, and calls the endpoint.
   *
   * Convention for env keys (MVP):
   *   LLM_API_KEY_<PROVIDER_NAME_UPPERCASE>  — per-provider key
   *   LLM_API_KEY                            — fallback default key
   */
  async chat(
    profileId: string,
    messages: ChatMessage[],
    tools?: ToolDefinition[],
  ): Promise<ChatResult> {
    const profile = await this.prisma.modelProfile.findUnique({
      where: { id: profileId },
      include: { provider: true },
    });
    if (!profile) {
      throw new Error(`Model profile not found: ${profileId}`);
    }

    const provider = profile.provider;

    // Resolve API key from environment
    const envKey = `LLM_API_KEY_${provider.name.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
    const apiKey = process.env[envKey] || process.env.LLM_API_KEY;
    if (!apiKey) {
      throw new Error(
        `No API key configured for provider "${provider.name}". ` +
          `Set env variable ${envKey} or LLM_API_KEY.`,
      );
    }

    // Build URL
    const baseUrl = provider.baseUrl.replace(/\/$/, '');
    const endpoint = profile.endpoint || '/chat/completions';
    const url = /^https?:\/\//i.test(endpoint) ? endpoint : `${baseUrl}${endpoint}`;

    // Map messages to OpenAI format
    const mappedMessages = messages.map((m) => {
      if (m.role === 'tool') {
        return {
          role: 'tool' as const,
          tool_call_id: m.toolCallId,
          content: m.content ?? '',
        };
      }
      if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
        return {
          role: 'assistant' as const,
          content: m.content ?? null,
          tool_calls: m.toolCalls.map((tc) => ({
            id: tc.id,
            type: tc.type,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          })),
        };
      }
      const role =
        m.role === 'system' ? 'system' : m.role === 'assistant' ? 'assistant' : 'user';
      return { role, content: m.content ?? '' };
    });

    const maxTokens = profile.contextLimitTokens
      ? Math.min(profile.contextLimitTokens, 4096)
      : 4096;

    // Build request body
    const body: Record<string, any> = {
      model: profile.modelName,
      messages: mappedMessages,
      max_tokens: maxTokens,
      temperature: 0.7,
      stream: false,
    };

    if (tools && tools.length > 0) {
      body.tools = tools;
      body.tool_choice = 'auto';
    }

    this.logger.log(
      `Calling LLM: provider=${provider.name} model=${profile.modelName} url=${url} messages=${mappedMessages.length}${tools ? ` tools=${tools.length}` : ''}`,
    );

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      choices?: {
        message?: {
          content?: string | null;
          tool_calls?: Array<{
            id: string;
            type: string;
            function: { name: string; arguments: string };
          }>;
        };
        finish_reason?: string;
      }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const choice = data.choices?.[0];
    const content = choice?.message?.content ?? null;
    const finishReason = choice?.finish_reason ?? null;

    const toolCalls: ToolCall[] = (choice?.message?.tool_calls ?? []).map((tc) => ({
      id: tc.id,
      type: 'function' as const,
      function: {
        name: tc.function.name,
        arguments: tc.function.arguments,
      },
    }));

    const tokensIn = data.usage?.prompt_tokens ?? 0;
    const tokensOut = data.usage?.completion_tokens ?? 0;

    // Rough budget tracking — will be refined with actual pricing per model
    if (profile.budgetLimit !== null && profile.budgetLimit !== undefined) {
      await this.prisma.modelProfile.update({
        where: { id: profileId },
        data: { budgetUsed: { increment: 0.001 } },
      });
    }

    this.logger.log(
      `LLM response: tokensIn=${tokensIn} tokensOut=${tokensOut} contentLength=${content?.length ?? 0} toolCalls=${toolCalls.length} finishReason=${finishReason}`,
    );

    return { content, toolCalls, tokensIn, tokensOut, finishReason };
  }
}
