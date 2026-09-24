import { Injectable, Logger } from '@nestjs/common';
import { NetworkServerEntity, NetworkServerType, RegionProfile } from '../../network-servers/entities/network-server.entity';
import { RegisterDeviceDto } from '../dto/lorawan.dto';
import { LorawanResilienceService } from './lorawan-resilience.service';
import { cleanDevEUI } from '../common/lorawan-utils';

export interface ProvisioningStepResult {
  step: number;
  stepName: string;
  endpoint: string;
  method: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'SKIPPED';
  httpStatus?: number;
  message: string;
  payload?: any;
  response?: any;
}

export interface ProvisioningResult {
  success: boolean;
  serverType: NetworkServerType;
  serverName: string;
  totalSteps: number;
  steps: ProvisioningStepResult[];
  syncStatus: 'SYNCED' | 'LOCAL' | 'FAILED';
  summaryMessage: string;
  errorMessage?: string;
}

@Injectable()
export class DeviceProvisioningService {
  private readonly logger = new Logger(DeviceProvisioningService.name);

  constructor(private readonly resilienceService: LorawanResilienceService) {}

  /**
   * Provision device according to network server type:
   * - THINGPARK: 1-step provisioning (Device + AppEUI + AppKey in single payload)
   * - CHIRPSTACK: 2-step provisioning (Step 1: Create/Update device -> Step 2: Set/Update AppKey)
   */
  async provisionDevice(
    server: NetworkServerEntity,
    regionProfile: RegionProfile | undefined,
    dto: RegisterDeviceDto,
    isEdit: boolean = false,
  ): Promise<ProvisioningResult> {
    if (server.type === NetworkServerType.CHIRPSTACK) {
      return await this.provisionChirpstack(server, regionProfile, dto, isEdit);
    } else {
      return await this.provisionThingpark(server, regionProfile, dto, isEdit);
    }
  }

  /**
   * Helper to auto-discover Application ID from ChirpStack
   */
  private async discoverChirpstackApplicationId(baseUrl: string, headers: Record<string, string>): Promise<string | null> {
    try {
      const endpoints = [`${baseUrl}/api/applications?limit=50`, `${baseUrl}/api/v4/applications?limit=50`];
      for (const ep of endpoints) {
        const res = await this.resilienceService.safeFetch(ep, { headers });
        if (res.ok && res.data) {
          const list = (res.data as any).result || (res.data as any).applications || [];
          if (Array.isArray(list) && list.length > 0 && list[0].id) {
            return String(list[0].id).trim();
          }
        }
      }
    } catch (e) {}
    return null;
  }

  /**
   * Helper to auto-discover Device Profile ID from ChirpStack
   */
  private async discoverChirpstackDeviceProfileId(
    baseUrl: string,
    headers: Record<string, string>,
    regionHint?: string,
  ): Promise<string | null> {
    try {
      const endpoints = [`${baseUrl}/api/device-profiles?limit=50`, `${baseUrl}/api/v4/device-profiles?limit=50`];
      for (const ep of endpoints) {
        const res = await this.resilienceService.safeFetch(ep, { headers });
        if (res.ok && res.data) {
          const list = (res.data as any).result || (res.data as any).deviceProfiles || [];
          if (Array.isArray(list) && list.length > 0) {
            if (regionHint) {
              const cleanedHint = regionHint.toLowerCase().replace(/[^a-z0-9]/g, '');
              const matched = list.find((dp: any) => {
                const name = (dp.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const reg = (dp.region || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                return name.includes(cleanedHint) || reg.includes(cleanedHint);
              });
              if (matched && matched.id) return String(matched.id).trim();
            }
            if (list[0].id) return String(list[0].id).trim();
          }
        }
      }
    } catch (e) {}
    return null;
  }

  /**
   * ChirpStack v4 API (2-Step Device Provisioning)
   * - When creating (isEdit = false): uses POST to detect if device already exists.
   * - When editing (isEdit = true): always uses PUT to update existing device and keys.
   */
  private async provisionChirpstack(
    server: NetworkServerEntity,
    regionProfile: RegionProfile | undefined,
    dto: RegisterDeviceDto,
    isEdit: boolean = false,
  ): Promise<ProvisioningResult> {
    const rawApiUrl = server.apiUrl?.trim() || 'https://chirpstack-test.globiots.com';
    const baseUrl = rawApiUrl.replace(/\/+$/, '');
    const apiKey = server.apiKey?.trim() || '';
    const devEui = dto.devEUI.trim().toLowerCase();
    const appEui = (dto.appEUI || '0102030405060708').trim().toLowerCase();
    const appKey = (dto.appKey || '0102030405060708090A0B0C0D0E0F10').trim().toLowerCase();

    const isUUID = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // 1. Resolve Application ID
    let applicationId = (server.applicationId || server.metadata?.applicationId || '').trim();
    if (!applicationId || !isUUID(applicationId)) {
      const discoveredApp = await this.discoverChirpstackApplicationId(baseUrl, headers);
      if (discoveredApp) {
        applicationId = discoveredApp;
      }
    }
    if (!applicationId || !isUUID(applicationId)) {
      applicationId = '00000000-0000-0000-0000-000000000001';
    }

    // 2. Resolve Device Profile ID
    let deviceProfileId = (regionProfile?.profileId || regionProfile?.id || '').trim();
    if (!deviceProfileId || !isUUID(deviceProfileId)) {
      const discoveredDp = await this.discoverChirpstackDeviceProfileId(
        baseUrl,
        headers,
        regionProfile?.region || regionProfile?.name,
      );
      if (discoveredDp) {
        deviceProfileId = discoveredDp;
      }
    }
    if (!deviceProfileId || !isUUID(deviceProfileId)) {
      deviceProfileId = '00000000-0000-0000-0000-000000000001';
    }

    const steps: ProvisioningStepResult[] = [];

    // Step 1 Payload Builder
    const buildStep1Payload = (appId: string, dpId: string) => ({
      device: {
        applicationId: appId,
        description: `Daviteq IoT Sensor - ${dto.name.trim()}`,
        devEui: devEui,
        deviceProfileId: dpId,
        isDisabled: dto.isActive !== undefined ? !dto.isActive : false,
        joinEui: appEui,
        name: dto.name.trim(),
        skipFcntCheck: true,
        tags: {
          managedBy: 'DaviteqPlatform',
          region: regionProfile?.region || 'AS923-1',
        },
        variables: {},
      },
    });

    let step1Payload = buildStep1Payload(applicationId, deviceProfileId);
    let step1Success = false;
    let step1ErrorMessage = '';

    try {
      if (isEdit) {
        // ALWAYS PUT on edit
        this.logger.log(`[ChirpStack] Updating device ${devEui} via PUT ${baseUrl}/api/devices/${devEui}`);
        let putEndpoint = `${baseUrl}/api/devices/${devEui}`;
        let resPut = await this.resilienceService.safeFetch(putEndpoint, {
          method: 'PUT',
          headers,
          body: JSON.stringify(step1Payload),
        });

        if (resPut.status === 404) {
          const altPut = `${baseUrl}/api/v4/devices/${devEui}`;
          const altRes = await this.resilienceService.safeFetch(altPut, {
            method: 'PUT',
            headers,
            body: JSON.stringify(step1Payload),
          });
          if (altRes && altRes.status !== 404) {
            resPut = altRes;
            putEndpoint = altPut;
          }
        }

        const resPutJson = resPut.data || {};
        const resPutText = typeof resPut.data === 'string' ? resPut.data : JSON.stringify(resPut.data || '');

        if (resPut.ok || resPut.status === 200 || resPut.status === 204) {
          step1Success = true;
          steps.push({
            step: 1,
            stepName: 'Update ChirpStack Device',
            endpoint: putEndpoint,
            method: 'PUT',
            status: 'SUCCESS',
            httpStatus: resPut.status,
            message: `Device ${devEui} updated successfully on ChirpStack`,
            payload: step1Payload,
            response: resPutJson,
          });
        } else if (resPut.status === 404) {
          step1ErrorMessage = `ChirpStack: Device ${devEui} not found on server (HTTP 404).`;
        } else if (resPut.status === 401 || resPut.status === 403) {
          step1ErrorMessage = `ChirpStack: Invalid API Key or Unauthorized (HTTP ${resPut.status}).`;
        } else {
          step1ErrorMessage = `ChirpStack: Failed to update device (HTTP ${resPut.status}): ${(resPutJson as any)?.message || resPutText || 'Update rejected'}`;
        }
      } else {
        // ALWAYS POST on create (to detect duplicate DevEUI)
        this.logger.log(`[ChirpStack] Registering device ${devEui} via POST ${baseUrl}/api/devices`);
        let endpoint = `${baseUrl}/api/devices`;
        let res1 = await this.resilienceService.safeFetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(step1Payload),
        });

        if (res1.status === 404) {
          const altEndpoint = `${baseUrl}/api/v4/devices`;
          const altRes = await this.resilienceService.safeFetch(altEndpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(step1Payload),
          });
          if (altRes && altRes.status !== 404) {
            res1 = altRes;
            endpoint = altEndpoint;
          }
        }

        let res1Json = res1.data || {};
        let res1Text = typeof res1.data === 'string' ? res1.data : JSON.stringify(res1.data || '');

        // Auto-discovery retry for 500 Record not found
        if (res1.status === 500 && (res1Text.includes('Record not found') || res1Text.includes('record not found'))) {
          const discoveredApp = await this.discoverChirpstackApplicationId(baseUrl, headers);
          const discoveredDp = await this.discoverChirpstackDeviceProfileId(
            baseUrl,
            headers,
            regionProfile?.region || regionProfile?.name,
          );

          if (discoveredApp && discoveredDp && (discoveredApp !== applicationId || discoveredDp !== deviceProfileId)) {
            applicationId = discoveredApp;
            deviceProfileId = discoveredDp;
            step1Payload = buildStep1Payload(applicationId, deviceProfileId);

            const retryRes = await this.resilienceService.safeFetch(endpoint, {
              method: 'POST',
              headers,
              body: JSON.stringify(step1Payload),
            });

            if (retryRes) {
              res1 = retryRes;
              res1Json = res1.data || {};
              res1Text = typeof res1.data === 'string' ? res1.data : JSON.stringify(res1.data || '');
            }
          }
        }

        if (res1.ok || res1.status === 200 || res1.status === 201) {
          step1Success = true;
          steps.push({
            step: 1,
            stepName: 'Create ChirpStack Device',
            endpoint,
            method: 'POST',
            status: 'SUCCESS',
            httpStatus: res1.status,
            message: `Device ${devEui} registered on ChirpStack`,
            payload: step1Payload,
            response: res1Json,
          });
        } else if (
          res1.status === 409 ||
          res1Text.includes('already exists') ||
          res1Text.includes('duplicate key') ||
          res1Text.includes('device_pkey') ||
          res1Text.includes('unique constraint') ||
          ((res1 as any)?.error && (
            (res1 as any).error.includes('already exists') ||
            (res1 as any).error.includes('duplicate key') ||
            (res1 as any).error.includes('device_pkey') ||
            (res1 as any).error.includes('unique constraint')
          ))
        ) {
          // If already exists on ChirpStack, update the device name and profile via PUT so the device has the correct name
          this.logger.log(`[ChirpStack] Device ${devEui} already exists on ChirpStack. Updating via PUT ${baseUrl}/api/devices/${devEui}...`);
          let putEndpoint = `${baseUrl}/api/devices/${devEui}`;
          let resPut = await this.resilienceService.safeFetch(putEndpoint, {
            method: 'PUT',
            headers,
            body: JSON.stringify(step1Payload),
          });
          if (resPut.status === 404) {
            const altPut = `${baseUrl}/api/v4/devices/${devEui}`;
            const altRes = await this.resilienceService.safeFetch(altPut, {
              method: 'PUT',
              headers,
              body: JSON.stringify(step1Payload),
            });
            if (altRes && altRes.status !== 404) {
              resPut = altRes;
              putEndpoint = altPut;
            }
          }

          if (resPut.ok || resPut.status === 200 || resPut.status === 204) {
            step1Success = true;
            steps.push({
              step: 1,
              stepName: 'Adopt Existing ChirpStack Device',
              endpoint: putEndpoint,
              method: 'PUT',
              status: 'SUCCESS',
              httpStatus: resPut.status,
              message: `Device ${devEui} already existed on ChirpStack; updated to '${dto.name.trim()}'`,
              payload: step1Payload,
              response: resPut.data || {},
            });
          } else {
            step1ErrorMessage = `ChirpStack: Device with DevEUI ${devEui} already exists on ChirpStack server.`;
          }
        } else if (res1.status === 404) {
          step1ErrorMessage = `ChirpStack: Endpoint ${endpoint} not found on server (HTTP 404).`;
        } else if (res1.status === 401 || res1.status === 403) {
          step1ErrorMessage = `ChirpStack: Invalid API Key or Unauthorized (HTTP ${res1.status}).`;
        } else if (res1.status === 500 && (res1Text.includes('Record not found') || res1Text.includes('record not found'))) {
          step1ErrorMessage = `ChirpStack: Application ID (${applicationId}) or Device Profile ID (${deviceProfileId}) does not exist on ChirpStack server.`;
        } else {
          step1ErrorMessage = `ChirpStack: Device creation error (HTTP ${res1.status}): ${(res1Json as any)?.message || res1Text || 'Request rejected'}`;
        }
      }
    } catch (err: any) {
      step1ErrorMessage = `ChirpStack: Cannot connect to server (${err.message}).`;
    }

    if (!step1Success) {
      return {
        success: false,
        serverType: NetworkServerType.CHIRPSTACK,
        serverName: server.name,
        totalSteps: 2,
        steps: [
          {
            step: 1,
            stepName: isEdit ? 'Update ChirpStack Device' : 'Create ChirpStack Device',
            endpoint: `${baseUrl}/api/devices${isEdit ? '/' + devEui : ''}`,
            method: isEdit ? 'PUT' : 'POST',
            status: 'FAILED',
            message: step1ErrorMessage,
            payload: step1Payload,
          },
        ],
        syncStatus: 'FAILED',
        summaryMessage: step1ErrorMessage,
        errorMessage: step1ErrorMessage,
      };
    }

    // Step 2: Set / Update AppKey / Device Keys
    const step2Payload = {
      deviceKeys: {
        devEui: devEui,
        nwkKey: appKey,
        appKey: appKey,
      },
    };

    let step2Success = false;
    let step2ErrorMessage = '';

    try {
      this.logger.log(`[ChirpStack] Configuring AppKey for device ${devEui}`);
      const method = isEdit ? 'PUT' : 'POST';
      let res2 = await this.resilienceService.safeFetch(`${baseUrl}/api/devices/${devEui}/keys`, {
        method,
        headers,
        body: JSON.stringify(step2Payload),
      });

      const res2Json = res2.data || {};
      const res2Text = typeof res2.data === 'string' ? res2.data : JSON.stringify(res2.data || '');

      if (res2.ok || res2.status === 200 || res2.status === 201 || res2.status === 204) {
        step2Success = true;
        steps.push({
          step: 2,
          stepName: isEdit ? 'Update ChirpStack Device AppKey' : 'Set ChirpStack Device AppKey',
          endpoint: `${baseUrl}/api/devices/${devEui}/keys`,
          method,
          status: 'SUCCESS',
          httpStatus: res2.status,
          message: `AppKey configured successfully`,
          payload: step2Payload,
          response: res2Json,
        });
      } else if (!isEdit && (res2.status === 409 || res2Text.includes('already exists') || res2Text.includes('duplicate key'))) {
        // If keys already exist on create, update via PUT
        const res2Put = await this.resilienceService.safeFetch(`${baseUrl}/api/devices/${devEui}/keys`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(step2Payload),
        });

        if (res2Put && (res2Put.ok || res2Put.status === 200 || res2Put.status === 204)) {
          step2Success = true;
          steps.push({
            step: 2,
            stepName: 'Update ChirpStack Device AppKey',
            endpoint: `${baseUrl}/api/devices/${devEui}/keys`,
            method: 'PUT',
            status: 'SUCCESS',
            httpStatus: res2Put.status,
            message: `AppKey updated successfully for device`,
            payload: step2Payload,
          });
        } else {
          step2ErrorMessage = `ChirpStack: Failed to update AppKey (${(res2Json as any)?.message || res2Text})`;
        }
      } else if (isEdit && res2.status === 404) {
        // If keys did not exist previously, create them via POST
        const res2Post = await this.resilienceService.safeFetch(`${baseUrl}/api/devices/${devEui}/keys`, {
          method: 'POST',
          headers,
          body: JSON.stringify(step2Payload),
        });

        if (res2Post && (res2Post.ok || res2Post.status === 200 || res2Post.status === 201)) {
          step2Success = true;
          steps.push({
            step: 2,
            stepName: 'Set ChirpStack Device AppKey',
            endpoint: `${baseUrl}/api/devices/${devEui}/keys`,
            method: 'POST',
            status: 'SUCCESS',
            httpStatus: res2Post.status,
            message: `AppKey created successfully`,
            payload: step2Payload,
          });
        } else {
          step2ErrorMessage = `ChirpStack: Failed to configure AppKey (${(res2Json as any)?.message || res2Text})`;
        }
      } else {
        step2ErrorMessage = `ChirpStack: Failed to configure AppKey (HTTP ${res2.status}): ${(res2Json as any)?.message || res2Text || 'Request rejected'}`;
      }
    } catch (err: any) {
      step2ErrorMessage = `ChirpStack: Connection error while configuring AppKey (${err.message}).`;
    }

    if (!step2Success) {
      return {
        success: false,
        serverType: NetworkServerType.CHIRPSTACK,
        serverName: server.name,
        totalSteps: 2,
        steps: [
          ...steps,
          {
            step: 2,
            stepName: 'Set ChirpStack Device AppKey',
            endpoint: `${baseUrl}/api/devices/${devEui}/keys`,
            method: isEdit ? 'PUT' : 'POST',
            status: 'FAILED',
            message: step2ErrorMessage,
            payload: step2Payload,
          },
        ],
        syncStatus: 'FAILED',
        summaryMessage: step2ErrorMessage,
        errorMessage: step2ErrorMessage,
      };
    }

    const summaryMessage = isEdit
      ? `Device ${dto.name} (${devEui}) updated and synchronized successfully on ChirpStack.`
      : `Device ${dto.name} (${devEui}) provisioned and synchronized successfully on ChirpStack.`;

    return {
      success: true,
      serverType: NetworkServerType.CHIRPSTACK,
      serverName: server.name,
      totalSteps: 2,
      steps,
      syncStatus: 'SYNCED',
      summaryMessage,
    };
  }

  /**
   * ThingPark Wireless DX API (1-Step Device Provisioning)
   * - When creating (isEdit = false): uses POST.
   * - When editing (isEdit = true): uses PUT.
   */
  private async provisionThingpark(
    server: NetworkServerEntity,
    regionProfile: RegionProfile | undefined,
    dto: RegisterDeviceDto,
    isEdit: boolean = false,
  ): Promise<ProvisioningResult> {
    const rawApiUrl = server.apiUrl?.trim() || 'https://community.thingpark.io/thingpark/wireless/rest/v1';
    const baseUrl = rawApiUrl.replace(/\/+$/, '');
    const apiKey = server.apiKey?.trim() || '';
    const devEui = dto.devEUI.trim().toUpperCase();
    const appEui = (dto.appEUI || '0102030405060708').trim().toUpperCase();
    const appKey = (dto.appKey || '0102030405060708090A0B0C0D0E0F10').trim().toUpperCase();
    const routeRef = regionProfile?.routeRef || server.routeRef || 'DAVITEQ_TP_DEFAULT_ROUTE';
    const deviceProfileId = regionProfile?.profileId || regionProfile?.id || 'tp-prof-vn920';

    const steps: ProvisioningStepResult[] = [];
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['X-API-KEY'] = apiKey;
    }

    const tpPayload = {
      EUI: devEui,
      name: dto.name.trim(),
      activation: 'OTAA',
      appEUI: appEui,
      appKey: appKey,
      routeRef: routeRef,
      deviceProfileId: deviceProfileId,
      administrativeData: {
        vendor: 'Daviteq',
        region: regionProfile?.region || 'AS923-1',
      },
    };

    let stepSuccess = false;
    let errorMessage = '';

    try {
      const targetEndpoint = isEdit
        ? `${baseUrl}/devices/${devEui}`
        : baseUrl.endsWith('/devices') ? baseUrl : `${baseUrl}/devices`;
      const method = isEdit ? 'PUT' : 'POST';

      this.logger.log(`[ThingPark] ${isEdit ? 'Updating' : 'Provisioning'} device ${devEui} to ${targetEndpoint}`);
      const res = await this.resilienceService.safeFetch(targetEndpoint, {
        method,
        headers,
        body: JSON.stringify(tpPayload),
      });

      const resJson = res.data || {};
      const resText = typeof res.data === 'string' ? res.data : JSON.stringify(res.data || '');

      if (res.ok || res.status === 200 || res.status === 201 || res.status === 204) {
        stepSuccess = true;
        steps.push({
          step: 1,
          stepName: isEdit ? 'Update ThingPark Device' : 'ThingPark Device Provisioning',
          endpoint: targetEndpoint,
          method,
          status: 'SUCCESS',
          httpStatus: res.status,
          message: `Device ${devEui} ${isEdit ? 'updated' : 'provisioned'} on ThingPark Wireless`,
          payload: tpPayload,
          response: resJson,
        });
      } else if (!isEdit && (res.status === 409 || resText.includes('already exists') || resText.includes('duplicate'))) {
        errorMessage = `ThingPark: Device with DevEUI ${devEui} already exists on ThingPark Wireless.`;
      } else {
        errorMessage = `ThingPark: Device ${isEdit ? 'update' : 'creation'} error (HTTP ${res.status}): ${(resJson as any)?.message || resText || 'Request rejected'}`;
      }
    } catch (err: any) {
      errorMessage = `ThingPark: Cannot connect to server (${err.message}).`;
    }

    if (!stepSuccess) {
      return {
        success: false,
        serverType: NetworkServerType.THINGPARK,
        serverName: server.name,
        totalSteps: 1,
        steps: [
          {
            step: 1,
            stepName: isEdit ? 'Update ThingPark Device' : 'ThingPark Device Provisioning',
            endpoint: `${baseUrl}/devices`,
            method: isEdit ? 'PUT' : 'POST',
            status: 'FAILED',
            message: errorMessage,
            payload: tpPayload,
          },
        ],
        syncStatus: 'FAILED',
        summaryMessage: errorMessage,
        errorMessage,
      };
    }

    const summaryMessage = `Device ${dto.name} (${devEui}) ${isEdit ? 'updated' : 'provisioned'} and synchronized successfully on ThingPark Wireless.`;
    return {
      success: true,
      serverType: NetworkServerType.THINGPARK,
      serverName: server.name,
      totalSteps: 1,
      steps,
      syncStatus: 'SYNCED',
      summaryMessage,
    };
  }

  /**
   * Check Device Health & Online Status directly from Network Server API
   */
  async checkDeviceHealth(
    server: NetworkServerEntity,
    devEui: string,
  ): Promise<{
    success: boolean;
    isOnline: boolean;
    lastSeenAt: string | null;
    deviceStatus?: any;
    message: string;
  }> {
    const rawApiUrl = server.apiUrl?.trim() || '';
    const baseUrl = rawApiUrl.replace(/\/+$/, '');
    const apiKey = server.apiKey?.trim() || '';
    const cleanDevEui = devEui.trim().toLowerCase();

    if (!baseUrl) {
      return {
        success: false,
        isOnline: false,
        lastSeenAt: null,
        message: 'No Network Server API URL configured.',
      };
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['X-API-KEY'] = apiKey;
    }

    try {
      if (server.type === NetworkServerType.CHIRPSTACK) {
        let endpoint = `${baseUrl}/api/devices/${cleanDevEui}`;
        let res = await this.resilienceService.safeFetch(endpoint, { headers });

        if (!res.ok && res.status === 404) {
          endpoint = `${baseUrl}/api/v4/devices/${cleanDevEui}`;
          res = await this.resilienceService.safeFetch(endpoint, { headers });
        }

        if (res.ok && res.data) {
          const data: any = res.data;
          const lastSeenAt = data.lastSeenAt || null;
          const deviceStatus = data.deviceStatus || null;
          const isDisabled = data.device?.isDisabled || false;

          let isOnline = false;
          if (lastSeenAt && !isDisabled) {
            const lastSeenTime = new Date(lastSeenAt).getTime();
            const now = Date.now();
            // Online if seen within last 24 hours
            isOnline = now - lastSeenTime < 24 * 60 * 60 * 1000;
          }

          return {
            success: true,
            isOnline,
            lastSeenAt,
            deviceStatus,
            message: lastSeenAt
              ? `Device last seen: ${new Date(lastSeenAt).toLocaleString()}`
              : 'Device has not transmitted any packets to ChirpStack yet.',
          };
        } else {
          return {
            success: false,
            isOnline: false,
            lastSeenAt: null,
            message: `ChirpStack query returned HTTP ${res.status || 'ERR'}`,
          };
        }
      } else {
        // ThingPark Wireless
        const endpoint = `${baseUrl}/devices/${cleanDevEui.toUpperCase()}`;
        const res = await this.resilienceService.safeFetch(endpoint, { headers });

        if (res.ok && res.data) {
          const data: any = res.data;
          const lastSeenAt = data.lastPacketTime || data.lastSeen || data.lastSeenAt || null;
          let isOnline = false;
          if (lastSeenAt) {
            const lastSeenTime = new Date(lastSeenAt).getTime();
            isOnline = !isNaN(lastSeenTime) && (Date.now() - lastSeenTime < 24 * 60 * 60 * 1000);
          }
          return {
            success: true,
            isOnline,
            lastSeenAt,
            message: lastSeenAt
              ? `Device last seen: ${new Date(lastSeenAt).toLocaleString()}`
              : 'Device has not transmitted any packets to ThingPark yet.',
          };
        } else {
          return {
            success: false,
            isOnline: false,
            lastSeenAt: null,
            message: `ThingPark query returned HTTP ${res.status || 'ERR'}`,
          };
        }
      }
    } catch (err: any) {
      return {
        success: false,
        isOnline: false,
        lastSeenAt: null,
        message: `Health check connection error: ${err.message}`,
      };
    }
  }

  /**
   * Deprovision/Delete device from upstream Network Server
   */
  async deprovisionDevice(server: NetworkServerEntity, devEui: string): Promise<any> {
    const baseUrl = (server.apiUrl || '').replace(/\/+$/, '');
    if (!baseUrl) return { success: true, message: 'No remote URL to delete' };

    const apiKey = server.apiKey?.trim() || '';
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['X-API-KEY'] = apiKey;
    }

    try {
      const targetUrl =
        server.type === NetworkServerType.CHIRPSTACK
          ? `${baseUrl}/api/devices/${devEui.toLowerCase()}`
          : `${baseUrl}/devices/${devEui.toUpperCase()}`;

      const res = await this.resilienceService.safeFetch(targetUrl, {
        method: 'DELETE',
        headers,
      });

      return { success: res.ok || res.status === 404 };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}
