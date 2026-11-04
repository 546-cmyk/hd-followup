import { Controller, Get, Param, Query } from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import { IsString, IsOptional, IsInt, Min, Max, IsNotEmpty } from 'class-validator';
import { HealthService } from './health.service';

class ArticlesQueryDto {
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

  @IsOptional()
  @Transform(({ obj, key, value }) =>
    obj[key] === '' ? undefined : value,
  )
  @IsString()
  category?: string;

  @IsOptional()
  @Transform(({ obj, key, value }) =>
    obj[key] === '' ? undefined : value,
  )
  @IsString()
  keyword?: string;
}

class RemindersQueryDto {
  @IsOptional()
  @Transform(({ obj, key, value }) =>
    obj[key] === '' ? undefined : value,
  )
  @IsString()
  childId?: string;
}

@Controller('api/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('articles')
  getArticles(@Query() query: ArticlesQueryDto) {
    return this.healthService.getArticles(
      query.page ?? 1,
      query.pageSize ?? 10,
      query.category,
      query.keyword,
    );
  }

  @Get('articles/:id')
  getArticleDetail(@Param('id') id: string) {
    return this.healthService.getArticleDetail(id);
  }

  @Get('reminders')
  getReminders(@Query() query: RemindersQueryDto) {
    return this.healthService.getReminders(query.childId ?? '');
  }
}
