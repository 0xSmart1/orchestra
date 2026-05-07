import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ProjectService } from './project.service';
import { Prisma } from '@prisma/client';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Body() data: Prisma.ProjectCreateInput) {
    return this.projectService.create(data);
  }

  @Get()
  findAll(@Query('archived') archived?: string) {
    return this.projectService.findAll({ archived: archived === 'true' });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Prisma.ProjectUpdateInput) {
    return this.projectService.update(id, data);
  }

  @Patch(':id')
  patch(@Param('id') id: string, @Body() data: Prisma.ProjectUpdateInput) {
    return this.projectService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectService.remove(id);
  }
}
