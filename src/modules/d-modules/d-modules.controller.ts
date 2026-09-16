import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { DModulesService, CreateDModuleDto, UpdateDModuleDto, SaveRoleLayoutDto } from './d-modules.service';

@ApiTags('Dashboard module Manager & Role Layout Designer')
@Controller(['api/d-modules', 'api/features', 'api/module-manager', 'api/dashboard-module-manager'])
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DModulesController {
  constructor(private readonly dModulesService: DModulesService) {}

  @Get('serial-memmap/profiles')
  @ApiOperation({ summary: 'Get Modbus memory map profiles for serial diagnostic' })
  getSerialProfiles() {
    return this.dModulesService.getModbusProfiles();
  }

  @Get('serial-memmap/registers')
  @ApiOperation({ summary: 'Get Modbus registers by SKU and firmware version' })
  getSerialRegisters(@Query('sku') sku: string, @Query('firmwareVersion') firmwareVersion?: number) {
    return this.dModulesService.getModbusRegisters(sku, firmwareVersion);
  }

  @Get()
  @ApiOperation({ summary: 'Get accessible dashboard modules for the logged in user (sorted by role layout)' })
  getAccessibleModules(@CurrentUser() user: User) {
    return this.dModulesService.getAccessibleModules(user);
  }

  @Get('all')
  @ApiOperation({ summary: 'Admin: Get all configured dashboard modules' })
  getAllModules() {
    return this.dModulesService.getAllModules();
  }

  @Get(['layouts', 'roles/layouts'])
  @ApiOperation({ summary: 'Admin: Get all role layout configurations' })
  getAllRoleLayouts() {
    return this.dModulesService.getAllRoleLayouts();
  }

  @Get(['roles/:roleCode/layout', 'layouts/:roleCode'])
  @ApiOperation({ summary: 'Admin: Get layout configuration for a specific role' })
  getRoleLayout(@Param('roleCode') roleCode: string) {
    return this.dModulesService.getRoleLayout(roleCode);
  }

  @Put(['roles/:roleCode/layout', 'layouts/:roleCode'])
  @ApiOperation({ summary: 'Admin: Save layout configuration (drag-and-drop order & disabled list) for a role' })
  saveRoleLayout(@Param('roleCode') roleCode: string, @Body() dto: SaveRoleLayoutDto) {
    try {
      return this.dModulesService.saveRoleLayout(roleCode, dto);
    } catch (err: any) {
      throw new HttpException(err.message || 'Failed to save role layout', HttpStatus.BAD_REQUEST);
    }
  }

  @Post(['roles/:roleCode/reset', 'layouts/:roleCode/reset'])
  @ApiOperation({ summary: 'Admin: Reset layout configuration for a role to defaults' })
  resetRoleLayout(@Param('roleCode') roleCode: string) {
    return this.dModulesService.resetRoleLayout(roleCode);
  }

  @Post()
  @ApiOperation({ summary: 'Admin: Create a new dashboard module' })
  createModule(@Body() dto: CreateDModuleDto) {
    try {
      return this.dModulesService.createModule(dto);
    } catch (err: any) {
      throw new HttpException(err.message || 'Failed to create module', HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Admin: Update an existing dashboard module' })
  updateModule(@Param('id') id: string, @Body() dto: UpdateDModuleDto) {
    try {
      return this.dModulesService.updateModule(id, dto);
    } catch (err: any) {
      throw new HttpException(err.message || 'Failed to update module', HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: Delete a dashboard module' })
  deleteModule(@Param('id') id: string) {
    try {
      return this.dModulesService.deleteModule(id);
    } catch (err: any) {
      throw new HttpException(err.message || 'Failed to delete module', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('reset-defaults')
  @ApiOperation({ summary: 'Admin: Reset all modules and role layouts to standard default registry' })
  resetDefaults() {
    return this.dModulesService.resetToDefaults();
  }
}
