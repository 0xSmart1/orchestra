# Orchestra — Agent Control Plane

A user-owned control plane for LLM agent teams. Talk to one Orchestrator while the system safely coordinates specialist worker agents that produce evidence-backed work.

## What It Does

Orchestra gives you a single dashboard to manage AI agent teams:

- **Orchestrator Chat** — One conversational interface that decomposes tasks, creates agents, assigns work, and reviews results
- **Agent Roster** — Edit agent names, roles, system prompts, model profiles, and tools per agent
- **Model Gateway** — Connect any OpenAI-compatible provider (OmniRoute, OpenAI, local LLMs). Load available models with one click and create profiles instantly
- **Pixel Office** — Live observability: see agents idle, thinking, coding, or blocked in real time
- **Project Memory** — Markdown-based memory per project and per agent for continuity across sessions
- **Task & Event Tracking** — Task board with state transitions and append-only event stream
- **i18n** — English and Russian UI, extensible

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Next.js Frontend (port 3000)                    │
│  ├─ Dashboard + Pixel Office                     │
│  ├─ Orchestrator Chat                            │
│  ├─ Agent Roster Editor                          │
│  ├─ Model Gateway UI                             │
│  └─ Settings (language, orchestrator config)     │
├─────────────────────────────────────────────────┤
│  NestJS Backend (port 3001)                       │
│  ├─ ProjectService   — projects, settings        │
│  ├─ AgentService     — templates, instances      │
│  ├─ ModelGateway     — providers, profiles,      │
│  │                    available-models endpoint   │
│  ├─ ConversationSvc  — chat, messages, archive   │
│  ├─ TaskService      — contracts, transitions    │
│  ├─ EventService     — append-only event stream  │
│  └─ LlmClientService — OpenAI-compatible calls   │
├─────────────────────────────────────────────────┤
│  SQLite (Prisma)         — persistent storage     │
│  SSE (Server-Sent Events) — live updates         │
└─────────────────────────────────────────────────┘
```

**Stack:** Next.js 14 · React 18 · TypeScript · Tailwind CSS · NestJS 10 · Prisma · SQLite · SSE · PixiJS

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/orchestra.git
cd orchestra
npm install
```

### 2. Configure Environment

```bash
cp packages/backend/.env.example packages/backend/.env
```

Edit `packages/backend/.env` — at minimum set your LLM API key:

```env
LLM_API_KEY=your-api-key-here
```

Works with any OpenAI-compatible provider. Convention: `LLM_API_KEY_<PROVIDER_NAME>` for per-provider keys (e.g. `LLM_API_KEY_OMNIROUTE`), falls back to `LLM_API_KEY`.

### 3. Initialize Database

```bash
cd packages/backend
npx prisma generate
npx prisma db push
cd ../..
```

### 4. Start

**One command (auto-opens browser):**

| OS | Command |
|---|---|
| Windows | `start.bat` |
| Linux/Mac | `bash start.sh` |

**Or manually:**

```bash
# Terminal 1 — Backend
cd packages/backend && npm run dev

# Terminal 2 — Frontend
cd packages/frontend && npm run dev
```

Dashboard opens at **http://localhost:3000**

## OmniRoute Integration

Orchestra works with any OpenAI-compatible proxy. To use OmniRoute:

1. Create a provider on the Models page with your OmniRoute base URL
2. Click **"Load models"** — Orchestra calls the provider's `/v1/models` endpoint
3. Select models from the list and create profiles with one click
4. Assign profiles to agents or set as project default

No special configuration needed — if it speaks OpenAI API, it works.

## Key Concepts

### Orchestrator

The main agent you chat with. It:
- Decomposes tasks into subtasks
- Creates specialist worker agents
- Assigns tasks with context, tools, and acceptance criteria
- Reviews outputs and requests rework
- Maintains project memory

### Workers

Specialist agents with scoped access:
- Specific task contract (goal, allowed files, allowed tools, acceptance criteria)
- Read/write limited to their workspace
- Must produce evidence-backed output (summary, files touched, checks run, risks)

### Model Gateway

Provider → Profile → Agent chain:
- **Provider**: base URL + auth type (API key / OAuth)
- **Profile**: specific model + endpoint + budget + rate limits
- **Agent**: linked to one profile, inherits provider's API key from env

### Pixel Office

Real-time agent visualization:
- Idle / Thinking / Coding / Testing / Blocked states
- Click any agent for details: current task, model, tools, events, artifacts
- Driven by the same event stream as the dashboard

## Project Structure

```
orchestra/
├── packages/
│   ├── backend/          # NestJS API + Prisma
│   │   ├── prisma/       # Schema, migrations
│   │   └── src/modules/  # Feature modules
│   ├── frontend/         # Next.js app
│   │   └── src/
│   │       ├── app/      # Pages (dashboard, chat, agents, models...)
│   │       ├── components/
│   │       └── lib/      # i18n, API client, project context
│   └── shared/           # Shared types
├── start.bat             # Windows launcher
├── start.sh              # Unix launcher
└── agent-control-plane-design.md  # Full design spec
```

## Development

```bash
# Backend type checking
cd packages/backend && npx tsc --noEmit

# Frontend build
cd packages/frontend && npx next build

# Run tests
npm run test

# Database studio
cd packages/backend && npx prisma studio
```

## License

MIT
