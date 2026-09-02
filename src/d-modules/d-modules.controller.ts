import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../modules/users/entities/user.entity';
import { DModulesService, CreateDModuleDto, UpdateDModuleDto } from './d-modules.service';

@ApiTags('Dashboard D-Modules & RBAC Management')
@Controller('api/d-modules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DModulesController {
  constructor(private readonly dModulesService: DModulesService) {}

  @Get()
  @ApiOperation({ summary: 'Get accessible dashboard modules (D-Modules) for the logged in user' })
  getAccessibleModules(@CurrentUser() user: User) {
    return this.dModulesService.getAccessibleModules(user);
  }

  @Get('all')
  @ApiOperation({ summary: 'Admin: Get all configured dashboard modules (D-Modules)' })
  getAllModules(@CurrentUser() user: User) {
    return this.dModulesService.getAllModules();
  }

  @Post()
  @ApiOperation({ summary: 'Admin: Create a new dashboard module (D-Module)' })
  createModule(@Body() dto: CreateDModuleDto) {
    try {
      return this.dModulesService.createModule(dto);
    } catch (err: any) {
      throw new HttpException(err.message || 'Failed to create D-Module', HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Admin: Update an existing dashboard module (D-Module)' })
  updateModule(@Param('id') id: string, @Body() dto: UpdateDModuleDto) {
    try {
      return this.dModulesService.updateModule(id, dto);
    } catch (err: any) {
      throw new HttpException(err.message || 'Failed to update D-Module', HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: Delete a dashboard module (D-Module)' })
  deleteModule(@Param('id') id: string) {
    try {
      return this.dModulesService.deleteModule(id);
    } catch (err: any) {
      throw new HttpException(err.message || 'Failed to delete D-Module', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('reset-defaults')
  @ApiOperation({ summary: 'Admin: Reset all D-Modules to standard default registry' })
  resetDefaults() {
    return this.dModulesService.resetToDefaults();
  }
}
