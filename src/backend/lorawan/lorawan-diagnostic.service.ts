import { Injectable, Logger } from '@nestjs/common';
import { SubsystemHealthStatus, BackendSubsystem } from '../common/subsystem.types';
import { NetworkServersService } from '../../modules/network-servers/network-servers.service';
import { LorawanService } from '../../modules/lorawan/lorawan.service';

@Injectable()
export class LorawanDiagnosticService {
  private readonly logger = new Logger('LorawanSubsystem');

  constructor(
    private readonly networkServersService: NetworkServersService,
    private readonly lorawanService: LorawanService,
  ) {}

  async checkHealth(): Promise<SubsystemHealthStatus> {
    try {
      const servers = await this.networkServersService.findAll();
      const gateways = await this.lorawanService.listGateways();
      const devices = await this.lorawanService.listDevices();

      return {
        subsystem: BackendSubsystem.LORAWAN,
        status: 'UP',
        timestamp: new Date().toISOString(),
        details: {
          networkServersCount: servers.length,
          gatewaysCount: gateways.length,
          devicesCount: devices.length,
          subsystemScope: [
            'chirpstack / ttn connectors',
            'device activations (OTAA/ABP)',
            'downlink queue scheduler',
            'gateway packets',
            'payload decoders & webhooks',
          ],
        },
        error: null,
      };
    } catch (err: any) {
      this.logger.error(`LoRaWAN diagnostic failed: ${err.message}`, err.stack);
      return {
        subsystem: BackendSubsystem.LORAWAN,
        status: 'DEGRADED',
        timestamp: new Date().toISOString(),
        error: err.message,
      };
    }
  }
}
