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
var SensorTypesRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SensorTypesRepository = void 0;
const common_1 = require("@nestjs/common");
const dynamic_database_service_1 = require("../../database/dynamic-database.service");
const sensor_type_entity_1 = require("./entities/sensor-type.entity");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let SensorTypesRepository = SensorTypesRepository_1 = class SensorTypesRepository {
    constructor(dbService) {
        this.dbService = dbService;
        this.logger = new common_1.Logger(SensorTypesRepository_1.name);
    }
    getRepo() {
        return this.dbService.getRepositoryForTable('sensor_types', sensor_type_entity_1.SensorTypeEntity);
    }
    async findWithPagination(query) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(query.limit) || 50));
        const skip = (page - 1) * limit;
        const qb = this.getRepo()
            .createQueryBuilder('st')
            .orderBy('st.sensorTypeCode', 'ASC')
            .skip(skip)
            .take(limit);
        if (query.search && query.search.trim() !== '') {
            const searchPattern = `%${query.search.trim()}%`;
            const isNum = !isNaN(Number(query.search.trim()));
            if (isNum) {
                qb.andWhere('(st.sensorTypeCode = :numSearch OR st.sku ILIKE :search OR st.name ILIKE :search)', { numSearch: Number(query.search.trim()), search: searchPattern });
            }
            else {
                qb.andWhere('(st.sku ILIKE :search OR st.name ILIKE :search OR st.description ILIKE :search)', { search: searchPattern });
            }
        }
        if (query.isActive !== undefined && query.isActive !== '') {
            const activeBool = query.isActive === true || query.isActive === 'true';
            qb.andWhere('st.isActive = :isActive', { isActive: activeBool });
        }
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        };
    }
    async findById(id) {
        if (!id)
            return null;
        return await this.getRepo().findOne({ where: { id } });
    }
    async findBySensorTypeCode(code) {
        if (code === undefined || code === null)
            return null;
        return await this.getRepo().findOne({ where: { sensorTypeCode: code } });
    }
    async findBySku(sku) {
        if (!sku)
            return null;
        return await this.getRepo().findOne({ where: { sku: sku.trim().toUpperCase() } });
    }
    async create(data) {
        const entity = this.getRepo().create(data);
        return await this.getRepo().save(entity);
    }
    async update(id, data) {
        const existing = await this.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`Sensor Type [${id}] not found`);
        }
        Object.assign(existing, {
            ...data,
            updatedAt: new Date(),
        });
        return await this.getRepo().save(existing);
    }
    async delete(id) {
        const existing = await this.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`Sensor Type [${id}] not found`);
        }
        await this.getRepo().remove(existing);
        return true;
    }
};
exports.SensorTypesRepository = SensorTypesRepository;
exports.SensorTypesRepository = SensorTypesRepository = SensorTypesRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dynamic_database_service_1.DynamicDatabaseService])
], SensorTypesRepository);
//# sourceMappingURL=sensor-types.repository.js.map