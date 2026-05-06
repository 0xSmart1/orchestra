import { Controller, Get, Post, Query, Body, Sse } from '@nestjs/common';
import { EventService } from './event.service';
import { Prisma } from '@prisma/client';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

const eventSubject = new Subject<any>();

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  async create(@Body() data: Prisma.EventCreateInput) {
    const event = await this.eventService.create(data);
    eventSubject.next(event);
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
    return eventSubject.asObservable().pipe(
      map((event: any) => ({
        data: JSON.stringify(event),
      } as MessageEvent)),
    );
  }
}
