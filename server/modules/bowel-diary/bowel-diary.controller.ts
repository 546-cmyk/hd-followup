import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  Min,
  Max,
  IsNumber,
  IsIn,
} from 'class-validator';
import { BowelDiaryService } from './bowel-diary.service';
import { BLOATING_LEVELS, BRISTOL_STOOL_TYPES } from '@shared/api.interface';

class CreateBowelDiaryDto {
  @IsString()
  @IsNotEmpty()
  childId!: string;

  @IsString()
  @IsNotEmpty()
  recordDate!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  bowelCount!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  stoolType!: number;

  @IsString()
  @IsIn(BLOATING_LEVELS)
  bloatingLevel!: 'none' | 'mild' | 'moderate' | 'severe';

  @Type(() => Number)
  @IsNumber()
  temperature!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

class RecordsQueryDto {
  @IsString()
  @IsNotEmpty()
  childId!: string;

  @IsOptional()
  @Transform(({ obj, key, value }) =>
    obj[key] === '' ? undefined : value,
  )
  @IsString()
  startDate?: string;

  @IsOptional()
  @Transform(({ obj, key, value }) =>
    obj[key] === '' ? undefined : value,
  )
  @IsString()
  endDate?: string;

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

class TrendQueryDto {
  @IsString()
  @IsNotEmpty()
  childId!: string;

  @IsOptional()
  @Transform(({ obj, key, value }) =>
    obj[key] === '' ? undefined : value,
  )
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(90)
  days?: number;
}

@Controller('api/bowel-diary')
export class BowelDiaryController {
  constructor(private readonly bowelDiaryService: BowelDiaryService) {}

  @Post()
  createRecord(@Body() body: CreateBowelDiaryDto) {
    return this.bowelDiaryService.createRecord(body);
  }

  @Get()
  getRecords(@Query() query: RecordsQueryDto) {
    return this.bowelDiaryService.getRecords(
      query.childId,
      query.startDate,
      query.endDate,
      query.page ?? 1,
      query.pageSize ?? 20,
    );
  }

  @Get('trend')
  getTrend(@Query() query: TrendQueryDto) {
    return this.bowelDiaryService.getTrend(
      query.childId,
      query.days ?? 30,
    );
  }
}
