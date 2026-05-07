import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { AgentService } from './agent.service';
import { Prisma } from '@prisma/client';

@Controller('agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('templates')
  createTemplate(@Body() data: Prisma.AgentTemplateCreateInput) {
    return this.agentService.createTemplate(data);
  }

  @Get('templates')
  findAllTemplates() {
    return this.agentService.findAllTemplates();
  }

  @Get('templates/:id')
  findOneTemplate(@Param('id') id: string) {
    return this.agentService.findOneTemplate(id);
  }

  @Put('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() data: Prisma.AgentTemplateUpdateInput) {
    return this.agentService.updateTemplate(id, data);
  }

  @Patch('templates/:id')
  patchTemplate(@Param('id') id: string, @Body() data: Prisma.AgentTemplateUpdateInput) {
    return this.agentService.updateTemplate(id, data);
  }

  @Delete('templates/:id')
  removeTemplate(@Param('id') id: string) {
    return this.agentService.removeTemplate(id);
  }

  @Post('instances')
  createInstance(@Body() data: Prisma.AgentInstanceCreateInput) {
    return this.agentService.createInstance(data);
  }

  @Get('instances')
  findInstances(@Query('projectId') projectId: string) {
    if (projectId) {
      return this.agentService.findInstancesByProject(projectId);
    }
    return [];
  }

  @Get('instances/:id')
  findOneInstance(@Param('id') id: string) {
    return this.agentService.findOneInstance(id);
  }

  @Put('instances/:id')
  updateInstance(@Param('id') id: string, @Body() data: Prisma.AgentInstanceUpdateInput) {
    return this.agentService.updateInstance(id, data);
  }

  @Patch('instances/:id')
  patchInstance(@Param('id') id: string, @Body() data: Prisma.AgentInstanceUpdateInput) {
    return this.agentService.updateInstance(id, data);
  }

  @Delete('instances/:id')
  removeInstance(@Param('id') id: string) {
    return this.agentService.removeInstance(id);
  }
}
