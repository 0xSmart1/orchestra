import { Module } from '@nestjs/common';
import { RuntimeService } from './runtime.service';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [RuntimeService, PrismaService],
  exports: [RuntimeService],
})
export class RuntimeModule {}
