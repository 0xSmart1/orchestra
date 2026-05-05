import { RunStatusValue } from '../constants';

export interface Run {
  id: string;
  taskId: string;
  modelProfileId: string | null;
  status: RunStatusValue;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number | null;
  resultState: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

export interface Artifact {
  id: string;
  runId: string;
  type: 'diff' | 'file' | 'report' | 'pr_draft' | 'screenshot' | 'log' | 'generated_asset';
  path: string;
  description: string;
  createdAt: Date;
}

export interface WorkerOutput {
  summary: string;
  filesTouched: string[];
  commandsRun: string[];
  resultEvidence: string;
  openRisks: string[];
  followUpRecommendation: string | null;
}

export interface ApprovalRequest {
  id: string;
  projectId: string;
  taskId: string | null;
  runId: string | null;
  proposedAction: string;
  risk: 'low' | 'medium' | 'high';
  decision: 'pending' | 'approved' | 'rejected' | null;
  decidedBy: string | null;
  createdAt: Date;
  decidedAt: Date | null;
}

export interface Conversation {
  id: string;
  projectId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'orchestrator' | 'worker';
  agentId: string | null;
  content: string;
  taskId: string | null;
  createdAt: Date;
}
