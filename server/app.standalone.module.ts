import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_FILTER } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { DrizzleModule } from './database/drizzle.module';
import { JwtAuthMiddleware } from './common/middleware/jwt-auth.middleware';
import { spaFallbackMiddleware } from './common/middleware/spa-fallback.middleware';

import { AuthModule } from './modules/auth/auth.module';
import { ChildrenModule } from './modules/children/children.module';
import { RedFlagModule } from './modules/red-flag/red-flag.module';
import { BowelDiaryModule } from './modules/bowel-diary/bowel-diary.module';
import { RintalaModule } from './modules/rintala/rintala.module';
import { HealthModule } from './modules/health/health.module';
import { DoctorModule } from './modules/doctor/doctor.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'hd-followup-secret-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
    DrizzleModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'dist/client'),
      exclude: ['/api/*'],
      serveStaticOptions: {
        extensions: ['html'],
      },
    }),
    AuthModule,
    ChildrenModule,
    RedFlagModule,
    BowelDiaryModule,
    RintalaModule,
    HealthModule,
    DoctorModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(JwtAuthMiddleware)
      .exclude(
        { path: 'api/auth/parent/login', method: RequestMethod.POST },
        { path: 'api/auth/parent/register', method: RequestMethod.POST },
        { path: 'api/auth/doctor/login', method: RequestMethod.POST },
        { path: 'api/health/articles', method: RequestMethod.GET },
        { path: 'api/health/articles/:id', method: RequestMethod.GET },
      )
      .forRoutes('api/*');

    consumer.apply(spaFallbackMiddleware).forRoutes('*');
  }
}
