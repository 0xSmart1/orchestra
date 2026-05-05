export interface MemoryDocument {
  id: string;
  projectId: string;
  agentId: string | null;
  type: 'project_memory' | 'decisions' | 'task_log' | 'agent_memory';
  filePath: string;
  version: number;
  lastSummary: string | null;
  createdAt: Date;
  updatedAt: Date;
}
