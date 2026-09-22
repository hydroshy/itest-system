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
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { SensorTypesService } from './sensor-types.service';
import {
  CreateSensorTypeDto,
  UpdateSensorTypeDto,
  QuerySensorTypeDto,
} from './dto/sensor-type.dto';

@ApiTags('LoRaWAN Sensor Types (C-Module)')
@Controller(['api/sensor-types', 'api/c-modules/sensor-types'])
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SensorTypesController {
  constructor(private readonly service: SensorTypesService) {}

  @Get()
  @ApiOperation({ summary: 'List all LoRaWAN Sensor Type mappings with search and pagination' })
  async findAll(@Query() query: QuerySensorTypeDto) {
    return await this.service.findAll(query);
  }

  @Get('resolve/:code')
  @ApiOperation({ summary: 'Resolve LoRaWAN SKU, Region, Class from Modbus Sensor Type decimal code' })
  async resolveSku(@Param('code', ParseIntPipe) code: number) {
    return await this.service.resolveSku(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single sensor type mapping by ID' })
  async findOne(@Param('id') id: string) {
    return await this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new Sensor Type to LoRaWAN SKU mapping' })
  async create(@Body() dto: CreateSensorTypeDto) {
    return await this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing Sensor Type mapping' })
  async update(@Param('id') id: string, @Body() dto: UpdateSensorTypeDto) {
    return await this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Sensor Type mapping' })
  async remove(@Param('id') id: string) {
    return await this.service.remove(id);
  }
}
