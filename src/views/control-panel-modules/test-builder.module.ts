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
            <span>FW: v{{ activeTestTemplate.firmwareVersion }}</span>
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
            <div class="space-y-2">
              <button
                type="button"
                @click="addFlowNode('extractor')"
                class="w-full text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 flex items-center justify-between transition group cursor-pointer"
              >
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 text-xs">
                    <i class="fa-solid fa-filter"></i>
                  </div>
                  <div>
                    <div class="text-xs font-semibold text-slate-200 group-hover:text-sky-300">Field Extractor</div>
                    <div class="text-[10px] text-slate-500">Extract sensor field</div>
                  </div>
                </div>
                <i class="fa-solid fa-plus text-xs text-slate-600 group-hover:text-sky-400"></i>
              </button>

              <button
                type="button"
                @click="addFlowNode('comparator')"
                class="w-full text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 flex items-center justify-between transition group cursor-pointer"
              >
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-xs">
                    <i class="fa-solid fa-scale-balanced"></i>
                  </div>
                  <div>
                    <div class="text-xs font-semibold text-slate-200 group-hover:text-amber-300">Rule Comparator</div>
                    <div class="text-[10px] text-slate-500">Pass/Fail thresholds & conditions</div>
                  </div>
                </div>
                <i class="fa-solid fa-plus text-xs text-slate-600 group-hover:text-amber-400"></i>
              </button>

              <button
                type="button"
                @click="addFlowNode('counter')"
                class="w-full text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 flex items-center justify-between transition group cursor-pointer"
              >
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs">
                    <i class="fa-solid fa-stopwatch"></i>
                  </div>
                  <div>
                    <div class="text-xs font-semibold text-slate-200 group-hover:text-emerald-300">Packet Counter</div>
                    <div class="text-[10px] text-slate-500">Count minimum packets</div>
                  </div>
                </div>
                <i class="fa-solid fa-plus text-xs text-slate-600 group-hover:text-emerald-400"></i>
              </button>
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
        <div class="lg:col-span-9">
          <div class="rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-5 min-h-[580px] relative overflow-hidden flex flex-col justify-between">
            
            <!-- Canvas Grid Overlay Pattern -->
            <div class="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none"></div>

            <!-- Flow Canvas Nodes Container -->
            <div class="relative z-10 space-y-4">
              
              <!-- Canvas Header Info -->
              <div class="flex items-center justify-between pb-3 border-b border-slate-900">
                <div class="flex items-center gap-3">
                  <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span class="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                    PIPELINE: {{ activeTestTemplate.sku }} (v{{ activeTestTemplate.firmwareVersion }})
                  </span>
                </div>
                <div class="text-xs text-slate-500 font-mono">
                  Total nodes: <strong class="text-slate-200">{{ currentFlowNodes.length }}</strong>
                </div>
              </div>

              <!-- Node Cards List (Horizontal / Pipeline Grid Layout) -->
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                
                <!-- Loop each node in flowConfig -->
                <div
                  v-for="(node, idx) in currentFlowNodes"
                  :key="node.id"
                  class="p-4 rounded-xl border transition shadow-lg relative bg-slate-900/90"
                  :class="[
                    node.type === 'lora-in' ? 'border-sky-500/50 ring-1 ring-sky-500/20' :
                    node.type === 'extractor' ? 'border-indigo-500/50' :
                    node.type === 'comparator' ? 'border-amber-500/50' :
                    node.type === 'counter' ? 'border-emerald-500/50' : 'border-purple-500/50'
                  ]"
                >
                  <!-- Node Header -->
                  <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                    <div class="flex items-center gap-2">
                      <span
                        class="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                        :class="[
                          node.type === 'lora-in' ? 'bg-sky-500/20 text-sky-400' :
                          node.type === 'extractor' ? 'bg-indigo-500/20 text-indigo-400' :
                          node.type === 'comparator' ? 'bg-amber-500/20 text-amber-400' :
                          node.type === 'counter' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'
                        ]"
                      >
                        <i :class="[
                          node.type === 'lora-in' ? 'fa-solid fa-satellite-dish' :
                          node.type === 'extractor' ? 'fa-solid fa-filter' :
                          node.type === 'comparator' ? 'fa-solid fa-scale-balanced' :
                          node.type === 'counter' ? 'fa-solid fa-stopwatch' : 'fa-solid fa-flag-checkered'
                        ]"></i>
                      </span>
                      <span class="text-xs font-bold text-white uppercase tracking-wider">{{ node.label }}</span>
                    </div>

                    <!-- Delete button (except lora-in and verdict) -->
                    <button
                      v-if="node.type !== 'lora-in' && node.type !== 'verdict'"
                      type="button"
                      @click="removeFlowNode(node.id)"
                      class="text-slate-500 hover:text-rose-400 text-xs p-1 transition"
                      title="Delete node"
                    >
                      <i class="fa-solid fa-xmark"></i>
                    </button>
                  </div>

                  <!-- Node Specific Body Form -->
                  <div class="space-y-2.5 text-xs">
                    
                    <!-- LORA-IN NODE -->
                    <div v-if="node.type === 'lora-in'" class="space-y-1.5 font-mono text-[11px] text-slate-400">
                      <div>Trigger: <strong class="text-sky-300">Uplink Telemetry Event</strong></div>
                      <div>Target SKU: <strong class="text-white">{{ activeTestTemplate.sku }}</strong></div>
                      <div>Firmware: <strong class="text-indigo-300">v{{ activeTestTemplate.firmwareVersion }}</strong></div>
                    </div>

                    <!-- EXTRACTOR NODE -->
                    <div v-if="node.type === 'extractor'" class="space-y-2">
                      <label class="block text-[11px] text-slate-400 font-semibold">Select data field:</label>
                      <select
                        v-model="node.params.field"
                        @change="onExtractorFieldChange(node)"
                        class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:border-indigo-500"
                      >
                        <option v-for="f in testAvailableFields" :key="f.name" :value="f.name">
                          {{ f.name }} ({{ f.label }})
                        </option>
                      </select>
                      <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Unit: {{ node.params.unit || 'N/A' }}</span>
                        <span class="text-indigo-400">Path: decoded.{{ node.params.field }}</span>
                      </div>
                    </div>

                    <!-- COMPARATOR / RULE NODE -->
                    <div v-if="node.type === 'comparator'" class="space-y-2">
                      <div class="grid grid-cols-2 gap-2">
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
                      <div v-if="node.params.operator === 'BETWEEN'" class="grid grid-cols-2 gap-2">
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
                            class="px-2 py-0.5 rounded border text-[10px] font-bold uppercase transition"
                          >
                            Fail (Error)
                          </button>
                          <button
                            type="button"
                            @click="node.params.severity = 'WARNING'"
                            :class="node.params.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'text-slate-500 border-transparent'"
                            class="px-2 py-0.5 rounded border text-[10px] font-bold uppercase transition"
                          >
                            Warning
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- COUNTER NODE -->
                    <div v-if="node.type === 'counter'" class="space-y-2">
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
                        Only evaluate PASS when device sends at least {{ node.params.minPackets }} packets.
                      </div>
                    </div>

                    <!-- VERDICT OUTPUT NODE -->
                    <div v-if="node.type === 'verdict'" class="space-y-1.5 font-mono text-[11px] text-slate-400">
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
            </div>

            <!-- Canvas Bottom Summary -->
            <div class="relative z-10 pt-4 mt-6 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-circle-info text-indigo-400"></i>
                <span>All matching nodes will be automatically compiled into Database Assertions.</span>
              </div>
              <button
                type="button"
                @click="compileFlowToAssertions"
                class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold transition flex items-center gap-1.5"
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
            <label class="block text-slate-400 mb-1">Firmware v(*):</label>
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
`;

export const TEST_BUILDER_SCRIPT = `
  function useTestBuilderModule(ctx) {
    const { ref, computed, watch, onMounted } = Vue;
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
      if (!activeTestTemplate.value.flowConfig) activeTestTemplate.value.flowConfig = { nodes: [] };
      if (!activeTestTemplate.value.flowConfig.nodes) activeTestTemplate.value.flowConfig.nodes = [];

      const newId = 'node-' + Date.now();
      let node = { id: newId, type, label: '', params: {} };

      if (type === 'extractor') {
        const defaultField = testAvailableFields.value[0]?.name || 'co2';
        node.label = 'Field Extractor';
        node.params = { field: defaultField, label: defaultField, unit: testAvailableFields.value[0]?.unit || '' };
      } else if (type === 'comparator') {
        node.label = 'Rule Comparator';
        node.params = { field: testAvailableFields.value[0]?.name || 'co2', operator: 'BETWEEN', min: 400, max: 2000, value: 0, severity: 'ERROR' };
      } else if (type === 'counter') {
        node.label = 'Packet Counter';
        node.params = { minPackets: activeTestTemplate.value.minPacketsRequired || 3 };
      }

      activeTestTemplate.value.flowConfig.nodes.push(node);
      showToast('Added node: ' + node.label, 'success');
    };

    const addExtractorNodeForField = (field) => {
      if (!activeTestTemplate.value) return;
      if (!activeTestTemplate.value.flowConfig) activeTestTemplate.value.flowConfig = { nodes: [] };
      if (!activeTestTemplate.value.flowConfig.nodes) activeTestTemplate.value.flowConfig.nodes = [];

      const node = {
        id: 'node-' + Date.now(),
        type: 'extractor',
        label: field.label || field.name,
        params: { field: field.name, label: field.label || field.name, unit: field.unit || '' }
      };
      activeTestTemplate.value.flowConfig.nodes.push(node);
      showToast('Added Extractor for field: ' + field.name, 'success');
    };

    const onExtractorFieldChange = (node) => {
      const f = testAvailableFields.value.find(item => item.name === node.params.field);
      if (f) {
        node.params.unit = f.unit || '';
        node.params.label = f.label || f.name;
      }
    };

    const removeFlowNode = (nodeId) => {
      if (!activeTestTemplate.value || !activeTestTemplate.value.flowConfig) return;
      activeTestTemplate.value.flowConfig.nodes = activeTestTemplate.value.flowConfig.nodes.filter(n => n.id !== nodeId);
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
        const payload = {
          name: activeTestTemplate.value.name,
          description: activeTestTemplate.value.description,
          sku: activeTestTemplate.value.sku,
          firmwareVersion: activeTestTemplate.value.firmwareVersion,
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
        const payload = {
          name: newTestTemplateForm.value.name,
          code: newTestTemplateForm.value.code.trim().toUpperCase(),
          sku: newTestTemplateForm.value.sku.trim().toUpperCase(),
          firmwareVersion: String(newTestTemplateForm.value.firmwareVersion || '1'),
          timeoutSeconds: Number(newTestTemplateForm.value.timeoutSeconds || 180),
          minPacketsRequired: Number(newTestTemplateForm.value.minPacketsRequired || 3),
          description: newTestTemplateForm.value.description,
          executionMode: 'FLOW',
          flowConfig: {
            nodes: [
              { id: 'node-in-1', type: 'lora-in', label: 'LoRaWAN Ingestion', params: { sku: newTestTemplateForm.value.sku } },
              { id: 'node-ext-1', type: 'extractor', label: 'Field Extractor', params: { field: 'value' } },
              { id: 'node-out-1', type: 'verdict', label: 'QA Verdict Pass/Fail', params: {} }
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

    onMounted(() => {
      if (activeTab.value === 'test-builder') {
        fetchTestTemplates();
      }
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
