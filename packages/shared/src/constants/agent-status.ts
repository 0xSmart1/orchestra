export const AgentStatus = {
  IDLE: 'idle',
  THINKING: 'thinking',
  RESEARCHING: 'researching',
  CODING: 'coding',
  TESTING: 'testing',
  REVIEWING: 'reviewing',
  BLOCKED: 'blocked',
  WAITING_APPROVAL: 'waiting_approval',
  DONE: 'done',
} as const;

export type AgentStatusType = (typeof AgentStatus)[keyof typeof AgentStatus];
