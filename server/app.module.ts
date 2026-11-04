import { APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PlatformModule } from '@lark-apaas/fullstack-nestjs-core';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { ViewModule } from './modules/view/view.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChildrenModule } from './modules/children/children.module';
import { RedFlagModule } from './modules/red-flag/red-flag.module';
import { BowelDiaryModule } from './modules/bowel-diary/bowel-diary.module';
import { RintalaModule } from './modules/rintala/rintala.module';
import { HealthModule } from './modules/health/health.module';
import { DoctorModule } from './modules/doctor/doctor.module';

@Module({
  imports: [
    // 平台 Module，提供平台能力
    PlatformModule.forRoot(),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'hd-followup-secret-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
    // ====== @route-section: business-modules START ======
    // Place all business modules here.Do NOT add fallback modules here.
    AuthModule,
    ChildrenModule,
    RedFlagModule,
    BowelDiaryModule,
    RintalaModule,
    HealthModule,
    DoctorModule,
    // ====== @route-section: business-modules END ======

    // ⚠️ @route-order: last
    // ViewModule is the fallback route module, must be registered last.
    ViewModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
