import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query } from '@nestjs/common';
import { TaskService } from './task.service';
import { Prisma } from '@prisma/client';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  create(@Body() data: Prisma.TaskCreateInput) {
    return this.taskService.create(data);
  }

  @Get()
  findByProject(@Query('projectId') projectId: string) {
    if (!projectId) return [];
    return this.taskService.findByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Prisma.TaskUpdateInput) {
    return this.taskService.update(id, data);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.taskService.update(id, { status } as Prisma.TaskUpdateInput);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskService.remove(id);
  }
}
