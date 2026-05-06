import { Module } from '@nestjs/common';
import { ModelGatewayService } from './model-gateway.service';
import { ModelGatewayController } from './model-gateway.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [ModelGatewayController],
  providers: [ModelGatewayService, PrismaService],
  exports: [ModelGatewayService],
})
export class ModelGatewayModule {}
