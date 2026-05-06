import { Module } from '@nestjs/common';
import { ProjectModule } from './modules/project/project.module';
import { AgentModule } from './modules/agent/agent.module';
import { ModelGatewayModule } from './modules/model-gateway/model-gateway.module';
import { TaskModule } from './modules/task/task.module';
import { RuntimeModule } from './modules/runtime/runtime.module';
import { ToolGatewayModule } from './modules/tool-gateway/tool-gateway.module';
import { MemoryModule } from './modules/memory/memory.module';
import { EventModule } from './modules/event/event.module';

@Module({
  imports: [
    ProjectModule,
    AgentModule,
    ModelGatewayModule,
    TaskModule,
    RuntimeModule,
    ToolGatewayModule,
    MemoryModule,
    EventModule,
  ],
})
export class AppModule {}
