import { Module } from '@nestjs/common';
import { NetworkServersModule } from '../../modules/network-servers/network-servers.module';
import { LorawanModule } from '../../modules/lorawan/lorawan.module';
import { WebhookAdminModule } from '../../modules/c-modules/webhook-admin/webhook-admin.module';
import { LorawanDiagnosticService } from './lorawan-diagnostic.service';

/**
 * LoRaWAN Network Server Domain Subsystem
 * Unifies LoRaWAN core management, Network Server connectors, and Webhook dispatchers.
 */
@Module({
  imports: [NetworkServersModule, LorawanModule, WebhookAdminModule],
  providers: [LorawanDiagnosticService],
  exports: [
    NetworkServersModule,
    LorawanModule,
    WebhookAdminModule,
    LorawanDiagnosticService,
  ],
})
export class LorawanSubsystemModule {}
