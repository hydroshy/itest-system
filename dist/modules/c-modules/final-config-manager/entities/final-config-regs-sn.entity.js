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
exports.FinalConfigRegsSnEntity = void 0;
const typeorm_1 = require("typeorm");
const final_config_sn_entity_1 = require("./final-config-sn.entity");
let FinalConfigRegsSnEntity = class FinalConfigRegsSnEntity {
    get configSnId() {
        return this.config_sn_id;
    }
    set configSnId(val) {
        this.config_sn_id = val;
    }
    get serialNumber() {
        return this.serial_number;
    }
    set serialNumber(val) {
        this.serial_number = val;
    }
    get itemCode() {
        return this.item_code;
    }
    set itemCode(val) {
        this.item_code = val;
    }
    get modbusRegHex() {
        return this.modbus_reg_hex;
    }
    set modbusRegHex(val) {
        this.modbus_reg_hex = val;
    }
    get regNum() {
        return this.reg_num;
    }
    set regNum(val) {
        this.reg_num = val;
    }
    get parameterName() {
        return this.parameter_name;
    }
    set parameterName(val) {
        this.parameter_name = val;
    }
    get valueToWrite() {
        return this.value_to_write;
    }
    set valueToWrite(val) {
        this.value_to_write = val;
    }
    get defaultValue() {
        return this.default_value;
    }
    set defaultValue(val) {
        this.default_value = val;
    }
    get valueReadBack() {
        return this.value_read_back;
    }
    set valueReadBack(val) {
        this.value_read_back = val;
    }
    get fnRead() {
        return this.fn_read;
    }
    set fnRead(val) {
        this.fn_read = val;
    }
    get fnWrite() {
        return this.fn_write;
    }
    set fnWrite(val) {
        this.fn_write = val;
    }
    get orderNo() {
        return this.order_no;
    }
    set orderNo(val) {
        this.order_no = val;
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
exports.FinalConfigRegsSnEntity = FinalConfigRegsSnEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FinalConfigRegsSnEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'config_sn_id', type: 'uuid' }),
    __metadata("design:type", String)
], FinalConfigRegsSnEntity.prototype, "config_sn_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => final_config_sn_entity_1.FinalConfigSnEntity, (sn) => sn.registers, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'config_sn_id' }),
    __metadata("design:type", final_config_sn_entity_1.FinalConfigSnEntity)
], FinalConfigRegsSnEntity.prototype, "configSn", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'serial_number', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], FinalConfigRegsSnEntity.prototype, "serial_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'item_code', type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], FinalConfigRegsSnEntity.prototype, "item_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'address', type: 'int' }),
    __metadata("design:type", Number)
], FinalConfigRegsSnEntity.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'modbus_reg_hex', type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], FinalConfigRegsSnEntity.prototype, "modbus_reg_hex", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'slave', type: 'int', default: 1 }),
    __metadata("design:type", Number)
], FinalConfigRegsSnEntity.prototype, "slave", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reg_num', type: 'int', default: 1 }),
    __metadata("design:type", Number)
], FinalConfigRegsSnEntity.prototype, "reg_num", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'format', type: 'varchar', length: 50, default: 'uint' }),
    __metadata("design:type", String)
], FinalConfigRegsSnEntity.prototype, "format", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parameter_name', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], FinalConfigRegsSnEntity.prototype, "parameter_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'value_to_write', type: 'text', nullable: true, default: '' }),
    __metadata("design:type", String)
], FinalConfigRegsSnEntity.prototype, "value_to_write", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_value', type: 'text', nullable: true, default: '' }),
    __metadata("design:type", String)
], FinalConfigRegsSnEntity.prototype, "default_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'value_read_back', type: 'text', nullable: true, default: '' }),
    __metadata("design:type", String)
], FinalConfigRegsSnEntity.prototype, "value_read_back", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status', type: 'varchar', length: 20, default: 'NONE' }),
    __metadata("design:type", String)
], FinalConfigRegsSnEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'endianness', type: 'varchar', length: 50, default: 'big-endian' }),
    __metadata("design:type", String)
], FinalConfigRegsSnEntity.prototype, "endianness", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fn_read', type: 'varchar', length: 20, default: '3' }),
    __metadata("design:type", String)
], FinalConfigRegsSnEntity.prototype, "fn_read", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fn_write', type: 'varchar', length: 20, default: '16' }),
    __metadata("design:type", String)
], FinalConfigRegsSnEntity.prototype, "fn_write", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'order_no', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], FinalConfigRegsSnEntity.prototype, "order_no", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], FinalConfigRegsSnEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], FinalConfigRegsSnEntity.prototype, "updated_at", void 0);
exports.FinalConfigRegsSnEntity = FinalConfigRegsSnEntity = __decorate([
    (0, typeorm_1.Entity)('final_config_regs_sn', { synchronize: false }),
    (0, typeorm_1.Unique)('UQ_final_config_regs_sn_serial_item_addr', ['serial_number', 'item_code', 'address']),
    (0, typeorm_1.Index)('idx_final_config_regs_sn_config_id', ['config_sn_id']),
    (0, typeorm_1.Index)('idx_final_config_regs_sn_sn_item', ['serial_number', 'item_code']),
    (0, typeorm_1.Index)('idx_final_config_regs_sn_serial_number', ['serial_number']),
    (0, typeorm_1.Index)('idx_final_config_regs_sn_item_code', ['item_code']),
    (0, typeorm_1.Index)('idx_final_config_regs_sn_address', ['address']),
    (0, typeorm_1.Index)('idx_final_config_regs_sn_status', ['status'])
], FinalConfigRegsSnEntity);
//# sourceMappingURL=final-config-regs-sn.entity.js.map