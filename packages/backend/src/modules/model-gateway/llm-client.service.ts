import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export type ProviderKind = 'openai_compat' | 'anthropic';

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

const ANTHROPIC_VERSION = '2023-06-01';

@Injectable()
export class LlmClientService {
  private readonly logger = new Logger(LlmClientService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Send a chat completion request to an LLM API.
   * Dispatches to OpenAI-compatible or Anthropic based on provider.kind.
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

    const kind = (provider.kind ?? 'openai_compat') as ProviderKind;
    const maxTokens = profile.contextLimitTokens
      ? Math.min(profile.contextLimitTokens, 4096)
      : 4096;

    this.logger.log(
      `Calling LLM: kind=${kind} provider=${provider.name} model=${profile.modelName} messages=${messages.length}${tools ? ` tools=${tools.length}` : ''}`,
    );

    const result =
      kind === 'anthropic'
        ? await this.chatAnthropic(profile, provider, apiKey, messages, tools, maxTokens)
        : await this.chatOpenAi(profile, provider, apiKey, messages, tools, maxTokens);

    // Rough budget tracking — will be refined with actual pricing per model
    if (profile.budgetLimit !== null && profile.budgetLimit !== undefined) {
      await this.prisma.modelProfile.update({
        where: { id: profileId },
        data: { budgetUsed: { increment: 0.001 } },
      });
    }

    this.logger.log(
      `LLM response: tokensIn=${result.tokensIn} tokensOut=${result.tokensOut} contentLength=${result.content?.length ?? 0} toolCalls=${result.toolCalls.length} finishReason=${result.finishReason}`,
    );

    return result;
  }

  private async chatOpenAi(
    profile: any,
    provider: any,
    apiKey: string,
    messages: ChatMessage[],
    tools: ToolDefinition[] | undefined,
    maxTokens: number,
  ): Promise<ChatResult> {
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

    return {
      content,
      toolCalls,
      tokensIn: data.usage?.prompt_tokens ?? 0,
      tokensOut: data.usage?.completion_tokens ?? 0,
      finishReason,
    };
  }

  private async chatAnthropic(
    profile: any,
    provider: any,
    apiKey: string,
    messages: ChatMessage[],
    tools: ToolDefinition[] | undefined,
    maxTokens: number,
  ): Promise<ChatResult> {
    const baseUrl = provider.baseUrl.replace(/\/$/, '');
    const endpoint = profile.endpoint || '/v1/messages';
    const url = /^https?:\/\//i.test(endpoint) ? endpoint : `${baseUrl}${endpoint}`;

    // Aggregate all system messages into Anthropic's top-level `system`.
    const systemParts: string[] = [];
    const nonSystem: ChatMessage[] = [];
    for (const m of messages) {
      if (m.role === 'system') {
        if (m.content) systemParts.push(m.content);
      } else {
        nonSystem.push(m);
      }
    }

    const mappedMessages = nonSystem.map((m) => {
      if (m.role === 'tool') {
        return {
          role: 'user' as const,
          content: [
            {
              type: 'tool_result',
              tool_use_id: m.toolCallId,
              content: m.content ?? '',
            },
          ],
        };
      }
      if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
        const blocks: any[] = [];
        if (m.content) blocks.push({ type: 'text', text: m.content });
        for (const tc of m.toolCalls) {
          let input: any = {};
          try {
            input = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
          } catch {
            input = { _raw: tc.function.arguments };
          }
          blocks.push({ type: 'tool_use', id: tc.id, name: tc.function.name, input });
        }
        return { role: 'assistant' as const, content: blocks };
      }
      return {
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: m.content ?? '',
      };
    });

    const body: Record<string, any> = {
      model: profile.modelName,
      max_tokens: maxTokens,
      messages: mappedMessages,
    };

    if (systemParts.length > 0) body.system = systemParts.join('\n\n');

    if (tools && tools.length > 0) {
      body.tools = tools.map((t) => ({
        name: t.function.name,
        description: t.function.description,
        input_schema: t.function.parameters,
      }));
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as any;
    let content = '';
    const toolCalls: ToolCall[] = [];
    for (const block of data.content ?? []) {
      if (block.type === 'text') {
        content += block.text ?? '';
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          type: 'function' as const,
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input ?? {}),
          },
        });
      }
    }

    const stopReasonMap: Record<string, string> = {
      end_turn: 'stop',
      tool_use: 'tool_calls',
      max_tokens: 'length',
      stop_sequence: 'stop',
    };
    const finishReason = data.stop_reason
      ? stopReasonMap[data.stop_reason] ?? data.stop_reason
      : null;

    return {
      content: toolCalls.length > 0 && content === '' ? null : content,
      toolCalls,
      tokensIn: data.usage?.input_tokens ?? 0,
      tokensOut: data.usage?.output_tokens ?? 0,
      finishReason,
    };
  }
}
