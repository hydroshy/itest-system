<template>
  <div class="hello-widget">
    <div class="widget-row">
      <el-icon class="widget-icon"><StarFilled /></el-icon>
      <div class="widget-info">
        <span class="widget-heading">Hello World Plugin</span>
        <span class="widget-sub">Dynamic Widget Injected via SDK</span>
      </div>
    </div>
    <div class="widget-counter">
      <span>Widget clicks: <strong>{{ clicks }}</strong></span>
      <el-button size="small" type="primary" @click="clicks++">Interact</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { StarFilled } from '@element-plus/icons-vue';

const clicks = ref(0);
</script>

<style scoped>
.hello-widget {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.widget-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.widget-icon {
  font-size: 24px;
  color: #eab308;
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
.widget-counter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px dashed #e2e8f0;
  font-size: 13px;
}
</style>
