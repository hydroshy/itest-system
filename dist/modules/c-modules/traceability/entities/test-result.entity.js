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
exports.TestResultEntity = void 0;
const typeorm_1 = require("typeorm");
let TestResultEntity = class TestResultEntity {
};
exports.TestResultEntity = TestResultEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'test_result_id', type: 'text' }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "testResultId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'test_id', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "testId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'so_number', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "soNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'device_key', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "deviceKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'serial_number', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "serialNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'item_code', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "itemCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sku', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'hw_ver', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "hwVer", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fw_ver', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "fwVer", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'result', type: 'text', default: 'PASS' }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "result", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'label_check_code', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "labelCheckCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'start_time', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'duration_time', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "durationTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'time_finish', type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], TestResultEntity.prototype, "timeFinish", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'test_note', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "testNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'data_count', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "dataCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actual_cyclic_period', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "actualCyclicPeriod", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'test_station', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "testStation", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'test_person', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "testPerson", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'aux_sn', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "auxSn", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'test_category', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "testCategory", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parameters_name_string', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "parametersNameString", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'configuration_string', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "configurationString", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'config_check', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "configCheck", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'date_config', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "dateConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'config_note', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "configNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'write_counter', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "writeCounter", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parameters_type', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "parametersType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parameters_length_string', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "parametersLengthString", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'final_config_id', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "finalConfigId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'epochtime_config', type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], TestResultEntity.prototype, "epochtimeConfig", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'test_confirmation', type: 'boolean', nullable: true }),
    __metadata("design:type", Boolean)
], TestResultEntity.prototype, "testConfirmation", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'epochtime_confirm', type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], TestResultEntity.prototype, "epochtimeConfirm", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'date_confirm', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "dateConfirm", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'confirm_person', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "confirmPerson", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'confirm_id', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "confirmId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'confirm_note', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "confirmNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avg_com1', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "avgCom1", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'setup_time', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "setupTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'secondary_key', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "secondaryKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tertiary_key', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "tertiaryKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pac_id', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "pacId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dev_dup', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "devDup", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'auto_check', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "autoCheck", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'result_detail', type: 'text', nullable: true }),
    __metadata("design:type", String)
], TestResultEntity.prototype, "resultDetail", void 0);
exports.TestResultEntity = TestResultEntity = __decorate([
    (0, typeorm_1.Entity)('test_result'),
    (0, typeorm_1.Index)('idx_test_result_so_number', ['soNumber']),
    (0, typeorm_1.Index)('idx_test_result_serial_number', ['serialNumber']),
    (0, typeorm_1.Index)('idx_test_result_device_key', ['deviceKey']),
    (0, typeorm_1.Index)('idx_test_result_item_code', ['itemCode']),
    (0, typeorm_1.Index)('idx_test_result_sku', ['sku']),
    (0, typeorm_1.Index)('idx_test_result_result', ['result']),
    (0, typeorm_1.Index)('idx_test_result_time_finish', ['timeFinish'])
], TestResultEntity);
//# sourceMappingURL=test-result.entity.js.map