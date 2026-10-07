import { Observable } from 'rxjs';
import { RealtimeGateway } from './realtime.gateway';
export interface TelemetryStreamEvent {
    type: 'telemetry' | 'downlink' | 'ping';
    data: any;
    timestamp: string;
}
export declare class RealtimeService {
    private readonly gateway;
    private readonly logger;
    private readonly stream$;
    constructor(gateway: RealtimeGateway);
    publishTelemetry(telemetry: any): void;
    publishDownlink(downlinkEvent: any): void;
    getStream(): Observable<MessageEvent>;
}
