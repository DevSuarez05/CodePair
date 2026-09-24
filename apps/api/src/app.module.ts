import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { appConfig } from './config/app.config';
import { authConfig } from './config/auth.config';
import { databaseConfig } from './config/database.config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HelpRequestsModule } from './modules/help-requests/help-requests.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { FeedbacksModule } from './modules/feedbacks/feedbacks.module';

@Module({
  imports: [
    // ── Configuration ──────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [appConfig, authConfig, databaseConfig],
      cache: true,
    }),

    // ── Rate Limiting (3-tier) ─────────────────────────────────
    ThrottlerModule.forRoot([
      { name: 'short',  ttl: 1000,  limit: 10  },
      { name: 'medium', ttl: 10000, limit: 50  },
      { name: 'long',   ttl: 60000, limit: 100 },
    ]),

    // ── Database (Global singleton) ────────────────────────────
    DatabaseModule,

    // ── Feature Modules ────────────────────────────────────────
    AuthModule,         // POST /auth/register, /auth/login, /auth/refresh, /auth/logout, GET /auth/me
    UsersModule,        // GET /users/me, /users/:id, /users/:id/ratings
    HelpRequestsModule, // POST /requests, GET /requests, GET /requests/:id, PATCH /requests/:id/cancel
    SessionsModule,     // POST /requests/:id/accept, GET /sessions, GET /sessions/:id
    FeedbacksModule,    // POST /sessions/:id/feedback, GET /sessions/:id/feedback
  ],
})
export class AppModule {}
