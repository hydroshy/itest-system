<template>
  <div class="hello-world-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>Hello World Plugin Page</h3>
          <el-tag type="success">Dynamically Loaded Route</el-tag>
        </div>
      </template>

      <p>
        This page was registered dynamically at runtime through <code>@platform/frontend-sdk</code>.
        It is completely decoupled from the Core Application Shell.
      </p>

      <el-alert
        title="Plugin Architecture Confirmed"
        type="success"
        description="Dynamic routing, menu injection, and permission guards are functioning properly without modifying the Application Shell."
        show-icon
        :closable="false"
      />

      <div style="margin-top: 20px;">
        <el-button type="primary" @click="pingEvent">Publish Plugin Event</el-button>
        <span v-if="lastPingTime" style="margin-left: 12px; font-size: 13px; color: #64748b;">
          Last ping emitted at: {{ lastPingTime }}
        </span>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

const lastPingTime = ref<string | null>(null);

function pingEvent() {
  lastPingTime.value = new Date().toLocaleTimeString();
  ElMessage.success('Event emitted from Hello World Plugin');
}
</script>

<style scoped>
.hello-world-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header h3 {
  margin: 0;
  font-size: 16px;
  color: #1e293b;
}
</style>
