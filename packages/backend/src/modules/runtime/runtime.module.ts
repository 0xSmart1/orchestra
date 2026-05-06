import { Module } from '@nestjs/common';
import { RuntimeService } from './runtime.service';
import { RuntimeController } from './runtime.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [RuntimeController],
  providers: [RuntimeService, PrismaService],
  exports: [RuntimeService],
})
export class RuntimeModule {}
