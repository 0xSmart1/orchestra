import { Module } from '@nestjs/common';
import { ModelGatewayService } from './model-gateway.service';
import { ModelGatewayController } from './model-gateway.controller';
import { LlmClientService } from './llm-client.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [ModelGatewayController],
  providers: [ModelGatewayService, LlmClientService, PrismaService],
  exports: [ModelGatewayService, LlmClientService],
})
export class ModelGatewayModule {}
