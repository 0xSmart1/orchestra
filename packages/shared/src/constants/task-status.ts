export const TaskStatus = {
  BACKLOG: 'backlog',
  ASSIGNED: 'assigned',
  RUNNING: 'running',
  BLOCKED: 'blocked',
  REVIEW: 'review',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;

export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];
