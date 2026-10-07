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
var RolesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const dynamic_database_service_1 = require("../database/dynamic-database.service");
const role_entity_1 = require("./entities/role.entity");
const permission_entity_1 = require("./entities/permission.entity");
let RolesService = RolesService_1 = class RolesService {
    constructor(dbService) {
        this.dbService = dbService;
        this.logger = new common_1.Logger(RolesService_1.name);
    }
    getRoleRepo() {
        return this.dbService.getRepositoryForTable('roles', role_entity_1.Role);
    }
    getPermissionRepo() {
        return this.dbService.getRepositoryForTable('permission', permission_entity_1.Permission);
    }
    async onModuleInit() {
        try {
            await this.seedDefaults();
        }
        catch (e) {
        }
    }
    async onApplicationBootstrap() {
        try {
            await this.seedDefaults();
        }
        catch (e) {
            this.logger.warn(`Could not seed default roles/permissions on bootstrap: ${e.message}`);
        }
    }
    async seedDefaults() {
        let ds;
        try {
            ds = this.dbService.getDataSourceForTable('permission');
        }
        catch (e) {
            return;
        }
        if (!ds || !ds.isInitialized)
            return;
        try {
            await ds.query(`DELETE FROM "permission" WHERE "name" IS NULL OR "name" = '';`).catch(() => { });
            const defaultPerms = [
                { name: 'users:read', module: 'users', action: 'read', description: 'View User Directory' },
                { name: 'users:create', module: 'users', action: 'create', description: 'Create New User' },
                { name: 'users:permissions:update', module: 'users', action: 'update', description: 'Update User Permissions & Roles' },
                { name: 'users:delete', module: 'users', action: 'delete', description: 'Delete User' },
                { name: 'roles:read', module: 'roles', action: 'read', description: 'View Role Matrix' },
                { name: 'roles:manage', module: 'roles', action: 'manage', description: 'Create & Edit Roles' },
                { name: 'network_server:read', module: 'network_servers', action: 'read', description: 'View Network Servers (ThingPark, ChirpStack)' },
                { name: 'network_server:manage', module: 'network_servers', action: 'manage', description: 'Create & Edit Network Servers and Region Profiles' },
                { name: 'database:read', module: 'database', action: 'read', description: 'View Database Manager' },
                { name: 'database:manage', module: 'database', action: 'manage', description: 'Hot-Reload Database Config' },
                { name: 'lorawan:device:read', module: 'lorawan', action: 'read', description: 'View LoRaWAN Devices' },
                { name: 'lorawan:device:create', module: 'lorawan', action: 'create', description: 'Add New LoRaWAN Device' },
                { name: 'lorawan:device:update', module: 'lorawan', action: 'update', description: 'Edit LoRaWAN Device' },
                { name: 'lorawan:device:delete', module: 'lorawan', action: 'delete', description: 'Remove LoRaWAN Device' },
                { name: 'lorawan:device:manage', module: 'lorawan', action: 'manage', description: 'Full LoRaWAN Device Management' },
                { name: 'lorawan:telemetry:read', module: 'lorawan', action: 'read', description: 'View Live Telemetry Uplinks' },
                { name: 'lorawan:webhooks:read', module: 'lorawan', action: 'read', description: 'View Webhook Ingestion URLs' },
                { name: 'lorawan:decoder:read', module: 'lorawan', action: 'read', description: 'Access Payload Formatter Sandbox and View Decoders' },
                { name: 'lorawan:decoder:manage', module: 'lorawan', action: 'manage', description: 'Create, Edit and Delete Payload Decoders' },
                { name: 'item_codes:read', module: 'item_codes', action: 'read', description: 'View Item Code Catalog' },
                { name: 'item_codes:manage', module: 'item_codes', action: 'manage', description: 'Create, Edit & Delete Item Codes' },
                { name: 'sales_orders:read', module: 'sales_orders', action: 'read', description: 'View Sales Orders & Items' },
                { name: 'sales_orders:manage', module: 'sales_orders', action: 'manage', description: 'Create, Import & Manage Sales Orders' },
                { name: 'test_builder:read', module: 'test_builder', action: 'read', description: 'View Test Templates & Automation Flows' },
                { name: 'test_builder:manage', module: 'test_builder', action: 'manage', description: 'Create & Edit Test Templates & Assertion Rules' },
                { name: 'hmi_studio:read', module: 'hmi_studio', action: 'read', description: 'View HMI SCADA Screens & Synoptic Panels' },
                { name: 'hmi_studio:manage', module: 'hmi_studio', action: 'manage', description: 'Design, Edit & Delete HMI SCADA Screens' },
                { name: 'modbus_presets:read', module: 'modbus_presets', action: 'read', description: 'View Modbus Register Presets' },
                { name: 'modbus_presets:manage', module: 'modbus_presets', action: 'manage', description: 'Create, Edit & Import Modbus Presets' },
                { name: 'test_session:read', module: 'test_automation', action: 'read', description: 'View Product Test Sessions & Results' },
                { name: 'test_session:execute', module: 'test_automation', action: 'execute', description: 'Run & Execute Product Test Sessions' },
                { name: 'test_session:manage', module: 'test_automation', action: 'manage', description: 'Full Management of Product Test Sessions & Reports' },
                { name: 'lorawan:test_session:read', module: 'test_automation', action: 'read', description: 'View LoRaWAN Product Test Sessions' },
                { name: 'lorawan:test_session:execute', module: 'test_automation', action: 'execute', description: 'Execute LoRaWAN Product Test Sessions' },
                { name: 'traceability:read', module: 'traceability', action: 'read', description: 'View Test Results & QA Device Test Details' },
                { name: 'traceability:manage', module: 'traceability', action: 'manage', description: 'Manage QA Traceability Records & Seed Testing Telemetry' },
            ];
            for (const p of defaultPerms) {
                await ds.query(`INSERT INTO "permission" ("name", "module", "action", "description")
           VALUES ($1, $2, $3, $4)
           ON CONFLICT ("name") DO UPDATE SET "module" = EXCLUDED."module", "action" = EXCLUDED."action", "description" = EXCLUDED."description";`, [p.name, p.module, p.action, p.description]).catch(() => { });
            }
            const allPermRows = await ds.query(`SELECT "id", "name", "module" FROM "permission";`);
            const allPermIds = allPermRows.map((r) => r.id);
            const subAdminPermIds = allPermRows.filter((r) => !r.name.includes('users:permissions:update')).map((r) => r.id);
            const operatorPermIds = allPermRows.filter((r) => r.module === 'lorawan' || r.name.endsWith(':read')).map((r) => r.id);
            const superAdminResult = await ds.query(`INSERT INTO "roles" ("code", "name", "description")
         VALUES ('SUPER_ADMIN', 'Super Administrator', 'Full unhindered system access')
         ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description"
         RETURNING "id";`);
            const superAdminId = superAdminResult[0]?.id;
            if (superAdminId && allPermIds.length > 0) {
                for (const pId of allPermIds) {
                    await ds.query(`INSERT INTO "role_permissions" ("role_id", "permission_id")
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING;`, [superAdminId, pId]).catch(() => { });
                }
            }
            const subAdminResult = await ds.query(`INSERT INTO "roles" ("code", "name", "description")
         VALUES ('SUB_ADMIN', 'Sub-Administrator', 'Delegated administrative privileges')
         ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description"
         RETURNING "id";`);
            const subAdminId = subAdminResult[0]?.id;
            if (subAdminId && subAdminPermIds.length > 0) {
                for (const pId of subAdminPermIds) {
                    await ds.query(`INSERT INTO "role_permissions" ("role_id", "permission_id")
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING;`, [subAdminId, pId]).catch(() => { });
                }
            }
            const operatorResult = await ds.query(`INSERT INTO "roles" ("code", "name", "description")
         VALUES ('LORAWAN_OPERATOR', 'LoRaWAN Operator', 'Manage applications, devices, and gateways')
         ON CONFLICT ("code") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description"
         RETURNING "id";`);
            const operatorId = operatorResult[0]?.id;
            if (operatorId && operatorPermIds.length > 0) {
                for (const pId of operatorPermIds) {
                    await ds.query(`INSERT INTO "role_permissions" ("role_id", "permission_id")
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING;`, [operatorId, pId]).catch(() => { });
                }
            }
            this.logger.log('✅ Guaranteed presence and seeding of all RBAC permissions and default roles.');
        }
        catch (err) {
            this.logger.warn(`seedDefaults direct SQL notice: ${err.message}`);
        }
    }
    async findAllRoles() {
        return this.getRoleRepo().find({ relations: ['permissions'], order: { createdAt: 'ASC' } });
    }
    async findOneRole(id) {
        const role = await this.getRoleRepo().findOne({ where: { id }, relations: ['permissions'] });
        if (!role) {
            throw new common_1.NotFoundException(`Role with ID ${id} not found`);
        }
        return role;
    }
    async findAllPermissions() {
        return this.getPermissionRepo().find({ order: { module: 'ASC', name: 'ASC' } });
    }
    async createRole(code, name, description, permissionIds) {
        const roleRepo = this.getRoleRepo();
        const permRepo = this.getPermissionRepo();
        const normalizedCode = (code || '').toUpperCase().trim();
        if (normalizedCode === 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Cannot create another role with code SUPER_ADMIN');
        }
        const permissions = permissionIds && permissionIds.length > 0 ? await permRepo.findBy({ id: (0, typeorm_1.In)(permissionIds) }) : [];
        const role = roleRepo.create({ code: normalizedCode, name, description, permissions });
        return roleRepo.save(role);
    }
    async updateRole(id, name, description, permissionIds) {
        const roleRepo = this.getRoleRepo();
        const permRepo = this.getPermissionRepo();
        const role = await this.findOneRole(id);
        if (name)
            role.name = name;
        if (description !== undefined)
            role.description = description;
        if (permissionIds) {
            if (role.code === 'SUPER_ADMIN') {
                const allPerms = await permRepo.find();
                role.permissions = allPerms;
            }
            else {
                role.permissions = permissionIds.length > 0 ? await permRepo.findBy({ id: (0, typeorm_1.In)(permissionIds) }) : [];
            }
        }
        return roleRepo.save(role);
    }
    async deleteRole(id) {
        const roleRepo = this.getRoleRepo();
        const role = await this.findOneRole(id);
        if (role.code === 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('The SUPER_ADMIN role is an essential system role and cannot be deleted.');
        }
        await roleRepo.remove(role);
        return { success: true, message: `Role ${role.name} (${role.code}) deleted successfully` };
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = RolesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dynamic_database_service_1.DynamicDatabaseService])
], RolesService);
//# sourceMappingURL=roles.service.js.map