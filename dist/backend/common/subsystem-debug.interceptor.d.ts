import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { BackendSubsystem } from './subsystem.types';
export declare class SubsystemDebugInterceptor implements NestInterceptor {
    private readonly logger;
    static resolveSubsystem(url: string): BackendSubsystem;
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
