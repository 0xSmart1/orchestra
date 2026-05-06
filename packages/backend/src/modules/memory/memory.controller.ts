import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { Prisma } from '@prisma/client';

@Controller('memory')
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  @Post()
  create(@Body() data: Prisma.MemoryDocumentCreateInput) {
    return this.memoryService.create(data);
  }

  @Get()
  findByProject(
    @Query('projectId') projectId: string,
    @Query('agentId') agentId?: string,
  ) {
    if (agentId) {
      return this.memoryService.findByAgent(projectId, agentId);
    }
    return this.memoryService.findByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.memoryService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Prisma.MemoryDocumentUpdateInput) {
    return this.memoryService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.memoryService.remove(id);
  }
}
