import { Controller, Get, Post, Patch, Delete, Query, Body, Param, Sse } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { Prisma } from '@prisma/client';
import { Observable, Subject } from 'rxjs';
import { map, filter } from 'rxjs/operators';

const chatSubject = new Subject<any>();

@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  create(@Body() data: Prisma.ConversationCreateInput) {
    return this.conversationService.create(data);
  }

  @Get()
  findByProject(
    @Query('projectId') projectId: string,
    @Query('archived') archived?: string,
  ) {
    return this.conversationService.findByProject(projectId, {
      archived: archived === 'true',
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conversationService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.conversationService.remove(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Prisma.ConversationUpdateInput) {
    return this.conversationService.update(id, data);
  }

  @Post(':id/messages')
  async sendMessage(
    @Param('id') conversationId: string,
    @Body() body: { content: string; projectId: string; modelProfileId?: string },
  ) {
    const message = await this.conversationService.orchestratorRespond(
      conversationId,
      body.content,
      body.projectId,
      body.modelProfileId,
    );
    chatSubject.next({ conversationId, message });
    return message;
  }

  @Get(':id/messages')
  getMessages(@Param('id') conversationId: string) {
    return this.conversationService.getMessages(conversationId);
  }

  @Sse(':id/stream')
  streamMessages(@Param('id') conversationId: string): Observable<MessageEvent> {
    return chatSubject.asObservable().pipe(
      filter((event: any) => event.conversationId === conversationId),
      map((event: any) => ({
        data: JSON.stringify(event.message),
      } as MessageEvent)),
    );
  }
}
