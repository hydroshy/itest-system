import { Response } from 'express';
import { User } from '../../users/entities/user.entity';
import { TestAutomationService } from './test-automation.service';
import { CreateTestSessionDto } from './dto/create-test-session.dto';
import { SimulatePacketDto } from './dto/simulate-packet.dto';
import { QueryTestSessionDto } from './dto/query-test-session.dto';
import { CreateTestEvidenceDto } from './dto/create-test-evidence.dto';
import { QueryTestEvidenceDto } from './dto/query-test-evidence.dto';
export declare class TestAutomationController {
    private readonly service;
    constructor(service: TestAutomationService);
    getSessions(query: QueryTestSessionDto): Promise<{
        items: import("./entities/test-session.entity").TestSessionEntity[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createSession(dto: CreateTestSessionDto, user: User): Promise<import("./entities/test-session.entity").TestSessionEntity>;
    getSessionById(id: string): Promise<import("./entities/test-session.entity").TestSessionEntity>;
    startSession(id: string): Promise<import("./entities/test-session.entity").TestSessionEntity>;
    abortSession(id: string, reason?: string): Promise<import("./entities/test-session.entity").TestSessionEntity>;
    completeSession(id: string): Promise<import("./entities/test-session.entity").TestSessionEntity>;
    getSessionSummary(id: string): Promise<{
        id: string;
        sessionCode: string;
        soCode: string;
        itemCode: string;
        status: import("./entities/test-session.entity").TestSessionStatus;
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
    getDeviceLogs(deviceRunId: string): Promise<import("./entities/test-packet-log.entity").TestPacketLogEntity[]>;
    retryDevice(deviceRunId: string): Promise<import("./entities/test-device-run.entity").TestDeviceRunEntity>;
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
    simulatePacket(dto: SimulatePacketDto): Promise<{
        success: boolean;
        isPass: boolean;
        run: import("./entities/test-device-run.entity").TestDeviceRunEntity;
        session: import("./entities/test-session.entity").TestSessionEntity;
        assertionResults: import("./sandbox-assertion.service").AssertionEvalResult[];
        decodedData: Record<string, any>;
    }>;
    exportReport(id: string, format: 'csv' | 'json', res: Response): Promise<any>;
    getEvidences(query: QueryTestEvidenceDto): Promise<{
        items: import("./entities/test-evidence.entity").TestEvidenceEntity[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createEvidence(dto: CreateTestEvidenceDto, user: User): Promise<import("./entities/test-evidence.entity").TestEvidenceEntity>;
    exportEvidence(query: QueryTestEvidenceDto, res: Response): Promise<any>;
    getEvidenceById(id: string): Promise<import("./entities/test-evidence.entity").TestEvidenceEntity>;
}
