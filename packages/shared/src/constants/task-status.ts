export const TaskStatus = {
  BACKLOG: 'backlog',
  ASSIGNED: 'assigned',
  RUNNING: 'running',
  BLOCKED: 'blocked',
  REVIEW: 'review',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

export type TaskStatusValue = (typeof TaskStatus)[keyof typeof TaskStatus];
