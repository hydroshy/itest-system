/**
 * Daviteq Backend Domain Architecture
 * Cleanly separated subsystems for rapid debugging, isolation, and modular maintainability.
 */

export * from './backend.module';
export * from './backend-diagnostics.controller';
export * from './common/subsystem.types';
export * from './common/subsystem-logger.service';
export * from './common/subsystem-debug.interceptor';

// Subsystems
export * from './database';
export * from './lorawan';
export * from './order-management';
export * from './test-automation';
export * from './identity';
export * from './industrial-iot';
export * from './realtime';
