import { Module } from '@nestjs/common';
import { ToolGatewayService } from './tool-gateway.service';
import { ToolGatewayController } from './tool-gateway.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [ToolGatewayController],
  providers: [ToolGatewayService, PrismaService],
  exports: [ToolGatewayService],
})
export class ToolGatewayModule {}
