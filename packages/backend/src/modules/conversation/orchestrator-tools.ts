import { ToolDefinition } from '../model-gateway/llm-client.service';

export const ORCHESTRATOR_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'create_agent',
      description:
        'Create a new specialist worker agent in the current project. The agent will be available for task assignment.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Human-readable agent name (e.g. "Backend Engineer", "QA Tester")',
          },
          role: {
            type: 'string',
            enum: [
              'coder',
              'reviewer',
              'researcher',
              'designer',
              'qa',
              'devops',
              'writer',
            ],
            description: 'Agent specialization role',
          },
          systemPrompt: {
            type: 'string',
            description:
              'Detailed system prompt defining the agent behavior, constraints, and output format',
          },
        },
        required: ['name', 'role', 'systemPrompt'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description:
        'Create a task with a contract and optionally assign it to an agent. The contract should include goal, context, acceptance criteria, and evidence requirements.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short task title' },
          contract: {
            type: 'string',
            description:
              'Full task contract: goal, context, acceptance criteria, evidence requirements',
          },
          assigneeId: {
            type: 'string',
            description:
              'ID of the agent to assign this task to (use list_agents to get IDs)',
          },
          priority: {
            type: 'integer',
            description: 'Priority: 0=low, 1=normal, 2=high, 3=critical',
            enum: [0, 1, 2, 3],
          },
        },
        required: ['title', 'contract'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_worker',
      description:
        'Launch a worker agent to execute an assigned task. The worker runs in a separate LLM call with its system prompt + task contract and returns structured output.',
      parameters: {
        type: 'object',
        properties: {
          taskId: {
            type: 'string',
            description: 'ID of the task to run',
          },
          agentId: {
            type: 'string',
            description: 'ID of the agent to run',
          },
        },
        required: ['taskId', 'agentId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_agents',
      description:
        'List all agent instances in the current project with their IDs, names, roles, and statuses',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_tasks',
      description:
        'List all tasks in the current project with their IDs, titles, statuses, and assignees',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];
