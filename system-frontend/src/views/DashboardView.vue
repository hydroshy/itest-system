<template>
  <div class="dashboard-view">
    <!-- Section: Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Operations & Telemetry Overview</h1>
        <p class="page-desc">Real-time status of connected industrial gateways, modbus sensors, and LoRaWAN nodes</p>
      </div>
      <div class="header-actions">
        <ConnectionIndicator state="connected" show-label label="Telemetry Ingestion Active" />
        <el-button type="primary" size="default" @click="refreshData">
          <el-icon><Refresh /></el-icon> Refresh
        </el-button>
      </div>
    </div>

    <!-- Section: Metric Cards -->
    <div class="metrics-grid">
      <MetricCard
        title="Connected Devices"
        :value="deviceCount"
        subtext="+2 added this hour"
        trend="up"
        trend-value="4.5%"
      />
      <MetricCard
        title="Active Gateways"
        :value="gatewayCount"
        unit="units"
        quality="good"
        subtext="100% online"
        trend="stable"
      />
      <MetricCard
        title="Data Ingestion Rate"
        :value="dataRate"
        unit="msg/s"
        :precision="1"
        quality="good"
        trend="up"
        trend-value="12.8%"
      />
      <MetricCard
        title="Active Alarms"
        :value="alarmCount"
        quality="bad"
        subtext="1 critical threshold"
        trend="down"
        trend-value="-50%"
      />
    </div>

    <!-- Section: Dynamic Plugin Widgets -->
    <div v-if="activeWidgets.length > 0" class="plugin-widgets-section">
      <div class="section-title">
        <span>Dynamic Plugin Widgets ({{ activeWidgets.length }})</span>
        <el-tag size="small" type="info">Extensible Architecture</el-tag>
      </div>
      <div class="widgets-grid">
        <div
          v-for="widget in activeWidgets"
          :key="widget.id"
          class="widget-wrapper"
          :style="{ gridColumn: `span ${Math.min(widget.cols || 1, 3)}` }"
        >
          <div class="widget-card">
            <div class="widget-header">
              <span class="widget-title">{{ widget.title }}</span>
              <el-tag size="small" effect="plain">{{ widget.pluginId }}</el-tag>
            </div>
            <div class="widget-content">
              <component :is="widget.component" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section: Extension Slot -->
    <ExtensionSlot name="dashboard-bottom" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import ConnectionIndicator from '../components/shared/ConnectionIndicator.vue';
import MetricCard from '../components/shared/MetricCard.vue';
import ExtensionSlot from '../components/shared/ExtensionSlot.vue';
import { usePlugins } from '../composables/usePlugins';

const { activeWidgets } = usePlugins();

const deviceCount = ref(42);
const gatewayCount = ref(3);
const dataRate = ref(128.4);
const alarmCount = ref(1);

function refreshData() {
  dataRate.value = +(120 + Math.random() * 20).toFixed(1);
}
</script>

<style scoped>
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.plugin-widgets-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.widgets-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.widget-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.widget-header {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
}

.widget-title {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.widget-content {
  padding: 16px;
}
</style>
