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
import { RintalaService } from './rintala.service';

class SubmitRintalaDto {
  @IsObject()
  answers!: Record<string, number>;

  @IsString()
  @IsNotEmpty()
  childId!: string;
}

class RintalaRecordsQueryDto {
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

@Controller('api/rintala')
export class RintalaController {
  constructor(private readonly rintalaService: RintalaService) {}

  @Get('questions')
  getQuestions() {
    return this.rintalaService.getQuestions();
  }

  @Post('submit')
  submit(@Body() body: SubmitRintalaDto) {
    return this.rintalaService.submit(body.answers as any, body.childId);
  }

  @Get('records')
  getRecords(@Query() query: RintalaRecordsQueryDto) {
    return this.rintalaService.getRecords(
      query.childId,
      query.page ?? 1,
      query.pageSize ?? 20,
    );
  }
}
