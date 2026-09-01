import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, UserType } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserType.ADMIN, UserType.SUB_ADMIN)
  @RequirePermissions('users:create')
  async createUser(@Body() dto: CreateUserDto, @CurrentUser() creator: User) {
    return this.usersService.createUser(dto, creator);
  }

  @Get()
  @Roles(UserType.ADMIN, UserType.SUB_ADMIN)
  @RequirePermissions('users:read')
  async findAllUsers() {
    return this.usersService.findAllUsers();
  }

  @Get(':id')
  @Roles(UserType.ADMIN, UserType.SUB_ADMIN)
  @RequirePermissions('users:read')
  async findOneUser(@Param('id') id: string) {
    return this.usersService.findOneUser(id);
  }

  @Put(':id/permissions')
  @Roles(UserType.ADMIN)
  @RequirePermissions('users:permissions:update')
  async updateUserPermissions(@Param('id') id: string, @Body() dto: UpdateUserPermissionsDto) {
    return this.usersService.updateUserPermissions(id, dto);
  }

  @Delete(':id')
  @Roles(UserType.ADMIN)
  @RequirePermissions('users:delete')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
