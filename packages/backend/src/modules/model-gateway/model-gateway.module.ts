import { Module } from '@nestjs/common';
import { ModelGatewayService } from './model-gateway.service';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [ModelGatewayService, PrismaService],
  exports: [ModelGatewayService],
})
export class ModelGatewayModule {}
