import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { User, UserType } from '../users/entities/user.entity';
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
    const user = await repo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .leftJoinAndSelect('user.directPermissions', 'directPermissions')
      .where('user.username = :val OR user.email = :val', { val: usernameOrEmail })
      .getOne();

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

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      userType: user.userType,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        userType: user.userType,
        roles: user.roles?.map((r) => r.code) || [],
      },
    };
  }

  async registerInitialAdmin(username: string, email: string, pass: string) {
    const repo = this.getUserRepository();
    const count = await repo.count();
    if (count > 0) {
      throw new ConflictException('System already initialized. Initial admin creation forbidden.');
    }

    const passwordHash = await bcrypt.hash(pass, 10);
    const admin = repo.create({
      username,
      email,
      passwordHash,
      fullName: 'Super Admin',
      userType: UserType.ADMIN,
      isActive: true,
    });

    await repo.save(admin);
    this.logger.log(`Initial Super Admin account created: ${username}`);
    return admin;
  }
}
