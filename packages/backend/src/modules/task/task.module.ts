import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [TaskService, PrismaService],
  exports: [TaskService],
})
export class TaskModule {}
