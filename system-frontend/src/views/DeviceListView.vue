<template>
  <div class="device-list-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">Unified Device Management</h1>
        <p class="page-desc">Centralized registry for multi-protocol industrial devices and sensor nodes</p>
      </div>

      <div class="header-actions">
        <PermissionGuard permission="device:write">
          <el-button type="primary">
            <el-icon><Plus /></el-icon> Register New Device
          </el-button>
        </PermissionGuard>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-card">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="Search by device name, EUI, or Unit ID..."
            prefix-icon="Search"
            clearable
          />
        </el-col>
        <el-col :span="5">
          <el-select v-model="selectedProtocol" placeholder="All Protocols" clearable style="width: 100%">
            <el-option label="LoRaWAN (ChirpStack)" value="lorawan" />
            <el-option label="Modbus RTU" value="modbus-rtu" />
            <el-option label="Modbus TCP" value="modbus-tcp" />
            <el-option label="MQTT / Edge" value="mqtt" />
          </el-select>
        </el-col>
        <el-col :span="5">
          <el-select v-model="selectedStatus" placeholder="All Statuses" clearable style="width: 100%">
            <el-option label="Online" value="online" />
            <el-option label="Offline" value="offline" />
            <el-option label="Degraded" value="warning" />
          </el-select>
        </el-col>
      </el-row>
    </div>

    <!-- Device Table -->
    <el-card class="table-card" body-style="padding: 0;">
      <el-table :data="filteredDevices" style="width: 100%" stripe>
        <el-table-column prop="name" label="Device Name" min-width="180">
          <template #default="{ row }">
            <div class="device-cell">
              <span class="device-name">{{ row.name }}</span>
              <span class="device-identifier">{{ row.identifier }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="protocol" label="Protocol" width="160">
          <template #default="{ row }">
            <el-tag :type="getProtocolTagType(row.protocol)" size="small">
              {{ row.protocol.toUpperCase() }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="Status" width="130">
          <template #default="{ row }">
            <StatusBadge :status="row.status" />
          </template>
        </el-table-column>

        <el-table-column prop="lastSeen" label="Last Seen" width="160">
          <template #default="{ row }">
            <span class="time-text">{{ row.lastSeen }}</span>
          </template>
        </el-table-column>

        <el-table-column label="Latest Telemetry" min-width="200">
          <template #default="{ row }">
            <div class="telemetry-chip-group">
              <span v-for="(v, k) in row.telemetry" :key="k" class="telemetry-chip">
                {{ k }}: <strong>{{ v }}</strong>
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Actions" width="180" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button link type="primary" size="small" @click="inspectDevice(row)">
                Inspect
              </el-button>
              <PermissionGuard permission="device:write">
                <el-button link type="warning" size="small">
                  Configure
                </el-button>
              </PermissionGuard>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Inspection Dialog with Extension Slot -->
    <el-dialog v-model="inspectDialogVisible" :title="`Device: ${activeDevice?.name}`" width="650px">
      <div v-if="activeDevice" class="device-detail-modal">
        <el-descriptions border :column="2">
          <el-descriptions-item label="Device Identifier">{{ activeDevice.identifier }}</el-descriptions-item>
          <el-descriptions-item label="Protocol">{{ activeDevice.protocol }}</el-descriptions-item>
          <el-descriptions-item label="Status">
            <StatusBadge :status="activeDevice.status" />
          </el-descriptions-item>
          <el-descriptions-item label="Last Contact">{{ activeDevice.lastSeen }}</el-descriptions-item>
        </el-descriptions>

        <!-- Dynamic Extension Slot for Protocol Plugins -->
        <div class="modal-extension-zone">
          <h4>Protocol Specific Extensions</h4>
          <ExtensionSlot name="device-detail-panel" :context="{ device: activeDevice }" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import StatusBadge from '../components/shared/StatusBadge.vue';
import PermissionGuard from '../components/shared/PermissionGuard.vue';
import ExtensionSlot from '../components/shared/ExtensionSlot.vue';

interface DeviceItem {
  id: string;
  name: string;
  identifier: string;
  protocol: 'lorawan' | 'modbus-rtu' | 'modbus-tcp' | 'mqtt';
  status: 'online' | 'offline' | 'warning';
  lastSeen: string;
  telemetry: Record<string, string | number>;
}

const searchQuery = ref('');
const selectedProtocol = ref('');
const selectedStatus = ref('');
const inspectDialogVisible = ref(false);
const activeDevice = ref<DeviceItem | null>(null);

const devices = ref<DeviceItem[]>([
  {
    id: 'dev-001',
    name: 'Boiler Pressure Monitor 01',
    identifier: 'MODBUS-TCP #192.168.1.105:502 [ID:1]',
    protocol: 'modbus-tcp',
    status: 'online',
    lastSeen: '10s ago',
    telemetry: { pressure: '4.8 bar', temp: '82.4 °C' },
  },
  {
    id: 'dev-002',
    name: 'HVAC Airflow Transmitter',
    identifier: 'MODBUS-RTU [COM3 9600-8-N-1 ID:2]',
    protocol: 'modbus-rtu',
    status: 'online',
    lastSeen: '25s ago',
    telemetry: { flow: '320 m3/h', humidity: '48%' },
  },
  {
    id: 'dev-003',
    name: 'Environmental Node EUI-A84041',
    identifier: 'DevEUI: a840410000000001',
    protocol: 'lorawan',
    status: 'online',
    lastSeen: '2m ago',
    telemetry: { co2: '415 ppm', battery: '94%' },
  },
  {
    id: 'dev-004',
    name: 'Edge MQTT Gateway Telemetry',
    identifier: 'mqtt://edge-hub/factory/line1/status',
    protocol: 'mqtt',
    status: 'warning',
    lastSeen: '5m ago',
    telemetry: { vibration: '3.2 mm/s', load: '85%' },
  },
]);

const filteredDevices = computed(() => {
  return devices.value.filter((d) => {
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const matchName = d.name.toLowerCase().includes(q);
      const matchId = d.identifier.toLowerCase().includes(q);
      if (!matchName && !matchId) return false;
    }
    if (selectedProtocol.value && d.protocol !== selectedProtocol.value) {
      return false;
    }
    if (selectedStatus.value && d.status !== selectedStatus.value) {
      return false;
    }
    return true;
  });
});

function getProtocolTagType(proto: string) {
  switch (proto) {
    case 'lorawan':
      return 'success';
    case 'modbus-tcp':
      return 'primary';
    case 'modbus-rtu':
      return 'warning';
    case 'mqtt':
      return 'info';
    default:
      return 'info';
  }
}

function inspectDevice(device: DeviceItem) {
  activeDevice.value = device;
  inspectDialogVisible.value = true;
}
</script>

<style scoped>
.device-list-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.page-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.filter-card {
  background: #ffffff;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.table-card {
  border-radius: 8px;
  overflow: hidden;
}

.device-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.device-name {
  font-weight: 600;
  color: #1e293b;
}

.device-identifier {
  font-size: 11px;
  color: #64748b;
  font-family: monospace;
}

.telemetry-chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.telemetry-chip {
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #334155;
}

.time-text {
  font-size: 12px;
  color: #64748b;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.modal-extension-zone {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed #e2e8f0;
}

.modal-extension-zone h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #334155;
}
</style>
