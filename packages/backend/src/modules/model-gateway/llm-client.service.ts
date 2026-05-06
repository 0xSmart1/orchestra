import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResult {
  content: string;
  tokensIn: number;
  tokensOut: number;
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
  async chat(profileId: string, messages: ChatMessage[]): Promise<ChatResult> {
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
    const endpoint = profile.endpoint || '/v1/chat/completions';
    const url = `${baseUrl}${endpoint}`;

    // Map roles: only system / user / assistant are valid for OpenAI-compatible APIs
    const mappedMessages = messages.map((m) => ({
      role: m.role === 'system' ? 'system' : m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    const maxTokens = profile.contextLimitTokens
      ? Math.min(profile.contextLimitTokens, 4096)
      : 4096;

    this.logger.log(
      `Calling LLM: provider=${provider.name} model=${profile.modelName} url=${url} messages=${mappedMessages.length}`,
    );

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: profile.modelName,
        messages: mappedMessages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const content = data.choices?.[0]?.message?.content ?? '';
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
      `LLM response: tokensIn=${tokensIn} tokensOut=${tokensOut} contentLength=${content.length}`,
    );

    return { content, tokensIn, tokensOut };
  }
}
