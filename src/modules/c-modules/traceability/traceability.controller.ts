import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { TraceabilityService } from './traceability.service';
import { QueryTestResultsDto, QueryDeviceDetailsDto } from './dto/traceability.dto';
import { TestResultEntity } from './entities/test-result.entity';

@ApiTags('Traceability & Quality Inspection (T-Module)')
@Controller(['api/traceability', 'api/c-modules/traceability', 'api/t-modules/traceability'])
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class TraceabilityController {
  constructor(private readonly traceabilityService: TraceabilityService) {}

  @Get(['results', 'test-results'])
  @RequirePermissions('traceability:read')
  @ApiOperation({ summary: 'Flow 0: Query test results with multi-criteria search (SO, SN, SKU, Item Code, Time)' })
  @ApiQuery({ name: 'soNumber', required: false })
  @ApiQuery({ name: 'serialNumber', required: false })
  @ApiQuery({ name: 'sku', required: false })
  @ApiQuery({ name: 'itemCode', required: false })
  @ApiQuery({ name: 'deviceKey', required: false })
  @ApiQuery({ name: 'result', required: false })
  @ApiQuery({ name: 'startTime', required: false })
  @ApiQuery({ name: 'endTime', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async findTestResults(@Query() query: QueryTestResultsDto) {
    return await this.traceabilityService.findTestResults(query);
  }

  @Get(['so-catalog', 'so-list'])
  @RequirePermissions('traceability:read')
  @ApiOperation({ summary: 'Flow 0: Query aggregated SO-level catalog for Tested Devices Catalog' })
  @ApiQuery({ name: 'soNumber', required: false })
  @ApiQuery({ name: 'serialNumber', required: false })
  @ApiQuery({ name: 'sku', required: false })
  @ApiQuery({ name: 'itemCode', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getSoCatalog(@Query() query: any) {
    return await this.traceabilityService.getSoCatalog(query);
  }

  @Get(['results/:id', 'test-results/:id'])
  @RequirePermissions('traceability:read')
  @ApiOperation({ summary: 'Get single test result record by ID or Serial Number' })
  async getTestResultById(@Param('id') id: string) {
    return await this.traceabilityService.getTestResultById(id);
  }

  @Get('device-details')
  @RequirePermissions('traceability:read')
  @ApiOperation({ summary: 'Flow 1: Query detailed device test telemetry, parameter statistics (Min/Max/Avg) and memory map' })
  @ApiQuery({ name: 'serialNumber', required: false })
  @ApiQuery({ name: 'deviceKey', required: false })
  @ApiQuery({ name: 'testId', required: false })
  @ApiQuery({ name: 'startTime', required: false })
  @ApiQuery({ name: 'endTime', required: false })
  async getDeviceTestDetails(@Query() query: QueryDeviceDetailsDto) {
    const key =
      query.serialNumber ||
      (query as any).serial_number ||
      query.deviceKey ||
      (query as any).device_key ||
      query.testId ||
      (query as any).test_id ||
      '';
    return await this.traceabilityService.getDeviceTestDetails(key, query);
  }

  @Get(['export', 'export-csv'])
  @RequirePermissions('traceability:read')
  @ApiOperation({ summary: 'Export test results to CSV file' })
  async exportCsv(@Query() query: QueryTestResultsDto, @Res() res: Response) {
    const csvContent = await this.traceabilityService.exportCsv(query);
    const fileName = `test-results-${new Date().toISOString().substring(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(200).send(csvContent);
  }

  @Post(['results', 'test-results'])
  @RequirePermissions('traceability:manage')
  @ApiOperation({ summary: 'Record or sync a new device test result' })
  async recordTestResult(@Body() dto: Partial<TestResultEntity>) {
    return await this.traceabilityService.recordTestResult(dto);
  }

  @Post(['seed', 'seed-sample'])
  @RequirePermissions('traceability:manage')
  @ApiOperation({ summary: 'Seed representative baseline data if needed' })
  async seedRepresentativeBaselineData() {
    await this.traceabilityService.seedRepresentativeBaselineData();
    return { success: true, message: 'Representative baseline data seeded successfully.' };
  }

  @Post('decode-config')
  @RequirePermissions('traceability:read')
  @ApiOperation({ summary: 'Helper endpoint to decode Modbus/LoRa register configuration string into human-readable map' })
  decodeConfig(
    @Body()
    body: {
      configurationString: string;
      parametersNameString: string;
      parametersType: string;
      parametersLengthString: string;
    },
  ) {
    return this.traceabilityService.decodeFinalConfig(
      body.configurationString,
      body.parametersNameString,
      body.parametersType,
      body.parametersLengthString,
    );
  }
}
