import { Module } from '@nestjs/common';
import { RedFlagController } from './red-flag.controller';
import { RedFlagService } from './red-flag.service';

@Module({
  controllers: [RedFlagController],
  providers: [RedFlagService],
})
export class RedFlagModule {}
