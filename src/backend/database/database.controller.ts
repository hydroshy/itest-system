import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DynamicDatabaseService } from './dynamic-database.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserType } from '../../modules/users/entities/user.entity';

@ApiTags('Database Health & Dynamic Routing (Super Admin Only)')
@ApiBearerAuth()
@Controller('database')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DatabaseController {
  constructor(private readonly dbService: DynamicDatabaseService) {}

  @Get('health')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Get visual database health status & table metrics (Super Admin only)' })
  async getDatabaseHealth() {
    return this.dbService.getDatabaseHealth();
  }

  @Get('status')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Get raw connection pool status and table routing table' })
  async getConnectionStatus() {
    return this.dbService.getConnectionStatus();
  }

  @Post('reload')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Hot-reload routing configuration from db-routing.config.json' })
  async reloadConfig() {
    await this.dbService.loadConfigAndInitializeDataSources();
    return {
      success: true,
      message: 'Database routing configuration reloaded successfully',
      status: this.dbService.getConnectionStatus(),
    };
  }
}
