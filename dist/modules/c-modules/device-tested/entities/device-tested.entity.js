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
exports.DeviceTestedEntity = void 0;
const typeorm_1 = require("typeorm");
let DeviceTestedEntity = class DeviceTestedEntity {
    get itemCode() {
        return this.item_code;
    }
    set itemCode(val) {
        this.item_code = val;
    }
    get serialNumber() {
        return this.serial_number;
    }
    set serialNumber(val) {
        this.serial_number = val;
    }
    get devEui() {
        return this.dev_eui;
    }
    set devEui(val) {
        this.dev_eui = val;
    }
    get firmwareVersion() {
        return this.firmware_version;
    }
    set firmwareVersion(val) {
        this.firmware_version = val;
    }
    get shortFw() {
        return this.short_fw;
    }
    set shortFw(val) {
        this.short_fw = val;
    }
    get sensorType() {
        return this.sensor_type;
    }
    set sensorType(val) {
        this.sensor_type = val;
    }
    get stationId() {
        return this.station_id;
    }
    set stationId(val) {
        this.station_id = val;
    }
    get appKey() {
        return this.app_key;
    }
    set appKey(val) {
        this.app_key = val;
    }
    get testedAt() {
        return this.tested_at;
    }
    set testedAt(val) {
        this.tested_at = val;
    }
    get createdAt() {
        return this.created_at;
    }
    set createdAt(val) {
        this.created_at = val;
    }
    get updatedAt() {
        return this.updated_at;
    }
    set updatedAt(val) {
        this.updated_at = val;
    }
};
exports.DeviceTestedEntity = DeviceTestedEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DeviceTestedEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'so', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], DeviceTestedEntity.prototype, "so", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'item_code', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], DeviceTestedEntity.prototype, "item_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'serial_number', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], DeviceTestedEntity.prototype, "serial_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dev_eui', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], DeviceTestedEntity.prototype, "dev_eui", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sku', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], DeviceTestedEntity.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'firmware_version', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], DeviceTestedEntity.prototype, "firmware_version", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'short_fw', type: 'int', default: 1 }),
    __metadata("design:type", Number)
], DeviceTestedEntity.prototype, "short_fw", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sensor_type', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DeviceTestedEntity.prototype, "sensor_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status', type: 'varchar', length: 20, default: 'PASS' }),
    __metadata("design:type", String)
], DeviceTestedEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'station_id', type: 'varchar', length: 100, default: 'STATION-01', nullable: true }),
    __metadata("design:type", String)
], DeviceTestedEntity.prototype, "station_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'operator', type: 'varchar', length: 100, default: 'admin', nullable: true }),
    __metadata("design:type", String)
], DeviceTestedEntity.prototype, "operator", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'app_key', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], DeviceTestedEntity.prototype, "app_key", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tested_at', type: 'timestamptz', default: () => 'NOW()' }),
    __metadata("design:type", Date)
], DeviceTestedEntity.prototype, "tested_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notes', type: 'text', nullable: true }),
    __metadata("design:type", String)
], DeviceTestedEntity.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'metadata', type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], DeviceTestedEntity.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], DeviceTestedEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], DeviceTestedEntity.prototype, "updated_at", void 0);
exports.DeviceTestedEntity = DeviceTestedEntity = __decorate([
    (0, typeorm_1.Entity)('device_tested', { synchronize: false }),
    (0, typeorm_1.Unique)('UQ_device_tested_sn_item', ['serial_number', 'item_code']),
    (0, typeorm_1.Index)('idx_device_tested_serial_number', ['serial_number']),
    (0, typeorm_1.Index)('idx_device_tested_item_code', ['item_code']),
    (0, typeorm_1.Index)('idx_device_tested_so', ['so']),
    (0, typeorm_1.Index)('idx_device_tested_dev_eui', ['dev_eui']),
    (0, typeorm_1.Index)('idx_device_tested_status', ['status']),
    (0, typeorm_1.Index)('idx_device_tested_tested_at', ['tested_at']),
    (0, typeorm_1.Index)('idx_device_tested_created_at', ['created_at'])
], DeviceTestedEntity);
//# sourceMappingURL=device-tested.entity.js.map