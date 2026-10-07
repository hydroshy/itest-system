import { TestTemplateEntity } from '../../../c-modules/test-builder/entities/test-template.entity';
import { TestDeviceRunEntity } from './test-device-run.entity';
export type TestSessionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ABORTED';
export declare class TestSessionEntity {
    id: string;
    sessionCode: string;
    soCode: string;
    itemCode: string;
    templateId?: string;
    template?: TestTemplateEntity;
    totalDevices: number;
    passedDevices: number;
    failedDevices: number;
    status: TestSessionStatus;
    startTime?: Date;
    endTime?: Date;
    operatorId?: string;
    notes?: string;
    metadata: Record<string, any>;
    deviceRuns: TestDeviceRunEntity[];
    createdAt: Date;
    updatedAt: Date;
}
