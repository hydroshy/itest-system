import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { BackendSubsystem } from './subsystem.types';

@Injectable()
export class SubsystemLogger implements LoggerService {
  constructor(private readonly subsystem: BackendSubsystem | string) {}

  private formatMessage(level: string, message: any, context?: string): string {
    const timestamp = new Date().toISOString();
    const domainTag = `[${this.subsystem}]`;
    const contextTag = context ? ` [${context}]` : '';
    const content = typeof message === 'object' ? JSON.stringify(message) : message;
    return `${timestamp} ${level.toUpperCase().padEnd(5)} ${domainTag}${contextTag} ${content}`;
  }

  log(message: any, context?: string) {
    console.log(this.formatMessage('info', message, context));
  }

  error(message: any, trace?: string, context?: string) {
    console.error(this.formatMessage('error', message, context));
    if (trace) {
      console.error(`  ↳ Trace: ${trace}`);
    }
  }

  warn(message: any, context?: string) {
    console.warn(this.formatMessage('warn', message, context));
  }

  debug?(message: any, context?: string) {
    console.debug(this.formatMessage('debug', message, context));
  }

  verbose?(message: any, context?: string) {
    console.log(this.formatMessage('verbose', message, context));
  }
}

export function createSubsystemLogger(subsystem: BackendSubsystem | string): SubsystemLogger {
  return new SubsystemLogger(subsystem);
}
