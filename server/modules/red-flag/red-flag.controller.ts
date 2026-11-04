import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsInt,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { RedFlagService } from './red-flag.service';

class SubmitCheckDto {
  @IsObject()
  answers!: Record<string, boolean>;

  @IsString()
  @IsNotEmpty()
  childId!: string;
}

class RecordsQueryDto {
  @IsString()
  @IsNotEmpty()
  childId!: string;

  @IsOptional()
  @Transform(({ obj, key, value }) =>
    obj[key] === '' ? undefined : value,
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ obj, key, value }) =>
    obj[key] === '' ? undefined : value,
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

@Controller('api/red-flag')
export class RedFlagController {
  constructor(private readonly redFlagService: RedFlagService) {}

  @Get('questions')
  getQuestions() {
    return this.redFlagService.getQuestions();
  }

  @Post('submit')
  submitCheck(@Body() body: SubmitCheckDto) {
    return this.redFlagService.submitCheck(body.answers as any, body.childId);
  }

  @Get('records')
  getRecords(@Query() query: RecordsQueryDto) {
    return this.redFlagService.getRecords(
      query.childId,
      query.page ?? 1,
      query.pageSize ?? 10,
    );
  }
}
