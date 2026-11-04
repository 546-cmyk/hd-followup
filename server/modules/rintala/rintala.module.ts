import { Module } from '@nestjs/common';
import { RintalaController } from './rintala.controller';
import { RintalaService } from './rintala.service';

@Module({
  controllers: [RintalaController],
  providers: [RintalaService],
})
export class RintalaModule {}
