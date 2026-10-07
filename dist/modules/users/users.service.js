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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const typeorm_1 = require("typeorm");
const dynamic_database_service_1 = require("../database/dynamic-database.service");
const user_entity_1 = require("./entities/user.entity");
const role_entity_1 = require("../roles-permissions/entities/role.entity");
const permission_entity_1 = require("../roles-permissions/entities/permission.entity");
let UsersService = class UsersService {
    constructor(dbService) {
        this.dbService = dbService;
    }
    getUserRepo() {
        return this.dbService.getRepositoryForTable('users', user_entity_1.User);
    }
    getRoleRepo() {
        return this.dbService.getRepositoryForTable('roles', role_entity_1.Role);
    }
    getPermissionRepo() {
        return this.dbService.getRepositoryForTable('permission', permission_entity_1.Permission);
    }
    async createUser(dto, creator) {
        const repo = this.getUserRepo();
        const userEmail = dto.email?.trim() || `${dto.username.toLowerCase().trim()}@daviteq.local`;
        const existing = await repo.findOne({
            where: [{ username: dto.username }, { email: userEmail }],
        });
        if (existing) {
            throw new common_1.ConflictException('Username or Email already exists');
        }
        if (dto.userType === user_entity_1.UserType.ADMIN && creator.userType !== user_entity_1.UserType.ADMIN) {
            throw new common_1.ForbiddenException('Only Super Admin can create ADMIN users');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = repo.create({
            username: dto.username.trim(),
            email: userEmail,
            passwordHash,
            fullName: dto.fullName?.trim() || dto.username.trim(),
            userType: dto.userType || user_entity_1.UserType.USER,
            createdById: creator.id,
            isActive: true,
        });
        if (dto.roleIds && dto.roleIds.length > 0) {
            user.roles = await this.getRoleRepo().findBy({ id: (0, typeorm_1.In)(dto.roleIds) });
        }
        const saved = await repo.save(user);
        delete saved.passwordHash;
        return saved;
    }
    async findAllUsers() {
        const repo = this.getUserRepo();
        try {
            return await repo.find({
                relations: ['roles', 'roles.permissions'],
                order: { createdAt: 'DESC' },
            });
        }
        catch (e) {
            return await repo.find({
                order: { createdAt: 'DESC' },
            });
        }
    }
    async findOneUser(id) {
        const repo = this.getUserRepo();
        let user = null;
        try {
            user = await repo.findOne({
                where: { id },
                relations: ['roles', 'roles.permissions'],
            });
        }
        catch (e) {
            user = await repo.findOne({
                where: { id },
            });
        }
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }
    async updateUserPermissions(id, dto) {
        const repo = this.getUserRepo();
        const user = await this.findOneUser(id);
        if (dto.isActive !== undefined) {
            user.isActive = dto.isActive;
        }
        if (dto.roleIds) {
            user.roles = await this.getRoleRepo().findBy({ id: (0, typeorm_1.In)(dto.roleIds) });
        }
        const saved = await repo.save(user);
        delete saved.passwordHash;
        return saved;
    }
    async deleteUser(id) {
        const repo = this.getUserRepo();
        const user = await this.findOneUser(id);
        if (user.userType === user_entity_1.UserType.ADMIN) {
            throw new common_1.ForbiddenException('Cannot delete primary Admin account');
        }
        await repo.remove(user);
        return { success: true, message: `User ${id} removed successfully` };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dynamic_database_service_1.DynamicDatabaseService])
], UsersService);
//# sourceMappingURL=users.service.js.map