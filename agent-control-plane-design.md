# Agent Control Plane / AI Team OS Design

Date: 2026-05-06

## 1. Product Thesis

Build a user-owned control plane for LLM agent teams: projects, workers, model routing, memory, permissions, repository access, task orchestration, approvals, observability, and a live pixel-office view. The product should feel less like "many chatbots" and more like an operating room for AI work.

The core product promise: the user talks to one Orchestrator, while the system safely coordinates a scoped team of specialist agents that produce evidence-backed work.

## 2. Reference Landscape

- GitHub Agent HQ and Mission Control validate the category: unified task assignment, live logs, steering, review, and PR handoff are now mainstream expectations for agent orchestration.
- Oh My OpenAgent is the closest open-source inspiration for an agent harness: model categories, orchestrator/worker roles, background agents, skills, MCP, LSP/AST tooling, session recovery, and strong completion discipline.
- LangGraph is a strong candidate for durable runtime semantics: graph workflows, persistence, human-in-the-loop, long-running execution, and resumability.
- Microsoft Agent Framework is relevant if .NET/Python multi-agent workflow support matters.
- CrewAI, MetaGPT, and ChatDev show role-based agent teams and SOP-driven collaboration, but they are not primarily a polished user-owned dashboard/control plane.
- LiteLLM and Portkey show the right model gateway pattern: unified endpoint, virtual keys, routing, budgets, rate limits, retries, and fallbacks.
- Langfuse, AgentOps, and Helicone show what observability should include: traces, replay, prompt/version tracking, cost, latency, evaluations, and debugging.
- MCP is the tool/context standard to support, but it must be sandboxed. A2A is worth tracking for future cross-agent interoperability.

Differentiation: combine team orchestration, user-editable roles/prompts, model/provider routing, local/GitHub workspaces, strict permissions, markdown memory, and a pixel-office observability layer in one product.

## 3. MVP Scope

MVP must include:

- Project creation and project dashboard.
- Main Orchestrator chat.
- Agent roster with editable name, role, prompt, model profile, tools, permissions, and memory file.
- Model profiles with OpenAI-compatible endpoints, provider keys stored in encrypted vault, default model, fallback model, and budget limits.
- Task graph: backlog, assigned, running, blocked, review, accepted, rejected.
- Runtime event log and live status stream.
- Local workspace file browser with read/write permissions scoped per task.
- GitHub repository connection for clone/status/diff/branch/PR preparation.
- Project memory files: `PROJECT_MEMORY.md`, `DECISIONS.md`, `TASK_LOG.md`, and `agents/<agent-id>/MEMORY.md`.
- Pixel-office view driven by real runtime events.

Defer until after MVP:

- Marketplace for plugins/skills.
- Multi-user organizations and RBAC.
- Full A2A server/client support.
- Fully autonomous PR merge.
- Complex no-code workflow builder.
- Mobile UI.

## 4. Architecture

Recommended stack:

- Frontend: Next.js/React, TypeScript, Tailwind or CSS modules, Zustand/Jotai for local UI state, TanStack Query for server state, WebSocket/SSE for live events.
- Pixel-office: PixiJS for 2D pixel rendering. Keep it event-driven, not decorative.
- Backend API: Node.js/NestJS or Fastify with TypeScript. Use a clean service boundary around projects, agents, tasks, models, tools, memory, and runtime.
- Runtime engine: start with an internal state machine/job runner; design the interface so LangGraph or another durable graph engine can be swapped in later.
- Database: Postgres for product state, events, tasks, traces metadata. SQLite is acceptable only for a local-first prototype.
- Queue: BullMQ/Redis or Temporal later. MVP can use BullMQ.
- Secrets: encrypted vault with per-project secret references. Agents receive model profile IDs, never raw keys.
- Observability: emit OpenTelemetry-style spans internally; optionally export to Langfuse/Helicone/AgentOps later.

Core services:

- `ProjectService`: projects, settings, repo/workspace bindings.
- `AgentService`: templates, instances, prompts, tools, permissions, memory pointers.
- `ModelGatewayService`: provider profiles, virtual keys, model routing, fallback, budgets.
- `TaskService`: task contracts, state transitions, assignment, acceptance criteria.
- `RuntimeService`: run orchestration, worker execution, retries, cancellation, resumability.
- `ToolGatewayService`: MCP/skills/local tools with allowlists and approval gates.
- `MemoryService`: markdown memory read/write, summaries, decision logs.
- `EventService`: append-only events for UI, audit, replay, and pixel-office.

## 5. Runtime Contract

The Orchestrator may:

- Clarify intent with the user.
- Create or modify team structure.
- Create task contracts.
- Assign tasks to workers.
- Review worker outputs against acceptance criteria.
- Reject work with specific feedback.
- Synthesize final results for the user.
- Update project memory and decision logs.

The Orchestrator must not:

- Secretly perform worker tasks.
- Edit files when a worker is assigned to do the work.
- Bypass permissions or approval policy.
- Hide failed checks or missing evidence.

Every worker run receives a task contract:

- Goal.
- Context slice.
- Allowed files/directories.
- Allowed tools.
- Disallowed actions.
- Model profile.
- Expected artifact.
- Acceptance criteria.
- Evidence requirements.
- Reviewer agent.

Every worker output must include:

- Summary of work.
- Files or artifacts touched.
- Commands/checks run.
- Result evidence.
- Open risks.
- Follow-up recommendation.

## 6. Data Model

Primary entities:

- `Project`: id, name, description, workspace path, repo connection, default model profile, memory paths.
- `AgentTemplate`: reusable role, prompt, default tools, default permissions.
- `AgentInstance`: project-specific agent, role, prompt version, model profile, status, memory path.
- `ModelProvider`: provider name, base URL, auth type, encrypted secret reference.
- `ModelProfile`: model name, provider, endpoint, fallback chain, budget, rate limits, context limits.
- `ToolDefinition`: local tool, MCP server, skill, plugin, permissions manifest.
- `PermissionPolicy`: file scopes, network scopes, shell scopes, GitHub scopes, approval rules.
- `Task`: title, contract, status, assignee, reviewer, priority, parent task, acceptance criteria.
- `Run`: task execution attempt, model profile, tokens, cost, latency, result state.
- `Artifact`: diff, file, report, PR draft, screenshot, log, generated asset.
- `Event`: append-only runtime event for UI, audit, traces, pixel-office.
- `MemoryDocument`: project or agent memory file metadata, lock/version, last summary.
- `ApprovalRequest`: external action request, proposed action, risk, decision, actor.
- `Conversation`: user/orchestrator messages and linked tasks.

## 7. Security and Permissions

Use least privilege everywhere.

- Real API keys stay in the vault. Agents only receive model profile IDs.
- Tool access is explicit per agent and per task.
- Filesystem access is scoped to a task workspace or git worktree.
- GitHub write actions require approval: push, PR creation, issue comments, releases.
- Network access is denied by default except approved providers/MCP servers.
- Dangerous MCP servers run isolated, ideally per project, with quarantine and manifest review.
- Shell commands are categorized: read-only, build/test, write, network, destructive.
- External side effects pause execution and create `ApprovalRequest`.
- All actions produce audit events.

## 8. Memory Architecture

Use markdown for human-readable continuity and database events for machine replay.

Project memory files:

- `PROJECT_MEMORY.md`: durable project context, goals, architecture, conventions.
- `DECISIONS.md`: dated decisions with rationale and alternatives.
- `TASK_LOG.md`: accepted task outcomes and evidence links.

Agent memory files:

- `agents/<agent-id>/MEMORY.md`: role-specific preferences, lessons, current domain context.
- Workers may read project memory plus their own memory.
- Workers may not read other workers' private memory unless Orchestrator grants it.

Memory write policy:

- Orchestrator writes project memory.
- Workers propose memory updates as artifacts.
- Accepted worker updates are merged by Orchestrator after review.

## 9. Pixel-Office Event Model

Pixel-office is a live observability surface. It reads runtime events and renders work state.

Events:

- `agent.created`
- `agent.status.changed`
- `task.created`
- `task.assigned`
- `run.started`
- `run.model_call.started`
- `run.tool_call.started`
- `run.artifact.created`
- `run.blocked`
- `approval.requested`
- `review.started`
- `review.rejected`
- `review.accepted`
- `memory.updated`
- `cost.threshold.warning`

Visual mapping:

- `idle`: sitting/standing.
- `thinking`: thought bubble, subtle animation.
- `researching`: reading terminal/docs.
- `coding`: typing at workstation.
- `testing`: test bench or console animation.
- `reviewing`: clipboard/magnifier.
- `blocked`: warning icon above desk.
- `waiting_approval`: raised hand or pause marker.
- `done`: artifact badge appears near desk.

Clicking an agent opens: current task, model profile, allowed tools, last events, cost, artifacts, and blocker/approval state.

## 10. Prompt Architecture

Orchestrator system prompt must define:

- Mission: manage the project and team, not perform delegated work.
- Allowed actions: ask, plan, assign, review, synthesize, update memory.
- Forbidden actions: doing worker implementation, bypassing approval, expanding scope silently.
- Output discipline: create task contracts, require evidence, reject vague output.
- Review policy: compare result against acceptance criteria and request focused fixes.

Worker prompt template must define:

- Role identity and scope.
- Task contract.
- Allowed context and files.
- Allowed tools.
- Evidence format.
- Memory read/write boundaries.
- Stop condition: return artifact for review, do not self-expand the task.

Useful default agents:

- Product Strategist.
- UX/UI Designer.
- Frontend Engineer.
- Backend Engineer.
- Full-stack Integrator.
- QA/Test Engineer.
- Security Reviewer.
- Researcher.
- DevOps/Release Engineer.
- Documentation Writer.

## 11. Roadmap

Phase 0: Prototype foundation

- Build static dashboard shell, project model, agent roster, model profiles, basic Orchestrator chat, and fake event stream.

Phase 1: Real MVP runtime

- Add tasks, worker runs, local workspace access, markdown memory, live events, approval gates, and pixel-office driven by real events.

Phase 2: GitHub and model gateway

- Add GitHub repo connection, branch/diff/PR draft flow, encrypted provider vault, fallback chains, budgets, and cost tracking.

Phase 3: Tools and MCP

- Add MCP registry, tool permission manifests, per-agent allowlists, sandboxing, and plugin/skill management.

Phase 4: Reliability and replay

- Add durable execution, run replay, trace export, evals, prompt versioning, and task templates.

Phase 5: Product polish

- Add team presets, onboarding wizard, visual theme system, marketplace, collaboration, and hosted/local deployment modes.

## 12. Main Risks

- Agent drift: solve with task contracts, Orchestrator review, Mission Keeper checks, and acceptance criteria.
- Tool security: solve with allowlists, sandboxing, approval gates, audit logs, and MCP quarantine.
- Cost explosions: solve with budgets, rate limits, fallback policy, per-run caps, and cost warnings.
- Prompt sprawl: solve with prompt versioning, templates, and prompt diff/review.
- Memory pollution: solve with write permissions, proposed memory patches, and periodic summarization.
- UI becoming a toy: solve by making pixel-office consume real events and always link to task evidence.
- Runtime unreliability: solve with resumable runs, idempotent side effects, retries, and event sourcing.
- Overbuilding: keep MVP focused on one user, one project workspace, local runtime, and GitHub integration.

## 13. Implementation Starting Point

Start with a local-first web app and a real event model before adding autonomous complexity.

Recommended first build slice:

1. Project dashboard.
2. Agent roster editor.
3. Model profile editor with encrypted secret references.
4. Orchestrator chat that can create task contracts and agents.
5. Task board with status transitions.
6. Event stream.
7. Pixel-office reading the same event stream.
8. Markdown memory files generated per project and per agent.

This slice proves the product's core loop: user intent -> Orchestrator -> team/task creation -> visible work state -> evidence-backed review -> memory update.

## 14. Sources

- GitHub Agent HQ: https://github.blog/news-insights/company-news/welcome-home-agents
- GitHub Mission Control guide: https://github.blog/ai-and-ml/github-copilot/how-to-orchestrate-agents-using-mission-control/
- Oh My OpenAgent: https://github.com/code-yeongyu/oh-my-openagent
- LangGraph: https://github.com/langchain-ai/langgraph
- LangGraph durable execution: https://docs.langchain.com/oss/python/langgraph/durable-execution
- Microsoft Agent Framework: https://github.com/microsoft/agent-framework
- CrewAI: https://github.com/crewAIInc/crewAI
- MetaGPT: https://github.com/FoundationAgents/MetaGPT
- ChatDev: https://github.com/OpenBMB/ChatDev
- AutoGPT Platform: https://github.com/Significant-Gravitas/AutoGPT
- LiteLLM: https://docs.litellm.ai/
- Portkey Gateway: https://github.com/Portkey-AI/gateway
- Langfuse: https://github.com/langfuse/langfuse
- AgentOps: https://github.com/AgentOps-AI/agentops
- Helicone: https://github.com/Helicone/helicone
- MCP TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- MCP reference servers: https://github.com/modelcontextprotocol/servers
- A2A Protocol: https://github.com/a2aproject/A2A
