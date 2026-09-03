import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DynamicDatabaseModule } from './modules/database/dynamic-database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles-permissions/roles.module';
import { NetworkServersModule } from './modules/network-servers/network-servers.module';
import { LorawanModule } from './modules/lorawan/lorawan.module';
import { AdminPanelModule } from './modules/admin-panel/admin-panel.module';
import { UserPanelModule } from './modules/user-panel/user-panel.module';
import { DModulesModule } from './modules/d-modules/d-modules.module';
import { DecoderModule } from './modules/c-modules/decoder-admin/decoder.module';
import { WebhookAdminModule } from './modules/c-modules/webhook-admin/webhook-admin.module';
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
    NetworkServersModule,
    LorawanModule,
    AdminPanelModule,
    UserPanelModule,
    DModulesModule,
    DecoderModule,
    WebhookAdminModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
