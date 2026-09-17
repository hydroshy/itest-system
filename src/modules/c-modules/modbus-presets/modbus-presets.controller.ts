import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { ModbusPresetsService } from './modbus-presets.service';
import { CreateModbusPresetDto, UpdateModbusPresetDto } from './dto/modbus-preset.dto';

@ApiTags('C-Module: Modbus Presets & Templates Manager')
@Controller(['api/modbus-presets', 'api/c-modules/modbus-presets'])
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ModbusPresetsController {
  constructor(private readonly presetsService: ModbusPresetsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all Modbus presets & templates' })
  async findAll() {
    return this.presetsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific Modbus preset by ID' })
  async findOne(@Param('id') id: string) {
    return this.presetsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new Modbus preset / template' })
  async create(@Body() dto: CreateModbusPresetDto, @CurrentUser() user: User) {
    try {
      const username = user?.username || user?.fullName || 'admin';
      return await this.presetsService.create(dto, username);
    } catch (err: any) {
      throw new HttpException(err.message || 'Failed to create preset', HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing Modbus preset' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateModbusPresetDto,
    @CurrentUser() user: User,
  ) {
    try {
      const username = user?.username || user?.fullName || 'admin';
      return await this.presetsService.update(id, dto, username);
    } catch (err: any) {
      throw new HttpException(err.message || 'Failed to update preset', HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Modbus preset' })
  async delete(@Param('id') id: string) {
    try {
      return await this.presetsService.delete(id);
    } catch (err: any) {
      throw new HttpException(err.message || 'Failed to delete preset', HttpStatus.BAD_REQUEST);
    }
  }
}
