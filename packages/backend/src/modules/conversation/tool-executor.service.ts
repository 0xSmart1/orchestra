import { Injectable, Logger } from '@nestjs/common';
import { AgentService } from '../agent/agent.service';
import { TaskService } from '../task/task.service';
import { RuntimeService } from '../runtime/runtime.service';
import { OrchestratorEventEmitter } from '../event/orchestrator-event-emitter.service';
import { LlmClientService, ChatMessage } from '../model-gateway/llm-client.service';
import { PrismaService } from '../../prisma.service';
import { EventType, AgentStatus, TaskStatus, RunStatus } from '@orchestra/shared';
import { EventTypeName } from '@orchestra/shared';

export interface ToolExecutionResult {
  result: string;
}

@Injectable()
export class ToolExecutorService {
  private readonly logger = new Logger(ToolExecutorService.name);

  constructor(
    private agentService: AgentService,
    private taskService: TaskService,
    private runtimeService: RuntimeService,
    private eventEmitter: OrchestratorEventEmitter,
    private llmClient: LlmClientService,
    private prisma: PrismaService,
  ) {}

  async executeTool(
    toolName: string,
    args: Record<string, any>,
    projectId: string,
  ): Promise<ToolExecutionResult> {
    this.logger.log(`Executing tool: ${toolName} args=${JSON.stringify(args).slice(0, 200)}`);

    switch (toolName) {
      case 'create_agent':
        return this.createAgent(args as { name: string; role: string; systemPrompt: string }, projectId);
      case 'create_task':
        return this.createTask(args as { title: string; contract: string; assigneeId?: string; priority?: number }, projectId);
      case 'run_worker':
        return this.runWorker(args as { taskId: string; agentId: string }, projectId);
      case 'list_agents':
        return this.listAgents(projectId);
      case 'list_tasks':
        return this.listTasks(projectId);
      default:
        return { result: `Unknown tool: ${toolName}` };
    }
  }

  private async createAgent(
    args: { name: string; role: string; systemPrompt: string },
    projectId: string,
  ): Promise<ToolExecutionResult> {
    const agent = await this.agentService.createInstance({
      project: { connect: { id: projectId } },
      name: args.name,
      role: args.role,
      systemPrompt: args.systemPrompt,
    });

    await this.eventEmitter.emit({
      projectId,
      type: EventType.AGENT_CREATED,
      agentId: agent.id,
      payload: { name: agent.name, role: agent.role },
    });

    this.logger.log(`Agent created: ${agent.name} (${agent.id})`);
    return {
      result: JSON.stringify({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        status: agent.status,
      }),
    };
  }

  private async createTask(
    args: {
      title: string;
      contract: string;
      assigneeId?: string;
      priority?: number;
    },
    projectId: string,
  ): Promise<ToolExecutionResult> {
    const taskData: any = {
      project: { connect: { id: projectId } },
      title: args.title,
      contract: args.contract,
      priority: args.priority ?? 0,
    };

    if (args.assigneeId) {
      taskData.assignee = { connect: { id: args.assigneeId } };
      taskData.status = TaskStatus.ASSIGNED;
    }

    const task = await this.taskService.create(taskData);

    await this.eventEmitter.emit({
      projectId,
      type: EventType.TASK_CREATED,
      taskId: task.id,
      payload: { title: task.title, status: task.status },
    });

    if (args.assigneeId) {
      await this.eventEmitter.emit({
        projectId,
        type: EventType.TASK_ASSIGNED,
        taskId: task.id,
        agentId: args.assigneeId,
        payload: { assigneeId: args.assigneeId },
      });
    }

    this.logger.log(`Task created: ${task.title} (${task.id})`);
    return {
      result: JSON.stringify({
        id: task.id,
        title: task.title,
        status: task.status,
        assigneeId: task.assigneeId,
      }),
    };
  }

  private async runWorker(
    args: { taskId: string; agentId: string },
    projectId: string,
  ): Promise<ToolExecutionResult> {
    const { taskId, agentId } = args;

    // 1. Validate
    const agent = await this.agentService.findOneInstance(agentId);
    if (!agent || agent.projectId !== projectId) {
      return { result: JSON.stringify({ error: 'Agent not found in this project' }) };
    }

    const task = await this.taskService.findOne(taskId);
    if (!task || task.projectId !== projectId) {
      return { result: JSON.stringify({ error: 'Task not found in this project' }) };
    }

    // 2. Create Run
    const run = await this.runtimeService.createRun({
      task: { connect: { id: taskId } },
      status: RunStatus.RUNNING,
      startedAt: new Date(),
      modelProfile: agent.modelProfileId
        ? { connect: { id: agent.modelProfileId } }
        : undefined,
    });

    // 3. Update agent status
    await this.agentService.updateInstance(agentId, {
      status: AgentStatus.THINKING,
    });

    // 4. Update task status
    await this.taskService.update(taskId, {
      status: TaskStatus.RUNNING,
    });

    // 5. Emit events
    await this.eventEmitter.emit({
      projectId,
      type: EventType.RUN_STARTED,
      agentId,
      taskId,
      runId: run.id,
    });
    await this.eventEmitter.emit({
      projectId,
      type: EventType.AGENT_STATUS_CHANGED,
      agentId,
      payload: { from: AgentStatus.IDLE, to: AgentStatus.THINKING, status: AgentStatus.THINKING },
    });

    // 6. Build worker messages
    const workerMessages: ChatMessage[] = [
      {
        role: 'system',
        content: agent.systemPrompt,
      },
      {
        role: 'user',
        content:
          `## Task Contract\n\n${task.contract ?? task.title}\n\n` +
          `## Instructions\n` +
          `You must produce a structured output in the following JSON format:\n` +
          '```json\n' +
          JSON.stringify(
            {
              summary: 'Brief description of what you did',
              filesTouched: ['path/to/file1'],
              commandsRun: ['command that was run'],
              resultEvidence: 'How you verified the result',
              openRisks: ['any remaining risks'],
              followUpRecommendation: 'next step or null',
            },
            null,
            2,
          ) +
          '\n```\n' +
          `Respond ONLY with this JSON object. No other text before or after.`,
      },
    ];

    // 7. Resolve model profile
    const modelProfileId =
      agent.modelProfileId ??
      (
        await this.prisma.project.findUnique({
          where: { id: projectId },
          select: { defaultModelProfileId: true },
        })
      )?.defaultModelProfileId;

    if (!modelProfileId) {
      await this.runtimeService.updateRun(run.id, {
        status: RunStatus.FAILED,
        resultState: JSON.stringify({ error: 'No model profile configured' }),
        completedAt: new Date(),
      });
      await this.agentService.updateInstance(agentId, { status: AgentStatus.IDLE });
      await this.taskService.update(taskId, { status: TaskStatus.BLOCKED });
      return { result: JSON.stringify({ error: 'No model profile configured for worker' }) };
    }

    try {
      const startTime = Date.now();

      await this.eventEmitter.emit({
        projectId,
        type: EventType.RUN_MODEL_CALL_STARTED,
        agentId,
        taskId,
        runId: run.id,
      });

      // Update agent status to coding
      await this.agentService.updateInstance(agentId, {
        status: AgentStatus.CODING,
      });

      const llmResult = await this.llmClient.chat(modelProfileId, workerMessages);

      // 8. Parse response as WorkerOutput
      let workerOutput: Record<string, any>;
      try {
        const jsonMatch = llmResult.content?.match(/\{[\s\S]*\}/);
        workerOutput = JSON.parse(jsonMatch?.[0] ?? llmResult.content ?? '{}');
      } catch {
        workerOutput = {
          summary: llmResult.content ?? '(no content)',
          filesTouched: [],
          commandsRun: [],
          resultEvidence: 'Raw LLM output (failed to parse structured format)',
          openRisks: ['Worker output was not in expected JSON format'],
          followUpRecommendation: null,
        };
      }

      // 9. Create Artifact
      const artifact = await this.runtimeService.createArtifact({
        run: { connect: { id: run.id } },
        type: 'report',
        path: `runs/${run.id}/output.json`,
        description: workerOutput.summary ?? '',
      });

      // 10. Update Run
      const latencyMs = Date.now() - startTime;
      await this.runtimeService.updateRun(run.id, {
        status: RunStatus.COMPLETED,
        tokensIn: llmResult.tokensIn,
        tokensOut: llmResult.tokensOut,
        costUsd: 0.001,
        latencyMs,
        resultState: JSON.stringify(workerOutput),
        completedAt: new Date(),
      });

      // 11. Update agent status -> idle
      await this.agentService.updateInstance(agentId, {
        status: AgentStatus.IDLE,
      });

      // 12. Update task status -> in_review
      await this.taskService.update(taskId, {
        status: TaskStatus.REVIEW,
      });

      // 13. Emit events
      await this.eventEmitter.emit({
        projectId,
        type: EventType.RUN_ARTIFACT_CREATED,
        agentId,
        taskId,
        runId: run.id,
        payload: { artifactId: artifact.id, type: artifact.type },
      });
      await this.eventEmitter.emit({
      projectId,
      type: EventType.AGENT_STATUS_CHANGED,
      agentId,
      payload: { from: AgentStatus.CODING, to: AgentStatus.IDLE, status: AgentStatus.IDLE },
      });

      this.logger.log(
        `Worker completed: agent=${agent.name} task=${task.title} tokens=${llmResult.tokensIn}+${llmResult.tokensOut} latency=${latencyMs}ms`,
      );

      return { result: JSON.stringify(workerOutput) };
    } catch (error: any) {
      this.logger.error(`Worker run failed: ${error.message}`, error.stack);

      await this.runtimeService.updateRun(run.id, {
        status: RunStatus.FAILED,
        resultState: JSON.stringify({ error: error.message }),
        completedAt: new Date(),
      });
      await this.agentService.updateInstance(agentId, { status: AgentStatus.IDLE });
      await this.taskService.update(taskId, { status: TaskStatus.BLOCKED });

      await this.eventEmitter.emit({
      projectId,
      type: EventType.AGENT_STATUS_CHANGED,
      agentId,
        payload: { from: AgentStatus.CODING, to: AgentStatus.IDLE, status: AgentStatus.IDLE },
      });

      return {
        result: JSON.stringify({
          error: error.message,
          summary: 'Worker run failed',
        }),
      };
    }
  }

  private async listAgents(projectId: string): Promise<ToolExecutionResult> {
    const agents = await this.agentService.findInstancesByProject(projectId);
    return {
      result: JSON.stringify(
        agents.map((a) => ({
          id: a.id,
          name: a.name,
          role: a.role,
          status: a.status,
        })),
      ),
    };
  }

  private async listTasks(projectId: string): Promise<ToolExecutionResult> {
    const tasks = await this.taskService.findByProject(projectId);
    return {
      result: JSON.stringify(
        tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          assigneeId: t.assigneeId,
          priority: t.priority,
        })),
      ),
    };
  }
}
