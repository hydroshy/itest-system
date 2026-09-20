import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { TestBuilderService } from './test-builder.service';
import {
  CreateTestTemplateDto,
  UpdateTestTemplateDto,
  DryRunTestDto,
  ValidateFlowDto,
  ExecuteFlowDto,
  ExtractDecoderFieldsDto,
} from './dto/test-builder.dto';

@ApiTags('C-Module: LoRaWAN Test Builder & Automation')
@Controller(['api/test-builder', 'api/c-modules/test-builder'])
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TestBuilderController {
  constructor(private readonly testBuilderService: TestBuilderService) {}

  @Get('templates')
  @ApiOperation({ summary: 'Get all test templates with assertions' })
  async findAll() {
    return await this.testBuilderService.findAll();
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get test template details with assertions' })
  async findOne(@Param('id') id: string) {
    return await this.testBuilderService.findOne(id);
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create new test template (Visual Flow / Custom Script)' })
  async create(@Body() dto: CreateTestTemplateDto, @CurrentUser() user: User) {
    try {
      const author = user?.username || user?.fullName || 'admin';
      return await this.testBuilderService.create(dto, author);
    } catch (err: any) {
      throw new HttpException(
        err.message || 'Failed to create test template',
        err.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('templates/sanitize')
  @ApiOperation({ summary: 'Sanitize and migrate existing test templates and assertions to English' })
  async sanitizeTemplates() {
    try {
      return await this.testBuilderService.sanitizeExistingTemplates();
    } catch (err: any) {
      throw new HttpException(
        err.message || 'Failed to sanitize test templates',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Update test template' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTestTemplateDto,
    @CurrentUser() user: User,
  ) {
    try {
      const author = user?.username || user?.fullName || 'admin';
      return await this.testBuilderService.update(id, dto, author);
    } catch (err: any) {
      throw new HttpException(
        err.message || 'Failed to update test template',
        err.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete test template' })
  async remove(@Param('id') id: string) {
    return await this.testBuilderService.remove(id);
  }

  @Get('available-fields')
  @ApiOperation({ summary: 'Get available telemetry fields from SKU and firmware version' })
  @ApiQuery({ name: 'sku', required: false })
  @ApiQuery({ name: 'firmwareVersion', required: false })
  async getAvailableFields(
    @Query('sku') sku?: string,
    @Query('firmwareVersion') firmwareVersion?: string,
  ) {
    return await this.testBuilderService.getAvailableFields(sku, firmwareVersion);
  }

  @Post('extract-decoder-fields')
  @ApiOperation({ summary: 'Extract telemetry fields directly from raw JavaScript decoder code (AST + Dynamic VM Sandbox)' })
  async extractDecoderFields(@Body() dto: ExtractDecoderFieldsDto) {
    try {
      return this.testBuilderService.extractFieldsFromRawCode(dto.decoderCode);
    } catch (err: any) {
      throw new HttpException(
        err.message || 'Failed to extract decoder fields',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('dry-run')
  @ApiOperation({ summary: 'Dry-run test template in sandbox with mock packet' })
  async dryRun(@Body() dto: DryRunTestDto) {
    try {
      return await this.testBuilderService.dryRun(dto);
    } catch (err: any) {
      throw new HttpException(
        err.message || 'Dry-run execution error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('flow/validate')
  @ApiOperation({ summary: 'Validate Visual Flow graph configuration (DAG cycle detection, connectivity)' })
  async validateFlow(@Body() dto: ValidateFlowDto) {
    try {
      return this.testBuilderService.validateFlowConfig(dto.flowConfig as any);
    } catch (err: any) {
      throw new HttpException(
        err.message || 'Flow configuration validation error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('flow/execute')
  @ApiOperation({ summary: 'Execute Visual Flow graph directly in Graph DAG Engine' })
  async executeFlow(@Body() dto: ExecuteFlowDto) {
    try {
      return await this.testBuilderService.executeFlowGraph(
        dto.flowConfig as any,
        dto.mockPacket || {},
        dto.context || {},
      );
    } catch (err: any) {
      throw new HttpException(
        err.message || 'Flow graph execution error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
