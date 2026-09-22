import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Response, Request } from 'express';
import { BackendSubsystem } from './subsystem.types';

@Injectable()
export class SubsystemDebugInterceptor implements NestInterceptor {
  private readonly logger = new Logger('SubsystemDispatcher');

  /**
   * Automatically resolve backend domain subsystem from incoming URL path
   */
  public static resolveSubsystem(url: string): BackendSubsystem {
    const cleanUrl = url.toLowerCase().split('?')[0];

    if (cleanUrl.includes('/database')) {
      return BackendSubsystem.DATABASE;
    }
    if (
      cleanUrl.includes('/lorawan') ||
      cleanUrl.includes('/network-servers') ||
      cleanUrl.includes('/webhook')
    ) {
      return BackendSubsystem.LORAWAN;
    }
    if (
      cleanUrl.includes('/sales-orders') ||
      cleanUrl.includes('/item-codes') ||
      cleanUrl.includes('/sensor-types')
    ) {
      return BackendSubsystem.ORDER_MANAGEMENT;
    }
    if (
      cleanUrl.includes('/test-run') ||
      cleanUrl.includes('/test-builder') ||
      cleanUrl.includes('/decoder') ||
      cleanUrl.includes('/test-automation')
    ) {
      return BackendSubsystem.TEST_AUTOMATION;
    }
    if (
      cleanUrl.includes('/auth') ||
      cleanUrl.includes('/users') ||
      cleanUrl.includes('/roles')
    ) {
      return BackendSubsystem.IDENTITY;
    }
    if (
      cleanUrl.includes('/modbus') ||
      cleanUrl.includes('/hmi') ||
      cleanUrl.includes('/overview')
    ) {
      return BackendSubsystem.INDUSTRIAL_IOT;
    }
    if (cleanUrl.includes('/realtime') || cleanUrl.includes('/socket.io')) {
      return BackendSubsystem.REALTIME;
    }

    return BackendSubsystem.IDENTITY;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<Request>();
    const res = httpCtx.getResponse<Response>();

    const url = req?.originalUrl || req?.url || '';
    const method = req?.method || 'GET';
    const subsystem = SubsystemDebugInterceptor.resolveSubsystem(url);
    const startTime = Date.now();

    // Set response header for clear client-side debugging
    if (res && res.setHeader) {
      res.setHeader('X-Daviteq-Subsystem', subsystem);
    }

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        if (duration > 500) {
          this.logger.warn(`[${subsystem}] SLOW REQUEST: ${method} ${url} completed in ${duration}ms`);
        }
      }),
      catchError((err) => {
        const duration = Date.now() - startTime;
        const status = err instanceof HttpException ? err.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
        const message = err?.message || 'Internal Server Error';

        console.error(
          `\x1b[31m[ERROR IN DOMAIN: ${subsystem}]\x1b[0m ${method} ${url} -> Status ${status} (${duration}ms): ${message}`
        );

        // Enrich HttpException response with subsystem domain if json
        if (err instanceof HttpException) {
          const resp = err.getResponse();
          if (typeof resp === 'object' && resp !== null) {
            (resp as any).subsystem = subsystem;
            (resp as any).debugOrigin = `Daviteq/Backend/${subsystem}`;
          }
        }

        return throwError(() => err);
      })
    );
  }
}
