/**
 * C-Module: LoRaWAN Test Automation & Scenario Builder
 * Dual-Mode Visual Interface:
 *  1. Node-RED Style Visual Flow Canvas (Draggable / Connected Assertion Nodes)
 *  2. Function Script Editor (JavaScript Sandbox evaluation with live variable cheatsheet)
 * Includes real-time Dry-Run testing against Decoder-extracted telemetry fields.
 */

export const TEST_BUILDER_TEMPLATE = `
  <!-- C-MODULE: TEST AUTOMATION & SCENARIO BUILDER -->
  <div class="space-y-5">

    <!-- Top Action & Selection Bar -->
    <div class="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col xl:flex-row xl:items-center justify-between gap-4">
      
      <!-- Left: Template Selector & Metadata -->
      <div class="flex items-center gap-3 flex-wrap">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <i class="fa-solid fa-vial-circle-check text-sm"></i>
          </div>
          <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Scenario:</span>
        </div>

        <select
          v-model="activeTestTemplateId"
          @change="onTestTemplateSelectChange"
          class="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-w-[260px]"
        >
          <option v-for="t in testTemplatesList" :key="t.id" :value="t.id">
            {{ t.name }} ({{ t.code }})
          </option>
        </select>

        <!-- Metadata Badges -->
        <div v-if="activeTestTemplate" class="flex items-center gap-2 flex-wrap text-xs">
          <span class="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono text-slate-300 flex items-center gap-1.5">
            <i class="fa-solid fa-microchip text-[10px] text-sky-400"></i>
            <span>SKU: <strong class="text-sky-300">{{ activeTestTemplate.sku }}</strong></span>
          </span>

          <span class="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 font-mono text-indigo-300 font-semibold flex items-center gap-1.5">
            <i class="fa-solid fa-code-branch text-[10px]"></i>
            <span>FW: {{ formatFirmware(activeTestTemplate.firmwareVersion) }}</span>
          </span>

          <span class="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono text-slate-300">
            Timeout: <strong class="text-white">{{ activeTestTemplate.timeoutSeconds }}s</strong>
          </span>

          <span class="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono text-slate-300">
            Min Packets: <strong class="text-amber-400">{{ activeTestTemplate.minPacketsRequired }}</strong>
          </span>
        </div>
      </div>

      <!-- Center / Right: Mode Switcher & Actions -->
      <div class="flex items-center gap-2.5 flex-wrap">
        
        <!-- Mode Switcher Tabs -->
        <div class="p-1 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-1">
          <button
            type="button"
            @click="testBuilderMode = 'FLOW'"
            :class="testBuilderMode === 'FLOW' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer"
          >
            <i class="fa-solid fa-diagram-project text-xs"></i>
            <span>Node-RED Flow</span>
          </button>
          <button
            type="button"
            @click="testBuilderMode = 'SCRIPT'"
            :class="testBuilderMode === 'SCRIPT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer"
          >
            <i class="fa-solid fa-code text-xs"></i>
            <span>Function Script</span>
          </button>
        </div>

        <!-- Dry-Run Button -->
        <button
          type="button"
          @click="openDryRunModal"
          class="px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 cursor-pointer transition active:scale-95 shadow-sm"
          title="Dry-run scenario in Sandbox"
        >
          <i class="fa-solid fa-bolt text-xs text-amber-400"></i>
          <span>Dry-Run Test</span>
        </button>

        <!-- New Template -->
        <button
          type="button"
          @click="openCreateTestTemplateModal"
          class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition active:scale-95"
        >
          <i class="fa-solid fa-plus text-xs text-sky-400"></i>
          <span>New Scenario</span>
        </button>

        <!-- Save Template -->
        <button
          type="button"
          @click="saveCurrentTestTemplate"
          :disabled="isSavingTestTemplate"
          class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 transition active:scale-95"
        >
          <i class="fa-solid" :class="isSavingTestTemplate ? 'fa-spinner fa-spin' : 'fa-floppy-disk'"></i>
          <span>{{ isSavingTestTemplate ? 'Saving...' : 'Save Scenario' }}</span>
        </button>

        <!-- Delete Template -->
        <button
          type="button"
          @click="openDeleteTestTemplateModal"
          class="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-bold cursor-pointer transition"
          title="Delete Scenario"
        >
          <i class="fa-solid fa-trash-can text-xs"></i>
        </button>
      </div>
    </div>

    <!-- MAIN BUILDER WORKSPACE -->
    <div v-if="activeTestTemplate" class="relative">

      <!-- ================================================================= -->
      <!-- MODE 1: NODE-RED STYLE VISUAL FLOW BUILDER                         -->
      <!-- ================================================================= -->
      <div v-show="testBuilderMode === 'FLOW'" class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        <!-- Left Palette (Node Toolbox) -->
        <div class="lg:col-span-3 space-y-4">
          <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <i class="fa-solid fa-cubes text-indigo-400"></i>
                <span>Node Palette</span>
              </span>
              <span class="text-[10px] text-slate-500">Click to add node</span>
            </div>

            <!-- Palette Items -->
            <div class="space-y-3">
              <!-- Group 1: Telemetry Ingestion -->
              <div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <i class="fa-solid fa-satellite-dish text-sky-400 text-[10px]"></i>
                  <span>Ingestion</span>
                </div>
                <div class="space-y-1.5">
                  <button
                    type="button"
                    @click="addFlowNode('lora-in')"
                    class="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 flex items-center justify-between transition group cursor-pointer"
                  >
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 text-xs">
                        <i class="fa-solid fa-satellite-dish"></i>
                      </div>
                      <div>
                        <div class="text-xs font-semibold text-slate-200 group-hover:text-sky-300">LoRaWAN Ingestion</div>
                        <div class="text-[10px] text-slate-500">Uplink event packet trigger</div>
                      </div>
                    </div>
                    <i class="fa-solid fa-plus text-xs text-slate-600 group-hover:text-sky-400"></i>
                  </button>
                </div>
              </div>

              <!-- Group 2: Extraction & Processing -->
              <div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <i class="fa-solid fa-gears text-indigo-400 text-[10px]"></i>
                  <span>Extraction & Transform</span>
                </div>
                <div class="space-y-1.5">
                  <button
                    type="button"
                    @click="addFlowNode('extractor')"
                    class="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 flex items-center justify-between transition group cursor-pointer"
                  >
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 text-xs">
                        <i class="fa-solid fa-filter"></i>
                      </div>
                      <div>
                        <div class="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">Field Extractor</div>
                        <div class="text-[10px] text-slate-500">Extract sensor field from payload</div>
                      </div>
                    </div>
                    <i class="fa-solid fa-plus text-xs text-slate-600 group-hover:text-indigo-400"></i>
                  </button>

                  <button
                    type="button"
                    @click="addFlowNode('moving_average')"
                    class="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between transition group cursor-pointer"
                  >
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-xs">
                        <i class="fa-solid fa-chart-line"></i>
                      </div>
                      <div>
                        <div class="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">Moving Average</div>
                        <div class="text-[10px] text-slate-500">Statistical aggregation & stddev</div>
                      </div>
                    </div>
                    <i class="fa-solid fa-plus text-xs text-slate-600 group-hover:text-cyan-400"></i>
                  </button>

                  <button
                    type="button"
                    @click="addFlowNode('function')"
                    class="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 flex items-center justify-between transition group cursor-pointer"
                  >
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 text-xs">
                        <i class="fa-solid fa-code"></i>
                      </div>
                      <div>
                        <div class="text-xs font-semibold text-slate-200 group-hover:text-teal-300">Custom Function</div>
                        <div class="text-[10px] text-slate-500">JavaScript sandbox script evaluation</div>
                      </div>
                    </div>
                    <i class="fa-solid fa-plus text-xs text-slate-600 group-hover:text-teal-400"></i>
                  </button>
                </div>
              </div>

              <!-- Group 3: Comparison & QA Rules -->
              <div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <i class="fa-solid fa-scale-balanced text-amber-400 text-[10px]"></i>
                  <span>Validation & Rules</span>
                </div>
                <div class="space-y-1.5">
                  <button
                    type="button"
                    @click="addFlowNode('comparator')"
                    class="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 flex items-center justify-between transition group cursor-pointer"
                  >
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xs">
                        <i class="fa-solid fa-scale-balanced"></i>
                      </div>
                      <div>
                        <div class="text-xs font-semibold text-slate-200 group-hover:text-amber-300">Range / Comparator</div>
                        <div class="text-[10px] text-slate-500">Thresholds, bounds & operators</div>
                      </div>
                    </div>
                    <i class="fa-solid fa-plus text-xs text-slate-600 group-hover:text-amber-400"></i>
                  </button>

                  <button
                    type="button"
                    @click="addFlowNode('reference_device')"
                    class="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 flex items-center justify-between transition group cursor-pointer"
                  >
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 text-xs">
                        <i class="fa-solid fa-award"></i>
                      </div>
                      <div>
                        <div class="text-xs font-semibold text-slate-200 group-hover:text-purple-300">Reference Device</div>
                        <div class="text-[10px] text-slate-500">Golden Unit tolerance comparison</div>
                      </div>
                    </div>
                    <i class="fa-solid fa-plus text-xs text-slate-600 group-hover:text-purple-400"></i>
                  </button>

                  <button
                    type="button"
                    @click="addFlowNode('counter')"
                    class="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 flex items-center justify-between transition group cursor-pointer"
                  >
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs">
                        <i class="fa-solid fa-stopwatch"></i>
                      </div>
                      <div>
                        <div class="text-xs font-semibold text-slate-200 group-hover:text-emerald-300">Packet Counter</div>
                        <div class="text-[10px] text-slate-500">Gate minimum packet count</div>
                      </div>
                    </div>
                    <i class="fa-solid fa-plus text-xs text-slate-600 group-hover:text-emerald-400"></i>
                  </button>
                </div>
              </div>

              <!-- Group 4: Verdict & Output -->
              <div>
                <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <i class="fa-solid fa-flag-checkered text-rose-400 text-[10px]"></i>
                  <span>Verdict Sink</span>
                </div>
                <div class="space-y-1.5">
                  <button
                    type="button"
                    @click="addFlowNode('verdict')"
                    class="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/50 flex items-center justify-between transition group cursor-pointer"
                  >
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 text-xs">
                        <i class="fa-solid fa-flag-checkered"></i>
                      </div>
                      <div>
                        <div class="text-xs font-semibold text-slate-200 group-hover:text-rose-300">Verdict Output</div>
                        <div class="text-[10px] text-slate-500">Aggregated Pass/Fail QA result</div>
                      </div>
                    </div>
                    <i class="fa-solid fa-plus text-xs text-slate-600 group-hover:text-rose-400"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Available Decoder Fields -->
            <div class="pt-3 border-t border-slate-800">
              <div class="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                <span>Decoder Fields ({{ testAvailableFields.length }})</span>
                <button
                  type="button"
                  @click="fetchTestAvailableFields"
                  class="text-[10px] text-indigo-400 hover:text-indigo-300"
                  title="Reload fields"
                >
                  <i class="fa-solid fa-rotate-right"></i>
                </button>
              </div>
              <div class="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                <div
                  v-for="f in testAvailableFields"
                  :key="f.name"
                  @click="addExtractorNodeForField(f)"
                  class="p-2 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-indigo-500/40 flex items-center justify-between cursor-pointer group"
                >
                  <div class="flex items-center gap-1.5 truncate">
                    <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
                    <span class="font-mono text-slate-300 group-hover:text-indigo-300 truncate">{{ f.name }}</span>
                  </div>
                  <span v-if="f.unit" class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">{{ f.unit }}</span>
                </div>
              </div>
            </div>

            <!-- Export to Script button -->
            <div class="pt-2 border-t border-slate-800">
              <button
                type="button"
                @click="convertFlowToScript"
                class="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <i class="fa-solid fa-file-code text-indigo-400"></i>
                <span>Compile to JS Script</span>
              </button>
            </div>

          </div>
        </div>

        <!-- Canvas Flow Area -->
        <div class="lg:col-span-9 space-y-3">
          <div class="rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            
            <!-- Canvas Header & Toolbar -->
            <div class="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3 z-30">
              <div class="flex items-center gap-3 flex-wrap">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  PIPELINE: {{ activeTestTemplate.sku }} (FW: {{ formatFirmware(activeTestTemplate.firmwareVersion) }})
                </span>
                <span class="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400">
                  <strong class="text-white">{{ currentFlowNodes.length }}</strong> nodes
                </span>
                <span class="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400">
                  <strong class="text-indigo-400">{{ currentFlowEdges.length }}</strong> wires
                </span>

                <!-- In-progress Wire Connection Indicator -->
                <span v-if="wireDraft.active" class="px-2.5 py-0.5 rounded-md bg-sky-500/20 border border-sky-500/40 text-[11px] text-sky-300 font-semibold animate-pulse flex items-center gap-1.5">
                  <i class="fa-solid fa-link text-[10px]"></i>
                  <span>Connecting wire... Click target input port</span>
                  <button type="button" @click.stop="cancelWireDraft" class="ml-1 text-slate-400 hover:text-white">&times;</button>
                </span>
              </div>

              <!-- Canvas Action Buttons -->
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="autoArrangeNodes"
                  class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Auto-arrange nodes into sequential pipeline stages"
                >
                  <i class="fa-solid fa-network-wired text-indigo-400 text-xs"></i>
                  <span>Auto Arrange</span>
                </button>

                <button
                  type="button"
                  @click="autoWirePipeline"
                  class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Connect all sequential nodes automatically"
                >
                  <i class="fa-solid fa-bezier-curve text-sky-400 text-xs"></i>
                  <span>Auto Wire</span>
                </button>

                <button
                  type="button"
                  @click="clearFlowWires"
                  class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Remove all wire connections"
                >
                  <i class="fa-solid fa-eraser text-xs"></i>
                  <span>Clear Wires</span>
                </button>
              </div>
            </div>

            <!-- Visual Flow Wire Canvas Area -->
            <div
              ref="canvasContainerRef"
              @mousemove="onCanvasMouseMove"
              @mouseup="onCanvasMouseUp"
              @click="onCanvasClick"
              @contextmenu="onCanvasContextMenu"
              class="relative overflow-auto select-none min-h-[640px] h-[720px] bg-slate-950 cursor-default"
            >
              <!-- Workspace Grid Plane -->
              <div class="relative" style="min-width: 2200px; min-height: 1400px; width: 2200px; height: 1400px;">
                
                <!-- Background Grid Pattern -->
                <div class="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-35 pointer-events-none"></div>

                <!-- Interactive SVG Bézier Wire Layer -->
                <svg
                  class="absolute inset-0 pointer-events-none z-10"
                  style="width: 2200px; height: 1400px;"
                >
                  <defs>
                    <linearGradient id="flowWireGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="#38bdf8" />
                      <stop offset="100%" stop-color="#818cf8" />
                    </linearGradient>
                    <filter id="flowWireGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="2.5" flood-color="#6366f1" flood-opacity="0.6"/>
                    </filter>
                  </defs>

                  <!-- Rendered Wire Connections -->
                  <g v-for="edge in currentFlowEdges" :key="edge.id">
                    <!-- Invisible Wide Hit Path for right-click context menu -->
                    <path
                      :d="getEdgePath(edge)"
                      stroke="transparent"
                      stroke-width="24"
                      fill="none"
                      class="pointer-events-auto cursor-context-menu"
                      @contextmenu.prevent.stop="openWireContextMenu($event, edge)"
                    >
                      <title>Right-click wire for options</title>
                    </path>

                    <!-- Visible SVG Bézier Wire -->
                    <path
                      :d="getEdgePath(edge)"
                      :stroke="wireContextMenu.visible && wireContextMenu.edge && wireContextMenu.edge.id === edge.id ? '#38bdf8' : 'url(#flowWireGrad)'"
                      :stroke-width="wireContextMenu.visible && wireContextMenu.edge && wireContextMenu.edge.id === edge.id ? 4 : 3"
                      fill="none"
                      filter="url(#flowWireGlow)"
                      class="pointer-events-none"
                    />
                  </g>

                  <!-- Interactive In-progress Wire Draft -->
                  <path
                    v-if="wireDraft.active"
                    :d="getDraftWirePath()"
                    stroke="#38bdf8"
                    stroke-width="2.5"
                    stroke-dasharray="6,4"
                    fill="none"
                    class="pointer-events-none"
                  />
                </svg>

                <!-- Node Cards Layer -->
                <div class="relative z-20">
                  <div
                    v-for="node in currentFlowNodes"
                    :key="node.id"
                    class="absolute w-72 p-3.5 rounded-xl border transition shadow-xl bg-slate-900/95 backdrop-blur-sm"
                    :class="getNodeCardClass(node.type)"
                    :style="{ left: getNodePosX(node) + 'px', top: getNodePosY(node) + 'px' }"
                  >
                    <!-- Input Port Dot (Left) -->
                    <div
                      v-if="node.type !== 'lora-in' && node.type !== 'lora_in' && node.type !== 'trigger'"
                      @click.stop="onInputPortClick(node)"
                      class="absolute -left-3 top-5 w-5 h-5 rounded-full bg-slate-900 border-2 transition flex items-center justify-center shadow-lg z-30 cursor-pointer group/port"
                      :class="[
                        wireDraft.active
                          ? 'border-sky-400 ring-4 ring-sky-400/40 animate-pulse scale-110'
                          : 'border-slate-600 hover:border-indigo-400 hover:scale-125'
                      ]"
                      title="Input Port: Click to connect wire"
                    >
                      <span class="w-1.5 h-1.5 rounded-full" :class="wireDraft.active ? 'bg-sky-400' : 'bg-slate-400 group-hover/port:bg-indigo-400'"></span>
                    </div>

                    <!-- Output Port Dot (Right) -->
                    <div
                      v-if="node.type !== 'verdict' && node.type !== 'output'"
                      @click.stop="onOutputPortClick(node, $event)"
                      class="absolute -right-3 top-5 w-5 h-5 rounded-full bg-slate-900 border-2 transition flex items-center justify-center shadow-lg z-30 cursor-pointer group/port"
                      :class="[
                        wireDraft.active && wireDraft.fromNodeId === node.id
                          ? 'border-emerald-400 ring-4 ring-emerald-400/40 scale-110'
                          : 'border-slate-600 hover:border-emerald-400 hover:scale-125'
                      ]"
                      title="Output Port: Click to draw wire"
                    >
                      <span class="w-1.5 h-1.5 rounded-full" :class="wireDraft.active && wireDraft.fromNodeId === node.id ? 'bg-emerald-400' : 'bg-slate-400 group-hover/port:bg-emerald-400'"></span>
                    </div>

                    <!-- Draggable Node Header -->
                    <div
                      @mousedown="onNodeHeaderMouseDown($event, node)"
                      class="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800 cursor-grab active:cursor-grabbing select-none"
                    >
                      <div class="flex items-center gap-2 truncate">
                        <i class="fa-solid fa-grip-vertical text-slate-600 text-[10px]"></i>
                        <span
                          class="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                          :class="getNodeBadgeClass(node.type)"
                        >
                          <i :class="getNodeIcon(node.type)"></i>
                        </span>
                        <span class="text-xs font-bold text-white uppercase tracking-wider truncate">{{ getNodeDisplayName(node) }}</span>
                      </div>

                      <!-- Delete Node Button -->
                      <button
                        v-if="node.type !== 'lora-in' && node.type !== 'lora_in' && node.type !== 'verdict'"
                        type="button"
                        @click.stop="removeFlowNode(node.id)"
                        class="text-slate-500 hover:text-rose-400 text-xs p-1 transition ml-1 cursor-pointer"
                        title="Delete node"
                      >
                        <i class="fa-solid fa-xmark"></i>
                      </button>
                    </div>

                    <!-- Node Body Forms -->
                    <div class="space-y-2 text-xs">
                      
                      <!-- 1. LORA-IN NODE -->
                      <div v-if="node.type === 'lora-in' || node.type === 'lora_in'" class="space-y-1.5 font-mono text-[11px] text-slate-400">
                        <div>Event: <strong class="text-sky-300">Uplink Telemetry Event</strong></div>
                        <div>Target SKU: <strong class="text-white">{{ activeTestTemplate.sku }}</strong></div>
                        <div>Firmware: <strong class="text-indigo-300">{{ formatFirmware(activeTestTemplate.firmwareVersion) }}</strong></div>
                      </div>

                      <!-- 2. EXTRACTOR NODE -->
                      <div v-if="node.type === 'extractor'" class="space-y-1.5">
                        <label class="block text-[10px] text-slate-400 font-semibold">Select telemetry field:</label>
                        <select
                          v-model="node.params.field"
                          @change="onExtractorFieldChange(node)"
                          class="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:border-indigo-500"
                        >
                          <option v-for="f in testAvailableFields" :key="f.name" :value="f.name">
                            {{ f.name }} ({{ getFieldEnglishLabel(f) }})
                          </option>
                        </select>
                        <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                          <span>Unit: {{ node.params.unit || 'N/A' }}</span>
                          <span class="text-indigo-400 truncate max-w-[140px]">Path: decoded.{{ node.params.field }}</span>
                        </div>
                      </div>

                      <!-- 3. REFERENCE DEVICE NODE (Golden Unit) -->
                      <div v-if="node.type === 'reference_device' || node.type === 'golden_unit'" class="space-y-1.5">
                        <div class="grid grid-cols-2 gap-1.5">
                          <div>
                            <label class="block text-[10px] text-slate-400">Field:</label>
                            <select
                              v-model="node.params.field"
                              class="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                            >
                              <option v-for="f in testAvailableFields" :key="f.name" :value="f.name">{{ f.name }}</option>
                            </select>
                          </div>
                          <div>
                            <label class="block text-[10px] text-slate-400">Tolerance Type:</label>
                            <select
                              v-model="node.params.toleranceType"
                              class="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                            >
                              <option value="ABSOLUTE">Absolute (Δ)</option>
                              <option value="PERCENTAGE">Percentage (%)</option>
                            </select>
                          </div>
                        </div>
                        <div class="grid grid-cols-2 gap-1.5">
                          <div>
                            <label class="block text-[10px] text-slate-400">Reference Unit:</label>
                            <input
                              v-model="node.params.devEUI"
                              placeholder="REF-GOLDEN-01"
                              class="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label class="block text-[10px] text-slate-400">Tolerance (±):</label>
                            <input
                              type="number"
                              step="0.1"
                              v-model.number="node.params.tolerance"
                              class="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                            />
                          </div>
                        </div>
                        <div class="flex items-center justify-between pt-1">
                          <span class="text-[10px] text-slate-400">Severity:</span>
                          <div class="flex items-center gap-1">
                            <button
                              type="button"
                              @click="node.params.severity = 'ERROR'"
                              :class="node.params.severity === 'ERROR' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'text-slate-500 border-transparent'"
                              class="px-2 py-0.5 rounded border text-[10px] font-bold uppercase transition cursor-pointer"
                            >
                              Fail
                            </button>
                            <button
                              type="button"
                              @click="node.params.severity = 'WARNING'"
                              :class="node.params.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'text-slate-500 border-transparent'"
                              class="px-2 py-0.5 rounded border text-[10px] font-bold uppercase transition cursor-pointer"
                            >
                              Warn
                            </button>
                          </div>
                        </div>
                      </div>

                      <!-- 4. MOVING AVERAGE / AGGREGATION NODE -->
                      <div v-if="node.type === 'moving_average' || node.type === 'aggregation'" class="space-y-1.5">
                        <div class="grid grid-cols-2 gap-1.5">
                          <div>
                            <label class="block text-[10px] text-slate-400">Field:</label>
                            <select
                              v-model="node.params.field"
                              class="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                            >
                              <option v-for="f in testAvailableFields" :key="f.name" :value="f.name">{{ f.name }}</option>
                            </select>
                          </div>
                          <div>
                            <label class="block text-[10px] text-slate-400">Mode:</label>
                            <select
                              v-model="node.params.mode"
                              class="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                            >
                              <option value="avg">Mean (μ)</option>
                              <option value="stddev">StdDev (σ)</option>
                              <option value="delta">Peak-to-Peak (Δ)</option>
                              <option value="min">Minimum</option>
                              <option value="max">Maximum</option>
                            </select>
                          </div>
                        </div>
                        <div class="grid grid-cols-2 gap-1.5">
                          <div>
                            <label class="block text-[10px] text-slate-400">Window Size:</label>
                            <input
                              type="number"
                              min="2"
                              max="100"
                              v-model.number="node.params.windowSize"
                              class="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label class="block text-[10px] text-slate-400">Max StdDev (σ):</label>
                            <input
                              type="number"
                              step="0.1"
                              v-model.number="node.params.maxStdDev"
                              class="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                            />
                          </div>
                        </div>
                        <div class="flex items-center justify-between pt-1">
                          <span class="text-[10px] text-slate-400">Severity:</span>
                          <div class="flex items-center gap-1">
                            <button
                              type="button"
                              @click="node.params.severity = 'ERROR'"
                              :class="node.params.severity === 'ERROR' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'text-slate-500 border-transparent'"
                              class="px-2 py-0.5 rounded border text-[10px] font-bold uppercase transition cursor-pointer"
                            >
                              Fail
                            </button>
                            <button
                              type="button"
                              @click="node.params.severity = 'WARNING'"
                              :class="node.params.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'text-slate-500 border-transparent'"
                              class="px-2 py-0.5 rounded border text-[10px] font-bold uppercase transition cursor-pointer"
                            >
                              Warn
                            </button>
                          </div>
                        </div>
                      </div>

                      <!-- 5. COMPARATOR / RULE NODE -->
                      <div v-if="node.type === 'comparator'" class="space-y-1.5">
                        <div class="grid grid-cols-2 gap-1.5">
                          <div>
                            <label class="block text-[10px] text-slate-400">Field:</label>
                            <select
                              v-model="node.params.field"
                              class="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                            >
                              <option v-for="f in testAvailableFields" :key="f.name" :value="f.name">{{ f.name }}</option>
                            </select>
                          </div>
                          <div>
                            <label class="block text-[10px] text-slate-400">Operator:</label>
                            <select
                              v-model="node.params.operator"
                              class="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                            >
                              <option value="EQUALS">== Equals</option>
                              <option value="NOT_EQUALS">!= Not Equals</option>
                              <option value="GREATER_THAN">&gt; Greater Than</option>
                              <option value="LESS_THAN">&lt; Less Than</option>
                              <option value="BETWEEN">Range [Min, Max]</option>
                            </select>
                          </div>
                        </div>

                        <!-- Value inputs -->
                        <div v-if="node.params.operator === 'BETWEEN'" class="grid grid-cols-2 gap-1.5">
                          <div>
                            <label class="block text-[10px] text-slate-400">Min:</label>
                            <input
                              type="number"
                              v-model.number="node.params.min"
                              class="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label class="block text-[10px] text-slate-400">Max:</label>
                            <input
                              type="number"
                              v-model.number="node.params.max"
                              class="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                            />
                          </div>
                        </div>
                        <div v-else>
                          <label class="block text-[10px] text-slate-400">Expected value:</label>
                          <input
                            v-model="node.params.value"
                            class="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                          />
                        </div>

                        <!-- Severity selection -->
                        <div class="flex items-center justify-between pt-1">
                          <span class="text-[10px] text-slate-400">Severity:</span>
                          <div class="flex items-center gap-1">
                            <button
                              type="button"
                              @click="node.params.severity = 'ERROR'"
                              :class="node.params.severity === 'ERROR' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'text-slate-500 border-transparent'"
                              class="px-2 py-0.5 rounded border text-[10px] font-bold uppercase transition cursor-pointer"
                            >
                              Fail
                            </button>
                            <button
                              type="button"
                              @click="node.params.severity = 'WARNING'"
                              :class="node.params.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'text-slate-500 border-transparent'"
                              class="px-2 py-0.5 rounded border text-[10px] font-bold uppercase transition cursor-pointer"
                            >
                              Warn
                            </button>
                          </div>
                        </div>
                      </div>

                      <!-- 6. CUSTOM FUNCTION NODE -->
                      <div v-if="node.type === 'function' || node.type === 'script'" class="space-y-1.5">
                        <div class="p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-teal-300 max-h-14 overflow-hidden">
                          <div class="truncate">{{ getNodeScriptPreview(node.params?.code, 0) }}</div>
                          <div class="text-slate-500 truncate">{{ getNodeScriptPreview(node.params?.code, 1) }}</div>
                        </div>
                        <button
                          type="button"
                          @click="openFunctionScriptModal(node)"
                          class="w-full py-1.5 px-3 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/40 text-teal-300 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                          <i class="fa-solid fa-code text-xs"></i>
                          <span>Edit Function Script</span>
                        </button>
                      </div>

                      <!-- 7. COUNTER NODE -->
                      <div v-if="node.type === 'counter'" class="space-y-1.5">
                        <div>
                          <label class="block text-[10px] text-slate-400">Min packet count:</label>
                          <input
                            type="number"
                            v-model.number="node.params.minPackets"
                            min="1"
                            class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                          />
                        </div>
                        <div class="text-[10px] text-slate-500">
                          Passes when device sends at least {{ node.params.minPackets }} packets.
                        </div>
                      </div>

                      <!-- 8. VERDICT OUTPUT NODE -->
                      <div v-if="node.type === 'verdict' || node.type === 'output'" class="space-y-1.5 font-mono text-[11px] text-slate-400">
                        <div class="text-emerald-400 font-bold flex items-center gap-1.5">
                          <i class="fa-solid fa-check-double"></i>
                          <span>QA Verdict Evaluation</span>
                        </div>
                        <div>Auto-stop on pass: <strong class="text-white">ON</strong></div>
                        <div>Verdict: <strong class="text-emerald-300">PASS</strong> / <strong class="text-rose-400">FAIL</strong></div>
                      </div>

                    </div>
                  </div>
                </div>

                <!-- Wire Right-Click Context Menu -->
                <div
                  v-if="wireContextMenu.visible && wireContextMenu.edge"
                  :style="{ left: wireContextMenu.x + 'px', top: wireContextMenu.y + 'px' }"
                  class="absolute z-50 w-64 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-2xl p-2 backdrop-blur-md text-xs select-none"
                  @click.stop
                  @contextmenu.prevent.stop
                >
                  <div class="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                    <span class="flex items-center gap-1.5 truncate">
                      <i class="fa-solid fa-network-wired text-indigo-400"></i>
                      <span>Wire Connection</span>
                    </span>
                    <button type="button" @click="closeWireContextMenu" class="text-slate-500 hover:text-white cursor-pointer ml-2">
                      <i class="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                  <div class="py-1 space-y-1">
                    <button
                      type="button"
                      @click="inspectWireConnection(wireContextMenu.edge)"
                      class="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <i class="fa-solid fa-circle-info text-sky-400 text-xs"></i>
                      <span>Inspect Connection</span>
                    </button>
                    <button
                      type="button"
                      @click="deleteWireFromMenu(wireContextMenu.edge)"
                      class="w-full text-left px-2.5 py-2 rounded-lg hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <i class="fa-solid fa-trash-can text-rose-400 text-xs"></i>
                      <span>Delete Wire Connection</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            <!-- Canvas Bottom Summary Bar -->
            <div class="p-3.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2 z-30">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-circle-info text-indigo-400"></i>
                <span>Visual flow DAG compiles automatically to Graph Engine assertions and database criteria.</span>
              </div>
              <button
                type="button"
                @click="compileFlowToAssertions"
                class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <i class="fa-solid fa-arrows-rotate text-xs"></i>
                <span>Sync Assertions</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      <!-- ================================================================= -->
      <!-- MODE 2: FUNCTION SCRIPT EDITOR (JAVASCRIPT VM SANDBOX)             -->
      <!-- ================================================================= -->
      <div v-show="testBuilderMode === 'SCRIPT'" class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        <!-- Script Editor -->
        <div class="lg:col-span-9 space-y-3">
          <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            
            <!-- Code Editor Header -->
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-rose-500"></div>
                <div class="w-3 h-3 rounded-full bg-amber-500"></div>
                <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span class="text-xs font-mono font-bold text-slate-300 ml-2">evaluate(packet, context)</span>
              </div>

              <div class="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span class="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Node.js VM Sandbox</span>
                <span class="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Timeout: 500ms</span>
              </div>
            </div>

            <!-- Code Textarea -->
            <textarea
              v-model="activeTestTemplate.customScript"
              rows="18"
              spellcheck="false"
              class="w-full p-4 bg-slate-950 text-emerald-300 font-mono text-xs rounded-xl border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none leading-relaxed resize-y"
              placeholder="function evaluate(packet, context) { ... return { pass: true }; }"
            ></textarea>

            <!-- Script Footer Advice -->
            <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-lightbulb text-amber-400"></i>
                <span>Return object matching <code class="text-indigo-300">{ pass: true/false, reason: '...' }</code> to determine pass/fail verdict.</span>
              </div>
              <button
                type="button"
                @click="insertSampleScript"
                class="text-indigo-400 hover:text-indigo-300 text-xs font-semibold"
              >
                Insert sample script
              </button>
            </div>

          </div>
        </div>

        <!-- Right Cheatsheet: Available Decoder Variables -->
        <div class="lg:col-span-3 space-y-4">
          <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            
            <div class="pb-2 border-b border-slate-800">
              <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <i class="fa-solid fa-code text-indigo-400"></i>
                <span>Available Variables</span>
              </span>
              <p class="text-[10px] text-slate-500 mt-1">Click variable to insert into code</p>
            </div>

            <!-- Predefined Objects -->
            <div class="space-y-2 text-xs">
              <div class="text-[11px] font-bold text-slate-400 uppercase">1. Packet Properties (packet)</div>
              <div class="space-y-1 font-mono text-[11px]">
                <div @click="insertCodeSnippet('packet.rssi')" class="p-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-sky-400 cursor-pointer flex justify-between">
                  <span>packet.rssi</span>
                  <span class="text-slate-500 text-[10px]">dBm</span>
                </div>
                <div @click="insertCodeSnippet('packet.snr')" class="p-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-sky-400 cursor-pointer flex justify-between">
                  <span>packet.snr</span>
                  <span class="text-slate-500 text-[10px]">dB</span>
                </div>
                <div @click="insertCodeSnippet('packet.fPort')" class="p-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-sky-400 cursor-pointer flex justify-between">
                  <span>packet.fPort</span>
                  <span class="text-slate-500 text-[10px]">Port</span>
                </div>
              </div>

              <div class="text-[11px] font-bold text-slate-400 uppercase pt-2">2. Sensor Telemetry (packet.decoded)</div>
              <div class="space-y-1 font-mono text-[11px] max-h-48 overflow-y-auto pr-1">
                <div
                  v-for="f in testAvailableFields"
                  :key="f.name"
                  @click="insertCodeSnippet('packet.decoded.' + f.name)"
                  class="p-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-emerald-400 cursor-pointer flex justify-between"
                >
                  <span class="truncate">packet.decoded.{{ f.name }}</span>
                  <span class="text-slate-500 text-[10px] ml-1">{{ f.unit || '' }}</span>
                </div>
              </div>

              <div class="text-[11px] font-bold text-slate-400 uppercase pt-2">3. Session Context (context)</div>
              <div class="space-y-1 font-mono text-[11px]">
                <div @click="insertCodeSnippet('context.packetCount')" class="p-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-amber-400 cursor-pointer flex justify-between">
                  <span>context.packetCount</span>
                  <span class="text-slate-500 text-[10px]">Received</span>
                </div>
                <div @click="insertCodeSnippet('context.minPackets')" class="p-1.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800/80 text-amber-400 cursor-pointer flex justify-between">
                  <span>context.minPackets</span>
                  <span class="text-slate-500 text-[10px]">Target</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>

    <!-- Empty State -->
    <div v-else class="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-2xl">
        <i class="fa-solid fa-vial-virus"></i>
      </div>
      <div class="space-y-1">
        <h3 class="text-base font-bold text-white">No test scenario selected</h3>
        <p class="text-xs text-slate-400">Select a scenario from the list or click "Create New" to start configuring.</p>
      </div>
      <button
        type="button"
        @click="openCreateTestTemplateModal"
        class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition shadow-lg shadow-indigo-600/20"
      >
        Create New Test Scenario
      </button>
    </div>

  </div>
`;

export const TEST_BUILDER_MODALS = `
  <!-- MODAL: DRY-RUN SANDBOX TEST -->
  <div v-if="showDryRunModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
    <div class="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden space-y-4 p-6">
      
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <i class="fa-solid fa-bolt text-sm"></i>
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">Sandbox Dry-Run Simulator</h3>
            <p class="text-xs text-slate-400">Simulate uplink packets to test all conditions and scripts</p>
          </div>
        </div>
        <button @click="showDryRunModal = false" class="text-slate-400 hover:text-white transition">
          <i class="fa-solid fa-xmark text-base"></i>
        </button>
      </div>

      <!-- Dry Run Form -->
      <div class="space-y-3 text-xs">
        <div>
          <label class="block text-slate-300 font-semibold mb-1">Mock Packet Data (JSON Payload):</label>
          <textarea
            v-model="dryRunPayloadRaw"
            rows="6"
            class="w-full p-3 bg-slate-950 text-emerald-300 font-mono text-xs rounded-xl border border-slate-800 focus:border-amber-500 outline-none"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-400 mb-1">Simulated packet count (packetCount):</label>
            <input
              type="number"
              v-model.number="dryRunContext.packetCount"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>
          <div>
            <label class="block text-slate-400 mb-1">Simulated duration (durationSeconds):</label>
            <input
              type="number"
              v-model.number="dryRunContext.durationSeconds"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>
        </div>

        <!-- Dry Run Results Box -->
        <div v-if="dryRunResponse" class="p-4 rounded-xl border" :class="dryRunResponse.pass ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-rose-950/20 border-rose-500/40'">
          <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span class="font-bold flex items-center gap-2" :class="dryRunResponse.pass ? 'text-emerald-400' : 'text-rose-400'">
              <i class="fa-solid" :class="dryRunResponse.pass ? 'fa-circle-check' : 'fa-circle-xmark'"></i>
              <span>VERDICT: {{ dryRunResponse.pass ? 'PASSED' : 'FAILED' }}</span>
            </span>
            <span class="text-[11px] font-mono text-slate-400">{{ dryRunResponse.executionTimeMs }}ms</span>
          </div>
          <p class="text-xs text-slate-300 mb-2">{{ dryRunResponse.summary }}</p>

          <!-- Assertion results list -->
          <div v-if="dryRunResponse.assertionResults && dryRunResponse.assertionResults.length > 0" class="space-y-1 text-[11px] font-mono">
            <div
              v-for="r in dryRunResponse.assertionResults"
              :key="r.fieldName"
              class="flex items-center justify-between p-1.5 rounded bg-slate-900/80"
            >
              <span class="text-slate-300">{{ r.fieldName }} ({{ r.operator }}): {{ r.message }}</span>
              <span :class="r.pass ? 'text-emerald-400' : (r.severity === 'ERROR' ? 'text-rose-400' : 'text-amber-400')">
                {{ r.pass ? 'PASS' : (r.severity === 'ERROR' ? 'FAIL' : 'WARN') }}
              </span>
            </div>
          </div>

          <!-- Script result -->
          <div v-if="dryRunResponse.scriptResult" class="mt-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
            <div>Script Verdict: <strong :class="dryRunResponse.scriptResult.pass ? 'text-emerald-400' : 'text-rose-400'">{{ dryRunResponse.scriptResult.pass ? 'PASS' : 'FAIL' }}</strong></div>
            <div v-if="dryRunResponse.scriptResult.reason" class="text-rose-300 mt-0.5">Reason: {{ dryRunResponse.scriptResult.reason }}</div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
        <button
          type="button"
          @click="showDryRunModal = false"
          class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
        >
          Close
        </button>
        <button
          type="button"
          @click="executeDryRun"
          :disabled="isRunningDryRun"
          class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer"
        >
          <i class="fa-solid" :class="isRunningDryRun ? 'fa-spinner fa-spin' : 'fa-play'"></i>
          <span>{{ isRunningDryRun ? 'Running...' : 'Run Test Now' }}</span>
        </button>
      </div>

    </div>
  </div>

  <!-- MODAL: CREATE TEST TEMPLATE -->
  <div v-if="showCreateTestTemplateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
    <div class="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden space-y-4 p-6">
      
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <i class="fa-solid fa-plus text-sm"></i>
          </div>
          <h3 class="text-sm font-bold text-white">Create New Test Scenario</h3>
        </div>
        <button @click="showCreateTestTemplateModal = false" class="text-slate-400 hover:text-white transition">
          <i class="fa-solid fa-xmark text-base"></i>
        </button>
      </div>

      <div class="space-y-3 text-xs">
        <div>
          <label class="block text-slate-300 font-semibold mb-1">Scenario Name (*):</label>
          <input
            v-model="newTestTemplateForm.name"
            placeholder="e.g. Factory Acceptance Test WSLRW-CO2"
            class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-slate-300 font-semibold mb-1">Scenario Code (*):</label>
            <input
              v-model="newTestTemplateForm.code"
              placeholder="e.g. TPL_CO2_EXP"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase"
            />
          </div>
          <div>
            <label class="block text-slate-300 font-semibold mb-1">Device SKU (*):</label>
            <input
              v-model="newTestTemplateForm.sku"
              placeholder="e.g. WSLRW-CO2"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase"
            />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-slate-400 mb-1">Firmware (*):</label>
            <input
              v-model="newTestTemplateForm.firmwareVersion"
              placeholder="1"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>
          <div>
            <label class="block text-slate-400 mb-1">Timeout (s):</label>
            <input
              type="number"
              v-model.number="newTestTemplateForm.timeoutSeconds"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>
          <div>
            <label class="block text-slate-400 mb-1">Min Packets:</label>
            <input
              type="number"
              v-model.number="newTestTemplateForm.minPacketsRequired"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>
        </div>

        <div>
          <label class="block text-slate-400 mb-1">Description:</label>
          <textarea
            v-model="newTestTemplateForm.description"
            rows="2"
            class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
          ></textarea>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
        <button
          type="button"
          @click="showCreateTestTemplateModal = false"
          class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="createTestTemplate"
          :disabled="isCreatingTestTemplate"
          class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer"
        >
          <i class="fa-solid" :class="isCreatingTestTemplate ? 'fa-spinner fa-spin' : 'fa-check'"></i>
          <span>{{ isCreatingTestTemplate ? 'Creating...' : 'Create Scenario' }}</span>
        </button>
      </div>

    </div>
  </div>

  <!-- MODAL: CUSTOM FUNCTION SCRIPT EDITOR -->
  <div v-if="showFunctionScriptModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
    <div class="w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- Modal Header -->
      <div class="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
            <i class="fa-solid fa-code text-base"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-bold text-white">Custom Function Script Editor</h3>
              <span class="px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/30 text-[10px] font-mono text-teal-300 font-semibold">
                {{ editingFunctionNode ? editingFunctionNode.label : 'Function Node' }}
              </span>
            </div>
            <p class="text-xs text-slate-400">Execute JavaScript VM evaluation with real-time telemetry variables</p>
          </div>
        </div>
        <button @click="showFunctionScriptModal = false" class="text-slate-400 hover:text-white transition p-1 cursor-pointer">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <!-- Modal Body Grid -->
      <div class="p-4 sm:p-5 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        
        <!-- Left Code Editor Column -->
        <div class="lg:col-span-8 space-y-3">
          <div class="flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
              <span class="text-slate-300 font-bold">evaluate(msg, context, node)</span>
            </div>
            <button
              type="button"
              @click="testFunctionScriptInModal"
              :disabled="isTestingFunctionScript"
              class="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-sans text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <i class="fa-solid" :class="isTestingFunctionScript ? 'fa-spinner fa-spin' : 'fa-play text-[10px]'"></i>
              <span>Verify & Run</span>
            </button>
          </div>

          <textarea
            v-model="functionScriptBuffer"
            rows="15"
            spellcheck="false"
            class="w-full p-3.5 bg-slate-950 text-emerald-300 font-mono text-xs rounded-xl border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none leading-relaxed resize-y"
            placeholder="// Enter custom JavaScript function logic..."
          ></textarea>

          <!-- Test / Sandbox Execution Result Output -->
          <div
            v-if="functionScriptTestResult"
            class="p-3 rounded-xl border text-xs font-mono"
            :class="functionScriptTestResult.success ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/20 border-rose-500/40 text-rose-300'"
          >
            <div class="flex items-center justify-between pb-1 mb-1 border-b border-slate-800/80">
              <span class="font-bold flex items-center gap-1.5">
                <i class="fa-solid" :class="functionScriptTestResult.success ? 'fa-circle-check text-emerald-400' : 'fa-circle-xmark text-rose-400'"></i>
                <span>{{ functionScriptTestResult.success ? 'Syntax Valid & Sandbox Execution Succeeded' : 'Evaluation Error' }}</span>
              </span>
              <span v-if="functionScriptTestResult.executionTimeMs !== undefined" class="text-[10px] text-slate-400">
                {{ functionScriptTestResult.executionTimeMs }}ms
              </span>
            </div>
            <pre class="text-[11px] overflow-x-auto whitespace-pre-wrap text-slate-300 max-h-28">{{ functionScriptTestResult.success ? JSON.stringify(functionScriptTestResult.result, null, 2) : functionScriptTestResult.error }}</pre>
          </div>
        </div>

        <!-- Right Cheatsheet & Variables Column -->
        <div class="lg:col-span-4 space-y-3">
          <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div class="pb-2 border-b border-slate-800">
              <span class="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <i class="fa-solid fa-wand-magic-sparkles text-amber-400"></i>
                <span>Variable Cheatsheet</span>
              </span>
              <p class="text-[10px] text-slate-500 mt-0.5">Click any pill to insert variable into code</p>
            </div>

            <!-- Packet & Telemetry -->
            <div class="space-y-2 text-xs">
              <div>
                <div class="text-[10px] font-bold text-slate-400 uppercase mb-1">1. Message & Telemetry</div>
                <div class="flex flex-wrap gap-1">
                  <button
                    v-for="v in ['msg.payload', 'msg.packet.rssi', 'msg.packet.snr', 'msg.packet.fPort', 'msg.packet.fCnt']"
                    :key="v"
                    type="button"
                    @click="insertScriptVariable(v)"
                    class="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-sky-400 hover:text-sky-300 transition cursor-pointer"
                  >
                    {{ v }}
                  </button>
                </div>
              </div>

              <!-- Decoded Sensor Fields -->
              <div>
                <div class="text-[10px] font-bold text-slate-400 uppercase mb-1">2. Decoded Fields ({{ testAvailableFields.length }})</div>
                <div class="max-h-28 overflow-y-auto space-y-1 pr-1">
                  <button
                    v-for="f in testAvailableFields"
                    :key="f.name"
                    type="button"
                    @click="insertScriptVariable('msg.packet.decoded.' + f.name)"
                    class="w-full text-left px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-emerald-400 hover:text-emerald-300 truncate flex justify-between items-center transition cursor-pointer"
                  >
                    <span class="truncate">decoded.{{ f.name }}</span>
                    <span v-if="f.unit" class="text-[9px] text-slate-500 ml-1">{{ f.unit }}</span>
                  </button>
                </div>
              </div>

              <!-- Context & Golden Unit -->
              <div>
                <div class="text-[10px] font-bold text-slate-400 uppercase mb-1">3. Context & Golden Unit</div>
                <div class="flex flex-wrap gap-1">
                  <button
                    v-for="v in ['context.packetCount', 'context.minPackets', 'context.goldenUnit', 'context.referenceDevices']"
                    :key="v"
                    type="button"
                    @click="insertScriptVariable(v)"
                    class="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-amber-400 hover:text-amber-300 transition cursor-pointer"
                  >
                    {{ v }}
                  </button>
                </div>
              </div>

              <!-- Preset Templates -->
              <div class="pt-2 border-t border-slate-800">
                <div class="text-[10px] font-bold text-slate-400 uppercase mb-1">4. Script Templates</div>
                <div class="space-y-1">
                  <button
                    type="button"
                    @click="applyScriptTemplate('range')"
                    class="w-full text-left px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] transition flex items-center justify-between cursor-pointer"
                  >
                    <span>Threshold & Range Check</span>
                    <i class="fa-solid fa-chevron-right text-[8px] text-slate-500"></i>
                  </button>
                  <button
                    type="button"
                    @click="applyScriptTemplate('reference')"
                    class="w-full text-left px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] transition flex items-center justify-between cursor-pointer"
                  >
                    <span>Golden Unit Comparison</span>
                    <i class="fa-solid fa-chevron-right text-[8px] text-slate-500"></i>
                  </button>
                  <button
                    type="button"
                    @click="applyScriptTemplate('transform')"
                    class="w-full text-left px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] transition flex items-center justify-between cursor-pointer"
                  >
                    <span>Transform Payload</span>
                    <i class="fa-solid fa-chevron-right text-[8px] text-slate-500"></i>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      <!-- Modal Footer -->
      <div class="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/70">
        <div class="text-[11px] text-slate-400 flex items-center gap-1.5">
          <i class="fa-solid fa-circle-info text-teal-400"></i>
          <span>Return <code class="text-teal-300">{ pass: true/false, reason: '...' }</code> or modified <code class="text-emerald-300">msg</code></span>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="showFunctionScriptModal = false"
            class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="saveFunctionScript"
            class="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-teal-600/20 cursor-pointer"
          >
            <i class="fa-solid fa-check text-xs"></i>
            <span>Apply Script</span>
          </button>
        </div>
      </div>

    </div>
  </div>
`;

export const TEST_BUILDER_SCRIPT = `
  function useTestBuilderModule(ctx) {
    const { ref, computed, watch, onMounted, onUnmounted } = Vue;
    const { showToast, authHeaders, currentUser, activeTab } = ctx;

    const testTemplatesList = ref([]);
    const activeTestTemplateId = ref('');
    const activeTestTemplate = ref(null);
    const testBuilderMode = ref('FLOW'); // 'FLOW' | 'SCRIPT'
    const testAvailableFields = ref([]);

    const isSavingTestTemplate = ref(false);
    const isCreatingTestTemplate = ref(false);
    const isRunningDryRun = ref(false);

    const showCreateTestTemplateModal = ref(false);
    const showDryRunModal = ref(false);

    // Canvas Wire & Drag State
    const canvasContainerRef = ref(null);
    const wireDraft = ref({ active: false, fromNodeId: '', startX: 0, startY: 0, currentX: 0, currentY: 0 });
    const draggingNode = ref(null);
    const dragStartPos = ref({ mouseX: 0, mouseY: 0, nodeX: 0, nodeY: 0 });
    const wireContextMenu = ref({ visible: false, x: 0, y: 0, edge: null });
    const wireTick = ref(0);

    const formatFirmware = (fw) => {
      if (fw === undefined || fw === null || fw === '') return '1';
      return String(fw).replace(/^[vV]/, '').trim() || '1';
    };

    const getNodePosX = (node) => {
      if (!node) return 50;
      const v = Number(node.position?.x ?? node.x);
      return Number.isFinite(v) ? v : 50;
    };

    const getNodePosY = (node) => {
      if (!node) return 50;
      const v = Number(node.position?.y ?? node.y);
      return Number.isFinite(v) ? v : 50;
    };

    const getFieldEnglishLabel = (f) => {
      if (!f) return '';
      const raw = String(f.label || f.name || '');
      if (/[\\u00C0-\\u1EF9]/.test(raw) || raw.toLowerCase().includes('trích xuất') || raw.toLowerCase().includes('nhiệt độ') || raw.toLowerCase().includes('độ ẩm') || raw.toLowerCase().includes('nồng độ')) {
        return f.name;
      }
      return raw;
    };

    const getNodeDisplayName = (node) => {
      if (!node) return '';
      if (node.type === 'extractor') {
        const rawLabel = String(node.label || '');
        if (rawLabel && !/[\\u00C0-\\u1EF9]/.test(rawLabel) && !rawLabel.toLowerCase().includes('trích xuất')) {
          return rawLabel;
        }
        return node.params?.field ? ('Field Extractor (' + node.params.field + ')') : 'Field Extractor';
      }
      return node.label || node.id || 'Node';
    };

    // Custom Function Script Modal State
    const showFunctionScriptModal = ref(false);
    const editingFunctionNode = ref(null);
    const functionScriptBuffer = ref('');
    const functionScriptTestResult = ref(null);
    const isTestingFunctionScript = ref(false);

    const newTestTemplateForm = ref({
      name: '',
      code: '',
      sku: 'WSLRW-CO2',
      firmwareVersion: '1',
      timeoutSeconds: 180,
      minPacketsRequired: 3,
      description: '',
    });

    const dryRunPayloadRaw = ref(JSON.stringify({
      fPort: 1,
      fCnt: 1,
      rssi: -85,
      snr: 8.5,
      decoded: {
        co2: 650,
        temperature: 28.5,
        humidity: 62.0,
        battery: 3.6
      }
    }, null, 2));

    const dryRunContext = ref({
      packetCount: 3,
      durationSeconds: 30
    });

    const dryRunResponse = ref(null);

    const currentFlowNodes = computed(() => {
      if (!activeTestTemplate.value || !activeTestTemplate.value.flowConfig) return [];
      return activeTestTemplate.value.flowConfig.nodes || [];
    });

    const currentFlowEdges = computed(() => {
      if (!activeTestTemplate.value || !activeTestTemplate.value.flowConfig) return [];
      if (!Array.isArray(activeTestTemplate.value.flowConfig.edges)) {
        activeTestTemplate.value.flowConfig.edges = [];
      }
      return activeTestTemplate.value.flowConfig.edges;
    });

    const ensureNodePositions = () => {
      if (!activeTestTemplate.value || !activeTestTemplate.value.flowConfig) return;
      if (!Array.isArray(activeTestTemplate.value.flowConfig.nodes)) {
        activeTestTemplate.value.flowConfig.nodes = [];
      }
      const nodes = activeTestTemplate.value.flowConfig.nodes;
      if (!Array.isArray(activeTestTemplate.value.flowConfig.edges)) {
        activeTestTemplate.value.flowConfig.edges = [];
      }

      nodes.forEach((node, idx) => {
        const rawX = Number(node.position?.x ?? node.x);
        const rawY = Number(node.position?.y ?? node.y);
        const col = idx % 4;
        const row = Math.floor(idx / 4);
        const validX = Number.isFinite(rawX) ? rawX : (50 + col * 330);
        const validY = Number.isFinite(rawY) ? rawY : (50 + row * 260);
        node.position = { x: validX, y: validY };
        node.x = validX;
        node.y = validY;

        if (node.type === 'extractor') {
          if (!node.label || /[\\u00C0-\\u1EF9]/.test(node.label) || node.label.toLowerCase().includes('trích xuất')) {
            node.label = node.params?.field ? ('Field Extractor (' + node.params.field + ')') : 'Field Extractor';
          }
          if (node.params?.label && (/[\\u00C0-\\u1EF9]/.test(node.params.label) || node.params.label.toLowerCase().includes('trích xuất') || node.params.label.toLowerCase().includes('nồng độ'))) {
            node.params.label = node.params.field || 'Field';
          }
        }
      });

      // Auto-link nodes sequentially if nodes exist but zero wires configured
      if (nodes.length > 1 && activeTestTemplate.value.flowConfig.edges.length === 0) {
        for (let i = 0; i < nodes.length - 1; i++) {
          activeTestTemplate.value.flowConfig.edges.push({
            id: 'edge-auto-' + Date.now() + '-' + i,
            from: nodes[i].id,
            to: nodes[i + 1].id
          });
        }
      }
      wireTick.value++;
    };

    const getNodeBadgeClass = (type) => {
      switch (type) {
        case 'lora-in':
        case 'lora_in':
        case 'trigger': return 'bg-sky-500/20 text-sky-400';
        case 'extractor': return 'bg-indigo-500/20 text-indigo-400';
        case 'reference_device':
        case 'golden_unit': return 'bg-purple-500/20 text-purple-400';
        case 'moving_average':
        case 'aggregation': return 'bg-cyan-500/20 text-cyan-400';
        case 'comparator': return 'bg-amber-500/20 text-amber-400';
        case 'counter': return 'bg-emerald-500/20 text-emerald-400';
        case 'function':
        case 'script': return 'bg-teal-500/20 text-teal-400';
        case 'verdict':
        case 'output': return 'bg-rose-500/20 text-rose-400';
        default: return 'bg-slate-700 text-slate-300';
      }
    };

    const getNodeIcon = (type) => {
      switch (type) {
        case 'lora-in':
        case 'lora_in':
        case 'trigger': return 'fa-solid fa-satellite-dish';
        case 'extractor': return 'fa-solid fa-filter';
        case 'reference_device':
        case 'golden_unit': return 'fa-solid fa-award';
        case 'moving_average':
        case 'aggregation': return 'fa-solid fa-chart-line';
        case 'comparator': return 'fa-solid fa-scale-balanced';
        case 'counter': return 'fa-solid fa-stopwatch';
        case 'function':
        case 'script': return 'fa-solid fa-code';
        case 'verdict':
        case 'output': return 'fa-solid fa-flag-checkered';
        default: return 'fa-solid fa-cube';
      }
    };

    const getNodeCardClass = (type) => {
      switch (type) {
        case 'lora-in':
        case 'lora_in':
        case 'trigger': return 'border-sky-500/50 ring-1 ring-sky-500/20 shadow-sky-950/20';
        case 'extractor': return 'border-indigo-500/50 shadow-indigo-950/20';
        case 'reference_device':
        case 'golden_unit': return 'border-purple-500/50 ring-1 ring-purple-500/20 shadow-purple-950/20';
        case 'moving_average':
        case 'aggregation': return 'border-cyan-500/50 ring-1 ring-cyan-500/20 shadow-cyan-950/20';
        case 'comparator': return 'border-amber-500/50 shadow-amber-950/20';
        case 'counter': return 'border-emerald-500/50 shadow-emerald-950/20';
        case 'function':
        case 'script': return 'border-teal-500/50 ring-1 ring-teal-500/20 shadow-teal-950/20';
        case 'verdict':
        case 'output': return 'border-rose-500/50 ring-1 ring-rose-500/20 shadow-rose-950/20';
        default: return 'border-slate-800';
      }
    };

    const getNodeScriptPreview = (code, lineIndex) => {
      const text = typeof code === 'string' && code.trim().length > 0 ? code : '// Custom Script evaluate()';
      const lines = text.split(/\\r?\\n/);
      if (lineIndex === 0) {
        return lines[0] || '// Custom Script evaluate()';
      }
      return lines[lineIndex] || '...';
    };

    const getEdgePath = (edge) => {
      const _ = wireTick.value;
      if (!edge) return '';
      const fromId = edge.from || edge.source;
      const toId = edge.to || edge.target;
      const fromNode = currentFlowNodes.value.find(n => n.id === fromId);
      const toNode = currentFlowNodes.value.find(n => n.id === toId);
      if (!fromNode || !toNode) return '';
      const x1 = getNodePosX(fromNode) + 288;
      const y1 = getNodePosY(fromNode) + 30;
      const x2 = getNodePosX(toNode);
      const y2 = getNodePosY(toNode) + 30;
      const dx = Math.max(50, Math.abs(x2 - x1) * 0.5);
      return 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + dx) + ' ' + y1 + ', ' + (x2 - dx) + ' ' + y2 + ', ' + x2 + ' ' + y2;
    };

    const getEdgeMidX = (edge) => {
      if (!edge) return 0;
      const fromId = edge.from || edge.source;
      const toId = edge.to || edge.target;
      const fromNode = currentFlowNodes.value.find(n => n.id === fromId);
      const toNode = currentFlowNodes.value.find(n => n.id === toId);
      if (!fromNode || !toNode) return 0;
      const x1 = getNodePosX(fromNode) + 288;
      const x2 = getNodePosX(toNode);
      return Math.round((x1 + x2) / 2);
    };

    const getEdgeMidY = (edge) => {
      if (!edge) return 0;
      const fromId = edge.from || edge.source;
      const toId = edge.to || edge.target;
      const fromNode = currentFlowNodes.value.find(n => n.id === fromId);
      const toNode = currentFlowNodes.value.find(n => n.id === toId);
      if (!fromNode || !toNode) return 0;
      const y1 = getNodePosY(fromNode) + 30;
      const y2 = getNodePosY(toNode) + 30;
      return Math.round((y1 + y2) / 2);
    };

    const getDraftWirePath = () => {
      if (!wireDraft.value.active) return '';
      const x1 = Number(wireDraft.value.startX);
      const y1 = Number(wireDraft.value.startY);
      const x2 = Number(wireDraft.value.currentX);
      const y2 = Number(wireDraft.value.currentY);
      if (!Number.isFinite(x1) || !Number.isFinite(y1) || !Number.isFinite(x2) || !Number.isFinite(y2)) return '';
      const dx = Math.max(50, Math.abs(x2 - x1) * 0.5);
      return 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + dx) + ' ' + y1 + ', ' + (x2 - dx) + ' ' + y2 + ', ' + x2 + ' ' + y2;
    };

    const onOutputPortClick = (node, event) => {
      if (event && event.stopPropagation) event.stopPropagation();
      closeWireContextMenu();
      if (wireDraft.value.active && wireDraft.value.fromNodeId === node.id) {
        wireDraft.value.active = false;
        return;
      }
      const nodeX = getNodePosX(node);
      const nodeY = getNodePosY(node);
      wireDraft.value = {
        active: true,
        fromNodeId: node.id,
        startX: nodeX + 288,
        startY: nodeY + 30,
        currentX: nodeX + 320,
        currentY: nodeY + 30
      };
      showToast('Wire started from [' + getNodeDisplayName(node) + ']. Click input port on target node.', 'info');
    };

    const onInputPortClick = (targetNode) => {
      closeWireContextMenu();
      if (!wireDraft.value.active) {
        showToast('Click an output port on a source node first', 'info');
        return;
      }
      const fromId = wireDraft.value.fromNodeId;
      const toId = targetNode.id;
      if (fromId === toId) {
        showToast('Cannot connect a node to itself', 'warning');
        return;
      }
      if (!activeTestTemplate.value.flowConfig) {
        activeTestTemplate.value.flowConfig = { nodes: [], edges: [] };
      }
      if (!Array.isArray(activeTestTemplate.value.flowConfig.edges)) {
        activeTestTemplate.value.flowConfig.edges = [];
      }
      const exists = activeTestTemplate.value.flowConfig.edges.some(
        e => (e.from || e.source) === fromId && (e.to || e.target) === toId
      );
      if (exists) {
        showToast('Connection already exists between these nodes', 'warning');
        wireDraft.value.active = false;
        return;
      }
      activeTestTemplate.value.flowConfig.edges.push({
        id: 'edge-' + Date.now(),
        from: fromId,
        to: toId
      });
      wireDraft.value.active = false;
      wireTick.value++;
      showToast('Wire connected: ' + fromId + ' → ' + toId, 'success');
    };

    const removeFlowEdge = (edgeId) => {
      if (!activeTestTemplate.value?.flowConfig?.edges) return;
      activeTestTemplate.value.flowConfig.edges = activeTestTemplate.value.flowConfig.edges.filter(e => e.id !== edgeId);
      closeWireContextMenu();
      wireTick.value++;
      showToast('Removed wire connection', 'info');
    };

    const openWireContextMenu = (event, edge) => {
      if (event) {
        if (event.preventDefault) event.preventDefault();
        if (event.stopPropagation) event.stopPropagation();
      }
      if (!edge) return;
      if (canvasContainerRef.value) {
        const rect = canvasContainerRef.value.getBoundingClientRect();
        wireContextMenu.value = {
          visible: true,
          x: Math.max(10, event.clientX - rect.left + canvasContainerRef.value.scrollLeft),
          y: Math.max(10, event.clientY - rect.top + canvasContainerRef.value.scrollTop),
          edge
        };
      } else {
        wireContextMenu.value = {
          visible: true,
          x: event.clientX,
          y: event.clientY,
          edge
        };
      }
    };

    const closeWireContextMenu = () => {
      wireContextMenu.value.visible = false;
      wireContextMenu.value.edge = null;
    };

    const onCanvasContextMenu = (event) => {
      closeWireContextMenu();
    };

    const inspectWireConnection = (edge) => {
      if (!edge) return;
      const fromId = edge.from || edge.source;
      const toId = edge.to || edge.target;
      const fromNode = currentFlowNodes.value.find(n => n.id === fromId);
      const toNode = currentFlowNodes.value.find(n => n.id === toId);
      const fromName = fromNode ? getNodeDisplayName(fromNode) : fromId;
      const toName = toNode ? getNodeDisplayName(toNode) : toId;
      showToast('Wire Connection: [' + fromName + '] → [' + toName + ']', 'info');
      closeWireContextMenu();
    };

    const deleteWireFromMenu = (edge) => {
      if (!edge) return;
      removeFlowEdge(edge.id);
      closeWireContextMenu();
    };

    const onNodeDragMove = (clientX, clientY) => {
      if (!draggingNode.value) return;
      const dx = clientX - dragStartPos.value.mouseX;
      const dy = clientY - dragStartPos.value.mouseY;
      const startX = Number.isFinite(dragStartPos.value.nodeX) ? dragStartPos.value.nodeX : 50;
      const startY = Number.isFinite(dragStartPos.value.nodeY) ? dragStartPos.value.nodeY : 50;
      const newX = Math.max(20, Math.round((startX + dx) / 10) * 10);
      const newY = Math.max(20, Math.round((startY + dy) / 10) * 10);
      if (Number.isFinite(newX) && Number.isFinite(newY)) {
        if (!draggingNode.value.position) draggingNode.value.position = { x: newX, y: newY };
        draggingNode.value.position.x = newX;
        draggingNode.value.position.y = newY;
        draggingNode.value.x = newX;
        draggingNode.value.y = newY;
        wireTick.value++;
      }
    };

    const onNodeHeaderMouseDown = (event, node) => {
      if (event) {
        if (event.stopPropagation) event.stopPropagation();
        if (event.preventDefault) event.preventDefault();
      }
      closeWireContextMenu();

      const validX = getNodePosX(node);
      const validY = getNodePosY(node);
      if (!node.position) {
        node.position = { x: validX, y: validY };
      } else {
        node.position.x = validX;
        node.position.y = validY;
      }
      node.x = validX;
      node.y = validY;

      dragStartPos.value = {
        mouseX: event.clientX,
        mouseY: event.clientY,
        nodeX: validX,
        nodeY: validY
      };
      draggingNode.value = node;

      const onWindowMouseMove = (e) => {
        onNodeDragMove(e.clientX, e.clientY);
      };

      const onWindowMouseUp = () => {
        draggingNode.value = null;
        window.removeEventListener('mousemove', onWindowMouseMove);
        window.removeEventListener('mouseup', onWindowMouseUp);
        wireTick.value++;
      };

      window.addEventListener('mousemove', onWindowMouseMove);
      window.addEventListener('mouseup', onWindowMouseUp);
    };

    const onCanvasMouseMove = (event) => {
      if (draggingNode.value) {
        onNodeDragMove(event.clientX, event.clientY);
      }
      if (wireDraft.value.active && canvasContainerRef.value) {
        const rect = canvasContainerRef.value.getBoundingClientRect();
        wireDraft.value.currentX = event.clientX - rect.left + canvasContainerRef.value.scrollLeft;
        wireDraft.value.currentY = event.clientY - rect.top + canvasContainerRef.value.scrollTop;
      }
    };

    const onCanvasMouseUp = () => {
      draggingNode.value = null;
    };

    const onCanvasClick = () => {
      closeWireContextMenu();
      if (wireDraft.value.active) {
        wireDraft.value.active = false;
      }
    };

    const cancelWireDraft = () => {
      wireDraft.value.active = false;
    };

    const autoArrangeNodes = () => {
      if (!activeTestTemplate.value || !activeTestTemplate.value.flowConfig) return;
      const nodes = activeTestTemplate.value.flowConfig.nodes || [];
      if (nodes.length === 0) return;

      const stageOrder = {
        'lora-in': 0, 'lora_in': 0, 'trigger': 0,
        'extractor': 1,
        'moving_average': 2, 'aggregation': 2,
        'function': 2, 'script': 2,
        'comparator': 3, 'reference_device': 3, 'golden_unit': 3, 'counter': 3,
        'verdict': 4, 'output': 4
      };

      const stageCounters = [0, 0, 0, 0, 0];
      nodes.forEach((node, idx) => {
        const stage = stageOrder[node.type] !== undefined ? stageOrder[node.type] : (idx % 4);
        const row = stageCounters[stage]++;
        const posX = 40 + stage * 330;
        const posY = 40 + row * 260;
        node.position = { x: posX, y: posY };
        node.x = posX;
        node.y = posY;
      });
      wireTick.value++;
      showToast('Auto-arranged nodes into pipeline stages', 'success');
    };

    const autoWirePipeline = () => {
      if (!activeTestTemplate.value || !activeTestTemplate.value.flowConfig) return;
      const nodes = activeTestTemplate.value.flowConfig.nodes || [];
      if (nodes.length < 2) {
        showToast('Need at least 2 nodes to create a pipeline wire', 'warning');
        return;
      }
      const sorted = [...nodes].sort((a, b) => getNodePosX(a) - getNodePosX(b));
      const edges = [];
      for (let i = 0; i < sorted.length - 1; i++) {
        edges.push({
          id: 'edge-pipeline-' + Date.now() + '-' + i,
          from: sorted[i].id,
          to: sorted[i + 1].id
        });
      }
      activeTestTemplate.value.flowConfig.edges = edges;
      wireTick.value++;
      showToast('Connected ' + edges.length + ' pipeline wires automatically', 'success');
    };

    const clearFlowWires = () => {
      if (!activeTestTemplate.value || !activeTestTemplate.value.flowConfig) return;
      activeTestTemplate.value.flowConfig.edges = [];
      closeWireContextMenu();
      wireTick.value++;
      showToast('Cleared all wire connections', 'info');
    };

    const openFunctionScriptModal = (node) => {
      editingFunctionNode.value = node;
      if (!node.params) node.params = {};
      functionScriptBuffer.value = node.params.code || defaultFunctionScript(node);
      functionScriptTestResult.value = null;
      showFunctionScriptModal.value = true;
    };

    const defaultFunctionScript = (node) => {
      const f = testAvailableFields.value[0]?.name || 'temperature';
      return [
        '// Custom Function Evaluation for ' + (node.label || 'Node'),
        '// msg.payload contains extracted/incoming telemetry',
        'const val = (msg.payload && msg.payload.' + f + ' !== undefined) ? msg.payload.' + f + ' : (msg.packet?.decoded?.' + f + ');',
        'if (val === undefined) {',
        '  return { pass: false, reason: "Missing telemetry field: ' + f + '" };',
        '}',
        'if (val < 0) {',
        '  return { pass: false, reason: "Negative sensor reading: " + val };',
        '}',
        'return { pass: true, metrics: { ' + f + ': val, packetCount: context.packetCount } };'
      ].join('\\n');
    };

    const saveFunctionScript = () => {
      if (editingFunctionNode.value) {
        if (!editingFunctionNode.value.params) editingFunctionNode.value.params = {};
        editingFunctionNode.value.params.code = functionScriptBuffer.value;
      }
      showFunctionScriptModal.value = false;
      showToast('Function script saved successfully', 'success');
    };

    const insertScriptVariable = (snippet) => {
      functionScriptBuffer.value = (functionScriptBuffer.value || '') + '\\n' + snippet;
      showToast('Inserted: ' + snippet, 'info');
    };

    const applyScriptTemplate = (key) => {
      const defaultField = testAvailableFields.value[0]?.name || 'temperature';
      if (key === 'range') {
        functionScriptBuffer.value = [
          '// Range & Threshold Check for ' + defaultField,
          'const val = (msg.payload && msg.payload.' + defaultField + ' !== undefined)',
          '  ? msg.payload.' + defaultField,
          '  : (msg.packet && msg.packet.decoded && msg.packet.decoded.' + defaultField + ');',
          '',
          'if (val === undefined || val === null) {',
          '  return { pass: false, reason: "Missing ' + defaultField + ' in packet" };',
          '}',
          '',
          'if (val < 0 || val > 100) {',
          '  return { pass: false, reason: "' + defaultField + ' value (" + val + ") out of range [0, 100]" };',
          '}',
          '',
          'return { pass: true, metrics: { ' + defaultField + ': val } };'
        ].join('\\n');
      } else if (key === 'reference') {
        functionScriptBuffer.value = [
          '// Golden Unit Reference Device Comparison',
          'const actual = (msg.payload && msg.payload.' + defaultField + ' !== undefined)',
          '  ? msg.payload.' + defaultField,
          '  : (msg.packet && msg.packet.decoded && msg.packet.decoded.' + defaultField + ');',
          '',
          'const refVal = context.goldenUnit ? context.goldenUnit.' + defaultField + ' : 25.0;',
          'const tolerance = 1.0; // +/- 1.0',
          '',
          'if (actual === undefined) {',
          '  return { pass: false, reason: "UUT field ' + defaultField + ' missing" };',
          '}',
          '',
          'const delta = Math.abs(actual - refVal);',
          'if (delta > tolerance) {',
          '  return {',
          '    pass: false,',
          '    reason: "UUT (" + actual + ") vs Golden (" + refVal + ") delta " + delta.toFixed(2) + " exceeds tolerance ±" + tolerance',
          '  };',
          '}',
          '',
          'return { pass: true, metrics: { actual, refVal, delta } };'
        ].join('\\n');
      } else if (key === 'transform') {
        functionScriptBuffer.value = [
          '// Transform payload for downstream nodes',
          'if (msg.payload && typeof msg.payload === "object") {',
          '  msg.payload = {',
          '    ...msg.payload,',
          '    processedAt: Date.now(),',
          '    sampleCount: (context.packetCount || 1)',
          '  };',
          '}',
          'return msg;'
        ].join('\\n');
      }
      showToast('Applied template: ' + key, 'info');
    };

    const testFunctionScriptInModal = () => {
      isTestingFunctionScript.value = true;
      try {
        let mockPacket = {};
        try {
          mockPacket = JSON.parse(dryRunPayloadRaw.value || '{}');
        } catch (e) {
          mockPacket = { decoded: { co2: 650, temperature: 28.5 } };
        }
        const msg = {
          payload: (mockPacket.decoded && Object.keys(mockPacket.decoded).length > 0) ? mockPacket.decoded : mockPacket,
          packet: mockPacket,
          context: { packetCount: dryRunContext.value.packetCount, minPackets: 3, goldenUnit: { temperature: 28.0, co2: 640 } }
        };
        const node = editingFunctionNode.value || { id: 'test-node', type: 'function' };
        const code = functionScriptBuffer.value;

        const runner = new Function('msg', 'context', 'node', 'console',
          code + '\\n' +
          'if (typeof evaluate === "function") { return evaluate(msg.packet, context); }\\n' +
          'return (typeof msg !== "undefined" ? msg : { pass: true });'
        );
        const mockConsole = {
          logs: [],
          log: function(...args) { this.logs.push(args.join(' ')); }
        };
        const start = performance.now();
        const result = runner(msg, msg.context, node, mockConsole);
        const duration = Math.round(performance.now() - start);

        functionScriptTestResult.value = {
          success: true,
          result: result,
          executionTimeMs: duration,
          logs: mockConsole.logs
        };
        showToast('Script verified successfully (' + duration + 'ms)', 'success');
      } catch (err) {
        functionScriptTestResult.value = {
          success: false,
          error: err.message
        };
        showToast('Syntax error: ' + err.message, 'error');
      } finally {
        isTestingFunctionScript.value = false;
      }
    };

    const fetchTestTemplates = async () => {
      try {
        const res = await fetch('/api/c-modules/test-builder/templates', { headers: credentials() });
        if (res.ok) {
          const data = await res.json();
          testTemplatesList.value = Array.isArray(data) ? data : [];
          if (testTemplatesList.value.length > 0 && !activeTestTemplateId.value) {
            activeTestTemplateId.value = testTemplatesList.value[0].id;
            activeTestTemplate.value = testTemplatesList.value[0];
            testBuilderMode.value = activeTestTemplate.value.executionMode || 'FLOW';
            ensureNodePositions();
            fetchTestAvailableFields();
          }
        }
      } catch (err) {
        console.error('Failed fetching test templates:', err);
      }
    };

    const credentials = () => {
      return typeof authHeaders === 'function' ? authHeaders() : (authHeaders.value || {});
    };

    const onTestTemplateSelectChange = () => {
      const found = testTemplatesList.value.find(t => t.id === activeTestTemplateId.value);
      if (found) {
        activeTestTemplate.value = found;
        testBuilderMode.value = found.executionMode || 'FLOW';
        ensureNodePositions();
        fetchTestAvailableFields();
      }
    };

    const fetchTestAvailableFields = async () => {
      if (!activeTestTemplate.value) return;
      try {
        const sku = activeTestTemplate.value.sku;
        const fw = activeTestTemplate.value.firmwareVersion;
        const res = await fetch('/api/c-modules/test-builder/available-fields?sku=' + encodeURIComponent(sku) + '&firmwareVersion=' + encodeURIComponent(fw), {
          headers: credentials()
        });
        if (res.ok) {
          testAvailableFields.value = await res.json();
          updateDryRunMockSample();
        }
      } catch (err) {
        console.error('Failed fetching available fields:', err);
      }
    };

    const updateDryRunMockSample = () => {
      const sampleDecoded = {};
      testAvailableFields.value.forEach(f => {
        if (!['rssi', 'snr', 'fPort', 'fCnt'].includes(f.name)) {
          sampleDecoded[f.name] = f.sampleValue !== undefined ? f.sampleValue : 25;
        }
      });
      dryRunPayloadRaw.value = JSON.stringify({
        fPort: 1,
        fCnt: 1,
        rssi: -85,
        snr: 8.5,
        decoded: sampleDecoded
      }, null, 2);
    };

    const addFlowNode = (type) => {
      if (!activeTestTemplate.value) return;
      if (!activeTestTemplate.value.flowConfig) activeTestTemplate.value.flowConfig = { nodes: [], edges: [] };
      if (!Array.isArray(activeTestTemplate.value.flowConfig.nodes)) activeTestTemplate.value.flowConfig.nodes = [];
      if (!Array.isArray(activeTestTemplate.value.flowConfig.edges)) activeTestTemplate.value.flowConfig.edges = [];

      const existingNodes = activeTestTemplate.value.flowConfig.nodes;
      const newId = 'node-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      const defaultField = testAvailableFields.value[0]?.name || 'co2';
      const defaultUnit = testAvailableFields.value[0]?.unit || '';

      const col = existingNodes.length % 4;
      const row = Math.floor(existingNodes.length / 4);
      const posX = 50 + col * 330;
      const posY = 50 + row * 260;
      const position = { x: posX, y: posY };

      let node = { id: newId, type, label: '', params: {}, position, x: posX, y: posY };

      if (type === 'lora-in' || type === 'lora_in') {
        node.type = 'lora-in';
        node.label = 'LoRaWAN Ingestion';
        node.params = { sku: activeTestTemplate.value.sku, trigger: 'Uplink Telemetry Event' };
      } else if (type === 'extractor') {
        node.label = defaultField ? ('Field Extractor (' + defaultField + ')') : 'Field Extractor';
        node.params = { field: defaultField, label: defaultField, unit: defaultUnit };
      } else if (type === 'reference_device' || type === 'golden_unit') {
        node.type = 'reference_device';
        node.label = 'Reference Device';
        node.params = {
          field: defaultField,
          devEUI: 'REF-' + (activeTestTemplate.value.sku || 'GOLDEN'),
          tolerance: 0.5,
          toleranceType: 'ABSOLUTE',
          severity: 'ERROR'
        };
      } else if (type === 'moving_average' || type === 'aggregation') {
        node.type = 'moving_average';
        node.label = 'Moving Average';
        node.params = {
          field: defaultField,
          windowSize: 5,
          mode: 'avg',
          maxStdDev: 0.5,
          tolerance: 1.5,
          severity: 'ERROR'
        };
      } else if (type === 'comparator') {
        node.label = 'Range / Comparator';
        node.params = {
          field: defaultField,
          operator: 'BETWEEN',
          min: 400,
          max: 2000,
          value: 0,
          severity: 'ERROR'
        };
      } else if (type === 'counter') {
        node.label = 'Packet Counter';
        node.params = { minPackets: activeTestTemplate.value.minPacketsRequired || 3 };
      } else if (type === 'function' || type === 'script') {
        node.type = 'function';
        node.label = 'Custom Function';
        node.params = {
          code: [
            '// Custom function logic',
            'if (msg.payload && msg.payload.' + defaultField + ' !== undefined) {',
            '  if (msg.payload.' + defaultField + ' < 0) return { pass: false, reason: "Negative value" };',
            '}',
            'return { pass: true, metrics: { verified: true } };'
          ].join('\\n')
        };
      } else if (type === 'verdict' || type === 'output') {
        node.type = 'verdict';
        node.label = 'Verdict Output';
        node.params = { autoStop: true };
      }

      activeTestTemplate.value.flowConfig.nodes.push(node);
      wireTick.value++;
      showToast('Added ' + node.label + ' node to canvas', 'success');
    };

    const addExtractorNodeForField = (field) => {
      if (!activeTestTemplate.value) return;
      if (!activeTestTemplate.value.flowConfig) activeTestTemplate.value.flowConfig = { nodes: [], edges: [] };
      if (!Array.isArray(activeTestTemplate.value.flowConfig.nodes)) activeTestTemplate.value.flowConfig.nodes = [];
      const existingNodes = activeTestTemplate.value.flowConfig.nodes;
      const col = existingNodes.length % 4;
      const row = Math.floor(existingNodes.length / 4);
      const posX = 50 + col * 330;
      const posY = 50 + row * 260;

      const englishLabel = getFieldEnglishLabel(field);
      const node = {
        id: 'node-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        type: 'extractor',
        label: 'Field Extractor (' + (field.name || 'field') + ')',
        params: { field: field.name, label: englishLabel, unit: field.unit || '' },
        position: { x: posX, y: posY },
        x: posX,
        y: posY
      };
      activeTestTemplate.value.flowConfig.nodes.push(node);
      wireTick.value++;
      showToast('Added Extractor for field: ' + field.name, 'success');
    };

    const onExtractorFieldChange = (node) => {
      const f = testAvailableFields.value.find(item => item.name === node.params.field);
      if (f) {
        node.params.unit = f.unit || '';
        node.params.label = getFieldEnglishLabel(f);
      }
      if (node.type === 'extractor') {
        node.label = node.params.field ? ('Field Extractor (' + node.params.field + ')') : 'Field Extractor';
      }
    };

    const removeFlowNode = (nodeId) => {
      if (!activeTestTemplate.value || !activeTestTemplate.value.flowConfig) return;
      activeTestTemplate.value.flowConfig.nodes = (activeTestTemplate.value.flowConfig.nodes || []).filter(n => n.id !== nodeId);
      if (Array.isArray(activeTestTemplate.value.flowConfig.edges)) {
        activeTestTemplate.value.flowConfig.edges = activeTestTemplate.value.flowConfig.edges.filter(
          e => (e.from || e.source) !== nodeId && (e.to || e.target) !== nodeId
        );
      }
      closeWireContextMenu();
      wireTick.value++;
      showToast('Removed node from Flow', 'info');
    };

    const compileFlowToAssertions = () => {
      if (!activeTestTemplate.value || !activeTestTemplate.value.flowConfig) return [];
      const nodes = activeTestTemplate.value.flowConfig.nodes || [];
      const assertions = [];

      nodes.forEach((n, idx) => {
        if (n.type === 'comparator') {
          let expectedValue = n.params.value;
          if (n.params.operator === 'BETWEEN') {
            expectedValue = { min: n.params.min, max: n.params.max };
          }
          assertions.push({
            fieldName: n.params.field,
            fieldLabel: n.params.field,
            operator: n.params.operator,
            expectedValue: expectedValue,
            severity: n.params.severity || 'ERROR',
            orderIndex: idx
          });
        } else if (n.type === 'reference_device' || n.type === 'golden_unit') {
          assertions.push({
            fieldName: n.params.field,
            fieldLabel: 'Ref: ' + n.params.field,
            operator: n.params.toleranceType === 'PERCENTAGE' ? 'BETWEEN' : 'IN_RANGE',
            expectedValue: { tolerance: n.params.tolerance, toleranceType: n.params.toleranceType, devEUI: n.params.devEUI },
            severity: n.params.severity || 'ERROR',
            orderIndex: idx
          });
        } else if (n.type === 'moving_average' || n.type === 'aggregation') {
          assertions.push({
            fieldName: n.params.field,
            fieldLabel: 'MovingAvg: ' + n.params.field,
            operator: 'BETWEEN',
            expectedValue: { windowSize: n.params.windowSize, mode: n.params.mode, maxStdDev: n.params.maxStdDev },
            severity: n.params.severity || 'ERROR',
            orderIndex: idx
          });
        }
      });

      activeTestTemplate.value.assertions = assertions;
      showToast('Synced ' + assertions.length + ' assertions from Flow', 'success');
      return assertions;
    };

    const convertFlowToScript = () => {
      if (!activeTestTemplate.value) return;
      compileFlowToAssertions();
      const assertions = activeTestTemplate.value.assertions || [];
      
      let lines = [
        '/**',
        ' * LoRaWAN Sensor Automated Test Script',
        ' * Generated automatically from Node-RED Flow',
        ' */',
        'function evaluate(packet, context) {',
        '  if (context.packetCount < context.minPackets) {',
        '    return { pass: false, reason: "Insufficient packet count (" + context.packetCount + "/" + context.minPackets + ")" };',
        '  }',
        '  const decoded = packet.decoded || {};'
      ];

      assertions.forEach(a => {
        if (a.operator === 'BETWEEN' && a.expectedValue) {
          lines.push('  // Range check: ' + a.fieldName);
          lines.push('  if (decoded.' + a.fieldName + ' !== undefined) {');
          lines.push('    if (decoded.' + a.fieldName + ' < ' + a.expectedValue.min + ' || decoded.' + a.fieldName + ' > ' + a.expectedValue.max + ') {');
          lines.push('      return { pass: false, reason: "' + a.fieldName + ' (" + decoded.' + a.fieldName + ') out of expected range [' + a.expectedValue.min + ', ' + a.expectedValue.max + ']" };');
          lines.push('    }');
          lines.push('  }');
        } else if (a.operator === 'GREATER_THAN') {
          lines.push('  if (packet.' + a.fieldName + ' !== undefined && packet.' + a.fieldName + ' <= ' + a.expectedValue + ') {');
          lines.push('    return { pass: false, reason: "' + a.fieldName + ' does not exceed threshold > ' + a.expectedValue + '" };');
          lines.push('  }');
        }
      });

      lines.push('  return { pass: true, metrics: { packetCount: context.packetCount } };');
      lines.push('}');

      activeTestTemplate.value.customScript = lines.join('\\n');
      testBuilderMode.value = 'SCRIPT';
      showToast('Converted Flow to Function Script!', 'success');
    };

    const insertCodeSnippet = (snippet) => {
      if (!activeTestTemplate.value) return;
      activeTestTemplate.value.customScript = (activeTestTemplate.value.customScript || '') + ' ' + snippet;
      showToast('Inserted variable: ' + snippet, 'info');
    };

    const insertSampleScript = () => {
      if (!activeTestTemplate.value) return;
      activeTestTemplate.value.customScript = \`function evaluate(packet, context) {
  if (context.packetCount < context.minPackets) {
    return { pass: false, reason: 'Insufficient packets: ' + context.packetCount + '/' + context.minPackets };
  }
  if (packet.rssi < -120) {
    return { pass: false, reason: 'Weak RSSI signal: ' + packet.rssi + ' dBm' };
  }
  const decoded = packet.decoded || {};
  if (decoded.temperature !== undefined && (decoded.temperature < 0 || decoded.temperature > 65)) {
    return { pass: false, reason: 'Abnormal temperature: ' + decoded.temperature + ' °C' };
  }
  return { pass: true, metrics: { packetCount: context.packetCount, temp: decoded.temperature } };
}\`;
      showToast('Sample script loaded successfully', 'success');
    };

    const saveCurrentTestTemplate = async () => {
      if (!activeTestTemplate.value) return;
      isSavingTestTemplate.value = true;
      try {
        compileFlowToAssertions();

        // Sync node.wires with flowConfig.edges for full backend compatibility
        if (activeTestTemplate.value.flowConfig) {
          const edges = activeTestTemplate.value.flowConfig.edges || [];
          (activeTestTemplate.value.flowConfig.nodes || []).forEach(n => {
            const targets = edges.filter(e => (e.from || e.source) === n.id).map(e => e.to || e.target);
            n.wires = [targets];
          });
        }

        const fwClean = formatFirmware(activeTestTemplate.value.firmwareVersion);
        activeTestTemplate.value.firmwareVersion = fwClean;

        const payload = {
          name: activeTestTemplate.value.name,
          description: activeTestTemplate.value.description,
          sku: activeTestTemplate.value.sku,
          firmwareVersion: fwClean,
          executionMode: testBuilderMode.value,
          flowConfig: activeTestTemplate.value.flowConfig,
          customScript: activeTestTemplate.value.customScript,
          timeoutSeconds: activeTestTemplate.value.timeoutSeconds,
          minPacketsRequired: activeTestTemplate.value.minPacketsRequired,
          isActive: activeTestTemplate.value.isActive,
          assertions: activeTestTemplate.value.assertions
        };

        const res = await fetch('/api/c-modules/test-builder/templates/' + activeTestTemplate.value.id, {
          method: 'PUT',
          headers: { ...credentials(), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          showToast('Test scenario saved successfully!', 'success');
          await fetchTestTemplates();
        } else {
          const errData = await res.json().catch(() => ({}));
          showToast(errData.message || 'Failed to save test scenario', 'error');
        }
      } catch (err) {
        showToast('Connection error while saving scenario: ' + err.message, 'error');
      } finally {
        isSavingTestTemplate.value = false;
      }
    };

    const openCreateTestTemplateModal = () => {
      showCreateTestTemplateModal.value = true;
    };

    const createTestTemplate = async () => {
      if (!newTestTemplateForm.value.name || !newTestTemplateForm.value.code || !newTestTemplateForm.value.sku) {
        showToast('Please provide Scenario Name, Code, and SKU', 'warning');
        return;
      }
      isCreatingTestTemplate.value = true;
      try {
        const fwClean = formatFirmware(newTestTemplateForm.value.firmwareVersion);
        const payload = {
          name: newTestTemplateForm.value.name,
          code: newTestTemplateForm.value.code.trim().toUpperCase(),
          sku: newTestTemplateForm.value.sku.trim().toUpperCase(),
          firmwareVersion: fwClean,
          timeoutSeconds: Number(newTestTemplateForm.value.timeoutSeconds || 180),
          minPacketsRequired: Number(newTestTemplateForm.value.minPacketsRequired || 3),
          description: newTestTemplateForm.value.description,
          executionMode: 'FLOW',
          flowConfig: {
            nodes: [
              { id: 'node-in-1', type: 'lora-in', label: 'LoRaWAN Ingestion', params: { sku: newTestTemplateForm.value.sku }, position: { x: 50, y: 80 } },
              { id: 'node-ext-1', type: 'extractor', label: 'Field Extractor', params: { field: 'value' }, position: { x: 380, y: 80 } },
              { id: 'node-out-1', type: 'verdict', label: 'QA Verdict Pass/Fail', params: {}, position: { x: 710, y: 80 } }
            ],
            edges: [
              { id: 'edge-init-1', from: 'node-in-1', to: 'node-ext-1' },
              { id: 'edge-init-2', from: 'node-ext-1', to: 'node-out-1' }
            ]
          }
        };

        const res = await fetch('/api/c-modules/test-builder/templates', {
          method: 'POST',
          headers: { ...credentials(), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const created = await res.json();
          showToast('New test scenario created successfully!', 'success');
          showCreateTestTemplateModal.value = false;
          await fetchTestTemplates();
          activeTestTemplateId.value = created.id;
          onTestTemplateSelectChange();
        } else {
          const err = await res.json().catch(() => ({}));
          showToast(err.message || 'Failed to create test scenario', 'error');
        }
      } catch (err) {
        showToast('Connection error: ' + err.message, 'error');
      } finally {
        isCreatingTestTemplate.value = false;
      }
    };

    const openDeleteTestTemplateModal = async () => {
      if (!activeTestTemplate.value) return;
      if (!confirm('Are you sure you want to delete test scenario [' + activeTestTemplate.value.name + ']?')) return;
      try {
        const res = await fetch('/api/c-modules/test-builder/templates/' + activeTestTemplate.value.id, {
          method: 'DELETE',
          headers: credentials()
        });
        if (res.ok) {
          showToast('Test scenario deleted successfully', 'success');
          activeTestTemplateId.value = '';
          activeTestTemplate.value = null;
          await fetchTestTemplates();
        }
      } catch (err) {
        showToast('Failed to delete scenario: ' + err.message, 'error');
      }
    };

    const openDryRunModal = () => {
      compileFlowToAssertions();
      showDryRunModal.value = true;
    };

    const executeDryRun = async () => {
      if (!activeTestTemplate.value) return;
      isRunningDryRun.value = true;
      try {
        let mockPacket = {};
        try {
          mockPacket = JSON.parse(dryRunPayloadRaw.value);
        } catch (e) {
          showToast('Invalid JSON Payload: ' + e.message, 'error');
          isRunningDryRun.value = false;
          return;
        }

        const payload = {
          templateId: activeTestTemplate.value.id,
          executionMode: testBuilderMode.value,
          flowConfig: activeTestTemplate.value.flowConfig,
          assertions: activeTestTemplate.value.assertions || [],
          customScript: activeTestTemplate.value.customScript || '',
          mockPacket: mockPacket,
          context: dryRunContext.value
        };

        const res = await fetch('/api/c-modules/test-builder/dry-run', {
          method: 'POST',
          headers: { ...credentials(), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          dryRunResponse.value = await res.json();
          showToast('Dry-Run test completed', dryRunResponse.value.pass ? 'success' : 'warning');
        } else {
          const err = await res.json().catch(() => ({}));
          showToast(err.message || 'Error running dry-run test', 'error');
        }
      } catch (err) {
        showToast('Connection error during dry run: ' + err.message, 'error');
      } finally {
        isRunningDryRun.value = false;
      }
    };

    watch(activeTab, (tab) => {
      if (tab === 'test-builder') {
        fetchTestTemplates();
      }
    });

    const onGlobalClick = () => {
      if (wireContextMenu.value.visible) {
        closeWireContextMenu();
      }
    };

    onMounted(() => {
      window.addEventListener('click', onGlobalClick);
      if (activeTab.value === 'test-builder') {
        fetchTestTemplates();
      }
    });

    onUnmounted(() => {
      window.removeEventListener('click', onGlobalClick);
    });

    return {
      testTemplatesList,
      activeTestTemplateId,
      activeTestTemplate,
      testBuilderMode,
      testAvailableFields,
      isSavingTestTemplate,
      isCreatingTestTemplate,
      isRunningDryRun,
      showCreateTestTemplateModal,
      showDryRunModal,
      newTestTemplateForm,
      dryRunPayloadRaw,
      dryRunContext,
      dryRunResponse,
      currentFlowNodes,
      currentFlowEdges,
      canvasContainerRef,
      wireDraft,
      draggingNode,
      wireContextMenu,
      openWireContextMenu,
      closeWireContextMenu,
      onCanvasContextMenu,
      inspectWireConnection,
      deleteWireFromMenu,
      formatFirmware,
      getNodePosX,
      getNodePosY,
      getFieldEnglishLabel,
      getNodeDisplayName,
      showFunctionScriptModal,
      editingFunctionNode,
      functionScriptBuffer,
      functionScriptTestResult,
      isTestingFunctionScript,
      getNodeBadgeClass,
      getNodeIcon,
      getNodeCardClass,
      getNodeScriptPreview,
      getEdgePath,
      getEdgeMidX,
      getEdgeMidY,
      getDraftWirePath,
      onOutputPortClick,
      onInputPortClick,
      removeFlowEdge,
      onCanvasMouseMove,
      onCanvasMouseUp,
      onCanvasClick,
      cancelWireDraft,
      onNodeHeaderMouseDown,
      autoArrangeNodes,
      autoWirePipeline,
      clearFlowWires,
      openFunctionScriptModal,
      saveFunctionScript,
      insertScriptVariable,
      applyScriptTemplate,
      testFunctionScriptInModal,
      onTestTemplateSelectChange,
      fetchTestAvailableFields,
      addFlowNode,
      addExtractorNodeForField,
      onExtractorFieldChange,
      removeFlowNode,
      compileFlowToAssertions,
      convertFlowToScript,
      insertCodeSnippet,
      insertSampleScript,
      saveCurrentTestTemplate,
      openCreateTestTemplateModal,
      createTestTemplate,
      openDeleteTestTemplateModal,
      openDryRunModal,
      executeDryRun,
    };
  }
`;
