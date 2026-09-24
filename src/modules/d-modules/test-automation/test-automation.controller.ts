import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { TestAutomationService } from './test-automation.service';
import { CreateTestSessionDto } from './dto/create-test-session.dto';
import { SimulatePacketDto } from './dto/simulate-packet.dto';
import { QueryTestSessionDto } from './dto/query-test-session.dto';
import { CreateTestEvidenceDto } from './dto/create-test-evidence.dto';
import { QueryTestEvidenceDto } from './dto/query-test-evidence.dto';

@ApiTags('D-Module: Product Test Automation Workbench')
@Controller(['api/d-modules/test-run', 'api/d-modules/test-automation'])
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TestAutomationController {
  constructor(private readonly service: TestAutomationService) {}

  @Get('sessions')
  @ApiOperation({ summary: 'List test sessions with pagination and filters' })
  async getSessions(@Query() query: QueryTestSessionDto) {
    return await this.service.getSessions(query);
  }

  @Post('sessions')
  @ApiOperation({
    summary: 'Create a new test session linked to a Sales Order & Item Code',
  })
  async createSession(
    @Body() dto: CreateTestSessionDto,
    @CurrentUser() user: User,
  ) {
    const operatorId = user?.username || user?.email || 'qa-operator';
    return await this.service.createSession(dto, operatorId);
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get details of a test session by ID or session code' })
  async getSessionById(@Param('id') id: string) {
    return await this.service.getSessionById(id);
  }

  @Post('sessions/:id/start')
  @ApiOperation({
    summary: 'Start an active test session, moving waiting devices to RUNNING',
  })
  async startSession(@Param('id') id: string) {
    return await this.service.startSession(id);
  }

  @Post('sessions/:id/abort')
  @ApiOperation({ summary: 'Abort an ongoing test session' })
  async abortSession(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return await this.service.abortSession(id, reason);
  }

  @Post('sessions/:id/complete')
  @ApiOperation({ summary: 'Finalize and complete a test session' })
  async completeSession(@Param('id') id: string) {
    return await this.service.completeSession(id);
  }

  @Get('sessions/:id/summary')
  @ApiOperation({
    summary: 'Get real-time test progress metrics and pass/fail summary',
  })
  async getSessionSummary(@Param('id') id: string) {
    return await this.service.getSessionSummary(id);
  }

  @Get('devices/:deviceRunId/logs')
  @ApiOperation({
    summary: 'View detailed uplink packets and assertion evaluations for a device',
  })
  async getDeviceLogs(@Param('deviceRunId') deviceRunId: string) {
    return await this.service.getDeviceRunLogs(deviceRunId);
  }

  @Post('devices/:deviceRunId/retry')
  @ApiOperation({
    summary: 'Reset and retry test execution for a failed device run',
  })
  async retryDevice(@Param('deviceRunId') deviceRunId: string) {
    return await this.service.retryDeviceRun(deviceRunId);
  }

  @Get('devices/:devEUI/trace')
  @ApiOperation({
    summary: 'Trace real-time online status, RSSI and SNR for a device before test',
  })
  async getDeviceTrace(@Param('devEUI') devEUI: string) {
    return await this.service.getDeviceTrace(devEUI);
  }

  @Post('devices/trace-batch')
  @ApiOperation({
    summary: 'Batch trace real-time online status, RSSI and SNR for devices before test',
  })
  async getBatchDeviceTrace(@Body('devEUIs') devEUIs: string[]) {
    return await this.service.getBatchDeviceTrace(devEUIs || []);
  }

  @Post('simulate-packet')
  @ApiOperation({
    summary:
      'Simulate an uplink packet injection from the QA test bench and verify assertions',
  })
  async simulatePacket(@Body() dto: SimulatePacketDto) {
    return await this.service.processPacket(dto);
  }

  @Get('sessions/:id/export')
  @ApiOperation({ summary: 'Export factory inspection report as CSV or JSON' })
  async exportReport(
    @Param('id') id: string,
    @Query('format') format: 'csv' | 'json' = 'csv',
    @Res() res: Response,
  ) {
    const report = await this.service.exportSessionReport(id, format);
    if (format === 'json') {
      return res.json(report);
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${report.fileName}"`,
    );
    return res.send(report.content);
  }

  @Get('evidence')
  @ApiOperation({ summary: 'List post-test sensor decoded evidence for audit compliance' })
  async getEvidences(@Query() query: QueryTestEvidenceDto) {
    return await this.service.getEvidences(query);
  }

  @Post('evidence')
  @ApiOperation({ summary: 'Manually record post-test evidence with decoded sensor fields' })
  async createEvidence(
    @Body() dto: CreateTestEvidenceDto,
    @CurrentUser() user: User,
  ) {
    const operator = user?.username || user?.email || 'qa-operator';
    return await this.service.createEvidence(dto, operator);
  }

  @Get('evidence/export')
  @ApiOperation({ summary: 'Export post-test sensor evidence to CSV for compliance audit' })
  async exportEvidence(
    @Query() query: QueryTestEvidenceDto,
    @Res() res: Response,
  ) {
    const report = await this.service.exportEvidenceCsv(query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${report.fileName}"`,
    );
    return res.send(report.content);
  }

  @Get('evidence/:id')
  @ApiOperation({ summary: 'Get single test evidence record with all decoded sensor fields' })
  async getEvidenceById(@Param('id') id: string) {
    return await this.service.getEvidenceById(id);
  }
}
