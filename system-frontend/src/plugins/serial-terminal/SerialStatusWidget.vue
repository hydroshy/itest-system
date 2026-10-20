<template>
  <div class="serial-widget">
    <div class="widget-row">
      <el-icon class="widget-icon"><Tools /></el-icon>
      <div class="widget-info">
        <span class="widget-heading">Web Serial Diagnostic</span>
        <span class="widget-sub">Direct COM / RS-485 Channel</span>
      </div>
    </div>
    <div class="widget-actions">
      <el-button size="small" type="primary" @click="$router.push('/tools/serial-terminal')">
        Open Terminal
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Tools } from '@element-plus/icons-vue';
</script>

<style scoped>
.serial-widget {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.widget-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.widget-icon {
  font-size: 24px;
  color: #3b82f6;
}
.widget-info {
  display: flex;
  flex-direction: column;
}
.widget-heading {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}
.widget-sub {
  font-size: 12px;
  color: #64748b;
}
</style>
