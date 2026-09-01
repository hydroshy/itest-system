import { Injectable, UnauthorizedException, ConflictException, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { User, UserType } from '../users/entities/user.entity';
import { Role } from '../roles-permissions/entities/role.entity';
import { Permission } from '../roles-permissions/entities/permission.entity';
import { RolesService } from '../roles-permissions/roles.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly dbService: DynamicDatabaseService,
    private readonly jwtService: JwtService,
    private readonly rolesService: RolesService,
  ) {}

  private getUserRepository() {
    return this.dbService.getRepositoryForTable('users', User);
  }

  async onModuleInit() {
    try {
      await this.rolesService.seedDefaults();
      await this.seedAdminUser();
    } catch (e: any) {
      this.logger.warn(`Could not seed default admin user on module init: ${e.message}`);
    }
  }

  public async seedAdminUser() {
    await this.rolesService.seedDefaults();
    const userRepo = this.getUserRepository();
    const roleRepo = this.dbService.getRepositoryForTable('roles', Role);

    const defaultUsername = 'admin';
    const defaultPassword = 'Dvt@123';
    const defaultEmail = 'admin@daviteq.com';

    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const superAdminRole = await roleRepo.findOne({ where: { code: 'SUPER_ADMIN' } });

    const existingAdmin = await userRepo.findOne({
      where: [{ username: defaultUsername }, { email: defaultEmail }],
      relations: ['roles'],
    });

    if (!existingAdmin) {
      const admin = userRepo.create({
        username: defaultUsername,
        email: defaultEmail,
        passwordHash,
        fullName: 'Daviteq Super Administrator',
        userType: UserType.ADMIN,
        isActive: true,
        roles: superAdminRole ? [superAdminRole] : [],
      });
      await userRepo.save(admin);
      this.logger.log(`✅ Default Super Admin account initialized: [${defaultUsername} / ${defaultPassword}]`);
      return admin;
    } else {
      // Ensure password is Dvt@123 and superadmin role is present
      existingAdmin.passwordHash = passwordHash;
      existingAdmin.userType = UserType.ADMIN;
      existingAdmin.isActive = true;
      if (superAdminRole && (!existingAdmin.roles || !existingAdmin.roles.some((r) => r.code === 'SUPER_ADMIN'))) {
        existingAdmin.roles = [superAdminRole];
      }
      await userRepo.save(existingAdmin);
      this.logger.log(`✅ Verified and synced default Super Admin account: [${defaultUsername} / ${defaultPassword}]`);
      return existingAdmin;
    }
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

  async registerInitialAdmin(username: string = 'admin', email: string = 'admin@daviteq.com', pass: string = 'Dvt@123') {
    const repo = this.getUserRepository();
    const roleRepo = this.dbService.getRepositoryForTable('roles', Role);

    const superAdminRole = await roleRepo.findOne({ where: { code: 'SUPER_ADMIN' } });

    let admin = await repo.findOne({ where: [{ username }, { email }] });
    const passwordHash = await bcrypt.hash(pass, 10);

    if (admin) {
      admin.passwordHash = passwordHash;
      admin.email = email;
      admin.userType = UserType.ADMIN;
      admin.isActive = true;
      if (superAdminRole) admin.roles = [superAdminRole];
      await repo.save(admin);
    } else {
      admin = repo.create({
        username,
        email,
        passwordHash,
        fullName: 'Daviteq Super Administrator',
        userType: UserType.ADMIN,
        isActive: true,
        roles: superAdminRole ? [superAdminRole] : [],
      });
      await repo.save(admin);
    }

    this.logger.log(`Super Admin account registered/updated: ${username} / ${pass}`);
    delete admin.passwordHash;
    return {
      success: true,
      message: `Admin user '${username}' initialized successfully with default credentials`,
      user: admin,
    };
  }
}
