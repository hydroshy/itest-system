import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RealtimeGateway } from './realtime.gateway';

export interface TelemetryStreamEvent {
  type: 'telemetry' | 'downlink' | 'ping' | 'unified_telemetry' | 'unified_batch' | 'alarm' | 'plugin';
  data: any;
  timestamp: string;
}

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private readonly stream$ = new Subject<TelemetryStreamEvent>();

  constructor(private readonly gateway: RealtimeGateway) {}

  /**
   * Broadcast plugin lifecycle events (install, enable, disable, uninstall) to WebSocket & SSE
   */
  publishPluginLifecycle(eventName: string, payload: any) {
    const event: TelemetryStreamEvent = {
      type: 'plugin',
      data: { event: eventName, ...payload },
      timestamp: new Date().toISOString(),
    };

    this.stream$.next(event);

    try {
      this.gateway.broadcastPluginEvent(eventName, payload);
    } catch (err: any) {
      this.logger.warn(`Failed to broadcast plugin event [${eventName}] via WebSocket: ${err.message}`);
    }
  }

  /**
   * Broadcast unified telemetry metric (protocol-agnostic)
   */
  publishUnifiedTelemetry(telemetry: any) {
    const event: TelemetryStreamEvent = {
      type: 'unified_telemetry',
      data: telemetry,
      timestamp: new Date().toISOString(),
    };

    this.stream$.next(event);

    try {
      this.gateway.broadcastUnifiedTelemetry(telemetry);
    } catch (err: any) {
      this.logger.warn(`Failed to broadcast unified telemetry via WebSocket: ${err.message}`);
    }
  }

  /**
   * Broadcast batch of unified telemetry metrics for real-time dashboards & HMI
   */
  publishUnifiedBatch(batch: any[]) {
    const event: TelemetryStreamEvent = {
      type: 'unified_batch',
      data: batch,
      timestamp: new Date().toISOString(),
    };

    this.stream$.next(event);

    try {
      this.gateway.broadcastUnifiedBatch(batch);
    } catch (err: any) {
      this.logger.warn(`Failed to broadcast unified telemetry batch via WebSocket: ${err.message}`);
    }
  }

  /**
   * Broadcast alarm event
   */
  publishAlarm(alarm: any) {
    const event: TelemetryStreamEvent = {
      type: 'alarm',
      data: alarm,
      timestamp: new Date().toISOString(),
    };

    this.stream$.next(event);

    try {
      this.gateway.broadcastAlarm(alarm);
    } catch (err: any) {
      this.logger.warn(`Failed to broadcast alarm via WebSocket: ${err.message}`);
    }
  }

  /**
   * Broadcast an incoming uplink telemetry packet to all connected WebSocket clients and SSE stream
   */
  publishTelemetry(telemetry: any) {
    const event: TelemetryStreamEvent = {
      type: 'telemetry',
      data: telemetry,
      timestamp: new Date().toISOString(),
    };

    // Push to SSE Observable
    this.stream$.next(event);

    // Push to WebSocket Gateway
    try {
      this.gateway.broadcastTelemetry(telemetry);
    } catch (err: any) {
      this.logger.warn(`Failed to broadcast telemetry via WebSocket: ${err.message}`);
    }
  }

  /**
   * Broadcast a downlink status event to all connected WebSocket clients and SSE stream
   */
  publishDownlink(downlinkEvent: any) {
    const event: TelemetryStreamEvent = {
      type: 'downlink',
      data: downlinkEvent,
      timestamp: new Date().toISOString(),
    };

    // Push to SSE Observable
    this.stream$.next(event);

    // Push to WebSocket Gateway
    try {
      this.gateway.broadcastDownlink(downlinkEvent);
    } catch (err: any) {
      this.logger.warn(`Failed to broadcast downlink via WebSocket: ${err.message}`);
    }
  }

  /**
   * Get Server-Sent Events (SSE) observable stream
   */
  getStream(): Observable<MessageEvent> {
    return this.stream$.asObservable().pipe(
      map(
        (event) =>
          ({
            data: event,
          }) as unknown as MessageEvent,
      ),
    );
  }
}
