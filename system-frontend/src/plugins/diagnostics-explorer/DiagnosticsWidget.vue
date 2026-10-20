<template>
  <div class="diagnostics-widget">
    <div class="widget-header">
      <span class="font-bold text-sm">Protocol Bus Health</span>
      <el-tag size="small" type="success">Normal</el-tag>
    </div>
    <div class="bus-metrics mt-3">
      <div class="bus-item">
        <span class="bus-name">Modbus RTU / RS485</span>
        <span class="bus-val text-green-600 font-mono">OK (0 crc errors)</span>
      </div>
      <div class="bus-item">
        <span class="bus-name">Modbus TCP</span>
        <span class="bus-val text-green-600 font-mono">Connected (port 502)</span>
      </div>
      <div class="bus-item">
        <span class="bus-name">MQTT Broker</span>
        <span class="bus-val text-green-600 font-mono">12 msgs/sec</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.diagnostics-widget {
  padding: 12px;
  background: #ffffff;
  height: 100%;
}
.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.bus-metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bus-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding: 6px 8px;
  background: #f8fafc;
  border-radius: 4px;
}
.bus-name {
  color: #475569;
}
.bus-val {
  font-weight: 600;
}
</style>
