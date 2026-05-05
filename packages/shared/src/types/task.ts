import { TaskStatusType } from '../constants';

export interface TaskContract {
  goal: string;
  contextSlice: string;
  allowedFiles: string[];
  allowedTools: string[];
  disallowedActions: string[];
  modelProfileId: string;
  expectedArtifact: string;
  acceptanceCriteria: string[];
  evidenceRequirements: string[];
  reviewerAgentId: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  contract: TaskContract | null;
  status: TaskStatusType;
  assigneeId: string | null;
  reviewerId: string | null;
  priority: number;
  parentTaskId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  contract?: TaskContract;
  assigneeId?: string;
  reviewerId?: string;
  priority?: number;
  parentTaskId?: string;
}
