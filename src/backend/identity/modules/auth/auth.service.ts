import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DynamicDatabaseService } from '../../../database/dynamic-database.service';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly dbService: DynamicDatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  private getUserRepository() {
    return this.dbService.getRepositoryForTable('users', User);
  }

  async validateUser(usernameOrEmail: string, pass: string): Promise<User> {
    const repo = this.getUserRepository();
    let user: User | null = null;

    try {
      user = await repo
        .createQueryBuilder('user')
        .addSelect('user.passwordHash')
        .leftJoinAndSelect('user.roles', 'roles')
        .leftJoinAndSelect('roles.permissions', 'permissions')
        .where('user.username = :val OR user.email = :val', { val: usernameOrEmail })
        .getOne();
    } catch (err: any) {
      this.logger.warn(`Could not join roles/permissions (${err.message}). Falling back to primary user query.`);
      user = await repo
        .createQueryBuilder('user')
        .addSelect('user.passwordHash')
        .where('user.username = :val OR user.email = :val', { val: usernameOrEmail })
        .getOne();
    }

    if (!user) {
      throw new UnauthorizedException('Invalid username/email or password');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid username/email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been suspended');
    }

    delete user.passwordHash;
    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.usernameOrEmail, loginDto.password);
    const permissions = new Set<string>();

    if (user.roles) {
      for (const role of user.roles) {
        if (role.permissions) {
          for (const perm of role.permissions) {
            permissions.add(perm.name);
          }
        }
      }
    }

    const payload = {
      sub: user.id,
      username: user.username,
      roles: user.roles?.map((r) => r.code) || [],
      permissions: Array.from(permissions),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        userType: user.userType,
        roles: user.roles,
        permissions: Array.from(permissions),
      },
    };
  }
}
