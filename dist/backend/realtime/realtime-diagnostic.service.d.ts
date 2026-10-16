import { SubsystemHealthStatus } from '../common/subsystem.types';
import { RealtimeGateway } from './modules/realtime/realtime.gateway';
export declare class RealtimeDiagnosticService {
    private readonly realtimeGateway;
    private readonly logger;
    constructor(realtimeGateway: RealtimeGateway);
    checkHealth(): Promise<SubsystemHealthStatus>;
}
