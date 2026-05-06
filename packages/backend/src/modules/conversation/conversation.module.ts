import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { PrismaService } from '../../prisma.service';
import { ModelGatewayModule } from '../model-gateway/model-gateway.module';

@Module({
  imports: [ModelGatewayModule],
  controllers: [ConversationController],
  providers: [ConversationService, PrismaService],
  exports: [ConversationService],
})
export class ConversationModule {}
