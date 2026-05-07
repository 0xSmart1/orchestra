import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { PrismaService } from '../../prisma.service';
import { OrchestratorEventEmitter, EVENT_SUBJECT } from './orchestrator-event-emitter.service';
import { Subject } from 'rxjs';

@Module({
  controllers: [EventController],
  providers: [
    { provide: EVENT_SUBJECT, useValue: new Subject<any>() },
    EventService,
    OrchestratorEventEmitter,
    PrismaService,
  ],
  exports: [EventService, OrchestratorEventEmitter, EVENT_SUBJECT],
})
export class EventModule {}
