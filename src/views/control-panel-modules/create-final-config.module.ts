// ========================================================
// C-MODULE: CREATE FINAL CONFIG & MODBUS PRESET GENERATOR
// ========================================================

export const CREATE_FINAL_CONFIG_TEMPLATE = `
        <!-- TAB 19: CREATE FINAL CONFIG -->
        <div v-show="activeTab === 'create-final-config'" class="space-y-6">
          <!-- Header Banner -->
          <div class="glass-card rounded-2xl p-5 border border-sky-500/20 bg-gradient-to-br from-slate-900 via-slate-900/90 to-sky-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-xl shadow-inner">
                <i class="fa-solid fa-sliders"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-extrabold text-white">Create Final Config</h2>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">C-MODULE</span>
                </div>
                <p class="text-xs text-slate-400 mt-0.5">Tạo template Modbus preset từ memmap payload theo SO, Item Code, SKU & Short FW, lọc Dec Reg >= 303 với format precheck UART.</p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-3">
              <button
                @click="openFinalConfigSaveModal"
                :disabled="!canSaveFinalConfig"
                class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition"
              >
                <i class="fa-solid fa-floppy-disk"></i> Tạo Final config
              </button>
              <button
                @click="resetFinalConfigForm"
                class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer transition"
                title="Reset Form"
              >
                <i class="fa-solid fa-rotate-left"></i> Reset
              </button>
            </div>
          </div>

          <!-- Configuration Selector Card -->
          <div class="glass-card rounded-2xl p-5 border border-slate-800 space-y-4 shadow-xl">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- SO Input with autocomplete datalist -->
              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Sales Order (SO) <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <input
                    v-model="finalConfigSo"
                    @input="onFinalConfigSoChange"
                    list="fc-so-datalist"
                    type="text"
                    placeholder="e.g. SO/2026/00001"
                    class="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-sky-500 text-xs font-mono text-white placeholder-slate-500 focus:outline-none transition"
                  />
                  <datalist id="fc-so-datalist">
                    <option v-for="so in fcSalesOrdersList" :key="so.id || so.soCode" :value="so.soCode">
                      {{ so.soCode }} - {{ so.customerName || '' }}
                    </option>
                  </datalist>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Chọn từ đơn hàng hoặc nhập mã SO mới.</p>
              </div>

              <!-- ITEM-CODE Input with autocomplete datalist -->
              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Item Code <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <input
                    v-model="finalConfigItemCode"
                    @input="onFinalConfigItemCodeChange"
                    list="fc-itemcode-datalist"
                    type="text"
                    placeholder="e.g. WSLRW-ATH-01"
                    class="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-sky-500 text-xs font-mono text-white placeholder-slate-500 focus:outline-none transition uppercase"
                  />
                  <datalist id="fc-itemcode-datalist">
                    <option v-for="ic in fcItemCodesList" :key="ic.id || ic.itemCode" :value="ic.itemCode">
                      {{ ic.itemCode }} ({{ ic.sku || '' }} v{{ ic.firmwareVersion || '' }})
                    </option>
                  </datalist>
                </div>
                <p class="text-[11px] text-slate-500 mt-1">Mã sản phẩm trong danh mục hoặc đơn hàng.</p>
              </div>

              <!-- SKU Input -->
              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Hardware SKU <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <input
                    v-model="finalConfigSku"
                    @input="onFinalConfigSkuChange"
                    type="text"
                    placeholder="e.g. WSLRW-ATH"
                    class="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border text-xs font-mono text-white placeholder-slate-500 focus:outline-none transition uppercase"
                    :class="fcSkuError ? 'border-red-500 focus:border-red-400' : 'border-slate-700 focus:border-sky-500'"
                  />
                  <span v-if="finalConfigSku && !fcSkuError" class="absolute right-3 top-2.5 text-xs text-emerald-400">
                    <i class="fa-solid fa-check"></i>
                  </span>
                </div>
                <p v-if="fcSkuError" class="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-mono">
                  <i class="fa-solid fa-circle-exclamation"></i> {{ fcSkuError }}
                </p>
                <p v-else class="text-[11px] text-slate-500 mt-1">Mã phần cứng cảm biến (e.g. WSLRW-ATH).</p>
              </div>

              <!-- SHORT FW VERSION Input -->
              <div>
                <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Short FW Version <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <input
                    v-model="finalConfigShortFw"
                    @input="onFinalConfigShortFwChange"
                    type="text"
                    placeholder="e.g. 6 (strictly integer)"
                    class="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border text-xs font-mono text-white placeholder-slate-500 focus:outline-none transition"
                    :class="fcFwError ? 'border-red-500 focus:border-red-400' : 'border-slate-700 focus:border-sky-500'"
                  />
                  <span v-if="finalConfigShortFw && !fcFwError" class="absolute right-3 top-2.5 text-xs text-emerald-400">
                    <i class="fa-solid fa-check"></i>
                  </span>
                </div>
                <p v-if="fcFwError" class="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-mono">
                  <i class="fa-solid fa-circle-exclamation"></i> {{ fcFwError }}
                </p>
                <p v-else class="text-[11px] text-slate-500 mt-1">Số nguyên dương (không có tiền tố v hoặc thập phân).</p>
              </div>
            </div>

            <!-- Context Badges & Status Information Banner -->
            <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-slate-400">Preset Info:</span>
                <span v-if="finalConfigSku" class="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 font-mono font-bold border border-sky-500/20">
                  SKU: {{ finalConfigSku }}
                </span>
                <span v-if="finalConfigShortFw" class="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 font-mono font-bold border border-amber-500/20">
                  Short FW: {{ finalConfigShortFw }}
                </span>
                <span v-if="finalConfigFirmwareVersion" class="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 font-mono font-bold border border-indigo-500/20">
                  Full FW: {{ finalConfigFirmwareVersion }}
                </span>
                <span v-if="finalConfigSku && finalConfigShortFw" class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  Key: {{ finalConfigSku }}_{{ finalConfigShortFw }}
                </span>
              </div>

              <!-- Memmap Load Status Indicator -->
              <div class="flex items-center gap-2">
                <div v-if="isLoadingFcMemmap" class="flex items-center gap-2 text-sky-400 font-mono text-xs">
                  <i class="fa-solid fa-circle-notch animate-spin"></i>
                  <span>Đang tải Memory Map...</span>
                </div>
                <div v-else-if="fcMemmapNotFound" class="px-3 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-2 font-mono font-bold text-xs">
                  <i class="fa-solid fa-triangle-exclamation"></i>
                  <span>MEMMAP Chưa tồn tại</span>
                </div>
                <div v-else-if="finalConfigRegs.length > 0" class="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-2 font-mono font-bold text-xs">
                  <i class="fa-solid fa-circle-check"></i>
                  <span>Đã nạp Memmap ({{ finalConfigRegs.length }} thanh ghi Dec Reg &gt;= 303)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Interactive Table Card -->
          <div class="glass-card rounded-2xl p-5 border border-slate-800 space-y-4 shadow-xl">
            <!-- Search & Filter Bar -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="relative flex-1 max-w-md">
                <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-2.5 text-slate-500 text-xs"></i>
                <input
                  v-model="finalConfigTableSearch"
                  @input="onFinalConfigTableSearchChange"
                  type="text"
                  placeholder="Tìm theo Dec Reg, Hex Reg, Description, Comment, Format..."
                  class="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-sky-500 text-xs text-white placeholder-slate-500 focus:outline-none transition"
                />
              </div>

              <div class="flex flex-wrap items-center gap-3 text-xs">
                <span class="text-slate-400">
                  Tổng Regs (&gt;= 303): <strong class="text-white">{{ finalConfigRegs.length }}</strong>
                </span>
                <span class="text-slate-600">•</span>
                <span class="text-slate-400">
                  Đã chọn: <strong class="text-sky-400">{{ checkedRegsCount }}</strong>
                </span>
                <span class="text-slate-600">•</span>
                <span>
                  UART Precheck:
                  <span v-if="finalConfigRegs.length === 0" class="text-slate-500">Chưa nạp</span>
                  <span v-else-if="precheckErrorsCount === 0" class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    <i class="fa-solid fa-check mr-1"></i>TẤT CẢ HỢP LỆ (PASS)
                  </span>
                  <span v-else class="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                    <i class="fa-solid fa-triangle-exclamation mr-1"></i>{{ precheckErrorsCount }} LỖI FORMAT
                  </span>
                </span>
              </div>
            </div>

            <!-- Tabulator Container -->
            <div id="create-final-config-tabulator-table" class="rounded-xl overflow-hidden border border-slate-800 bg-slate-950/60 min-h-[460px]"></div>

            <p class="text-[11px] text-slate-500 flex items-center gap-1.5">
              <i class="fa-solid fa-circle-info text-sky-400"></i>
              <span>Cột <strong>Input Config</strong> cho phép sửa trực tiếp. Định dạng được kiểm tra tiền kiểm thời gian thực (UART Precheck) dựa trên kiểu dữ liệu và dung lượng thanh ghi.</span>
            </p>
          </div>
        </div>

        <!-- POPUP MODAL: XÁC NHẬN TẠO FINAL CONFIG PRESET -->
        <div
          v-if="showFinalConfigSaveModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
          style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(6px);"
          @click.self="showFinalConfigSaveModal = false"
        >
          <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl text-slate-200 animate-in fade-in zoom-in duration-200">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <div class="flex items-center gap-2 font-bold text-white text-base">
                <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-sm">
                  <i class="fa-solid fa-sliders"></i>
                </div>
                <span>Xác nhận Tạo Final Config Preset</span>
              </div>
              <button
                type="button"
                @click="showFinalConfigSaveModal = false"
                class="text-slate-400 hover:text-white cursor-pointer transition"
              >
                <i class="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <div class="space-y-3 text-xs">
              <div class="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2.5 font-mono">
                <div class="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span class="text-slate-400">Sales Order (SO):</span>
                  <span class="font-bold text-sky-300">{{ finalConfigSo }}</span>
                </div>
                <div class="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span class="text-slate-400">Item Code:</span>
                  <span class="font-bold text-emerald-300">{{ finalConfigItemCode }}</span>
                </div>
                <div class="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span class="text-slate-400">Hardware SKU:</span>
                  <span class="font-bold text-cyan-300">{{ finalConfigSku }}</span>
                </div>
                <div class="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span class="text-slate-400">Short Firmware Version:</span>
                  <span class="font-bold text-amber-300">{{ finalConfigShortFw }}</span>
                </div>
                <div class="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span class="text-slate-400">Full Firmware Version:</span>
                  <span class="font-bold text-indigo-300">{{ finalConfigFirmwareVersion || (finalConfigShortFw + '.0') }}</span>
                </div>
                <div class="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span class="text-slate-400">Số thanh ghi được chọn:</span>
                  <span class="font-bold text-white">{{ checkedRegsCount }} thanh ghi (Dec &gt;= 303)</span>
                </div>
                <div class="flex justify-between items-center py-1">
                  <span class="text-slate-400">Trạng thái UART Precheck:</span>
                  <span :class="precheckErrorsCount === 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'">
                    {{ precheckErrorsCount === 0 ? 'TẤT CẢ HỢP LỆ (PASS)' : precheckErrorsCount + ' LỖI FORMAT' }}
                  </span>
                </div>
              </div>

              <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                Template Preset sẽ được lưu trữ đồng thời vào bảng <strong>final_config_presets</strong>, <strong>final_config_regs</strong> và hệ thống <strong>modbus_presets</strong> để D-Module (serial-uart / test engine) có thể nạp cấu hình trực tiếp.
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                @click="showFinalConfigSaveModal = false"
                class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition"
              >
                Hủy
              </button>
              <button
                type="button"
                @click="confirmSaveFinalConfig"
                :disabled="isSavingFinalConfig || precheckErrorsCount > 0"
                class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 transition"
              >
                <i :class="isSavingFinalConfig ? 'fa-solid fa-circle-notch animate-spin' : 'fa-solid fa-check'"></i>
                <span>{{ isSavingFinalConfig ? 'Đang lưu vào database...' : 'Xác nhận & Lưu Preset' }}</span>
              </button>
            </div>
          </div>
        </div>
`;

export const CREATE_FINAL_CONFIG_MODALS = ``;

export const CREATE_FINAL_CONFIG_SCRIPT = `
    function useCreateFinalConfigModule(ctx) {
      const { ref, computed, watch, onUnmounted, nextTick } = Vue;
      const { showToast, authHeaders, activeTab } = ctx;

      // Inputs
      const finalConfigSo = ref('');
      const finalConfigItemCode = ref('');
      const finalConfigSku = ref('');
      const finalConfigShortFw = ref('');
      const finalConfigFirmwareVersion = ref('');

      // Reference options fetched from DB
      const fcSalesOrdersList = ref([]);
      const fcItemCodesList = ref([]);

      // State & registers
      const finalConfigRegs = ref([]);
      const isLoadingFcMemmap = ref(false);
      const fcMemmapNotFound = ref(false);
      const finalConfigTableSearch = ref('');
      const showFinalConfigSaveModal = ref(false);
      const isSavingFinalConfig = ref(false);

      let fcTabulatorInstance = null;
      let initFcTableTimeout = null;
      let debounceMemmapTimer = null;

      // SKU validation
      const fcSkuError = computed(() => {
        if (!finalConfigSku.value) return '';
        const trimmed = finalConfigSku.value.trim().toUpperCase();
        if (!/^[A-Z0-9_-]+$/.test(trimmed)) {
          return 'SKU chỉ được chứa chữ hoa, số, dấu gạch nối hoặc gạch dưới';
        }
        return '';
      });

      // Short FW validation
      const fcFwError = computed(() => {
        if (!finalConfigShortFw.value) return '';
        const trimmed = String(finalConfigShortFw.value).trim();
        if (!/^[0-9]+$/.test(trimmed)) {
          return 'Short FW Version phải là số nguyên thuần túy (không có v, không có dấu chấm)';
        }
        if (Number(trimmed) <= 0) {
          return 'Short FW Version phải > 0';
        }
        return '';
      });

      // Normalization of register data format (matching serial-uart.module.ts)
      function normalizeFormat(f) {
        const s = String(f || '').toLowerCase().trim();
        if (s.includes('string') || s.includes('str') || s.includes('ascii') || s.includes('text')) return 'string';
        if (s.includes('float') || s.includes('double')) return 'float';
        if (s.includes('uint')) return 'uint';
        if (s.includes('int')) return 'int';
        if (s.includes('hex')) return 'hex';
        return 'uint';
      }

      // UART Format Precheck Engine (matching serial-uart.module.ts)
      function validateRegisterValue(valStr, format, numRegs, rangeStr) {
        const fmt = normalizeFormat(format);
        const val = String(valStr !== undefined && valStr !== null ? valStr : '').trim();
        const numreg = Number(numRegs) > 0 ? Number(numRegs) : 1;

        if (val === '') {
          return { valid: false, error: 'Giá trị không được để trống' };
        }

        // 1. UINT
        if (fmt === 'uint') {
          if (!/^\\d+$/.test(val)) {
            return { valid: false, error: 'Chỉ chấp nhận số nguyên không âm (uint)' };
          }
          const n = Number(val);
          if (numreg === 1) {
            if (n < 0 || n > 65535) {
              return { valid: false, error: 'Vượt dải 16-bit uint (0..65535)' };
            }
          } else if (numreg === 2) {
            if (n < 0 || n > 4294967295) {
              return { valid: false, error: 'Vượt dải 32-bit uint (0..4294967295)' };
            }
          } else {
            try {
              if (BigInt(val) < 0n) {
                return { valid: false, error: 'Giá trị uint phải >= 0' };
              }
            } catch (e) {
              return { valid: false, error: 'Số nguyên không hợp lệ' };
            }
          }
        }

        // 2. INT
        else if (fmt === 'int') {
          if (!/^-?\\d+$/.test(val)) {
            return { valid: false, error: 'Chỉ chấp nhận số nguyên có dấu (int)' };
          }
          const n = Number(val);
          if (numreg === 1) {
            if (n < -32768 || n > 32767) {
              return { valid: false, error: 'Vượt dải 16-bit int (-32768..32767)' };
            }
          } else if (numreg === 2) {
            if (n < -2147483648 || n > 2147483647) {
              return { valid: false, error: 'Vượt dải 32-bit int (-2147483648..2147483647)' };
            }
          }
        }

        // 3. FLOAT
        else if (fmt === 'float') {
          if (isNaN(Number(val)) || !/^-?\\d+(\\.\\d+)?([eE][+-]?\\d+)?$/.test(val)) {
            return { valid: false, error: 'Giá trị float không hợp lệ' };
          }
          if (numreg < 2) {
            return { valid: false, error: 'Float yêu cầu ít nhất 2 thanh ghi (# Regs >= 2)' };
          }
        }

        // 4. STRING
        else if (fmt === 'string') {
          if (!/^[\\x00-\\x7F]*$/.test(val)) {
            return { valid: false, error: 'Chỉ chấp nhận chuỗi ký tự ASCII' };
          }
          const maxLen = numreg * 2;
          if (val.length > maxLen) {
            return { valid: false, error: 'Độ dài (' + val.length + ') vượt quá ' + maxLen + ' ký tự' };
          }
        }

        // 5. HEX
        else if (fmt === 'hex') {
          if (!/^[0-9a-fA-F\\s]+$/.test(val)) {
            return { valid: false, error: 'Chỉ chấp nhận ký tự Hex (0-9, A-F)' };
          }
          const cleanHex = val.replace(/\\s+/g, '');
          if (cleanHex.length % 2 !== 0) {
            return { valid: false, error: 'Độ dài chuỗi Hex phải là số chẵn' };
          }
          const maxHexChars = numreg * 4;
          if (cleanHex.length > maxHexChars) {
            return { valid: false, error: 'Độ dài vượt quá dung lượng thanh ghi (tối đa ' + maxHexChars + ' ký tự)' };
          }
        }

        // Range validation check if defined
        if (rangeStr && (fmt === 'uint' || fmt === 'int' || fmt === 'float')) {
          const rangeMatch = String(rangeStr).match(/^(-?\\d+(?:\\.\\d+)?)\\s*(?:\\.\\.|-)\\s*(-?\\d+(?:\\.\\d+)?)$/);
          if (rangeMatch) {
            const minVal = Number(rangeMatch[1]);
            const maxVal = Number(rangeMatch[2]);
            const numVal = Number(val);
            if (!isNaN(minVal) && !isNaN(maxVal) && !isNaN(numVal)) {
              if (numVal < minVal || numVal > maxVal) {
                return { valid: false, error: 'Vượt dải khuyến cáo [' + minVal + '..' + maxVal + ']' };
              }
            }
          }
        }

        return { valid: true, error: '' };
      }

      // Computed counters
      const checkedRegsCount = computed(() => {
        return finalConfigRegs.value.filter(r => !!r.checked).length;
      });

      const precheckErrorsCount = computed(() => {
        return finalConfigRegs.value.filter(r => !!r.checked && !r.valid).length;
      });

      const canSaveFinalConfig = computed(() => {
        return (
          finalConfigSo.value.trim().length > 0 &&
          finalConfigItemCode.value.trim().length > 0 &&
          finalConfigSku.value.trim().length > 0 &&
          !fcSkuError.value &&
          finalConfigShortFw.value.trim().length > 0 &&
          !fcFwError.value &&
          !fcMemmapNotFound.value &&
          checkedRegsCount.value > 0 &&
          precheckErrorsCount.value === 0
        );
      });

      // Load Sales Orders & Item Codes from database API (NO MOCK DATA)
      const loadReferenceData = async () => {
        try {
          const soRes = await fetch('/api/sales-orders?limit=100', {
            headers: authHeaders ? authHeaders() : {},
          });
          if (soRes.ok) {
            const soData = await soRes.json();
            const items = soData.items || (Array.isArray(soData) ? soData : []);
            fcSalesOrdersList.value = items;
          }
        } catch (e) {
          console.warn('[CreateFinalConfig] Failed to fetch sales orders:', e);
        }

        try {
          const icRes = await fetch('/api/item-codes/picker', {
            headers: authHeaders ? authHeaders() : {},
          });
          if (icRes.ok) {
            const icData = await icRes.json();
            fcItemCodesList.value = Array.isArray(icData) ? icData : (icData.data || []);
          }
        } catch (e) {
          console.warn('[CreateFinalConfig] Failed to fetch item codes:', e);
        }
      };

      // Handle SO input changes & link to SO line items
      const onFinalConfigSoChange = () => {
        const soCode = finalConfigSo.value.trim();
        if (!soCode) return;
        const matchedSo = fcSalesOrdersList.value.find(s => s.soCode === soCode);
        if (matchedSo && Array.isArray(matchedSo.items) && matchedSo.items.length > 0) {
          const firstItem = matchedSo.items[0];
          if (!finalConfigItemCode.value && firstItem.itemCode) {
            finalConfigItemCode.value = firstItem.itemCode;
            onFinalConfigItemCodeChange();
          }
        }
      };

      // Handle Item Code input changes & auto populate SKU and Short FW
      const onFinalConfigItemCodeChange = () => {
        const itemCode = finalConfigItemCode.value.trim();
        if (!itemCode) return;

        // Try find in item codes picker list
        const matched = fcItemCodesList.value.find(ic => ic.itemCode === itemCode);
        if (matched) {
          if (matched.sku) finalConfigSku.value = matched.sku.toUpperCase();
          if (matched.firmwareVersion) {
            finalConfigFirmwareVersion.value = matched.firmwareVersion;
            const parsedShort = parseInt(String(matched.firmwareVersion).replace(/^v/i, ''), 10);
            if (!isNaN(parsedShort) && parsedShort > 0) {
              finalConfigShortFw.value = String(parsedShort);
            }
          }
          triggerAutoLoadMemmap();
          return;
        }

        // Try find in sales orders list items
        for (const so of fcSalesOrdersList.value) {
          if (Array.isArray(so.items)) {
            const foundInSo = so.items.find(i => i.itemCode === itemCode);
            if (foundInSo) {
              if (foundInSo.sku) finalConfigSku.value = foundInSo.sku.toUpperCase();
              if (foundInSo.firmwareVersion) {
                finalConfigFirmwareVersion.value = foundInSo.firmwareVersion;
                const parsedShort = parseInt(String(foundInSo.firmwareVersion).replace(/^v/i, ''), 10);
                if (!isNaN(parsedShort) && parsedShort > 0) {
                  finalConfigShortFw.value = String(parsedShort);
                }
              }
              triggerAutoLoadMemmap();
              return;
            }
          }
        }
      };

      const onFinalConfigSkuChange = () => {
        if (finalConfigSku.value) {
          finalConfigSku.value = finalConfigSku.value.toUpperCase();
        }
        triggerAutoLoadMemmap();
      };

      const onFinalConfigShortFwChange = () => {
        triggerAutoLoadMemmap();
      };

      // Debounce auto-load memmap when both SKU and Short FW are present
      const triggerAutoLoadMemmap = () => {
        if (debounceMemmapTimer) clearTimeout(debounceMemmapTimer);
        debounceMemmapTimer = setTimeout(() => {
          const sku = finalConfigSku.value.trim().toUpperCase();
          const fw = finalConfigShortFw.value.trim();
          if (sku && fw && !fcSkuError.value && !fcFwError.value) {
            loadMemmapPayload(sku, fw);
          }
        }, 300);
      };

      // Load Memory Map via GET /api/c-modules/memmap-upload/by-sku/:sku/:shortFw
      const loadMemmapPayload = async (sku, shortFw) => {
        isLoadingFcMemmap.value = true;
        fcMemmapNotFound.value = false;

        try {
          const res = await fetch('/api/c-modules/memmap-upload/by-sku/' + encodeURIComponent(sku) + '/' + encodeURIComponent(shortFw), {
            headers: authHeaders ? authHeaders() : {},
          });

          if (!res.ok) {
            fcMemmapNotFound.value = true;
            finalConfigRegs.value = [];
            if (showToast) {
              showToast('MEMMAP Chưa tồn tại cho SKU [' + sku + '] & FW [' + shortFw + ']', 'warning');
            }
            renderFinalConfigTabulator();
            return;
          }

          const json = await res.json();
          const rawRegs = (json && json.data && json.data.registers) ? json.data.registers : [];

          if (!Array.isArray(rawRegs) || rawRegs.length === 0) {
            fcMemmapNotFound.value = true;
            finalConfigRegs.value = [];
            if (showToast) {
              showToast('MEMMAP Chưa tồn tại', 'warning');
            }
            renderFinalConfigTabulator();
            return;
          }

          // Strict filter: Dec Reg >= 303
          const filtered = rawRegs.filter(r => Number(r.modbus_reg_dec) >= 303);

          if (filtered.length === 0) {
            finalConfigRegs.value = [];
            if (showToast) {
              showToast('Memmap tồn tại nhưng không có thanh ghi cấu hình (Dec Reg >= 303)', 'info');
            }
            renderFinalConfigTabulator();
            return;
          }

          finalConfigRegs.value = filtered.map((r, idx) => {
            const defaultVal = r.end_user_default !== undefined && r.end_user_default !== null ? String(r.end_user_default) : '';
            const valToWrite = defaultVal;
            const validation = validateRegisterValue(valToWrite, r.format, r.num_regs, r.range_val);
            const decVal = Number(r.modbus_reg_dec);
            const hexVal = r.modbus_reg_hex || ('0x' + decVal.toString(16).padStart(4, '0').toUpperCase());

            return {
              id: 'fc_' + decVal + '_' + idx,
              checked: true,
              address: decVal,
              modbus_reg_dec: decVal,
              modbus_reg_hex: hexVal,
              slave: 1,
              reg_num: Number(r.num_regs) > 0 ? Number(r.num_regs) : 1,
              parameter_name: r.description || '',
              description: r.description || '',
              format: normalizeFormat(r.format),
              comment: r.comment || '',
              range_val: r.range_val || '',
              value_on_memmap: defaultVal,
              value_to_write: valToWrite,
              endianness: 'big-endian',
              fn_read: r.fn_read || '3',
              fn_write: r.fn_write || '16',
              order_no: idx + 1,
              valid: validation.valid,
              validationError: validation.error,
            };
          });

          if (showToast) {
            showToast('Đã nạp memmap: ' + finalConfigRegs.value.length + ' thanh ghi cấu hình (>= 303)', 'success');
          }

          renderFinalConfigTabulator();
        } catch (err) {
          console.error('[CreateFinalConfig] Failed to load memmap:', err);
          fcMemmapNotFound.value = true;
          finalConfigRegs.value = [];
          if (showToast) {
            showToast('MEMMAP Chưa tồn tại', 'warning');
          }
          renderFinalConfigTabulator();
        } finally {
          isLoadingFcMemmap.value = false;
        }
      };

      // Tabulator 6.x rendering
      const renderFinalConfigTabulator = () => {
        if (initFcTableTimeout) clearTimeout(initFcTableTimeout);

        const container = document.getElementById('create-final-config-tabulator-table');
        if (!container) {
          initFcTableTimeout = setTimeout(renderFinalConfigTabulator, 120);
          return;
        }

        if (typeof Tabulator === 'undefined') {
          console.warn('[Tabulator] Global Tabulator not loaded yet');
          initFcTableTimeout = setTimeout(renderFinalConfigTabulator, 200);
          return;
        }

        if (fcTabulatorInstance) {
          try {
            fcTabulatorInstance.destroy();
          } catch (e) {}
          fcTabulatorInstance = null;
        }
        container.innerHTML = '';

        try {
          fcTabulatorInstance = new Tabulator(container, {
            data: finalConfigRegs.value,
            layout: 'fitColumns',
            height: '500px',
            placeholder: '<div class="text-slate-500 py-8 text-center"><i class="fa-solid fa-inbox text-2xl mb-2"></i><br>Chưa có dữ liệu thanh ghi. Vui lòng nhập SKU và Short FW để tự động nạp.</div>',
            columns: [
              // 1. Checkbox Selection
              {
                titleFormatter: function() {
                  const chk = document.createElement('input');
                  chk.type = 'checkbox';
                  chk.className = 'rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 cursor-pointer';
                  chk.checked = finalConfigRegs.value.length > 0 && finalConfigRegs.value.every(r => !!r.checked);
                  chk.addEventListener('change', function(e) {
                    const next = e.target.checked;
                    finalConfigRegs.value.forEach(r => { r.checked = next; });
                    finalConfigRegs.value = [...finalConfigRegs.value];
                    if (fcTabulatorInstance) {
                      fcTabulatorInstance.updateData(finalConfigRegs.value);
                    }
                  });
                  return chk;
                },
                field: 'checked',
                hozAlign: 'center',
                headerHozAlign: 'center',
                headerSort: false,
                width: 48,
                formatter: function(cell) {
                  const isChecked = !!cell.getValue();
                  const input = document.createElement('input');
                  input.type = 'checkbox';
                  input.checked = isChecked;
                  input.className = 'rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 cursor-pointer';
                  input.addEventListener('change', function(e) {
                    const rowData = cell.getRow().getData();
                    rowData.checked = e.target.checked;
                    const item = finalConfigRegs.value.find(r => r.id === rowData.id);
                    if (item) item.checked = e.target.checked;
                    finalConfigRegs.value = [...finalConfigRegs.value];
                  });
                  return input;
                }
              },
              // 2. Dec Reg (>= 303)
              {
                title: 'Dec Reg',
                field: 'modbus_reg_dec',
                hozAlign: 'right',
                headerHozAlign: 'right',
                width: 85,
                formatter: function(cell) {
                  return '<span class="font-mono font-bold text-sky-300">' + cell.getValue() + '</span>';
                }
              },
              // 3. Hex Reg
              {
                title: 'Hex Reg',
                field: 'modbus_reg_hex',
                hozAlign: 'center',
                headerHozAlign: 'center',
                width: 85,
                formatter: function(cell) {
                  return '<span class="font-mono text-cyan-400">' + (cell.getValue() || '') + '</span>';
                }
              },
              // 4. # Regs
              {
                title: '# Regs',
                field: 'reg_num',
                hozAlign: 'right',
                headerHozAlign: 'right',
                width: 75,
                formatter: function(cell) {
                  return '<span class="font-mono text-slate-300">' + (cell.getValue() || 1) + '</span>';
                }
              },
              // 5. Description
              {
                title: 'Description',
                field: 'description',
                hozAlign: 'left',
                headerHozAlign: 'left',
                minWidth: 160,
                formatter: function(cell) {
                  return '<span class="font-semibold text-white">' + (cell.getValue() || '') + '</span>';
                }
              },
              // 6. Format
              {
                title: 'Format',
                field: 'format',
                hozAlign: 'center',
                headerHozAlign: 'center',
                width: 90,
                formatter: function(cell) {
                  const fmt = String(cell.getValue() || 'uint');
                  let colorClass = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
                  if (fmt === 'float') colorClass = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
                  if (fmt === 'string') colorClass = 'bg-purple-500/10 text-purple-300 border-purple-500/20';
                  if (fmt === 'hex') colorClass = 'bg-rose-500/10 text-rose-300 border-rose-500/20';
                  if (fmt === 'int') colorClass = 'bg-blue-500/10 text-blue-300 border-blue-500/20';
                  return '<span class="px-2 py-0.5 rounded text-[11px] font-mono border ' + colorClass + '">' + fmt + '</span>';
                }
              },
              // 7. Comment
              {
                title: 'Comment',
                field: 'comment',
                hozAlign: 'left',
                headerHozAlign: 'left',
                minWidth: 140,
                tooltip: true,
                formatter: function(cell) {
                  return '<span class="text-slate-400 text-xs truncate">' + (cell.getValue() || '') + '</span>';
                }
              },
              // 8. Default (read-only)
              {
                title: 'Default',
                field: 'value_on_memmap',
                hozAlign: 'left',
                headerHozAlign: 'left',
                width: 100,
                formatter: function(cell) {
                  const v = cell.getValue();
                  return '<span class="font-mono text-slate-400">' + (v !== undefined && v !== null && v !== '' ? v : '<em class="text-slate-600">none</em>') + '</span>';
                }
              },
              // 9. Input Config (editable)
              {
                title: 'Input Config',
                field: 'value_to_write',
                hozAlign: 'center',
                headerHozAlign: 'center',
                minWidth: 140,
                formatter: function(cell) {
                  const row = cell.getRow().getData();
                  const val = row.value_to_write !== undefined && row.value_to_write !== null ? row.value_to_write : '';
                  const isValid = !!row.valid;

                  const input = document.createElement('input');
                  input.type = 'text';
                  input.value = val;
                  input.className = 'w-full h-7 px-2 text-center text-xs font-mono font-bold rounded outline-none transition ' +
                    (isValid
                      ? 'text-amber-300 bg-slate-950/80 border border-slate-700/80 focus:border-amber-400 focus:bg-slate-900'
                      : 'text-rose-300 bg-rose-950/40 border border-rose-500 focus:border-rose-400');
                  input.style.width = '100%';
                  input.style.boxSizing = 'border-box';

                  input.addEventListener('input', function(e) {
                    const v = e.target.value;
                    row.value_to_write = v;
                    const r = finalConfigRegs.value.find(x => x.id === row.id);
                    if (r) {
                      r.value_to_write = v;
                      const check = validateRegisterValue(v, r.format, r.reg_num, r.range_val);
                      r.valid = check.valid;
                      r.validationError = check.error;
                      row.valid = check.valid;
                      row.validationError = check.error;

                      // Update border color realtime
                      if (check.valid) {
                        input.className = 'w-full h-7 px-2 text-center text-xs font-mono font-bold rounded outline-none transition text-amber-300 bg-slate-950/80 border border-slate-700/80 focus:border-amber-400 focus:bg-slate-900';
                      } else {
                        input.className = 'w-full h-7 px-2 text-center text-xs font-mono font-bold rounded outline-none transition text-rose-300 bg-rose-950/40 border border-rose-500 focus:border-rose-400';
                      }

                      // Re-validate row in Tabulator
                      const checkCell = cell.getRow().getCell('valid');
                      if (checkCell) {
                        checkCell.setValue(check.valid);
                      }
                    }
                    finalConfigRegs.value = [...finalConfigRegs.value];
                  });

                  input.addEventListener('click', function(e) { e.stopPropagation(); });
                  return input;
                }
              },
              // 10. Config check (precheck format)
              {
                title: 'Config check',
                field: 'valid',
                hozAlign: 'center',
                headerHozAlign: 'center',
                width: 120,
                formatter: function(cell) {
                  const row = cell.getRow().getData();
                  const isValid = !!row.valid;
                  const errMsg = row.validationError || '';
                  if (isValid) {
                    return '<span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1"><i class="fa-solid fa-check"></i> PASS</span>';
                  } else {
                    return '<span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center gap-1 cursor-help" title="' + errMsg + '"><i class="fa-solid fa-triangle-exclamation"></i> FAIL</span>';
                  }
                }
              }
            ]
          });
        } catch (err) {
          console.error('[CreateFinalConfig] Tabulator Initialization Error:', err);
        }
      };

      // Search filter in Tabulator table
      const onFinalConfigTableSearchChange = () => {
        if (!fcTabulatorInstance) return;
        const q = String(finalConfigTableSearch.value || '').trim().toLowerCase();
        if (!q) {
          fcTabulatorInstance.clearFilter();
          return;
        }
        fcTabulatorInstance.setFilter((data) => {
          return (
            String(data.description || '').toLowerCase().includes(q) ||
            String(data.modbus_reg_dec || '').toLowerCase().includes(q) ||
            String(data.modbus_reg_hex || '').toLowerCase().includes(q) ||
            String(data.format || '').toLowerCase().includes(q) ||
            String(data.comment || '').toLowerCase().includes(q)
          );
        });
      };

      // Modal management
      const openFinalConfigSaveModal = () => {
        if (!canSaveFinalConfig.value) return;
        showFinalConfigSaveModal.value = true;
      };

      const resetFinalConfigForm = () => {
        finalConfigSo.value = '';
        finalConfigItemCode.value = '';
        finalConfigSku.value = '';
        finalConfigShortFw.value = '';
        finalConfigFirmwareVersion.value = '';
        finalConfigRegs.value = [];
        fcMemmapNotFound.value = false;
        finalConfigTableSearch.value = '';
        renderFinalConfigTabulator();
        if (showToast) {
          showToast('Đã xóa form cấu hình', 'info');
        }
      };

      // Save Preset to database via existing POST /api/modbus-presets (NO NEW API)
      const confirmSaveFinalConfig = async () => {
        if (!canSaveFinalConfig.value) return;
        isSavingFinalConfig.value = true;

        try {
          const so = finalConfigSo.value.trim();
          const itemCode = finalConfigItemCode.value.trim();
          const sku = finalConfigSku.value.trim().toUpperCase();
          const shortFw = Number(finalConfigShortFw.value.trim());
          const fwVer = finalConfigFirmwareVersion.value.trim() || (shortFw + '.0');
          const presetName = '[Final Config] ' + so + ' - ' + itemCode + ' (' + sku + '_' + shortFw + ')';

          const checkedRegs = finalConfigRegs.value
            .filter(r => !!r.checked)
            .map((r, idx) => ({
              id: 'reg_' + r.modbus_reg_dec + '_' + idx,
              order: idx + 1,
              checked: true,
              slave: r.slave || 1,
              fc: Number(r.fn_read) || 3,
              reg: Number(r.modbus_reg_dec),
              numreg: Number(r.reg_num) || 1,
              format: r.format || 'uint',
              endianness: r.endianness || 'big-endian',
              parameter: r.parameter_name || r.description || '',
              valuetowrite: String(r.value_to_write !== undefined ? r.value_to_write : ''),
              value_on_memmap: r.value_on_memmap || '',
              comment: r.comment || '',
              range: r.range_val || '',
              modbus_reg_hex: r.modbus_reg_hex,
              fn_read: r.fn_read || '3',
              fn_write: r.fn_write || '16',
            }));

          const payload = {
            name: presetName,
            description: 'Final Configuration Preset for SO ' + so + ' - Item ' + itemCode + ' (' + sku + ' FW ' + shortFw + ')',
            profileType: 'FinalConfig',
            so: so,
            itemCode: itemCode,
            sku: sku,
            firmwareVersion: fwVer,
            shortFw: shortFw,
            registers: checkedRegs,
          };

          const res = await fetch('/api/modbus-presets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(authHeaders ? authHeaders() : {}),
            },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || 'Lỗi khi lưu Final Config Preset');
          }

          if (showToast) {
            showToast('Tạo Final Config Preset thành công cho ' + so + ' - ' + itemCode, 'success');
          }

          showFinalConfigSaveModal.value = false;
        } catch (err) {
          console.error('[CreateFinalConfig] Save error:', err);
          if (showToast) {
            showToast('Lỗi lưu Final Config: ' + err.message, 'error');
          }
        } finally {
          isSavingFinalConfig.value = false;
        }
      };

      // Lifecycle hooks
      watch(activeTab, (tab) => {
        if (tab === 'create-final-config') {
          loadReferenceData();
          setTimeout(() => {
            renderFinalConfigTabulator();
          }, 150);
        }
      });

      onUnmounted(() => {
        if (fcTabulatorInstance) {
          try {
            fcTabulatorInstance.destroy();
          } catch (e) {}
          fcTabulatorInstance = null;
        }
        if (initFcTableTimeout) clearTimeout(initFcTableTimeout);
        if (debounceMemmapTimer) clearTimeout(debounceMemmapTimer);
      });

      return {
        finalConfigSo,
        finalConfigItemCode,
        finalConfigSku,
        finalConfigShortFw,
        finalConfigFirmwareVersion,
        fcSalesOrdersList,
        fcItemCodesList,
        finalConfigRegs,
        isLoadingFcMemmap,
        fcMemmapNotFound,
        finalConfigTableSearch,
        showFinalConfigSaveModal,
        isSavingFinalConfig,
        fcSkuError,
        fcFwError,
        checkedRegsCount,
        precheckErrorsCount,
        canSaveFinalConfig,
        onFinalConfigSoChange,
        onFinalConfigItemCodeChange,
        onFinalConfigSkuChange,
        onFinalConfigShortFwChange,
        onFinalConfigTableSearchChange,
        openFinalConfigSaveModal,
        resetFinalConfigForm,
        confirmSaveFinalConfig,
        renderFinalConfigTabulator,
        loadReferenceData,
      };
    }

    if (typeof window !== 'undefined') {
      window.useCreateFinalConfigModule = useCreateFinalConfigModule;
    }
`;
