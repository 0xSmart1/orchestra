import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [EventService, PrismaService],
  exports: [EventService],
})
export class EventModule {}
