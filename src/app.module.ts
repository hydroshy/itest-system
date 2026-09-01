import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DynamicDatabaseModule } from './modules/database/dynamic-database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles-permissions/roles.module';
import { LorawanModule } from './modules/lorawan/lorawan.module';
import { AdminPanelModule } from './modules/admin-panel/admin-panel.module';
import { UserPanelModule } from './modules/user-panel/user-panel.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DynamicDatabaseModule,
    AuthModule,
    UsersModule,
    RolesModule,
    LorawanModule,
    AdminPanelModule,
    UserPanelModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

