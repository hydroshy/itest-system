<template>
  <div class="hello-device-panel">
    <el-card shadow="never" class="panel-card">
      <div class="panel-header">
        <el-tag size="small" type="success">Plugin Extension: device-detail-panel</el-tag>
        <span class="device-label">Target: {{ device?.name }}</span>
      </div>
      <p class="panel-text">
        This extension tab was injected by <strong>plugin-hello-world</strong> without modifying the core Device Detail view!
      </p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  device?: Record<string, any>;
}>();
</script>

<style scoped>
.panel-card {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.device-label {
  font-size: 12px;
  font-family: monospace;
  color: #64748b;
}
.panel-text {
  font-size: 13px;
  color: #334155;
  margin: 0;
}
</style>
