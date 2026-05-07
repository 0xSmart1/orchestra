import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { PrismaService } from '../../prisma.service';
import { ModelGatewayModule } from '../model-gateway/model-gateway.module';
import { AgentModule } from '../agent/agent.module';
import { TaskModule } from '../task/task.module';
import { RuntimeModule } from '../runtime/runtime.module';
import { EventModule } from '../event/event.module';
import { ToolExecutorService } from './tool-executor.service';

@Module({
  imports: [ModelGatewayModule, AgentModule, TaskModule, RuntimeModule, EventModule],
  controllers: [ConversationController],
  providers: [ConversationService, ToolExecutorService, PrismaService],
  exports: [ConversationService],
})
export class ConversationModule {}
