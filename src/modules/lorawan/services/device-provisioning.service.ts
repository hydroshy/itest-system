import { Injectable, Logger } from '@nestjs/common';
import { NetworkServerEntity, NetworkServerType, RegionProfile } from '../../network-servers/entities/network-server.entity';
import { RegisterDeviceDto } from '../dto/lorawan.dto';

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

  /**
   * Provision device according to network server type:
   * - THINGPARK: 1-step provisioning (Device + AppEUI + AppKey in single payload)
   * - CHIRPSTACK: 2-step provisioning (Step 1: Create device with AppEUI/JoinEUI -> Step 2: Set AppKey)
   */
  async provisionDevice(
    server: NetworkServerEntity,
    regionProfile: RegionProfile | undefined,
    dto: RegisterDeviceDto,
  ): Promise<ProvisioningResult> {
    if (server.type === NetworkServerType.CHIRPSTACK) {
      return await this.provisionChirpstack(server, regionProfile, dto);
    } else {
      return await this.provisionThingpark(server, regionProfile, dto);
    }
  }

  /**
   * ChirpStack v4 API (2-Step Device Provisioning)
   * Step 1: POST /api/devices (Creates device with DevEUI, Name, DeviceProfileId, JoinEUI/AppEUI)
   * Step 2: POST /api/devices/{devEui}/keys (Sets AppKey / NwkKey)
   */
  /**
   * Helper to auto-discover Application ID from ChirpStack
   */
  private async discoverChirpstackApplicationId(baseUrl: string, headers: Record<string, string>): Promise<string | null> {
    try {
      const endpoints = [`${baseUrl}/api/applications?limit=50`, `${baseUrl}/api/v4/applications?limit=50`];
      for (const ep of endpoints) {
        const res = await fetch(ep, { headers }).catch(() => null);
        if (res && (res.ok || res.status === 200)) {
          const data: any = await res.json().catch(() => ({}));
          const list = data.result || data.applications || [];
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
        const res = await fetch(ep, { headers }).catch(() => null);
        if (res && (res.ok || res.status === 200)) {
          const data: any = await res.json().catch(() => ({}));
          const list = data.result || data.deviceProfiles || [];
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
   * Step 1: POST /api/devices (Creates device with DevEUI, Name, DeviceProfileId, JoinEUI/AppEUI)
   * Step 2: POST /api/devices/{devEui}/keys (Sets AppKey / NwkKey)
   */
  private async provisionChirpstack(
    server: NetworkServerEntity,
    regionProfile: RegionProfile | undefined,
    dto: RegisterDeviceDto,
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
      this.logger.log(`[ChirpStack] Registering device ${devEui} to ${baseUrl}/api/devices`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Attempt primary endpoint
      let endpoint = `${baseUrl}/api/devices`;
      let res1 = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(step1Payload),
        signal: controller.signal,
      }).catch((err) => {
        throw err;
      });
      clearTimeout(timeoutId);

      // Fallback endpoint test if primary is 404
      if (res1.status === 404) {
        const altEndpoint = `${baseUrl}/api/v4/devices`;
        const altRes = await fetch(altEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(step1Payload),
        }).catch(() => null);
        if (altRes && altRes.status !== 404) {
          res1 = altRes;
          endpoint = altEndpoint;
        }
      }

      let res1Text = await res1.text().catch(() => '');
      let res1Json: any = {};
      try {
        res1Json = JSON.parse(res1Text);
      } catch (e) {
        res1Json = { raw: res1Text };
      }

      // If "Record not found" / HTTP 500, attempt one auto-discovery retry
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

          const retryRes = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(step1Payload),
          }).catch(() => null);

          if (retryRes) {
            res1 = retryRes;
            res1Text = await res1.text().catch(() => '');
            try {
              res1Json = JSON.parse(res1Text);
            } catch (e) {
              res1Json = { raw: res1Text };
            }
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
        res1Text.includes('unique constraint')
      ) {
        // Device already exists on ChirpStack -> Update it via PUT /api/devices/{devEui}
        const putEndpoints = [
          `${baseUrl}/api/devices/${devEui}`,
          `${baseUrl}/api/v4/devices/${devEui}`,
        ];
        let putSuccess = false;
        let putResJson: any = {};
        let lastPutStatus = 0;

        for (const putEp of putEndpoints) {
          const putRes = await fetch(putEp, {
            method: 'PUT',
            headers,
            body: JSON.stringify(step1Payload),
          }).catch(() => null);

          if (putRes && (putRes.ok || putRes.status === 200 || putRes.status === 204)) {
            putSuccess = true;
            lastPutStatus = putRes.status;
            step1Success = true;
            steps.push({
              step: 1,
              stepName: 'Update ChirpStack Device',
              endpoint: putEp,
              method: 'PUT',
              status: 'SUCCESS',
              httpStatus: putRes.status,
              message: `Device ${devEui} configuration updated on ChirpStack`,
              payload: step1Payload,
            });
            break;
          } else if (putRes && putRes.status !== 404) {
            lastPutStatus = putRes.status;
            const putText = await putRes.text().catch(() => '');
            try {
              putResJson = JSON.parse(putText);
            } catch (e) {
              putResJson = { raw: putText };
            }
          }
        }

        if (!putSuccess) {
          step1ErrorMessage = `ChirpStack: Device already exists but update failed (HTTP ${lastPutStatus}): ${putResJson.message || 'Update rejected'}`;
        }
      } else if (res1.status === 404) {
        step1ErrorMessage = `ChirpStack: Endpoint ${endpoint} not found on server (HTTP 404).`;
      } else if (res1.status === 401 || res1.status === 403) {
        step1ErrorMessage = `ChirpStack: Invalid API Key or Unauthorized (HTTP ${res1.status}).`;
      } else if (res1.status === 500 && (res1Text.includes('Record not found') || res1Text.includes('record not found'))) {
        step1ErrorMessage = `ChirpStack: Application ID (${applicationId}) or Device Profile ID (${deviceProfileId}) does not exist on ChirpStack server.`;
      } else {
        step1ErrorMessage = `ChirpStack: Device provisioning error (HTTP ${res1.status}): ${res1Json.message || res1Text || 'Request rejected'}`;
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
            stepName: 'Create/Update ChirpStack Device',
            endpoint: `${baseUrl}/api/devices`,
            method: 'POST/PUT',
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

    // Step 2: Set AppKey / Device Keys (POST /api/devices/{devEui}/keys)
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
      this.logger.log(`[ChirpStack] Setting AppKey for device ${devEui}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      let res2 = await fetch(`${baseUrl}/api/devices/${devEui}/keys`, {
        method: 'POST',
        headers,
        body: JSON.stringify(step2Payload),
        signal: controller.signal,
      }).catch((err) => {
        throw err;
      });
      clearTimeout(timeoutId);

      const res2Text = await res2.text().catch(() => '');
      let res2Json: any = {};
      try {
        res2Json = JSON.parse(res2Text);
      } catch (e) {
        res2Json = { raw: res2Text };
      }

      if (res2.ok || res2.status === 200 || res2.status === 201) {
        step2Success = true;
        steps.push({
          step: 2,
          stepName: 'Set ChirpStack Device AppKey',
          endpoint: `${baseUrl}/api/devices/${devEui}/keys`,
          method: 'POST',
          status: 'SUCCESS',
          httpStatus: res2.status,
          message: `AppKey configured successfully`,
          payload: step2Payload,
          response: res2Json,
        });
      } else if (
        res2.status === 409 ||
        res2Text.includes('already exists') ||
        res2Text.includes('duplicate key') ||
        res2Text.includes('unique constraint') ||
        res2Text.includes('device_keys_pkey')
      ) {
        // If keys already exist, update them via PUT
        const res2Put = await fetch(`${baseUrl}/api/devices/${devEui}/keys`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(step2Payload),
        }).catch(() => null);

        if (res2Put && (res2Put.ok || res2Put.status === 200 || res2Put.status === 204)) {
          step2Success = true;
          steps.push({
            step: 2,
            stepName: 'Update ChirpStack Device AppKey',
            endpoint: `${baseUrl}/api/devices/${devEui}/keys`,
            method: 'PUT',
            status: 'SUCCESS',
            httpStatus: res2Put.status,
            message: `AppKey updated successfully for existing device`,
            payload: step2Payload,
          });
        } else {
          step2ErrorMessage = `ChirpStack: Failed to update AppKey (${res2Json.message || res2Text})`;
        }
      } else {
        step2ErrorMessage = `ChirpStack: Failed to set AppKey (HTTP ${res2.status}): ${res2Json.message || res2Text || 'Request rejected'}`;
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
            method: 'POST/PUT',
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

    const summaryMessage = `Device ${dto.name} (${devEui}) provisioned and synchronized successfully on ChirpStack.`;
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
   * Step 1: POST /devices or /rest/devices (Single request containing EUI, Name, AppEUI, AppKey, RouteRef)
   */
  private async provisionThingpark(
    server: NetworkServerEntity,
    regionProfile: RegionProfile | undefined,
    dto: RegisterDeviceDto,
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

    // 1-Step ThingPark Payload
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
      this.logger.log(`[ThingPark] Provisioning device ${devEui} to ${baseUrl}/devices`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const targetEndpoint = baseUrl.endsWith('/devices') ? baseUrl : `${baseUrl}/devices`;
      const res = await fetch(targetEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(tpPayload),
        signal: controller.signal,
      }).catch((err) => {
        throw err;
      });
      clearTimeout(timeoutId);

      const resText = await res.text().catch(() => '');
      let resJson: any = {};
      try {
        resJson = JSON.parse(resText);
      } catch (e) {
        resJson = { raw: resText };
      }

      if (res.ok || res.status === 200 || res.status === 201) {
        stepSuccess = true;
        steps.push({
          step: 1,
          stepName: 'ThingPark Device Provisioning',
          endpoint: targetEndpoint,
          method: 'POST',
          status: 'SUCCESS',
          httpStatus: res.status,
          message: `Device ${devEui} provisioned on ThingPark Wireless`,
          payload: tpPayload,
          response: resJson,
        });
      } else if (res.status === 409 || resText.includes('already exists') || resText.includes('duplicate')) {
        // Attempt update via PUT
        const putEp = `${targetEndpoint}/${devEui}`;
        const putRes = await fetch(putEp, {
          method: 'PUT',
          headers,
          body: JSON.stringify(tpPayload),
        }).catch(() => null);

        if (putRes && (putRes.ok || putRes.status === 200 || putRes.status === 204)) {
          stepSuccess = true;
          steps.push({
            step: 1,
            stepName: 'Update ThingPark Device',
            endpoint: putEp,
            method: 'PUT',
            status: 'SUCCESS',
            httpStatus: putRes.status,
            message: `Device ${devEui} updated on ThingPark Wireless`,
            payload: tpPayload,
          });
        } else {
          stepSuccess = true;
          steps.push({
            step: 1,
            stepName: 'ThingPark Device Provisioning',
            endpoint: targetEndpoint,
            method: 'POST',
            status: 'SUCCESS',
            httpStatus: res.status,
            message: `Device ${devEui} already exists in ThingPark network`,
            payload: tpPayload,
            response: resJson,
          });
        }
      } else {
        errorMessage = `ThingPark: Device creation error (HTTP ${res.status}): ${resJson.message || resText || 'Request rejected'}`;
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
            stepName: 'ThingPark Device Provisioning',
            endpoint: `${baseUrl}/devices`,
            method: 'POST',
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

    const summaryMessage = `Device ${dto.name} (${devEui}) provisioned and synchronized successfully on ThingPark Wireless.`;
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const targetUrl =
        server.type === NetworkServerType.CHIRPSTACK
          ? `${baseUrl}/api/devices/${devEui.toLowerCase()}`
          : `${baseUrl}/devices/${devEui.toUpperCase()}`;

      const res = await fetch(targetUrl, {
        method: 'DELETE',
        headers,
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeoutId);

      return { success: !!(res && (res.ok || res.status === 404)) };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
}
