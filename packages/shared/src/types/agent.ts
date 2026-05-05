import { AgentStatusType } from '../constants';

export interface AgentTemplate {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  defaultToolIds: string[];
  defaultPermissionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentInstance {
  id: string;
  projectId: string;
  templateId: string | null;
  name: string;
  role: string;
  systemPrompt: string;
  promptVersion: number;
  modelProfileId: string | null;
  status: AgentStatusType;
  memoryPath: string | null;
  currentTaskId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAgentTemplateInput {
  name: string;
  role: string;
  systemPrompt: string;
  defaultToolIds?: string[];
  defaultPermissionId?: string;
}

export interface CreateAgentInstanceInput {
  projectId: string;
  templateId?: string;
  name: string;
  role: string;
  systemPrompt: string;
  modelProfileId?: string;
}
