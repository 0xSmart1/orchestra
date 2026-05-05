export const EventType = {
  AGENT_CREATED: 'agent.created',
  AGENT_STATUS_CHANGED: 'agent.status.changed',
  TASK_CREATED: 'task.created',
  TASK_ASSIGNED: 'task.assigned',
  RUN_STARTED: 'run.started',
  RUN_MODEL_CALL_STARTED: 'run.model_call.started',
  RUN_TOOL_CALL_STARTED: 'run.tool_call.started',
  RUN_ARTIFACT_CREATED: 'run.artifact.created',
  RUN_BLOCKED: 'run.blocked',
  APPROVAL_REQUESTED: 'approval.requested',
  REVIEW_STARTED: 'review.started',
  REVIEW_REJECTED: 'review.rejected',
  REVIEW_ACCEPTED: 'review.accepted',
  MEMORY_UPDATED: 'memory.updated',
  COST_THRESHOLD_WARNING: 'cost.threshold.warning',
} as const;

export type EventTypeType = (typeof EventType)[keyof typeof EventType];
