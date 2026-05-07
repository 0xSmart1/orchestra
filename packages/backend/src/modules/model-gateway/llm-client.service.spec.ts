import { Test } from '@nestjs/testing';
import { LlmClientService } from './llm-client.service';
import { PrismaService } from '../../prisma.service';

describe('LlmClientService', () => {
  let service: LlmClientService;
  let prisma: {
    modelProfile: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  const mockProfile = {
    id: 'profile1',
    name: 'GPT-4',
    modelName: 'gpt-4',
    endpoint: null,
    contextLimitTokens: 8192,
    budgetLimit: 10,
    budgetUsed: 0,
    provider: {
      id: 'prov1',
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      kind: 'openai_compat',
      authType: 'api_key',
    },
  };

  beforeEach(async () => {
    prisma = {
      modelProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [LlmClientService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(LlmClientService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('throws if profile not found', async () => {
    prisma.modelProfile.findUnique.mockResolvedValue(null);

    await expect(
      service.chat('nonexistent', [{ role: 'user', content: 'hi' }]),
    ).rejects.toThrow('Model profile not found: nonexistent');
  });

  it('throws if no API key is configured', async () => {
    prisma.modelProfile.findUnique.mockResolvedValue(mockProfile);

    // Ensure no env keys are set
    const originalEnvKey = process.env.LLM_API_KEY_OPENAI;
    const originalFallback = process.env.LLM_API_KEY;
    delete process.env.LLM_API_KEY_OPENAI;
    delete process.env.LLM_API_KEY;

    await expect(
      service.chat('profile1', [{ role: 'user', content: 'hi' }]),
    ).rejects.toThrow('No API key configured');

    // Restore
    if (originalEnvKey !== undefined) process.env.LLM_API_KEY_OPENAI = originalEnvKey;
    if (originalFallback !== undefined) process.env.LLM_API_KEY = originalFallback;
  });

  it('calls fetch with correct parameters and returns content', async () => {
    prisma.modelProfile.findUnique.mockResolvedValue(mockProfile);
    prisma.modelProfile.update.mockResolvedValue({ ...mockProfile, budgetUsed: 0.001 });

    // Set env key for the test
    process.env.LLM_API_KEY = 'test-key';

    // Mock global fetch
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Hello from LLM!' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      }),
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as any;

    try {
      const result = await service.chat('profile1', [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Hello' },
      ]);

      expect(result.content).toBe('Hello from LLM!');
      expect(result.tokensIn).toBe(10);
      expect(result.tokensOut).toBe(5);

      // Verify fetch was called with correct URL and payload
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.openai.com/v1/chat/completions');
      expect(options.method).toBe('POST');
      expect(options.headers.Authorization).toBe('Bearer test-key');

      const body = JSON.parse(options.body);
      expect(body.model).toBe('gpt-4');
      expect(body.messages).toEqual([
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Hello' },
      ]);
      expect(body.temperature).toBe(0.7);

      // Budget update should have been called
      expect(prisma.modelProfile.update).toHaveBeenCalledWith({
        where: { id: 'profile1' },
        data: { budgetUsed: { increment: 0.001 } },
      });
    } finally {
      globalThis.fetch = originalFetch;
      delete process.env.LLM_API_KEY;
    }
  });

  it('throws on non-ok LLM response', async () => {
    prisma.modelProfile.findUnique.mockResolvedValue(mockProfile);
    process.env.LLM_API_KEY = 'test-key';

    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Rate limit exceeded',
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as any;

    try {
      await expect(
        service.chat('profile1', [{ role: 'user', content: 'hi' }]),
      ).rejects.toThrow('LLM API error (429): Rate limit exceeded');
    } finally {
      globalThis.fetch = originalFetch;
      delete process.env.LLM_API_KEY;
    }
  });

  it('uses per-provider env key when available', async () => {
    prisma.modelProfile.findUnique.mockResolvedValue(mockProfile);
    prisma.modelProfile.update.mockResolvedValue(mockProfile);

    // Set per-provider key
    process.env.LLM_API_KEY_OPENAI = 'provider-specific-key';
    process.env.LLM_API_KEY = 'fallback-key';

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'response' } }],
        usage: {},
      }),
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as any;

    try {
      await service.chat('profile1', [{ role: 'user', content: 'hi' }]);
      const options = mockFetch.mock.calls[0][1];
      expect(options.headers.Authorization).toBe('Bearer provider-specific-key');
    } finally {
      globalThis.fetch = originalFetch;
      delete process.env.LLM_API_KEY_OPENAI;
      delete process.env.LLM_API_KEY;
    }
  });

  it('uses custom endpoint from profile when set', async () => {
    const profileWithEndpoint = {
      ...mockProfile,
      endpoint: '/chat/completions?version=2024-01-01',
    };
    prisma.modelProfile.findUnique.mockResolvedValue(profileWithEndpoint);
    prisma.modelProfile.update.mockResolvedValue(profileWithEndpoint);

    process.env.LLM_API_KEY = 'test-key';

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'ok' } }],
        usage: {},
      }),
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as any;

    try {
      await service.chat('profile1', [{ role: 'user', content: 'hi' }]);
      const url = mockFetch.mock.calls[0][0];
      expect(url).toBe('https://api.openai.com/v1/chat/completions?version=2024-01-01');
    } finally {
      globalThis.fetch = originalFetch;
      delete process.env.LLM_API_KEY;
    }
  });
});

describe('Anthropic provider', () => {
  let service: LlmClientService;
  let prisma: {
    modelProfile: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  const anthropicProfile = {
    id: 'profile_anthropic',
    name: 'Claude',
    modelName: 'claude-opus-4-7',
    endpoint: null,
    contextLimitTokens: 8192,
    budgetLimit: 10,
    budgetUsed: 0,
    provider: {
      id: 'prov_anthropic',
      name: 'Anthropic',
      baseUrl: 'https://api.anthropic.com',
      kind: 'anthropic',
      authType: 'api_key',
    },
  };

  beforeEach(async () => {
    prisma = {
      modelProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [LlmClientService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(LlmClientService);
  });

  it('uses x-api-key + anthropic-version and parses content blocks', async () => {
    prisma.modelProfile.findUnique.mockResolvedValue(anthropicProfile);
    prisma.modelProfile.update.mockResolvedValue(anthropicProfile);
    process.env.LLM_API_KEY_ANTHROPIC = 'sk-ant-test';

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: 'Hello from Claude!' }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 12, output_tokens: 6 },
      }),
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as any;

    try {
      const result = await service.chat('profile_anthropic', [
        { role: 'system', content: 'You are concise.' },
        { role: 'user', content: 'Hello' },
      ]);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.anthropic.com/v1/messages');
      expect(options.headers['x-api-key']).toBe('sk-ant-test');
      expect(options.headers['anthropic-version']).toBe('2023-06-01');
      expect(options.headers.Authorization).toBeUndefined();

      const body = JSON.parse(options.body);
      expect(body.model).toBe('claude-opus-4-7');
      expect(body.system).toBe('You are concise.');
      expect(body.messages).toEqual([{ role: 'user', content: 'Hello' }]);

      expect(result.content).toBe('Hello from Claude!');
      expect(result.tokensIn).toBe(12);
      expect(result.tokensOut).toBe(6);
      expect(result.finishReason).toBe('stop');
    } finally {
      globalThis.fetch = originalFetch;
      delete process.env.LLM_API_KEY_ANTHROPIC;
    }
  });

  it('translates assistant tool_calls to tool_use blocks and tool results to user tool_result blocks', async () => {
    prisma.modelProfile.findUnique.mockResolvedValue(anthropicProfile);
    prisma.modelProfile.update.mockResolvedValue(anthropicProfile);
    process.env.LLM_API_KEY_ANTHROPIC = 'sk-ant-test';

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [
          { type: 'tool_use', id: 'toolu_2', name: 'get_weather', input: { city: 'Berlin' } },
        ],
        stop_reason: 'tool_use',
        usage: { input_tokens: 30, output_tokens: 8 },
      }),
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as any;

    try {
      const result = await service.chat(
        'profile_anthropic',
        [
          { role: 'user', content: 'Weather?' },
          {
            role: 'assistant',
            content: null,
            toolCalls: [
              { id: 'toolu_1', type: 'function', function: { name: 'get_weather', arguments: '{"city":"Berlin"}' } },
            ],
          },
          { role: 'tool', toolCallId: 'toolu_1', content: '{"temp":10}' },
        ],
        [
          {
            type: 'function',
            function: { name: 'get_weather', description: 'Get weather', parameters: { type: 'object' } },
          },
        ],
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.tools).toEqual([
        { name: 'get_weather', description: 'Get weather', input_schema: { type: 'object' } },
      ]);
      expect(body.messages).toEqual([
        { role: 'user', content: 'Weather?' },
        {
          role: 'assistant',
          content: [{ type: 'tool_use', id: 'toolu_1', name: 'get_weather', input: { city: 'Berlin' } }],
        },
        {
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: 'toolu_1', content: '{"temp":10}' }],
        },
      ]);

      expect(result.toolCalls).toEqual([
        { id: 'toolu_2', type: 'function', function: { name: 'get_weather', arguments: '{"city":"Berlin"}' } },
      ]);
      expect(result.finishReason).toBe('tool_calls');
      expect(result.content).toBeNull();
    } finally {
      globalThis.fetch = originalFetch;
      delete process.env.LLM_API_KEY_ANTHROPIC;
    }
  });
});
