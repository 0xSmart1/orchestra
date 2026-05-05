import { EventTypeType } from '../constants';

export interface Event {
  id: string;
  projectId: string;
  type: EventTypeType;
  agentId: string | null;
  taskId: string | null;
  runId: string | null;
  payload: Record<string, unknown>;
  createdAt: Date;
}
