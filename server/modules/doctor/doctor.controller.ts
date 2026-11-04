import { Controller, Get, Post, Body, Param, Req, Query } from '@nestjs/common';
import type { AuthenticatedRequest } from '@server/common/middleware/jwt-auth.middleware';
import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  IsIn,
} from 'class-validator';
import { DoctorService } from './doctor.service';
import { RISK_LEVELS } from '@shared/api.interface';

class PatientsQueryDto {
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
  @IsIn(RISK_LEVELS)
  riskLevel?: 'green' | 'yellow' | 'red';
}

class BatchReminderDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  childIds?: string[];

  @IsOptional()
  @IsString()
  @IsIn(RISK_LEVELS)
  riskLevel?: 'green' | 'yellow' | 'red';
}

class AddFollowupNoteDto {
  @IsString()
  @IsNotEmpty()
  childId!: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsString()
  nextFollowupDate?: string;
}

@Controller('api/doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get('patients')
  getPatients(@Req() req: AuthenticatedRequest, @Query() query: PatientsQueryDto) {
    return this.doctorService.getPatients(req.userContext.userId, {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      riskLevel: query.riskLevel,
    });
  }

  @Get('patients/:id')
  getPatientDetail(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.doctorService.getPatientDetail(id, req.userContext.userId);
  }

  @Get('dashboard')
  getDashboard(@Req() req: AuthenticatedRequest) {
    return this.doctorService.getDashboard(req.userContext.userId);
  }

  @Post('followup/batch')
  batchSendReminder(@Body() body: BatchReminderDto, @Req() req: AuthenticatedRequest) {
    return this.doctorService.batchSendReminder(body, req.userContext.userId);
  }

  @Post('followup/note')
  addFollowupNote(@Body() body: AddFollowupNoteDto, @Req() req: AuthenticatedRequest) {
    return this.doctorService.addFollowupNote(body, req.userContext.userId);
  }
}
