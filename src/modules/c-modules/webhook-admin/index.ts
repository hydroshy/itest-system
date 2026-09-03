export * from './entities/webhook-log.entity';
export * from './webhook-admin.service';
export * from './webhook-admin.controller';
export * from './webhook-admin.module';

export const C_WEBHOOK_ADMIN = {
  id: 'c-webhook-admin',
  code: 'C_MOD_WEBHOOKS',
  title: 'Webhook Manager',
  description: 'Monitor live packet streams from ChirpStack & ThingPark webhooks with automated log retention.',
};
