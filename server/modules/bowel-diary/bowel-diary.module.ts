import { Module } from '@nestjs/common';
import { BowelDiaryController } from './bowel-diary.controller';
import { BowelDiaryService } from './bowel-diary.service';

@Module({
  controllers: [BowelDiaryController],
  providers: [BowelDiaryService],
})
export class BowelDiaryModule {}
