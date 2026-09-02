import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../modules/users/entities/user.entity';
import { FeaturesService, CreateFeatureDto, UpdateFeatureDto } from './features.service';

@ApiTags('Dashboard Feature Modules & RBAC Management')
@Controller('api/features')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  @Get()
  @ApiOperation({ summary: 'Get accessible feature modules for the logged in user' })
  getAccessibleFeatures(@CurrentUser() user: User) {
    return this.featuresService.getAccessibleFeatures(user);
  }

  @Get('all')
  @ApiOperation({ summary: 'Admin: Get all configured feature modules' })
  getAllModules(@CurrentUser() user: User) {
    return this.featuresService.getAllModules();
  }

  @Post()
  @ApiOperation({ summary: 'Admin: Create a new dashboard feature module' })
  createModule(@Body() dto: CreateFeatureDto) {
    try {
      return this.featuresService.createModule(dto);
    } catch (err: any) {
      throw new HttpException(err.message || 'Failed to create module', HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Admin: Update an existing dashboard feature module' })
  updateModule(@Param('id') id: string, @Body() dto: UpdateFeatureDto) {
    try {
      return this.featuresService.updateModule(id, dto);
    } catch (err: any) {
      throw new HttpException(err.message || 'Failed to update module', HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: Delete a feature module' })
  deleteModule(@Param('id') id: string) {
    try {
      return this.featuresService.deleteModule(id);
    } catch (err: any) {
      throw new HttpException(err.message || 'Failed to delete module', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('reset-defaults')
  @ApiOperation({ summary: 'Admin: Reset all feature modules to standard default registry' })
  resetDefaults() {
    return this.featuresService.resetToDefaults();
  }
}
