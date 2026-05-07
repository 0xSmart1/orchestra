import { Controller, Get, Post, Query, Body, Inject, Sse } from '@nestjs/common';
import { EventService } from './event.service';
import { Prisma } from '@prisma/client';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { EVENT_SUBJECT } from './orchestrator-event-emitter.service';

@Controller('events')
export class EventController {
  constructor(
    private readonly eventService: EventService,
    @Inject(EVENT_SUBJECT) private eventSubject: Subject<any>,
  ) {}

  @Post()
  async create(@Body() data: Prisma.EventCreateInput) {
    const event = await this.eventService.create(data);
    this.eventSubject.next(event);
    return event;
  }

  @Get()
  findByProject(
    @Query('projectId') projectId: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    if (type) {
      return this.eventService.findByProjectAndType(projectId, type, parsedLimit);
    }
    return this.eventService.findByProject(projectId, parsedLimit);
  }

  @Sse('stream')
  stream(@Query('projectId') projectId: string): Observable<MessageEvent> {
    return this.eventSubject.asObservable().pipe(
      filter((event: any) => !projectId || event.projectId === projectId),
      map((event: any) => ({
        data: JSON.stringify(event),
      } as MessageEvent)),
    );
  }
}
