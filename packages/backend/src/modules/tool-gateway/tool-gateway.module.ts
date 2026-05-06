import { Module } from '@nestjs/common';
import { ToolGatewayService } from './tool-gateway.service';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [ToolGatewayService, PrismaService],
  exports: [ToolGatewayService],
})
export class ToolGatewayModule {}
