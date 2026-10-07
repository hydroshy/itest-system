import { LoggerService } from '@nestjs/common';
import { BackendSubsystem } from './subsystem.types';
export declare class SubsystemLogger implements LoggerService {
    private readonly subsystem;
    constructor(subsystem: BackendSubsystem | string);
    private formatMessage;
    log(message: any, context?: string): void;
    error(message: any, trace?: string, context?: string): void;
    warn(message: any, context?: string): void;
    debug?(message: any, context?: string): void;
    verbose?(message: any, context?: string): void;
}
export declare function createSubsystemLogger(subsystem: BackendSubsystem | string): SubsystemLogger;
