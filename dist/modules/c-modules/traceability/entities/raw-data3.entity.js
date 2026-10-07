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
exports.RawData3Entity = void 0;
const typeorm_1 = require("typeorm");
let RawData3Entity = class RawData3Entity {
};
exports.RawData3Entity = RawData3Entity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'sn', type: 'text' }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "sn", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ name: 'epochtime', type: 'bigint' }),
    __metadata("design:type", Number)
], RawData3Entity.prototype, "epochtime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'device_key', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "deviceKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'test_id', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "testId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'raw_data_id', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "rawDataId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'timestamp', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "timestamp", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'com1', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "com1", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'com2', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "com2", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uplink_payload', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "uplinkPayload", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'combine_name', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "combineName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p1', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p1", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p2', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p2", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p3', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p3", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p4', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p4", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p5', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p5", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p6', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p6", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p7', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p7", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p8', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p8", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p9', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p9", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p10', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p10", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p11', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p11", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p12', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p12", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p13', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p13", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p14', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p14", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p15', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p15", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p16', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p16", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p17', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p17", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p18', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p18", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p19', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p19", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p20', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p20", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p21', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p21", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p22', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p22", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p23', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p23", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p24', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p24", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p25', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p25", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p26', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p26", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p27', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p27", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p28', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p28", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p29', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p29", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p30', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p30", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p31', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p31", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p32', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p32", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p33', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p33", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p34', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p34", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'p35', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "p35", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'received_epochtime', type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], RawData3Entity.prototype, "receivedEpochtime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'received_time', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "receivedTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'spreading_factor', type: 'numeric', nullable: true }),
    __metadata("design:type", Number)
], RawData3Entity.prototype, "spreadingFactor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'test_category', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "testCategory", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'seq_number', type: 'text', nullable: true }),
    __metadata("design:type", String)
], RawData3Entity.prototype, "seqNumber", void 0);
exports.RawData3Entity = RawData3Entity = __decorate([
    (0, typeorm_1.Entity)('raw_data3'),
    (0, typeorm_1.Index)('idx_sn_epochtime', ['sn', 'epochtime']),
    (0, typeorm_1.Index)('idx_raw_data3_sn', ['sn']),
    (0, typeorm_1.Index)('idx_raw_data3_device_key', ['deviceKey']),
    (0, typeorm_1.Index)('idx_raw_data3_epochtime', ['epochtime']),
    (0, typeorm_1.Index)('idx_raw_data3_test_id', ['testId'])
], RawData3Entity);
//# sourceMappingURL=raw-data3.entity.js.map