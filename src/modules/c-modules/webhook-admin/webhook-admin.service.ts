import { Injectable, Logger, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { WebhookLogEntity } from './entities/webhook-log.entity';
import { LorawanService } from '../../lorawan/lorawan.service';

export interface CreateWebhookLogInput {
  serverType: string;
  devEUI: string;
  fPort?: number;
  fCnt?: number;
  payloadHex?: string;
  decodedData?: Record<string, any>;
  rawPayload?: Record<string, any>;
  status?: string;
  errorMessage?: string;
}

@Injectable()
export class WebhookAdminService {
  private readonly logger = new Logger(WebhookAdminService.name);
  private retentionLimit = 200; // Default: 200 packets per server

  constructor(
    private readonly dbService: DynamicDatabaseService,
    @Inject(forwardRef(() => LorawanService))
    private readonly lorawanService: LorawanService,
  ) {}

  private get logRepo() {
    return this.dbService.getRepositoryForTable('webhook_logs', WebhookLogEntity);
  }

  /**
   * Log an incoming webhook packet with automatic retention pruning
   */
  async logPacket(data: CreateWebhookLogInput): Promise<WebhookLogEntity> {
    const repo = this.logRepo;
    const serverType = (data.serverType || 'GENERIC').toUpperCase();
    const devEUI = (data.devEUI || 'UNKNOWN').trim().toUpperCase();

    const entity = repo.create({
      serverType,
      devEUI,
      fPort: Number(data.fPort) || 1,
      fCnt: Number(data.fCnt) || 0,
      payloadHex: (data.payloadHex || '').trim().toUpperCase(),
      decodedData: data.decodedData || null,
      rawPayload: data.rawPayload || null,
      status: data.status || (data.decodedData?.error ? 'ERROR' : 'SUCCESS'),
      errorMessage: data.errorMessage || (data.decodedData?.error ? String(data.decodedData.error) : null),
    });

    const saved = await repo.save(entity);

    // Run auto-pruning asynchronously so it doesn't block incoming webhook ingestion
    this.autoPruneOldLogs(serverType).catch((err) => {
      this.logger.warn(`Auto-prune error for ${serverType}: ${err.message}`);
    });

    return saved;
  }

  /**
   * Automatically delete oldest records if count exceeds retentionLimit for a server
   */
  async autoPruneOldLogs(serverType: string): Promise<number> {
    try {
      const repo = this.logRepo;
      const count = await repo.count({ where: { serverType } });
      if (count > this.retentionLimit) {
        const excess = count - this.retentionLimit;
        const oldestRecords = await repo.find({
          where: { serverType },
          order: { receivedAt: 'ASC' },
          take: excess,
          select: ['id'],
        });

        if (oldestRecords.length > 0) {
          const idsToDelete = oldestRecords.map((r) => r.id);
          await repo.delete(idsToDelete);
          this.logger.log(`🗑️ Auto-pruned ${idsToDelete.length} oldest webhook logs for [${serverType}] (Retention limit: ${this.retentionLimit})`);
          return idsToDelete.length;
        }
      }
    } catch (err: any) {
      this.logger.warn(`Failed to auto-prune logs for ${serverType}: ${err.message}`);
    }
    return 0;
  }

  /**
   * Query webhook packet logs with optional filters
   */
  async getLogs(query: {
    serverType?: string;
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const repo = this.logRepo;
    const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 500);
    const offset = Math.max(Number(query.offset) || 0, 0);

    const qb = repo.createQueryBuilder('log').orderBy('log.receivedAt', 'DESC');

    if (query.serverType && query.serverType.toUpperCase() !== 'ALL') {
      qb.andWhere('log.serverType = :serverType', { serverType: query.serverType.toUpperCase() });
    }

    if (query.status && query.status.toUpperCase() !== 'ALL') {
      qb.andWhere('log.status = :status', { status: query.status.toUpperCase() });
    }

    if (query.search && query.search.trim()) {
      const term = `%${query.search.trim()}%`;
      qb.andWhere('(log.devEUI ILIKE :term OR log.payloadHex ILIKE :term OR CAST(log.decodedData AS TEXT) ILIKE :term)', { term });
    }

    const [logs, total] = await qb.skip(offset).take(limit).getManyAndCount();

    // Fetch server counts
    const [chirpstackCount, thingparkCount, genericCount] = await Promise.all([
      repo.count({ where: { serverType: 'CHIRPSTACK' } }).catch(() => 0),
      repo.count({ where: { serverType: 'THINGPARK' } }).catch(() => 0),
      repo.count({ where: { serverType: 'GENERIC' } }).catch(() => 0),
    ]);

    return {
      logs,
      total,
      limit,
      offset,
      chirpstackCount,
      thingparkCount,
      genericCount,
      retentionLimit: this.retentionLimit,
    };
  }

  /**
   * Get overall webhook statistics
   */
  async getStats() {
    const repo = this.logRepo;
    const [totalCount, chirpstackCount, thingparkCount, genericCount, latestLog] = await Promise.all([
      repo.count().catch(() => 0),
      repo.count({ where: { serverType: 'CHIRPSTACK' } }).catch(() => 0),
      repo.count({ where: { serverType: 'THINGPARK' } }).catch(() => 0),
      repo.count({ where: { serverType: 'GENERIC' } }).catch(() => 0),
      repo.findOne({ order: { receivedAt: 'DESC' } }).catch(() => null),
    ]);

    return {
      totalCount,
      chirpstackCount,
      thingparkCount,
      genericCount,
      retentionLimit: this.retentionLimit,
      latestPacketAt: latestLog ? latestLog.receivedAt : null,
    };
  }

  /**
   * Clear logs (for a specific server or all)
   */
  async clearLogs(serverType?: string): Promise<{ success: boolean; deletedCount: number; message: string }> {
    const repo = this.logRepo;
    const target = serverType ? serverType.toUpperCase() : 'ALL';
    let deletedCount = 0;

    if (target === 'ALL' || !serverType) {
      const count = await repo.count();
      await repo.clear();
      deletedCount = count;
    } else {
      const count = await repo.count({ where: { serverType: target } });
      await repo.delete({ serverType: target });
      deletedCount = count;
    }

    this.logger.log(`🧹 Cleared ${deletedCount} webhook logs for target [${target}]`);
    return {
      success: true,
      deletedCount,
      message: `Cleared ${deletedCount} webhook logs for ${target}`,
    };
  }

  /**
   * Update retention limit and prune excess immediately
   */
  async setRetentionLimit(limit: number): Promise<{ success: boolean; retentionLimit: number; message: string }> {
    const num = Number(limit);
    if (isNaN(num) || num < 10 || num > 2000) {
      throw new BadRequestException('Retention limit must be an integer between 10 and 2000.');
    }
    this.retentionLimit = num;
    this.logger.log(`⚙️ Webhook retention limit set to ${this.retentionLimit} packets per server.`);

    // Immediately prune both servers
    await Promise.all([
      this.autoPruneOldLogs('CHIRPSTACK'),
      this.autoPruneOldLogs('THINGPARK'),
      this.autoPruneOldLogs('GENERIC'),
    ]);

    return {
      success: true,
      retentionLimit: this.retentionLimit,
      message: `Webhook log retention limit updated to ${this.retentionLimit} packets per server.`,
    };
  }

  /**
   * Simulate a packet from ChirpStack or ThingPark for live testing
   */
  async simulatePacket(dto: {
    serverType: 'CHIRPSTACK' | 'THINGPARK';
    devEUI: string;
    payloadHex: string;
    fPort?: number;
    fCnt?: number;
  }) {
    const serverType = (dto.serverType || 'CHIRPSTACK').toUpperCase();
    const devEUI = (dto.devEUI || '0018B20000000001').trim().toUpperCase();
    const payloadHex = (dto.payloadHex || '09C441').trim().toUpperCase();
    const fPort = Number(dto.fPort) || 1;
    const fCnt = Number(dto.fCnt) || Math.floor(Math.random() * 1000) + 1;

    let result: any;
    if (serverType === 'CHIRPSTACK') {
      const mockBody = {
        deduplicationId: 'sim-' + Date.now(),
        time: new Date().toISOString(),
        deviceInfo: {
          tenantId: 'simulated-tenant',
          tenantName: 'Daviteq Demo Tenant',
          applicationId: 'simulated-app',
          applicationName: 'Sensors Fleet',
          deviceProfileId: 'simulated-profile',
          deviceProfileName: 'LoRaWAN Class A Sensor',
          deviceName: 'Simulated Sensor ' + devEUI.slice(-4),
          devEui: devEUI,
        },
        devAddr: '00' + devEUI.slice(-6),
        adr: true,
        dr: 3,
        fCnt,
        fPort,
        data: Buffer.from(payloadHex, 'hex').toString('base64'),
        rxInfo: [
          {
            gatewayId: '0016c001f0000001',
            rssi: -65,
            snr: 9.5,
            channel: 2,
            location: { latitude: 10.762622, longitude: 106.660172 },
          },
        ],
        txInfo: {
          frequency: 923200000,
          modulation: { lora: { bandwidth: 125000, spreadingFactor: 7, codeRate: 'CR_4_5' } },
        },
      };
      result = await this.lorawanService.handleChirpstackWebhook(mockBody);
    } else {
      const mockBody = {
        DevEUI_uplink: {
          Time: new Date().toISOString(),
          DevEUI: devEUI,
          FPort: fPort,
          FCntUp: fCnt,
          ADRbit: 1,
          FCntDn: 1,
          payload_hex: payloadHex,
          mic_hex: 'abcd1234',
          Lrcid: '00000001',
          LrrRSSI: -68.0,
          LrrSNR: 8.5,
          SpFact: 7,
          SubBand: 'G1',
          Channel: 'LC3',
          DevLrrCnt: 1,
          Lrrid: '00000001',
          Late: 0,
        },
      };
      result = await this.lorawanService.handleThingparkWebhook(mockBody);
    }

    return {
      success: true,
      serverType,
      devEUI,
      payloadHex,
      fPort,
      fCnt,
      result,
      message: `Simulated ${serverType} packet successfully processed and logged!`,
    };
  }
}
