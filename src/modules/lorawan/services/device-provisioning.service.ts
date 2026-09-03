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
  syncStatus: 'SYNCED' | 'LOCAL_SAVED' | 'SYNC_FAILED';
  summaryMessage: string;
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

    // In ChirpStack v4, applicationId and deviceProfileId must be valid UUIDs
    const isUUID = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    const applicationId = server.metadata?.applicationId && isUUID(server.metadata.applicationId)
      ? server.metadata.applicationId
      : '00000000-0000-0000-0000-000000000001';

    const deviceProfileId = regionProfile?.profileId && isUUID(regionProfile.profileId)
      ? regionProfile.profileId
      : (regionProfile?.id && isUUID(regionProfile.id) ? regionProfile.id : '00000000-0000-0000-0000-000000000001');

    const steps: ProvisioningStepResult[] = [];
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // Step 1: Create Device (POST /api/devices)
    const step1Payload = {
      device: {
        devEui: devEui,
        name: dto.name.trim(),
        description: `Daviteq IoT Sensor - ${dto.name.trim()}`,
        applicationId: applicationId,
        deviceProfileId: deviceProfileId,
        isDisabled: false,
        skipFcntCheck: false,
        joinEui: appEui,
        tags: {
          managedBy: 'DaviteqPlatform',
          region: regionProfile?.region || 'AS923-1',
        },
      },
    };

    let step1Success = false;
    let step1Message = '';

    try {
      this.logger.log(`[ChirpStack 2-Step] Step 1/2: Registering device ${devEui} to ${baseUrl}/api/devices`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

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

      const res1Text = await res1.text().catch(() => '');
      let res1Json: any = {};
      try {
        res1Json = JSON.parse(res1Text);
      } catch (e) {
        res1Json = { raw: res1Text };
      }

      if (res1.ok || res1.status === 200 || res1.status === 201) {
        step1Success = true;
        step1Message = `Step 1 OK: Device ${devEui} registered on ChirpStack with AppEUI (JoinEUI) ${appEui}`;
        steps.push({
          step: 1,
          stepName: 'Create ChirpStack Device',
          endpoint,
          method: 'POST',
          status: 'SUCCESS',
          httpStatus: res1.status,
          message: step1Message,
          payload: step1Payload,
          response: res1Json,
        });
      } else if (res1.status === 409 || res1Text.includes('already exists')) {
        step1Success = true;
        step1Message = `Step 1 Notice: Device ${devEui} already exists in ChirpStack. Proceeding to update keys.`;
        steps.push({
          step: 1,
          stepName: 'Create ChirpStack Device',
          endpoint,
          method: 'POST',
          status: 'SUCCESS',
          httpStatus: res1.status,
          message: step1Message,
          payload: step1Payload,
          response: res1Json,
        });
      } else if (res1.status === 404) {
        step1Message = `ChirpStack REST endpoint (${endpoint}) returned HTTP 404. Ensure REST API is enabled on ChirpStack server.`;
        steps.push({
          step: 1,
          stepName: 'Create ChirpStack Device',
          endpoint,
          method: 'POST',
          status: 'WARNING',
          httpStatus: res1.status,
          message: step1Message,
          payload: step1Payload,
          response: res1Json,
        });
      } else if (res1.status === 401 || res1.status === 403) {
        step1Message = `ChirpStack authentication rejected (HTTP ${res1.status}). Please check API Key in Network Server settings.`;
        steps.push({
          step: 1,
          stepName: 'Create ChirpStack Device',
          endpoint,
          method: 'POST',
          status: 'WARNING',
          httpStatus: res1.status,
          message: step1Message,
          payload: step1Payload,
          response: res1Json,
        });
      } else {
        step1Message = `ChirpStack response (HTTP ${res1.status}): ${res1Json.message || res1Text || 'Device creation rejected'}`;
        steps.push({
          step: 1,
          stepName: 'Create ChirpStack Device',
          endpoint,
          method: 'POST',
          status: 'WARNING',
          httpStatus: res1.status,
          message: step1Message,
          payload: step1Payload,
          response: res1Json,
        });
      }
    } catch (err: any) {
      step1Message = `ChirpStack remote host notice: ${err.message || 'Offline/Simulated mode'}. Device saved locally.`;
      steps.push({
        step: 1,
        stepName: 'Create ChirpStack Device',
        endpoint: `${baseUrl}/api/devices`,
        method: 'POST',
        status: 'WARNING',
        message: step1Message,
        payload: step1Payload,
      });
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
    let step2Message = '';

    if (step1Success) {
      try {
        this.logger.log(`[ChirpStack 2-Step] Step 2/2: Setting AppKey for device ${devEui} to ${baseUrl}/api/devices/${devEui}/keys`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

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
          step2Message = `Step 2 OK: AppKey successfully configured for OTAA authentication`;
          steps.push({
            step: 2,
            stepName: 'Set ChirpStack Device AppKey',
            endpoint: `${baseUrl}/api/devices/${devEui}/keys`,
            method: 'POST',
            status: 'SUCCESS',
            httpStatus: res2.status,
            message: step2Message,
            payload: step2Payload,
            response: res2Json,
          });
        } else if (res2.status === 409 || res2Text.includes('already exists')) {
          // If keys already exist, update them via PUT
          const res2Put = await fetch(`${baseUrl}/api/devices/${devEui}/keys`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(step2Payload),
          }).catch(() => null);

          if (res2Put && (res2Put.ok || res2Put.status === 200)) {
            step2Success = true;
            step2Message = `Step 2 OK: AppKey updated via PUT for existing device`;
            steps.push({
              step: 2,
              stepName: 'Update ChirpStack Device AppKey',
              endpoint: `${baseUrl}/api/devices/${devEui}/keys`,
              method: 'PUT',
              status: 'SUCCESS',
              httpStatus: res2Put.status,
              message: step2Message,
              payload: step2Payload,
            });
          } else {
            step2Message = `Step 2 Notice: AppKey exists or update notice (${res2Json.message || res2Text})`;
            steps.push({
              step: 2,
              stepName: 'Set ChirpStack Device AppKey',
              endpoint: `${baseUrl}/api/devices/${devEui}/keys`,
              method: 'POST',
              status: 'WARNING',
              httpStatus: res2.status,
              message: step2Message,
              payload: step2Payload,
            });
          }
        } else {
          step2Message = `Step 2 Notice (HTTP ${res2.status}): ${res2Json.message || res2Text || 'Keys configuration response'}`;
          steps.push({
            step: 2,
            stepName: 'Set ChirpStack Device AppKey',
            endpoint: `${baseUrl}/api/devices/${devEui}/keys`,
            method: 'POST',
            status: 'WARNING',
            httpStatus: res2.status,
            message: step2Message,
            payload: step2Payload,
            response: res2Json,
          });
        }
      } catch (err: any) {
        step2Message = `Step 2 Notice: AppKey registered in local database. Remote sync notice: ${err.message || 'Offline/Simulated mode'}`;
        steps.push({
          step: 2,
          stepName: 'Set ChirpStack Device AppKey',
          endpoint: `${baseUrl}/api/devices/${devEui}/keys`,
          method: 'POST',
          status: 'WARNING',
          message: step2Message,
          payload: step2Payload,
        });
      }
    } else {
      // Step 1 was not confirmed on remote host -> Skip step 2 gracefully
      step2Message = `Step 2 Skipped: Remote device creation was not confirmed on ChirpStack server (${baseUrl}). AppKey saved locally.`;
      steps.push({
        step: 2,
        stepName: 'Set ChirpStack Device AppKey',
        endpoint: `${baseUrl}/api/devices/${devEui}/keys`,
        method: 'POST',
        status: 'SKIPPED',
        message: step2Message,
        payload: step2Payload,
      });
    }

    const fullySynced = step1Success && step2Success;
    let summaryMessage = '';
    if (fullySynced) {
      summaryMessage = `ChirpStack 2-Step Provisioning Succeeded (Step 1: Device Created + Step 2: AppKey Configured)`;
    } else if (step1Success) {
      summaryMessage = `Device registered on ChirpStack. Step 2 (AppKey): ${step2Message}`;
    } else {
      summaryMessage = `Device saved in local fleet. Remote ChirpStack notice: ${step1Message}`;
    }

    return {
      success: true,
      serverType: NetworkServerType.CHIRPSTACK,
      serverName: server.name,
      totalSteps: 2,
      steps,
      syncStatus: fullySynced ? 'SYNCED' : 'LOCAL_SAVED',
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
    try {
      this.logger.log(`[ThingPark 1-Step] Provisioning device ${devEui} to ${baseUrl}/devices`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

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
          stepName: '1-Step ThingPark Device Provisioning',
          endpoint: targetEndpoint,
          method: 'POST',
          status: 'SUCCESS',
          httpStatus: res.status,
          message: `1-Step OK: Device ${devEui}, AppEUI ${appEui} and AppKey successfully provisioned on ThingPark Wireless`,
          payload: tpPayload,
          response: resJson,
        });
      } else if (res.status === 409 || resText.includes('already exists')) {
        stepSuccess = true;
        steps.push({
          step: 1,
          stepName: '1-Step ThingPark Device Provisioning',
          endpoint: targetEndpoint,
          method: 'POST',
          status: 'WARNING',
          httpStatus: res.status,
          message: `ThingPark Notice: Device ${devEui} already exists in ThingPark network. Record updated locally.`,
          payload: tpPayload,
          response: resJson,
        });
      } else {
        steps.push({
          step: 1,
          stepName: '1-Step ThingPark Device Provisioning',
          endpoint: targetEndpoint,
          method: 'POST',
          status: 'WARNING',
          httpStatus: res.status,
          message: `ThingPark Notice (HTTP ${res.status}): ${resJson.message || resText || 'Saved locally with webhook routing'}`,
          payload: tpPayload,
          response: resJson,
        });
      }
    } catch (err: any) {
      steps.push({
        step: 1,
        stepName: '1-Step ThingPark Device Provisioning',
        endpoint: `${baseUrl}/devices`,
        method: 'POST',
        status: 'WARNING',
        message: `ThingPark Notice: Device registered in local fleet with webhook ingestion. Remote notice: ${err.message || 'Offline/Simulated mode'}`,
        payload: tpPayload,
      });
    }

    return {
      success: true,
      serverType: NetworkServerType.THINGPARK,
      serverName: server.name,
      totalSteps: 1,
      steps,
      syncStatus: stepSuccess ? 'SYNCED' : 'LOCAL_SAVED',
      summaryMessage: stepSuccess
        ? `ThingPark 1-Step Provisioning Succeeded (Device, AppEUI & AppKey registered in 1 step)`
        : `Device saved in local fleet. ThingPark 1-Step pipeline processed (${steps[0]?.status || 'PROCESSED'})`,
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
