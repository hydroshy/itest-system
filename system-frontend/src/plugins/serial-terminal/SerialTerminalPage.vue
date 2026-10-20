<template>
  <div class="serial-terminal-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">Industrial Web Serial Terminal</h2>
        <p class="page-desc">Direct browser-to-controller communication via Web Serial API (RS-485 / RS-232 / USB UART)</p>
      </div>

      <div class="connection-status">
        <ConnectionIndicator :state="isConnected ? 'connected' : 'disconnected'" show-label />
      </div>
    </div>

    <!-- Serial Port Controls -->
    <el-card class="control-card">
      <el-form :inline="true" :model="config" class="serial-form">
        <el-form-item label="Baud Rate">
          <el-select v-model="config.baudRate" :disabled="isConnected" style="width: 130px">
            <el-option label="9600 bps" :value="9600" />
            <el-option label="19200 bps" :value="19200" />
            <el-option label="38400 bps" :value="38400" />
            <el-option label="57600 bps" :value="57600" />
            <el-option label="115200 bps" :value="115200" />
          </el-select>
        </el-form-item>

        <el-form-item label="Data Bits">
          <el-select v-model="config.dataBits" :disabled="isConnected" style="width: 80px">
            <el-option label="8" :value="8" />
            <el-option label="7" :value="7" />
          </el-select>
        </el-form-item>

        <el-form-item label="Parity">
          <el-select v-model="config.parity" :disabled="isConnected" style="width: 100px">
            <el-option label="None" value="none" />
            <el-option label="Even" value="even" />
            <el-option label="Odd" value="odd" />
          </el-select>
        </el-form-item>

        <el-form-item label="Stop Bits">
          <el-select v-model="config.stopBits" :disabled="isConnected" style="width: 80px">
            <el-option label="1" :value="1" />
            <el-option label="2" :value="2" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button
            v-if="!isConnected"
            type="primary"
            :loading="connecting"
            @click="connectSerial"
          >
            Connect Port
          </el-button>
          <el-button
            v-else
            type="danger"
            @click="disconnectSerial"
          >
            Disconnect
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Terminal Console & Command Input -->
    <el-card class="console-card">
      <div class="console-header">
        <div class="header-left">
          <span>Terminal Output Log</span>
          <el-radio-group v-model="displayMode" size="small">
            <el-radio-button label="ascii">ASCII</el-radio-button>
            <el-radio-button label="hex">HEX</el-radio-button>
          </el-radio-group>
        </div>
        <div class="header-actions">
          <el-button size="small" @click="clearLogs">Clear</el-button>
          <el-button size="small" @click="exportLogs">Export Log</el-button>
        </div>
      </div>

      <div class="terminal-body" ref="terminalBodyRef">
        <div v-for="(log, idx) in logs" :key="idx" class="log-line" :class="`log-${log.type}`">
          <span class="log-time">[{{ log.time }}]</span>
          <span class="log-prefix">{{ log.prefix }}</span>
          <span class="log-text">{{ formatLogText(log.text) }}</span>
        </div>
        <div v-if="logs.length === 0" class="log-empty">
          Terminal ready. Connect to a COM port to start monitoring.
        </div>
      </div>

      <div class="console-input-row">
        <el-input
          v-model="inputCommand"
          placeholder="Enter command (e.g. AT+INFO or Modbus Hex: 01 03 00 00 00 02 C4 0B)..."
          :disabled="!isConnected"
          @keyup.enter="sendCommand"
        >
          <template #append>
            <el-button :disabled="!isConnected" @click="sendCommand">Send</el-button>
          </template>
        </el-input>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import ConnectionIndicator from '../../components/shared/ConnectionIndicator.vue';

interface LogItem {
  time: string;
  type: 'rx' | 'tx' | 'sys';
  prefix: string;
  text: string;
}

const isConnected = ref(false);
const connecting = ref(false);
const displayMode = ref<'ascii' | 'hex'>('ascii');
const inputCommand = ref('');
const logs = ref<LogItem[]>([]);
const terminalBodyRef = ref<HTMLElement | null>(null);

const config = reactive({
  baudRate: 115200,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
});

let port: any = null;
let reader: any = null;
let keepReading = false;

function addLog(type: 'rx' | 'tx' | 'sys', text: string) {
  const time = new Date().toLocaleTimeString();
  const prefix = type === 'rx' ? '◀ RX: ' : type === 'tx' ? '▶ TX: ' : 'ℹ SYS: ';
  logs.value.push({ time, type, prefix, text });
  nextTick(() => {
    if (terminalBodyRef.value) {
      terminalBodyRef.value.scrollTop = terminalBodyRef.value.scrollHeight;
    }
  });
}

function formatLogText(text: string) {
  if (displayMode.value === 'hex') {
    const encoder = new TextEncoder();
    return Array.from(encoder.encode(text))
      .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');
  }
  return text;
}

async function connectSerial() {
  if (!('serial' in navigator)) {
    // Provide simulation mode if Web Serial is not supported in environment
    addLog('sys', 'Web Serial API is not available in this browser. Entering Mock Loopback Mode.');
    isConnected.value = true;
    addLog('sys', `Mock Serial port opened at ${config.baudRate} bps (8-${config.parity.toUpperCase().charAt(0)}-${config.stopBits})`);
    return;
  }

  connecting.value = true;
  try {
    port = await (navigator as any).serial.requestPort();
    await port.open({
      baudRate: config.baudRate,
      dataBits: config.dataBits,
      parity: config.parity,
      stopBits: config.stopBits,
    });
    isConnected.value = true;
    addLog('sys', `Connected to serial port at ${config.baudRate} bps`);
    keepReading = true;
    readLoop();
  } catch (err: any) {
    ElMessage.error(`Port connection failed: ${err.message}`);
    addLog('sys', `Connection error: ${err.message}`);
  } finally {
    connecting.value = false;
  }
}

async function readLoop() {
  while (port && port.readable && keepReading) {
    reader = port.readable.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          const text = new TextDecoder().decode(value);
          addLog('rx', text);
        }
      }
    } catch (err: any) {
      addLog('sys', `Read error: ${err.message}`);
      break;
    } finally {
      reader.releaseLock();
    }
  }
}

async function disconnectSerial() {
  keepReading = false;
  if (reader) {
    try {
      await reader.cancel();
    } catch (_) {}
  }
  if (port) {
    try {
      await port.close();
    } catch (_) {}
  }
  port = null;
  reader = null;
  isConnected.value = false;
  addLog('sys', 'Serial port disconnected and resources released.');
}

async function sendCommand() {
  if (!inputCommand.value) return;
  const cmd = inputCommand.value;
  addLog('tx', cmd);
  inputCommand.value = '';

  if (port && port.writable) {
    const writer = port.writable.getWriter();
    await writer.write(new TextEncoder().encode(cmd + '\r\n'));
    writer.releaseLock();
  } else {
    // Mock simulation response
    setTimeout(() => {
      if (cmd.toUpperCase().startsWith('AT')) {
        addLog('rx', 'OK\r\n');
      } else {
        addLog('rx', `ACK [${cmd.length} bytes received]\r\n`);
      }
    }, 150);
  }
}

function clearLogs() {
  logs.value = [];
}

function exportLogs() {
  const content = logs.value.map((l) => `[${l.time}] ${l.prefix} ${l.text}`).join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `serial-session-${Date.now()}.log`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
.serial-terminal-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.serial-form {
  margin-bottom: -18px;
}

.console-card {
  display: flex;
  flex-direction: column;
}

.console-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.terminal-body {
  height: 380px;
  background: #0f172a;
  border-radius: 6px;
  padding: 16px;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.log-line {
  line-height: 1.4;
  word-break: break-all;
}

.log-rx {
  color: #38bdf8;
}
.log-tx {
  color: #4ade80;
}
.log-sys {
  color: #94a3b8;
  font-style: italic;
}

.log-time {
  color: #64748b;
  margin-right: 8px;
}

.log-prefix {
  font-weight: 700;
}

.log-empty {
  color: #64748b;
  text-align: center;
  margin-top: 150px;
}

.console-input-row {
  margin-top: 16px;
}
</style>
