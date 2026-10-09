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
var LorawanService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LorawanService = exports.cleanFirmwareVersion = void 0;
const common_1 = require("@nestjs/common");
const dynamic_database_service_1 = require("../database/dynamic-database.service");
const realtime_service_1 = require("../realtime/realtime.service");
const payload_formatter_service_1 = require("./payload-formatters/payload-formatter.service");
const device_provisioning_service_1 = require("./services/device-provisioning.service");
const device_entity_1 = require("./entities/device.entity");
const application_entity_1 = require("./entities/application.entity");
const gateway_entity_1 = require("./entities/gateway.entity");
const telemetry_entity_1 = require("./entities/telemetry.entity");
const network_server_entity_1 = require("../network-servers/entities/network-server.entity");
const decoder_entity_1 = require("../c-modules/decoder-admin/entities/decoder.entity");
const webhook_log_entity_1 = require("../c-modules/webhook-admin/entities/webhook-log.entity");
const item_code_entity_1 = require("../c-modules/item-codes/entities/item-code.entity");
const sales_order_entity_1 = require("../c-modules/sales-orders/entities/sales-order.entity");
const sales_order_item_entity_1 = require("../c-modules/sales-orders/entities/sales-order-item.entity");
function isUserSuperAdmin(user) {
    if (!user)
        return false;
    if (user.username === 'admin')
        return true;
    if (user.userType === 'ADMIN' || String(user.userType).toUpperCase() === 'ADMIN')
        return true;
    if (user.roles && Array.isArray(user.roles)) {
        return user.roles.some((r) => (r.code || r) === 'SUPER_ADMIN');
    }
    return false;
}
const lorawan_utils_1 = require("./common/lorawan-utils");
var lorawan_utils_2 = require("./common/lorawan-utils");
Object.defineProperty(exports, "cleanFirmwareVersion", { enumerable: true, get: function () { return lorawan_utils_2.cleanFirmwareVersion; } });
let LorawanService = LorawanService_1 = class LorawanService {
    constructor(dbService, payloadFormatterService, provisioningService, realtimeService) {
        this.dbService = dbService;
        this.payloadFormatterService = payloadFormatterService;
        this.provisioningService = provisioningService;
        this.realtimeService = realtimeService;
        this.logger = new common_1.Logger(LorawanService_1.name);
    }
    async onModuleInit() {
        await this.ensureDeviceColumns().catch((err) => {
            this.logger.warn(`Could not ensure device columns: ${err.message}`);
        });
    }
    async ensureDeviceColumns() {
        try {
            const ds = this.dbService.getDataSourceForTable('devices');
            if (!ds || !ds.isInitialized)
                return;
            await ds.query(`
        ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "sku" VARCHAR(255);
        ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "firmwareVersion" VARCHAR(100);
        ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "itemCodeId" UUID;
        ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "salesOrderId" UUID;
      `);
        }
        catch (e) {
            this.logger.warn(`ensureDeviceColumns warning: ${e.message}`);
        }
    }
    get itemCodeRepo() {
        return this.dbService.getRepositoryForTable('item_codes', item_code_entity_1.ItemCodeEntity);
    }
    get salesOrderRepo() {
        return this.dbService.getRepositoryForTable('sales_orders', sales_order_entity_1.SalesOrderEntity);
    }
    get deviceRepo() {
        return this.dbService.getRepositoryForTable('devices', device_entity_1.DeviceEntity);
    }
    get serverRepo() {
        return this.dbService.getRepositoryForTable('network_servers', network_server_entity_1.NetworkServerEntity);
    }
    get decoderRepo() {
        return this.dbService.getRepositoryForTable('decoder', decoder_entity_1.DecoderEntity);
    }
    get webhookLogRepo() {
        return this.dbService.getRepositoryForTable('webhook_logs', webhook_log_entity_1.WebhookLogEntity);
    }
    get appRepo() {
        return this.dbService.getRepositoryForTable('applications', application_entity_1.ApplicationEntity);
    }
    get gatewayRepo() {
        return this.dbService.getRepositoryForTable('gateways', gateway_entity_1.GatewayEntity);
    }
    get telemetryRepo() {
        return this.dbService.getRepositoryForTable('uplink_telemetry', telemetry_entity_1.TelemetryEntity);
    }
    async registerDevice(dto, user) {
        const devEUI = dto.devEUI.trim().toUpperCase();
        let name = dto.name.trim();
        let cleanSkuVal = (0, lorawan_utils_1.cleanSku)(dto.sku);
        let cleanFw = (0, lorawan_utils_1.cleanFirmwareVersion)(dto.firmwareVersion);
        if (cleanSkuVal && cleanFw && name.startsWith(cleanSkuVal + '-') && !name.includes('_')) {
            const serialPart = name.slice(cleanSkuVal.length + 1);
            name = `${cleanSkuVal}_${cleanFw}_${serialPart}`;
        }
        const appEUI = (dto.appEUI || '0102030405060708').trim().toUpperCase();
        const appKey = (dto.appKey || '0102030405060708090A0B0C0D0E0F10').trim().toUpperCase();
        const activationMode = dto.activationType || 'OTAA';
        const ownerId = user?.id || undefined;
        const isActive = dto.isActive !== undefined ? Boolean(dto.isActive) : true;
        const isLocal = dto.provisionTarget === 'LOCAL';
        if (!devEUI || devEUI.length < 16) {
            throw new common_1.BadRequestException('DevEUI must be at least 16 Hexadecimal characters.');
        }
        let networkServer = null;
        let regionProfile = null;
        if (dto.networkServerId && dto.networkServerId !== '' && dto.networkServerId !== '__LOCAL__') {
            networkServer = await this.serverRepo.findOne({ where: { id: dto.networkServerId } }).catch(() => null);
        }
        if (!networkServer && !isLocal) {
            networkServer = await this.serverRepo.findOne({ where: { isDefault: true } }).catch(() => null);
            if (!networkServer) {
                networkServer = await this.serverRepo.findOne({ where: { status: 'ONLINE' } }).catch(() => null);
            }
            if (!networkServer) {
                networkServer = await this.serverRepo.findOne({ where: {} }).catch(() => null);
            }
            if (networkServer) {
                dto.networkServerId = networkServer.id;
            }
        }
        if (networkServer) {
            if (dto.regionProfileId && Array.isArray(networkServer.regionProfiles)) {
                regionProfile = networkServer.regionProfiles.find((rp) => rp.id === dto.regionProfileId);
            }
            else if (Array.isArray(networkServer.regionProfiles) && networkServer.regionProfiles.length > 0) {
                if (dto.region) {
                    regionProfile = networkServer.regionProfiles.find((rp) => (rp.region || rp.name || '').toUpperCase().includes(dto.region.toUpperCase()));
                }
                if (!regionProfile) {
                    regionProfile = networkServer.regionProfiles[0];
                }
                dto.regionProfileId = regionProfile.id;
            }
        }
        const now = new Date();
        let provisioningResult;
        let syncStatus = isLocal ? 'LOCAL' : 'SYNCED';
        let syncDetails = {
            registeredAt: now.toISOString(),
            lastSeenAt: now.toISOString(),
            networkServerName: networkServer?.name || 'Local Fleet',
            networkServerType: networkServer?.type || 'LOCAL',
        };
        if (!isLocal) {
            if (!networkServer) {
                throw new common_1.BadRequestException('Please select a Network Server or choose Local Fleet mode.');
            }
            this.logger.log(`Provisioning device [${devEUI}] '${name}' to Network Server [${networkServer.name}] (${networkServer.type})`);
            provisioningResult = await this.provisioningService.provisionDevice(networkServer, regionProfile, {
                ...dto,
                isActive,
            }, false);
            if (!provisioningResult.success) {
                throw new common_1.BadRequestException(provisioningResult.errorMessage || provisioningResult.summaryMessage);
            }
            syncStatus = 'SYNCED';
            syncDetails = {
                ...syncDetails,
                serverType: networkServer.type,
                serverUrl: networkServer.apiUrl,
                totalSteps: provisioningResult.totalSteps,
                summaryMessage: provisioningResult.summaryMessage,
                steps: provisioningResult.steps,
            };
        }
        let payloadFormatterScript = dto.payloadFormatterScript || undefined;
        let decoderId = dto.decoderId ? dto.decoderId.trim() : undefined;
        let itemCodeId = dto.itemCodeId ? dto.itemCodeId.trim() : undefined;
        let salesOrderId = dto.salesOrderId ? dto.salesOrderId.trim() : undefined;
        const isUuid = (val) => !!val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(val).trim());
        let resolvedItemCodeId = undefined;
        if (itemCodeId && isUuid(itemCodeId)) {
            try {
                const ic = await this.itemCodeRepo.findOne({ where: { id: itemCodeId } });
                if (ic) {
                    resolvedItemCodeId = ic.id;
                    if (!cleanSkuVal)
                        cleanSkuVal = ic.sku;
                    if (!cleanFw)
                        cleanFw = ic.firmwareVersion;
                }
                else {
                    const soItemRepo = this.dbService.getRepositoryForTable('sales_order_items', sales_order_item_entity_1.SalesOrderItemEntity);
                    const soItem = await soItemRepo.findOne({ where: { id: itemCodeId } });
                    if (soItem) {
                        if (soItem.itemCodeId && isUuid(soItem.itemCodeId)) {
                            const matchedIc = await this.itemCodeRepo.findOne({ where: { id: soItem.itemCodeId } });
                            if (matchedIc)
                                resolvedItemCodeId = matchedIc.id;
                        }
                        if (!resolvedItemCodeId && soItem.itemCode) {
                            const matchedIc = await this.itemCodeRepo.findOne({ where: { itemCode: soItem.itemCode } });
                            if (matchedIc)
                                resolvedItemCodeId = matchedIc.id;
                        }
                        if (!cleanSkuVal && soItem.sku)
                            cleanSkuVal = soItem.sku;
                        if (!cleanFw && soItem.firmwareVersion)
                            cleanFw = soItem.firmwareVersion;
                    }
                }
            }
            catch (err) {
                this.logger.warn(`Could not resolve itemCode [${itemCodeId}]: ${err.message}`);
            }
        }
        itemCodeId = resolvedItemCodeId;
        let resolvedSalesOrderId = undefined;
        if (salesOrderId && isUuid(salesOrderId)) {
            try {
                const so = await this.salesOrderRepo.findOne({ where: { id: salesOrderId } });
                if (so) {
                    resolvedSalesOrderId = so.id;
                }
            }
            catch (err) {
                this.logger.warn(`Could not resolve salesOrder [${salesOrderId}]: ${err.message}`);
            }
        }
        salesOrderId = resolvedSalesOrderId;
        const autoDecoder = (0, lorawan_utils_1.resolveDecoderId)(cleanSkuVal, cleanFw);
        if (autoDecoder) {
            decoderId = autoDecoder;
        }
        if (decoderId && !payloadFormatterScript) {
            try {
                const dec = await this.decoderRepo.findOne({ where: { id: decoderId } });
                if (dec && dec.decoderCode) {
                    payloadFormatterScript = dec.decoderCode;
                }
            }
            catch (err) {
                this.logger.warn(`Could not resolve decoder '${decoderId}': ${err.message}`);
            }
        }
        let device = await this.deviceRepo.findOne({ where: { devEUI } });
        if (!device) {
            device = this.deviceRepo.create({
                devEUI,
                name,
                appEUI,
                appKey,
                activationMode,
                ownerId,
                networkServerId: dto.networkServerId || undefined,
                regionProfileId: dto.regionProfileId || undefined,
                decoderId: decoderId || undefined,
                itemCodeId: itemCodeId || undefined,
                salesOrderId: salesOrderId || undefined,
                sku: cleanSkuVal || undefined,
                firmwareVersion: cleanFw || undefined,
                payloadFormatterScript,
                syncStatus,
                syncDetails,
                isActive,
                lastSeenAt: now,
            });
        }
        else {
            if (!isUserSuperAdmin(user) && device.ownerId && user?.id && device.ownerId !== user.id) {
                throw new common_1.ForbiddenException('You do not have permission to modify this device.');
            }
            device.name = name;
            device.appEUI = appEUI;
            device.appKey = appKey;
            device.activationMode = activationMode;
            if (!device.ownerId && ownerId) {
                device.ownerId = ownerId;
            }
            device.networkServerId = dto.networkServerId || undefined;
            device.regionProfileId = dto.regionProfileId || undefined;
            if (itemCodeId !== undefined) {
                device.itemCodeId = itemCodeId || null;
            }
            if (salesOrderId !== undefined) {
                device.salesOrderId = salesOrderId || null;
            }
            if (cleanSkuVal !== undefined) {
                device.sku = cleanSkuVal;
            }
            if (cleanFw !== undefined) {
                device.firmwareVersion = cleanFw;
            }
            if (decoderId !== undefined) {
                device.decoderId = decoderId;
            }
            if (payloadFormatterScript !== undefined) {
                device.payloadFormatterScript = payloadFormatterScript;
            }
            device.syncStatus = syncStatus;
            device.syncDetails = { ...(device.syncDetails || {}), ...syncDetails, lastSeenAt: now.toISOString() };
            device.isActive = isActive;
            device.lastSeenAt = now;
        }
        let saved;
        try {
            saved = await this.deviceRepo.save(device);
        }
        catch (saveErr) {
            this.logger.warn(`Failed to save device with relations: ${saveErr.message}. Retrying with sanitized fields...`);
            device.itemCodeId = null;
            device.salesOrderId = null;
            device.itemCode = null;
            device.salesOrder = null;
            saved = await this.deviceRepo.save(device);
        }
        this.logger.log(`✅ Saved device [${saved.devEUI}] '${saved.name}' in database. Decoder=${saved.decoderId || 'none'}, SyncStatus=${syncStatus}`);
        return {
            success: true,
            device: saved,
            provisioning: provisioningResult,
            message: provisioningResult
                ? provisioningResult.summaryMessage
                : `Device ${saved.name} (${saved.devEUI}) registered successfully in Local Fleet.`,
        };
    }
    async updateDevice(devEUI, dto, user) {
        const cleanDevEUI = devEUI.trim().toUpperCase();
        const device = await this.deviceRepo.findOne({
            where: { devEUI: cleanDevEUI },
            relations: ['networkServer'],
        });
        if (!device) {
            throw new common_1.NotFoundException(`Device with DevEUI ${cleanDevEUI} not found`);
        }
        if (!isUserSuperAdmin(user) && device.ownerId && user?.id && device.ownerId !== user.id) {
            throw new common_1.ForbiddenException('You do not have permission to modify this device.');
        }
        if (dto.name !== undefined)
            device.name = dto.name.trim();
        if (dto.appEUI !== undefined)
            device.appEUI = dto.appEUI.trim().toUpperCase();
        if (dto.appKey !== undefined)
            device.appKey = dto.appKey.trim().toUpperCase();
        if (dto.activationType !== undefined)
            device.activationMode = dto.activationType;
        if (dto.payloadFormatterScript !== undefined)
            device.payloadFormatterScript = dto.payloadFormatterScript;
        if (dto.isActive !== undefined)
            device.isActive = Boolean(dto.isActive);
        if (dto.itemCodeId !== undefined)
            device.itemCodeId = dto.itemCodeId ? dto.itemCodeId.trim() : null;
        if (dto.salesOrderId !== undefined)
            device.salesOrderId = dto.salesOrderId ? dto.salesOrderId.trim() : null;
        if (dto.sku !== undefined)
            device.sku = (0, lorawan_utils_1.cleanSku)(dto.sku) || null;
        if (dto.firmwareVersion !== undefined)
            device.firmwareVersion = (0, lorawan_utils_1.cleanFirmwareVersion)(dto.firmwareVersion) || null;
        const autoDecoderId = (0, lorawan_utils_1.resolveDecoderId)(device.sku, device.firmwareVersion);
        if (autoDecoderId) {
            device.decoderId = autoDecoderId;
            if (!dto.payloadFormatterScript) {
                try {
                    const dec = await this.decoderRepo.findOne({ where: { id: autoDecoderId } });
                    if (dec && dec.decoderCode) {
                        device.payloadFormatterScript = dec.decoderCode;
                    }
                }
                catch (err) {
                    this.logger.warn(`Could not resolve decoder '${autoDecoderId}': ${err.message}`);
                }
            }
        }
        else if (dto.decoderId !== undefined) {
            const cleanDecoderId = dto.decoderId ? dto.decoderId.trim() : null;
            device.decoderId = cleanDecoderId;
            if (cleanDecoderId && !dto.payloadFormatterScript) {
                try {
                    const dec = await this.decoderRepo.findOne({ where: { id: cleanDecoderId } });
                    if (dec && dec.decoderCode) {
                        device.payloadFormatterScript = dec.decoderCode;
                    }
                }
                catch (err) {
                    this.logger.warn(`Could not resolve decoder '${cleanDecoderId}': ${err.message}`);
                }
            }
            else if (cleanDecoderId === null && dto.payloadFormatterScript === undefined) {
                device.payloadFormatterScript = null;
            }
        }
        if (dto.networkServerId !== undefined) {
            device.networkServerId = (dto.networkServerId ? dto.networkServerId : undefined);
        }
        if (dto.regionProfileId !== undefined) {
            device.regionProfileId = (dto.regionProfileId ? dto.regionProfileId : undefined);
        }
        let networkServer = null;
        let regionProfile = null;
        if (device.networkServerId) {
            networkServer = await this.serverRepo.findOne({ where: { id: device.networkServerId } });
            if (networkServer && device.regionProfileId && Array.isArray(networkServer.regionProfiles)) {
                regionProfile = networkServer.regionProfiles.find((rp) => rp.id === device.regionProfileId);
            }
        }
        let provisioningResult;
        if (dto.provisionTarget !== 'LOCAL' && networkServer) {
            this.logger.log(`Auto-syncing updated device [${cleanDevEUI}] '${device.name}' to Network Server [${networkServer.name}] (${networkServer.type}) via PUT`);
            const provDto = {
                devEUI: cleanDevEUI,
                name: device.name,
                appEUI: device.appEUI,
                appKey: device.appKey,
                activationType: device.activationMode,
                networkServerId: device.networkServerId,
                regionProfileId: device.regionProfileId,
                isActive: device.isActive,
            };
            provisioningResult = await this.provisioningService.provisionDevice(networkServer, regionProfile, provDto, true);
            if (!provisioningResult.success) {
                throw new common_1.BadRequestException(provisioningResult.errorMessage || provisioningResult.summaryMessage);
            }
            device.syncStatus = 'SYNCED';
            device.syncDetails = {
                ...device.syncDetails,
                lastUpdatedAndSyncedAt: new Date().toISOString(),
                serverType: networkServer.type,
                serverUrl: networkServer.apiUrl,
                totalSteps: provisioningResult.totalSteps,
                summaryMessage: provisioningResult.summaryMessage,
                steps: provisioningResult.steps,
            };
        }
        const saved = await this.deviceRepo.save(device);
        this.logger.log(`✅ Updated device [${saved.devEUI}] '${saved.name}'. SyncStatus=${saved.syncStatus}`);
        return {
            success: true,
            device: saved,
            provisioning: provisioningResult,
            message: provisioningResult
                ? provisioningResult.summaryMessage
                : `Device ${saved.name} (${saved.devEUI}) updated successfully.`,
        };
    }
    async deleteDevice(devEUI, user) {
        const device = await this.deviceRepo.findOne({
            where: { devEUI: devEUI.toUpperCase() },
            relations: ['networkServer'],
        });
        if (!device) {
            throw new common_1.NotFoundException(`Device with DevEUI ${devEUI} not found`);
        }
        if (!isUserSuperAdmin(user) && device.ownerId && user?.id && device.ownerId !== user.id) {
            throw new common_1.ForbiddenException('You do not have permission to delete this device.');
        }
        if (device.networkServer) {
            await this.provisioningService.deprovisionDevice(device.networkServer, device.devEUI).catch(() => { });
        }
        await this.deviceRepo.remove(device);
        this.logger.log(`Deleted device [${devEUI}] from database and network server.`);
        return { success: true, message: `Device '${device.name}' (${devEUI}) deleted successfully` };
    }
    async syncDeviceToNetworkServer(devEUI, user) {
        const device = await this.deviceRepo.findOne({
            where: { devEUI: devEUI.toUpperCase() },
            relations: ['networkServer'],
        });
        if (!device) {
            throw new common_1.NotFoundException(`Device with DevEUI ${devEUI} not found`);
        }
        if (!isUserSuperAdmin(user) && device.ownerId && user?.id && device.ownerId !== user.id) {
            throw new common_1.ForbiddenException('You do not have permission to manage this device.');
        }
        if (!device.networkServer) {
            throw new common_1.BadRequestException(`Device ${devEUI} is not assigned to any Network Server.`);
        }
        let regionProfile = null;
        if (device.regionProfileId && Array.isArray(device.networkServer.regionProfiles)) {
            regionProfile = device.networkServer.regionProfiles.find((rp) => rp.id === device.regionProfileId);
        }
        const dto = {
            devEUI: device.devEUI,
            name: device.name,
            appEUI: device.appEUI,
            appKey: device.appKey,
            activationType: device.activationMode,
            networkServerId: device.networkServerId,
            regionProfileId: device.regionProfileId,
            isActive: device.isActive,
        };
        const provisioning = await this.provisioningService.provisionDevice(device.networkServer, regionProfile, dto, true);
        device.syncStatus = provisioning.syncStatus;
        device.syncDetails = {
            ...device.syncDetails,
            lastSyncedAt: new Date().toISOString(),
            summaryMessage: provisioning.summaryMessage,
            steps: provisioning.steps,
        };
        const updated = await this.deviceRepo.save(device);
        return { success: true, provisioning, device: updated };
    }
    async checkDeviceHealth(devEUI, user) {
        const cleanDevEUI = devEUI.trim().toUpperCase();
        const device = await this.deviceRepo.findOne({
            where: { devEUI: cleanDevEUI },
            relations: ['networkServer'],
        });
        if (!device) {
            throw new common_1.NotFoundException(`Device with DevEUI ${cleanDevEUI} not found`);
        }
        if (!isUserSuperAdmin(user) && device.ownerId && user?.id && device.ownerId !== user.id) {
            throw new common_1.ForbiddenException('You do not have permission to inspect this device.');
        }
        let healthResult = {
            isOnline: false,
            lastSeenAt: device.lastSeenAt ? new Date(device.lastSeenAt).toISOString() : (device.syncDetails?.lastSeenAt || null),
            deviceStatus: device.syncDetails?.deviceStatus || null,
            message: device.lastSeenAt ? `Last seen: ${new Date(device.lastSeenAt).toLocaleString()}` : 'No packet activity recorded.',
        };
        if (device.networkServer) {
            const serverHealth = await this.provisioningService.checkDeviceHealth(device.networkServer, cleanDevEUI);
            healthResult = {
                isOnline: serverHealth.isOnline,
                lastSeenAt: serverHealth.lastSeenAt || healthResult.lastSeenAt,
                deviceStatus: serverHealth.deviceStatus || healthResult.deviceStatus,
                message: serverHealth.message,
            };
            if (serverHealth.lastSeenAt) {
                device.lastSeenAt = new Date(serverHealth.lastSeenAt);
            }
            else {
                device.lastSeenAt = null;
            }
            device.syncDetails = {
                ...device.syncDetails,
                lastHealthCheckAt: new Date().toISOString(),
                lastSeenAt: serverHealth.lastSeenAt || null,
                deviceStatus: serverHealth.deviceStatus || null,
            };
            await this.deviceRepo.save(device);
        }
        return {
            success: true,
            device,
            health: healthResult,
        };
    }
    async registerGateway(data) {
        const gateway = this.gatewayRepo.create(data);
        return await this.gatewayRepo.save(gateway);
    }
    async updatePayloadFormatter(devEUI, script) {
        const device = await this.deviceRepo.findOne({ where: { devEUI: devEUI.toUpperCase() } });
        if (!device) {
            throw new common_1.NotFoundException(`Device with DevEUI ${devEUI} not found`);
        }
        device.payloadFormatterScript = script;
        return await this.deviceRepo.save(device);
    }
    async getDecoderScript(device) {
        if (device.payloadFormatterScript)
            return device.payloadFormatterScript;
        if (device.decoderId) {
            try {
                const dec = await this.decoderRepo.findOne({ where: { id: device.decoderId } });
                if (dec && dec.decoderCode) {
                    return dec.decoderCode;
                }
            }
            catch (err) {
                this.logger.warn(`Could not load decoder '${device.decoderId}': ${err.message}`);
            }
        }
        return null;
    }
    async recordWebhookLog(data) {
        try {
            const repo = this.webhookLogRepo;
            const log = repo.create({
                serverType: data.serverType,
                devEUI: (data.devEUI || 'UNKNOWN').toUpperCase(),
                fPort: Number(data.fPort) || 1,
                fCnt: Number(data.fCnt) || 0,
                payloadHex: (data.payloadHex || '').toUpperCase(),
                decodedData: data.decodedData || null,
                rawPayload: data.rawPayload || null,
                status: data.status || (data.decodedData?.error ? 'ERROR' : 'SUCCESS'),
                errorMessage: data.errorMessage || (data.decodedData?.error ? String(data.decodedData.error) : null),
            });
            await repo.save(log);
            const count = await repo.count({ where: { serverType: data.serverType } });
            if (count > 200) {
                const excess = count - 200;
                const oldest = await repo.find({
                    where: { serverType: data.serverType },
                    order: { receivedAt: 'ASC' },
                    take: excess,
                    select: ['id'],
                });
                if (oldest.length > 0) {
                    await repo.delete(oldest.map(r => r.id));
                }
            }
        }
        catch (err) {
            this.logger.warn(`Failed to record webhook log: ${err.message}`);
        }
    }
    extractBestGateway(rxInfo) {
        if (!Array.isArray(rxInfo) || rxInfo.length === 0) {
            return { gatewayId: null, rssi: null, snr: null, channel: null };
        }
        let best = rxInfo[0];
        for (let i = 1; i < rxInfo.length; i++) {
            const g = rxInfo[i];
            if (g.rssi != null && (best.rssi == null || Number(g.rssi) > Number(best.rssi) || (Number(g.rssi) === Number(best.rssi) && Number(g.snr) > Number(best.snr)))) {
                best = g;
            }
        }
        return {
            gatewayId: best.gatewayId ? String(best.gatewayId) : null,
            rssi: best.rssi != null ? Number(best.rssi) : null,
            snr: best.snr != null ? Number(best.snr) : null,
            channel: best.channel != null ? Number(best.channel) : null,
        };
    }
    async handleUplink(devEUI, payloadHex, fPort = 1, fCnt = 1) {
        const cleanDevEUI = devEUI.trim().toUpperCase();
        const device = await this.deviceRepo.findOne({ where: { devEUI: cleanDevEUI } });
        let decodedData = {};
        if (device) {
            const script = await this.getDecoderScript(device);
            if (script) {
                try {
                    decodedData = this.payloadFormatterService.decodePayload(script, payloadHex, fPort);
                }
                catch (err) {
                    decodedData = { error: err.message };
                }
            }
        }
        if (device) {
            device.lastSeenAt = new Date();
            if (device.syncDetails) {
                device.syncDetails.lastSeenAt = device.lastSeenAt.toISOString();
            }
            await this.deviceRepo.save(device);
        }
        const telemetry = this.telemetryRepo.create({
            timestamp: new Date(),
            devEui: cleanDevEUI,
            payloadHex,
            fPort,
            fCnt,
            decodedData,
            serverType: 'GENERIC',
        });
        await this.telemetryRepo.save(telemetry);
        try {
            this.realtimeService.publishTelemetry(telemetry);
        }
        catch (e) { }
        this.recordWebhookLog({
            serverType: 'GENERIC',
            devEUI: cleanDevEUI,
            fPort,
            fCnt,
            payloadHex,
            decodedData,
            rawPayload: { devEUI: cleanDevEUI, payloadHex, fPort, fCnt },
        }).catch(() => { });
        return {
            success: true,
            devEUI: cleanDevEUI,
            decodedData,
            telemetry,
        };
    }
    async handleChirpstackWebhook(body) {
        const timestamp = body.time ? new Date(body.time) : new Date();
        const devEUI = (body.deviceInfo?.devEui ||
            body.devEUI ||
            body.devEui ||
            body.deviceInfo?.devEUI ||
            body.devAddr ||
            'UNKNOWN_CHIRPSTACK_DEVICE').trim().toUpperCase();
        const fPort = Number(body.fPort ?? body.f_port ?? 1);
        const fCnt = Number(body.fCnt ?? body.f_cnt ?? 0);
        const dr = body.dr != null ? Number(body.dr) : undefined;
        const adr = body.adr != null ? Boolean(body.adr) : undefined;
        const data = body.data || body.payloadHex || undefined;
        let payloadHex = '';
        if (body.data) {
            try {
                payloadHex = Buffer.from(body.data, 'base64').toString('hex');
            }
            catch (e) {
                payloadHex = '';
            }
        }
        else if (body.payloadHex) {
            payloadHex = body.payloadHex;
        }
        const bestGw = this.extractBestGateway(body.rxInfo);
        const frequency = body.txInfo?.frequency ? Number(body.txInfo.frequency) : undefined;
        const bandwidth = body.txInfo?.modulation?.lora?.bandwidth != null ? Number(body.txInfo.modulation.lora.bandwidth) : undefined;
        const spreadingFactor = body.txInfo?.modulation?.lora?.spreadingFactor != null ? Number(body.txInfo.modulation.lora.spreadingFactor) : undefined;
        const tenantId = body.deviceInfo?.tenantId || undefined;
        const applicationId = body.deviceInfo?.applicationId || undefined;
        const deviceName = body.deviceInfo?.deviceName || undefined;
        const deviceProfileName = body.deviceInfo?.deviceProfileName || undefined;
        const devAddr = body.devAddr || undefined;
        let decodedData = body.object || (body.objectJSON ? (typeof body.objectJSON === 'string' ? JSON.parse(body.objectJSON) : body.objectJSON) : null);
        const device = await this.deviceRepo.findOne({ where: { devEUI } });
        if (device) {
            device.lastSeenAt = new Date();
            if (device.syncDetails) {
                device.syncDetails.lastSeenAt = device.lastSeenAt.toISOString();
            }
            await this.deviceRepo.save(device);
        }
        if (!decodedData || Object.keys(decodedData).length === 0) {
            if (device && payloadHex) {
                const script = await this.getDecoderScript(device);
                if (script) {
                    try {
                        decodedData = this.payloadFormatterService.decodePayload(script, payloadHex, fPort);
                    }
                    catch (e) {
                        decodedData = { error: e.message };
                    }
                }
            }
        }
        const telemetry = this.telemetryRepo.create({
            timestamp,
            devEui: devEUI,
            fPort,
            fCnt,
            dr,
            adr,
            data,
            payloadHex: payloadHex || '00',
            gatewayId: bestGw.gatewayId || undefined,
            rssi: bestGw.rssi != null ? bestGw.rssi : undefined,
            snr: bestGw.snr != null ? bestGw.snr : undefined,
            channel: bestGw.channel != null ? bestGw.channel : undefined,
            frequency,
            bandwidth,
            spreadingFactor,
            tenantId,
            applicationId,
            deviceName,
            deviceProfileName,
            devAddr,
            object: body.object || undefined,
            decodedData: decodedData || {},
            serverType: 'CHIRPSTACK',
        });
        await this.telemetryRepo.save(telemetry);
        try {
            this.realtimeService.publishTelemetry(telemetry);
        }
        catch (e) { }
        this.recordWebhookLog({
            serverType: 'CHIRPSTACK',
            devEUI,
            fPort,
            fCnt,
            payloadHex: payloadHex || '',
            decodedData: decodedData || {},
            rawPayload: body,
            status: decodedData?.error ? 'ERROR' : 'SUCCESS',
            errorMessage: decodedData?.error || undefined,
        }).catch(() => { });
        this.logger.log(`📥 Processed ChirpStack Webhook: DevEUI=${devEUI}, Port=${fPort}, FCnt=${fCnt}, RSSI=${bestGw.rssi}, SNR=${bestGw.snr}, Freq=${frequency}`);
        return {
            success: true,
            source: 'ChirpStack',
            devEUI,
            fPort,
            fCnt,
            dr,
            adr,
            data,
            payloadHex,
            gatewayId: bestGw.gatewayId,
            rssi: bestGw.rssi,
            snr: bestGw.snr,
            channel: bestGw.channel,
            frequency,
            bandwidth,
            spreadingFactor,
            decodedData,
            telemetryId: telemetry.id,
            timestamp: telemetry.timestamp,
            receivedAt: telemetry.receivedAt,
        };
    }
    async handleThingparkWebhook(body) {
        const uplink = body.DevEUI_uplink || body;
        const timestamp = uplink.Time ? new Date(uplink.Time) : new Date();
        const devEUI = (uplink.DevEUI || uplink.devEUI || uplink.devEui || 'UNKNOWN_THINGPARK_DEVICE').trim().toUpperCase();
        let payloadHex = '';
        if (uplink.payload_hex) {
            payloadHex = uplink.payload_hex;
        }
        else if (uplink.payload) {
            try {
                payloadHex = Buffer.from(uplink.payload, 'base64').toString('hex');
            }
            catch (e) {
                payloadHex = '';
            }
        }
        const fPort = Number(uplink.FPort || uplink.fPort || 1);
        const fCnt = Number(uplink.FCntUp || uplink.fCnt || 0);
        const dr = uplink.SpFact ? Number(uplink.SpFact) : undefined;
        const adr = uplink.ADRBit != null ? Boolean(uplink.ADRBit) : undefined;
        const data = uplink.payload || uplink.payload_hex || undefined;
        let bestGwId = null;
        let bestRssi = uplink.LrrRSSI != null ? Number(uplink.LrrRSSI) : null;
        let bestSnr = uplink.LrrSNR != null ? Number(uplink.LrrSNR) : null;
        let channel = uplink.Channel != null ? Number(uplink.Channel) : null;
        if (uplink.Lrrs && Array.isArray(uplink.Lrrs.Lrr)) {
            for (const lrr of uplink.Lrrs.Lrr) {
                const r = lrr.LrrRSSI != null ? Number(lrr.LrrRSSI) : null;
                const s = lrr.LrrSNR != null ? Number(lrr.LrrSNR) : null;
                if (r != null && (bestRssi == null || r > bestRssi)) {
                    bestRssi = r;
                    bestSnr = s;
                    bestGwId = lrr.Lrrid ? String(lrr.Lrrid) : null;
                }
            }
        }
        const frequency = uplink.Frequency ? Math.round(Number(uplink.Frequency) * 1000000) : undefined;
        const spreadingFactor = uplink.SpFact != null ? Number(uplink.SpFact) : undefined;
        const bandwidth = uplink.Bandwidth ? Math.round(Number(uplink.Bandwidth) < 1000 ? Number(uplink.Bandwidth) * 1000 : Number(uplink.Bandwidth)) : undefined;
        const devAddr = uplink.DevAddr || undefined;
        let decodedData = uplink.DriverCfg || null;
        const device = await this.deviceRepo.findOne({ where: { devEUI } });
        if (device) {
            device.lastSeenAt = new Date();
            if (device.syncDetails) {
                device.syncDetails.lastSeenAt = device.lastSeenAt.toISOString();
            }
            await this.deviceRepo.save(device);
        }
        if (device && payloadHex) {
            const script = await this.getDecoderScript(device);
            if (script) {
                try {
                    decodedData = this.payloadFormatterService.decodePayload(script, payloadHex, fPort);
                }
                catch (e) {
                    decodedData = { error: e.message };
                }
            }
        }
        const telemetry = this.telemetryRepo.create({
            timestamp,
            devEui: devEUI,
            fPort,
            fCnt,
            dr,
            adr,
            data,
            payloadHex: payloadHex || '00',
            gatewayId: bestGwId || undefined,
            rssi: bestRssi != null ? bestRssi : undefined,
            snr: bestSnr != null ? bestSnr : undefined,
            channel: channel != null ? channel : undefined,
            frequency,
            bandwidth,
            spreadingFactor,
            devAddr,
            object: (decodedData && Object.keys(decodedData).length > 0 && !decodedData.error) ? decodedData : (uplink.object || undefined),
            decodedData: decodedData || {},
            serverType: 'THINGPARK',
        });
        await this.telemetryRepo.save(telemetry);
        try {
            this.realtimeService.publishTelemetry(telemetry);
        }
        catch (e) { }
        this.recordWebhookLog({
            serverType: 'THINGPARK',
            devEUI,
            fPort,
            fCnt,
            payloadHex: payloadHex || '',
            decodedData: decodedData || {},
            rawPayload: body,
            status: decodedData?.error ? 'ERROR' : 'SUCCESS',
            errorMessage: decodedData?.error || undefined,
        }).catch(() => { });
        this.logger.log(`📥 Processed ThingPark Webhook: DevEUI=${devEUI}, Port=${fPort}, FCnt=${fCnt}`);
        return {
            success: true,
            source: 'ThingPark',
            devEUI,
            fPort,
            fCnt,
            payloadHex,
            decodedData,
            telemetryId: telemetry.id,
            timestamp: telemetry.timestamp,
            receivedAt: telemetry.receivedAt,
        };
    }
    testPayloadFormatter(script, bytesHex, fPort = 1) {
        return this.payloadFormatterService.decodePayload(script, bytesHex, fPort);
    }
    async listDevices(user) {
        const isSuperAdmin = isUserSuperAdmin(user);
        let devices;
        if (isSuperAdmin || !user || !user.id) {
            devices = await this.deviceRepo.find({
                relations: ['networkServer', 'owner', 'itemCode', 'salesOrder'],
                order: { createdAt: 'DESC' },
            });
        }
        else {
            devices = await this.deviceRepo.find({
                where: { ownerId: user.id },
                relations: ['networkServer', 'owner', 'itemCode', 'salesOrder'],
                order: { createdAt: 'DESC' },
            });
        }
        const activeThreshold = 24 * 60 * 60 * 1000;
        const now = Date.now();
        return devices.map((d) => {
            let regionProfileName = '';
            if (d.networkServer && d.regionProfileId && Array.isArray(d.networkServer.regionProfiles)) {
                const rp = d.networkServer.regionProfiles.find((p) => p.id === d.regionProfileId);
                if (rp) {
                    regionProfileName = `${rp.name} (${rp.region})`;
                }
            }
            const lastSeen = d.lastSeenAt || (d.syncDetails?.lastSeenAt ? new Date(d.syncDetails.lastSeenAt) : null);
            const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;
            const isOnline = Boolean(d.isActive &&
                lastSeenTime > 0 &&
                (now - lastSeenTime < activeThreshold));
            return {
                ...d,
                sku: d.sku || '',
                firmwareVersion: d.firmwareVersion ? (0, lorawan_utils_1.cleanFirmwareVersion)(d.firmwareVersion) : '',
                isOnline,
                neverJoined: lastSeenTime === 0,
                regionProfileName: regionProfileName || d.regionProfileId || '',
                itemCode: d.itemCode ? {
                    id: d.itemCode.id,
                    itemCode: d.itemCode.itemCode,
                    sku: d.itemCode.sku,
                    firmwareVersion: d.itemCode.firmwareVersion,
                    skuFw: d.itemCode.skuFw,
                    defaultTemplateId: d.itemCode.defaultTemplateId,
                } : (d.itemCodeId ? { id: d.itemCodeId } : null),
                salesOrder: d.salesOrder ? {
                    id: d.salesOrder.id,
                    soCode: d.salesOrder.soCode,
                    customer: d.salesOrder.customer,
                } : (d.salesOrderId ? { id: d.salesOrderId } : null),
                owner: d.owner ? {
                    id: d.owner.id,
                    username: d.owner.username,
                    fullName: d.owner.fullName || d.owner.username,
                    email: d.owner.email,
                } : null,
            };
        });
    }
    async findOneDevice(devEUI, user) {
        const device = await this.deviceRepo.findOne({
            where: { devEUI: devEUI.toUpperCase() },
            relations: ['networkServer', 'owner', 'itemCode', 'salesOrder'],
        });
        if (!device) {
            throw new common_1.NotFoundException(`Device with DevEUI ${devEUI} not found`);
        }
        if (!isUserSuperAdmin(user) && device.ownerId && user?.id && device.ownerId !== user.id) {
            throw new common_1.ForbiddenException('Device not found or not owned by you.');
        }
        return device;
    }
    async getDevice(id) {
        const device = await this.deviceRepo.findOne({
            where: { id },
            relations: ['networkServer'],
        });
        if (device) {
            const lastSeen = device.lastSeenAt ? new Date(device.lastSeenAt).getTime() : 0;
            const now = Date.now();
            device.isOnline = Boolean(device.isActive && lastSeen > 0 && (now - lastSeen) < (24 * 60 * 60 * 1000));
            device.neverJoined = lastSeen === 0;
        }
        return device;
    }
    async listGateways() {
        return await this.gatewayRepo.find({
            relations: ['networkServer'],
        });
    }
    async getTelemetry(devEUI, limit = 50, options) {
        const qb = this.telemetryRepo.createQueryBuilder('telemetry');
        const order = options?.order || 'DESC';
        qb.orderBy('telemetry.timestamp', order);
        if (limit && limit > 0) {
            qb.take(limit);
        }
        if (options?.devEUIs && options.devEUIs.length > 0) {
            const upperEUIs = options.devEUIs.map(e => e.trim().toUpperCase()).filter(Boolean);
            if (upperEUIs.length === 1) {
                qb.andWhere('UPPER(telemetry.devEui) = :eui', { eui: upperEUIs[0] });
            }
            else if (upperEUIs.length > 1) {
                qb.andWhere('UPPER(telemetry.devEui) IN (:...euis)', { euis: upperEUIs });
            }
        }
        else if (devEUI) {
            qb.andWhere('UPPER(telemetry.devEui) = :devEUI', { devEUI: devEUI.toUpperCase() });
        }
        if (options?.from) {
            const fromDate = new Date(options.from);
            if (!isNaN(fromDate.getTime())) {
                qb.andWhere('telemetry.timestamp >= :from', { from: fromDate });
            }
        }
        if (options?.to) {
            const toDate = new Date(options.to);
            if (!isNaN(toDate.getTime())) {
                qb.andWhere('telemetry.timestamp <= :to', { to: toDate });
            }
        }
        return await qb.getMany();
    }
    async getDeviceTelemetryFields(devEUI) {
        const normEUI = (devEUI || '').trim().toUpperCase();
        const records = await this.telemetryRepo.createQueryBuilder('telemetry')
            .where('UPPER(telemetry.devEui) = :devEUI', { devEUI: normEUI })
            .orderBy('telemetry.timestamp', 'DESC')
            .take(30)
            .getMany();
        const fieldMap = new Map();
        const standardLoraFields = [
            { key: 'battery', label: 'Battery Level', unit: '%', def: 100 },
            { key: 'rssi', label: 'Signal RSSI', unit: 'dBm', def: -75 },
            { key: 'snr', label: 'Signal SNR', unit: 'dB', def: 9.5 },
            { key: 'fCnt', label: 'Frame Counter (fCnt)', unit: '', def: 1 },
            { key: 'dr', label: 'Data Rate (DR)', unit: '', def: 3 },
            { key: 'fPort', label: 'fPort', unit: '', def: 1 },
            { key: 'frequency', label: 'Frequency', unit: 'Hz', def: 868300000 },
        ];
        for (const sf of standardLoraFields) {
            fieldMap.set(sf.key, {
                key: sf.key,
                label: sf.label,
                latestValue: sf.def,
                dataType: 'number',
                unit: sf.unit,
                source: 'lora_metric',
            });
        }
        let lastTelemetryAt;
        if (records && records.length > 0) {
            lastTelemetryAt = records[0].timestamp;
            for (const rec of records) {
                if (rec.rssi !== undefined && rec.rssi !== null) {
                    fieldMap.set('rssi', { key: 'rssi', label: 'Signal RSSI', latestValue: rec.rssi, dataType: 'number', unit: 'dBm', source: 'lora_metric', lastSeen: rec.timestamp });
                }
                if (rec.snr !== undefined && rec.snr !== null) {
                    fieldMap.set('snr', { key: 'snr', label: 'Signal SNR', latestValue: rec.snr, dataType: 'number', unit: 'dB', source: 'lora_metric', lastSeen: rec.timestamp });
                }
                if (rec.fCnt !== undefined && rec.fCnt !== null) {
                    fieldMap.set('fCnt', { key: 'fCnt', label: 'Frame Counter', latestValue: rec.fCnt, dataType: 'number', unit: '', source: 'lora_metric', lastSeen: rec.timestamp });
                }
                if (rec.dr !== undefined && rec.dr !== null) {
                    fieldMap.set('dr', { key: 'dr', label: 'Data Rate', latestValue: rec.dr, dataType: 'number', unit: '', source: 'lora_metric', lastSeen: rec.timestamp });
                }
                if (rec.fPort !== undefined && rec.fPort !== null) {
                    fieldMap.set('fPort', { key: 'fPort', label: 'fPort', latestValue: rec.fPort, dataType: 'number', unit: '', source: 'lora_metric', lastSeen: rec.timestamp });
                }
                const parseIfString = (val) => {
                    if (typeof val === 'string') {
                        try {
                            return JSON.parse(val);
                        }
                        catch {
                            return null;
                        }
                    }
                    return val;
                };
                const detectUnit = (key) => {
                    const lowerK = key.toLowerCase();
                    if (lowerK.includes('temp'))
                        return '°C';
                    if (lowerK.includes('hum'))
                        return '%RH';
                    if (lowerK.includes('press') || lowerK.includes('bar') || lowerK.includes('kpa'))
                        return 'bar';
                    if (lowerK.includes('volt'))
                        return 'V';
                    if (lowerK.includes('curr') || lowerK.includes('amp'))
                        return 'A';
                    if (lowerK.includes('kwh') || lowerK.includes('energy'))
                        return 'kWh';
                    if (lowerK.includes('kvarh'))
                        return 'kVARh';
                    if (lowerK.includes('level') || lowerK.includes('tank'))
                        return '%';
                    if (lowerK.includes('flow') || lowerK.includes('speed'))
                        return 'm³/h';
                    if (lowerK.includes('power') && !lowerK.includes('source') && !lowerK.includes('level'))
                        return 'W';
                    if (lowerK.includes('ppm') || lowerK.includes('co2'))
                        return 'ppm';
                    if (lowerK.includes('lux') || lowerK.includes('light'))
                        return 'lux';
                    if (lowerK.includes('freq') || lowerK.includes('hz'))
                        return 'Hz';
                    if (lowerK.includes('ph'))
                        return 'pH';
                    if (lowerK.includes('conductivity') || lowerK.includes('ec'))
                        return 'µS/cm';
                    return '';
                };
                const formatLabel = (key) => {
                    return key
                        .replace(/_/g, ' ')
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/\s+/g, ' ')
                        .trim()
                        .toUpperCase();
                };
                const registerField = (tagKey, val, timestamp) => {
                    if (val === undefined || val === null)
                        return;
                    const label = formatLabel(tagKey);
                    const unit = detectUnit(tagKey);
                    const dataType = typeof val;
                    const existing = fieldMap.get(tagKey);
                    if (!existing || existing.source === 'default' || existing.source === 'lora_metric') {
                        fieldMap.set(tagKey, {
                            key: tagKey,
                            label: label || tagKey,
                            latestValue: val,
                            dataType: typeof val === 'object' ? 'json' : dataType,
                            unit,
                            source: 'decoded_payload',
                            lastSeen: timestamp,
                        });
                    }
                };
                const scanRecursive = (obj, prefix = '', timestamp) => {
                    if (!obj || typeof obj !== 'object')
                        return;
                    for (const [k, v] of Object.entries(obj)) {
                        if (k === 'error' || k === 'errors' || k === 'warnings')
                            continue;
                        const fullKey = prefix ? `${prefix}.${k}` : k;
                        if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
                            scanRecursive(v, fullKey, timestamp);
                        }
                        else if (v !== undefined && v !== null) {
                            let cleanKey = fullKey;
                            if (cleanKey.startsWith('data.')) {
                                cleanKey = cleanKey.substring(5);
                            }
                            registerField(cleanKey, v, timestamp);
                            if (cleanKey !== k && !fieldMap.has(k)) {
                                registerField(k, v, timestamp);
                            }
                        }
                    }
                };
                const objectsToScan = [rec.object, rec.decodedData].filter(Boolean);
                for (const raw of objectsToScan) {
                    const parsed = parseIfString(raw);
                    if (parsed && typeof parsed === 'object') {
                        scanRecursive(parsed, '', rec.timestamp);
                    }
                }
            }
        }
        const fields = Array.from(fieldMap.values()).sort((a, b) => {
            if (a.source === 'decoded_payload' && b.source !== 'decoded_payload')
                return -1;
            if (a.source !== 'decoded_payload' && b.source === 'decoded_payload')
                return 1;
            return a.key.localeCompare(b.key);
        });
        return {
            devEUI: normEUI,
            fields,
            lastTelemetryAt,
            totalRecordsScanned: records.length,
        };
    }
};
exports.LorawanService = LorawanService;
exports.LorawanService = LorawanService = LorawanService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dynamic_database_service_1.DynamicDatabaseService,
        payload_formatter_service_1.PayloadFormatterService,
        device_provisioning_service_1.DeviceProvisioningService,
        realtime_service_1.RealtimeService])
], LorawanService);
//# sourceMappingURL=lorawan.service.js.map