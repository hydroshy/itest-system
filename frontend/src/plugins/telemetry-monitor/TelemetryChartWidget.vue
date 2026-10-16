<template>
  <div class="telemetry-chart-widget">
    <div ref="chartRef" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts';

const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;
let timer: any = null;

onMounted(() => {
  if (!chartRef.value) return;

  chartInstance = echarts.init(chartRef.value);

  const times = ['10:00', '10:05', '10:10', '10:15', '10:20', '10:25', '10:30'];
  const pressureData = [4.2, 4.5, 4.8, 4.7, 4.9, 5.1, 4.8];
  const tempData = [78.2, 79.5, 81.0, 82.4, 83.1, 82.8, 82.4];

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['Pressure (bar)', 'Temperature (°C)'],
      bottom: 0,
    },
    grid: {
      top: 15,
      left: 35,
      right: 35,
      bottom: 35,
    },
    xAxis: {
      type: 'category',
      data: times,
      boundaryGap: false,
    },
    yAxis: [
      {
        type: 'value',
        name: 'bar',
        min: 0,
        max: 8,
      },
      {
        type: 'value',
        name: '°C',
        min: 0,
        max: 100,
      },
    ],
    series: [
      {
        name: 'Pressure (bar)',
        type: 'line',
        smooth: true,
        data: pressureData,
        itemStyle: { color: '#2563eb' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(37, 99, 235, 0.3)' },
            { offset: 1, color: 'rgba(37, 99, 235, 0.0)' },
          ]),
        },
      },
      {
        name: 'Temperature (°C)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: tempData,
        itemStyle: { color: '#ef4444' },
      },
    ],
  };

  chartInstance.setOption(option);

  // Auto-resize on container size change (e.g., sidebar toggle, grid re-flow)
  if (typeof ResizeObserver !== 'undefined' && chartRef.value) {
    resizeObserver = new ResizeObserver(() => {
      chartInstance?.resize();
    });
    resizeObserver.observe(chartRef.value);
  }

  window.addEventListener('resize', handleResize);
});

function handleResize() {
  chartInstance?.resize();
}

onUnmounted(() => {
  if (timer) clearInterval(timer);
  resizeObserver?.disconnect();
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
});
</script>

<style scoped>
.telemetry-chart-widget {
  width: 100%;
}
.chart-container {
  width: 100%;
  height: 240px;
}
</style>
