"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TestAutomationRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestAutomationRepository = void 0;
const common_1 = require("@nestjs/common");
const dynamic_database_service_1 = require("../../database/dynamic-database.service");
const test_session_entity_1 = require("./entities/test-session.entity");
const test_device_run_entity_1 = require("./entities/test-device-run.entity");
const test_packet_log_entity_1 = require("./entities/test-packet-log.entity");
const test_evidence_entity_1 = require("./entities/test-evidence.entity");
const test_template_entity_1 = require("../../c-modules/test-builder/entities/test-template.entity");
const item_code_entity_1 = require("../../c-modules/item-codes/entities/item-code.entity");
const sales_order_entity_1 = require("../../c-modules/sales-orders/entities/sales-order.entity");
const device_entity_1 = require("../../lorawan/entities/device.entity");
const telemetry_entity_1 = require("../../lorawan/entities/telemetry.entity");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let TestAutomationRepository = TestAutomationRepository_1 = class TestAutomationRepository {
    constructor(dbService) {
        this.dbService = dbService;
        this.logger = new common_1.Logger(TestAutomationRepository_1.name);
        this.memorySessions = new Map();
        this.memoryDeviceRuns = new Map();
        this.memoryPacketLogs = new Map();
        this.memoryEvidences = new Map();
    }
    getSessionRepo() {
        return this.dbService.getRepositoryForTable('test_sessions', test_session_entity_1.TestSessionEntity);
    }
    getDeviceRunRepo() {
        return this.dbService.getRepositoryForTable('test_device_runs', test_device_run_entity_1.TestDeviceRunEntity);
    }
    getPacketLogRepo() {
        return this.dbService.getRepositoryForTable('test_packet_logs', test_packet_log_entity_1.TestPacketLogEntity);
    }
    getTemplateRepo() {
        return this.dbService.getRepositoryForTable('test_templates', test_template_entity_1.TestTemplateEntity);
    }
    getItemCodeRepo() {
        return this.dbService.getRepositoryForTable('item_codes', item_code_entity_1.ItemCodeEntity);
    }
    getSalesOrderRepo() {
        return this.dbService.getRepositoryForTable('sales_orders', sales_order_entity_1.SalesOrderEntity);
    }
    getEvidenceRepo() {
        return this.dbService.getRepositoryForTable('test_evidence', test_evidence_entity_1.TestEvidenceEntity);
    }
    async findSessions(query) {
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
                qb.andWhere('(LOWER(ts.sessionCode) LIKE :kw OR LOWER(ts.soCode) LIKE :kw OR LOWER(ts.itemCode) LIKE :kw OR LOWER(ts.notes) LIKE :kw)', { kw: keyword });
            }
            const [items, total] = await qb.getManyAndCount();
            return {
                items,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            };
        }
        catch (err) {
            this.logger.debug(`Database query fallback for findSessions: ${err.message}`);
            let all = Array.from(this.memorySessions.values());
            if (query.soCode && query.soCode.trim()) {
                all = all.filter((s) => s.soCode.toLowerCase() === query.soCode.trim().toLowerCase());
            }
            if (query.itemCode && query.itemCode.trim()) {
                all = all.filter((s) => s.itemCode.toLowerCase() === query.itemCode.trim().toLowerCase());
            }
            if (query.status && query.status.trim() && query.status.toUpperCase() !== 'ALL') {
                all = all.filter((s) => s.status === query.status.trim().toUpperCase());
            }
            if (query.search && query.search.trim()) {
                const kw = query.search.trim().toLowerCase();
                all = all.filter((s) => s.sessionCode.toLowerCase().includes(kw) ||
                    s.soCode.toLowerCase().includes(kw) ||
                    s.itemCode.toLowerCase().includes(kw) ||
                    (s.notes && s.notes.toLowerCase().includes(kw)));
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
    async findSessionById(id) {
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
        }
        catch (err) {
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
    async findSessionByCode(sessionCode) {
        return this.findSessionById(sessionCode);
    }
    async saveSession(session) {
        try {
            const saved = await this.getSessionRepo().save(session);
            this.memorySessions.set(saved.id, saved);
            return saved;
        }
        catch (err) {
            this.logger.debug(`Database save fallback for saveSession: ${err.message}`);
            if (!session.id) {
                session.id = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            }
            session.updatedAt = new Date();
            if (!session.createdAt)
                session.createdAt = new Date();
            this.memorySessions.set(session.id, session);
            return session;
        }
    }
    async saveDeviceRun(run) {
        try {
            const saved = await this.getDeviceRunRepo().save(run);
            this.memoryDeviceRuns.set(saved.id, saved);
            return saved;
        }
        catch (err) {
            this.logger.debug(`Database save fallback for saveDeviceRun: ${err.message}`);
            if (!run.id) {
                run.id = `mem-run-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            }
            run.updatedAt = new Date();
            if (!run.createdAt)
                run.createdAt = new Date();
            this.memoryDeviceRuns.set(run.id, run);
            return run;
        }
    }
    async savePacketLog(log) {
        try {
            const saved = await this.getPacketLogRepo().save(log);
            const logs = this.memoryPacketLogs.get(log.deviceRunId) || [];
            logs.unshift(saved);
            this.memoryPacketLogs.set(log.deviceRunId, logs);
            return saved;
        }
        catch (err) {
            this.logger.debug(`Database save fallback for savePacketLog: ${err.message}`);
            if (!log.id) {
                log.id = `mem-log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            }
            if (!log.receivedAt)
                log.receivedAt = new Date();
            const logs = this.memoryPacketLogs.get(log.deviceRunId) || [];
            logs.unshift(log);
            this.memoryPacketLogs.set(log.deviceRunId, logs);
            return log;
        }
    }
    async findDeviceRunById(deviceRunId) {
        try {
            if (UUID_REGEX.test(deviceRunId)) {
                const run = await this.getDeviceRunRepo().findOne({
                    where: { id: deviceRunId },
                    relations: ['session', 'packetLogs'],
                });
                if (run)
                    return run;
            }
        }
        catch (err) {
            this.logger.debug(`Database fallback for findDeviceRunById: ${err.message}`);
        }
        const run = this.memoryDeviceRuns.get(deviceRunId);
        if (run) {
            run.packetLogs = this.memoryPacketLogs.get(run.id) || [];
            return run;
        }
        return null;
    }
    async findPacketLogs(deviceRunId, limit = 50) {
        try {
            if (UUID_REGEX.test(deviceRunId)) {
                return await this.getPacketLogRepo().find({
                    where: { deviceRunId },
                    order: { receivedAt: 'DESC' },
                    take: limit,
                });
            }
        }
        catch (err) {
            this.logger.debug(`Database fallback for findPacketLogs: ${err.message}`);
        }
        const logs = this.memoryPacketLogs.get(deviceRunId) || [];
        return logs.slice(0, limit);
    }
    async findActiveDeviceRunForDevEUI(devEUI, sessionId, filter) {
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
            }
            else {
                qb.andWhere('session.status IN (:...statuses)', {
                    statuses: ['IN_PROGRESS', 'PENDING'],
                });
            }
            if (filter?.soCode && filter.soCode.trim()) {
                qb.andWhere('LOWER(session.soCode) = LOWER(:soCode)', { soCode: filter.soCode.trim() });
            }
            if (filter?.itemCode && filter.itemCode.trim()) {
                qb.andWhere('LOWER(session.itemCode) = LOWER(:itemCode)', { itemCode: filter.itemCode.trim() });
            }
            qb.orderBy('session.createdAt', 'DESC');
            const run = await qb.getOne();
            if (run && run.session) {
                return { run, session: run.session };
            }
        }
        catch (err) {
            this.logger.debug(`Database fallback for findActiveDeviceRunForDevEUI: ${err.message}`);
        }
        for (const run of this.memoryDeviceRuns.values()) {
            if (run.devEUI.toUpperCase() === cleanEUI) {
                const session = this.memorySessions.get(run.sessionId);
                if (session) {
                    if (sessionId && session.id !== sessionId)
                        continue;
                    if (!sessionId && session.status !== 'IN_PROGRESS' && session.status !== 'PENDING')
                        continue;
                    if (filter?.soCode && filter.soCode.trim() && session.soCode.toLowerCase() !== filter.soCode.trim().toLowerCase())
                        continue;
                    if (filter?.itemCode && filter.itemCode.trim() && session.itemCode.toLowerCase() !== filter.itemCode.trim().toLowerCase())
                        continue;
                    return { run, session };
                }
            }
        }
        return null;
    }
    async findTemplateForSku(sku, firmwareVersion) {
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
            if (tpl)
                return tpl;
            return await this.getTemplateRepo().findOne({
                where: { sku: sku.trim(), isActive: true },
                relations: ['assertions'],
                order: { createdAt: 'DESC' },
            });
        }
        catch (err) {
            this.logger.debug(`Database fallback for findTemplateForSku: ${err.message}`);
            return null;
        }
    }
    async findItemCode(itemCode) {
        try {
            return await this.getItemCodeRepo().findOne({
                where: { itemCode: itemCode.trim() },
                relations: ['defaultTemplate'],
            });
        }
        catch (err) {
            this.logger.debug(`Database fallback for findItemCode: ${err.message}`);
            return null;
        }
    }
    async saveEvidence(evidence) {
        try {
            const saved = await this.getEvidenceRepo().save(evidence);
            this.memoryEvidences.set(saved.id, saved);
            return saved;
        }
        catch (err) {
            this.logger.debug(`Database save fallback for saveEvidence: ${err.message}`);
            if (!evidence.id) {
                evidence.id = `mem-ev-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            }
            if (!evidence.testedAt)
                evidence.testedAt = new Date();
            if (!evidence.createdAt)
                evidence.createdAt = new Date();
            evidence.updatedAt = new Date();
            this.memoryEvidences.set(evidence.id, evidence);
            return evidence;
        }
    }
    async findEvidences(query) {
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
                qb.andWhere('(UPPER(ev.devEUI) LIKE UPPER(:s) OR LOWER(ev.serialNumber) LIKE LOWER(:s) OR LOWER(ev.soCode) LIKE LOWER(:s) OR LOWER(ev.itemCode) LIKE LOWER(:s))', { s });
            }
            const [items, total] = await qb.getManyAndCount();
            return {
                items,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            };
        }
        catch (err) {
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
                list = list.filter((e) => e.devEUI?.toLowerCase().includes(s) ||
                    e.serialNumber?.toLowerCase().includes(s) ||
                    e.soCode?.toLowerCase().includes(s) ||
                    e.itemCode?.toLowerCase().includes(s));
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
    async findEvidenceById(id) {
        try {
            if (UUID_REGEX.test(id)) {
                const ev = await this.getEvidenceRepo().findOne({
                    where: { id },
                    relations: ['session', 'deviceRun'],
                });
                if (ev)
                    return ev;
            }
        }
        catch (err) {
            this.logger.debug(`Database fallback for findEvidenceById: ${err.message}`);
        }
        return this.memoryEvidences.get(id) || null;
    }
    async findDeviceTrace(devEUI) {
        const cleanEui = (devEUI || '').trim().toUpperCase();
        if (!cleanEui) {
            return { devEUI: '', isOnline: false, lastSeenAt: null, rssi: null, snr: null };
        }
        try {
            const deviceRepo = this.dbService.getRepositoryForTable('devices', device_entity_1.DeviceEntity);
            let device = await deviceRepo.findOne({
                where: { devEUI: cleanEui },
            });
            if (!device) {
                device = await deviceRepo.findOne({
                    where: { devEUI: cleanEui.toLowerCase() },
                });
            }
            const telemetryRepo = this.dbService.getRepositoryForTable('uplink_telemetry', telemetry_entity_1.TelemetryEntity);
            let latestTelemetry = await telemetryRepo.findOne({
                where: { devEui: cleanEui },
                order: { timestamp: 'DESC' },
            });
            if (!latestTelemetry) {
                latestTelemetry = await telemetryRepo.findOne({
                    where: { devEui: cleanEui.toLowerCase() },
                    order: { timestamp: 'DESC' },
                });
            }
            let lastSeenDate = null;
            if (latestTelemetry?.timestamp) {
                lastSeenDate = new Date(latestTelemetry.timestamp);
            }
            if (device?.lastSeenAt) {
                const dSeen = new Date(device.lastSeenAt);
                if (!lastSeenDate || dSeen.getTime() > lastSeenDate.getTime()) {
                    lastSeenDate = dSeen;
                }
            }
            if (device?.syncDetails?.lastSeenAt) {
                const dSeen = new Date(device.syncDetails.lastSeenAt);
                if (!isNaN(dSeen.getTime()) && (!lastSeenDate || dSeen.getTime() > lastSeenDate.getTime())) {
                    lastSeenDate = dSeen;
                }
            }
            let rssi = latestTelemetry?.rssi != null ? Number(latestTelemetry.rssi) : null;
            let snr = latestTelemetry?.snr != null ? Number(latestTelemetry.snr) : null;
            if (rssi == null && device?.syncDetails?.rssi != null) {
                rssi = Number(device.syncDetails.rssi);
            }
            if (snr == null && device?.syncDetails?.snr != null) {
                snr = Number(device.syncDetails.snr);
            }
            const memLogs = this.memoryPacketLogs.get(cleanEui) || this.memoryPacketLogs.get(cleanEui.toLowerCase()) || [];
            if (memLogs.length > 0) {
                const lastMem = memLogs[memLogs.length - 1];
                const memDate = lastMem.receivedAt ? new Date(lastMem.receivedAt) : new Date();
                if (!lastSeenDate || memDate.getTime() > lastSeenDate.getTime()) {
                    lastSeenDate = memDate;
                }
                if (rssi == null && lastMem.rssi != null)
                    rssi = Number(lastMem.rssi);
                if (snr == null && lastMem.snr != null)
                    snr = Number(lastMem.snr);
            }
            for (const run of this.memoryDeviceRuns.values()) {
                if ((run.devEUI || '').toUpperCase() === cleanEui) {
                    const runLogs = this.memoryPacketLogs.get(run.id) || [];
                    if (runLogs.length > 0) {
                        const first = runLogs[0];
                        const logDate = first.receivedAt ? new Date(first.receivedAt) : new Date();
                        if (!lastSeenDate || logDate.getTime() > lastSeenDate.getTime()) {
                            lastSeenDate = logDate;
                        }
                        if (rssi == null && first.rssi != null)
                            rssi = Number(first.rssi);
                        if (snr == null && first.snr != null)
                            snr = Number(first.snr);
                    }
                    else if (run.totalPackets > 0 || run.rssiAvg != null || run.snrAvg != null) {
                        const runDate = run.updatedAt ? new Date(run.updatedAt) : new Date();
                        if (!lastSeenDate || runDate.getTime() > lastSeenDate.getTime()) {
                            lastSeenDate = runDate;
                        }
                        if (rssi == null && run.rssiAvg != null)
                            rssi = Number(run.rssiAvg);
                        if (snr == null && run.snrAvg != null)
                            snr = Number(run.snrAvg);
                    }
                }
            }
            const now = Date.now();
            const lastSeenMs = lastSeenDate ? lastSeenDate.getTime() : 0;
            const isOnline = Boolean(device?.isActive !== false && lastSeenMs > 0 && (now - lastSeenMs) < (24 * 60 * 60 * 1000));
            return {
                devEUI: cleanEui,
                isOnline,
                lastSeenAt: lastSeenDate ? lastSeenDate.toISOString() : null,
                rssi,
                snr,
            };
        }
        catch (err) {
            this.logger.debug(`Database fallback for findDeviceTrace: ${err.message}`);
            for (const run of this.memoryDeviceRuns.values()) {
                if ((run.devEUI || '').toUpperCase() === cleanEui) {
                    const runLogs = this.memoryPacketLogs.get(run.id) || [];
                    if (runLogs.length > 0) {
                        const first = runLogs[0];
                        return {
                            devEUI: cleanEui,
                            isOnline: true,
                            lastSeenAt: first.receivedAt ? new Date(first.receivedAt).toISOString() : new Date().toISOString(),
                            rssi: first.rssi != null ? Number(first.rssi) : (run.rssiAvg != null ? Number(run.rssiAvg) : null),
                            snr: first.snr != null ? Number(first.snr) : (run.snrAvg != null ? Number(run.snrAvg) : null),
                        };
                    }
                    if (run.totalPackets > 0 || run.rssiAvg != null || run.snrAvg != null) {
                        return {
                            devEUI: cleanEui,
                            isOnline: true,
                            lastSeenAt: run.updatedAt ? new Date(run.updatedAt).toISOString() : new Date().toISOString(),
                            rssi: run.rssiAvg != null ? Number(run.rssiAvg) : null,
                            snr: run.snrAvg != null ? Number(run.snrAvg) : null,
                        };
                    }
                }
            }
            const logs = this.memoryPacketLogs.get(cleanEui) || this.memoryPacketLogs.get(cleanEui.toLowerCase()) || [];
            if (logs.length > 0) {
                const last = logs[0];
                return {
                    devEUI: cleanEui,
                    isOnline: true,
                    lastSeenAt: last.receivedAt ? new Date(last.receivedAt).toISOString() : new Date().toISOString(),
                    rssi: last.rssi != null ? Number(last.rssi) : null,
                    snr: last.snr != null ? Number(last.snr) : null,
                };
            }
            return {
                devEUI: cleanEui,
                isOnline: false,
                lastSeenAt: null,
                rssi: null,
                snr: null,
            };
        }
    }
    async findBatchDeviceTrace(devEUIs) {
        const list = Array.isArray(devEUIs) ? devEUIs : [];
        return await Promise.all(list.map((eui) => this.findDeviceTrace(eui)));
    }
};
exports.TestAutomationRepository = TestAutomationRepository;
exports.TestAutomationRepository = TestAutomationRepository = TestAutomationRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dynamic_database_service_1.DynamicDatabaseService])
], TestAutomationRepository);
//# sourceMappingURL=test-automation.repository.js.map