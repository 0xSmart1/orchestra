import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { RuntimeService } from './runtime.service';
import { Prisma } from '@prisma/client';

@Controller('runs')
export class RuntimeController {
  constructor(private readonly runtimeService: RuntimeService) {}

  @Post()
  createRun(@Body() data: Prisma.RunCreateInput) {
    return this.runtimeService.createRun(data);
  }

  @Get()
  findRunsByTask(@Query('taskId') taskId: string) {
    if (!taskId) return [];
    return this.runtimeService.findRunsByTask(taskId);
  }

  @Get(':id')
  findOneRun(@Param('id') id: string) {
    return this.runtimeService.findRunById(id);
  }

  @Put(':id')
  updateRun(@Param('id') id: string, @Body() data: Prisma.RunUpdateInput) {
    return this.runtimeService.updateRun(id, data);
  }

  @Post('artifacts')
  createArtifact(@Body() data: Prisma.ArtifactCreateInput) {
    return this.runtimeService.createArtifact(data);
  }

  @Get(':runId/artifacts')
  findArtifactsByRun(@Param('runId') runId: string) {
    return this.runtimeService.findArtifactsByRun(runId);
  }
}
