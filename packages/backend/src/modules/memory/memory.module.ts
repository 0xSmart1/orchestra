import { Module } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { MemoryController } from './memory.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [MemoryController],
  providers: [MemoryService, PrismaService],
  exports: [MemoryService],
})
export class MemoryModule {}
