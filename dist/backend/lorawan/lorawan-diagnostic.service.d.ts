import { SubsystemHealthStatus } from '../common/subsystem.types';
import { NetworkServersService } from '../../modules/network-servers/network-servers.service';
import { LorawanService } from '../../modules/lorawan/lorawan.service';
export declare class LorawanDiagnosticService {
    private readonly networkServersService;
    private readonly lorawanService;
    private readonly logger;
    constructor(networkServersService: NetworkServersService, lorawanService: LorawanService);
    checkHealth(): Promise<SubsystemHealthStatus>;
}
