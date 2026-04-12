import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { OtpModule } from './otp/otp.module';
import { ResumeModule } from './resume/resume.module';
import { AdminModule } from './admin/admin.module';
import { CompaniesModule } from './companies/companies.module';
import { AuditModule } from './audit/audit.module';
import { ApplicationsModule } from './applications/applications.module';
import { MessagesModule } from './messages/messages.module';
import { PkiModule } from './pki/pki.module';
import { User } from './users/user.entity';
import { Profile } from './users/profile.entity';
import { Otp } from './otp/otp.entity';
import { Resume } from './resume/resume.entity';
import { Company } from './companies/company.entity';
import { Job } from './companies/job.entity';
import { AuditLog } from './audit/audit-log.entity';
import { Application } from './applications/application.entity';
import { Message } from './messages/message.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // ── Rate Limiting ───────────────────────────────────────────
    // Global: 100 requests per minute per IP across all routes.
    // Auth endpoints get stricter limit via @Throttle decorator.
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60000, // 1 minute window in ms
        limit: 100, // max 100 requests per window
      },
      {
        name: 'auth',
        ttl: 60000, // 1 minute window
        limit: 10, // max 10 requests per window (for auth routes)
      },
    ]),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: parseInt(configService.get<string>('DB_PORT', '5432'), 10),
        username: configService.get<string>('DB_USERNAME', 'devuser'),
        password: configService.get<string>('DB_PASSWORD', 'devpass123'),
        database: configService.get<string>('DB_DATABASE', 'jobportal'),
        entities: [
          User,
          Profile,
          Otp,
          Resume,
          Company,
          Job,
          AuditLog,
          Application,
          Message,
        ],
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),

    PkiModule,
    UsersModule,
    AuthModule,
    OtpModule,
    ResumeModule,
    AdminModule,
    CompaniesModule,
    AuditModule,
    ApplicationsModule,
    MessagesModule,
  ],
  providers: [
    // Apply ThrottlerGuard globally to all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
