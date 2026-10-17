import { Injectable, UnauthorizedException, ConflictException, Logger, OnModuleInit, OnApplicationBootstrap, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DynamicDatabaseService } from '../../../database/dynamic-database.service';
import { User, UserType } from '../users/entities/user.entity';
import { Role } from '../roles-permissions/entities/role.entity';
import { Permission } from '../roles-permissions/entities/permission.entity';
import { RolesService } from '../roles-permissions/roles.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService implements OnModuleInit, OnApplicationBootstrap {
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
      // Will retry on application bootstrap
    }
  }

  async onApplicationBootstrap() {
    try {
      await this.rolesService.seedDefaults();
      await this.seedAdminUser();
    } catch (e: any) {
      this.logger.warn(`Could not seed default admin user on application bootstrap: ${e.message}`);
    }
  }

  public async seedAdminUser() {
    let ds: any;
    try {
      ds = this.dbService.getDataSourceForTable('users');
    } catch (e: any) {
      return;
    }

    if (!ds || !ds.isInitialized) return;

    await this.rolesService.seedDefaults();

    const defaultUsername = 'admin';
    const defaultPassword = 'Dvt@123';
    const defaultEmail = 'admin@daviteq.com';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    try {
      // 1. Insert or update Admin user
      const userResult = await ds.query(
        `INSERT INTO "users" ("username", "email", "passwordHash", "fullName", "userType", "isActive")
         VALUES ($1, $2, $3, 'Daviteq Super Administrator', 'ADMIN', true)
         ON CONFLICT ("username") DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", "userType" = 'ADMIN', "isActive" = true
         RETURNING "id";`,
        [defaultUsername, defaultEmail, passwordHash],
      );
      const adminUserId = userResult[0]?.id;

      // 2. Link Admin user to SUPER_ADMIN role
      const roleResult = await ds.query(`SELECT "id" FROM "roles" WHERE "code" = 'SUPER_ADMIN' LIMIT 1;`);
      const superAdminRoleId = roleResult[0]?.id;

      if (adminUserId && superAdminRoleId) {
        await ds.query(
          `INSERT INTO "user_role" ("user_id", "role_id")
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING;`,
          [adminUserId, superAdminRoleId],
        ).catch(() => {});
      }

      this.logger.log(`✅ Default Super Admin account verified & bound to SUPER_ADMIN role: [${defaultUsername} / ${defaultPassword}]`);
    } catch (err: any) {
      this.logger.warn(`seedAdminUser SQL notice: ${err.message}`);
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
    try {
      await this.rolesService.seedDefaults();
    } catch (err: any) {
      this.logger.warn(`Could not seed default roles: ${err.message}`);
    }

    const repo = this.getUserRepository();
    const roleRepo = this.dbService.getRepositoryForTable('roles', Role);
    const defaultUsername = username || 'admin';
    const defaultEmail = email || 'admin@daviteq.com';
    const defaultPass = pass || 'Dvt@123';

    let superAdminRole: Role | null = null;
    try {
      superAdminRole = await roleRepo.findOne({ where: { code: 'SUPER_ADMIN' } });
    } catch (e: any) {
      this.logger.warn(`Role lookup warning: ${e.message}`);
    }

    const passwordHash = await bcrypt.hash(defaultPass, 10);

    let admin: User | null = null;
    try {
      admin = await repo.findOne({
        where: [{ username: defaultUsername }, { email: defaultEmail }],
        relations: ['roles'],
      });
    } catch (e) {
      admin = await repo.findOne({
        where: [{ username: defaultUsername }, { email: defaultEmail }],
      });
    }

    if (admin) {
      admin.passwordHash = passwordHash;
      admin.email = defaultEmail;
      admin.userType = UserType.ADMIN;
      admin.isActive = true;
      if (superAdminRole) {
        admin.roles = [superAdminRole];
      }
      await repo.save(admin);
    } else {
      admin = repo.create({
        username: defaultUsername,
        email: defaultEmail,
        passwordHash,
        fullName: 'Daviteq Super Administrator',
        userType: UserType.ADMIN,
        isActive: true,
        roles: superAdminRole ? [superAdminRole] : [],
      });
      await repo.save(admin);
    }

    this.logger.log(`✅ Super Admin account registered/updated: [${defaultUsername} / ${defaultPass}]`);

    return {
      success: true,
      message: `Admin user '${defaultUsername}' initialized successfully with default credentials`,
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        userType: admin.userType,
        roles: admin.roles?.map((r) => r.code) || (superAdminRole ? [superAdminRole.code] : ['SUPER_ADMIN']),
      },
    };
  }
}
