import { Module, forwardRef } from '@nestjs/common';
import { DynamicDatabaseModule } from '../../database/dynamic-database.module';
import { WebhookAdminService } from './webhook-admin.service';
import { WebhookAdminController } from './webhook-admin.controller';
import { LorawanModule } from '../../lorawan/lorawan.module';

@Module({
  imports: [DynamicDatabaseModule, forwardRef(() => LorawanModule)],
  controllers: [WebhookAdminController],
  providers: [WebhookAdminService],
  exports: [WebhookAdminService],
})
export class WebhookAdminModule {}
