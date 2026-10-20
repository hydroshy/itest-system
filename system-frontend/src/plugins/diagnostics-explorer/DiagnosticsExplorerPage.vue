<template>
  <div class="diagnostics-container">
    <div class="page-header">
      <div class="header-titles">
        <h2 class="title">Protocol Diagnostics & Register Explorer</h2>
        <p class="subtitle">Real-time troubleshooting tools for industrial Modbus and MQTT protocol communications</p>
      </div>
      <div class="header-actions">
        <el-tag type="success" effect="dark" round>Diagnostic Hub Active</el-tag>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="diagnostics-tabs" type="border-card">
      <!-- Tab 1: Modbus Register Explorer -->
      <el-tab-pane label="Modbus Register Explorer" name="modbus">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="never" class="config-card">
              <template #header>
                <div class="card-header">
                  <span class="font-bold">Modbus Request Parameters</span>
                </div>
              </template>

              <el-form label-position="top" size="default">
                <el-form-item label="Transport Mode">
                  <el-radio-group v-model="modbusForm.mode">
                    <el-radio-button label="tcp">Modbus TCP</el-radio-button>
                    <el-radio-button label="rtu">Modbus RTU</el-radio-button>
                  </el-radio-group>
                </el-form-item>

                <el-form-item v-if="modbusForm.mode === 'tcp'" label="Target Host & Port">
                  <el-input v-model="modbusForm.host" placeholder="192.168.1.100:502" />
                </el-form-item>

                <el-form-item v-else label="Serial Port / Device Node">
                  <el-input v-model="modbusForm.port" placeholder="/dev/ttyUSB0 or COM3" />
                </el-form-item>

                <el-row :gutter="10">
                  <el-col :span="12">
                    <el-form-item label="Slave Unit ID">
                      <el-input-number v-model="modbusForm.slaveId" :min="1" :max="247" class="w-full" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="Function Code">
                      <el-select v-model="modbusForm.functionCode" class="w-full">
                        <el-option label="FC01: Read Coils" value="FC01" />
                        <el-option label="FC02: Read Discrete Inputs" value="FC02" />
                        <el-option label="FC03: Read Holding Registers" value="FC03" />
                        <el-option label="FC04: Read Input Registers" value="FC04" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="10">
                  <el-col :span="12">
                    <el-form-item label="Start Address">
                      <el-input-number v-model="modbusForm.address" :min="0" :max="65535" class="w-full" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="Quantity (Count)">
                      <el-input-number v-model="modbusForm.count" :min="1" :max="125" class="w-full" />
                    </el-form-item>
                  </el-col>
                </el-row>

                <div class="form-actions mt-4">
                  <el-button type="primary" :loading="modbusLoading" @click="readModbusRegisters">
                    Query Registers
                  </el-button>
                  <el-button @click="resetModbusRegisters">Clear</el-button>
                </div>
              </el-form>
            </el-card>
          </el-col>

          <el-col :span="16">
            <el-card shadow="never" class="results-card">
              <template #header>
                <div class="card-header flex justify-between items-center">
                  <span class="font-bold">Register Table & Values</span>
                  <span class="text-xs text-gray-500">Last scanned: {{ lastScanTime || 'Never' }}</span>
                </div>
              </template>

              <el-table :data="registerRows" stripe border size="small" style="width: 100%" height="450">
                <el-table-column prop="address" label="Register" width="110" />
                <el-table-column prop="hex" label="HEX (16-bit)" width="130">
                  <template #default="{ row }">
                    <el-tag size="small" type="info">{{ row.hex }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="dec" label="Decimal (Unsigned)" width="150" />
                <el-table-column prop="binary" label="Binary" width="160">
                  <template #default="{ row }">
                    <span class="font-mono text-xs">{{ row.binary }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="desc" label="Interpretation" min-width="160" />
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- Tab 2: MQTT Topic Explorer -->
      <el-tab-pane label="MQTT Topic Explorer" name="mqtt">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="never" class="config-card">
              <template #header>
                <span class="font-bold">Topic Subscription & Filter</span>
              </template>

              <el-form label-position="top">
                <el-form-item label="Active Topic Filter">
                  <el-input v-model="mqttTopicInput" placeholder="itest/telemetry/#">
                    <template #append>
                      <el-button @click="subscribeTopic">Subscribe</el-button>
                    </template>
                  </el-input>
                </el-form-item>

                <div class="subscribed-topics mb-4">
                  <p class="text-xs text-gray-500 mb-2">Subscribed Topics:</p>
                  <div class="flex flex-wrap gap-2">
                    <el-tag
                      v-for="sub in activeSubscriptions"
                      :key="sub"
                      closable
                      size="small"
                      @close="removeSubscription(sub)"
                    >
                      {{ sub }}
                    </el-tag>
                  </div>
                </div>

                <el-divider />

                <div class="publish-section">
                  <p class="font-bold text-sm mb-2">Test Publish</p>
                  <el-form-item label="Publish Topic">
                    <el-input v-model="publishTopic" placeholder="itest/commands/test-01" />
                  </el-form-item>
                  <el-form-item label="Payload (JSON or String)">
                    <el-input v-model="publishPayload" type="textarea" :rows="3" />
                  </el-form-item>
                  <el-button type="success" size="small" @click="publishMqtt">Publish Message</el-button>
                </div>
              </el-form>
            </el-card>
          </el-col>

          <el-col :span="16">
            <el-card shadow="never" class="results-card">
              <template #header>
                <div class="card-header flex justify-between items-center">
                  <span class="font-bold">Live MQTT Messages Stream ({{ mqttMessages.length }})</span>
                  <el-button size="small" text type="danger" @click="mqttMessages = []">Clear Log</el-button>
                </div>
              </template>

              <div class="mqtt-message-stream">
                <div v-if="mqttMessages.length === 0" class="empty-state">
                  Waiting for incoming messages on subscribed topics...
                </div>
                <div
                  v-for="(msg, idx) in mqttMessages"
                  :key="idx"
                  class="mqtt-msg-card"
                >
                  <div class="msg-meta">
                    <span class="msg-topic font-mono font-bold">{{ msg.topic }}</span>
                    <el-tag size="small" type="info">QoS {{ msg.qos }}</el-tag>
                    <span class="msg-time">{{ msg.timestamp }}</span>
                  </div>
                  <pre class="msg-payload font-mono">{{ msg.payload }}</pre>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';

const activeTab = ref('modbus');

// Modbus State
const modbusLoading = ref(false);
const lastScanTime = ref('');
const modbusForm = reactive({
  mode: 'tcp',
  host: '192.168.1.100:502',
  port: '/dev/ttyUSB0',
  slaveId: 1,
  functionCode: 'FC03',
  address: 40001,
  count: 8,
});

interface RegisterRow {
  address: number;
  hex: string;
  dec: number;
  binary: string;
  desc: string;
}

const registerRows = ref<RegisterRow[]>([
  { address: 40001, hex: '0x01E2', dec: 482, binary: '0000 0001 1110 0010', desc: 'Line Voltage (48.2 V)' },
  { address: 40002, hex: '0x00A5', dec: 165, binary: '0000 0000 1010 0101', desc: 'Current RMS (1.65 A)' },
  { address: 40003, hex: '0x031B', dec: 795, binary: '0000 0011 0001 1011', desc: 'Active Power (79.5 W)' },
  { address: 40004, hex: '0x0032', dec: 50, binary: '0000 0000 0011 0010', desc: 'Frequency (50.0 Hz)' },
  { address: 40005, hex: '0x011A', dec: 282, binary: '0000 0001 0001 1010', desc: 'Motor Temp (28.2 °C)' },
  { address: 40006, hex: '0x0001', dec: 1, binary: '0000 0000 0000 0001', desc: 'System Status: Run' },
  { address: 40007, hex: '0x0000', dec: 0, binary: '0000 0000 0000 0000', desc: 'Fault Code: None' },
  { address: 40008, hex: '0x05DC', dec: 1500, binary: '0000 0101 1101 1100', desc: 'RPM Speed (1500 rpm)' },
]);

function readModbusRegisters() {
  modbusLoading.value = true;
  setTimeout(() => {
    modbusLoading.value = false;
    lastScanTime.value = new Date().toLocaleTimeString();
    ElMessage.success(`Scanned ${modbusForm.count} registers successfully from Unit ${modbusForm.slaveId}`);
  }, 400);
}

function resetModbusRegisters() {
  registerRows.value = [];
  lastScanTime.value = '';
}

// MQTT State
const mqttTopicInput = ref('itest/telemetry/#');
const activeSubscriptions = ref<string[]>(['itest/telemetry/#', 'itest/alarms/#']);
const publishTopic = ref('itest/commands/node-01');
const publishPayload = ref('{\n  "action": "restart",\n  "force": false\n}');

interface MqttMessage {
  topic: string;
  payload: string;
  qos: number;
  timestamp: string;
}

const mqttMessages = ref<MqttMessage[]>([
  {
    topic: 'itest/telemetry/press-sensor-01',
    payload: JSON.stringify({ pressure_bar: 4.82, battery_mv: 3580, rssi: -72 }, null, 2),
    qos: 1,
    timestamp: new Date(Date.now() - 15000).toLocaleTimeString(),
  },
  {
    topic: 'itest/alarms/temp-high',
    payload: JSON.stringify({ deviceId: 'modbus-pump-02', alert: 'Warning: temp above 80C', val: 82.4 }, null, 2),
    qos: 2,
    timestamp: new Date(Date.now() - 5000).toLocaleTimeString(),
  },
]);

function subscribeTopic() {
  if (!mqttTopicInput.value) return;
  if (!activeSubscriptions.value.includes(mqttTopicInput.value)) {
    activeSubscriptions.value.push(mqttTopicInput.value);
    ElMessage.success(`Subscribed to topic: ${mqttTopicInput.value}`);
  }
}

function removeSubscription(topic: string) {
  activeSubscriptions.value = activeSubscriptions.value.filter((t) => t !== topic);
}

function publishMqtt() {
  if (!publishTopic.value) return;
  mqttMessages.value.unshift({
    topic: publishTopic.value,
    payload: publishPayload.value,
    qos: 0,
    timestamp: new Date().toLocaleTimeString(),
  });
  ElMessage.success(`Published test payload to ${publishTopic.value}`);
}
</script>

<style scoped>
.diagnostics-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 4px 0 0 0;
}

.w-full {
  width: 100%;
}

.mqtt-message-stream {
  max-height: 440px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty-state {
  text-align: center;
  color: #94a3b8;
  padding: 40px 0;
}

.mqtt-msg-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px;
}

.msg-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.msg-topic {
  color: #1e40af;
  font-size: 13px;
}

.msg-time {
  margin-left: auto;
  font-size: 11px;
  color: #94a3b8;
}

.msg-payload {
  margin: 0;
  background: #ffffff;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #f1f5f9;
  font-size: 12px;
  color: #334155;
  white-space: pre-wrap;
}
</style>
