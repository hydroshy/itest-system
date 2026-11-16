import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { FrontendController } from './frontend.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret || !secret.trim()) {
          throw new Error(
            '❌ [FATAL CONFIG ERROR] Thiếu biến môi trường JWT_SECRET cho FrontendModule. Không được sử dụng mockdata fallback; hệ thống dừng khởi động khi deploy thiếu cấu hình.',
          );
        }
        return {
          secret: secret.trim(),
          signOptions: { expiresIn: '24h' },
        };
      },
    }),
  ],
  controllers: [FrontendController],
  exports: [],
})
export class FrontendModule {}
