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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TestAutomationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestAutomationService = void 0;
const common_1 = require("@nestjs/common");
const test_automation_repository_1 = require("./test-automation.repository");
const test_session_entity_1 = require("./entities/test-session.entity");
const test_device_run_entity_1 = require("./entities/test-device-run.entity");
const test_packet_log_entity_1 = require("./entities/test-packet-log.entity");
const test_evidence_entity_1 = require("./entities/test-evidence.entity");
const realtime_gateway_1 = require("../../realtime/realtime.gateway");
const realtime_service_1 = require("../../realtime/realtime.service");
const lorawan_utils_1 = require("../../lorawan/common/lorawan-utils");
const sandbox_assertion_service_1 = require("./sandbox-assertion.service");
const memmap_upload_service_1 = require("../../c-modules/memmap-upload/memmap-upload.service");
let TestAutomationService = TestAutomationService_1 = class TestAutomationService {
    constructor(repository, realtimeGateway, realtimeService, sandboxAssertionService, memmapUploadService) {
        this.repository = repository;
        this.realtimeGateway = realtimeGateway;
        this.realtimeService = realtimeService;
        this.sandboxAssertionService = sandboxAssertionService;
        this.memmapUploadService = memmapUploadService;
        this.logger = new common_1.Logger(TestAutomationService_1.name);
        if (!this.sandboxAssertionService) {
            this.sandboxAssertionService = new sandbox_assertion_service_1.SandboxAssertionService();
        }
    }
    onModuleInit() {
        if (this.realtimeService) {
            this.telemetrySub = this.realtimeService.getStream().subscribe((msg) => {
                try {
                    const raw = msg?.data ?? msg;
                    const evt = raw?.type === 'telemetry'
                        ? raw
                        : raw?.data?.type === 'telemetry'
                            ? raw.data
                            : null;
                    if (evt && evt.type === 'telemetry' && evt.data) {
                        this.handleLiveUplinkTelemetry(evt.data);
                    }
                }
                catch (err) {
                    this.logger.debug(`Error handling live uplink stream in test automation: ${err.message}`);
                }
            });
        }
    }
    onModuleDestroy() {
        if (this.telemetrySub) {
            this.telemetrySub.unsubscribe();
            this.telemetrySub = undefined;
            this.logger.log('Cleaned up realtime telemetry subscription in TestAutomationService');
        }
    }
    async handleLiveUplinkTelemetry(telemetry) {
        const rawDev = telemetry.devEUI || telemetry.devEui;
        if (!rawDev)
            return;
        const cleanEUI = (0, lorawan_utils_1.cleanDevEUI)(rawDev);
        if (!cleanEUI)
            return;
        const match = await this.repository.findActiveDeviceRunForDevEUI(cleanEUI);
        if (!match || match.run.status !== 'RUNNING')
            return;
        this.logger.log(`Live telemetry matched active test device [${cleanEUI}] in session [${match.session.sessionCode}]`);
        const rawHex = telemetry.payloadHex || telemetry.payload || telemetry.dataHex || '00';
        const cleanHex = (0, lorawan_utils_1.cleanHexPayload)(rawHex) || '00';
        try {
            await this.processPacket({
                devEUI: cleanEUI,
                payloadHex: cleanHex,
                fPort: Number(telemetry.fPort) || 1,
                fCnt: Number(telemetry.fCnt) || (match.run.totalPackets || 0) + 1,
                rssi: telemetry.rssi != null ? Number(telemetry.rssi) : -75,
                snr: telemetry.snr != null ? Number(telemetry.snr) : 9.5,
                gatewayId: telemetry.gatewayId || 'LNS-LIVE',
            });
        }
        catch (e) {
            this.logger.warn(`Failed to process live test packet for [${cleanEUI}]: ${e.message}`);
        }
    }
    parseAndValidateDevEUIs(input) {
        let rawList = [];
        if (Array.isArray(input)) {
            rawList = input;
        }
        else if (typeof input === 'string') {
            rawList = input.split(/[\r\n,;]+/).map((s) => s.trim()).filter(Boolean);
        }
        const cleanedSet = new Set();
        for (const raw of rawList) {
            const cleaned = (0, lorawan_utils_1.cleanDevEUI)(raw);
            if (cleaned && /^[0-9A-F]{16}$/i.test(cleaned)) {
                cleanedSet.add(cleaned.toUpperCase());
            }
        }
        return Array.from(cleanedSet);
    }
    async createSession(dto, operatorId = 'qa-operator') {
        const devEUIs = this.parseAndValidateDevEUIs(dto.devEUIs);
        if (devEUIs.length === 0) {
            throw new common_1.BadRequestException('At least one valid 16-hex-character DevEUI is required');
        }
        const soCode = dto.soCode.trim();
        const itemCode = dto.itemCode.trim();
        const dateStr = new Date().toISOString().substring(0, 10).replace(/-/g, '');
        const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const sessionCode = dto.sessionCode?.trim() || `TS-${dateStr}-${randStr}`;
        let templateId = dto.templateId;
        let resolvedSku = dto.sku?.trim() || 'GENERIC-LORA';
        let resolvedFw = dto.firmwareVersion?.trim() || '1.0';
        const itemMaster = await this.repository.findItemCode(itemCode);
        if (itemMaster) {
            resolvedSku = dto.sku?.trim() || itemMaster.sku || resolvedSku;
            resolvedFw = dto.firmwareVersion?.trim() || itemMaster.firmwareVersion || resolvedFw;
            if (!templateId && itemMaster.defaultTemplateId) {
                templateId = itemMaster.defaultTemplateId;
            }
        }
        if (!templateId) {
            const matchedTemplate = await this.repository.findTemplateForSku(resolvedSku, resolvedFw);
            if (matchedTemplate) {
                templateId = matchedTemplate.id;
            }
        }
        const isAutoStart = !!dto.autoStart;
        const initialSessionStatus = isAutoStart ? 'IN_PROGRESS' : 'PENDING';
        const initialDeviceStatus = isAutoStart ? 'RUNNING' : 'WAITING';
        const session = new test_session_entity_1.TestSessionEntity();
        session.sessionCode = sessionCode;
        session.soCode = soCode;
        session.itemCode = itemCode;
        session.templateId = templateId;
        session.totalDevices = devEUIs.length;
        session.passedDevices = 0;
        session.failedDevices = 0;
        session.status = initialSessionStatus;
        session.startTime = isAutoStart ? new Date() : undefined;
        session.operatorId = operatorId;
        session.notes = dto.notes?.trim();
        session.metadata = {
            sku: resolvedSku,
            firmwareVersion: resolvedFw,
            ...(dto.metadata || {}),
        };
        const savedSession = await this.repository.saveSession(session);
        const runs = [];
        for (const eui of devEUIs) {
            const run = new test_device_run_entity_1.TestDeviceRunEntity();
            run.sessionId = savedSession.id;
            run.devEUI = eui;
            run.sku = resolvedSku;
            run.firmwareVersion = resolvedFw;
            run.status = initialDeviceStatus;
            run.totalPackets = 0;
            run.passedAssertions = 0;
            run.failedAssertions = 0;
            run.startedAt = isAutoStart ? new Date() : undefined;
            const savedRun = await this.repository.saveDeviceRun(run);
            runs.push(savedRun);
        }
        savedSession.deviceRuns = runs;
        this.logger.log(`Created Test Session [${savedSession.sessionCode}] with ${runs.length} devices (Status: ${savedSession.status})`);
        this.broadcastEvent('test_session:created', {
            session: this.serializeSession(savedSession),
        });
        return savedSession;
    }
    async getSessions(query) {
        return await this.repository.findSessions(query);
    }
    async getSessionById(id) {
        const session = await this.repository.findSessionById(id);
        if (!session) {
            throw new common_1.NotFoundException(`Test Session [${id}] not found`);
        }
        return session;
    }
    async startSession(id) {
        const session = await this.getSessionById(id);
        if (session.status === 'COMPLETED') {
            throw new common_1.BadRequestException(`Test Session [${session.sessionCode}] is already COMPLETED`);
        }
        session.status = 'IN_PROGRESS';
        if (!session.startTime) {
            session.startTime = new Date();
        }
        await this.repository.saveSession(session);
        if (session.deviceRuns) {
            for (const run of session.deviceRuns) {
                if (run.status === 'WAITING') {
                    run.status = 'RUNNING';
                    run.startedAt = new Date();
                    await this.repository.saveDeviceRun(run);
                }
            }
        }
        this.logger.log(`Started Test Session [${session.sessionCode}]`);
        this.broadcastEvent('test_session:status_changed', {
            sessionId: session.id,
            sessionCode: session.sessionCode,
            status: session.status,
            startTime: session.startTime,
        });
        return session;
    }
    async abortSession(id, reason) {
        const session = await this.getSessionById(id);
        session.status = 'ABORTED';
        session.endTime = new Date();
        session.notes = session.notes ? `${session.notes} | Aborted: ${reason || 'Operator request'}` : `Aborted: ${reason || 'Operator request'}`;
        await this.repository.saveSession(session);
        if (session.deviceRuns) {
            for (const run of session.deviceRuns) {
                if (run.status === 'RUNNING' || run.status === 'WAITING') {
                    run.status = 'SKIPPED';
                    run.failureReason = reason || 'Session aborted by operator';
                    await this.repository.saveDeviceRun(run);
                }
            }
        }
        this.logger.log(`Aborted Test Session [${session.sessionCode}]`);
        this.broadcastEvent('test_session:status_changed', {
            sessionId: session.id,
            sessionCode: session.sessionCode,
            status: session.status,
            endTime: session.endTime,
        });
        return session;
    }
    async completeSession(id) {
        const session = await this.getSessionById(id);
        if (session.status === 'COMPLETED') {
            return session;
        }
        session.status = 'COMPLETED';
        session.endTime = new Date();
        const minPackets = session.template?.minPacketsRequired || 1;
        let passed = 0;
        let failed = 0;
        if (session.deviceRuns) {
            for (const run of session.deviceRuns) {
                if (run.status === 'RUNNING' || run.status === 'WAITING') {
                    if ((run.totalPackets || 0) >= minPackets && (run.failedAssertions || 0) === 0) {
                        run.status = 'PASSED';
                    }
                    else {
                        run.status = 'TIMEOUT';
                        run.failureReason = `Test duration expired (received ${run.totalPackets || 0}/${minPackets} required valid packets)`;
                    }
                    run.completedAt = new Date();
                    await this.repository.saveDeviceRun(run);
                }
                if (run.status === 'PASSED')
                    passed++;
                else
                    failed++;
            }
        }
        session.passedDevices = passed;
        session.failedDevices = failed;
        session.totalDevices = session.deviceRuns?.length || 0;
        await this.repository.saveSession(session);
        this.logger.log(`Completed Test Session [${session.sessionCode}]: ${passed} PASSED, ${failed} FAILED`);
        this.broadcastEvent('test_session:status_changed', {
            sessionId: session.id,
            sessionCode: session.sessionCode,
            status: session.status,
            endTime: session.endTime,
            passedDevices: session.passedDevices,
            failedDevices: session.failedDevices,
        });
        this.broadcastEvent('test_session:completed', {
            sessionId: session.id,
            sessionCode: session.sessionCode,
            status: session.status,
            endTime: session.endTime,
            passedDevices: session.passedDevices,
            failedDevices: session.failedDevices,
            totalDevices: session.totalDevices,
        });
        return session;
    }
    async retryDeviceRun(deviceRunId) {
        const run = await this.repository.findDeviceRunById(deviceRunId);
        if (!run) {
            throw new common_1.NotFoundException(`Device Run [${deviceRunId}] not found`);
        }
        run.status = 'RUNNING';
        run.totalPackets = 0;
        run.passedAssertions = 0;
        run.failedAssertions = 0;
        run.failureReason = undefined;
        run.completedAt = undefined;
        run.startedAt = new Date();
        run.summaryReport = {};
        const savedRun = await this.repository.saveDeviceRun(run);
        await this.recalculateSessionMetrics(run.sessionId);
        this.broadcastEvent('test_device:status_changed', {
            deviceRunId: run.id,
            sessionId: run.sessionId,
            devEUI: run.devEUI,
            status: run.status,
        });
        return savedRun;
    }
    async getDeviceRunLogs(deviceRunId) {
        return await this.repository.findPacketLogs(deviceRunId);
    }
    async processPacket(dto) {
        const cleanEUI = (0, lorawan_utils_1.cleanDevEUI)(dto.devEUI);
        const cleanHex = (0, lorawan_utils_1.cleanHexPayload)(dto.payloadHex);
        if (!(0, lorawan_utils_1.isValidHex)(cleanHex)) {
            throw new common_1.BadRequestException(`Invalid Hex payload: '${dto.payloadHex}'`);
        }
        const filter = {
            soCode: dto.soCode,
            itemCode: dto.itemCode,
        };
        const activeMatch = await this.repository.findActiveDeviceRunForDevEUI(cleanEUI, dto.sessionId, filter);
        if (!activeMatch) {
            throw new common_1.BadRequestException(`Device [${cleanEUI}] is not registered in an active in-progress Test Session`);
        }
        const { run, session } = activeMatch;
        const sku = run.sku || session.itemCode || 'WSLRW-ATH';
        const shortFw = this.parseShortFw(run.firmwareVersion || session.template?.firmwareVersion);
        let memmapRegs = [];
        if (this.memmapUploadService) {
            try {
                const memmapRes = await this.memmapUploadService.getBySkuAndShortFw(sku, shortFw);
                if (memmapRes && memmapRes.data && memmapRes.data.registers) {
                    memmapRegs = memmapRes.data.registers;
                }
            }
            catch (err) {
                this.logger.debug(`No memmap found for [${sku}_${shortFw}]: ${err.message}`);
            }
        }
        const decodedData = this.decodePayload(cleanHex, dto.fPort || 1, sku);
        const evalResult = await this.sandboxAssertionService.evaluateAll(session.template, decodedData, {
            devEUI: cleanEUI,
            payloadHex: cleanHex,
            fPort: dto.fPort || 1,
            fCnt: dto.fCnt || (run.totalPackets + 1),
            rssi: dto.rssi ?? -75,
            snr: dto.snr ?? 9.5,
        }, {
            sessionId: session.id,
            sessionCode: session.sessionCode,
            soCode: session.soCode,
            itemCode: session.itemCode,
            sku,
            shortFw,
            devEUI: cleanEUI,
            packetCount: (run.totalPackets || 0) + 1,
            minPackets: session.template?.minPacketsRequired || 1,
        }, memmapRegs);
        const assertionResults = evalResult.assertionResults;
        const assertionsPass = evalResult.pass;
        const firstErrorMessage = evalResult.firstErrorMessage || '';
        const packetLog = new test_packet_log_entity_1.TestPacketLogEntity();
        packetLog.deviceRunId = run.id;
        packetLog.devEUI = cleanEUI;
        packetLog.fPort = dto.fPort || 1;
        packetLog.fCnt = dto.fCnt || (run.totalPackets + 1);
        packetLog.payloadHex = cleanHex;
        packetLog.decodedData = decodedData;
        packetLog.assertionResults = assertionResults;
        packetLog.isPass = assertionsPass;
        packetLog.rssi = dto.rssi ?? -75;
        packetLog.snr = dto.snr ?? 9.5;
        packetLog.gatewayId = dto.gatewayId || 'GW-AUTO-01';
        packetLog.receivedAt = new Date();
        await this.repository.savePacketLog(packetLog);
        const batteryVal = decodedData.battery ?? decodedData.battery_voltage ?? decodedData.voltage;
        let serialNumber = dto.serialNumber;
        if (!serialNumber && run.summaryReport?.serialNumber) {
            serialNumber = run.summaryReport.serialNumber;
        }
        if (!serialNumber) {
            const year = new Date().getFullYear().toString().slice(2);
            const month = String(new Date().getMonth() + 1).padStart(2, '0');
            const day = String(new Date().getDate()).padStart(2, '0');
            serialNumber = `${run.sku || 'WSLRW'}-${year}${month}${day}${cleanEUI.slice(-4)}`;
        }
        try {
            const evidence = new test_evidence_entity_1.TestEvidenceEntity();
            evidence.sessionId = session.id;
            evidence.deviceRunId = run.id;
            evidence.sessionCode = session.sessionCode;
            evidence.soCode = session.soCode;
            evidence.itemCode = session.itemCode;
            evidence.devEUI = cleanEUI;
            evidence.serialNumber = serialNumber;
            evidence.sku = run.sku;
            evidence.firmwareVersion = run.firmwareVersion;
            evidence.payloadHex = cleanHex;
            evidence.decodedFields = decodedData;
            evidence.assertionResults = assertionResults;
            evidence.verdict = assertionsPass ? 'PASSED' : 'FAILED';
            evidence.failureReason = assertionsPass ? undefined : firstErrorMessage;
            evidence.fPort = packetLog.fPort;
            evidence.fCnt = packetLog.fCnt;
            evidence.rssi = packetLog.rssi;
            evidence.snr = packetLog.snr;
            evidence.batteryVoltage = typeof batteryVal === 'number' ? batteryVal : undefined;
            evidence.operatorUsername = session.operatorId || 'qa-operator';
            evidence.testedAt = packetLog.receivedAt;
            evidence.metadata = {
                gatewayId: packetLog.gatewayId,
                modbusReg259: {
                    register: 259,
                    functionCode: 3,
                    registerCount: 9,
                    format: 'string',
                    serialNumber,
                },
            };
            await this.repository.saveEvidence(evidence);
        }
        catch (evErr) {
            this.logger.warn(`Failed to save test evidence for [${cleanEUI}]: ${evErr.message}`);
        }
        run.totalPackets = (run.totalPackets || 0) + 1;
        const passedCount = assertionResults.filter((r) => r.pass).length;
        const failedCount = assertionResults.filter((r) => !r.pass).length;
        run.passedAssertions = (run.passedAssertions || 0) + passedCount;
        run.failedAssertions = (run.failedAssertions || 0) + failedCount;
        if (dto.rssi !== undefined) {
            run.rssiAvg = run.rssiAvg !== undefined ? Math.round(((run.rssiAvg + dto.rssi) / 2) * 10) / 10 : dto.rssi;
        }
        if (dto.snr !== undefined) {
            run.snrAvg = run.snrAvg !== undefined ? Math.round(((run.snrAvg + dto.snr) / 2) * 10) / 10 : dto.snr;
        }
        if (typeof batteryVal === 'number') {
            run.batteryVoltage = batteryVal;
        }
        const minPackets = session.template?.minPacketsRequired || 1;
        if (!assertionsPass) {
            run.status = 'FAILED';
            run.failureReason = firstErrorMessage || 'One or more error assertions violated';
            run.completedAt = new Date();
        }
        else if (run.totalPackets >= minPackets) {
            run.status = 'PASSED';
            run.failureReason = undefined;
            run.completedAt = new Date();
        }
        else {
            run.status = 'RUNNING';
        }
        run.summaryReport = {
            serialNumber,
            lastPacket: {
                fPort: packetLog.fPort,
                fCnt: packetLog.fCnt,
                receivedAt: packetLog.receivedAt,
                decoded: decodedData,
            },
            assertions: assertionResults,
        };
        const savedRun = await this.repository.saveDeviceRun(run);
        const updatedSession = await this.recalculateSessionMetrics(session.id);
        this.broadcastEvent('test_device:packet_received', {
            sessionId: session.id,
            deviceRunId: run.id,
            devEUI: cleanEUI,
            packet: {
                fPort: packetLog.fPort,
                fCnt: packetLog.fCnt,
                payloadHex: packetLog.payloadHex,
                decodedData,
                isPass: assertionsPass,
                receivedAt: packetLog.receivedAt,
            },
        });
        this.broadcastEvent('test_device:status_changed', {
            sessionId: session.id,
            deviceRunId: run.id,
            devEUI: cleanEUI,
            status: run.status,
            totalPackets: run.totalPackets,
            batteryVoltage: run.batteryVoltage,
            failureReason: run.failureReason,
        });
        this.broadcastEvent('test_session:progress', {
            sessionId: session.id,
            totalDevices: updatedSession.totalDevices,
            passedDevices: updatedSession.passedDevices,
            failedDevices: updatedSession.failedDevices,
            status: updatedSession.status,
        });
        if (updatedSession.status === 'COMPLETED') {
            this.broadcastEvent('test_session:completed', {
                sessionId: session.id,
                sessionCode: session.sessionCode,
                totalDevices: updatedSession.totalDevices,
                passedDevices: updatedSession.passedDevices,
                failedDevices: updatedSession.failedDevices,
                endTime: updatedSession.endTime,
            });
        }
        return {
            success: true,
            isPass: assertionsPass,
            run: savedRun,
            session: updatedSession,
            assertionResults,
            decodedData,
        };
    }
    async recalculateSessionMetrics(sessionId) {
        const session = await this.repository.findSessionById(sessionId);
        if (!session)
            return null;
        const runs = session.deviceRuns || [];
        let passed = 0;
        let failed = 0;
        let inProgress = 0;
        for (const r of runs) {
            if (r.status === 'PASSED')
                passed++;
            else if (r.status === 'FAILED' || r.status === 'TIMEOUT')
                failed++;
            else
                inProgress++;
        }
        session.passedDevices = passed;
        session.failedDevices = failed;
        session.totalDevices = runs.length;
        if (runs.length > 0 && inProgress === 0 && session.status === 'IN_PROGRESS') {
            session.status = 'COMPLETED';
            session.endTime = new Date();
        }
        return await this.repository.saveSession(session);
    }
    async getSessionSummary(id) {
        const session = await this.getSessionById(id);
        const runs = session.deviceRuns || [];
        const total = runs.length;
        let passed = 0;
        let failed = 0;
        let running = 0;
        let waiting = 0;
        for (const r of runs) {
            if (r.status === 'PASSED')
                passed++;
            else if (r.status === 'FAILED' || r.status === 'TIMEOUT')
                failed++;
            else if (r.status === 'RUNNING')
                running++;
            else
                waiting++;
        }
        const completedUnits = passed + failed;
        const progressPercentage = total > 0 ? Math.round((completedUnits / total) * 100) : 0;
        const passRatePercentage = completedUnits > 0 ? Math.round((passed / completedUnits) * 100) : 0;
        let durationSeconds = 0;
        if (session.startTime) {
            const end = session.endTime ? new Date(session.endTime).getTime() : Date.now();
            durationSeconds = Math.max(0, Math.round((end - new Date(session.startTime).getTime()) / 1000));
        }
        return {
            id: session.id,
            sessionCode: session.sessionCode,
            soCode: session.soCode,
            itemCode: session.itemCode,
            status: session.status,
            totalDevices: total,
            passedDevices: passed,
            failedDevices: failed,
            runningDevices: running,
            waitingDevices: waiting,
            progressPercentage,
            passRatePercentage,
            startTime: session.startTime,
            endTime: session.endTime,
            durationSeconds,
            template: session.template ? {
                id: session.template.id,
                code: session.template.code,
                name: session.template.name,
            } : null,
        };
    }
    async exportSessionReport(id, format = 'csv') {
        const session = await this.getSessionById(id);
        const summary = await this.getSessionSummary(id);
        if (format === 'json') {
            return {
                session,
                summary,
                exportedAt: new Date().toISOString(),
            };
        }
        const rows = [
            ['DAVITEQ FACTORY PRODUCT INSPECTION REPORT'],
            ['Session Code', session.sessionCode],
            ['Sales Order', session.soCode],
            ['Item Code', session.itemCode],
            ['Template', session.template?.name || 'Standard'],
            ['Status', session.status],
            ['Total Units', String(summary.totalDevices)],
            ['Passed Units', String(summary.passedDevices)],
            ['Failed Units', String(summary.failedDevices)],
            ['Pass Rate', `${summary.passRatePercentage}%`],
            ['Start Time', session.startTime ? new Date(session.startTime).toISOString() : 'N/A'],
            ['End Time', session.endTime ? new Date(session.endTime).toISOString() : 'N/A'],
            ['Operator', session.operatorId || 'QA'],
            [],
            ['Index', 'DevEUI', 'SKU', 'Firmware', 'Status', 'Packets', 'RSSI (dBm)', 'SNR (dB)', 'Battery (V)', 'Failure Reason'],
        ];
        (session.deviceRuns || []).forEach((run, idx) => {
            rows.push([
                String(idx + 1),
                run.devEUI,
                run.sku || '',
                run.firmwareVersion || '',
                run.status,
                String(run.totalPackets || 0),
                run.rssiAvg !== undefined && run.rssiAvg !== null ? String(run.rssiAvg) : '',
                run.snrAvg !== undefined && run.snrAvg !== null ? String(run.snrAvg) : '',
                run.batteryVoltage !== undefined && run.batteryVoltage !== null ? String(run.batteryVoltage) : '',
                run.failureReason ? `"${run.failureReason.replace(/"/g, '""')}"` : '',
            ]);
        });
        const csvContent = rows.map((r) => r.join(',')).join('\n');
        return {
            fileName: `QC-REPORT-${session.sessionCode}.csv`,
            contentType: 'text/csv',
            content: csvContent,
        };
    }
    parseShortFw(rawFw) {
        if (rawFw === null || rawFw === undefined)
            return 0;
        if (typeof rawFw === 'number')
            return Math.floor(rawFw);
        const cleaned = String(rawFw).trim().replace(/^v/i, '');
        const match = cleaned.match(/^(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    }
    evaluateSingleAssertion(assertRule, actual) {
        return this.sandboxAssertionService.evaluateSingleAssertion(assertRule, actual);
    }
    extractFieldValue(obj, path) {
        return this.sandboxAssertionService.extractFieldValue(obj, path);
    }
    decodePayload(hex, fPort, sku) {
        const clean = hex.trim().toLowerCase();
        const result = {
            fPort,
            rawHex: clean,
        };
        try {
            const bytes = Buffer.from(clean, 'hex');
            let i = 0;
            while (i < bytes.length) {
                const channel = bytes[i];
                if (i + 1 >= bytes.length)
                    break;
                const type = bytes[i + 1];
                if ((channel === 0x03 || channel === 0x0b || type === 0x03) && i + 3 < bytes.length && result.battery === undefined) {
                    const rawMv = bytes.readUInt16BE(i + 2);
                    result.battery = Math.round((rawMv / 1000) * 100) / 100;
                    result.batteryVoltage = result.battery;
                    i += 4;
                    continue;
                }
                if ((channel === 0x02 || type === 0x02 || type === 0x68) && i + 3 < bytes.length && result.humidity === undefined) {
                    const rawHum = bytes.readUInt16BE(i + 2);
                    result.humidity = Math.round((rawHum / 10) * 10) / 10;
                    i += 4;
                    continue;
                }
                if ((channel === 0x01 || type === 0x01 || type === 0x67) && i + 3 < bytes.length && result.temperature === undefined) {
                    const rawTemp = bytes.readInt16BE(i + 2);
                    result.temperature = Math.round((rawTemp / 10) * 10) / 10;
                    i += 4;
                    continue;
                }
                if ((channel === 0x04 || type === 0x04) && i + 5 < bytes.length && result.pulseCount === undefined) {
                    result.pulseCount = bytes.readUInt32BE(i + 2);
                    i += 6;
                    continue;
                }
                i++;
            }
            if (result.temperature === undefined && bytes.length >= 2) {
                result.temperature = Math.round((bytes.readInt16BE(0) / 10) * 10) / 10;
            }
            if (result.humidity === undefined && bytes.length >= 4) {
                result.humidity = Math.round((bytes.readUInt16BE(2) / 10) * 10) / 10;
            }
            if (result.battery === undefined && bytes.length >= 6) {
                const rawMv = bytes.readUInt16BE(bytes.length - 2);
                if (rawMv >= 1000 && rawMv <= 5000) {
                    result.battery = Math.round((rawMv / 1000) * 100) / 100;
                    result.batteryVoltage = result.battery;
                }
            }
        }
        catch (e) {
            this.logger.debug(`Decode error: ${e.message}`);
        }
        return result;
    }
    broadcastEvent(event, payload) {
        if (!this.realtimeGateway)
            return;
        try {
            if (this.realtimeGateway.server) {
                this.realtimeGateway.server.emit(event, payload);
                this.realtimeGateway.server.emit('test_automation:stream', { event, payload });
            }
        }
        catch (err) {
            this.logger.warn(`Failed to broadcast event '${event}': ${err.message}`);
        }
    }
    async createEvidence(dto, operatorUsername = 'qa-operator') {
        const cleanEUI = (0, lorawan_utils_1.cleanDevEUI)(dto.devEUI);
        if (!cleanEUI) {
            throw new common_1.BadRequestException('Valid 16-hex DevEUI is required');
        }
        const cleanHex = (0, lorawan_utils_1.cleanHexPayload)(dto.payloadHex) || '00';
        let serialNumber = dto.serialNumber?.trim();
        if (!serialNumber) {
            const year = new Date().getFullYear().toString().slice(2);
            const month = String(new Date().getMonth() + 1).padStart(2, '0');
            const day = String(new Date().getDate()).padStart(2, '0');
            serialNumber = `${dto.sku || 'WSLRW'}-${year}${month}${day}${cleanEUI.slice(-4)}`;
        }
        const evidence = new test_evidence_entity_1.TestEvidenceEntity();
        evidence.sessionId = dto.sessionId;
        evidence.deviceRunId = dto.deviceRunId;
        evidence.sessionCode = dto.sessionCode;
        evidence.soCode = dto.soCode;
        evidence.itemCode = dto.itemCode;
        evidence.devEUI = cleanEUI;
        evidence.serialNumber = serialNumber;
        evidence.sku = dto.sku;
        evidence.firmwareVersion = dto.firmwareVersion;
        evidence.hardwareVersion = dto.hardwareVersion;
        evidence.payloadHex = cleanHex;
        evidence.decodedFields = dto.decodedFields || {};
        evidence.assertionResults = dto.assertionResults || [];
        evidence.verdict = (dto.verdict || 'PASSED').toUpperCase();
        evidence.failureReason = dto.failureReason;
        evidence.fPort = dto.fPort || 1;
        evidence.fCnt = dto.fCnt || 0;
        evidence.rssi = dto.rssi;
        evidence.snr = dto.snr;
        evidence.batteryVoltage = dto.batteryVoltage;
        evidence.operatorUsername = dto.operatorUsername || operatorUsername;
        evidence.testedAt = new Date();
        evidence.metadata = dto.metadata || {
            modbusReg259: {
                register: 259,
                functionCode: 3,
                registerCount: 9,
                format: 'string',
                serialNumber,
            },
        };
        const saved = await this.repository.saveEvidence(evidence);
        this.broadcastEvent('test_evidence:created', {
            id: saved.id,
            devEUI: saved.devEUI,
            serialNumber: saved.serialNumber,
            verdict: saved.verdict,
            soCode: saved.soCode,
            testedAt: saved.testedAt,
        });
        return saved;
    }
    async getEvidences(query) {
        return await this.repository.findEvidences(query);
    }
    async getEvidenceById(id) {
        const evidence = await this.repository.findEvidenceById(id);
        if (!evidence) {
            throw new common_1.NotFoundException(`Test evidence record '${id}' not found`);
        }
        return evidence;
    }
    async exportEvidenceCsv(query) {
        const { items } = await this.repository.findEvidences({ ...query, limit: 1000 });
        const headers = [
            'Evidence ID',
            'Tested At (UTC)',
            'DevEUI',
            'Serial Number (Reg 259)',
            'SO Code',
            'Item Code',
            'SKU',
            'Firmware',
            'Verdict',
            'Battery (V)',
            'RSSI (dBm)',
            'SNR (dB)',
            'fPort',
            'fCnt',
            'Decoded Sensor Fields (JSON)',
            'Failure Reason',
            'Operator',
        ];
        const rows = items.map((e) => {
            const decodedJson = JSON.stringify(e.decodedFields || {}).replace(/"/g, '""');
            const failReason = (e.failureReason || '').replace(/"/g, '""');
            return [
                `"${e.id}"`,
                `"${e.testedAt ? new Date(e.testedAt).toISOString() : ''}"`,
                `"${e.devEUI}"`,
                `"${e.serialNumber || ''}"`,
                `"${e.soCode || ''}"`,
                `"${e.itemCode || ''}"`,
                `"${e.sku || ''}"`,
                `"${e.firmwareVersion || ''}"`,
                `"${e.verdict}"`,
                e.batteryVoltage !== null && e.batteryVoltage !== undefined ? e.batteryVoltage : '',
                e.rssi !== null && e.rssi !== undefined ? e.rssi : '',
                e.snr !== null && e.snr !== undefined ? e.snr : '',
                e.fPort || 1,
                e.fCnt || 0,
                `"${decodedJson}"`,
                `"${failReason}"`,
                `"${e.operatorUsername || 'qa-operator'}"`,
            ].join(',');
        });
        const csvContent = [headers.join(','), ...rows].join('\n');
        const dateStr = new Date().toISOString().substring(0, 10);
        return {
            fileName: `test-evidence-report-${dateStr}.csv`,
            content: csvContent,
        };
    }
    serializeSession(s) {
        return {
            id: s.id,
            sessionCode: s.sessionCode,
            soCode: s.soCode,
            itemCode: s.itemCode,
            templateId: s.templateId,
            totalDevices: s.totalDevices,
            passedDevices: s.passedDevices,
            failedDevices: s.failedDevices,
            status: s.status,
            startTime: s.startTime,
            endTime: s.endTime,
            notes: s.notes,
            createdAt: s.createdAt,
        };
    }
    async getDeviceTrace(devEUI) {
        return await this.repository.findDeviceTrace(devEUI);
    }
    async getBatchDeviceTrace(devEUIs) {
        return await this.repository.findBatchDeviceTrace(devEUIs);
    }
};
exports.TestAutomationService = TestAutomationService;
exports.TestAutomationService = TestAutomationService = TestAutomationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __param(2, (0, common_1.Optional)()),
    __param(3, (0, common_1.Optional)()),
    __param(4, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [test_automation_repository_1.TestAutomationRepository,
        realtime_gateway_1.RealtimeGateway,
        realtime_service_1.RealtimeService,
        sandbox_assertion_service_1.SandboxAssertionService,
        memmap_upload_service_1.MemmapUploadService])
], TestAutomationService);
//# sourceMappingURL=test-automation.service.js.map