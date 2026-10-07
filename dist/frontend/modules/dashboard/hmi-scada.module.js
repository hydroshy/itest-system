"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HMI_SCADA_SCRIPT = exports.HMI_SCADA_MODALS = exports.HMI_SCADA_TEMPLATE = void 0;
exports.HMI_SCADA_TEMPLATE = `          <div v-else-if="activeFeature.id === 'hmi-scada-viewer'" class="space-y-4">
            
            <!-- HMI Header & Control Toolbar -->
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/70 p-3.5 sm:p-4 rounded-xl border border-slate-800 shadow-md">
              <!-- Left: Title, Icon & Screen Selector -->
              <div class="flex items-center gap-3 flex-wrap">
                <button @click="returnToHome" title="Back to Dashboard" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer transition">
                  <i class="fa-solid fa-arrow-left"></i>
                </button>
                <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 text-lg shadow-inner">
                  <i class="fa-solid fa-palette"></i>
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="text-sm font-bold text-white tracking-wide">HMI SCADA MONITOR</h3>
                    <!-- Screen Selector Dropdown -->
                    <div class="relative inline-block">
                      <select
                        v-if="publishedHmiScreens.length > 0"
                        v-model="selectedHmiScreenId"
                        @change="loadSelectedHmiScreen"
                        class="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option v-for="sc in publishedHmiScreens" :key="sc.id" :value="sc.id">
                          {{ sc.name }} ({{ sc.widgets?.length || 0 }} widgets)
                        </option>
                      </select>
                      <span v-else class="text-xs text-slate-500 italic">No published screens</span>
                    </div>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-0.5 truncate max-w-md">
                    {{ currentHmiScreen?.description || 'Interactive Wecon-style industrial HMI diagram with live decoded telemetry and downlink actuator controls' }}
                  </p>
                </div>
              </div>

              <!-- Right: Realtime Status & Tools -->
              <div class="flex items-center gap-2 flex-wrap justify-end">
                <!-- Realtime Online Badge -->
                <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold"
                  :class="realtimeConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'">
                  <span class="w-2 h-2 rounded-full" :class="realtimeConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'"></span>
                  <span>{{ realtimeConnected ? 'REALTIME ONLINE' : 'POLLING MODE' }}</span>
                </div>

                <!-- Rx Packets Counter -->
                <div class="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-sky-400 font-bold flex items-center gap-1">
                  <i class="fa-solid fa-satellite-dish text-[10px]"></i>
                  <span>Rx: {{ hmiRxPacketCount }}</span>
                </div>

                <!-- Active Alarms Indicator -->
                <div class="px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold flex items-center gap-1.5"
                  :class="activeAlarmsList.length > 0 ? 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse' : 'bg-slate-950 border-slate-800 text-slate-400'">
                  <i class="fa-solid fa-triangle-exclamation" :class="activeAlarmsList.length > 0 ? 'text-red-400' : 'text-slate-500'"></i>
                  <span>{{ activeAlarmsList.length }} ALARMS</span>
                </div>

                <!-- View Mode Switcher -->
                <div class="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
                  <button
                    @click="hmiViewerMode = 'canvas'"
                    title="Visual SCADA Canvas"
                    class="px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                    :class="hmiViewerMode === 'canvas' ? 'bg-amber-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'"
                  >
                    <i class="fa-solid fa-palette text-[11px]"></i> SCADA
                  </button>
                  <button
                    @click="hmiViewerMode = 'alarms'"
                    title="Active Alarms"
                    class="px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                    :class="hmiViewerMode === 'alarms' ? 'bg-red-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'"
                  >
                    <i class="fa-solid fa-bell text-[11px]"></i> Alarms ({{ activeAlarmsList.length }})
                  </button>
                  <button
                    @click="hmiViewerMode = 'matrix'"
                    title="Decoded Tags Matrix"
                    class="px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                    :class="hmiViewerMode === 'matrix' ? 'bg-sky-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'"
                  >
                    <i class="fa-solid fa-table-cells text-[11px]"></i> Tags
                  </button>
                </div>

                <!-- Zoom Controls (for Canvas Mode) -->
                <div v-if="hmiViewerMode === 'canvas'" class="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
                  <button @click="hmiZoom = Math.max(0.4, Number((hmiZoom - 0.1).toFixed(1)))" title="Zoom Out" class="px-2 py-1 text-slate-400 hover:text-white cursor-pointer font-bold">-</button>
                  <span class="px-1.5 text-[10px] font-mono text-slate-300">{{ Math.round(hmiZoom * 100) }}%</span>
                  <button @click="hmiZoom = Math.min(2.0, Number((hmiZoom + 0.1).toFixed(1)))" title="Zoom In" class="px-2 py-1 text-slate-400 hover:text-white cursor-pointer font-bold">+</button>
                  <button @click="hmiZoom = 1.0" title="Reset Zoom to 100%" class="px-2 py-1 text-[10px] text-slate-400 hover:text-amber-400 cursor-pointer">1:1</button>
                  <button @click="fitHmiZoom" title="Fit Canvas to Viewport" class="px-2 py-1 text-[10px] text-slate-400 hover:text-amber-400 cursor-pointer">FIT</button>
                </div>

                <!-- Manual Refresh Button -->
                <button
                  @click="refreshHmiViewer"
                  :disabled="hmiLoading"
                  title="Refresh Screen & Live Telemetry"
                  class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer transition"
                >
                  <i class="fa-solid fa-arrows-rotate" :class="{ 'fa-spin': hmiLoading }"></i>
                </button>
              </div>
            </div>

            <!-- VIEW 1: SCADA CANVAS VIEW -->
            <div v-if="hmiViewerMode === 'canvas'" class="space-y-3">
              
              <!-- No Screens Published Fallback -->
              <div v-if="!currentHmiScreen" class="py-20 text-center bg-slate-950/80 rounded-2xl border border-slate-800 p-8 space-y-4 shadow-xl">
                <div class="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 text-2xl mx-auto shadow-inner">
                  <i class="fa-solid fa-palette"></i>
                </div>
                <div class="space-y-1">
                  <h3 class="text-base font-bold text-white">No Published HMI Screen Available</h3>
                  <p class="text-xs text-slate-400 max-w-md mx-auto">
                    No HMI screens have been published for your role yet. Please ask an Administrator to design and publish a SCADA screen via the Control Panel HMI Studio.
                  </p>
                </div>
                <button @click="fetchPublishedHmiScreens" class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 inline-flex items-center gap-2 cursor-pointer">
                  <i class="fa-solid fa-arrows-rotate"></i> Check for Published Screens
                </button>
              </div>

              <!-- SCADA Canvas Viewport -->
              <div v-else ref="hmiCanvasViewportRef" class="relative w-full overflow-auto rounded-2xl border border-slate-800 shadow-2xl custom-scroll" style="min-height: 580px; max-height: 82vh; background: #060911;">
                
                <!-- Canvas Stage Container scaled by hmiZoom -->
                <div
                  class="relative transition-transform duration-75 origin-top-left"
                  :style="{
                    width: (currentHmiScreen.canvasConfig?.width || 1280) + 'px',
                    height: (currentHmiScreen.canvasConfig?.height || 720) + 'px',
                    transform: 'scale(' + hmiZoom + ')',
                    backgroundColor: currentHmiScreen.canvasConfig?.background || '#0b0f19',
                    backgroundImage: currentHmiScreen.canvasConfig?.showGrid !== false ? 'radial-gradient(circle, #334155 1px, transparent 1px)' : 'none',
                    backgroundSize: (currentHmiScreen.canvasConfig?.grid || 20) + 'px ' + (currentHmiScreen.canvasConfig?.grid || 20) + 'px'
                  }"
                >
                  
                  <!-- RENDER EACH WIDGET -->
                  <div
                    v-for="w in currentHmiScreen.widgets"
                    :key="w.id"
                    class="absolute select-none transition-all duration-150"
                    :class="{
                      'ring-2 ring-red-500 animate-pulse': isWidgetAlarmActive(w)
                    }"
                    :style="{
                      left: w.x + 'px',
                      top: w.y + 'px',
                      width: w.w + 'px',
                      height: w.h + 'px',
                      zIndex: w.zIndex || 1
                    }"
                  >
                    
                    <!-- 1. STATIC LABEL -->
                    <div v-if="w.type === 'static-label'" class="w-full h-full flex flex-col justify-center px-2 pointer-events-none">
                      <div :style="{ color: w.props?.textColor || '#ffffff', fontSize: (w.props?.fontSize || 14) + 'px', fontWeight: w.props?.fontWeight || 'bold', textAlign: w.props?.textAlign || 'left' }" class="leading-tight">
                        {{ w.props?.text || 'LABEL' }}
                      </div>
                      <div v-if="w.props?.subText" class="text-[10px] text-slate-400 mt-0.5" :style="{ textAlign: w.props?.textAlign || 'left' }">
                        {{ w.props.subText }}
                      </div>
                    </div>

                    <!-- 2. BIT LAMP -->
                    <div v-else-if="w.type === 'bit-lamp'" class="w-full h-full p-2 bg-slate-900/90 rounded-xl border border-slate-800 shadow-md flex items-center justify-between gap-2.5">
                      <div class="truncate">
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{{ w.props?.title || 'LAMP' }}</div>
                        <div class="text-xs font-bold mt-0.5" :style="{ color: isWidgetBitOn(w) ? (w.props?.colorOn || '#10b981') : '#64748b' }">
                          {{ isWidgetBitOn(w) ? (w.props?.labelOn || 'RUNNING') : (w.props?.labelOff || 'STOPPED') }}
                        </div>
                      </div>
                      <div
                        class="w-6 h-6 border-2 transition-all duration-200 shrink-0"
                        :class="w.props?.shape === 'rect' ? 'rounded-md' : 'rounded-full'"
                        :style="getWidgetBitLampStyle(w)"
                      ></div>
                    </div>

                    <!-- 3. MULTI-STATE LAMP -->
                    <div v-else-if="w.type === 'multi-state-lamp'" class="w-full h-full p-2 bg-slate-900/90 rounded-xl border border-slate-800 shadow-md flex items-center justify-between gap-2">
                      <div class="truncate">
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{{ w.props?.title || 'STATUS' }}</div>
                        <div class="text-xs font-bold mt-0.5 truncate" :style="{ color: getWidgetMultiStateColor(w) }">
                          {{ getWidgetMultiStateLabel(w) }}
                        </div>
                      </div>
                      <div class="px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 shrink-0" :style="getWidgetMultiStateStyle(w)">
                        <i :class="getWidgetMultiStateIcon(w)"></i>
                        <span class="font-mono text-[11px]">{{ getWidgetTelemetryValue(w) }}</span>
                      </div>
                    </div>

                    <!-- 4. ALARM BANNER -->
                    <div v-else-if="w.type === 'alarm-banner'" class="w-full h-full px-3 py-1.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-bold transition-all duration-300"
                      :class="activeAlarmsList.length > 0 ? 'bg-red-950/90 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] text-red-200 animate-pulse' : 'bg-slate-900/90 border-emerald-500/30 text-emerald-400 shadow-inner'">
                      <div class="flex items-center gap-2 overflow-hidden truncate">
                        <i class="fa-solid" :class="activeAlarmsList.length > 0 ? 'fa-triangle-exclamation text-red-400 text-sm' : 'fa-circle-check text-emerald-400'"></i>
                        <span class="uppercase tracking-wider text-[11px] text-slate-300 font-extrabold shrink-0">{{ w.props?.title || 'ALARM MONITOR' }}:</span>
                        <span class="truncate text-[11px]" :class="activeAlarmsList.length > 0 ? 'text-red-200 font-semibold' : 'text-emerald-300'">
                          {{ activeAlarmsList.length > 0 ? activeAlarmsList.map(a => a.text).join(' • ') : (w.props?.idleMessage || 'All parameters normal. No active alarms.') }}
                        </span>
                      </div>
                      <span v-if="activeAlarmsList.length > 0" class="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold shrink-0">
                        {{ activeAlarmsList.length }} ACTIVE
                      </span>
                    </div>

                    <!-- 5. LINEAR TANK -->
                    <div v-else-if="w.type === 'linear-tank'" class="w-full h-full p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between"
                      :class="{ 'border-red-500 ring-2 ring-red-500/50 shadow-red-500/20': isWidgetAlarmActive(w) }">
                      <div class="flex items-center justify-between border-b border-slate-800/80 pb-1">
                        <span class="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider truncate">{{ w.props?.title || 'TANK' }}</span>
                        <span class="text-[10px] font-mono font-bold text-sky-400">{{ getWidgetTankHeightPercent(w) }}%</span>
                      </div>
                      
                      <!-- Tank Body Graphics -->
                      <div class="relative flex-1 my-1.5 rounded-xl border border-slate-700 bg-slate-950/80 overflow-hidden flex items-end p-1 shadow-inner">
                        <!-- Tick marks -->
                        <div class="absolute inset-y-1 right-1 flex flex-col justify-between text-[8px] font-mono text-slate-500 pointer-events-none z-10 pr-0.5">
                          <span>100%</span>
                          <span>75%</span>
                          <span>50%</span>
                          <span>25%</span>
                          <span>0%</span>
                        </div>
                        <!-- Liquid fill bar -->
                        <div
                          class="w-full rounded-lg transition-all duration-300 relative shadow-lg"
                          :style="{
                            height: getWidgetTankHeightPercent(w) + '%',
                            backgroundColor: getWidgetLiquidColor(w),
                            boxShadow: '0 0 16px ' + getWidgetLiquidColor(w) + '55'
                          }"
                        >
                          <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/30 rounded-lg"></div>
                        </div>
                      </div>

                      <!-- Footer Value -->
                      <div class="flex items-center justify-between text-xs pt-0.5">
                        <span class="text-[10px] text-slate-500 font-mono">{{ w.props?.min || 0 }} - {{ w.props?.max || 100 }}</span>
                        <span class="font-mono font-extrabold text-white text-xs">
                          {{ getWidgetTelemetryValue(w) }} <span class="text-[10px] text-slate-400 font-normal">{{ w.props?.unit || 'm³' }}</span>
                        </span>
                      </div>
                    </div>

                    <!-- 6. SILO VESSEL -->
                    <div v-else-if="w.type === 'silo-vessel'" class="w-full h-full p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
                      <div class="flex items-center justify-between border-b border-slate-800/80 pb-1">
                        <span class="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider truncate">{{ w.props?.title || 'SILO' }}</span>
                        <span class="text-[10px] font-mono font-bold text-amber-400">{{ getWidgetTankHeightPercent(w) }}%</span>
                      </div>
                      <div class="relative flex-1 my-1.5 flex flex-col items-center justify-end">
                        <div class="w-4/5 flex-1 rounded-t-xl border border-slate-700 bg-slate-950/80 overflow-hidden flex items-end p-1 relative shadow-inner">
                          <div class="w-full rounded-t-lg transition-all duration-300"
                            :style="{ height: getWidgetTankHeightPercent(w) + '%', backgroundColor: w.props?.liquidColor || '#d97706' }"></div>
                        </div>
                        <div class="w-4/5 h-6 bg-slate-800 border-x border-b border-slate-700 rounded-b-full flex items-center justify-center text-[9px] text-slate-400">
                          HOPPER
                        </div>
                      </div>
                      <div class="text-right font-mono font-bold text-white text-xs">
                        {{ getWidgetTelemetryValue(w) }} <span class="text-[10px] text-slate-400">{{ w.props?.unit || 'ton' }}</span>
                      </div>
                    </div>

                    <!-- 7. DIAL GAUGE -->
                    <div v-else-if="w.type === 'dial-gauge'" class="w-full h-full p-2 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl flex flex-col items-center justify-between relative overflow-hidden"
                      :class="{ 'border-red-500 ring-2 ring-red-500/50 shadow-red-500/20': isWidgetAlarmActive(w) }">
                      <div class="w-full text-center text-[10px] font-extrabold text-slate-300 uppercase tracking-wider truncate pb-0.5">
                        {{ w.props?.title || 'PRESSURE GAUGE' }}
                      </div>
                      
                      <!-- SVG Dial Meter -->
                      <div class="relative w-28 h-28 flex items-center justify-center">
                        <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <!-- Dial Background Arc -->
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" stroke-width="8" stroke-dasharray="188.5" stroke-dashoffset="47" stroke-linecap="round" />
                          <!-- Dial Colored Arc -->
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" stroke-width="8" stroke-dasharray="188.5"
                            :stroke-dashoffset="188.5 - (Math.min(100, Math.max(0, getWidgetTankHeightPercent(w))) / 100) * 141.5"
                            stroke-linecap="round" class="transition-all duration-300"
                            :style="{ stroke: getWidgetLiquidColor(w) }" />
                        </svg>
                        <!-- Center needle / hub -->
                        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div class="w-2.5 h-2.5 rounded-full bg-slate-200 shadow-md z-10"></div>
                          <div class="w-0.5 h-10 bg-red-500 origin-bottom transition-transform duration-300 shadow"
                            :style="{ transform: 'rotate(' + getWidgetGaugeAngle(w) + 'deg)', transformOrigin: 'bottom center', marginBottom: '40px' }"></div>
                        </div>
                      </div>

                      <!-- Value readout -->
                      <div class="w-full text-center pb-0.5">
                        <span class="text-sm font-extrabold font-mono text-white">{{ getWidgetTelemetryValue(w) }}</span>
                        <span class="text-[10px] text-slate-400 font-bold ml-1">{{ w.props?.unit || 'Bar' }}</span>
                      </div>
                    </div>

                    <!-- 8. LED NUMERIC -->
                    <div v-else-if="w.type === 'led-numeric'" class="w-full h-full p-2 bg-slate-900/95 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between">
                      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{{ w.props?.title || 'FLOW RATE' }}</div>
                      <div class="bg-black/80 rounded-lg p-2 border border-slate-800 flex items-baseline justify-end gap-1.5 shadow-inner">
                        <span class="font-mono text-lg sm:text-xl font-extrabold tracking-wider" :style="{ color: w.props?.color || '#38bdf8', textShadow: '0 0 10px ' + (w.props?.color || '#38bdf8') }">
                          {{ getWidgetTelemetryValue(w) }}
                        </span>
                        <span class="text-[10px] font-bold text-slate-400">{{ w.props?.unit || 'm³/h' }}</span>
                      </div>
                    </div>

                    <!-- 9. MONO BOX -->
                    <div v-else-if="w.type === 'mono-box'" class="w-full h-full p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 shadow-lg flex items-center justify-between gap-3">
                      <div class="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 text-base shrink-0 shadow-inner">
                        <i :class="w.props?.icon || 'fa-solid fa-gauge-high'"></i>
                      </div>
                      <div class="text-right truncate">
                        <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{{ w.props?.title || 'METRIC' }}</div>
                        <div class="text-base font-extrabold font-mono text-white mt-0.5">
                          {{ getWidgetTelemetryValue(w) }} <span class="text-[10px] font-normal text-slate-400">{{ w.props?.unit || '' }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- 10. TOGGLE SWITCH (DOWNLINK ACTUATOR) -->
                    <div v-else-if="w.type === 'toggle-switch'" class="w-full h-full p-2.5 bg-slate-900/95 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
                      <div class="flex items-center justify-between pb-1 border-b border-slate-800/80">
                        <span class="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider truncate">{{ w.props?.title || 'ACTUATOR SWITCH' }}</span>
                        <span class="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold" :class="isWidgetSwitchOn(w) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'">
                          {{ isWidgetSwitchOn(w) ? (w.props?.labelOn || 'AUTO ON') : (w.props?.labelOff || 'MANUAL OFF') }}
                        </span>
                      </div>
                      
                      <!-- Interactive Switch Slider -->
                      <div class="flex items-center justify-center py-1">
                        <button
                          type="button"
                          @click="triggerWidgetToggleSwitch(w)"
                          :disabled="w._sendingDownlink"
                          class="relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-md"
                          :class="isWidgetSwitchOn(w) ? 'bg-emerald-600' : 'bg-slate-700'"
                        >
                          <span
                            aria-hidden="true"
                            class="pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[10px]"
                            :class="isWidgetSwitchOn(w) ? 'translate-x-8 text-emerald-600' : 'translate-x-0 text-slate-600'"
                          >
                            <i v-if="w._sendingDownlink" class="fa-solid fa-circle-notch fa-spin text-amber-500"></i>
                            <i v-else-if="isWidgetSwitchOn(w)" class="fa-solid fa-check"></i>
                            <i v-else class="fa-solid fa-xmark"></i>
                          </span>
                        </button>
                      </div>

                      <div class="text-[9px] text-center text-slate-500 font-mono">
                        {{ w.action?.fPort ? ('Port ' + w.action.fPort + ' • Hex ' + (isWidgetSwitchOn(w) ? (w.action?.payloadHex || '0101') : '0100')) : 'Downlink Actuator' }}
                      </div>
                    </div>

                    <!-- 11. ACTION BUTTON (DOWNLINK PUSHBUTTON) -->
                    <div v-else-if="w.type === 'action-button'" class="w-full h-full p-2 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-center">
                      <button
                        type="button"
                        @click="triggerWidgetActionButton(w)"
                        :disabled="w._sendingDownlink"
                        class="w-full h-full rounded-xl text-white text-xs font-extrabold shadow-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition active:scale-95 disabled:opacity-50"
                        :style="{ backgroundColor: w.props?.buttonColor || '#e11d48', boxShadow: '0 4px 14px ' + (w.props?.buttonColor || '#e11d48') + '55' }"
                      >
                        <i v-if="w._sendingDownlink" class="fa-solid fa-circle-notch fa-spin text-sm"></i>
                        <i v-else :class="w.props?.icon || 'fa-solid fa-bolt'" class="text-sm"></i>
                        <span class="text-[11px] tracking-wide">{{ w.props?.label || 'DISPATCH ACTION' }}</span>
                      </button>
                    </div>

                    <!-- 12. REALTIME TREND CHART (METABASE STYLE WITH MULTI-SENSOR Y-AXIS & TIMESTAMP X-AXIS) -->
                    <div v-else-if="w.type === 'realtime-trend'" class="w-full h-full p-3 bg-slate-900/95 rounded-2xl border border-slate-800 shadow-2xl flex flex-col justify-between relative select-none">
                      <!-- Top Bar: Title + Metabase Time Range Filter + Controls -->
                      <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 gap-2 shrink-0">
                        <!-- Left: Title & Status -->
                        <div class="flex items-center gap-2 min-w-0">
                          <i class="fa-solid fa-chart-line text-sky-400 text-xs"></i>
                          <span class="text-[11px] font-bold text-white uppercase tracking-wider truncate">{{ w.props?.title || 'REALTIME TELEMETRY TREND' }}</span>
                          <span class="font-mono text-[9px] text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded shrink-0">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            LIVE
                          </span>
                        </div>

                        <!-- Right: Metabase Time Filter Pills + Add Sensor Button -->
                        <div class="flex items-center gap-1.5 shrink-0">
                          <!-- Metabase Time Range Presets -->
                          <div class="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[9px] font-mono">
                            <button
                              v-for="r in ['15m', '1h', '6h', '24h', '7d']"
                              :key="r"
                              type="button"
                              @click.stop="setTrendTimeRange(w, r)"
                              class="px-1.5 py-0.5 rounded transition font-bold cursor-pointer"
                              :class="(w.props?.timeRange || '1h') === r ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'"
                            >
                              {{ r }}
                            </button>
                          </div>

                          <!-- Add Series / Sensor Button -->
                          <button
                            type="button"
                            @click.stop="openAddTrendSeriesModal(w)"
                            class="px-2 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition"
                            title="Add sensor to chart (Y-Axis)"
                          >
                            <i class="fa-solid fa-plus text-[9px]"></i>
                            <span>Sensor</span>
                          </button>
                        </div>
                      </div>

                      <!-- Main Chart SVG Area: Y-Axis + Grid + Curves + X-Axis (Timestamp) -->
                      <div
                        class="flex-1 w-full min-h-0 relative bg-slate-950 rounded-lg border border-slate-800/80 overflow-hidden"
                        @mousemove="handleTrendMouseMove($event, w)"
                        @mouseleave="handleTrendMouseLeave(w)"
                      >
                        <svg viewBox="0 0 500 220" preserveAspectRatio="none" class="w-full h-full">
                          <defs>
                            <linearGradient v-for="s in getTrendSeries(w)" :key="'grad_' + s.id" :id="'trend_grad_' + w.id + '_' + s.id" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" :stop-color="s.color || '#38bdf8'" stop-opacity="0.25" />
                              <stop offset="100%" :stop-color="s.color || '#38bdf8'" stop-opacity="0.0" />
                            </linearGradient>
                          </defs>

                          <!-- Horizontal Grid Lines & Y-Axis Labels -->
                          <g v-for="yt in getTrendYBounds(w).ticks" :key="'y_' + yt.y">
                            <line x1="45" :y1="yt.y" x2="485" :y2="yt.y" stroke="#1e293b" stroke-width="1" stroke-dasharray="3,3" />
                            <text x="40" :y="yt.y + 3" fill="#64748b" font-size="8" font-family="monospace" text-anchor="end">{{ yt.label }}</text>
                          </g>

                          <!-- Vertical Grid Lines & X-Axis Timestamp Labels (Metabase style) -->
                          <g v-for="xt in getTrendXTicks(w)" :key="'x_' + xt.x">
                            <line :x1="xt.x" y1="16" :x2="xt.x" y2="192" stroke="#1e293b" stroke-width="1" stroke-dasharray="2,2" />
                            <text :x="xt.x" y="210" fill="#64748b" font-size="8" font-family="monospace" text-anchor="middle">{{ xt.label }}</text>
                          </g>

                          <!-- Area & Line Paths for each visible Series -->
                          <template v-for="s in getTrendSeries(w)" :key="'path_' + s.id">
                            <path
                              v-if="s.visible !== false"
                              :d="getTrendSeriesAreaPath(w, s)"
                              :fill="'url(#trend_grad_' + w.id + '_' + s.id + ')'"
                            />
                            <path
                              v-if="s.visible !== false"
                              :d="getTrendSeriesPath(w, s)"
                              fill="none"
                              :stroke="s.color || '#38bdf8'"
                              stroke-width="2.5"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <!-- Latest Point Dot -->
                            <circle
                              v-if="s.visible !== false && getTrendLatestPoint(w, s)"
                              :cx="getTrendLatestPoint(w, s).x"
                              :cy="getTrendLatestPoint(w, s).y"
                              r="3.5"
                              :fill="s.color || '#38bdf8'"
                              stroke="#0f172a"
                              stroke-width="1.5"
                            />
                          </template>

                          <!-- Interactive Crosshair Hover Line -->
                          <g v-if="trendHoverState[w.id]?.visible">
                            <line
                              :x1="trendHoverState[w.id].x"
                              y1="16"
                              :x2="trendHoverState[w.id].x"
                              y2="192"
                              stroke="#e2e8f0"
                              stroke-width="1"
                              stroke-dasharray="2,2"
                            />
                          </g>
                        </svg>

                        <!-- Interactive Hover Tooltip Overlay -->
                        <div
                          v-if="trendHoverState[w.id]?.visible"
                          class="absolute z-20 pointer-events-none bg-slate-900/95 border border-slate-700 p-2 rounded-lg shadow-xl text-[10px] font-mono space-y-1 backdrop-blur"
                          :style="{ left: Math.min(trendHoverState[w.id].pixelX + 10, 260) + 'px', top: '10px' }"
                        >
                          <div class="text-slate-400 font-bold border-b border-slate-800 pb-0.5 flex items-center gap-1">
                            <i class="fa-solid fa-clock text-sky-400 text-[9px]"></i>
                            <span>{{ trendHoverState[w.id].timeStr }}</span>
                          </div>
                          <div v-for="item in trendHoverState[w.id].values" :key="item.label" class="flex items-center justify-between gap-3">
                            <span class="flex items-center gap-1">
                              <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: item.color }"></span>
                              <span class="text-slate-300">{{ item.label }}:</span>
                            </span>
                            <span class="font-bold text-white">{{ item.value }} {{ item.unit }}</span>
                          </div>
                        </div>

                        <!-- Empty State when no series configured -->
                        <div
                          v-if="getTrendSeries(w).length === 0"
                          class="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-950/80"
                        >
                          <i class="fa-solid fa-chart-line text-slate-600 text-2xl mb-1"></i>
                          <span class="text-slate-400 text-[11px] font-medium">No sensors added to Y-Axis yet</span>
                          <button
                            type="button"
                            @click.stop="openAddTrendSeriesModal(w)"
                            class="mt-2 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1.5 cursor-pointer shadow-lg transition"
                          >
                            <i class="fa-solid fa-plus"></i>
                            <span>Add Sensor to Chart</span>
                          </button>
                        </div>
                      </div>

                      <!-- Bottom Bar: Multi-Sensor Series Legend & Show/Hide Toggles -->
                      <div class="pt-2 mt-1 border-t border-slate-800/60 flex items-center justify-between gap-2 text-[10px] font-mono shrink-0 flex-wrap">
                        <div class="flex items-center gap-2 flex-wrap">
                          <div
                            v-for="s in getTrendSeries(w)"
                            :key="s.id"
                            @click.stop="toggleTrendSeriesVisible(w, s.id)"
                            class="flex items-center gap-1.5 px-2 py-0.5 rounded-md border transition cursor-pointer select-none"
                            :class="s.visible !== false ? 'bg-slate-900/90 border-slate-700 text-white' : 'bg-slate-950/50 border-slate-800 text-slate-500 opacity-60 line-through'"
                            :title="'Click to toggle: ' + s.label"
                          >
                            <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: s.color || '#38bdf8' }"></span>
                            <span class="font-semibold truncate max-w-[120px]">{{ s.label || s.field }}</span>
                            <span class="text-sky-300 font-bold ml-1">
                              {{ getTrendSeriesLatestVal(w, s) }} {{ s.unit || '' }}
                            </span>
                          </div>
                        </div>

                        <div class="text-[9px] text-slate-500 flex items-center gap-2">
                          <span>{{ (trendPointsMap[w.id] || []).length }} data points</span>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            </div>

            <!-- VIEW 2: ACTIVE ALARMS VIEW -->
            <div v-else-if="hmiViewerMode === 'alarms'" class="space-y-4">
              <div class="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl space-y-3">
                <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-bell text-red-400"></i>
                    <h4 class="text-xs font-bold text-white uppercase tracking-wider">HMI Screen Alarms Status</h4>
                  </div>
                  <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full" :class="activeAlarmsList.length > 0 ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'">
                    {{ activeAlarmsList.length }} Triggered
                  </span>
                </div>

                <div v-if="activeAlarmsList.length === 0" class="py-12 text-center text-slate-500 text-xs space-y-2">
                  <i class="fa-solid fa-shield-check text-emerald-400 text-3xl mb-1"></i>
                  <div class="text-slate-300 font-bold">All SCADA Telemetry Parameters Normal</div>
                  <p class="text-[11px] text-slate-500">No high/low threshold conditions are currently triggered on any widget.</p>
                </div>

                <div v-else class="space-y-2">
                  <div v-for="alm in activeAlarmsList" :key="alm.widgetId + alm.text" class="p-3 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-between gap-3 shadow-md">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 text-sm">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                      </div>
                      <div>
                        <div class="text-xs font-bold text-white">{{ alm.title || alm.widgetId }}</div>
                        <div class="text-[11px] text-red-300 font-medium mt-0.5">{{ alm.text }}</div>
                      </div>
                    </div>
                    <div class="text-right font-mono">
                      <span class="text-xs font-bold text-amber-400">Value: {{ alm.value }}</span>
                      <div class="text-[9px] text-slate-500">Condition: {{ alm.condition }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- VIEW 3: TAG TELEMETRY MATRIX VIEW -->
            <div v-else-if="hmiViewerMode === 'matrix'" class="space-y-4">
              <div class="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl space-y-3">
                <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-table-cells text-sky-400"></i>
                    <h4 class="text-xs font-bold text-white uppercase tracking-wider">Decoded Telemetry Tags & RF Metrics</h4>
                  </div>
                  <span class="text-[10px] font-mono text-slate-400">
                    {{ Object.keys(hmiTelemetryMap).length }} Resolved Tags
                  </span>
                </div>

                <div v-if="Object.keys(hmiTelemetryMap).length === 0" class="py-12 text-center text-slate-500 text-xs">
                  No telemetry tags received yet. Please ensure devices are transmitting or run a packet simulation.
                </div>

                <div v-else class="overflow-x-auto custom-scroll">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr class="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th class="py-2.5 px-3">Tag Key / Device</th>
                        <th class="py-2.5 px-3">Current Value</th>
                        <th class="py-2.5 px-3">Data Type</th>
                        <th class="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60 font-mono text-xs">
                      <tr v-for="(val, tagKey) in hmiTelemetryMap" :key="tagKey" class="hover:bg-slate-800/30">
                        <td class="py-2 px-3 text-sky-300 font-bold">{{ tagKey }}</td>
                        <td class="py-2 px-3 text-white font-extrabold text-sm">{{ val }}</td>
                        <td class="py-2 px-3 text-slate-400 text-[11px]">{{ typeof val }}</td>
                        <td class="py-2 px-3 text-right">
                          <span class="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">LIVE</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>

          <!-- FEATURE: DOWNLINK ACTUATOR (D-MODULE) -->`;
exports.HMI_SCADA_MODALS = `    <!-- MODAL: ADD SENSOR / SERIES TO TREND CHART (Y-AXIS) -->
    <div v-if="trendSeriesModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(6px);">
      <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 class="text-sm font-bold text-white uppercase flex items-center gap-2">
            <i class="fa-solid fa-chart-line text-sky-400"></i>
            <span>Add Sensor to Trend Chart (Y-Axis)</span>
          </h3>
          <button @click="trendSeriesModal = false" class="text-slate-400 hover:text-white cursor-pointer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <!-- Step 1: Select Device -->
          <div>
            <label class="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
              <span class="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px]">1</span>
              <span>Select Sensor Device (DevEUI)</span>
            </label>
            <select
              v-model="trendSeriesForm.devEUI"
              @change="fetchDetectedTrendFields(trendSeriesForm.devEUI)"
              class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-1 focus:ring-sky-500"
            >
              <option value="">-- Select Device --</option>
              <option v-for="d in devicesList" :key="d.devEUI" :value="d.devEUI">
                {{ d.name ? d.name + ' (' + d.devEUI + ')' : d.devEUI }}
              </option>
            </select>
          </div>

          <!-- Step 2: Select decoded tag/field -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-slate-300 font-bold flex items-center gap-1.5">
                <span class="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px]">2</span>
                <span>Select Tag / Sensor Parameter</span>
              </label>
              <button
                v-if="trendSeriesForm.devEUI"
                type="button"
                @click="fetchDetectedTrendFields(trendSeriesForm.devEUI)"
                class="text-slate-400 hover:text-sky-400 text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <i class="fa-solid fa-arrows-rotate" :class="{ 'animate-spin': loadingTrendFields }"></i>
                <span>Rescan Tags</span>
              </button>
            </div>

            <!-- Loading tags -->
            <div v-if="loadingTrendFields" class="p-3 rounded-lg bg-slate-950 border border-slate-800 text-center text-slate-400">
              <i class="fa-solid fa-spinner animate-spin text-sky-400 mr-2"></i>
              <span>Scanning telemetry payload from sensor...</span>
            </div>

            <!-- Tag pills -->
            <div v-else-if="detectedTrendFields.length > 0" class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div class="text-[10px] text-slate-400">Select a parameter below:</div>
              <div class="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto custom-scroll pr-1">
                <button
                  v-for="f in detectedTrendFields"
                  :key="f.key"
                  type="button"
                  @click="selectTrendTagPill(f)"
                  class="px-2.5 py-1 rounded-lg text-xs font-mono transition flex items-center gap-1.5 cursor-pointer border"
                  :class="trendSeriesForm.field === f.key ? 'bg-sky-500/30 border-sky-400 text-white font-bold shadow-md' : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-300'"
                >
                  <span :class="f.source === 'decoded_payload' ? 'text-emerald-400 font-semibold' : 'text-slate-300'">{{ f.key }}</span>
                  <span class="text-[10px] text-slate-400">({{ f.latestValue }}{{ f.unit || '' }})</span>
                </button>
              </div>
            </div>

            <div v-else-if="trendSeriesForm.devEUI" class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 italic">
              Device has no uplink packets in database yet. You can manually enter the tag field below.
            </div>

            <!-- Field Name & Unit inputs -->
            <div class="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label class="text-[10px] text-slate-400">Tag Code (Field)</label>
                <input
                  type="text"
                  v-model="trendSeriesForm.field"
                  placeholder="e.g. HUMIDITY, TEMPERATURE..."
                  class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label class="text-[10px] text-slate-400">Unit of Measure</label>
                <input
                  type="text"
                  v-model="trendSeriesForm.unit"
                  placeholder="e.g. °C, %RH, bar..."
                  class="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                />
              </div>
            </div>
          </div>

          <!-- Step 3: Display Label and Line Color -->
          <div class="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label class="block text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                <span class="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px]">3</span>
                <span>Display Label</span>
              </label>
              <input
                type="text"
                v-model="trendSeriesForm.label"
                placeholder="e.g. Sensor 01 - Temperature"
                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
              />
            </div>
            <div>
              <label class="block text-slate-300 font-bold mb-1">Series Line Color</label>
              <div class="flex items-center gap-2">
                <input
                  type="color"
                  v-model="trendSeriesForm.color"
                  class="w-8 h-8 rounded bg-transparent border border-slate-700 cursor-pointer"
                />
                <!-- Preset color buttons -->
                <div class="flex items-center gap-1">
                  <button
                    v-for="c in ['#38bdf8', '#10b981', '#f59e0b', '#f43f5e', '#a855f7', '#06b6d4', '#eab308']"
                    :key="c"
                    type="button"
                    @click="trendSeriesForm.color = c"
                    class="w-5 h-5 rounded-full border border-slate-700 cursor-pointer transition hover:scale-110"
                    :style="{ backgroundColor: c }"
                  ></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button @click="trendSeriesModal = false" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer">
            Cancel
          </button>
          <button @click="saveTrendSeries" class="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer shadow-md flex items-center gap-1.5">
            <i class="fa-solid fa-check"></i>
            <span>Add to Chart</span>
          </button>
        </div>
      </div>
    </div>
`;
exports.HMI_SCADA_SCRIPT = `
function useHmiModule(ctx) {
  const { showToast, authHeaders, activeFeature, devicesList, networkServersList, currentUser, telemetryList, fetchDevices, fetchNetworkServers, initRealtimeConnection } = ctx || {};
  const { ref, computed, watch, nextTick, onMounted, onUnmounted } = Vue;

        // ==========================================
        // D-MODULE: HMI SCADA VIEWER STATE & METHODS
        // ==========================================
        const publishedHmiScreens = ref([]);
        const selectedHmiScreenId = ref('');
        const currentHmiScreen = ref(null);
        const hmiLoading = ref(false);
        const hmiViewerMode = ref('canvas'); // 'canvas' | 'alarms' | 'matrix'
        const hmiZoom = ref(1.0);
        const hmiCanvasViewportRef = ref(null);
        const hmiTelemetryMap = ref({}); // { 'devEUI.field': val, 'field': val }
        const hmiTrendHistory = ref([]); // array of { time, timeStr, [tag]: val }
        const trendPointsMap = ref({});
        const trendHoverState = ref({});
        const trendSeriesModal = ref(false);
        const trendTargetWidget = ref(null);
        const trendSeriesForm = ref({ devEUI: '', field: '', label: '', color: '#38bdf8', unit: '' });
        const detectedTrendFields = ref([]);
        const loadingTrendFields = ref(false);
        const hmiWidgetSwitchStates = ref({});
        const hmiRxPacketCount = ref(0);
        const hmiLastRxTime = ref(null);
        const realtimeConnected = ref(false);
        let socketClient = null;
        let sseSource = null;

        // Extract flattened key-value pairs from telemetry packet (supporting ChirpStack object, decodedData, and RF metrics)
        const extractFlattenedTelemetry = (rec) => {
          if (!rec) return { dev: '', flat: {} };
          const dev = (rec.devEUI || rec.devEui || '').trim().toUpperCase();
          const flat = {};

          // Standard RF & Network metrics
          if (rec.rssi !== undefined && rec.rssi !== null) flat['rssi'] = rec.rssi;
          if (rec.snr !== undefined && rec.snr !== null) flat['snr'] = rec.snr;
          if (rec.fCnt !== undefined && rec.fCnt !== null) flat['fCnt'] = rec.fCnt;
          if (rec.fPort !== undefined && rec.fPort !== null) flat['fPort'] = rec.fPort;
          if (rec.dr !== undefined && rec.dr !== null) flat['dr'] = rec.dr;
          if (rec.frequency !== undefined && rec.frequency !== null) flat['frequency'] = rec.frequency;
          if (rec.battery !== undefined && rec.battery !== null) flat['battery'] = rec.battery;

          // Recursively flatten decoded objects
          const flattenObject = (obj, prefix = '') => {
            if (!obj || typeof obj !== 'object') return;
            for (const [k, v] of Object.entries(obj)) {
              if (k === 'error' || k === 'errors' || k === 'warnings') continue;
              const fullKey = prefix ? prefix + '.' + k : k;
              if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
                flattenObject(v, fullKey);
              } else if (v !== null && v !== undefined) {
                flat[fullKey] = v;
                // Also assign unqualified leaf name if not occupied
                if (prefix && flat[k] === undefined) {
                  flat[k] = v;
                }
                if (fullKey.startsWith('data.')) {
                  const leaf = fullKey.substring(5);
                  if (flat[leaf] === undefined) {
                    flat[leaf] = v;
                  }
                }
              }
            }
          };

          if (rec.object && typeof rec.object === 'object') {
            flattenObject(rec.object);
          }
          if (rec.decodedData && typeof rec.decodedData === 'object') {
            flattenObject(rec.decodedData);
          }

          return { dev, flat };
        };

        const updateHmiTelemetryMap = (records) => {
          if (!Array.isArray(records)) return;
          const newMap = { ...hmiTelemetryMap.value };
          
          records.forEach(rec => {
            const { dev, flat } = extractFlattenedTelemetry(rec);
            for (const [k, v] of Object.entries(flat)) {
              if (dev) {
                newMap[dev + '.' + k] = v;
              }
              newMap[k] = v;
            }
          });
          
          hmiTelemetryMap.value = newMap;

          // Build/Update Time-series Trend History Points
          if (records.length > 0) {
            const sortedAsc = [...records].reverse();
            sortedAsc.forEach(rec => {
              const { dev, flat } = extractFlattenedTelemetry(rec);
              const t = rec.timestamp ? new Date(rec.timestamp) : new Date();
              const pt = {
                timestamp: t,
                timeStr: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                ...flat
              };
              if (dev) {
                for (const [k, v] of Object.entries(flat)) {
                  pt[dev + '.' + k] = v;
                }
              }
              hmiTrendHistory.value.push(pt);
              if (hmiTrendHistory.value.length > 100) {
                hmiTrendHistory.value.shift();
              }

              // Update trendPointsMap for active trend widgets on canvas
              if (currentHmiScreen.value?.widgets) {
                currentHmiScreen.value.widgets.forEach(w => {
                  if (w.type === 'realtime-trend') {
                    if (!trendPointsMap.value[w.id]) trendPointsMap.value[w.id] = [];
                    trendPointsMap.value[w.id].push(pt);
                    if (trendPointsMap.value[w.id].length > 1000) {
                      trendPointsMap.value[w.id].shift();
                    }
                  }
                });
              }
            });
          }
        };

        const fetchPublishedHmiScreens = async () => {
          hmiLoading.value = true;
          try {
            const res = await fetch('/api/hmi/screens/published', {
              headers: authHeaders(),
              credentials: 'include',
            });
            if (res.ok) {
              const screens = await res.json();
              publishedHmiScreens.value = screens || [];
              if (publishedHmiScreens.value.length > 0) {
                if (!selectedHmiScreenId.value || !publishedHmiScreens.value.some(s => s.id === selectedHmiScreenId.value)) {
                  selectedHmiScreenId.value = publishedHmiScreens.value[0].id;
                }
                loadSelectedHmiScreen();
              } else {
                currentHmiScreen.value = null;
              }
            }
          } catch(err) {
            console.error('Failed to fetch published screens:', err);
          } finally {
            hmiLoading.value = false;
          }
        };

        const loadSelectedHmiScreen = () => {
          const found = publishedHmiScreens.value.find(s => s.id === selectedHmiScreenId.value);
          if (found) {
            currentHmiScreen.value = JSON.parse(JSON.stringify(found));
            currentHmiScreen.value.widgets?.forEach(w => {
              if (w.type === 'realtime-trend') {
                fetchTrendHistoryForWidget(w);
              }
            });
          }
        };

        const fetchHmiTelemetry = async (silent = true) => {
          if (!silent) hmiLoading.value = true;
          try {
            const res = await fetch('/lorawan/telemetry?limit=40', {
              headers: authHeaders(),
              credentials: 'include',
            });
            if (res.ok) {
              const records = await res.json();
              if (Array.isArray(records)) {
                hmiRxPacketCount.value = records.length;
                if (records.length > 0) {
                  hmiLastRxTime.value = new Date(records[0].timestamp || Date.now());
                }
                updateHmiTelemetryMap(records);
              }
            }
          } catch(e) {
            console.error('HMI Telemetry fetch error:', e);
          } finally {
            if (!silent) hmiLoading.value = false;
          }
        };

        const refreshHmiViewer = async () => {
          await Promise.all([fetchPublishedHmiScreens(), fetchHmiTelemetry(false)]);
          showToast('HMI Screen & Telemetry updated', 'success');
        };

        const fitHmiZoom = () => {
          if (!hmiCanvasViewportRef.value || !currentHmiScreen.value) {
            hmiZoom.value = 1.0;
            return;
          }
          const containerW = hmiCanvasViewportRef.value.clientWidth - 20;
          const canvasW = currentHmiScreen.value.canvasConfig?.width || 1280;
          if (containerW > 0 && canvasW > 0) {
            const scale = Math.min(1.2, Math.max(0.4, Number((containerW / canvasW).toFixed(2))));
            hmiZoom.value = scale;
          }
        };

        // Telemetry Value Resolver for Widgets
        const getWidgetTelemetryValue = (widget) => {
          if (!widget) return '--';
          const binding = widget.bindings?.value || widget.bindings?.level || widget.bindings?.status;
          let raw = undefined;

          if (binding?.devEUI && binding?.field) {
            const dev = binding.devEUI.trim().toUpperCase();
            const f = binding.field.trim();
            const key = dev + '.' + f;
            raw = hmiTelemetryMap.value[key];
            if (raw === undefined) {
              raw = hmiTelemetryMap.value[f];
            }
            if (raw === undefined && !f.startsWith('data.')) {
              raw = hmiTelemetryMap.value[dev + '.data.' + f] ?? hmiTelemetryMap.value['data.' + f];
            }
            if (raw === undefined && f.startsWith('data.')) {
              const stripped = f.substring(5);
              raw = hmiTelemetryMap.value[dev + '.' + stripped] ?? hmiTelemetryMap.value[stripped];
            }
            if (raw === undefined) {
              for (const k of Object.keys(hmiTelemetryMap.value)) {
                if (k.endsWith('.' + f) || (dev && k.startsWith(dev) && k.endsWith(f))) {
                  raw = hmiTelemetryMap.value[k];
                  break;
                }
              }
            }
          } else if (binding?.field) {
            const f = binding.field.trim();
            raw = hmiTelemetryMap.value[f];
            if (raw === undefined) {
              for (const k of Object.keys(hmiTelemetryMap.value)) {
                if (k.endsWith('.' + f)) {
                  raw = hmiTelemetryMap.value[k];
                  break;
                }
              }
            }
          }

          // Fallback defaults if no live telemetry recorded yet
          if (raw === undefined || raw === null) {
            if (widget.props?.defaultValue !== undefined) raw = widget.props.defaultValue;
            else if (widget.type === 'linear-tank') raw = 64.5;
            else if (widget.type === 'silo-vessel') raw = 82.0;
            else if (widget.type === 'dial-gauge') raw = 8.6;
            else if (widget.type === 'led-numeric') raw = 142.8;
            else if (widget.type === 'mono-box') raw = 28.4;
            else if (widget.type === 'bit-lamp') raw = 1;
            else if (widget.type === 'multi-state-lamp') raw = 1;
            else raw = 0;
          }

          let val = Number(raw);
          if (isNaN(val)) return String(raw);

          // Apply mathematical formula if defined
          if (binding?.formula && binding.formula.trim()) {
            try {
              const fn = new Function('val', 'return (' + binding.formula + ')');
              val = fn(val);
            } catch(e) {}
          }

          const dec = binding?.decimalPlaces !== undefined ? Number(binding.decimalPlaces) : 1;
          return Number(val).toFixed(dec);
        };

        const getWidgetTankHeightPercent = (widget) => {
          const val = Number(getWidgetTelemetryValue(widget)) || 0;
          const min = widget.props?.min !== undefined ? Number(widget.props.min) : 0;
          const max = widget.props?.max !== undefined ? Number(widget.props.max) : 100;
          if (max <= min) return 0;
          const pct = ((val - min) / (max - min)) * 100;
          return Math.min(100, Math.max(0, Math.round(pct)));
        };

        const getWidgetLiquidColor = (widget) => {
          const val = Number(getWidgetTelemetryValue(widget)) || 0;
          if (widget.states && widget.states.length > 0) {
            for (const st of widget.states) {
              if (st.condition && st.color) {
                try {
                  const fn = new Function('val', 'return (' + st.condition + ')');
                  if (fn(val)) return st.color;
                } catch(e) {}
              }
            }
          }
          return widget.props?.liquidColor || '#0284c7';
        };

        const getWidgetGaugeAngle = (widget) => {
          const val = Number(getWidgetTelemetryValue(widget)) || 0;
          const min = widget.props?.min !== undefined ? Number(widget.props.min) : 0;
          const max = widget.props?.max !== undefined ? Number(widget.props.max) : 100;
          if (max <= min) return -135;
          const ratio = Math.min(1, Math.max(0, (val - min) / (max - min)));
          return Math.round(-135 + ratio * 270);
        };

        const isWidgetBitOn = (widget) => {
          const v = getWidgetTelemetryValue(widget);
          return v === '1' || v === 1 || String(v).toLowerCase() === 'true' || Number(v) > 0;
        };

        const getWidgetBitLampStyle = (widget) => {
          const on = isWidgetBitOn(widget);
          const colOn = widget.props?.colorOn || '#10b981';
          const colOff = widget.props?.colorOff || '#475569';
          return {
            backgroundColor: on ? colOn : colOff,
            borderColor: on ? '#ffffff' : '#334155',
            boxShadow: on ? '0 0 14px ' + colOn : 'none'
          };
        };

        const getWidgetMultiStateLabel = (widget) => {
          const v = Math.round(Number(getWidgetTelemetryValue(widget)) || 0);
          if (v === 0) return widget.props?.state0 || 'STOPPED';
          if (v === 1) return widget.props?.state1 || 'RUNNING';
          if (v === 2) return widget.props?.state2 || 'WARNING';
          return widget.props?.state3 || 'FAULT';
        };

        const getWidgetMultiStateColor = (widget) => {
          const v = Math.round(Number(getWidgetTelemetryValue(widget)) || 0);
          if (v === 0) return '#94a3b8';
          if (v === 1) return '#10b981';
          if (v === 2) return '#f59e0b';
          return '#ef4444';
        };

        const getWidgetMultiStateStyle = (widget) => {
          const c = getWidgetMultiStateColor(widget);
          return {
            backgroundColor: c + '22',
            borderColor: c,
            color: c,
            boxShadow: '0 0 10px ' + c + '44'
          };
        };

        const getWidgetMultiStateIcon = (widget) => {
          const v = Math.round(Number(getWidgetTelemetryValue(widget)) || 0);
          if (v === 0) return 'fa-solid fa-stop';
          if (v === 1) return 'fa-solid fa-play';
          if (v === 2) return 'fa-solid fa-triangle-exclamation';
          return 'fa-solid fa-radiation';
        };

        const isWidgetAlarmActive = (widget) => {
          const val = Number(getWidgetTelemetryValue(widget)) || 0;
          if (widget.states && widget.states.length > 0) {
            for (const st of widget.states) {
              if (st.alarmText && st.condition) {
                try {
                  const fn = new Function('val', 'return (' + st.condition + ')');
                  if (fn(val)) return true;
                } catch(e) {}
              }
            }
          }
          return false;
        };

        // Active Alarms Computed across current HMI Screen
        const activeAlarmsList = computed(() => {
          if (!currentHmiScreen.value || !currentHmiScreen.value.widgets) return [];
          const alarms = [];
          for (const w of currentHmiScreen.value.widgets) {
            const val = Number(getWidgetTelemetryValue(w)) || 0;
            if (w.states && w.states.length > 0) {
              for (const st of w.states) {
                if (st.alarmText && st.condition) {
                  try {
                    const fn = new Function('val', 'return (' + st.condition + ')');
                    if (fn(val)) {
                      alarms.push({
                        widgetId: w.id,
                        title: w.props?.title || w.id,
                        text: st.alarmText,
                        condition: st.condition,
                        value: val,
                        color: st.color || '#ef4444',
                      });
                    }
                  } catch(e) {}
                }
              }
            }
          }
          return alarms;
        });

        // Downlink Actuator triggers
        const isWidgetSwitchOn = (widget) => {
          if (hmiWidgetSwitchStates.value[widget.id] !== undefined) {
            return hmiWidgetSwitchStates.value[widget.id];
          }
          return isWidgetBitOn(widget);
        };

        const triggerWidgetToggleSwitch = async (widget) => {
          const current = isWidgetSwitchOn(widget);
          const next = !current;
          const action = widget.action;

          if (action?.confirmMessage) {
            if (!confirm(action.confirmMessage)) return;
          }

          widget._sendingDownlink = true;
          hmiWidgetSwitchStates.value[widget.id] = next;

          try {
            const res = await fetch('/api/hmi/screens/downlink', {
              method: 'POST',
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                devEUI: action?.devEUI || widget.bindings?.value?.devEUI || widget.bindings?.status?.devEUI || '',
                fPort: action?.fPort || 1,
                payloadHex: next ? (action?.payloadHex || '0101') : '0100',
                actionType: 'toggle',
                confirmed: false
              })
            });

            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
              showToast('Downlink sent: ' + (data.message || 'Actuator toggled'), 'success');
            } else {
              showToast('Downlink: ' + (data.message || 'Network Server dispatch status updated'), 'info');
            }
          } catch(err) {
            showToast('Failed to dispatch downlink command: ' + err.message, 'error');
          } finally {
            widget._sendingDownlink = false;
          }
        };

        const triggerWidgetActionButton = async (widget) => {
          const action = widget.action;
          if (action?.confirmMessage) {
            if (!confirm(action.confirmMessage)) return;
          }

          widget._sendingDownlink = true;
          try {
            const res = await fetch('/api/hmi/screens/downlink', {
              method: 'POST',
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                devEUI: action?.devEUI || '',
                fPort: action?.fPort || 1,
                payloadHex: action?.payloadHex || '01',
                actionType: 'pushbutton',
                confirmed: false
              })
            });

            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
              showToast('Command sent: ' + (data.message || (widget.props?.label || 'Action dispatched')), 'success');
            } else {
              showToast('Downlink: ' + (data.message || 'Action executed'), 'info');
            }
          } catch(err) {
            showToast('Failed to dispatch action button command: ' + err.message, 'error');
          } finally {
            widget._sendingDownlink = false;
          }
        };

        // Realtime Trend Chart Helpers (Metabase style with multi-sensor series & timestamp X-axis)
        const getTrendSeries = (widget) => {
          if (!widget) return [];
          if (Array.isArray(widget.props?.series) && widget.props.series.length > 0) {
            return widget.props.series;
          }
          const bindDev = widget.bindings?.value?.devEUI;
          const bindField = widget.bindings?.value?.field;
          if (bindDev && bindField) {
            return [{
              id: 'ser_bind',
              devEUI: bindDev,
              field: bindField,
              label: bindField,
              color: '#38bdf8',
              unit: '',
              visible: true
            }];
          }
          if (Array.isArray(widget.props?.tags) && widget.props.tags.length > 0) {
            const colors = ['#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#a855f7'];
            return widget.props.tags.map((t, i) => ({
              id: 'ser_tag_' + i,
              devEUI: '',
              field: t,
              label: t,
              color: colors[i % colors.length],
              unit: '',
              visible: true
            }));
          }
          return [];
        };

        const getTrendYBounds = (widget) => {
          const points = trendPointsMap.value[widget.id] || hmiTrendHistory.value || [];
          const series = getTrendSeries(widget).filter(s => s.visible !== false);
          const plotY0 = 16;
          const ph = 176;

          let allVals = [];
          if (points.length > 0 && series.length > 0) {
            for (const pt of points) {
              for (const s of series) {
                let v = pt[s.devEUI ? s.devEUI + '.' + s.field : s.field];
                if (v === undefined) v = pt[s.field];
                if (v === undefined) {
                  for (const k of Object.keys(pt)) {
                    if (k.endsWith('.' + s.field)) { v = pt[k]; break; }
                  }
                }
                if (v !== undefined && v !== null && !isNaN(Number(v))) {
                  allVals.push(Number(v));
                }
              }
            }
          }

          let minVal = 0;
          let maxVal = 100;
          if (allVals.length > 0) {
            minVal = Math.min(...allVals);
            maxVal = Math.max(...allVals);
            if (minVal === maxVal) {
              minVal = Math.max(0, minVal - 10);
              maxVal = maxVal + 10;
            } else {
              const pad = (maxVal - minVal) * 0.1;
              minVal = Math.floor(minVal - pad);
              maxVal = Math.ceil(maxVal + pad);
            }
          }

          const valRange = Math.max(1, maxVal - minVal);
          const ticks = [];
          const steps = 4;
          for (let i = 0; i <= steps; i++) {
            const ratio = i / steps;
            const y = plotY0 + ph - ratio * ph;
            const v = minVal + ratio * valRange;
            ticks.push({
              y,
              val: v,
              label: v.toFixed(v % 1 === 0 ? 0 : 1)
            });
          }

          return { minVal, maxVal, valRange, ticks, plotY0, ph };
        };

        const getTrendXTicks = (widget) => {
          const points = trendPointsMap.value[widget.id] || hmiTrendHistory.value || [];
          const range = widget.props?.timeRange || '1h';
          const now = Date.now();
          let durationMs = 60 * 60 * 1000;
          if (range === '15m') durationMs = 15 * 60 * 1000;
          else if (range === '6h') durationMs = 6 * 3600 * 1000;
          else if (range === '24h') durationMs = 24 * 3600 * 1000;
          else if (range === '7d') durationMs = 7 * 86400 * 1000;
          else if (range === '30d') durationMs = 30 * 86400 * 1000;

          let minT = now - durationMs;
          let maxT = now;
          if (points.length > 1) {
            const firstT = new Date(points[0].timestamp).getTime();
            const lastT = new Date(points[points.length - 1].timestamp).getTime();
            if (!isNaN(firstT) && !isNaN(lastT)) {
              minT = Math.min(minT, firstT);
              maxT = Math.max(maxT, lastT);
            }
          }

          const timeRange = Math.max(1000, maxT - minT);
          const plotX0 = 45;
          const pw = 440;
          const ticks = [];
          const steps = 4;

          for (let i = 0; i <= steps; i++) {
            const ratio = i / steps;
            const x = Math.round(plotX0 + ratio * pw);
            const tickT = new Date(minT + ratio * timeRange);
            let label = '';
            if (timeRange > 24 * 3600 * 1000) {
              label = tickT.toLocaleDateString([], { month: 'numeric', day: 'numeric' }) + ' ' +
                      tickT.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else {
              label = tickT.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            ticks.push({ x, label });
          }

          return ticks;
        };

        const getTrendSeriesPath = (widget, series) => {
          const points = trendPointsMap.value[widget.id] || hmiTrendHistory.value || [];
          if (!points || points.length === 0) return '';

          const { minVal, valRange, plotY0, ph } = getTrendYBounds(widget);
          const plotX0 = 45;
          const pw = 440;

          const range = widget.props?.timeRange || '1h';
          const now = Date.now();
          let durationMs = 60 * 60 * 1000;
          if (range === '15m') durationMs = 15 * 60 * 1000;
          else if (range === '6h') durationMs = 6 * 3600 * 1000;
          else if (range === '24h') durationMs = 24 * 3600 * 1000;
          else if (range === '7d') durationMs = 7 * 86400 * 1000;
          else if (range === '30d') durationMs = 30 * 86400 * 1000;

          let minT = now - durationMs;
          let maxT = now;
          const firstT = new Date(points[0].timestamp).getTime();
          const lastT = new Date(points[points.length - 1].timestamp).getTime();
          if (!isNaN(firstT) && !isNaN(lastT)) {
            minT = Math.min(minT, firstT);
            maxT = Math.max(maxT, lastT);
          }
          const timeRange = Math.max(1000, maxT - minT);

          const seriesKey = series.devEUI ? series.devEUI + '.' + series.field : series.field;
          const validPoints = [];

          for (const pt of points) {
            let v = pt[seriesKey];
            if (v === undefined) v = pt[series.field];
            if (v === undefined) {
              for (const k of Object.keys(pt)) {
                if (k.endsWith('.' + series.field)) { v = pt[k]; break; }
              }
            }
            if (v !== undefined && v !== null && !isNaN(Number(v))) {
              const t = new Date(pt.timestamp).getTime();
              const x = plotX0 + Math.max(0, Math.min(1, (t - minT) / timeRange)) * pw;
              const ratio = (Number(v) - minVal) / valRange;
              const y = plotY0 + ph - Math.max(0, Math.min(1, ratio)) * ph;
              validPoints.push({ x, y, val: Number(v), t });
            }
          }

          if (validPoints.length === 0) return '';
          if (validPoints.length === 1) {
            return 'M ' + (validPoints[0].x - 5).toFixed(1) + ' ' + validPoints[0].y.toFixed(1) + ' L ' + (validPoints[0].x + 5).toFixed(1) + ' ' + validPoints[0].y.toFixed(1);
          }

          let d = 'M ' + validPoints[0].x.toFixed(1) + ' ' + validPoints[0].y.toFixed(1);
          for (let i = 1; i < validPoints.length; i++) {
            d += ' L ' + validPoints[i].x.toFixed(1) + ' ' + validPoints[i].y.toFixed(1);
          }
          return d;
        };

        const getTrendSeriesAreaPath = (widget, series) => {
          const lineD = getTrendSeriesPath(widget, series);
          if (!lineD || !lineD.startsWith('M')) return '';
          const { plotY0, ph } = getTrendYBounds(widget);
          const bottomY = (plotY0 + ph).toFixed(1);

          const points = trendPointsMap.value[widget.id] || hmiTrendHistory.value || [];
          if (!points || points.length === 0) return '';

          const plotX0 = 45;
          const pw = 440;
          const range = widget.props?.timeRange || '1h';
          const now = Date.now();
          let durationMs = 60 * 60 * 1000;
          if (range === '15m') durationMs = 15 * 60 * 1000;
          else if (range === '6h') durationMs = 6 * 3600 * 1000;
          else if (range === '24h') durationMs = 24 * 3600 * 1000;
          else if (range === '7d') durationMs = 7 * 86400 * 1000;
          else if (range === '30d') durationMs = 30 * 86400 * 1000;

          let minT = now - durationMs;
          let maxT = now;
          const firstT = new Date(points[0].timestamp).getTime();
          const lastT = new Date(points[points.length - 1].timestamp).getTime();
          if (!isNaN(firstT) && !isNaN(lastT)) {
            minT = Math.min(minT, firstT);
            maxT = Math.max(maxT, lastT);
          }
          const timeRange = Math.max(1000, maxT - minT);

          const seriesKey = series.devEUI ? series.devEUI + '.' + series.field : series.field;
          const validX = [];
          for (const pt of points) {
            let v = pt[seriesKey];
            if (v === undefined) v = pt[series.field];
            if (v === undefined) {
              for (const k of Object.keys(pt)) {
                if (k.endsWith('.' + series.field)) { v = pt[k]; break; }
              }
            }
            if (v !== undefined && v !== null && !isNaN(Number(v))) {
              const t = new Date(pt.timestamp).getTime();
              const x = plotX0 + Math.max(0, Math.min(1, (t - minT) / timeRange)) * pw;
              validX.push(x);
            }
          }
          if (validX.length === 0) return '';
          const firstX = validX[0].toFixed(1);
          const lastX = validX[validX.length - 1].toFixed(1);

          return lineD + ' L ' + lastX + ' ' + bottomY + ' L ' + firstX + ' ' + bottomY + ' Z';
        };

        const getTrendLatestPoint = (widget, series) => {
          const points = trendPointsMap.value[widget.id] || hmiTrendHistory.value || [];
          if (!points || points.length === 0) return null;

          const { minVal, valRange, plotY0, ph } = getTrendYBounds(widget);
          const plotX0 = 45;
          const pw = 440;

          const range = widget.props?.timeRange || '1h';
          const now = Date.now();
          let durationMs = 60 * 60 * 1000;
          if (range === '15m') durationMs = 15 * 60 * 1000;
          else if (range === '6h') durationMs = 6 * 3600 * 1000;
          else if (range === '24h') durationMs = 24 * 3600 * 1000;
          else if (range === '7d') durationMs = 7 * 86400 * 1000;
          else if (range === '30d') durationMs = 30 * 86400 * 1000;

          let minT = now - durationMs;
          let maxT = now;
          const firstT = new Date(points[0].timestamp).getTime();
          const lastT = new Date(points[points.length - 1].timestamp).getTime();
          if (!isNaN(firstT) && !isNaN(lastT)) {
            minT = Math.min(minT, firstT);
            maxT = Math.max(maxT, lastT);
          }
          const timeRange = Math.max(1000, maxT - minT);

          const seriesKey = series.devEUI ? series.devEUI + '.' + series.field : series.field;
          for (let i = points.length - 1; i >= 0; i--) {
            const pt = points[i];
            let v = pt[seriesKey];
            if (v === undefined) v = pt[series.field];
            if (v === undefined) {
              for (const k of Object.keys(pt)) {
                if (k.endsWith('.' + series.field)) { v = pt[k]; break; }
              }
            }
            if (v !== undefined && v !== null && !isNaN(Number(v))) {
              const t = new Date(pt.timestamp).getTime();
              const x = plotX0 + Math.max(0, Math.min(1, (t - minT) / timeRange)) * pw;
              const ratio = (Number(v) - minVal) / valRange;
              const y = plotY0 + ph - Math.max(0, Math.min(1, ratio)) * ph;
              return { x, y, value: Number(v) };
            }
          }
          return null;
        };

        const getTrendSeriesLatestVal = (widget, series) => {
          const k1 = series.devEUI ? series.devEUI + '.' + series.field : series.field;
          if (hmiTelemetryMap.value[k1] !== undefined) {
            const v = hmiTelemetryMap.value[k1];
            return typeof v === 'number' ? (v % 1 === 0 ? v : v.toFixed(2)) : v;
          }
          if (hmiTelemetryMap.value[series.field] !== undefined) {
            const v = hmiTelemetryMap.value[series.field];
            return typeof v === 'number' ? (v % 1 === 0 ? v : v.toFixed(2)) : v;
          }
          const latestPt = getTrendLatestPoint(widget, series);
          if (latestPt && latestPt.value !== undefined) {
            return latestPt.value % 1 === 0 ? latestPt.value : latestPt.value.toFixed(2);
          }
          return '--';
        };

        const handleTrendMouseMove = (event, widget) => {
          const points = trendPointsMap.value[widget.id] || hmiTrendHistory.value || [];
          if (points.length === 0) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const pixelX = event.clientX - rect.left;
          const normX = Math.max(0, Math.min(1, pixelX / rect.width));
          const svgX = normX * 500;

          if (svgX < 45 || svgX > 485) {
            trendHoverState.value[widget.id] = { visible: false };
            return;
          }

          const plotX0 = 45;
          const pw = 440;
          const range = widget.props?.timeRange || '1h';
          const now = Date.now();
          let durationMs = 60 * 60 * 1000;
          if (range === '15m') durationMs = 15 * 60 * 1000;
          else if (range === '6h') durationMs = 6 * 3600 * 1000;
          else if (range === '24h') durationMs = 24 * 3600 * 1000;
          else if (range === '7d') durationMs = 7 * 86400 * 1000;
          else if (range === '30d') durationMs = 30 * 86400 * 1000;

          let minT = now - durationMs;
          let maxT = now;
          const firstT = new Date(points[0].timestamp).getTime();
          const lastT = new Date(points[points.length - 1].timestamp).getTime();
          if (!isNaN(firstT) && !isNaN(lastT)) {
            minT = Math.min(minT, firstT);
            maxT = Math.max(maxT, lastT);
          }
          const timeRange = Math.max(1000, maxT - minT);

          const hoverT = minT + ((svgX - plotX0) / pw) * timeRange;

          let closestPt = points[0];
          let minDiff = Infinity;
          for (const pt of points) {
            const diff = Math.abs(new Date(pt.timestamp).getTime() - hoverT);
            if (diff < minDiff) {
              minDiff = diff;
              closestPt = pt;
            }
          }

          if (!closestPt) return;

          const series = getTrendSeries(widget).filter(s => s.visible !== false);
          const values = series.map(s => {
            let v = closestPt[s.devEUI ? s.devEUI + '.' + s.field : s.field];
            if (v === undefined) v = closestPt[s.field];
            if (v === undefined) {
              for (const k of Object.keys(closestPt)) {
                if (k.endsWith('.' + s.field)) { v = closestPt[k]; break; }
              }
            }
            return {
              label: s.label || s.field,
              color: s.color || '#38bdf8',
              value: v !== undefined ? (typeof v === 'number' ? (v % 1 === 0 ? v : v.toFixed(2)) : v) : '--',
              unit: s.unit || ''
            };
          });

          const ptT = new Date(closestPt.timestamp);
          const timeStr = ptT.toLocaleDateString([], { month: '2-digit', day: '2-digit' }) + ' ' +
                          ptT.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          trendHoverState.value[widget.id] = {
            visible: true,
            x: svgX,
            pixelX,
            timeStr,
            values
          };
        };

        const handleTrendMouseLeave = (widget) => {
          trendHoverState.value[widget.id] = { visible: false };
        };

        const setTrendTimeRange = (widget, range) => {
          if (!widget) return;
          if (!widget.props) widget.props = {};
          widget.props.timeRange = range;
          fetchTrendHistoryForWidget(widget);
        };

        const fetchTrendHistoryForWidget = async (widget) => {
          if (!widget || widget.type !== 'realtime-trend') return;
          const series = getTrendSeries(widget);
          const devEUIs = [...new Set(series.map(s => s.devEUI).filter(Boolean))];

          const range = widget.props?.timeRange || '1h';
          const now = Date.now();
          let durationMs = 60 * 60 * 1000;
          if (range === '15m') durationMs = 15 * 60 * 1000;
          else if (range === '6h') durationMs = 6 * 3600 * 1000;
          else if (range === '24h') durationMs = 24 * 3600 * 1000;
          else if (range === '7d') durationMs = 7 * 86400 * 1000;
          else if (range === '30d') durationMs = 30 * 86400 * 1000;

          const fromIso = new Date(now - durationMs).toISOString();

          let url = '/api/hmi/screens/telemetry/trend?from=' + encodeURIComponent(fromIso) + '&limit=500';
          if (devEUIs.length > 0) {
            url += '&devEUIs=' + encodeURIComponent(devEUIs.join(','));
          }

          try {
            const res = await fetch(url, { headers: authHeaders(), credentials: 'include' });
            if (res.ok) {
              const records = await res.json();
              if (Array.isArray(records)) {
                const points = records.map(rec => {
                  const { dev, flat } = extractFlattenedTelemetry(rec);
                  const t = rec.timestamp ? new Date(rec.timestamp) : new Date();
                  const pt = {
                    timestamp: t,
                    timeStr: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    devEUI: dev,
                    ...flat
                  };
                  if (dev) {
                    for (const [k, v] of Object.entries(flat)) {
                      pt[dev + '.' + k] = v;
                    }
                  }
                  return pt;
                });
                trendPointsMap.value[widget.id] = points;
              }
            }
          } catch(err) {
            console.error('Failed to fetch trend history for widget:', err);
          }
        };

        const openAddTrendSeriesModal = (widget) => {
          trendTargetWidget.value = widget;
          const firstDev = (devicesList.value && devicesList.value.length > 0) ? devicesList.value[0].devEUI : '';
          const palette = ['#38bdf8', '#10b981', '#f59e0b', '#f43f5e', '#a855f7', '#06b6d4', '#eab308'];
          const curSeriesCount = getTrendSeries(widget).length;
          const pickColor = palette[curSeriesCount % palette.length];

          trendSeriesForm.value = {
            devEUI: firstDev,
            field: '',
            label: '',
            color: pickColor,
            unit: '',
          };
          detectedTrendFields.value = [];
          if (firstDev) {
            fetchDetectedTrendFields(firstDev);
          }
          trendSeriesModal.value = true;
        };

        const fetchDetectedTrendFields = async (devEUI) => {
          if (!devEUI) return;
          loadingTrendFields.value = true;
          try {
            const res = await fetch('/api/hmi/screens/devices/' + encodeURIComponent(devEUI) + '/telemetry-fields', {
              headers: authHeaders(),
              credentials: 'include'
            });
            if (res.ok) {
              const data = await res.json();
              detectedTrendFields.value = data.fields || [];
            }
          } catch(err) {
            console.error('Failed to scan fields for trend:', err);
          } finally {
            loadingTrendFields.value = false;
          }
        };

        const selectTrendTagPill = (field) => {
          trendSeriesForm.value.field = field.key;
          if (!trendSeriesForm.value.label) {
            const devObj = devicesList.value.find(d => d.devEUI === trendSeriesForm.value.devEUI);
            const devName = devObj ? (devObj.name || devObj.devEUI.substring(devObj.devEUI.length - 4)) : '';
            trendSeriesForm.value.label = devName ? (devName + ' - ' + field.key) : field.key;
          }
          if (field.unit) {
            trendSeriesForm.value.unit = field.unit;
          }
        };

        const saveTrendSeries = () => {
          const widget = trendTargetWidget.value;
          if (!widget) return;
          if (!trendSeriesForm.value.field) {
            showToast('Please select or enter telemetry tag', 'warning');
            return;
          }
          if (!widget.props) widget.props = {};
          if (!Array.isArray(widget.props.series)) {
            widget.props.series = [];
          }
          const id = 'ser_' + Date.now().toString(36);
          const newSeries = {
            id,
            devEUI: trendSeriesForm.value.devEUI || '',
            field: trendSeriesForm.value.field.trim(),
            label: trendSeriesForm.value.label.trim() || trendSeriesForm.value.field.trim(),
            color: trendSeriesForm.value.color || '#38bdf8',
            unit: trendSeriesForm.value.unit || '',
            visible: true,
          };
          widget.props.series.push(newSeries);
          trendSeriesModal.value = false;
          fetchTrendHistoryForWidget(widget);
          showToast('Added sensor ' + newSeries.label + ' to chart', 'success');
        };

        const removeTrendSeries = (widget, seriesId) => {
          if (!widget || !Array.isArray(widget.props?.series)) return;
          widget.props.series = widget.props.series.filter(s => s.id !== seriesId);
          fetchTrendHistoryForWidget(widget);
        };

        const toggleTrendSeriesVisible = (widget, seriesId) => {
          const series = getTrendSeries(widget);
          const s = series.find(x => x.id === seriesId);
          if (s) {
            s.visible = s.visible === false ? true : false;
          }
        };

        const getWidgetTrendLegend = (widget) => {
          const tags = widget.props?.tags || ['water_level', 'pressure', 'flow_rate'];
          const colors = ['#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#a855f7'];
          return tags.map((t, idx) => {
            let val = hmiTelemetryMap.value[t];
            if (val === undefined) {
              for (const k of Object.keys(hmiTelemetryMap.value)) {
                if (k.endsWith('.' + t)) { val = hmiTelemetryMap.value[k]; break; }
              }
            }
            return {
              name: t,
              color: colors[idx % colors.length],
              value: val !== undefined ? val : '--'
            };
          });
        };

        const getWidgetTrendPath = (widget, tagIndex) => {
          return getTrendSeriesPath(widget, { field: (widget.props?.tags || [])[tagIndex] || 'val' });
        };


  return {
          publishedHmiScreens,
          selectedHmiScreenId,
          currentHmiScreen,
          hmiLoading,
          hmiViewerMode,
          hmiZoom,
          hmiCanvasViewportRef,
          hmiTelemetryMap,
          hmiTrendHistory,
          hmiWidgetSwitchStates,
          hmiRxPacketCount,
          hmiLastRxTime,
          realtimeConnected,
          fetchPublishedHmiScreens,
          loadSelectedHmiScreen,
          fetchHmiTelemetry,
          refreshHmiViewer,
          fitHmiZoom,
          getWidgetTelemetryValue,
          getWidgetTankHeightPercent,
          getWidgetLiquidColor,
          getWidgetGaugeAngle,
          isWidgetBitOn,
          getWidgetBitLampStyle,
          getWidgetMultiStateLabel,
          getWidgetMultiStateColor,
          getWidgetMultiStateStyle,
          getWidgetMultiStateIcon,
          isWidgetAlarmActive,
          activeAlarmsList,
          isWidgetSwitchOn,
          triggerWidgetToggleSwitch,
          triggerWidgetActionButton,
          trendPointsMap,
          trendHoverState,
          trendSeriesModal,
          trendTargetWidget,
          trendSeriesForm,
          detectedTrendFields,
          loadingTrendFields,
          getTrendSeries,
          getTrendYBounds,
          getTrendXTicks,
          getTrendSeriesPath,
          getTrendSeriesAreaPath,
          getTrendLatestPoint,
          getTrendSeriesLatestVal,
          handleTrendMouseMove,
          handleTrendMouseLeave,
          setTrendTimeRange,
          fetchTrendHistoryForWidget,
          openAddTrendSeriesModal,
          fetchDetectedTrendFields,
          selectTrendTagPill,
          saveTrendSeries,
          removeTrendSeries,
          toggleTrendSeriesVisible,
          getWidgetTrendLegend,
          getWidgetTrendPath,
  };
}
`;
//# sourceMappingURL=hmi-scada.module.js.map