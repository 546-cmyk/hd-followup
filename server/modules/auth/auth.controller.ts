import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';
import { AuthService } from './auth.service';
import { DIAGNOSIS_TYPES } from '@shared/api.interface';

class LoginDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

class ParentRegisterDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsNotEmpty()
  childName!: string;

  @IsString()
  @IsNotEmpty()
  surgeryDate!: string;

  @IsString()
  @IsIn(DIAGNOSIS_TYPES)
  diagnosisType!: '短段型' | '常见型' | '长段型' | '全结肠型';

  @IsString()
  @IsNotEmpty()
  contactName!: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('parent/login')
  async parentLogin(@Body() body: LoginDto) {
    return this.authService.parentLogin(body.phone, body.password);
  }

  @Post('parent/register')
  async parentRegister(@Body() body: ParentRegisterDto) {
    return this.authService.parentRegister(body);
  }

  @Post('doctor/login')
  async doctorLogin(@Body() body: LoginDto) {
    return this.authService.doctorLogin(body.phone, body.password);
  }
}
