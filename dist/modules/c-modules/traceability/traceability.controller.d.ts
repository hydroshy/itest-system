import { Response } from 'express';
import { TraceabilityService } from './traceability.service';
import { QueryTestResultsDto, QueryDeviceDetailsDto } from './dto/traceability.dto';
import { TestResultEntity } from './entities/test-result.entity';
export declare class TraceabilityController {
    private readonly traceabilityService;
    constructor(traceabilityService: TraceabilityService);
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
    getSoCatalog(query: any): Promise<{
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
    getTestResultById(id: string): Promise<TestResultEntity>;
    getDeviceTestDetails(query: QueryDeviceDetailsDto): Promise<import("./dto/traceability.dto").DeviceTestDetailsResponse>;
    exportCsv(query: QueryTestResultsDto, res: Response): Promise<any>;
    recordTestResult(dto: Partial<TestResultEntity>): Promise<TestResultEntity>;
    seedRepresentativeBaselineData(): Promise<{
        success: boolean;
        message: string;
    }>;
    decodeConfig(body: {
        configurationString: string;
        parametersNameString: string;
        parametersType: string;
        parametersLengthString: string;
    }): import("./dto/traceability.dto").DecodedConfigRegister[];
}
