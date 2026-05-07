import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ModelGatewayService } from './model-gateway.service';
import { Prisma } from '@prisma/client';

@Controller('models')
export class ModelGatewayController {
  constructor(private readonly modelGatewayService: ModelGatewayService) {}

  @Post('providers')
  createProvider(@Body() data: Prisma.ModelProviderCreateInput) {
    return this.modelGatewayService.createProvider(data);
  }

  @Get('providers')
  findAllProviders() {
    return this.modelGatewayService.findAllProviders();
  }

  @Patch('providers/:id')
  updateProvider(@Param('id') id: string, @Body() data: Prisma.ModelProviderUpdateInput) {
    return this.modelGatewayService.updateProvider(id, data);
  }

  @Delete('providers/:id')
  removeProvider(@Param('id') id: string) {
    return this.modelGatewayService.removeProvider(id);
  }

  @Get('providers/:id/available-models')
  listAvailableModels(@Param('id') id: string) {
    return this.modelGatewayService.listAvailableModels(id);
  }

  @Post('profiles')
  createProfile(@Body() data: Prisma.ModelProfileCreateInput) {
    return this.modelGatewayService.createProfile(data);
  }

  @Get('profiles')
  findAllProfiles() {
    return this.modelGatewayService.findAllProfiles();
  }

  @Get('profiles/:id')
  findOneProfile(@Param('id') id: string) {
    return this.modelGatewayService.findOneProfile(id);
  }

  @Patch('profiles/:id')
  updateProfile(@Param('id') id: string, @Body() data: Prisma.ModelProfileUpdateInput) {
    return this.modelGatewayService.updateProfile(id, data);
  }

  @Delete('profiles/:id')
  removeProfile(@Param('id') id: string) {
    return this.modelGatewayService.removeProfile(id);
  }
}
