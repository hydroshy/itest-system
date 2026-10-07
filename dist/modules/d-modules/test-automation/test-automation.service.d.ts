import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TestAutomationRepository } from './test-automation.repository';
import { TestSessionEntity, TestSessionStatus } from './entities/test-session.entity';
import { TestDeviceRunEntity } from './entities/test-device-run.entity';
import { TestPacketLogEntity } from './entities/test-packet-log.entity';
import { TestEvidenceEntity } from './entities/test-evidence.entity';
import { CreateTestSessionDto } from './dto/create-test-session.dto';
import { SimulatePacketDto } from './dto/simulate-packet.dto';
import { QueryTestSessionDto } from './dto/query-test-session.dto';
import { CreateTestEvidenceDto } from './dto/create-test-evidence.dto';
import { QueryTestEvidenceDto } from './dto/query-test-evidence.dto';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import { RealtimeService } from '../../realtime/realtime.service';
import { SandboxAssertionService, AssertionEvalResult } from './sandbox-assertion.service';
import { MemmapUploadService } from '../../c-modules/memmap-upload/memmap-upload.service';
export { AssertionEvalResult };
export declare class TestAutomationService implements OnModuleInit, OnModuleDestroy {
    private readonly repository;
    private readonly realtimeGateway?;
    private readonly realtimeService?;
    private readonly sandboxAssertionService?;
    private readonly memmapUploadService?;
    private readonly logger;
    private telemetrySub?;
    constructor(repository: TestAutomationRepository, realtimeGateway?: RealtimeGateway, realtimeService?: RealtimeService, sandboxAssertionService?: SandboxAssertionService, memmapUploadService?: MemmapUploadService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private handleLiveUplinkTelemetry;
    parseAndValidateDevEUIs(input: string[] | string): string[];
    createSession(dto: CreateTestSessionDto, operatorId?: string): Promise<TestSessionEntity>;
    getSessions(query: QueryTestSessionDto): Promise<{
        items: TestSessionEntity[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getSessionById(id: string): Promise<TestSessionEntity>;
    startSession(id: string): Promise<TestSessionEntity>;
    abortSession(id: string, reason?: string): Promise<TestSessionEntity>;
    completeSession(id: string): Promise<TestSessionEntity>;
    retryDeviceRun(deviceRunId: string): Promise<TestDeviceRunEntity>;
    getDeviceRunLogs(deviceRunId: string): Promise<TestPacketLogEntity[]>;
    processPacket(dto: SimulatePacketDto): Promise<{
        success: boolean;
        isPass: boolean;
        run: TestDeviceRunEntity;
        session: TestSessionEntity;
        assertionResults: AssertionEvalResult[];
        decodedData: Record<string, any>;
    }>;
    private recalculateSessionMetrics;
    getSessionSummary(id: string): Promise<{
        id: string;
        sessionCode: string;
        soCode: string;
        itemCode: string;
        status: TestSessionStatus;
        totalDevices: number;
        passedDevices: number;
        failedDevices: number;
        runningDevices: number;
        waitingDevices: number;
        progressPercentage: number;
        passRatePercentage: number;
        startTime: Date;
        endTime: Date;
        durationSeconds: number;
        template: {
            id: string;
            code: string;
            name: string;
        };
    }>;
    exportSessionReport(id: string, format?: 'csv' | 'json'): Promise<{
        session: TestSessionEntity;
        summary: {
            id: string;
            sessionCode: string;
            soCode: string;
            itemCode: string;
            status: TestSessionStatus;
            totalDevices: number;
            passedDevices: number;
            failedDevices: number;
            runningDevices: number;
            waitingDevices: number;
            progressPercentage: number;
            passRatePercentage: number;
            startTime: Date;
            endTime: Date;
            durationSeconds: number;
            template: {
                id: string;
                code: string;
                name: string;
            };
        };
        exportedAt: string;
        fileName?: undefined;
        contentType?: undefined;
        content?: undefined;
    } | {
        fileName: string;
        contentType: string;
        content: string;
        session?: undefined;
        summary?: undefined;
        exportedAt?: undefined;
    }>;
    parseShortFw(rawFw: string | number | undefined | null): number;
    evaluateSingleAssertion(assertRule: any, actual: any): AssertionEvalResult;
    extractFieldValue(obj: any, path: string): any;
    private decodePayload;
    private broadcastEvent;
    createEvidence(dto: CreateTestEvidenceDto, operatorUsername?: string): Promise<TestEvidenceEntity>;
    getEvidences(query: QueryTestEvidenceDto): Promise<{
        items: TestEvidenceEntity[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getEvidenceById(id: string): Promise<TestEvidenceEntity>;
    exportEvidenceCsv(query: QueryTestEvidenceDto): Promise<{
        fileName: string;
        content: string;
    }>;
    private serializeSession;
    getDeviceTrace(devEUI: string): Promise<{
        devEUI: string;
        isOnline: boolean;
        lastSeenAt: string | null;
        rssi: number | null;
        snr: number | null;
    }>;
    getBatchDeviceTrace(devEUIs: string[]): Promise<{
        devEUI: string;
        isOnline: boolean;
        lastSeenAt: string | null;
        rssi: number | null;
        snr: number | null;
    }[]>;
}
