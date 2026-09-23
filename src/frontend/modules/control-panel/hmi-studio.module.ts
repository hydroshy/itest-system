// ========================================================
// C-MODULE: HMI-STUDIO
// ========================================================

export const HMI_STUDIO_TEMPLATE = `
        <!-- TAB: HMI SCADA STUDIO (WECON STYLE DESIGNER & RUNTIME) -->
        <div v-show="activeTab === 'hmi-studio'" class="space-y-4">
          <!-- TOP STUDIO TOOLBAR -->
          <div class="p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 select-none">
            <!-- Left: Screen Selection & Actions -->
            <div class="flex items-center flex-wrap gap-2">
              <div class="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <i class="fa-solid fa-palette text-amber-400 text-sm"></i>
                <span class="hidden sm:inline">Screen:</span>
              </div>
              <select
                v-model="selectedHmiScreenId"
                @change="onSelectHmiScreen"
                class="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 font-medium focus:ring-1 focus:ring-sky-500 min-w-[200px]"
              >
                <option v-for="s in hmiScreensList" :key="s.id" :value="s.id">
                  {{ s.name }} {{ s.isPublished ? '● Live' : '○ Draft' }}
                </option>
              </select>

              <!-- Status Badge -->
              <span v-if="currentHmiScreen" class="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full border"
                    :class="currentHmiScreen.isPublished ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'">
                {{ currentHmiScreen.isPublished ? 'Live Operator' : 'Design Draft' }}
              </span>

              <!-- Action buttons -->
              <button
                @click="openCreateHmiScreenModal"
                class="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-md"
                title="Create New HMI Screen"
              >
                <i class="fa-solid fa-plus text-[10px]"></i>
                <span class="hidden md:inline">New Screen</span>
              </button>

              <button
                @click="saveCurrentHmiScreen"
                :disabled="savingHmiScreen || !currentHmiScreen"
                class="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-md"
                title="Save Screen Changes"
              >
                <i :class="savingHmiScreen ? 'fa-solid fa-spinner animate-spin' : 'fa-solid fa-floppy-disk'" class="text-[10px]"></i>
                <span class="hidden md:inline">Save</span>
              </button>

              <button
                @click="cloneCurrentHmiScreen"
                :disabled="!currentHmiScreen"
                class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1 cursor-pointer transition"
                title="Clone / Duplicate Screen"
              >
                <i class="fa-solid fa-copy text-[10px]"></i>
                <span class="hidden lg:inline">Clone</span>
              </button>

              <button
                @click="togglePublishHmiScreen"
                :disabled="!currentHmiScreen"
                class="px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer transition"
                :class="currentHmiScreen?.isPublished ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25' : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'"
                :title="currentHmiScreen?.isPublished ? 'Unpublish Screen' : 'Publish Screen to Operators'"
              >
                <i class="fa-solid fa-bullhorn text-[10px]"></i>
                <span class="hidden lg:inline">{{ currentHmiScreen?.isPublished ? 'Unpublish' : 'Publish' }}</span>
              </button>

              <button
                @click="openHmiRbacModal"
                :disabled="!currentHmiScreen"
                class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1 cursor-pointer transition"
                title="Configure Screen RBAC Role Access"
              >
                <i class="fa-solid fa-user-shield text-[10px]"></i>
                <span class="hidden xl:inline">Access</span>
              </button>

              <button
                @click="deleteCurrentHmiScreen"
                :disabled="!currentHmiScreen || hmiScreensList.length <= 1"
                class="px-2 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium cursor-pointer transition disabled:opacity-40"
                title="Delete this screen"
              >
                <i class="fa-solid fa-trash-can text-[10px]"></i>
              </button>
            </div>

            <!-- Center: Mode Toggle (Design Mode vs Runtime View) -->
            <div class="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                @click="setHmiEditorMode('design')"
                class="px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                :class="hmiEditorMode === 'design' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
                title="Edit Layout & Widgets (Animations & Telemetry Paused)"
              >
                <i class="fa-solid fa-compass-drafting text-[10px]"></i>
                <span>Design Mode</span>
              </button>
              <button
                @click="setHmiEditorMode('run')"
                class="px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                :class="hmiEditorMode === 'run' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
                title="Live SCADA Simulation & Telemetry Streaming"
              >
                <i class="fa-solid fa-play text-[10px]"></i>
                <span>Runtime View</span>
              </button>
            </div>

            <!-- Right: Canvas Controls (Resolution, Snap, Zoom) -->
            <div class="flex items-center flex-wrap gap-2 text-xs text-slate-300">
              <div v-if="hmiEditorMode === 'design'" class="flex items-center gap-1">
                <span class="text-slate-500 text-[10px] uppercase font-bold">Size:</span>
                <select
                  v-model="canvasPreset"
                  @change="onCanvasPresetChange"
                  class="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2 py-1"
                >
                  <option value="1920x1080">1920×1080 (1080p)</option>
                  <option value="1280x720">1280×720 (720p HMI)</option>
                  <option value="1024x600">1024×600 (7&quot; Wecon)</option>
                  <option value="800x480">800×480 (4.3&quot; Wecon)</option>
                </select>
              </div>

              <div v-if="hmiEditorMode === 'design'" class="flex items-center gap-1">
                <span class="text-slate-500 text-[10px] uppercase font-bold">Snap:</span>
                <select
                  v-model.number="hmiGridSize"
                  class="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2 py-1"
                >
                  <option :value="10">10 px</option>
                  <option :value="20">20 px</option>
                  <option :value="5">5 px</option>
                  <option :value="0">Off</option>
                </select>
              </div>

              <div class="flex items-center gap-1">
                <span class="text-slate-500 text-[10px] uppercase font-bold">Zoom:</span>
                <select
                  v-model.number="hmiZoom"
                  class="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2 py-1"
                >
                  <option :value="50">50%</option>
                  <option :value="75">75%</option>
                  <option :value="100">100%</option>
                  <option :value="125">125%</option>
                </select>
              </div>

              <div v-if="hmiEditorMode === 'run'" class="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-950/70 border border-emerald-800 text-[10px] font-mono text-emerald-300">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Live Streaming</span>
              </div>
              <div v-else class="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-950/70 border border-amber-800 text-[10px] font-mono text-amber-300">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Editing Paused</span>
              </div>
            </div>
          </div>

          <!-- MAIN WORKSPACE: 3-PANEL STUDIO -->
          <div class="flex gap-4 items-start min-h-[760px]">
            <!-- LEFT PANEL: WIDGET TOOLBOX (Wecon-Style Palette) -->
            <div v-if="hmiEditorMode === 'design'" class="w-56 shrink-0 bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-4 shadow-xl select-none max-h-[820px] overflow-y-auto custom-scroll">
              <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                <span class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <i class="fa-solid fa-cubes text-sky-400"></i> Toolbox
                </span>
                <span class="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">Wecon</span>
              </div>

              <!-- Category 1: Indicators & Alarms -->
              <div class="space-y-1.5">
                <div class="text-[10px] font-extrabold uppercase text-slate-500 px-1">Indicators & Alarms</div>
                <div class="grid grid-cols-1 gap-1.5">
                  <button @click="addWidgetToCanvas('bit-lamp')" class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-left transition group cursor-pointer">
                    <div class="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 text-xs group-hover:scale-110 transition">
                      <i class="fa-solid fa-lightbulb"></i>
                    </div>
                    <div>
                      <div class="text-xs font-semibold text-slate-200 group-hover:text-sky-300">Bit Lamp</div>
                      <div class="text-[9px] text-slate-500">2-State LED Indicator</div>
                    </div>
                  </button>

                  <button @click="addWidgetToCanvas('multi-state-lamp')" class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-left transition group cursor-pointer">
                    <div class="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 text-xs group-hover:scale-110 transition">
                      <i class="fa-solid fa-traffic-light"></i>
                    </div>
                    <div>
                      <div class="text-xs font-semibold text-slate-200 group-hover:text-sky-300">Multi-State Lamp</div>
                      <div class="text-[9px] text-slate-500">4-State Status Indicator</div>
                    </div>
                  </button>

                  <button @click="addWidgetToCanvas('alarm-banner')" class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-left transition group cursor-pointer">
                    <div class="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 text-xs group-hover:scale-110 transition">
                      <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <div>
                      <div class="text-xs font-semibold text-slate-200 group-hover:text-sky-300">Alarm Banner</div>
                      <div class="text-[9px] text-slate-500">Realtime Alert Scroller</div>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Category 2: Tanks & Vessels -->
              <div class="space-y-1.5">
                <div class="text-[10px] font-extrabold uppercase text-slate-500 px-1">Tanks & Vessels</div>
                <div class="grid grid-cols-1 gap-1.5">
                  <button @click="addWidgetToCanvas('linear-tank')" class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-left transition group cursor-pointer">
                    <div class="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/50 flex items-center justify-center text-sky-400 text-xs group-hover:scale-110 transition">
                      <i class="fa-solid fa-oil-well"></i>
                    </div>
                    <div>
                      <div class="text-xs font-semibold text-slate-200 group-hover:text-sky-300">Linear Tank</div>
                      <div class="text-[9px] text-slate-500">Liquid Level Vessel</div>
                    </div>
                  </button>

                  <button @click="addWidgetToCanvas('silo-vessel')" class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-left transition group cursor-pointer">
                    <div class="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400 text-xs group-hover:scale-110 transition">
                      <i class="fa-solid fa-landmark-dome"></i>
                    </div>
                    <div>
                      <div class="text-xs font-semibold text-slate-200 group-hover:text-sky-300">Silo Vessel</div>
                      <div class="text-[9px] text-slate-500">Bulk Storage Silo</div>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Category 3: Gauges & Displays -->
              <div class="space-y-1.5">
                <div class="text-[10px] font-extrabold uppercase text-slate-500 px-1">Meters & Gauges</div>
                <div class="grid grid-cols-1 gap-1.5">
                  <button @click="addWidgetToCanvas('dial-gauge')" class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-left transition group cursor-pointer">
                    <div class="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 text-xs group-hover:scale-110 transition">
                      <i class="fa-solid fa-gauge"></i>
                    </div>
                    <div>
                      <div class="text-xs font-semibold text-slate-200 group-hover:text-sky-300">Radial Dial Gauge</div>
                      <div class="text-[9px] text-slate-500">270° Needle Meter</div>
                    </div>
                  </button>

                  <button @click="addWidgetToCanvas('led-numeric')" class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-left transition group cursor-pointer">
                    <div class="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/50 flex items-center justify-center text-teal-400 text-xs group-hover:scale-110 transition">
                      <i class="fa-solid fa-calculator"></i>
                    </div>
                    <div>
                      <div class="text-xs font-semibold text-slate-200 group-hover:text-sky-300">LED 7-Segment</div>
                      <div class="text-[9px] text-slate-500">Digital Glowing Readout</div>
                    </div>
                  </button>

                  <button @click="addWidgetToCanvas('mono-box')" class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-left transition group cursor-pointer">
                    <div class="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 text-xs group-hover:scale-110 transition">
                      <i class="fa-solid fa-border-all"></i>
                    </div>
                    <div>
                      <div class="text-xs font-semibold text-slate-200 group-hover:text-sky-300">Mono Box</div>
                      <div class="text-[9px] text-slate-500">Industrial Metric Tile</div>
                    </div>
                  </button>

                  <button @click="addWidgetToCanvas('static-label')" class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-left transition group cursor-pointer">
                    <div class="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs group-hover:scale-110 transition">
                      <i class="fa-solid fa-heading"></i>
                    </div>
                    <div>
                      <div class="text-xs font-semibold text-slate-200 group-hover:text-sky-300">Static Label</div>
                      <div class="text-[9px] text-slate-500">Section Title & Note</div>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Category 4: Controls & Trends -->
              <div class="space-y-1.5">
                <div class="text-[10px] font-extrabold uppercase text-slate-500 px-1">Controls & Charts</div>
                <div class="grid grid-cols-1 gap-1.5">
                  <button @click="addWidgetToCanvas('toggle-switch')" class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-left transition group cursor-pointer">
                    <div class="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/50 flex items-center justify-center text-sky-400 text-xs group-hover:scale-110 transition">
                      <i class="fa-solid fa-toggle-on"></i>
                    </div>
                    <div>
                      <div class="text-xs font-semibold text-slate-200 group-hover:text-sky-300">Toggle Switch</div>
                      <div class="text-[9px] text-slate-500">Downlink Relay Control</div>
                    </div>
                  </button>

                  <button @click="addWidgetToCanvas('action-button')" class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-left transition group cursor-pointer">
                    <div class="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 text-xs group-hover:scale-110 transition">
                      <i class="fa-solid fa-hand-pointer"></i>
                    </div>
                    <div>
                      <div class="text-xs font-semibold text-slate-200 group-hover:text-sky-300">Action Button</div>
                      <div class="text-[9px] text-slate-500">Pushbutton Downlink</div>
                    </div>
                  </button>

                  <button @click="addWidgetToCanvas('realtime-trend')" class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-left transition group cursor-pointer">
                    <div class="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 text-xs group-hover:scale-110 transition">
                      <i class="fa-solid fa-chart-line"></i>
                    </div>
                    <div>
                      <div class="text-xs font-semibold text-slate-200 group-hover:text-sky-300">Realtime Trend</div>
                      <div class="text-[9px] text-slate-500">Multi-Tag Curve Plotter</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <!-- CENTER PANEL: CANVAS WORKSPACE -->
            <div class="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-auto custom-scroll shadow-2xl relative min-h-[760px] max-h-[820px]"
                 @click.self="selectedWidgetId = null">
              <div v-if="!currentHmiScreen" class="flex flex-col items-center justify-center h-96 text-slate-500 gap-3">
                <i class="fa-solid fa-palette text-4xl text-slate-600"></i>
                <p class="text-sm">No HMI Screen selected. Choose or create a screen to begin.</p>
              </div>

              <!-- Canvas Board -->
              <div
                v-else
                class="relative transition-transform origin-top-left shadow-2xl border border-slate-700/60 rounded-lg"
                :class="{ 'hmi-grid-bg': currentHmiScreen.canvasConfig?.showGrid && hmiEditorMode === 'design', 'hmi-design-paused': hmiEditorMode === 'design' }"
                :style="{
                  width: currentHmiScreen.canvasConfig.width + 'px',
                  height: currentHmiScreen.canvasConfig.height + 'px',
                  backgroundColor: currentHmiScreen.canvasConfig.background || '#0b0f19',
                  transform: 'scale(' + (hmiZoom / 100) + ')'
                }"
              >
                <!-- Canvas Widgets Loop -->
                <div
                  v-for="w in currentHmiScreen.widgets"
                  :key="w.id"
                  class="absolute transition-shadow select-none group"
                  :class="[
                    selectedWidgetId === w.id && hmiEditorMode === 'design'
                      ? 'ring-2 ring-sky-400 border border-sky-300 z-30 shadow-2xl shadow-sky-500/30'
                      : (hmiEditorMode === 'design' ? 'hover:ring-1 hover:ring-sky-500/50 cursor-move' : '')
                  ]"
                  :style="{
                    left: w.x + 'px',
                    top: w.y + 'px',
                    width: w.w + 'px',
                    height: w.h + 'px',
                    zIndex: w.zIndex || 1
                  }"
                  @mousedown.stop="onWidgetMouseDown($event, w)"
                >
                  <!-- Floating Action Toolbar for Selected Widget (Design Mode Only) -->
                  <div
                    v-if="selectedWidgetId === w.id && hmiEditorMode === 'design'"
                    class="absolute -top-10 left-0 bg-slate-900/95 border border-sky-500/80 rounded-xl px-2 py-1 shadow-2xl flex items-center gap-1.5 z-50 text-white select-none whitespace-nowrap backdrop-blur-md"
                    @mousedown.stop
                  >
                    <span class="text-[10px] font-mono font-bold text-sky-400 border-r border-slate-700 pr-1.5">{{ w.type }}</span>
                    <span class="text-[10px] font-mono text-slate-300 border-r border-slate-700 pr-1.5">({{ w.x }}, {{ w.y }}) {{ w.w }}×{{ w.h }}</span>

                    <!-- Quick Stretch Width / Height -->
                    <button @click.stop="stretchWidgetWidth(w, 50)" title="Extend width +50px" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-sky-600 text-[10px] text-slate-200 transition cursor-pointer font-mono">
                      ↔+50
                    </button>
                    <button @click.stop="stretchWidgetHeight(w, 30)" title="Extend height +30px" class="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-sky-600 text-[10px] text-slate-200 transition cursor-pointer font-mono">
                      ↕+30
                    </button>

                    <!-- Layer Ordering -->
                    <button @click.stop="moveWidgetLayer(1)" title="Bring Forward" class="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] transition cursor-pointer">
                      <i class="fa-solid fa-arrow-up"></i>
                    </button>
                    <button @click.stop="moveWidgetLayer(-1)" title="Send Backward" class="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] transition cursor-pointer">
                      <i class="fa-solid fa-arrow-down"></i>
                    </button>

                    <!-- Duplicate & Delete -->
                    <button @click.stop="duplicateSelectedWidget" title="Duplicate Widget (Ctrl+D)" class="p-1 rounded hover:bg-slate-800 text-sky-400 hover:text-sky-300 text-[10px] transition cursor-pointer">
                      <i class="fa-solid fa-copy"></i>
                    </button>
                    <button @click.stop="removeSelectedWidget" title="Delete Widget (Delete / Backspace)" class="p-1 rounded hover:bg-red-500/30 text-red-400 hover:text-red-300 text-[10px] transition cursor-pointer">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>

                  <!-- 8-Point Multi-Directional Resize Handles (Design Mode Only) -->
                  <template v-if="selectedWidgetId === w.id && hmiEditorMode === 'design'">
                    <!-- Top-Left (NW) -->
                    <div @mousedown.stop="onResizeMouseDown($event, w, 'nw')" class="hmi-resize-handle -top-1.5 -left-1.5 cursor-nwse-resize" title="Resize Top-Left"></div>
                    <!-- Top-Center (N) -->
                    <div @mousedown.stop="onResizeMouseDown($event, w, 'n')" class="hmi-resize-handle -top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize" title="Stretch Height (Top)"></div>
                    <!-- Top-Right (NE) -->
                    <div @mousedown.stop="onResizeMouseDown($event, w, 'ne')" class="hmi-resize-handle -top-1.5 -right-1.5 cursor-nesw-resize" title="Resize Top-Right"></div>
                    <!-- Right-Center (E) -->
                    <div @mousedown.stop="onResizeMouseDown($event, w, 'e')" class="hmi-resize-handle top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize" title="Stretch Width (Right)"></div>
                    <!-- Bottom-Right (SE) -->
                    <div @mousedown.stop="onResizeMouseDown($event, w, 'se')" class="hmi-resize-handle -bottom-1.5 -right-1.5 cursor-nwse-resize" title="Resize Bottom-Right"></div>
                    <!-- Bottom-Center (S) -->
                    <div @mousedown.stop="onResizeMouseDown($event, w, 's')" class="hmi-resize-handle -bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize" title="Stretch Height (Bottom)"></div>
                    <!-- Bottom-Left (SW) -->
                    <div @mousedown.stop="onResizeMouseDown($event, w, 'sw')" class="hmi-resize-handle -bottom-1.5 -left-1.5 cursor-nesw-resize" title="Resize Bottom-Left"></div>
                    <!-- Left-Center (W) -->
                    <div @mousedown.stop="onResizeMouseDown($event, w, 'w')" class="hmi-resize-handle top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize" title="Stretch Width (Left)"></div>
                  </template>


                  <!-- WIDGET TYPE: BIT-LAMP -->
                  <div v-if="w.type === 'bit-lamp'" class="w-full h-full flex items-center justify-between px-3 py-2 bg-slate-900/90 rounded-lg border border-slate-700/80 shadow-inner gap-2">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <div class="relative w-7 h-7 rounded-full flex items-center justify-center border-2 shadow-lg transition-colors duration-300"
                           :style="getWidgetBitLampStyle(w)">
                        <div class="w-2.5 h-2.5 rounded-full bg-white/80 opacity-60"></div>
                      </div>
                      <div class="min-w-0">
                        <div class="text-[11px] font-bold text-slate-200 truncate uppercase">{{ w.props.title || 'Lamp' }}</div>
                        <div class="text-[9px] font-mono" :class="isWidgetBitOn(w) ? 'text-emerald-400 font-bold' : 'text-slate-400'">
                          {{ isWidgetBitOn(w) ? (w.props.labelOn || 'RUN') : (w.props.labelOff || 'STOP') }}
                        </div>
                      </div>
                    </div>
                    <span class="w-2 h-2 rounded-full" :class="isWidgetBitOn(w) ? 'bg-emerald-400 animate-ping' : 'bg-slate-700'"></span>
                  </div>

                  <!-- WIDGET TYPE: MULTI-STATE-LAMP -->
                  <div v-else-if="w.type === 'multi-state-lamp'" class="w-full h-full flex items-center justify-between px-3 py-2 bg-slate-900/90 rounded-lg border border-slate-700/80 shadow-inner gap-2">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <div class="w-7 h-7 rounded-md flex items-center justify-center border-2 font-black text-xs transition-all duration-300"
                           :style="getWidgetMultiStateStyle(w)">
                        <i :class="getWidgetMultiStateIcon(w)"></i>
                      </div>
                      <div class="min-w-0">
                        <div class="text-[11px] font-bold text-slate-200 truncate uppercase">{{ w.props.title || 'State Monitor' }}</div>
                        <div class="text-[9px] font-mono font-bold" :style="{ color: getWidgetMultiStateColor(w) }">
                          {{ getWidgetMultiStateLabel(w) }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- WIDGET TYPE: ALARM-BANNER -->
                  <div v-else-if="w.type === 'alarm-banner'"
                       class="w-full h-full flex items-center px-3 py-1.5 rounded-lg border gap-2 transition-all duration-300"
                       :class="getWidgetAlarmClass(w)">
                    <i :class="isWidgetAlarmActive(w) ? 'fa-solid fa-triangle-exclamation text-red-400 animate-bounce' : 'fa-solid fa-circle-check text-emerald-400'"></i>
                    <div class="flex-1 min-w-0 font-mono text-xs font-bold truncate">
                      <span v-if="isWidgetAlarmActive(w)" class="text-red-300 uppercase">
                        [ALARM] {{ getWidgetAlarmText(w) }}
                      </span>
                      <span v-else class="text-emerald-300">
                        {{ w.props.idleMessage || 'All systems normal. No active alarms.' }}
                      </span>
                    </div>
                    <span v-if="isWidgetAlarmActive(w)" class="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-red-500 text-white animate-pulse">
                      ACTIVE
                    </span>
                  </div>

                  <!-- WIDGET TYPE: LINEAR-TANK -->
                  <div v-else-if="w.type === 'linear-tank'" class="w-full h-full flex flex-col bg-slate-900/90 rounded-lg border border-slate-700/80 p-2 overflow-hidden shadow-inner">
                    <div class="text-[11px] font-bold text-slate-300 truncate uppercase flex items-center justify-between pb-1 border-b border-slate-800">
                      <span class="truncate">{{ w.props.title || 'Storage Tank' }}</span>
                      <span class="text-[9px] px-1 py-0.5 rounded bg-sky-950 text-sky-400 font-mono">{{ getWidgetTelemetryValue(w) }} {{ w.props.unit || '%' }}</span>
                    </div>
                    <div class="flex-1 flex items-center gap-2 pt-1 min-h-0">
                      <div class="relative flex-1 h-full rounded-md border-2 border-slate-600 bg-slate-950 overflow-hidden flex flex-col justify-end shadow-inner">
                        <div class="absolute top-[15%] left-0 right-0 border-b border-red-500/50 border-dashed z-10 pointer-events-none"></div>
                        <div class="absolute bottom-[20%] left-0 right-0 border-b border-yellow-500/50 border-dashed z-10 pointer-events-none"></div>
                        <div class="w-full transition-all duration-700 ease-out relative"
                             :style="{ height: getWidgetTankHeightPercent(w) + '%', backgroundColor: getWidgetLiquidColor(w) }">
                          <div class="absolute inset-0 opacity-25 bg-gradient-to-t from-black/40 to-white/40"></div>
                          <div class="absolute top-0 left-0 right-0 h-1 bg-white/50"></div>
                        </div>
                        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span class="text-xs font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] font-mono">
                            {{ getWidgetTelemetryValue(w) }} {{ w.props.unit || '' }}
                          </span>
                        </div>
                      </div>
                      <div class="w-7 h-full flex flex-col justify-between text-[8px] font-mono text-slate-400 py-1 select-none">
                        <span>100%</span>
                        <span>75%</span>
                        <span>50%</span>
                        <span>25%</span>
                        <span>0%</span>
                      </div>
                    </div>
                  </div>

                  <!-- WIDGET TYPE: SILO-VESSEL -->
                  <div v-else-if="w.type === 'silo-vessel'" class="w-full h-full flex flex-col bg-slate-900/90 rounded-lg border border-slate-700/80 p-2 overflow-hidden shadow-inner">
                    <div class="text-[11px] font-bold text-slate-300 truncate uppercase flex items-center justify-between pb-1 border-b border-slate-800">
                      <span class="truncate">{{ w.props.title || 'Storage Silo' }}</span>
                      <span class="text-[9px] px-1 py-0.5 rounded bg-sky-950 text-sky-400 font-mono">{{ getWidgetTelemetryValue(w) }}%</span>
                    </div>
                    <div class="flex-1 flex items-center justify-center pt-1 min-h-0">
                      <svg viewBox="0 0 100 140" class="w-full h-full max-h-[150px]">
                        <defs>
                          <clipPath :id="'siloClip-' + w.id">
                            <path d="M 20 25 Q 50 10 80 25 L 80 95 L 50 130 L 20 95 Z" />
                          </clipPath>
                        </defs>
                        <path d="M 20 25 Q 50 10 80 25 L 80 95 L 50 130 L 20 95 Z" fill="#020617" stroke="#475569" stroke-width="2" />
                        <g :clip-path="'url(#siloClip-' + w.id + ')'">
                          <rect x="15" :y="130 - (getWidgetTankHeightPercent(w) * 1.15)" width="70" height="130" :fill="getWidgetLiquidColor(w)" opacity="0.85" />
                        </g>
                        <path d="M 20 25 Q 50 10 80 25" fill="none" stroke="#94a3b8" stroke-width="2" />
                        <text x="50" y="75" font-size="12" font-weight="bold" fill="#ffffff" font-family="monospace" text-anchor="middle" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.8))">
                          {{ getWidgetTelemetryValue(w) }}%
                        </text>
                      </svg>
                    </div>
                  </div>

                  <!-- WIDGET TYPE: DIAL-GAUGE -->
                  <div v-else-if="w.type === 'dial-gauge'" class="w-full h-full flex flex-col items-center justify-between bg-slate-900/90 rounded-lg border border-slate-700/80 p-2 shadow-inner overflow-hidden">
                    <div class="text-[11px] font-bold text-slate-300 truncate uppercase text-center w-full pb-1 border-b border-slate-800">
                      {{ w.props.title || 'Pressure Gauge' }}
                    </div>
                    <div class="relative flex-1 w-full flex items-center justify-center min-h-0">
                      <svg viewBox="0 0 160 160" class="w-full h-full max-h-[140px]">
                        <circle cx="80" cy="80" r="70" fill="#0f172a" stroke="#334155" stroke-width="6" />
                        <circle cx="80" cy="80" r="64" fill="#020617" stroke="#1e293b" stroke-width="2" />
                        <path d="M 30.5 129.5 A 70 70 0 0 1 80 10" fill="none" stroke="#10b981" stroke-width="5" stroke-linecap="round" />
                        <path d="M 80 10 A 70 70 0 0 1 129.5 30.5" fill="none" stroke="#f59e0b" stroke-width="5" />
                        <path d="M 129.5 30.5 A 70 70 0 0 1 129.5 129.5" fill="none" stroke="#ef4444" stroke-width="5" stroke-linecap="round" />
                        <g :style="{ transform: 'rotate(' + getWidgetGaugeAngle(w) + 'deg)', transformOrigin: '80px 80px' }" class="transition-transform duration-500 ease-out">
                          <polygon points="77,80 80,24 83,80 80,88" fill="#f43f5e" filter="drop-shadow(0 0 3px rgba(244,63,94,0.6))" />
                          <circle cx="80" cy="80" r="7" fill="#e2e8f0" stroke="#475569" stroke-width="2" />
                          <circle cx="80" cy="80" r="3" fill="#0f172a" />
                        </g>
                        <text x="32" y="142" font-size="9" fill="#94a3b8" font-family="monospace" text-anchor="middle">{{ w.props.min || 0 }}</text>
                        <text x="128" y="142" font-size="9" fill="#94a3b8" font-family="monospace" text-anchor="middle">{{ w.props.max || 100 }}</text>
                      </svg>
                    </div>
                    <div class="w-full text-center pt-0.5">
                      <span class="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-sky-400 font-mono font-bold text-xs">
                        {{ getWidgetTelemetryValue(w) }} {{ w.props.unit || '' }}
                      </span>
                    </div>
                  </div>

                  <!-- WIDGET TYPE: LED-NUMERIC -->
                  <div v-else-if="w.type === 'led-numeric'" class="w-full h-full flex flex-col justify-between bg-slate-950 rounded-lg border-2 border-slate-800 p-2.5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
                    <div class="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <span class="truncate">{{ w.props.title || 'Digital Readout' }}</span>
                      <span class="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[9px]">{{ w.props.unit || 'VAL' }}</span>
                    </div>
                    <div class="flex-1 flex items-center justify-end overflow-hidden px-1">
                      <span class="font-mono font-black text-2xl tracking-widest hmi-glow-text truncate" :style="{ color: w.props.color || '#38bdf8' }">
                        {{ getWidgetTelemetryValue(w) }}
                      </span>
                    </div>
                  </div>

                  <!-- WIDGET TYPE: MONO-BOX -->
                  <div v-else-if="w.type === 'mono-box'" class="w-full h-full flex items-center gap-3 px-3 py-2 bg-slate-900/90 rounded-lg border border-slate-700/80 shadow-inner">
                    <div class="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-lg shrink-0">
                      <i :class="w.props.icon || 'fa-solid fa-gauge-high'"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="text-[10px] uppercase font-bold text-slate-400 truncate">{{ w.props.title || 'Metric' }}</div>
                      <div class="text-lg font-black font-mono text-white truncate flex items-baseline gap-1">
                        <span>{{ getWidgetTelemetryValue(w) }}</span>
                        <span class="text-xs text-slate-400 font-medium">{{ w.props.unit || '' }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- WIDGET TYPE: STATIC-LABEL -->
                  <div v-else-if="w.type === 'static-label'" class="w-full h-full flex flex-col justify-center px-2">
                    <div class="font-extrabold tracking-tight truncate"
                         :style="{ fontSize: (w.props.fontSize || 16) + 'px', color: w.props.textColor || '#38bdf8' }">
                      {{ w.props.text || 'Process Area Title' }}
                    </div>
                    <div v-if="w.props.subText" class="text-xs text-slate-400 truncate">
                      {{ w.props.subText }}
                    </div>
                  </div>

                  <!-- WIDGET TYPE: TOGGLE-SWITCH -->
                  <div v-else-if="w.type === 'toggle-switch'" class="w-full h-full flex items-center justify-between px-3 py-2 bg-slate-900/90 rounded-lg border border-slate-700/80 shadow-inner gap-2">
                    <div class="min-w-0">
                      <div class="text-[11px] font-bold text-slate-200 truncate uppercase">{{ w.props.title || 'Relay Switch' }}</div>
                      <div class="text-[9px] font-mono text-slate-400">{{ isWidgetSwitchOn(w) ? (w.props.labelOn || 'ON') : (w.props.labelOff || 'OFF') }}</div>
                    </div>
                    <button @click.stop="triggerWidgetToggleSwitch(w)"
                            :disabled="hmiEditorMode === 'design'"
                            class="relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none p-0.5 cursor-pointer disabled:cursor-default"
                            :class="isWidgetSwitchOn(w) ? 'bg-sky-600' : 'bg-slate-700'">
                      <div class="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200"
                           :class="isWidgetSwitchOn(w) ? 'translate-x-6' : 'translate-x-0'"></div>
                    </button>
                  </div>

                  <!-- WIDGET TYPE: ACTION-BUTTON -->
                  <div v-else-if="w.type === 'action-button'" class="w-full h-full flex items-center justify-center p-1.5">
                    <button @click.stop="triggerWidgetActionButton(w)"
                            :disabled="hmiEditorMode === 'design'"
                            class="w-full h-full rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer disabled:cursor-default disabled:opacity-90 border"
                            :style="{ backgroundColor: w.props.buttonColor || '#e11d48', borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }">
                      <i :class="w.props.icon || 'fa-solid fa-bolt'"></i>
                      <span class="truncate">{{ w.props.label || 'EXECUTE' }}</span>
                    </button>
                  </div>

                  <!-- WIDGET TYPE: REALTIME-TREND (METABASE STYLE WITH MULTI-SENSOR Y-AXIS & TIMESTAMP X-AXIS) -->
                  <div v-else-if="w.type === 'realtime-trend'" class="w-full h-full flex flex-col bg-slate-950/95 rounded-xl border border-slate-800 p-3 overflow-hidden shadow-2xl relative select-none">
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
                        <div class="flex items-center bg-slate-900 border border-slate-700/70 rounded-lg p-0.5 text-[9px] font-mono">
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
                      class="flex-1 w-full min-h-0 relative bg-slate-950 rounded-lg border border-slate-900 overflow-hidden"
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
                          <button
                            v-if="hmiEditorMode === 'design'"
                            type="button"
                            @click.stop="removeTrendSeries(w, s.id)"
                            class="ml-1 text-slate-500 hover:text-red-400 text-[9px] p-0.5 cursor-pointer"
                            title="Remove this series"
                          >
                            <i class="fa-solid fa-xmark"></i>
                          </button>
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

            <!-- RIGHT PANEL: PROPERTY & TAG INSPECTOR -->
            <div v-if="hmiEditorMode === 'design'" class="w-72 shrink-0 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl select-none max-h-[820px] overflow-y-auto custom-scroll">
              <div v-if="selectedWidget" class="space-y-4">
                <div class="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <div class="text-xs font-bold text-white uppercase tracking-wider">{{ selectedWidget.type }}</div>
                    <div class="text-[10px] font-mono text-sky-400">ID: {{ selectedWidget.id }}</div>
                  </div>
                  <div class="flex items-center gap-1">
                    <button @click="moveWidgetLayer(1)" class="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer" title="Bring to Front">
                      <i class="fa-solid fa-layer-group"></i>
                    </button>
                    <button @click="duplicateSelectedWidget" class="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer" title="Duplicate">
                      <i class="fa-solid fa-copy"></i>
                    </button>
                    <button @click="removeSelectedWidget" class="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs cursor-pointer" title="Delete">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>

                <!-- Section 1: Geometry & Quick Stretch -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-extrabold uppercase text-slate-500">Geometry (px)</span>
                    <span class="text-[9px] text-sky-400 font-mono font-bold">{{ selectedWidget.w }} × {{ selectedWidget.h }}</span>
                  </div>
                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label class="text-[10px] text-slate-400">X Position</label>
                      <input type="number" v-model.number="selectedWidget.x" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono" />
                    </div>
                    <div>
                      <label class="text-[10px] text-slate-400">Y Position</label>
                      <input type="number" v-model.number="selectedWidget.y" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono" />
                    </div>
                    <div>
                      <label class="text-[10px] text-slate-400">Width</label>
                      <input type="number" v-model.number="selectedWidget.w" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono" />
                    </div>
                    <div>
                      <label class="text-[10px] text-slate-400">Height</label>
                      <input type="number" v-model.number="selectedWidget.h" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono" />
                    </div>
                  </div>

                  <!-- Quick Resize & Stretch -->
                  <div class="space-y-1 pt-1">
                    <div class="text-[9px] text-slate-500 font-bold uppercase">Quick Resize & Stretch</div>
                    <div class="grid grid-cols-4 gap-1">
                      <button type="button" @click="stretchWidgetWidth(selectedWidget, 50)" class="py-1 px-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-mono text-center cursor-pointer transition" title="Width +50px">
                        W +50
                      </button>
                      <button type="button" @click="stretchWidgetWidth(selectedWidget, -50)" class="py-1 px-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-mono text-center cursor-pointer transition" title="Width -50px">
                        W -50
                      </button>
                      <button type="button" @click="stretchWidgetHeight(selectedWidget, 30)" class="py-1 px-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-mono text-center cursor-pointer transition" title="Height +30px">
                        H +30
                      </button>
                      <button type="button" @click="stretchWidgetHeight(selectedWidget, -30)" class="py-1 px-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-mono text-center cursor-pointer transition" title="Height -30px">
                        H -30
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Section 2: Properties -->
                <div class="space-y-2 border-t border-slate-800 pt-3">
                  <div class="text-[10px] font-extrabold uppercase text-slate-500">Widget Appearance</div>
                  <div class="space-y-2 text-xs">
                    <div v-if="selectedWidget.props.title !== undefined">
                      <label class="text-[10px] text-slate-400">Title / Label</label>
                      <input type="text" v-model="selectedWidget.props.title" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white" />
                    </div>
                    <div v-if="selectedWidget.props.text !== undefined">
                      <label class="text-[10px] text-slate-400">Header Text</label>
                      <input type="text" v-model="selectedWidget.props.text" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white" />
                    </div>
                    <div v-if="selectedWidget.props.subText !== undefined">
                      <label class="text-[10px] text-slate-400">Subtitle</label>
                      <input type="text" v-model="selectedWidget.props.subText" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white" />
                    </div>
                    <div v-if="selectedWidget.props.unit !== undefined" class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="text-[10px] text-slate-400">Unit</label>
                        <input type="text" v-model="selectedWidget.props.unit" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono" />
                      </div>
                      <div v-if="selectedWidget.props.digits !== undefined">
                        <label class="text-[10px] text-slate-400">Digits</label>
                        <input type="number" v-model.number="selectedWidget.props.digits" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono" />
                      </div>
                    </div>
                    <div v-if="selectedWidget.props.min !== undefined && selectedWidget.props.max !== undefined" class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="text-[10px] text-slate-400">Min</label>
                        <input type="number" v-model.number="selectedWidget.props.min" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono" />
                      </div>
                      <div>
                        <label class="text-[10px] text-slate-400">Max</label>
                        <input type="number" v-model.number="selectedWidget.props.max" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Section 3: Tag Binding Engine (Auto-Detection Enabled) -->
                <div v-if="selectedWidget.type === 'realtime-trend'" class="space-y-3 border-t border-slate-800 pt-3">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-extrabold uppercase text-slate-500">Y-Axis Sensors (Series)</span>
                    <button
                      type="button"
                      @click="openAddTrendSeriesModal(selectedWidget)"
                      class="px-2 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition border border-sky-500/30"
                    >
                      <i class="fa-solid fa-plus text-[9px]"></i>
                      <span>Add Sensor</span>
                    </button>
                  </div>

                  <!-- Default Metabase Time Range for this widget -->
                  <div class="space-y-1">
                    <label class="text-[10px] text-slate-400">Default Time Range (Time Filter)</label>
                    <select
                      v-model="selectedWidget.props.timeRange"
                      @change="fetchTrendHistoryForWidget(selectedWidget)"
                      class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white text-xs"
                    >
                      <option value="15m">Last 15 minutes (15m)</option>
                      <option value="1h">Last 1 hour (1h)</option>
                      <option value="6h">Last 6 hours (6h)</option>
                      <option value="24h">Last 24 hours (24h)</option>
                      <option value="7d">Last 7 days (7d)</option>
                      <option value="30d">Last 30 days (30d)</option>
                    </select>
                  </div>

                  <!-- Series List -->
                  <div class="space-y-2">
                    <div class="text-[10px] text-slate-400 font-bold uppercase">Y-Axis Sensors / Tags List ({{ getTrendSeries(selectedWidget).length }})</div>
                    <div v-if="getTrendSeries(selectedWidget).length === 0" class="p-3 rounded-lg bg-slate-950 border border-dashed border-slate-800 text-center text-slate-500 text-[11px]">
                      No sensors assigned. Click "+ Add Sensor" to attach sensors to this chart.
                    </div>
                    <div
                      v-for="s in getTrendSeries(selectedWidget)"
                      :key="s.id"
                      class="p-2 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs"
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5 min-w-0">
                          <span class="w-3 h-3 rounded-full shrink-0 border border-slate-700" :style="{ backgroundColor: s.color }"></span>
                          <span class="font-bold text-white truncate text-[11px]">{{ s.label || s.field }}</span>
                        </div>
                        <div class="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            @click="toggleTrendSeriesVisible(selectedWidget, s.id)"
                            class="p-1 text-slate-400 hover:text-white text-xs cursor-pointer"
                            :title="s.visible !== false ? 'Hide from chart' : 'Show on chart'"
                          >
                            <i :class="s.visible !== false ? 'fa-solid fa-eye text-emerald-400' : 'fa-solid fa-eye-slash text-slate-600'"></i>
                          </button>
                          <button
                            type="button"
                            @click="removeTrendSeries(selectedWidget, s.id)"
                            class="p-1 text-slate-400 hover:text-red-400 text-xs cursor-pointer"
                            title="Remove this sensor"
                          >
                            <i class="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </div>
                      <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span class="truncate max-w-[140px]" :title="s.devEUI">Dev: {{ s.devEUI || 'All' }}</span>
                        <span class="text-sky-400 font-bold">{{ s.field }} {{ s.unit ? '(' + s.unit + ')' : '' }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Section 3 for Single-Value Widgets: Standard LoRaWAN Tag Binding -->
                <div v-else class="space-y-2 border-t border-slate-800 pt-3">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-extrabold uppercase text-slate-500">LoRaWAN Tag Binding</span>
                    <span class="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">Auto-Detect</span>
                  </div>
                  <div class="space-y-2 text-xs">
                    <div>
                      <label class="text-[10px] text-slate-400">Target Device (DevEUI)</label>
                      <select
                        v-model="selectedWidgetBinding.devEUI"
                        @change="fetchDetectedFieldsForSelectedDevice"
                        class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white text-xs focus:ring-1 focus:ring-sky-500"
                      >
                        <option value="">-- Select Device --</option>
                        <option v-for="d in devicesList" :key="d.devEUI" :value="d.devEUI">
                          {{ d.name ? d.name + ' (' + d.devEUI + ')' : d.devEUI }}
                        </option>
                      </select>
                    </div>

                    <!-- Auto-detected Decoded Tags Box -->
                    <div v-if="selectedWidgetBinding.devEUI" class="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5 text-[10px] font-bold text-sky-400">
                          <i class="fa-solid fa-wand-magic-sparkles text-amber-400 text-[10px]"></i>
                          <span>Decoded Tags ({{ detectedTelemetryFields.length }})</span>
                        </div>
                        <button
                          type="button"
                          @click="fetchDetectedFieldsForSelectedDevice"
                          class="text-slate-400 hover:text-white text-[10px] cursor-pointer transition flex items-center gap-1"
                          title="Refresh detected fields from payload"
                        >
                          <i class="fa-solid fa-arrows-rotate" :class="{ 'animate-spin': loadingDetectedFields }"></i>
                          <span class="text-[9px]">Scan</span>
                        </button>
                      </div>

                      <!-- Loading state -->
                      <div v-if="loadingDetectedFields" class="text-[10px] text-slate-500 font-mono py-1 flex items-center gap-1.5">
                        <i class="fa-solid fa-spinner animate-spin text-sky-400"></i>
                        <span>Scanning device payloads...</span>
                      </div>

                      <!-- Search / Filter input if many tags -->
                      <div v-if="!loadingDetectedFields && detectedTelemetryFields.length > 5">
                        <input
                          v-model="hmiTagFilterQuery"
                          type="text"
                          placeholder="Filter tags (e.g. TEMP, HUM, EVENT)..."
                          class="w-full bg-slate-900 border border-slate-700/80 rounded px-2 py-0.5 text-[10px] text-white font-mono focus:border-sky-500"
                        />
                      </div>

                      <!-- Tag Pills / Chips -->
                      <div v-if="!loadingDetectedFields && filteredDetectedTelemetryFields.length > 0" class="flex flex-wrap gap-1 max-h-36 overflow-y-auto custom-scroll pr-1">
                        <button
                          v-for="f in filteredDetectedTelemetryFields"
                          :key="f.key"
                          type="button"
                          @click="applyDetectedField(f)"
                          class="px-2 py-0.5 rounded text-[10px] font-mono transition flex items-center gap-1 cursor-pointer border"
                          :class="selectedWidgetBinding.field === f.key ? 'bg-sky-500/25 border-sky-400 text-sky-200 font-bold shadow-sm' : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-300'"
                          :title="getTagTooltip(f)"
                        >
                          <span :class="f.source === 'decoded_payload' ? 'text-emerald-400 font-semibold' : 'text-slate-300'">{{ f.key }}</span>
                          <span class="text-[9px] text-slate-400 font-normal">({{ f.latestValue }}{{ f.unit ? f.unit : '' }})</span>
                        </button>
                      </div>

                      <div v-else-if="!loadingDetectedFields && detectedTelemetryFields.length === 0" class="text-[10px] text-slate-500 italic">
                        No uplink payloads received yet. You can still manually type a tag below.
                      </div>
                      <div v-else-if="!loadingDetectedFields && filteredDetectedTelemetryFields.length === 0" class="text-[10px] text-slate-500 italic">
                        No matching tags for "{{ hmiTagFilterQuery }}".
                      </div>
                    </div>

                    <div>
                      <label class="text-[10px] text-slate-400">Telemetry Field (Tag)</label>
                      <input
                        type="text"
                        v-model="selectedWidgetBinding.field"
                        list="hmi-detected-tags-list"
                        placeholder="e.g. water_level, LM_OF_T2_IMP_KWH..."
                        class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs focus:ring-1 focus:ring-sky-500"
                      />
                      <datalist id="hmi-detected-tags-list">
                        <option v-for="f in detectedTelemetryFields" :key="f.key" :value="f.key">
                          {{ f.label }} ({{ f.latestValue }}{{ f.unit ? ' ' + f.unit : '' }})
                        </option>
                      </datalist>
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="text-[10px] text-slate-400">Scale Formula</label>
                        <input type="text" v-model="selectedWidgetBinding.formula" placeholder="val * 1.0" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono text-[11px]" />
                      </div>
                      <div>
                        <label class="text-[10px] text-slate-400">Decimals</label>
                        <select v-model.number="selectedWidgetBinding.decimalPlaces" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs">
                          <option :value="0">0 (Integer)</option>
                          <option :value="1">1 (0.0)</option>
                          <option :value="2">2 (0.00)</option>
                        </select>
                      </div>
                    </div>

                    <!-- Live Tag Value Preview -->
                    <div class="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <span class="text-slate-400 text-[10px]">Live Tag Value:</span>
                      <span class="font-mono font-bold text-sky-400">{{ getWidgetTelemetryValue(selectedWidget) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Section 4: Downlink Actions (if switch / action button) -->
                <div v-if="selectedWidget.type === 'toggle-switch' || selectedWidget.type === 'action-button'" class="space-y-2 border-t border-slate-800 pt-3">
                  <div class="text-[10px] font-extrabold uppercase text-slate-500">Downlink Action Config</div>
                  <div class="space-y-2 text-xs">
                    <div>
                      <label class="text-[10px] text-slate-400">Target DevEUI</label>
                      <input type="text" v-model="selectedWidgetAction.devEUI" placeholder="Device DevEUI" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono" />
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="text-[10px] text-slate-400">fPort</label>
                        <input type="number" v-model.number="selectedWidgetAction.fPort" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono" />
                      </div>
                      <div>
                        <label class="text-[10px] text-slate-400">Payload Hex</label>
                        <input type="text" v-model="selectedWidgetAction.payloadHex" placeholder="0101" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Bottom Widget Action Controls -->
                <div class="border-t border-slate-800 pt-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    @click="duplicateSelectedWidget"
                    class="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition border border-slate-700 shadow-sm"
                  >
                    <i class="fa-solid fa-copy text-[10px] text-sky-400"></i> Duplicate
                  </button>
                  <button
                    type="button"
                    @click="removeSelectedWidget"
                    class="flex-1 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition shadow-sm"
                  >
                    <i class="fa-solid fa-trash-can text-[10px]"></i> Delete
                  </button>
                </div>
              </div>


              <!-- When no widget is selected: Canvas Inspector -->
              <div v-else class="space-y-3">
                <div class="pb-2 border-b border-slate-800">
                  <div class="text-xs font-bold text-white uppercase tracking-wider">Canvas Settings</div>
                  <div class="text-[10px] text-slate-400">Select a widget to edit properties</div>
                </div>
                <div v-if="currentHmiScreen" class="space-y-2.5 text-xs">
                  <div>
                    <label class="text-[10px] text-slate-400">Screen Name</label>
                    <input type="text" v-model="currentHmiScreen.name" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white" />
                  </div>
                  <div>
                    <label class="text-[10px] text-slate-400">Description</label>
                    <textarea v-model="currentHmiScreen.description" rows="2" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"></textarea>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="text-[10px] text-slate-400">Width (px)</label>
                      <input type="number" v-model.number="currentHmiScreen.canvasConfig.width" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono" />
                    </div>
                    <div>
                      <label class="text-[10px] text-slate-400">Height (px)</label>
                      <input type="number" v-model.number="currentHmiScreen.canvasConfig.height" class="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono" />
                    </div>
                  </div>
                  <div>
                    <label class="text-[10px] text-slate-400">Background Color</label>
                    <div class="flex items-center gap-2">
                      <input type="color" v-model="currentHmiScreen.canvasConfig.background" class="w-8 h-8 rounded bg-transparent cursor-pointer border border-slate-700" />
                      <input type="text" v-model="currentHmiScreen.canvasConfig.background" class="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs" />
                    </div>
                  </div>
                  <div class="flex items-center justify-between pt-2">
                    <label class="text-[11px] text-slate-300">Show Snap Grid</label>
                    <input type="checkbox" v-model="currentHmiScreen.canvasConfig.showGrid" class="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 bg-slate-950 border-slate-700" />
                  </div>
                  <div class="pt-2 text-[10px] text-slate-500">
                    Total Widgets: <span class="text-sky-400 font-mono font-bold">{{ currentHmiScreen.widgets.length }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

`;

export const HMI_STUDIO_MODALS = `
    <!-- MODAL: CREATE HMI SCREEN -->
    <div v-if="createHmiModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 class="text-sm font-bold text-white uppercase flex items-center gap-2">
            <i class="fa-solid fa-palette text-amber-400"></i>
            <span>Create New HMI Screen</span>
          </h3>
          <button @click="createHmiModal = false" class="text-slate-400 hover:text-white cursor-pointer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 font-medium mb-1">Screen Name *</label>
            <input type="text" v-model="newHmiScreenForm.name" placeholder="e.g. Tank Farm Overview" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white" />
          </div>
          <div>
            <label class="block text-slate-400 font-medium mb-1">Description</label>
            <textarea v-model="newHmiScreenForm.description" rows="2" placeholder="Process area description..." class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 font-medium mb-1">Resolution Preset</label>
              <select @change="(e) => { const p = e.target.value.split('x'); newHmiScreenForm.width = Number(p[0]); newHmiScreenForm.height = Number(p[1]); }" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white">
                <option value="1280x720">1280×720 (720p HMI)</option>
                <option value="1920x1080">1920×1080 (1080p FHD)</option>
                <option value="1024x600">1024×600 (7&quot; Wecon)</option>
                <option value="800x480">800×480 (4.3&quot; Wecon)</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-400 font-medium mb-1">Background</label>
              <div class="flex items-center gap-2">
                <input type="color" v-model="newHmiScreenForm.background" class="w-8 h-8 rounded bg-transparent border border-slate-700 cursor-pointer" />
                <input type="text" v-model="newHmiScreenForm.background" class="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs" />
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button @click="createHmiModal = false" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer">
            Cancel
          </button>
          <button @click="submitCreateHmiScreen" class="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer shadow-md">
            Create Screen
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: ADD SENSOR / SERIES TO TREND CHART (Y-AXIS) -->
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

    <!-- MODAL: HMI SCREEN RBAC PERMISSIONS -->
    <div v-if="hmiRbacModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 class="text-sm font-bold text-white uppercase flex items-center gap-2">
            <i class="fa-solid fa-user-shield text-sky-400"></i>
            <span>Screen Access Permissions (RBAC)</span>
          </h3>
          <button @click="hmiRbacModal = false" class="text-slate-400 hover:text-white cursor-pointer">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <p class="text-xs text-slate-400">
          Select the roles that are authorized to view and interact with screen
          <span class="text-sky-300 font-semibold">'{{ currentHmiScreen?.name }}'</span> in Runtime Mode.
        </p>

        <div class="space-y-2 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <label v-for="r in rolesList" :key="r.id || r.code" class="flex items-center gap-2.5 p-1.5 rounded hover:bg-slate-900 cursor-pointer">
            <input type="checkbox" :value="r.code || r.name" v-model="selectedScreenRoles" class="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 bg-slate-900 border-slate-700" />
            <span class="font-semibold text-slate-200">{{ r.name || r.code }}</span>
            <span class="text-[10px] text-slate-500 font-mono">({{ r.code || r.name }})</span>
          </label>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button @click="hmiRbacModal = false" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer">
            Cancel
          </button>
          <button @click="saveHmiRbac" class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-md">
            Save Permissions
          </button>
        </div>
      </div>
    </div>

`;
