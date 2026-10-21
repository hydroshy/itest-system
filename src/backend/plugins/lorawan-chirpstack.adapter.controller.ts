import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { DynamicDatabaseService } from '../database/dynamic-database.service';
import { ChirpstackNetworkServerEntity } from '../core-models/chirpstack-network-server.entity';
import * as path from 'path';
import * as fs from 'fs';
import { ChirpStackPlugin } from './lorawan-chirpstack-core';

@Controller()
export class LorawanChirpstackAdapterController implements OnModuleInit {
  private readonly logger = new Logger(LorawanChirpstackAdapterController.name);
  private pluginInstance: any = null;
  private controllerInstance: any = null;

  constructor(private readonly databaseService: DynamicDatabaseService) {
    this.initPlugin();
  }

  onModuleInit(): void {
    try {
      const service = this.pluginInstance?.getService?.();
      service?.setNetworkServerRepository?.(
        this.databaseService.getRepositoryForTable('network_servers', ChirpstackNetworkServerEntity),
      );
    } catch (err: any) {
      this.logger.warn(`ChirpStack Network Server persistence is unavailable: ${err.message}`);
    }
  }

  private initPlugin() {
    try {
      // 1. Try external candidate paths (if mounted in container or development)
      const candidatePaths = [
        path.resolve(process.cwd(), '../itest-plugins/plugins/lorawan-chirpstack/backend/dist/index.js'),
        path.resolve(process.cwd(), 'plugins/lorawan-chirpstack/backend/dist/index.js'),
        path.resolve(process.cwd(), '../plugins/lorawan-chirpstack/backend/dist/index.js'),
        path.resolve(__dirname, '../../../../../itest-plugins/plugins/lorawan-chirpstack/backend/dist/index.js'),
      ];

      let entryFile: string | null = null;
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          entryFile = p;
          break;
        }
      }

      if (entryFile) {
        this.logger.log(`Found external lorawan-chirpstack backend runtime at: ${entryFile}`);
        const mod = require(entryFile);
        const ExternalPlugin = mod.default || mod.ChirpStackPlugin;
        if (ExternalPlugin) {
          this.pluginInstance = new ExternalPlugin();
          this.controllerInstance = this.pluginInstance.getController();
          this.logger.log('Successfully initialized external ChirpStackPlugin runtime');
          return;
        }
      }

      // 2. Fallback to embedded internal core (always packaged & compiled into itest-system)
      this.logger.log('Initializing embedded internal LoRaWAN ChirpStack core runtime...');
      this.pluginInstance = new ChirpStackPlugin();
      this.controllerInstance = this.pluginInstance.getController();
      this.logger.log('Embedded LoRaWAN ChirpStack core runtime initialized successfully');
    } catch (err: any) {
      this.logger.error(`Failed to initialize ChirpStackPlugin runtime: ${err.message}`, err.stack);
      // Ensure fallback is initialized even if external require throws
      this.pluginInstance = new ChirpStackPlugin();
      this.controllerInstance = this.pluginInstance.getController();
    }
  }

  private getController() {
    if (!this.controllerInstance) {
      this.initPlugin();
    }
    return this.controllerInstance;
  }

  // --- Network Servers ---

  @Get(['api/plugins/lorawan-chirpstack/servers', 'api/v1/plugins/lorawan-chirpstack/servers'])
  async getServers() {
    const ctrl = this.getController();
    return ctrl.getServers();
  }

  @Post(['api/plugins/lorawan-chirpstack/servers', 'api/v1/plugins/lorawan-chirpstack/servers'])
  async addServer(@Body() dto: any) {
    const ctrl = this.getController();
    return ctrl.addServer(dto);
  }

  @Delete(['api/plugins/lorawan-chirpstack/servers/:id', 'api/v1/plugins/lorawan-chirpstack/servers/:id'])
  async deleteServer(@Param('id') id: string) {
    const ctrl = this.getController();
    return ctrl.deleteServer(id);
  }

  @Post(['api/plugins/lorawan-chirpstack/servers/:id/test', 'api/v1/plugins/lorawan-chirpstack/servers/:id/test'])
  async testServer(@Param('id') id: string) {
    const ctrl = this.getController();
    return ctrl.testServer(id);
  }

  // --- Tenants ---

  @Get(['api/plugins/lorawan-chirpstack/tenants', 'api/v1/plugins/lorawan-chirpstack/tenants'])
  async getTenants(@Query('serverId') serverId?: string) {
    const ctrl = this.getController();
    return ctrl.getTenants(serverId);
  }

  @Post(['api/plugins/lorawan-chirpstack/tenants', 'api/v1/plugins/lorawan-chirpstack/tenants'])
  async addTenant(@Body() dto: any) {
    const ctrl = this.getController();
    return ctrl.addTenant(dto);
  }

  @Delete(['api/plugins/lorawan-chirpstack/tenants/:id', 'api/v1/plugins/lorawan-chirpstack/tenants/:id'])
  async deleteTenant(@Param('id') id: string, @Query('serverId') serverId?: string) {
    const ctrl = this.getController();
    return ctrl.deleteTenant(serverId || '', id);
  }

  // --- Gateways ---

  @Get(['api/plugins/lorawan-chirpstack/gateways', 'api/v1/plugins/lorawan-chirpstack/gateways'])
  async getGateways(@Query('serverId') serverId?: string) {
    const ctrl = this.getController();
    return ctrl.getGateways(serverId);
  }

  @Post(['api/plugins/lorawan-chirpstack/gateways', 'api/v1/plugins/lorawan-chirpstack/gateways'])
  async addGateway(@Body() dto: any) {
    const ctrl = this.getController();
    return ctrl.addGateway(dto);
  }

  @Delete(['api/plugins/lorawan-chirpstack/gateways/:id', 'api/v1/plugins/lorawan-chirpstack/gateways/:id'])
  async deleteGateway(@Param('id') id: string, @Query('serverId') serverId?: string) {
    const ctrl = this.getController();
    return ctrl.deleteGateway(id, serverId);
  }

  // --- Devices ---

  @Get(['api/plugins/lorawan-chirpstack/devices', 'api/v1/plugins/lorawan-chirpstack/devices'])
  async getDevices(@Query('serverId') serverId?: string, @Query('applicationId') applicationId?: string) {
    const ctrl = this.getController();
    return ctrl.getDevices(serverId, applicationId);
  }

  @Post(['api/plugins/lorawan-chirpstack/devices', 'api/v1/plugins/lorawan-chirpstack/devices'])
  async addDevice(@Body() dto: any) {
    const ctrl = this.getController();
    return ctrl.addDevice(dto);
  }

  @Delete(['api/plugins/lorawan-chirpstack/devices/:id', 'api/v1/plugins/lorawan-chirpstack/devices/:id'])
  async deleteDevice(@Param('id') id: string, @Query('serverId') serverId?: string) {
    const ctrl = this.getController();
    return ctrl.deleteDevice(id, serverId);
  }

  // --- Applications & Profiles ---

  @Get(['api/plugins/lorawan-chirpstack/applications', 'api/v1/plugins/lorawan-chirpstack/applications'])
  async getApplications(@Query('serverId') serverId?: string) {
    const ctrl = this.getController();
    return ctrl.getApplications(serverId);
  }

  @Get(['api/plugins/lorawan-chirpstack/device-profiles', 'api/v1/plugins/lorawan-chirpstack/device-profiles'])
  async getDeviceProfiles(@Query('serverId') serverId?: string) {
    const ctrl = this.getController();
    return ctrl.getDeviceProfiles(serverId);
  }

  // --- Uplinks & Webhook ---

  @Get(['api/plugins/lorawan-chirpstack/uplinks', 'api/v1/plugins/lorawan-chirpstack/uplinks'])
  async getUplinks(@Query('limit') limit?: string, @Query('devEui') devEui?: string) {
    const ctrl = this.getController();
    const l = limit ? parseInt(limit, 10) : undefined;
    return ctrl.getUplinks(l, devEui);
  }

  @Post(['api/plugins/lorawan-chirpstack/uplinks', 'api/v1/plugins/lorawan-chirpstack/uplinks'])
  async handleUplink(@Body() body: any) {
    const ctrl = this.getController();
    return ctrl.handleUplink(body);
  }

  // --- Payload Decoder ---

  @Post(['api/plugins/lorawan-chirpstack/decode', 'api/v1/plugins/lorawan-chirpstack/decode'])
  async decodePayload(@Body() dto: any) {
    const ctrl = this.getController();
    return ctrl.decodePayload(dto);
  }
}
