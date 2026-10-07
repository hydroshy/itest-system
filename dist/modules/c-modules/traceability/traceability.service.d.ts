import { OnModuleInit } from '@nestjs/common';
import { DynamicDatabaseService } from '../../database/dynamic-database.service';
import { TestResultEntity } from './entities/test-result.entity';
import { QueryTestResultsDto, QueryDeviceDetailsDto, DecodedConfigRegister, ParameterMinMaxAvg, DeviceTestDetailsResponse, EventDistributionStats } from './dto/traceability.dto';
export declare class TraceabilityService implements OnModuleInit {
    private readonly dbService;
    private readonly logger;
    constructor(dbService: DynamicDatabaseService);
    private get testResultRepo();
    private get rawData3Repo();
    onModuleInit(): Promise<void>;
    ensureTablesAndSeed(): Promise<void>;
    seedRepresentativeBaselineData(ds?: any): Promise<void>;
    findTestResults(query: QueryTestResultsDto): Promise<{
        data: TestResultEntity[];
        items: TestResultEntity[];
        total: number;
        metrics: {
            totalTests: number;
            passCount: number;
            failCount: number;
            passRate: number;
            avgDurationSeconds: number;
        };
    }>;
    getSoCatalog(query: {
        soNumber?: string;
        serialNumber?: string;
        sku?: string;
        itemCode?: string;
        search?: string;
        limit?: number;
    }): Promise<{
        data: Array<{
            soNumber: string;
            itemCode: string;
            sku: string;
            totalDevices: number;
            passCount: number;
            failCount: number;
            passRate: number;
            latestFinishTime: string | number;
            hwVer?: string;
            fwVer?: string;
        }>;
        total: number;
    }>;
    getTestResultById(idOrSn: string): Promise<TestResultEntity | null>;
    parseTestId(testId: string): {
        serialNumber?: string;
        sku?: string;
        itemCode?: string;
        firmwareVersion?: string;
        hwVer?: string;
        sensorType?: string;
        deviceKey?: string;
        soNumber?: string;
    };
    getDeviceTestDetails(idOrSn: string, query?: QueryDeviceDetailsDto): Promise<DeviceTestDetailsResponse>;
    decodeFinalConfig(configStr: string, paramsNameStr: string, paramsTypeStr: string, paramsLenStr: string): DecodedConfigRegister[];
    exportCsv(query: QueryTestResultsDto): Promise<string>;
    recordTestResult(dto: Partial<TestResultEntity>): Promise<TestResultEntity>;
    computeStats(values: (number | null)[], paramKey: string, customName?: string): ParameterMinMaxAvg;
    computeEventDistribution(p1Events: (number | null)[]): EventDistributionStats;
}
