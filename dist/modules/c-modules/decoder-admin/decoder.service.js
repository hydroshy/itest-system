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
var DecoderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecoderService = void 0;
const common_1 = require("@nestjs/common");
const dynamic_database_service_1 = require("../../database/dynamic-database.service");
const decoder_entity_1 = require("./entities/decoder.entity");
const lorawan_resilience_service_1 = require("../../lorawan/services/lorawan-resilience.service");
const lorawan_utils_1 = require("../../lorawan/common/lorawan-utils");
let DecoderService = DecoderService_1 = class DecoderService {
    constructor(dynamicDatabaseService, resilienceService) {
        this.dynamicDatabaseService = dynamicDatabaseService;
        this.resilienceService = resilienceService;
        this.logger = new common_1.Logger(DecoderService_1.name);
    }
    getRepository() {
        return this.dynamicDatabaseService.getRepositoryForTable('decoder', decoder_entity_1.DecoderEntity);
    }
    async findAll() {
        const repo = this.getRepository();
        return await repo.find({
            order: {
                sku: 'ASC',
                firmwareVersion: 'ASC',
            },
        });
    }
    async findOne(id) {
        const repo = this.getRepository();
        const decoder = await repo.findOne({ where: { id } });
        if (!decoder) {
            throw new common_1.NotFoundException(`Decoder with ID '${id}' not found`);
        }
        return decoder;
    }
    validateJavaScriptCode(code) {
        const validation = this.resilienceService.validateJavaScript(code);
        if (!validation.valid) {
            throw new common_1.BadRequestException(validation.error);
        }
    }
    async create(dto, author) {
        const repo = this.getRepository();
        const sku = (0, lorawan_utils_1.cleanSku)(dto.sku);
        if (!sku) {
            throw new common_1.BadRequestException('SKU must not be empty');
        }
        if (dto.firmwareVersion < 1 || dto.firmwareVersion > 32) {
            throw new common_1.BadRequestException('Firmware version must be an integer between 1 and 32');
        }
        this.validateJavaScriptCode(dto.decoderCode);
        const id = (0, lorawan_utils_1.resolveDecoderId)(sku, dto.firmwareVersion);
        if (!id) {
            throw new common_1.BadRequestException('Cannot generate valid decoder ID from SKU and firmware version');
        }
        const existing = await repo.findOne({ where: { id } });
        if (existing) {
            throw new common_1.ConflictException(`Decoder with ID '${id}' (SKU: ${sku}, FW: ${dto.firmwareVersion}) already exists. Please edit the existing record or change version.`);
        }
        const decoder = repo.create({
            id,
            sku,
            firmwareVersion: dto.firmwareVersion,
            decoderCode: dto.decoderCode,
            description: dto.description || undefined,
            author: author || 'admin',
        });
        const saved = await repo.save(decoder);
        this.logger.log(`Created new LoRaWAN decoder: ${id}`);
        return saved;
    }
    async update(id, dto, author) {
        const repo = this.getRepository();
        const decoder = await this.findOne(id);
        if (dto.decoderCode !== undefined) {
            this.validateJavaScriptCode(dto.decoderCode);
            decoder.decoderCode = dto.decoderCode;
        }
        if (dto.description !== undefined) {
            decoder.description = dto.description;
        }
        if (author) {
            decoder.author = author;
        }
        const updated = await repo.save(decoder);
        this.logger.log(`Updated LoRaWAN decoder: ${id}`);
        return updated;
    }
    async remove(id) {
        const repo = this.getRepository();
        const decoder = await this.findOne(id);
        await repo.remove(decoder);
        this.logger.log(`Deleted LoRaWAN decoder: ${id}`);
        return { success: true, message: `Decoder '${id}' was deleted successfully` };
    }
    testDecode(dto) {
        const res = this.resilienceService.safeDecodePayload(dto.code, dto.hex, dto.fPort);
        if (!res.success) {
            return {
                success: false,
                input: {
                    hex: dto.hex,
                    fPort: dto.fPort || 1,
                },
                error: res.error,
            };
        }
        const cleanHex = dto.hex.trim().replace(/\s+/g, '');
        const bytes = Array.from(Buffer.from(cleanHex, 'hex'));
        return {
            success: true,
            input: {
                hex: cleanHex,
                bytes,
                fPort: dto.fPort || 1,
            },
            output: res.data,
        };
    }
};
exports.DecoderService = DecoderService;
exports.DecoderService = DecoderService = DecoderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dynamic_database_service_1.DynamicDatabaseService,
        lorawan_resilience_service_1.LorawanResilienceService])
], DecoderService);
//# sourceMappingURL=decoder.service.js.map