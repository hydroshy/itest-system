import { TestSessionEntity } from './test-session.entity';
import { TestPacketLogEntity } from './test-packet-log.entity';
export type TestDeviceStatus = 'WAITING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'TIMEOUT' | 'SKIPPED';
export declare class TestDeviceRunEntity {
    id: string;
    sessionId: string;
    session: TestSessionEntity;
    devEUI: string;
    deviceId?: string;
    sku: string;
    firmwareVersion: string;
    status: TestDeviceStatus;
    totalPackets: number;
    passedAssertions: number;
    failedAssertions: number;
    summaryReport: Record<string, any>;
    rssiAvg?: number;
    snrAvg?: number;
    batteryVoltage?: number;
    startedAt?: Date;
    completedAt?: Date;
    failureReason?: string;
    packetLogs: TestPacketLogEntity[];
    createdAt: Date;
    updatedAt: Date;
}
