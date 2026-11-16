import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DynamicDatabaseModule } from '../../../database/dynamic-database.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { RolesModule } from '../roles-permissions/roles.module';

@Module({
  imports: [
    DynamicDatabaseModule,
    PassportModule,
    RolesModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret || !secret.trim()) {
          throw new Error(
            '❌ [FATAL CONFIG ERROR] Thiếu biến môi trường JWT_SECRET. Không được sử dụng mockdata fallback; hệ thống dừng khởi động khi deploy thiếu cấu hình.',
          );
        }
        return {
          secret: secret.trim(),
          signOptions: { expiresIn: '24h' },
        };
      },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

