import { Controller, Get, Post, Param, Body } from '@nestjs/common';
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
}
