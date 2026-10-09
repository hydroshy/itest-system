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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MemmapManagerRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemmapManagerRepository = void 0;
const common_1 = require("@nestjs/common");
const dynamic_database_service_1 = require("../../database/dynamic-database.service");
const memmap_payload_entity_1 = require("../memmap-upload/entities/memmap-payload.entity");
const memmap_reg_entity_1 = require("../memmap-upload/entities/memmap-reg.entity");
const memmap_upload_repository_1 = require("../memmap-upload/memmap-upload.repository");
let MemmapManagerRepository = MemmapManagerRepository_1 = class MemmapManagerRepository {
    constructor(dbService) {
        this.dbService = dbService;
        this.logger = new common_1.Logger(MemmapManagerRepository_1.name);
    }
    getPayloadRepo() {
        if (!this.dbService)
            return null;
        try {
            return this.dbService.getRepositoryForTable('memmap_payload', memmap_payload_entity_1.MemmapPayloadEntity);
        }
        catch {
            return null;
        }
    }
    getRegRepo() {
        if (!this.dbService)
            return null;
        try {
            return this.dbService.getRepositoryForTable('memmap_regs', memmap_reg_entity_1.MemmapRegEntity);
        }
        catch {
            return null;
        }
    }
    get memoryPayloads() {
        return memmap_upload_repository_1.MemmapUploadRepository.sharedMemoryPayloads;
    }
    get memoryRegs() {
        return memmap_upload_repository_1.MemmapUploadRepository.sharedMemoryRegs;
    }
    async findAllPayloads() {
        const payloadRepo = this.getPayloadRepo();
        if (payloadRepo) {
            try {
                return await payloadRepo.find({ order: { created_at: 'DESC' } });
            }
            catch (err) {
                this.logger.debug(`Database findAllPayloads failed, using memory fallback: ${err.message}`);
            }
        }
        return Array.from(this.memoryPayloads.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    async findPayloadWithRegs(id) {
        const payloadRepo = this.getPayloadRepo();
        const regRepo = this.getRegRepo();
        if (payloadRepo) {
            try {
                const payload = await payloadRepo.findOne({ where: { id } });
                if (payload) {
                    const registers = regRepo
                        ? await regRepo.find({ where: { payload_id: id }, order: { no: 'ASC' } })
                        : [];
                    return { payload, registers };
                }
            }
            catch (err) {
                this.logger.debug(`Database findPayloadWithRegs failed: ${err.message}`);
            }
        }
        for (const [key, p] of this.memoryPayloads.entries()) {
            if (p.id === id) {
                const registers = this.memoryRegs.get(key) || [];
                return { payload: p, registers: [...registers].sort((a, b) => a.no - b.no) };
            }
        }
        return null;
    }
    async deletePayload(id) {
        const payloadRepo = this.getPayloadRepo();
        const regRepo = this.getRegRepo();
        if (payloadRepo) {
            try {
                const payload = await payloadRepo.findOne({ where: { id } });
                if (payload) {
                    if (regRepo) {
                        await regRepo.delete({ payload_id: id });
                    }
                    await payloadRepo.delete({ id });
                    for (const [key, p] of this.memoryPayloads.entries()) {
                        if (p.id === id) {
                            this.memoryPayloads.delete(key);
                            this.memoryRegs.delete(key);
                        }
                    }
                    return payload;
                }
            }
            catch (err) {
                this.logger.debug(`Database deletePayload failed, falling back to memory: ${err.message}`);
            }
        }
        for (const [key, p] of this.memoryPayloads.entries()) {
            if (p.id === id) {
                this.memoryPayloads.delete(key);
                this.memoryRegs.delete(key);
                return p;
            }
        }
        return null;
    }
};
exports.MemmapManagerRepository = MemmapManagerRepository;
exports.MemmapManagerRepository = MemmapManagerRepository = MemmapManagerRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [dynamic_database_service_1.DynamicDatabaseService])
], MemmapManagerRepository);
//# sourceMappingURL=memmap-manager.repository.js.map