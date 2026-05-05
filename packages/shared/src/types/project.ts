export interface Project {
  id: string;
  name: string;
  description: string;
  workspacePath: string;
  repoUrl: string | null;
  repoBranch: string | null;
  defaultModelProfileId: string | null;
  memoryPath: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  workspacePath: string;
  repoUrl?: string;
  repoBranch?: string;
  defaultModelProfileId?: string;
}
