import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { FrontendController } from './frontend.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super_secret_lorawan_key_2025',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [FrontendController],
  exports: [],
})
export class FrontendModule {}
