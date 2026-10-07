"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const dynamic_database_service_1 = require("../database/dynamic-database.service");
const user_entity_1 = require("../users/entities/user.entity");
const role_entity_1 = require("../roles-permissions/entities/role.entity");
const roles_service_1 = require("../roles-permissions/roles.service");
let AuthService = AuthService_1 = class AuthService {
    constructor(dbService, jwtService, rolesService) {
        this.dbService = dbService;
        this.jwtService = jwtService;
        this.rolesService = rolesService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    getUserRepository() {
        return this.dbService.getRepositoryForTable('users', user_entity_1.User);
    }
    async onModuleInit() {
        try {
            await this.rolesService.seedDefaults();
            await this.seedAdminUser();
        }
        catch (e) {
        }
    }
    async onApplicationBootstrap() {
        try {
            await this.rolesService.seedDefaults();
            await this.seedAdminUser();
        }
        catch (e) {
            this.logger.warn(`Could not seed default admin user on application bootstrap: ${e.message}`);
        }
    }
    async seedAdminUser() {
        let ds;
        try {
            ds = this.dbService.getDataSourceForTable('users');
        }
        catch (e) {
            return;
        }
        if (!ds || !ds.isInitialized)
            return;
        await this.rolesService.seedDefaults();
        const defaultUsername = 'admin';
        const defaultPassword = 'Dvt@123';
        const defaultEmail = 'admin@daviteq.com';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);
        try {
            const userResult = await ds.query(`INSERT INTO "users" ("username", "email", "passwordHash", "fullName", "userType", "isActive")
         VALUES ($1, $2, $3, 'Daviteq Super Administrator', 'ADMIN', true)
         ON CONFLICT ("username") DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", "userType" = 'ADMIN', "isActive" = true
         RETURNING "id";`, [defaultUsername, defaultEmail, passwordHash]);
            const adminUserId = userResult[0]?.id;
            const roleResult = await ds.query(`SELECT "id" FROM "roles" WHERE "code" = 'SUPER_ADMIN' LIMIT 1;`);
            const superAdminRoleId = roleResult[0]?.id;
            if (adminUserId && superAdminRoleId) {
                await ds.query(`INSERT INTO "user_role" ("user_id", "role_id")
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING;`, [adminUserId, superAdminRoleId]).catch(() => { });
            }
            this.logger.log(`✅ Default Super Admin account verified & bound to SUPER_ADMIN role: [${defaultUsername} / ${defaultPassword}]`);
        }
        catch (err) {
            this.logger.warn(`seedAdminUser SQL notice: ${err.message}`);
        }
    }
    async validateUser(usernameOrEmail, pass) {
        const repo = this.getUserRepository();
        let user = null;
        try {
            user = await repo
                .createQueryBuilder('user')
                .addSelect('user.passwordHash')
                .leftJoinAndSelect('user.roles', 'roles')
                .leftJoinAndSelect('roles.permissions', 'permissions')
                .where('user.username = :val OR user.email = :val', { val: usernameOrEmail })
                .getOne();
        }
        catch (err) {
            this.logger.warn(`Could not join roles/permissions (${err.message}). Falling back to primary user query.`);
            user = await repo
                .createQueryBuilder('user')
                .addSelect('user.passwordHash')
                .where('user.username = :val OR user.email = :val', { val: usernameOrEmail })
                .getOne();
        }
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid username/email or password');
        }
        const isMatch = await bcrypt.compare(pass, user.passwordHash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Invalid username/email or password');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account has been suspended');
        }
        delete user.passwordHash;
        return user;
    }
    async login(loginDto) {
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
    async registerInitialAdmin(username = 'admin', email = 'admin@daviteq.com', pass = 'Dvt@123') {
        try {
            await this.rolesService.seedDefaults();
        }
        catch (err) {
            this.logger.warn(`Could not seed default roles: ${err.message}`);
        }
        const repo = this.getUserRepository();
        const roleRepo = this.dbService.getRepositoryForTable('roles', role_entity_1.Role);
        const defaultUsername = username || 'admin';
        const defaultEmail = email || 'admin@daviteq.com';
        const defaultPass = pass || 'Dvt@123';
        let superAdminRole = null;
        try {
            superAdminRole = await roleRepo.findOne({ where: { code: 'SUPER_ADMIN' } });
        }
        catch (e) {
            this.logger.warn(`Role lookup warning: ${e.message}`);
        }
        const passwordHash = await bcrypt.hash(defaultPass, 10);
        let admin = null;
        try {
            admin = await repo.findOne({
                where: [{ username: defaultUsername }, { email: defaultEmail }],
                relations: ['roles'],
            });
        }
        catch (e) {
            admin = await repo.findOne({
                where: [{ username: defaultUsername }, { email: defaultEmail }],
            });
        }
        if (admin) {
            admin.passwordHash = passwordHash;
            admin.email = defaultEmail;
            admin.userType = user_entity_1.UserType.ADMIN;
            admin.isActive = true;
            if (superAdminRole) {
                admin.roles = [superAdminRole];
            }
            await repo.save(admin);
        }
        else {
            admin = repo.create({
                username: defaultUsername,
                email: defaultEmail,
                passwordHash,
                fullName: 'Daviteq Super Administrator',
                userType: user_entity_1.UserType.ADMIN,
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dynamic_database_service_1.DynamicDatabaseService,
        jwt_1.JwtService,
        roles_service_1.RolesService])
], AuthService);
//# sourceMappingURL=auth.service.js.map