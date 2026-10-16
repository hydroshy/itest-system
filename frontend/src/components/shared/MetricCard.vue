<template>
  <div class="metric-card">
    <div class="metric-header">
      <span class="metric-title">{{ title }}</span>
      <span v-if="quality" class="metric-quality" :class="`quality-${quality}`">
        {{ quality }}
      </span>
    </div>
    <div class="metric-body">
      <span class="metric-value">{{ formattedValue }}</span>
      <span v-if="unit" class="metric-unit">{{ unit }}</span>
    </div>
    <div v-if="subtext || trend" class="metric-footer">
      <span v-if="trend" class="metric-trend" :class="`trend-${trend}`">
        <span v-if="trend === 'up'">▲</span>
        <span v-if="trend === 'down'">▼</span>
        <span v-if="trend === 'stable'">■</span>
        {{ trendValue }}
      </span>
      <span v-if="subtext" class="metric-subtext">{{ subtext }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    title: string;
    value: number | string | null | undefined;
    unit?: string;
    precision?: number;
    quality?: 'good' | 'bad' | 'uncertain';
    trend?: 'up' | 'down' | 'stable';
    trendValue?: string;
    subtext?: string;
  }>(),
  {
    value: '--',
    quality: 'good',
  }
);

const formattedValue = computed(() => {
  if (props.value === null || props.value === undefined) return '--';
  if (typeof props.value === 'number' && props.precision !== undefined) {
    return props.value.toFixed(props.precision);
  }
  return String(props.value);
});
</script>

<style scoped>
.metric-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-title {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-quality {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
}

.quality-good {
  background: #ecfdf5;
  color: #059669;
}
.quality-bad {
  background: #fef2f2;
  color: #dc2626;
}
.quality-uncertain {
  background: #fffbeb;
  color: #d97706;
}

.metric-body {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}

.metric-unit {
  font-size: 14px;
  font-weight: 500;
  color: #94a3b8;
}

.metric-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.trend-up {
  color: #10b981;
}
.trend-down {
  color: #ef4444;
}
.trend-stable {
  color: #64748b;
}
</style>
