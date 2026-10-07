import { Repository } from 'typeorm';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { TestSessionEntity } from './entities/test-session.entity';
import { TestDeviceRunEntity } from './entities/test-device-run.entity';
import { TestPacketLogEntity } from './entities/test-packet-log.entity';
import { TestEvidenceEntity } from './entities/test-evidence.entity';
import { TestTemplateEntity } from '../../c-modules/test-builder/entities/test-template.entity';
import { ItemCodeEntity } from '../../c-modules/item-codes/entities/item-code.entity';
import { SalesOrderEntity } from '../../c-modules/sales-orders/entities/sales-order.entity';
import { QueryTestSessionDto } from './dto/query-test-session.dto';
import { QueryTestEvidenceDto } from './dto/query-test-evidence.dto';
export declare class TestAutomationRepository {
    private readonly dbService;
    private readonly logger;
    private memorySessions;
    private memoryDeviceRuns;
    private memoryPacketLogs;
    private memoryEvidences;
    constructor(dbService: DynamicDatabaseService);
    getSessionRepo(): Repository<TestSessionEntity>;
    getDeviceRunRepo(): Repository<TestDeviceRunEntity>;
    getPacketLogRepo(): Repository<TestPacketLogEntity>;
    getTemplateRepo(): Repository<TestTemplateEntity>;
    getItemCodeRepo(): Repository<ItemCodeEntity>;
    getSalesOrderRepo(): Repository<SalesOrderEntity>;
    getEvidenceRepo(): Repository<TestEvidenceEntity>;
    findSessions(query: QueryTestSessionDto): Promise<{
        items: TestSessionEntity[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findSessionById(id: string): Promise<TestSessionEntity | null>;
    findSessionByCode(sessionCode: string): Promise<TestSessionEntity | null>;
    saveSession(session: TestSessionEntity): Promise<TestSessionEntity>;
    saveDeviceRun(run: TestDeviceRunEntity): Promise<TestDeviceRunEntity>;
    savePacketLog(log: TestPacketLogEntity): Promise<TestPacketLogEntity>;
    findDeviceRunById(deviceRunId: string): Promise<TestDeviceRunEntity | null>;
    findPacketLogs(deviceRunId: string, limit?: number): Promise<TestPacketLogEntity[]>;
    findActiveDeviceRunForDevEUI(devEUI: string, sessionId?: string, filter?: {
        soCode?: string;
        itemCode?: string;
    }): Promise<{
        run: TestDeviceRunEntity;
        session: TestSessionEntity;
    } | null>;
    findTemplateForSku(sku: string, firmwareVersion?: string): Promise<TestTemplateEntity | null>;
    findItemCode(itemCode: string): Promise<ItemCodeEntity | null>;
    saveEvidence(evidence: TestEvidenceEntity): Promise<TestEvidenceEntity>;
    findEvidences(query: QueryTestEvidenceDto): Promise<{
        items: TestEvidenceEntity[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findEvidenceById(id: string): Promise<TestEvidenceEntity | null>;
    findDeviceTrace(devEUI: string): Promise<{
        devEUI: string;
        isOnline: boolean;
        lastSeenAt: string | null;
        rssi: number | null;
        snr: number | null;
    }>;
    findBatchDeviceTrace(devEUIs: string[]): Promise<Array<{
        devEUI: string;
        isOnline: boolean;
        lastSeenAt: string | null;
        rssi: number | null;
        snr: number | null;
    }>>;
}
