import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ToolGatewayService } from './tool-gateway.service';
import { Prisma } from '@prisma/client';

@Controller('tools')
export class ToolGatewayController {
  constructor(private readonly toolGatewayService: ToolGatewayService) {}

  @Post()
  create(@Body() data: Prisma.ToolDefinitionCreateInput) {
    return this.toolGatewayService.create(data);
  }

  @Get()
  findAll() {
    return this.toolGatewayService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.toolGatewayService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.toolGatewayService.remove(id);
  }
}
