// ========================================================
// C-MODULE: PLUGINS-MANAGEMENT
// ========================================================

export const PLUGINS_MANAGEMENT_TEMPLATE = `
        <!-- TAB: PLUGINS MANAGEMENT -->
        <div v-show="activeTab === 'plugins-management'" class="space-y-6">
          <!-- Header and Quick Action Banner -->
          <div class="glass-card rounded-2xl p-6 relative overflow-hidden">
            <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
              <div>
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-lg shadow-lg shadow-indigo-500/10">
                    <i class="fa-solid fa-puzzle-piece"></i>
                  </div>
                  <div>
                    <h2 class="text-lg font-bold text-white tracking-tight flex items-center gap-2.5">
                      Plugins Management
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                        {{ pluginsList.length }} Installed
                      </span>
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {{ activePluginsCount }} Active
                      </span>
                    </h2>
                    <p class="text-xs text-slate-400 mt-0.5">
                      Micro-kernel dynamic plugin loader & bundle manager. Upload or install plugins via URL to extend core capability.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Top Actions: Upload / Install Buttons -->
              <div class="flex items-center gap-2.5 w-full md:w-auto">
                <button
                  type="button"
                  @click="openUploadPluginModal"
                  class="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer active:scale-95"
                >
                  <i class="fa-solid fa-cloud-arrow-up"></i>
                  <span>Upload Plugin (.zip / .tar.gz)</span>
                </button>
                <button
                  type="button"
                  @click="openInstallUrlModal"
                  class="flex-1 md:flex-initial px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <i class="fa-solid fa-globe"></i>
                  <span>Install via URL</span>
                </button>
                <button
                  type="button"
                  @click="fetchPlugins"
                  :disabled="loadingPlugins"
                  class="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition cursor-pointer"
                  title="Reload plugins"
                >
                  <i class="fa-solid fa-rotate text-xs" :class="{ 'fa-spin': loadingPlugins }"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Filter & Search Toolbar -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-2 flex-1 max-w-md bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-indigo-500/60 transition">
              <i class="fa-solid fa-magnifying-glass text-slate-500 text-xs"></i>
              <input
                v-model="pluginsSearchQuery"
                type="text"
                placeholder="Search plugins by name, ID, or description..."
                class="bg-transparent text-white placeholder-slate-500 text-xs w-full focus:outline-none"
              />
              <button
                v-if="pluginsSearchQuery"
                @click="pluginsSearchQuery = ''"
                class="text-slate-500 hover:text-white"
              >
                <i class="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            <!-- Status Tabs / Type Filter -->
            <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                @click="pluginsStatusFilter = 'ALL'"
                :class="pluginsStatusFilter === 'ALL' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold' : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'"
                class="px-3 py-1.5 rounded-lg border text-xs whitespace-nowrap transition cursor-pointer"
              >
                All ({{ pluginsList.length }})
              </button>
              <button
                @click="pluginsStatusFilter = 'ACTIVE'"
                :class="pluginsStatusFilter === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold' : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'"
                class="px-3 py-1.5 rounded-lg border text-xs whitespace-nowrap transition cursor-pointer"
              >
                <i class="fa-solid fa-circle-check text-[10px] text-emerald-400 mr-1"></i> Active
              </button>
              <button
                @click="pluginsStatusFilter = 'DISABLED'"
                :class="pluginsStatusFilter === 'DISABLED' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold' : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'"
                class="px-3 py-1.5 rounded-lg border text-xs whitespace-nowrap transition cursor-pointer"
              >
                <i class="fa-solid fa-pause text-[10px] text-amber-400 mr-1"></i> Disabled
              </button>
            </div>
          </div>

          <!-- Empty State (No Plugins) -->
          <div
            v-if="filteredPluginsList.length === 0"
            class="glass-card rounded-2xl p-12 text-center space-y-4 border-dashed border-2 border-slate-800"
          >
            <div class="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400 text-2xl mx-auto shadow-inner">
              <i class="fa-solid fa-puzzle-piece"></i>
            </div>
            <div class="max-w-md mx-auto space-y-1">
              <h3 class="text-sm font-bold text-white">Chưa có Plugin nào được nạp</h3>
              <p class="text-xs text-slate-400">
                Hệ thống đang chạy kiến trúc Micro-kernel tối giản. Bạn có thể nạp các gói bundle plugin để mở rộng tính năng Dashboard, IoT Protocol, hoặc Order Management.
              </p>
            </div>
            <div class="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                @click="openUploadPluginModal"
                class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-2 cursor-pointer"
              >
                <i class="fa-solid fa-cloud-arrow-up"></i> Nạp Plugin Ngay
              </button>
            </div>
          </div>

          <!-- Plugin Grid Cards -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="plugin in filteredPluginsList"
              :key="plugin.id"
              class="glass-card rounded-xl p-5 flex flex-col justify-between border border-slate-800 hover:border-slate-700 transition relative group"
            >
              <!-- Card Header -->
              <div class="space-y-3">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shadow-md"
                      :class="plugin.status === 'ACTIVE' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'"
                    >
                      <i :class="plugin.manifest?.icon || 'fa-solid fa-plug'"></i>
                    </div>
                    <div>
                      <h3 class="text-sm font-bold text-white group-hover:text-indigo-400 transition flex items-center gap-2">
                        {{ plugin.name || plugin.id }}
                      </h3>
                      <div class="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-slate-400">
                        <span>v{{ plugin.version || '1.0.0' }}</span>
                        <span class="text-slate-600">•</span>
                        <span class="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[9px]">{{ plugin.type || 'HYBRID' }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Status Badge -->
                  <div>
                    <span
                      v-if="plugin.status === 'ACTIVE'"
                      class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      ACTIVE
                    </span>
                    <span
                      v-else-if="plugin.status === 'DISABLED'"
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700"
                    >
                      DISABLED
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    >
                      {{ plugin.status }}
                    </span>
                  </div>
                </div>

                <!-- Description -->
                <p class="text-xs text-slate-400 line-clamp-2 min-h-[32px]">
                  {{ plugin.description || 'Chưa có mô tả chi tiết cho plugin này.' }}
                </p>

                <!-- UI Extensions / Capabilities Preview -->
                <div v-if="plugin.manifest?.uiExtensions?.length" class="pt-2 border-t border-slate-800/80">
                  <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-window-restore text-[9px]"></i> Giao diện tích hợp ({{ plugin.manifest.uiExtensions.length }})
                  </div>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="(ext, idx) in plugin.manifest.uiExtensions"
                      :key="idx"
                      class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-indigo-300 font-medium"
                    >
                      {{ ext.title || ext.slot }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Card Actions -->
              <div class="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <!-- Toggle Enable/Disable -->
                <button
                  type="button"
                  @click="togglePluginStatus(plugin)"
                  :disabled="actionInProgressId === plugin.id"
                  class="px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                  :class="plugin.status === 'ACTIVE' ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'"
                >
                  <i class="fa-solid" :class="plugin.status === 'ACTIVE' ? 'fa-pause' : 'fa-play'"></i>
                  <span>{{ plugin.status === 'ACTIVE' ? 'Disable' : 'Enable' }}</span>
                </button>

                <div class="flex items-center gap-1.5">
                  <!-- Config button -->
                  <button
                    type="button"
                    @click="openPluginConfigModal(plugin)"
                    class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                    title="Cấu hình Plugin"
                  >
                    <i class="fa-solid fa-gear text-xs"></i>
                  </button>

                  <!-- View Detail / Open In Nav -->
                  <button
                    v-if="plugin.status === 'ACTIVE'"
                    type="button"
                    @click="openPluginView(plugin)"
                    class="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                    title="Mở giao diện Plugin"
                  >
                    <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                    <span>Mở</span>
                  </button>

                  <!-- Uninstall button -->
                  <button
                    type="button"
                    @click="confirmUninstallPlugin(plugin)"
                    :disabled="actionInProgressId === plugin.id"
                    class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                    title="Gỡ bỏ Plugin"
                  >
                    <i class="fa-solid fa-trash-can text-xs"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- DYNAMIC PLUGIN VIEW HOST (WHEN A PLUGIN TAB IS ACTIVE) -->
        <div v-show="activeTab.startsWith('plugin-')" class="space-y-4">
          <div class="glass-card rounded-2xl p-6">
            <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <i :class="selectedActivePlugin?.manifest?.icon || 'fa-solid fa-plug'"></i>
                </div>
                <div>
                  <h2 class="text-base font-bold text-white flex items-center gap-2">
                    {{ selectedActivePlugin?.name || selectedActivePlugin?.id }}
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      RUNNING
                    </span>
                  </h2>
                  <p class="text-xs text-slate-400">{{ selectedActivePlugin?.description }}</p>
                </div>
              </div>
              <button
                @click="switchTab('plugins-management')"
                class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                <i class="fa-solid fa-arrow-left mr-1"></i> Quay lại Plugins Management
              </button>
            </div>

            <!-- Plugin Mount Container -->
            <div :id="'plugin-mount-' + (selectedActivePlugin?.id || '')" class="min-h-[400px] flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3 bg-slate-950/50 rounded-xl border border-slate-800/80">
              <div class="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 text-xl">
                <i class="fa-solid fa-cubes"></i>
              </div>
              <h4 class="text-sm font-semibold text-white">Plugin UI Interface</h4>
              <p class="text-xs max-w-md text-slate-500">
                Giao diện của plugin này được nạp động từ bundle. Bạn có thể cấu hình hiển thị Dashboard hoặc giao diện dành cho phân quyền tại đây.
              </p>
            </div>
          </div>
        </div>
`;

export const PLUGINS_MANAGEMENT_MODALS = `
    <!-- MODAL: UPLOAD PLUGIN PACKAGE -->
    <div v-if="uploadPluginDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl relative">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-cloud-arrow-up text-indigo-400"></i> Nạp Plugin Mới (Upload Package)
          </h3>
          <button @click="uploadPluginDialog = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form @submit.prevent="submitUploadPlugin" class="space-y-4 text-xs">
          <!-- Drop Area -->
          <div
            @dragover.prevent="uploadDragActive = true"
            @dragleave.prevent="uploadDragActive = false"
            @drop.prevent="onPluginFileDrop"
            class="border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer"
            :class="uploadDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-950/60 hover:border-slate-600'"
            @click="$refs.pluginFileInput.click()"
          >
            <input
              ref="pluginFileInput"
              type="file"
              accept=".zip,.tar.gz,.tgz"
              class="hidden"
              @change="onPluginFileSelected"
            />
            <div class="w-12 h-12 rounded-xl bg-slate-800/80 text-indigo-400 flex items-center justify-center text-xl mx-auto mb-2">
              <i class="fa-solid fa-file-zipper"></i>
            </div>
            <p v-if="!selectedPluginFile" class="font-semibold text-white">
              Chọn tệp hoặc kéo thả gói plugin vào đây
            </p>
            <p v-else class="font-bold text-indigo-400 flex items-center justify-center gap-2">
              <i class="fa-solid fa-check-circle text-emerald-400"></i>
              {{ selectedPluginFile.name }} ({{ (selectedPluginFile.size / 1024).toFixed(1) }} KB)
            </p>
            <span class="text-[10px] text-slate-500 block mt-1">Định dạng hỗ trợ: .zip, .tar.gz (chứa manifest.json & bundle code)</span>
          </div>

          <div class="flex items-center gap-2">
            <input v-model="uploadAutoEnable" type="checkbox" id="auto-enable-chk" class="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0" />
            <label for="auto-enable-chk" class="text-slate-300 font-medium cursor-pointer">Tự động kích hoạt (Auto-Enable) sau khi cài đặt thành công</label>
          </div>

          <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button type="button" @click="uploadPluginDialog = false" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer">Hủy</button>
            <button
              type="submit"
              :disabled="!selectedPluginFile || isSubmittingUpload"
              class="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold cursor-pointer flex items-center gap-2 shadow-lg shadow-indigo-600/25"
            >
              <i v-if="isSubmittingUpload" class="fa-solid fa-spinner fa-spin"></i>
              <span>{{ isSubmittingUpload ? 'Đang nạp...' : 'Tiến hành Nạp Plugin' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: INSTALL VIA URL -->
    <div v-if="installUrlDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-globe text-indigo-400"></i> Cài đặt Plugin từ URL
          </h3>
          <button @click="installUrlDialog = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form @submit.prevent="submitInstallUrl" class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-300 mb-1">URL Gói Plugin</label>
            <input
              v-model="installUrlInput"
              type="url"
              required
              placeholder="https://cdn.example.com/plugins/my-plugin.zip"
              class="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div class="flex items-center gap-2">
            <input v-model="uploadAutoEnable" type="checkbox" id="auto-enable-url-chk" class="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0" />
            <label for="auto-enable-url-chk" class="text-slate-300 font-medium cursor-pointer">Tự động kích hoạt sau khi cài đặt</label>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="installUrlDialog = false" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer">Hủy</button>
            <button type="submit" :disabled="isSubmittingUpload" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer">
              {{ isSubmittingUpload ? 'Đang cài...' : 'Cài đặt' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL: PLUGIN CONFIGURATION -->
    <div v-if="pluginConfigDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <i class="fa-solid fa-gear text-indigo-400"></i> Cấu hình Plugin: {{ editingPlugin?.name || editingPlugin?.id }}
          </h3>
          <button @click="pluginConfigDialog = false" class="text-slate-500 hover:text-white cursor-pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form @submit.prevent="submitPluginConfig" class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-300 mb-1">Cấu hình JSON (Runtime Config)</label>
            <textarea
              v-model="pluginConfigJson"
              rows="8"
              class="w-full px-3 py-2 bg-slate-950 font-mono text-[11px] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            ></textarea>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" @click="pluginConfigDialog = false" class="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer">Hủy</button>
            <button type="submit" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer">
              Lưu Cấu Hình
            </button>
          </div>
        </form>
      </div>
    </div>
`;
