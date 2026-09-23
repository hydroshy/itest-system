import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { TestSessionEntity, TestSessionStatus } from './entities/test-session.entity';
import { TestDeviceRunEntity, TestDeviceStatus } from './entities/test-device-run.entity';
import { TestPacketLogEntity } from './entities/test-packet-log.entity';
import { TestEvidenceEntity } from './entities/test-evidence.entity';
import { TestTemplateEntity } from '../../c-modules/test-builder/entities/test-template.entity';
import { ItemCodeEntity } from '../../c-modules/item-codes/entities/item-code.entity';
import { SalesOrderEntity } from '../../c-modules/sales-orders/entities/sales-order.entity';
import { QueryTestSessionDto } from './dto/query-test-session.dto';
import { QueryTestEvidenceDto } from './dto/query-test-evidence.dto';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class TestAutomationRepository {
  private readonly logger = new Logger(TestAutomationRepository.name);

  // In-memory fallback if database tables are not present in ephemeral testing
  private memorySessions = new Map<string, TestSessionEntity>();
  private memoryDeviceRuns = new Map<string, TestDeviceRunEntity>();
  private memoryPacketLogs = new Map<string, TestPacketLogEntity[]>();
  private memoryEvidences = new Map<string, TestEvidenceEntity>();

  constructor(private readonly dbService: DynamicDatabaseService) {}

  public getSessionRepo(): Repository<TestSessionEntity> {
    return this.dbService.getRepositoryForTable('test_sessions', TestSessionEntity);
  }

  public getDeviceRunRepo(): Repository<TestDeviceRunEntity> {
    return this.dbService.getRepositoryForTable('test_device_runs', TestDeviceRunEntity);
  }

  public getPacketLogRepo(): Repository<TestPacketLogEntity> {
    return this.dbService.getRepositoryForTable('test_packet_logs', TestPacketLogEntity);
  }

  public getTemplateRepo(): Repository<TestTemplateEntity> {
    return this.dbService.getRepositoryForTable('test_templates', TestTemplateEntity);
  }

  public getItemCodeRepo(): Repository<ItemCodeEntity> {
    return this.dbService.getRepositoryForTable('item_codes', ItemCodeEntity);
  }

  public getSalesOrderRepo(): Repository<SalesOrderEntity> {
    return this.dbService.getRepositoryForTable('sales_orders', SalesOrderEntity);
  }

  public getEvidenceRepo(): Repository<TestEvidenceEntity> {
    return this.dbService.getRepositoryForTable('test_evidence', TestEvidenceEntity);
  }

  public async findSessions(query: QueryTestSessionDto): Promise<{
    items: TestSessionEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    try {
      const qb = this.getSessionRepo()
        .createQueryBuilder('ts')
        .leftJoinAndSelect('ts.template', 'template')
        .leftJoinAndSelect('ts.deviceRuns', 'deviceRuns')
        .orderBy('ts.createdAt', 'DESC')
        .skip(skip)
        .take(limit);

      if (query.soCode && query.soCode.trim()) {
        qb.andWhere('LOWER(ts.soCode) = LOWER(:soCode)', { soCode: query.soCode.trim() });
      }

      if (query.itemCode && query.itemCode.trim()) {
        qb.andWhere('LOWER(ts.itemCode) = LOWER(:itemCode)', { itemCode: query.itemCode.trim() });
      }

      if (query.status && query.status.trim() && query.status.toUpperCase() !== 'ALL') {
        qb.andWhere('ts.status = :status', { status: query.status.trim().toUpperCase() });
      }

      if (query.search && query.search.trim()) {
        const keyword = `%${query.search.trim().toLowerCase()}%`;
        qb.andWhere(
          '(LOWER(ts.sessionCode) LIKE :kw OR LOWER(ts.soCode) LIKE :kw OR LOWER(ts.itemCode) LIKE :kw OR LOWER(ts.notes) LIKE :kw)',
          { kw: keyword },
        );
      }

      const [items, total] = await qb.getManyAndCount();
      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch (err: any) {
      this.logger.debug(`Database query fallback for findSessions: ${err.message}`);
      let all = Array.from(this.memorySessions.values());

      if (query.soCode && query.soCode.trim()) {
        all = all.filter((s) => s.soCode.toLowerCase() === query.soCode!.trim().toLowerCase());
      }
      if (query.itemCode && query.itemCode.trim()) {
        all = all.filter((s) => s.itemCode.toLowerCase() === query.itemCode!.trim().toLowerCase());
      }
      if (query.status && query.status.trim() && query.status.toUpperCase() !== 'ALL') {
        all = all.filter((s) => s.status === query.status!.trim().toUpperCase());
      }
      if (query.search && query.search.trim()) {
        const kw = query.search.trim().toLowerCase();
        all = all.filter(
          (s) =>
            s.sessionCode.toLowerCase().includes(kw) ||
            s.soCode.toLowerCase().includes(kw) ||
            s.itemCode.toLowerCase().includes(kw) ||
            (s.notes && s.notes.toLowerCase().includes(kw)),
        );
      }

      all.sort((a, b) => (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));

      const total = all.length;
      const items = all.slice(skip, skip + limit);
      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    }
  }

  public async findSessionById(id: string): Promise<TestSessionEntity | null> {
    try {
      if (UUID_REGEX.test(id)) {
        const session = await this.getSessionRepo()
          .createQueryBuilder('ts')
          .leftJoinAndSelect('ts.template', 'template')
          .leftJoinAndSelect('template.assertions', 'assertions')
          .leftJoinAndSelect('ts.deviceRuns', 'deviceRuns')
          .where('ts.id = :id', { id })
          .getOne();

        if (session) {
          if (session.deviceRuns) {
            session.deviceRuns.sort((a, b) => a.devEUI.localeCompare(b.devEUI));
          }
          return session;
        }
      }

      // Try by sessionCode
      const byCode = await this.getSessionRepo()
        .createQueryBuilder('ts')
        .leftJoinAndSelect('ts.template', 'template')
        .leftJoinAndSelect('template.assertions', 'assertions')
        .leftJoinAndSelect('ts.deviceRuns', 'deviceRuns')
        .where('ts.sessionCode = :code', { code: id.trim() })
        .getOne();

      if (byCode) {
        if (byCode.deviceRuns) {
          byCode.deviceRuns.sort((a, b) => a.devEUI.localeCompare(b.devEUI));
        }
        return byCode;
      }
    } catch (err: any) {
      this.logger.debug(`Database fallback for findSessionById: ${err.message}`);
    }

    const mem = this.memorySessions.get(id) || Array.from(this.memorySessions.values()).find((s) => s.sessionCode === id);
    if (mem) {
      const runs = Array.from(this.memoryDeviceRuns.values()).filter((r) => r.sessionId === mem.id);
      mem.deviceRuns = runs;
      return mem;
    }
    return null;
  }

  public async findSessionByCode(sessionCode: string): Promise<TestSessionEntity | null> {
    return this.findSessionById(sessionCode);
  }

  public async saveSession(session: TestSessionEntity): Promise<TestSessionEntity> {
    try {
      const saved = await this.getSessionRepo().save(session);
      this.memorySessions.set(saved.id, saved);
      return saved;
    } catch (err: any) {
      this.logger.debug(`Database save fallback for saveSession: ${err.message}`);
      if (!session.id) {
        session.id = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      }
      session.updatedAt = new Date();
      if (!session.createdAt) session.createdAt = new Date();
      this.memorySessions.set(session.id, session);
      return session;
    }
  }

  public async saveDeviceRun(run: TestDeviceRunEntity): Promise<TestDeviceRunEntity> {
    try {
      const saved = await this.getDeviceRunRepo().save(run);
      this.memoryDeviceRuns.set(saved.id, saved);
      return saved;
    } catch (err: any) {
      this.logger.debug(`Database save fallback for saveDeviceRun: ${err.message}`);
      if (!run.id) {
        run.id = `mem-run-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      }
      run.updatedAt = new Date();
      if (!run.createdAt) run.createdAt = new Date();
      this.memoryDeviceRuns.set(run.id, run);
      return run;
    }
  }

  public async savePacketLog(log: TestPacketLogEntity): Promise<TestPacketLogEntity> {
    try {
      const saved = await this.getPacketLogRepo().save(log);
      const logs = this.memoryPacketLogs.get(log.deviceRunId) || [];
      logs.unshift(saved);
      this.memoryPacketLogs.set(log.deviceRunId, logs);
      return saved;
    } catch (err: any) {
      this.logger.debug(`Database save fallback for savePacketLog: ${err.message}`);
      if (!log.id) {
        log.id = `mem-log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      }
      if (!log.receivedAt) log.receivedAt = new Date();
      const logs = this.memoryPacketLogs.get(log.deviceRunId) || [];
      logs.unshift(log);
      this.memoryPacketLogs.set(log.deviceRunId, logs);
      return log;
    }
  }

  public async findDeviceRunById(deviceRunId: string): Promise<TestDeviceRunEntity | null> {
    try {
      if (UUID_REGEX.test(deviceRunId)) {
        const run = await this.getDeviceRunRepo().findOne({
          where: { id: deviceRunId },
          relations: ['session', 'packetLogs'],
        });
        if (run) return run;
      }
    } catch (err: any) {
      this.logger.debug(`Database fallback for findDeviceRunById: ${err.message}`);
    }

    const run = this.memoryDeviceRuns.get(deviceRunId);
    if (run) {
      run.packetLogs = this.memoryPacketLogs.get(run.id) || [];
      return run;
    }
    return null;
  }

  public async findPacketLogs(deviceRunId: string, limit = 50): Promise<TestPacketLogEntity[]> {
    try {
      if (UUID_REGEX.test(deviceRunId)) {
        return await this.getPacketLogRepo().find({
          where: { deviceRunId },
          order: { receivedAt: 'DESC' },
          take: limit,
        });
      }
    } catch (err: any) {
      this.logger.debug(`Database fallback for findPacketLogs: ${err.message}`);
    }

    const logs = this.memoryPacketLogs.get(deviceRunId) || [];
    return logs.slice(0, limit);
  }

  public async findActiveDeviceRunForDevEUI(
    devEUI: string,
    sessionId?: string,
  ): Promise<{ run: TestDeviceRunEntity; session: TestSessionEntity } | null> {
    const cleanEUI = devEUI.trim().toUpperCase();

    try {
      const qb = this.getDeviceRunRepo()
        .createQueryBuilder('run')
        .innerJoinAndSelect('run.session', 'session')
        .leftJoinAndSelect('session.template', 'template')
        .leftJoinAndSelect('template.assertions', 'assertions')
        .where('UPPER(run.devEUI) = :eui', { eui: cleanEUI });

      if (sessionId) {
        qb.andWhere('run.sessionId = :sessionId', { sessionId });
      } else {
        qb.andWhere('session.status IN (:...statuses)', {
          statuses: ['IN_PROGRESS', 'PENDING'],
        });
      }

      qb.orderBy('session.createdAt', 'DESC');
      const run = await qb.getOne();
      if (run && run.session) {
        return { run, session: run.session };
      }
    } catch (err: any) {
      this.logger.debug(`Database fallback for findActiveDeviceRunForDevEUI: ${err.message}`);
    }

    // Memory fallback
    for (const run of this.memoryDeviceRuns.values()) {
      if (run.devEUI.toUpperCase() === cleanEUI) {
        const session = this.memorySessions.get(run.sessionId);
        if (session) {
          if (sessionId && session.id !== sessionId) continue;
          if (!sessionId && session.status !== 'IN_PROGRESS' && session.status !== 'PENDING') continue;
          return { run, session };
        }
      }
    }

    return null;
  }

  public async findTemplateForSku(
    sku: string,
    firmwareVersion?: string,
  ): Promise<TestTemplateEntity | null> {
    try {
      const qb = this.getTemplateRepo()
        .createQueryBuilder('t')
        .leftJoinAndSelect('t.assertions', 'assertions')
        .where('LOWER(t.sku) = LOWER(:sku)', { sku: sku.trim() })
        .andWhere('t.isActive = true');

      if (firmwareVersion && firmwareVersion.trim()) {
        qb.andWhere('LOWER(t.firmwareVersion) = LOWER(:fw)', {
          fw: firmwareVersion.trim(),
        });
      }

      qb.orderBy('t.createdAt', 'DESC');
      const tpl = await qb.getOne();
      if (tpl) return tpl;

      // Fallback: SKU only
      return await this.getTemplateRepo().findOne({
        where: { sku: sku.trim(), isActive: true },
        relations: ['assertions'],
        order: { createdAt: 'DESC' },
      });
    } catch (err: any) {
      this.logger.debug(`Database fallback for findTemplateForSku: ${err.message}`);
      return null;
    }
  }

  public async findItemCode(itemCode: string): Promise<ItemCodeEntity | null> {
    try {
      return await this.getItemCodeRepo().findOne({
        where: { itemCode: itemCode.trim() },
        relations: ['defaultTemplate'],
      });
    } catch (err: any) {
      this.logger.debug(`Database fallback for findItemCode: ${err.message}`);
      return null;
    }
  }

  public async saveEvidence(evidence: TestEvidenceEntity): Promise<TestEvidenceEntity> {
    try {
      const saved = await this.getEvidenceRepo().save(evidence);
      this.memoryEvidences.set(saved.id, saved);
      return saved;
    } catch (err: any) {
      this.logger.debug(`Database save fallback for saveEvidence: ${err.message}`);
      if (!evidence.id) {
        evidence.id = `mem-ev-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      }
      if (!evidence.testedAt) evidence.testedAt = new Date();
      if (!evidence.createdAt) evidence.createdAt = new Date();
      evidence.updatedAt = new Date();
      this.memoryEvidences.set(evidence.id, evidence);
      return evidence;
    }
  }

  public async findEvidences(query: QueryTestEvidenceDto): Promise<{
    items: TestEvidenceEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    try {
      const qb = this.getEvidenceRepo()
        .createQueryBuilder('ev')
        .leftJoinAndSelect('ev.session', 'session')
        .orderBy('ev.testedAt', 'DESC')
        .skip(skip)
        .take(limit);

      if (query.soCode && query.soCode.trim()) {
        qb.andWhere('LOWER(ev.soCode) = LOWER(:soCode)', { soCode: query.soCode.trim() });
      }

      if (query.itemCode && query.itemCode.trim()) {
        qb.andWhere('LOWER(ev.itemCode) = LOWER(:itemCode)', { itemCode: query.itemCode.trim() });
      }

      if (query.devEUI && query.devEUI.trim()) {
        qb.andWhere('UPPER(ev.devEUI) = UPPER(:devEUI)', { devEUI: query.devEUI.trim() });
      }

      if (query.serialNumber && query.serialNumber.trim()) {
        qb.andWhere('LOWER(ev.serialNumber) LIKE LOWER(:serial)', {
          serial: `%${query.serialNumber.trim()}%`,
        });
      }

      if (query.sku && query.sku.trim()) {
        qb.andWhere('LOWER(ev.sku) = LOWER(:sku)', { sku: query.sku.trim() });
      }

      if (query.verdict && query.verdict.trim() && query.verdict.toUpperCase() !== 'ALL') {
        qb.andWhere('UPPER(ev.verdict) = UPPER(:verdict)', { verdict: query.verdict.trim() });
      }

      if (query.sessionId && query.sessionId.trim() && UUID_REGEX.test(query.sessionId.trim())) {
        qb.andWhere('ev.sessionId = :sessionId', { sessionId: query.sessionId.trim() });
      }

      if (query.search && query.search.trim()) {
        const s = `%${query.search.trim()}%`;
        qb.andWhere(
          '(UPPER(ev.devEUI) LIKE UPPER(:s) OR LOWER(ev.serialNumber) LIKE LOWER(:s) OR LOWER(ev.soCode) LIKE LOWER(:s) OR LOWER(ev.itemCode) LIKE LOWER(:s))',
          { s },
        );
      }

      const [items, total] = await qb.getManyAndCount();
      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch (err: any) {
      this.logger.debug(`Database fallback for findEvidences: ${err.message}`);
      let list = Array.from(this.memoryEvidences.values());

      if (query.soCode && query.soCode.trim()) {
        const sc = query.soCode.trim().toLowerCase();
        list = list.filter((e) => e.soCode?.toLowerCase() === sc);
      }
      if (query.itemCode && query.itemCode.trim()) {
        const ic = query.itemCode.trim().toLowerCase();
        list = list.filter((e) => e.itemCode?.toLowerCase() === ic);
      }
      if (query.devEUI && query.devEUI.trim()) {
        const eui = query.devEUI.trim().toUpperCase();
        list = list.filter((e) => e.devEUI?.toUpperCase() === eui);
      }
      if (query.serialNumber && query.serialNumber.trim()) {
        const sn = query.serialNumber.trim().toLowerCase();
        list = list.filter((e) => e.serialNumber?.toLowerCase().includes(sn));
      }
      if (query.verdict && query.verdict.trim() && query.verdict.toUpperCase() !== 'ALL') {
        const v = query.verdict.trim().toUpperCase();
        list = list.filter((e) => e.verdict?.toUpperCase() === v);
      }
      if (query.sessionId && query.sessionId.trim()) {
        list = list.filter((e) => e.sessionId === query.sessionId?.trim());
      }
      if (query.search && query.search.trim()) {
        const s = query.search.trim().toLowerCase();
        list = list.filter(
          (e) =>
            e.devEUI?.toLowerCase().includes(s) ||
            e.serialNumber?.toLowerCase().includes(s) ||
            e.soCode?.toLowerCase().includes(s) ||
            e.itemCode?.toLowerCase().includes(s),
        );
      }

      list.sort((a, b) => new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime());
      const total = list.length;
      const items = list.slice(skip, skip + limit);
      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    }
  }

  public async findEvidenceById(id: string): Promise<TestEvidenceEntity | null> {
    try {
      if (UUID_REGEX.test(id)) {
        const ev = await this.getEvidenceRepo().findOne({
          where: { id },
          relations: ['session', 'deviceRun'],
        });
        if (ev) return ev;
      }
    } catch (err: any) {
      this.logger.debug(`Database fallback for findEvidenceById: ${err.message}`);
    }
    return this.memoryEvidences.get(id) || null;
  }
}
