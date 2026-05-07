import { Injectable, Inject, Logger } from '@nestjs/common';
import { EventService } from './event.service';
import { EventTypeName } from '@orchestra/shared';
import { Subject } from 'rxjs';

export const EVENT_SUBJECT = 'EVENT_SUBJECT';

@Injectable()
export class OrchestratorEventEmitter {
  private readonly logger = new Logger(OrchestratorEventEmitter.name);

  constructor(
    private eventService: EventService,
    @Inject(EVENT_SUBJECT) private subject: Subject<any>,
  ) {}

  async emit(params: {
    projectId: string;
    type: EventTypeName;
    agentId?: string;
    taskId?: string;
    runId?: string;
    payload?: Record<string, any>;
  }): Promise<void> {
    const event = await this.eventService.create({
      project: { connect: { id: params.projectId } },
      type: params.type,
      agent: params.agentId ? { connect: { id: params.agentId } } : undefined,
      task: params.taskId ? { connect: { id: params.taskId } } : undefined,
      run: params.runId ? { connect: { id: params.runId } } : undefined,
      payload: JSON.stringify(params.payload ?? {}),
    });
    this.subject.next(event);
    this.logger.log(`Event emitted: ${params.type} project=${params.projectId}`);
  }
}
