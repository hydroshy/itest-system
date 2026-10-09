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
var MemmapManagerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemmapManagerService = void 0;
const common_1 = require("@nestjs/common");
const memmap_manager_repository_1 = require("./memmap-manager.repository");
let MemmapManagerService = MemmapManagerService_1 = class MemmapManagerService {
    constructor(repository) {
        this.repository = repository;
        this.logger = new common_1.Logger(MemmapManagerService_1.name);
    }
    async findAll() {
        return await this.repository.findAllPayloads();
    }
    async getRegistersByPayloadId(id) {
        const cleanId = (id || '').trim();
        const result = await this.repository.findPayloadWithRegs(cleanId);
        if (!result) {
            throw new common_1.NotFoundException(`Memory map payload with ID '${cleanId}' not found`);
        }
        return result;
    }
    async deletePayload(id) {
        const cleanId = (id || '').trim();
        const deleted = await this.repository.deletePayload(cleanId);
        if (!deleted) {
            throw new common_1.NotFoundException(`Memory map payload with ID '${cleanId}' not found`);
        }
        this.logger.log(`Deleted Memory Map [${deleted.id}] SKU [${deleted.sku}] Short FW [${deleted.short_fw}] Long FW [${deleted.long_fw || ''}]`);
        return {
            success: true,
            message: 'Memory map deleted successfully',
            data: {
                id: deleted.id,
                sku: deleted.sku,
                longFw: deleted.long_fw || String(deleted.short_fw),
                shortFw: deleted.short_fw,
            },
        };
    }
};
exports.MemmapManagerService = MemmapManagerService;
exports.MemmapManagerService = MemmapManagerService = MemmapManagerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [memmap_manager_repository_1.MemmapManagerRepository])
], MemmapManagerService);
//# sourceMappingURL=memmap-manager.service.js.map