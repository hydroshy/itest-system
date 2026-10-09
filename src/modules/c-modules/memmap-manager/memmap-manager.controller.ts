import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { MemmapManagerService } from './memmap-manager.service';

@ApiTags('C-Module: Memory Map Manager')
@Controller(['api/c-modules/memmap-manager', 'api/memmap-manager'])
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MemmapManagerController {
  constructor(private readonly memmapManagerService: MemmapManagerService) {}

  @Get()
  @ApiOperation({ summary: 'List all stored Memory Map payloads' })
  async findAll() {
    const data = await this.memmapManagerService.findAll();
    return { success: true, data };
  }

  @Get(':id/regs')
  @ApiOperation({ summary: 'Get 16-field Modbus register definitions for a specific Memory Map' })
  @ApiParam({ name: 'id', description: 'UUID of the memory map payload' })
  async getRegistersByPayloadId(@Param('id') id: string) {
    const data = await this.memmapManagerService.getRegistersByPayloadId(id);
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Permanently delete a Memory Map payload and cascade all its register rows' })
  @ApiParam({ name: 'id', description: 'UUID of the memory map payload to delete' })
  async deletePayload(@Param('id') id: string) {
    return await this.memmapManagerService.deletePayload(id);
  }
}
