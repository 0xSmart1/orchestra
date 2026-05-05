# Scaffold + Data Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a working monorepo with NestJS backend, Next.js frontend, complete Prisma schema covering all design entities, and shared TypeScript types — the foundation for every subsequent feature plan.

**Architecture:** npm workspaces monorepo with three packages: `shared` (types + constants), `backend` (NestJS + Prisma/SQLite), `frontend` (Next.js + Tailwind). Each core service boundary maps to a NestJS module. Prisma schema encodes all 14 entities from the design doc with proper relations.

**Tech Stack:** TypeScript, NestJS 10, Next.js 14 (App Router), Prisma 5, SQLite, Tailwind CSS 3, npm workspaces, Jest

---

## File Structure

```
d:\orchestra\
├── .gitignore
├── .env
├── CLAUDE.md
├── package.json                          # npm workspace root
├── tsconfig.base.json                    # shared TS config
├── packages/
│   ├── shared/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── types/
│   │       │   ├── project.ts
│   │       │   ├── agent.ts
│   │       │   ├── model.ts
│   │       │   ├── task.ts
│   │       │   ├── runtime.ts
│   │       │   ├── event.ts
│   │       │   ├── memory.ts
│   │       │   ├── permission.ts
│   │       │   ├── tool.ts
│   │       │   └── index.ts
│   │       ├── constants/
│   │       │   ├── task-status.ts
│   │       │   ├── agent-status.ts
│   │       │   ├── event-type.ts
│   │       │   └── index.ts
│   │       └── index.ts
│   ├── backend/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   ├── jest.config.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       └── modules/
│   │           ├── project/
│   │           │   ├── project.module.ts
│   │           │   ├── project.service.ts
│   │           │   ├── project.service.spec.ts
│   │           │   ├── project.controller.ts
│   │           │   └── project.controller.spec.ts
│   │           ├── agent/
│   │           │   ├── agent.module.ts
│   │           │   ├── agent.service.ts
│   │           │   ├── agent.service.spec.ts
│   │           │   ├── agent.controller.ts
│   │           │   └── agent.controller.spec.ts
│   │           ├── model-gateway/
│   │           │   ├── model-gateway.module.ts
│   │           │   ├── model-gateway.service.ts
│   │           │   └── model-gateway.service.spec.ts
│   │           ├── task/
│   │           │   ├── task.module.ts
│   │           │   ├── task.service.ts
│   │           │   └── task.service.spec.ts
│   │           ├── runtime/
│   │           │   ├── runtime.module.ts
│   │           │   ├── runtime.service.ts
│   │           │   └── runtime.service.spec.ts
│   │           ├── tool-gateway/
│   │           │   ├── tool-gateway.module.ts
│   │           │   ├── tool-gateway.service.ts
│   │           │   └── tool-gateway.service.spec.ts
│   │           ├── memory/
│   │           │   ├── memory.module.ts
│   │           │   ├── memory.service.ts
│   │           │   └── memory.service.spec.ts
│   │           └── event/
│   │               ├── event.module.ts
│   │               ├── event.service.ts
│   │               └── event.service.spec.ts
│   └── frontend/
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.js
│       ├── tailwind.config.ts
│       ├── postcss.config.js
│       └── src/
│           ├── app/
│           │   ├── layout.tsx
│           │   ├── page.tsx
│           │   └── globals.css
│           └── components/
│               └── layout/
│                   ├── sidebar.tsx
│                   └── header.tsx
```

---

### Task 1: Git Init + Root Workspace Config

**Files:**
- Create: `d:\orchestra\.gitignore`
- Create: `d:\orchestra\package.json`
- Create: `d:\orchestra\tsconfig.base.json`

- [ ] **Step 1: Initialize git repo**

```powershell
cd D:\orchestra
git init
```

Expected: `Initialized empty Git repository in D:/orchestra/.git/`

- [ ] **Step 2: Create `.gitignore`**

```gitignore
node_modules/
dist/
.env
*.db
*.db-journal
.next/
coverage/
.DS_Store
Thumbs.db
```

Write to `D:\orchestra\.gitignore`.

- [ ] **Step 3: Create root `package.json`**

```json
{
  "name": "orchestra",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "dev:backend": "npm run dev --workspace=@orchestra/backend",
    "dev:frontend": "npm run dev --workspace=@orchestra/frontend",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces",
    "db:migrate": "npm run db:migrate --workspace=@orchestra/backend",
    "db:generate": "npm run db:generate --workspace=@orchestra/backend"
  }
}
```

Write to `D:\orchestra\package.json`.

- [ ] **Step 4: Create `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@orchestra/shared": ["packages/shared/src"],
      "@orchestra/shared/*": ["packages/shared/src/*"]
    }
  },
  "exclude": ["node_modules", "dist"]
}
```

Write to `D:\orchestra\tsconfig.base.json`.

- [ ] **Step 5: Commit scaffold**

```powershell
git add .gitignore package.json tsconfig.base.json CLAUDE.md agent-control-plane-design.md
git commit -m "chore: init monorepo scaffold with workspace config"
```

Expected: commit created successfully.

---

### Task 2: Shared Types Package

**Files:**
- Create: `d:\orchestra\packages\shared\package.json`
- Create: `d:\orchestra\packages\shared\tsconfig.json`
- Create: `d:\orchestra\packages\shared\src\types\project.ts`
- Create: `d:\orchestra\packages\shared\src\types\agent.ts`
- Create: `d:\orchestra\packages\shared\src\types\model.ts`
- Create: `d:\orchestra\packages\shared\src\types\task.ts`
- Create: `d:\orchestra\packages\shared\src\types\runtime.ts`
- Create: `d:\orchestra\packages\shared\src\types\event.ts`
- Create: `d:\orchestra\packages\shared\src\types\memory.ts`
- Create: `d:\orchestra\packages\shared\src\types\permission.ts`
- Create: `d:\orchestra\packages\shared\src\types\tool.ts`
- Create: `d:\orchestra\packages\shared\src\types\index.ts`
- Create: `d:\orchestra\packages\shared\src\constants\task-status.ts`
- Create: `d:\orchestra\packages\shared\src\constants\agent-status.ts`
- Create: `d:\orchestra\packages\shared\src\constants\event-type.ts`
- Create: `d:\orchestra\packages\shared\src\constants\index.ts`
- Create: `d:\orchestra\packages\shared\src\index.ts`

- [ ] **Step 1: Create shared `package.json`**

```json
{
  "name": "@orchestra/shared",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  }
}
```

Write to `D:\orchestra\packages\shared\package.json`.

- [ ] **Step 2: Create shared `tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

Write to `D:\orchestra\packages\shared\tsconfig.json`.

- [ ] **Step 3: Create `task-status.ts` constants**

```typescript
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
```

Write to `D:\orchestra\packages\shared\src\constants\task-status.ts`.

- [ ] **Step 4: Create `agent-status.ts` constants**

```typescript
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
```

Write to `D:\orchestra\packages\shared\src\constants\agent-status.ts`.

- [ ] **Step 5: Create `event-type.ts` constants**

```typescript
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
```

Write to `D:\orchestra\packages\shared\src\constants\event-type.ts`.

- [ ] **Step 6: Create `constants/index.ts`**

```typescript
export { TaskStatus, type TaskStatusType } from './task-status';
export { AgentStatus, type AgentStatusType } from './agent-status';
export { EventType, type EventTypeType } from './event-type';
```

Write to `D:\orchestra\packages\shared\src\constants\index.ts`.

- [ ] **Step 7: Create `types/project.ts`**

```typescript
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
```

Write to `D:\orchestra\packages\shared\src\types\project.ts`.

- [ ] **Step 8: Create `types/agent.ts`**

```typescript
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
```

Write to `D:\orchestra\packages\shared\src\types\agent.ts`.

- [ ] **Step 9: Create `types/model.ts`**

```typescript
export interface ModelProvider {
  id: string;
  name: string;
  baseUrl: string;
  authType: 'api_key' | 'oauth' | 'none';
  encryptedSecretRef: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelProfile {
  id: string;
  name: string;
  providerId: string;
  modelName: string;
  endpoint: string | null;
  fallbackProfileId: string | null;
  budgetLimit: number | null;
  budgetUsed: number;
  rateLimitRpm: number | null;
  contextLimitTokens: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateModelProviderInput {
  name: string;
  baseUrl: string;
  authType: 'api_key' | 'oauth' | 'none';
}

export interface CreateModelProfileInput {
  name: string;
  providerId: string;
  modelName: string;
  endpoint?: string;
  fallbackProfileId?: string;
  budgetLimit?: number;
  rateLimitRpm?: number;
  contextLimitTokens?: number;
}
```

Write to `D:\orchestra\packages\shared\src\types\model.ts`.

- [ ] **Step 10: Create `types/task.ts`**

```typescript
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
```

Write to `D:\orchestra\packages\shared\src\types\task.ts`.

- [ ] **Step 11: Create `types/runtime.ts`**

```typescript
export interface Run {
  id: string;
  taskId: string;
  modelProfileId: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
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
```

Write to `D:\orchestra\packages\shared\src\types\runtime.ts`.

- [ ] **Step 12: Create `types/event.ts`**

```typescript
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
```

Write to `D:\orchestra\packages\shared\src\types\event.ts`.

- [ ] **Step 13: Create `types/memory.ts`**

```typescript
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
```

Write to `D:\orchestra\packages\shared\src\types\memory.ts`.

- [ ] **Step 14: Create `types/permission.ts`**

```typescript
export interface PermissionPolicy {
  id: string;
  name: string;
  description: string;
  fileScopes: string[];
  networkScopes: string[];
  shellScopes: ('read_only' | 'build_test' | 'write' | 'network' | 'destructive')[];
  githubScopes: string[];
  approvalRules: ApprovalRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalRule {
  action: string;
  risk: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
}
```

Write to `D:\orchestra\packages\shared\src\types\permission.ts`.

- [ ] **Step 15: Create `types/tool.ts`**

```typescript
export interface ToolDefinition {
  id: string;
  name: string;
  type: 'local' | 'mcp_server' | 'skill' | 'plugin';
  description: string;
  config: Record<string, unknown>;
  permissionManifest: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

Write to `D:\orchestra\packages\shared\src\types\tool.ts`.

- [ ] **Step 16: Create `types/index.ts`**

```typescript
export type { Project, CreateProjectInput } from './project';
export type { AgentTemplate, AgentInstance, CreateAgentTemplateInput, CreateAgentInstanceInput } from './agent';
export type { ModelProvider, ModelProfile, CreateModelProviderInput, CreateModelProfileInput } from './model';
export type { Task, TaskContract, CreateTaskInput } from './task';
export type { Run, Artifact, ApprovalRequest, Conversation, ConversationMessage } from './runtime';
export type { Event } from './event';
export type { MemoryDocument } from './memory';
export type { PermissionPolicy, ApprovalRule } from './permission';
export type { ToolDefinition } from './tool';
```

Write to `D:\orchestra\packages\shared\src\types\index.ts`.

- [ ] **Step 17: Create `src/index.ts` barrel export**

```typescript
export * from './types';
export * from './constants';
```

Write to `D:\orchestra\packages\shared\src\index.ts`.

- [ ] **Step 18: Run typecheck**

```powershell
cd D:\orchestra\packages\shared
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 19: Commit shared types**

```powershell
cd D:\orchestra
git add packages/shared/
git commit -m "feat: add shared types and constants for all design entities"
```

---

### Task 3: Backend Scaffold (NestJS)

**Files:**
- Create: `d:\orchestra\packages\backend\package.json`
- Create: `d:\orchestra\packages\backend\tsconfig.json`
- Create: `d:\orchestra\packages\backend\nest-cli.json`
- Create: `d:\orchestra\packages\backend\jest.config.ts`
- Create: `d:\orchestra\packages\backend\src\main.ts`
- Create: `d:\orchestra\packages\backend\src\app.module.ts`

- [ ] **Step 1: Create backend `package.json`**

```json
{
  "name": "@orchestra/backend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "start": "nest start",
    "start:debug": "nest start --debug --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "typecheck": "tsc --noEmit",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "prisma db seed"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@prisma/client": "^5.10.0",
    "reflect-metadata": "^0.2.1",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.0",
    "@nestjs/schematics": "^10.1.0",
    "@nestjs/testing": "^10.3.0",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.11",
    "jest": "^29.7.0",
    "prisma": "^5.10.0",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}
```

Write to `D:\orchestra\packages\backend\package.json`.

- [ ] **Step 2: Create backend `tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"]
}
```

Write to `D:\orchestra\packages\backend\tsconfig.json`.

- [ ] **Step 3: Create `nest-cli.json`**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

Write to `D:\orchestra\packages\backend\nest-cli.json`.

- [ ] **Step 4: Create `jest.config.ts`**

```typescript
import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

export default config;
```

Write to `D:\orchestra\packages\backend\jest.config.ts`.

- [ ] **Step 5: Create `src/main.ts`**

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Orchestra backend running on http://localhost:${port}`);
}

bootstrap();
```

Write to `D:\orchestra\packages\backend\src\main.ts`.

- [ ] **Step 6: Create `src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

Write to `D:\orchestra\packages\backend\src\app.module.ts`.

- [ ] **Step 7: Install dependencies**

```powershell
cd D:\orchestra
npm install
```

Expected: dependencies installed, no errors. `node_modules/` created.

- [ ] **Step 8: Verify backend compiles**

```powershell
cd D:\orchestra\packages\backend
npx nest build
```

Expected: `dist/` created with compiled JS, no errors.

- [ ] **Step 9: Commit backend scaffold**

```powershell
cd D:\orchestra
git add packages/backend/package.json packages/backend/tsconfig.json packages/backend/nest-cli.json packages/backend/jest.config.ts packages/backend/src/ package.json package-lock.json
git commit -m "feat: add NestJS backend scaffold"
```

---

### Task 4: Prisma Schema

**Files:**
- Create: `d:\orchestra\packages\backend\prisma\schema.prisma`

- [ ] **Step 1: Create `prisma/schema.prisma` with all entities**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Project {
  id                  String   @id @default(cuid())
  name                String
  description         String   @default("")
  workspacePath       String
  repoUrl             String?
  repoBranch          String?
  defaultModelProfileId String?
  memoryPath          String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  agents       AgentInstance[]
  tasks        Task[]
  events       Event[]
  conversations Conversation[]
  memoryDocs   MemoryDocument[]
  approvals    ApprovalRequest[]

  @@map("projects")
}

model AgentTemplate {
  id                   String   @id @default(cuid())
  name                 String
  role                 String
  systemPrompt         String
  defaultToolIds       String   @default("[]")
  defaultPermissionId  String?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  instances AgentInstance[]

  @@map("agent_templates")
}

model AgentInstance {
  id              String   @id @default(cuid())
  projectId       String
  templateId      String?
  name            String
  role            String
  systemPrompt    String
  promptVersion   Int      @default(1)
  modelProfileId  String?
  status          String   @default("idle")
  memoryPath      String?
  currentTaskId   String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  project   Project       @relation(fields: [projectId], references: [id], onDelete: Cascade)
  template  AgentTemplate? @relation(fields: [templateId], references: [id], onDelete: SetNull)
  tasks     Task[]        @relation("TaskAssignee")
  reviews   Task[]        @relation("TaskReviewer")

  @@map("agent_instances")
}

model ModelProvider {
  id                  String   @id @default(cuid())
  name                String
  baseUrl             String
  authType            String   @default("api_key")
  encryptedSecretRef  String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  profiles ModelProfile[]

  @@map("model_providers")
}

model ModelProfile {
  id                String   @id @default(cuid())
  name              String
  providerId        String
  modelName         String
  endpoint          String?
  fallbackProfileId String?
  budgetLimit       Float?
  budgetUsed        Float    @default(0)
  rateLimitRpm      Int?
  contextLimitTokens Int?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  provider ModelProvider  @relation(fields: [providerId], references: [id], onDelete: Cascade)
  fallback ModelProfile?  @relation("FallbackChain", fields: [fallbackProfileId], references: [id], onDelete: SetNull)
  fallbacks ModelProfile[] @relation("FallbackChain")
  runs     Run[]
  agentInstances AgentInstance[]
  projects Project[]

  @@map("model_profiles")
}

model ToolDefinition {
  id                  String   @id @default(cuid())
  name                String
  type                String   @default("local")
  description         String
  config              String   @default("{}")
  permissionManifest  String   @default("[]")
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@map("tool_definitions")
}

model PermissionPolicy {
  id            String   @id @default(cuid())
  name          String
  description   String   @default("")
  fileScopes    String   @default("[]")
  networkScopes String   @default("[]")
  shellScopes   String   @default("[]")
  githubScopes  String   @default("[]")
  approvalRules String   @default("[]")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("permission_policies")
}

model Task {
  id            String   @id @default(cuid())
  projectId     String
  title         String
  contract      String?
  status        String   @default("backlog")
  assigneeId    String?
  reviewerId    String?
  priority      Int      @default(0)
  parentTaskId  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  project     Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee    AgentInstance? @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  reviewer    AgentInstance? @relation("TaskReviewer", fields: [reviewerId], references: [id], onDelete: SetNull)
  parent      Task?          @relation("TaskHierarchy", fields: [parentTaskId], references: [id], onDelete: SetNull)
  children    Task[]         @relation("TaskHierarchy")
  runs        Run[]
  events      Event[]

  @@map("tasks")
}

model Run {
  id              String    @id @default(cuid())
  taskId          String
  modelProfileId  String?
  status          String    @default("pending")
  tokensIn        Int       @default(0)
  tokensOut       Int       @default(0)
  costUsd         Float     @default(0)
  latencyMs       Int?
  resultState     String?
  startedAt       DateTime?
  completedAt     DateTime?
  createdAt       DateTime  @default(now())

  task        Task          @relation(fields: [taskId], references: [id], onDelete: Cascade)
  modelProfile ModelProfile? @relation(fields: [modelProfileId], references: [id], onDelete: SetNull)
  artifacts   Artifact[]
  events      Event[]

  @@map("runs")
}

model Artifact {
  id          String   @id @default(cuid())
  runId       String
  type        String
  path        String
  description String   @default("")
  createdAt   DateTime @default(now())

  run Run @relation(fields: [runId], references: [id], onDelete: Cascade)

  @@map("artifacts")
}

model Event {
  id         String   @id @default(cuid())
  projectId  String
  type       String
  agentId    String?
  taskId     String?
  runId      String?
  payload    String   @default("{}")
  createdAt  DateTime @default(now())

  project Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  agent   AgentInstance? @relation(fields: [agentId], references: [id], onDelete: SetNull)
  task    Task?    @relation(fields: [taskId], references: [id], onDelete: SetNull)
  run     Run?     @relation(fields: [runId], references: [id], onDelete: SetNull)

  @@index([projectId, createdAt])
  @@index([projectId, type])
  @@map("events")
}

model MemoryDocument {
  id          String   @id @default(cuid())
  projectId   String
  agentId     String?
  type        String
  filePath    String
  version     Int      @default(1)
  lastSummary String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  project Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  agent   AgentInstance? @relation(fields: [agentId], references: [id], onDelete: SetNull)

  @@map("memory_documents")
}

model ApprovalRequest {
  id             String    @id @default(cuid())
  projectId      String
  taskId         String?
  runId          String?
  proposedAction String
  risk           String    @default("medium")
  decision       String?
  decidedBy      String?
  createdAt      DateTime  @default(now())
  decidedAt      DateTime?

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("approval_requests")
}

model Conversation {
  id        String   @id @default(cuid())
  projectId String
  title     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  project  Project               @relation(fields: [projectId], references: [id], onDelete: Cascade)
  messages ConversationMessage[]

  @@map("conversations")
}

model ConversationMessage {
  id             String   @id @default(cuid())
  conversationId String
  role           String
  agentId        String?
  content        String
  taskId         String?
  createdAt      DateTime @default(now())

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@map("conversation_messages")
}
```

Write to `D:\orchestra\packages\backend\prisma\schema.prisma`.

- [ ] **Step 2: Add `DATABASE_URL` to `.env`**

Append to `D:\orchestra\.env`:

```
DATABASE_URL=file:./orchestra.db
```

- [ ] **Step 3: Generate Prisma client and create initial migration**

```powershell
cd D:\orchestra\packages\backend
npx prisma generate
npx prisma migrate dev --name init
```

Expected: `prisma/migrations/` created with init migration, `orchestra.db` created, no errors.

- [ ] **Step 4: Verify schema with Prisma studio**

```powershell
cd D:\orchestra\packages\backend
npx prisma studio
```

Open `http://localhost:5555`, verify all 14 tables exist. Close studio.

- [ ] **Step 5: Create `src/prisma.service.ts`**

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

Write to `D:\orchestra\packages\backend\src\prisma.service.ts`.

- [ ] **Step 6: Commit Prisma schema**

```powershell
cd D:\orchestra
git add packages/backend/prisma/ packages/backend/src/prisma.service.ts .env
git commit -m "feat: add Prisma schema with all 14 design entities and PrismaService"
```

---

### Task 5: Backend Module Stubs

**Files:**
- Create: 8 module directories under `d:\orchestra\packages\backend\src\modules\` (each with `.module.ts`, `.service.ts`, `.service.spec.ts`)
- Controllers only for modules that need REST endpoints now: `project`, `agent`
- Modify: `d:\orchestra\packages\backend\src\app.module.ts`

Each service is a thin wrapper around Prisma queries. Each service spec tests basic CRUD via a Prisma mock.

- [ ] **Step 1: Create `modules/project/project.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.ProjectCreateInput) {
    return this.prisma.project.create({ data });
  }

  findAll() {
    return this.prisma.project.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findOne(id: string) {
    return this.prisma.project.findUnique({ where: { id } });
  }

  update(id: string, data: Prisma.ProjectUpdateInput) {
    return this.prisma.project.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }
}
```

Write to `D:\orchestra\packages\backend\src\modules\project\project.service.ts`.

- [ ] **Step 2: Write failing test for `ProjectService`**

```typescript
import { Test } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { PrismaService } from '../../prisma.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let prisma: {
    project: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      project: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ProjectService);
  });

  it('creates a project', async () => {
    const input = {
      name: 'Test Project',
      description: 'A test',
      workspacePath: 'C:\\projects\\test',
    };
    const expected = { id: 'clx1', ...input, createdAt: new Date(), updatedAt: new Date(), repoUrl: null, repoBranch: null, defaultModelProfileId: null, memoryPath: null };
    prisma.project.create.mockResolvedValue(expected);

    const result = await service.create(input);
    expect(result.name).toBe('Test Project');
    expect(prisma.project.create).toHaveBeenCalledWith({ data: input });
  });

  it('finds all projects', async () => {
    prisma.project.findMany.mockResolvedValue([]);
    const result = await service.findAll();
    expect(result).toEqual([]);
  });

  it('finds one project by id', async () => {
    const expected = { id: 'clx1', name: 'Test' };
    prisma.project.findUnique.mockResolvedValue(expected as any);
    const result = await service.findOne('clx1');
    expect(prisma.project.findUnique).toHaveBeenCalledWith({ where: { id: 'clx1' } });
  });

  it('deletes a project', async () => {
    prisma.project.delete.mockResolvedValue({ id: 'clx1' } as any);
    await service.remove('clx1');
    expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: 'clx1' } });
  });
});
```

Write to `D:\orchestra\packages\backend\src\modules\project\project.service.spec.ts`.

- [ ] **Step 3: Run test to verify it passes**

```powershell
cd D:\orchestra\packages\backend
npx jest src/modules/project/project.service.spec.ts
```

Expected: 4 tests PASS.

- [ ] **Step 4: Create `modules/project/project.controller.ts`**

```typescript
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ProjectService } from './project.service';
import { Prisma } from '@prisma/client';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Body() data: Prisma.ProjectCreateInput) {
    return this.projectService.create(data);
  }

  @Get()
  findAll() {
    return this.projectService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Prisma.ProjectUpdateInput) {
    return this.projectService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectService.remove(id);
  }
}
```

Write to `D:\orchestra\packages\backend\src\modules\project\project.controller.ts`.

- [ ] **Step 5: Create `modules/project/project.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService, PrismaService],
  exports: [ProjectService],
})
export class ProjectModule {}
```

Write to `D:\orchestra\packages\backend\src\modules\project\project.module.ts`.

- [ ] **Step 6: Create `modules/agent/agent.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AgentService {
  constructor(private prisma: PrismaService) {}

  createTemplate(data: Prisma.AgentTemplateCreateInput) {
    return this.prisma.agentTemplate.create({ data });
  }

  findAllTemplates() {
    return this.prisma.agentTemplate.findMany({ orderBy: { createdAt: 'desc' } });
  }

  createInstance(data: Prisma.AgentInstanceCreateInput) {
    return this.prisma.agentInstance.create({
      data,
      include: { project: true, template: true },
    });
  }

  findInstancesByProject(projectId: string) {
    return this.prisma.agentInstance.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOneInstance(id: string) {
    return this.prisma.agentInstance.findUnique({ where: { id } });
  }

  updateInstance(id: string, data: Prisma.AgentInstanceUpdateInput) {
    return this.prisma.agentInstance.update({ where: { id }, data });
  }

  removeInstance(id: string) {
    return this.prisma.agentInstance.delete({ where: { id } });
  }
}
```

Write to `D:\orchestra\packages\backend\src\modules\agent\agent.service.ts`.

- [ ] **Step 7: Write failing test for `AgentService`**

```typescript
import { Test } from '@nestjs/testing';
import { AgentService } from './agent.service';
import { PrismaService } from '../../prisma.service';

describe('AgentService', () => {
  let service: AgentService;
  let prisma: {
    agentTemplate: { create: jest.Mock; findMany: jest.Mock };
    agentInstance: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      agentTemplate: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      agentInstance: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AgentService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(AgentService);
  });

  it('creates a template', async () => {
    const input = { name: 'Frontend Dev', role: 'frontend', systemPrompt: 'You are a frontend dev' };
    prisma.agentTemplate.create.mockResolvedValue({ id: 'clx1', ...input });
    const result = await service.createTemplate(input);
    expect(result.name).toBe('Frontend Dev');
  });

  it('creates an instance', async () => {
    const input = {
      name: 'FE-1',
      role: 'frontend',
      systemPrompt: 'You are a frontend dev',
      project: { connect: { id: 'proj1' } },
    };
    prisma.agentInstance.create.mockResolvedValue({ id: 'clx2', ...input });
    const result = await service.createInstance(input);
    expect(result.name).toBe('FE-1');
  });

  it('finds instances by project', async () => {
    prisma.agentInstance.findMany.mockResolvedValue([]);
    const result = await service.findInstancesByProject('proj1');
    expect(prisma.agentInstance.findMany).toHaveBeenCalledWith({
      where: { projectId: 'proj1' },
      orderBy: { createdAt: 'desc' },
    });
  });
});
```

Write to `D:\orchestra\packages\backend\src\modules\agent\agent.service.spec.ts`.

- [ ] **Step 8: Run agent tests**

```powershell
cd D:\orchestra\packages\backend
npx jest src/modules/agent/agent.service.spec.ts
```

Expected: 3 tests PASS.

- [ ] **Step 9: Create `modules/agent/agent.controller.ts`**

```typescript
import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { AgentService } from './agent.service';
import { Prisma } from '@prisma/client';

@Controller('agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('templates')
  createTemplate(@Body() data: Prisma.AgentTemplateCreateInput) {
    return this.agentService.createTemplate(data);
  }

  @Get('templates')
  findAllTemplates() {
    return this.agentService.findAllTemplates();
  }

  @Post('instances')
  createInstance(@Body() data: Prisma.AgentInstanceCreateInput) {
    return this.agentService.createInstance(data);
  }

  @Get('instances')
  findInstances(@Query('projectId') projectId: string) {
    if (projectId) {
      return this.agentService.findInstancesByProject(projectId);
    }
    return [];
  }

  @Get('instances/:id')
  findOneInstance(@Param('id') id: string) {
    return this.agentService.findOneInstance(id);
  }

  @Put('instances/:id')
  updateInstance(@Param('id') id: string, @Body() data: Prisma.AgentInstanceUpdateInput) {
    return this.agentService.updateInstance(id, data);
  }

  @Delete('instances/:id')
  removeInstance(@Param('id') id: string) {
    return this.agentService.removeInstance(id);
  }
}
```

Write to `D:\orchestra\packages\backend\src\modules\agent\agent.controller.ts`.

- [ ] **Step 10: Create `modules/agent/agent.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [AgentController],
  providers: [AgentService, PrismaService],
  exports: [AgentService],
})
export class AgentModule {}
```

Write to `D:\orchestra\packages\backend\src\modules\agent\agent.module.ts`.

- [ ] **Step 11: Create remaining 6 module stubs**

Each stub module follows the same pattern: `*.module.ts`, `*.service.ts`, `*.service.spec.ts`.

**`modules/model-gateway/model-gateway.module.ts`:**

```typescript
import { Module } from '@nestjs/common';
import { ModelGatewayService } from './model-gateway.service';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [ModelGatewayService, PrismaService],
  exports: [ModelGatewayService],
})
export class ModelGatewayModule {}
```

**`modules/model-gateway/model-gateway.service.ts`:**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ModelGatewayService {
  constructor(private prisma: PrismaService) {}

  createProvider(data: Prisma.ModelProviderCreateInput) {
    return this.prisma.modelProvider.create({ data });
  }

  findAllProviders() {
    return this.prisma.modelProvider.findMany({ include: { profiles: true } });
  }

  createProfile(data: Prisma.ModelProfileCreateInput) {
    return this.prisma.modelProfile.create({ data });
  }

  findAllProfiles() {
    return this.prisma.modelProfile.findMany({ include: { provider: true } });
  }

  findOneProfile(id: string) {
    return this.prisma.modelProfile.findUnique({ where: { id }, include: { provider: true, fallback: true } });
  }
}
```

**`modules/model-gateway/model-gateway.service.spec.ts`:**

```typescript
import { Test } from '@nestjs/testing';
import { ModelGatewayService } from './model-gateway.service';
import { PrismaService } from '../../prisma.service';

describe('ModelGatewayService', () => {
  let service: ModelGatewayService;
  let prisma: {
    modelProvider: { create: jest.Mock; findMany: jest.Mock };
    modelProfile: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      modelProvider: { create: jest.fn(), findMany: jest.fn() },
      modelProfile: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
    };
    const module = await Test.createTestingModule({
      providers: [ModelGatewayService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ModelGatewayService);
  });

  it('creates a provider', async () => {
    const input = { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', authType: 'api_key' };
    prisma.modelProvider.create.mockResolvedValue({ id: 'clx1', ...input });
    const result = await service.createProvider(input);
    expect(result.name).toBe('OpenAI');
  });

  it('creates a profile', async () => {
    const input = { name: 'GPT-4', modelName: 'gpt-4', provider: { connect: { id: 'clx1' } } };
    prisma.modelProfile.create.mockResolvedValue({ id: 'clx2', ...input });
    const result = await service.createProfile(input);
    expect(result.name).toBe('GPT-4');
  });
});
```

Write all three files to `D:\orchestra\packages\backend\src\modules\model-gateway\`.

---

**`modules/task/task.module.ts`:**

```typescript
import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [TaskService, PrismaService],
  exports: [TaskService],
})
export class TaskModule {}
```

**`modules/task/task.service.ts`:**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.TaskCreateInput) {
    return this.prisma.task.create({ data });
  }

  findByProject(projectId: string) {
    return this.prisma.task.findMany({
      where: { projectId },
      orderBy: { priority: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.task.findUnique({ where: { id } });
  }

  update(id: string, data: Prisma.TaskUpdateInput) {
    return this.prisma.task.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }
}
```

**`modules/task/task.service.spec.ts`:**

```typescript
import { Test } from '@nestjs/testing';
import { TaskService } from './task.service';
import { PrismaService } from '../../prisma.service';

describe('TaskService', () => {
  let service: TaskService;
  let prisma: { task: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock; delete: jest.Mock } };

  beforeEach(async () => {
    prisma = { task: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() } };
    const module = await Test.createTestingModule({
      providers: [TaskService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(TaskService);
  });

  it('creates a task', async () => {
    const input = { title: 'Build API', project: { connect: { id: 'p1' } } };
    prisma.task.create.mockResolvedValue({ id: 'clx1', ...input, status: 'backlog' });
    const result = await service.create(input);
    expect(result.title).toBe('Build API');
  });

  it('finds tasks by project', async () => {
    prisma.task.findMany.mockResolvedValue([]);
    const result = await service.findByProject('p1');
    expect(prisma.task.findMany).toHaveBeenCalledWith({ where: { projectId: 'p1' }, orderBy: { priority: 'desc' } });
  });
});
```

Write all three to `D:\orchestra\packages\backend\src\modules\task\`.

---

**`modules/runtime/runtime.module.ts`:**

```typescript
import { Module } from '@nestjs/common';
import { RuntimeService } from './runtime.service';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [RuntimeService, PrismaService],
  exports: [RuntimeService],
})
export class RuntimeModule {}
```

**`modules/runtime/runtime.service.ts`:**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class RuntimeService {
  constructor(private prisma: PrismaService) {}

  createRun(data: Prisma.RunCreateInput) {
    return this.prisma.run.create({ data });
  }

  findRunsByTask(taskId: string) {
    return this.prisma.run.findMany({ where: { taskId }, orderBy: { createdAt: 'desc' } });
  }

  updateRun(id: string, data: Prisma.RunUpdateInput) {
    return this.prisma.run.update({ where: { id }, data });
  }

  createArtifact(data: Prisma.ArtifactCreateInput) {
    return this.prisma.artifact.create({ data });
  }

  findArtifactsByRun(runId: string) {
    return this.prisma.artifact.findMany({ where: { runId } });
  }
}
```

**`modules/runtime/runtime.service.spec.ts`:**

```typescript
import { Test } from '@nestjs/testing';
import { RuntimeService } from './runtime.service';
import { PrismaService } from '../../prisma.service';

describe('RuntimeService', () => {
  let service: RuntimeService;
  let prisma: { run: { create: jest.Mock; findMany: jest.Mock; update: jest.Mock }; artifact: { create: jest.Mock; findMany: jest.Mock } };

  beforeEach(async () => {
    prisma = { run: { create: jest.fn(), findMany: jest.fn(), update: jest.fn() }, artifact: { create: jest.fn(), findMany: jest.fn() } };
    const module = await Test.createTestingModule({
      providers: [RuntimeService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(RuntimeService);
  });

  it('creates a run', async () => {
    const input = { task: { connect: { id: 't1' } } };
    prisma.run.create.mockResolvedValue({ id: 'clx1', ...input, status: 'pending' });
    const result = await service.createRun(input);
    expect(result.status).toBe('pending');
  });

  it('finds runs by task', async () => {
    prisma.run.findMany.mockResolvedValue([]);
    const result = await service.findRunsByTask('t1');
    expect(prisma.run.findMany).toHaveBeenCalledWith({ where: { taskId: 't1' }, orderBy: { createdAt: 'desc' } });
  });
});
```

Write all three to `D:\orchestra\packages\backend\src\modules\runtime\`.

---

**`modules/tool-gateway/tool-gateway.module.ts`:**

```typescript
import { Module } from '@nestjs/common';
import { ToolGatewayService } from './tool-gateway.service';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [ToolGatewayService, PrismaService],
  exports: [ToolGatewayService],
})
export class ToolGatewayModule {}
```

**`modules/tool-gateway/tool-gateway.service.ts`:**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ToolGatewayService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.ToolDefinitionCreateInput) {
    return this.prisma.toolDefinition.create({ data });
  }

  findAll() {
    return this.prisma.toolDefinition.findMany({ orderBy: { name: 'asc' } });
  }

  findOne(id: string) {
    return this.prisma.toolDefinition.findUnique({ where: { id } });
  }

  remove(id: string) {
    return this.prisma.toolDefinition.delete({ where: { id } });
  }
}
```

**`modules/tool-gateway/tool-gateway.service.spec.ts`:**

```typescript
import { Test } from '@nestjs/testing';
import { ToolGatewayService } from './tool-gateway.service';
import { PrismaService } from '../../prisma.service';

describe('ToolGatewayService', () => {
  let service: ToolGatewayService;
  let prisma: { toolDefinition: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; delete: jest.Mock } };

  beforeEach(async () => {
    prisma = { toolDefinition: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), delete: jest.fn() } };
    const module = await Test.createTestingModule({
      providers: [ToolGatewayService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ToolGatewayService);
  });

  it('creates a tool', async () => {
    const input = { name: 'shell', type: 'local', description: 'Shell command execution' };
    prisma.toolDefinition.create.mockResolvedValue({ id: 'clx1', ...input });
    const result = await service.create(input);
    expect(result.name).toBe('shell');
  });
});
```

Write all three to `D:\orchestra\packages\backend\src\modules\tool-gateway\`.

---

**`modules/memory/memory.module.ts`:**

```typescript
import { Module } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [MemoryService, PrismaService],
  exports: [MemoryService],
})
export class MemoryModule {}
```

**`modules/memory/memory.service.ts`:**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MemoryService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.MemoryDocumentCreateInput) {
    return this.prisma.memoryDocument.create({ data });
  }

  findByProject(projectId: string) {
    return this.prisma.memoryDocument.findMany({ where: { projectId } });
  }

  findByAgent(projectId: string, agentId: string) {
    return this.prisma.memoryDocument.findMany({ where: { projectId, agentId } });
  }

  findOne(id: string) {
    return this.prisma.memoryDocument.findUnique({ where: { id } });
  }

  update(id: string, data: Prisma.MemoryDocumentUpdateInput) {
    return this.prisma.memoryDocument.update({ where: { id }, data });
  }
}
```

**`modules/memory/memory.service.spec.ts`:**

```typescript
import { Test } from '@nestjs/testing';
import { MemoryService } from './memory.service';
import { PrismaService } from '../../prisma.service';

describe('MemoryService', () => {
  let service: MemoryService;
  let prisma: { memoryDocument: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock } };

  beforeEach(async () => {
    prisma = { memoryDocument: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() } };
    const module = await Test.createTestingModule({
      providers: [MemoryService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(MemoryService);
  });

  it('creates a memory document', async () => {
    const input = { type: 'project_memory', filePath: 'PROJECT_MEMORY.md', project: { connect: { id: 'p1' } } };
    prisma.memoryDocument.create.mockResolvedValue({ id: 'clx1', ...input, version: 1 });
    const result = await service.create(input);
    expect(result.type).toBe('project_memory');
  });

  it('finds memory by project', async () => {
    prisma.memoryDocument.findMany.mockResolvedValue([]);
    const result = await service.findByProject('p1');
    expect(prisma.memoryDocument.findMany).toHaveBeenCalledWith({ where: { projectId: 'p1' } });
  });
});
```

Write all three to `D:\orchestra\packages\backend\src\modules\memory\`.

---

**`modules/event/event.module.ts`:**

```typescript
import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [EventService, PrismaService],
  exports: [EventService],
})
export class EventModule {}
```

**`modules/event/event.service.ts`:**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.EventCreateInput) {
    return this.prisma.event.create({ data });
  }

  findByProject(projectId: string, limit = 100) {
    return this.prisma.event.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  findByProjectAndType(projectId: string, type: string, limit = 100) {
    return this.prisma.event.findMany({
      where: { projectId, type },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
```

**`modules/event/event.service.spec.ts`:**

```typescript
import { Test } from '@nestjs/testing';
import { EventService } from './event.service';
import { PrismaService } from '../../prisma.service';

describe('EventService', () => {
  let service: EventService;
  let prisma: { event: { create: jest.Mock; findMany: jest.Mock } };

  beforeEach(async () => {
    prisma = { event: { create: jest.fn(), findMany: jest.fn() } };
    const module = await Test.createTestingModule({
      providers: [EventService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(EventService);
  });

  it('creates an event', async () => {
    const input = { type: 'agent.created', project: { connect: { id: 'p1' } } };
    prisma.event.create.mockResolvedValue({ id: 'clx1', ...input });
    const result = await service.create(input);
    expect(result.type).toBe('agent.created');
  });

  it('finds events by project with limit', async () => {
    prisma.event.findMany.mockResolvedValue([]);
    const result = await service.findByProject('p1', 50);
    expect(prisma.event.findMany).toHaveBeenCalledWith({
      where: { projectId: 'p1' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });
});
```

Write all three to `D:\orchestra\packages\backend\src\modules\event\`.

- [ ] **Step 12: Update `app.module.ts` to import all modules**

```typescript
import { Module } from '@nestjs/common';
import { ProjectModule } from './modules/project/project.module';
import { AgentModule } from './modules/agent/agent.module';
import { ModelGatewayModule } from './modules/model-gateway/model-gateway.module';
import { TaskModule } from './modules/task/task.module';
import { RuntimeModule } from './modules/runtime/runtime.module';
import { ToolGatewayModule } from './modules/tool-gateway/tool-gateway.module';
import { MemoryModule } from './modules/memory/memory.module';
import { EventModule } from './modules/event/event.module';

@Module({
  imports: [
    ProjectModule,
    AgentModule,
    ModelGatewayModule,
    TaskModule,
    RuntimeModule,
    ToolGatewayModule,
    MemoryModule,
    EventModule,
  ],
})
export class AppModule {}
```

Update `D:\orchestra\packages\backend\src\app.module.ts`.

- [ ] **Step 13: Run all backend tests**

```powershell
cd D:\orchestra\packages\backend
npx jest --verbose
```

Expected: all tests pass (4 + 3 + 2 + 2 + 2 + 1 + 2 + 2 = 18 tests).

- [ ] **Step 14: Verify backend builds**

```powershell
cd D:\orchestra\packages\backend
npx nest build
```

Expected: compiles without errors.

- [ ] **Step 15: Commit all modules**

```powershell
cd D:\orchestra
git add packages/backend/src/
git commit -m "feat: add 8 NestJS service modules with CRUD and tests"
```

---

### Task 6: Frontend Scaffold (Next.js + Tailwind)

**Files:**
- Create: `d:\orchestra\packages\frontend\package.json`
- Create: `d:\orchestra\packages\frontend\tsconfig.json`
- Create: `d:\orchestra\packages\frontend\next.config.js`
- Create: `d:\orchestra\packages\frontend\tailwind.config.ts`
- Create: `d:\orchestra\packages\frontend\postcss.config.js`
- Create: `d:\orchestra\packages\frontend\src\app\layout.tsx`
- Create: `d:\orchestra\packages\frontend\src\app\page.tsx`
- Create: `d:\orchestra\packages\frontend\src\app\globals.css`
- Create: `d:\orchestra\packages\frontend\src\components\layout\sidebar.tsx`
- Create: `d:\orchestra\packages\frontend\src\components\layout\header.tsx`

- [ ] **Step 1: Create frontend `package.json`**

```json
{
  "name": "@orchestra/frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3"
  }
}
```

Write to `D:\orchestra\packages\frontend\package.json`.

- [ ] **Step 2: Create frontend `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "src/**/*"],
  "exclude": ["node_modules"]
}
```

Write to `D:\orchestra\packages\frontend\tsconfig.json`.

- [ ] **Step 3: Create `next.config.js`**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
```

Write to `D:\orchestra\packages\frontend\next.config.js`.

- [ ] **Step 4: Create `tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

Write to `D:\orchestra\packages\frontend\tailwind.config.ts`.

- [ ] **Step 5: Create `postcss.config.js`**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

Write to `D:\orchestra\packages\frontend\postcss.config.js`.

- [ ] **Step 6: Create `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --sidebar-width: 260px;
}

body {
  @apply bg-gray-950 text-gray-100;
}
```

Write to `D:\orchestra\packages\frontend\src\app\globals.css`.

- [ ] **Step 7: Create `src/components/layout/sidebar.tsx`**

```tsx
'use client';

const navItems = [
  { label: 'Dashboard', href: '/', icon: '◉' },
  { label: 'Projects', href: '/projects', icon: '◎' },
  { label: 'Agents', href: '/agents', icon: '◈' },
  { label: 'Tasks', href: '/tasks', icon: '◧' },
  { label: 'Models', href: '/models', icon: '◆' },
  { label: 'Events', href: '/events', icon: '◉' },
  { label: 'Memory', href: '/memory', icon: '▤' },
  { label: 'Pixel Office', href: '/pixel-office', icon: '◨' },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[var(--sidebar-width)] border-r border-gray-800 bg-gray-900 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-lg font-bold tracking-tight">Orchestra</h1>
        <p className="text-xs text-gray-500">Agent Control Plane</p>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800 text-xs text-gray-600">
        v0.1.0
      </div>
    </aside>
  );
}
```

Write to `D:\orchestra\packages\frontend\src\components\layout\sidebar.tsx`.

- [ ] **Step 8: Create `src/components/layout/header.tsx`**

```tsx
export function Header({ title }: { title: string }) {
  return (
    <header className="h-14 border-b border-gray-800 bg-gray-900 flex items-center px-6">
      <h2 className="text-sm font-medium">{title}</h2>
    </header>
  );
}
```

Write to `D:\orchestra\packages\frontend\src\components\layout\header.tsx`.

- [ ] **Step 9: Create `src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Orchestra — Agent Control Plane',
  description: 'User-owned control plane for LLM agent teams',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <main className="ml-[var(--sidebar-width)] min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
```

Write to `D:\orchestra\packages\frontend\src\app\layout.tsx`.

- [ ] **Step 10: Create `src/app/page.tsx`**

```tsx
import { Header } from '@/components/layout/header';

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Projects" value="0" />
          <StatCard label="Active Agents" value="0" />
          <StatCard label="Running Tasks" value="0" />
          <StatCard label="Events Today" value="0" />
        </div>
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Activity</h3>
          <div className="rounded-lg border border-gray-800 p-8 text-center text-gray-600">
            No activity yet. Create a project to get started.
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
```

Write to `D:\orchestra\packages\frontend\src\app\page.tsx`.

- [ ] **Step 11: Install frontend dependencies**

```powershell
cd D:\orchestra
npm install
```

Expected: all workspace packages installed.

- [ ] **Step 12: Verify frontend builds**

```powershell
cd D:\orchestra\packages\frontend
npx next build
```

Expected: `.next/` created, build succeeds.

- [ ] **Step 13: Commit frontend scaffold**

```powershell
cd D:\orchestra
git add packages/frontend/ package-lock.json
git commit -m "feat: add Next.js frontend scaffold with layout shell and dashboard"
```

---

### Task 7: Smoke Test — Backend Starts and API Responds

**Files:** None new. Validates the entire scaffold works end-to-end.

- [ ] **Step 1: Start the backend server**

```powershell
cd D:\orchestra\packages\backend
npx nest start
```

Expected: `Orchestra backend running on http://localhost:3001`

- [ ] **Step 2: Test the `/projects` endpoint**

In a separate terminal:

```powershell
Invoke-RestMethod -Uri http://localhost:3001/projects -Method Get
```

Expected: `[]` (empty array, no errors).

- [ ] **Step 3: Test creating a project**

```powershell
$body = @{ name = 'Test Project'; description = 'First project'; workspacePath = 'C:\projects\test' } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:3001/projects -Method Post -Body $body -ContentType 'application/json'
```

Expected: project object with `id`, `name: 'Test Project'`, `status: 'idle'`.

- [ ] **Step 4: Verify the project appears in the list**

```powershell
Invoke-RestMethod -Uri http://localhost:3001/projects -Method Get
```

Expected: array with one project.

- [ ] **Step 5: Stop the backend server** (Ctrl+C in the first terminal).

- [ ] **Step 6: Start the frontend dev server**

```powershell
cd D:\orchestra\packages\frontend
npx next dev -p 3000
```

Expected: `Ready on http://localhost:3000`

- [ ] **Step 7: Open browser to `http://localhost:3000`**

Verify: dark theme, sidebar with navigation, dashboard with 4 stat cards showing "0", "No activity yet" message.

- [ ] **Step 8: Stop the frontend server** (Ctrl+C).

- [ ] **Step 9: Run all backend tests one final time**

```powershell
cd D:\orchestra\packages\backend
npx jest --verbose
```

Expected: all 18 tests pass.

- [ ] **Step 10: Commit smoke test verification**

No code changes — this is manual verification. Skip commit.

---

### Task 8: Clean Up and Final Commit

- [ ] **Step 1: Delete the test database created during smoke test**

```powershell
Remove-Item D:\orchestra\packages\backend\prisma\orchestra.db -ErrorAction SilentlyContinue
```

- [ ] **Step 2: Add `prisma/migrations/` to git and ensure `.env` is in `.gitignore`**

Verify `.gitignore` contains `.env` (already added in Task 1).

- [ ] **Step 3: Stage and commit all remaining files**

```powershell
cd D:\orchestra
git add -A
git status
```

Review: confirm no `.env` or `*.db` files are staged. Then:

```powershell
git commit -m "chore: finalize scaffold with migrations and shared config"
```

---

## Self-Review Checklist

**1. Spec coverage:** The design doc defines 14 data entities. All are present in the Prisma schema: Project, AgentTemplate, AgentInstance, ModelProvider, ModelProfile, ToolDefinition, PermissionPolicy, Task, Run, Artifact, Event, MemoryDocument, ApprovalRequest, Conversation, ConversationMessage. All 8 core service boundaries have NestJS modules. Frontend has layout shell with navigation to all major sections.

**2. Placeholder scan:** No TBD, TODO, "implement later", "add validation", or "similar to Task N" found. Every step has exact code or commands.

**3. Type consistency:** 
- `TaskStatus` constants match Prisma `Task.status` String field default values.
- `AgentStatus` constants match Prisma `AgentInstance.status` String field default values.
- `EventType` constants match Prisma `Event.type` String field values.
- `ProjectService.create` uses `Prisma.ProjectCreateInput` — consistent with Prisma generated types.
- `AgentService.createInstance` uses `Prisma.AgentInstanceCreateInput` — consistent.
- All service specs mock the same PrismaService interface that services expect.
