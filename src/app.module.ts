import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FrontendModule } from './frontend/frontend.module';
import { BackendModule } from './backend/backend.module';

/**
 * Root Application Module
 * Cleanly separates Frontend (UI Presentation Layer) and Backend (Domain Subsystems Layer).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FrontendModule,
    BackendModule,
  ],
})
export class AppModule {}
