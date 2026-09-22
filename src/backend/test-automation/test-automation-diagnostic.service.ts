import { Injectable, Logger } from '@nestjs/common';
import { SubsystemHealthStatus, BackendSubsystem } from '../common/subsystem.types';
import { TestAutomationService } from '../../modules/d-modules/test-automation/test-automation.service';
import { TestBuilderService } from '../../modules/c-modules/test-builder/test-builder.service';
import { DecoderService } from '../../modules/c-modules/decoder-admin/decoder.service';

@Injectable()
export class TestAutomationDiagnosticService {
  private readonly logger = new Logger('TestAutomationSubsystem');

  constructor(
    private readonly testAutomationService: TestAutomationService,
    private readonly testBuilderService: TestBuilderService,
    private readonly decoderService: DecoderService,
  ) {}

  async checkHealth(): Promise<SubsystemHealthStatus> {
    try {
      const sessionsResult = await this.testAutomationService.getSessions({ limit: 1 });
      const templates = await this.testBuilderService.findAll();
      const decoders = await this.decoderService.findAll();

      return {
        subsystem: BackendSubsystem.TEST_AUTOMATION,
        status: 'UP',
        timestamp: new Date().toISOString(),
        details: {
          totalTestSessions: sessionsResult.total ?? sessionsResult.items?.length ?? 0,
          totalTestTemplates: templates.length,
          totalDecoders: decoders.length,
          subsystemScope: [
            'D-Module test automation workbench',
            'C-Module test builder flow-graph engine',
            'Real-time packet log capture & verdict evaluation',
            'Decoder field extraction & payload validation',
          ],
        },
        error: null,
      };
    } catch (err: any) {
      this.logger.error(`Test Automation diagnostic failed: ${err.message}`, err.stack);
      return {
        subsystem: BackendSubsystem.TEST_AUTOMATION,
        status: 'DEGRADED',
        timestamp: new Date().toISOString(),
        error: err.message,
      };
    }
  }
}
