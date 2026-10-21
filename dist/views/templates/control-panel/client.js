// Control Panel client: only the modules rendered by the current partial templates.
(function () {
  'use strict';
  function init() {
    if (!window.Vue) { setTimeout(init, 50); return; }
    const { createApp, ref, computed, onMounted } = Vue;
    // Keep the page in place on 401; the user chooses when to sign in again.
    const root = document.getElementById('app');
    if (!root) return;
    const CModuleBoundary = {
      name: 'CModuleBoundary',
      props: {
        moduleId: { type: String, required: true },
        title: { type: String, default: 'Subsystem Module' },
        icon: { type: String, default: 'fa-solid fa-cube' },
        active: { type: Boolean, default: true }
      },
      setup(props) {
        const hasError = Vue.ref(false);
        const errorMessage = Vue.ref('');
        Vue.onErrorCaptured((err, instance, info) => {
          console.error('[CModuleBoundary error in ' + props.moduleId + ']:', err, info);
          hasError.value = true;
          errorMessage.value = err?.message || String(err);
          return false;
        });
        const handleRetry = () => {
          hasError.value = false;
          errorMessage.value = '';
        };
        return { hasError, errorMessage, handleRetry };
      },
      template: `
        <div class="c-module-boundary-wrapper w-full" :data-module-id="moduleId">
          <div v-if="hasError" class="p-6 rounded-2xl bg-slate-900 border border-red-500/30 text-red-200 my-4 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-bold text-sm text-red-400">
                <i :class="icon"></i> <span>Module {{ title }} Error</span>
              </div>
              <button @click="handleRetry" class="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg cursor-pointer">
                <i class="fa-solid fa-rotate-right mr-1"></i> Retry
              </button>
            </div>
            <div class="text-xs text-slate-400 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 break-all">
              {{ errorMessage }}
            </div>
          </div>
          <slot v-else></slot>
        </div>
      `
    };

    const app = createApp({
      setup() {
        const currentUser = ref({});
        const sessionExpired = ref(false);
        const sessionLoading = ref(true);
        const activeTab = ref('overview');
        const sidebarOpen = ref(false);
        const sidebarCollapsed = ref(false);
        const userMenuOpen = ref(false);
        const currentTheme = ref(localStorage.getItem('dvt_theme') || 'light');
        const toast = ref({ show: false, text: '', type: 'info' });
        let toastTimer;
        const showToast = (text, type = 'info') => {
          toast.value = { show: true, text, type };
          clearTimeout(toastTimer);
          toastTimer = setTimeout(() => { toast.value.show = false; }, 4500);
        };
        window.showToast = showToast;
        const token = () => { try { return localStorage.getItem('lorawan_token') || localStorage.getItem('access_token') || sessionStorage.getItem('access_token'); } catch (_) { return null; } };
        const headers = (json = true) => {
          const h = json ? { 'Content-Type': 'application/json' } : {};
          if (token()) h.Authorization = 'Bearer ' + token();
          return h;
        };
        const request = async (url, options = {}) => {
          const res = await fetch(url, { credentials: 'include', headers: headers(!options.form), ...options });
          if (res.status === 401) sessionExpired.value = true;
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Request failed (' + res.status + ')'));
          return data;
        };
        const run = async (action, success) => {
          try { await action(); if (success) showToast(success, 'success'); }
          catch (error) { showToast(error.message || 'Request failed', 'error'); }
        };
        const switchTab = (tab) => {
          if (!['overview', 'database', 'roles', 'users', 'plugins-management'].includes(tab) && !tab.startsWith('plugin-')) return;
          activeTab.value = tab;
          sidebarOpen.value = false;
        };
        const activeTabLabel = computed(() => {
          if (activeTab.value === 'plugins-management') return 'Plugins Management';
          if (activeTab.value.startsWith('plugin-')) {
            const pId = activeTab.value.replace('plugin-', '');
            const found = pluginsList.value.find(p => p.id === pId) || selectedActivePlugin.value;
            return found ? (found.name || found.id) : ('Plugin: ' + pId);
          }
          return ({ overview: 'Overview', database: 'Database Manager', roles: 'Roles & Permissions', users: 'Users' })[activeTab.value] || activeTab.value;
        });
        const userInitials = computed(() => String(currentUser.value.fullName || currentUser.value.username || '?').split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase());
        const isSuperAdmin = computed(() => (currentUser.value.roles || []).some(r => (typeof r === 'string' ? r : r.code) === 'SUPER_ADMIN'));
        const toggleSidebarCollapse = () => { sidebarCollapsed.value = !sidebarCollapsed.value; };
        const handleGlobalClick = (e) => { if (!e.target.closest('[data-user-menu]')) userMenuOpen.value = false; };
        const navigateTo = (url) => { window.location.assign(url); };
        const setTheme = (value) => { currentTheme.value = value; localStorage.setItem('dvt_theme', value); document.documentElement.classList.toggle('theme-dark', value === 'dark'); document.documentElement.classList.toggle('theme-light', value === 'light'); };
        const handleLogout = async () => {
          try { await fetch('/auth/logout', { method: 'POST', credentials: 'include', headers: headers() }); } catch (_) { /* local logout still proceeds */ }
          localStorage.removeItem('lorawan_token'); localStorage.removeItem('lorawan_user');
          localStorage.removeItem('access_token'); sessionStorage.removeItem('access_token');
          window.location.assign('/login?logout=1');
        };
        const fetchSession = async () => {
          try {
            const user = await request('/auth/session');
            if (user.isActive === false || user.is_active === false) throw new Error('Account is inactive');
            currentUser.value = user;
          } catch (_) { sessionExpired.value = true; }
          finally { sessionLoading.value = false; }
        };

        const dbHealth = ref({ connections: {}, tableStats: {} });
        const fetchDbHealth = () => run(async () => { dbHealth.value = await request('/database/health'); });
        const reloadDbConfig = () => run(async () => { const data = await request('/database/reload', { method: 'POST' }); showToast(data.message || 'Database reloaded', 'success'); await fetchDbHealth(); });
        const systemVersionInfo = ref({ git: {} });
        const restartConfirmDialog = ref(false), restartingServer = ref(false), restartProgress = ref({ active: false, message: '', countdown: 0 });
        const serverLogsDialog = ref(false), serverLogs = ref(''), loadingServerLogs = ref(false);
        const openServerLogsDialog = () => { showToast('Server logs are unavailable in this deployment', 'info'); };
        const confirmRestartServer = () => { restartConfirmDialog.value = false; showToast('Server restart is unavailable in this deployment', 'info'); };

        const usersList = ref([]), rolesList = ref([]), allPermissions = ref([]);
        const loadingUsers = ref(false), loadingRoles = ref(false);
        const fetchUsers = async () => { loadingUsers.value = true; try { await run(async () => { usersList.value = await request('/users'); }); } finally { loadingUsers.value = false; } };
        const fetchRoles = async () => { loadingRoles.value = true; try { await run(async () => {
          const [roles, permissions] = await Promise.all([request('/roles'), request('/roles/permissions')]);
          rolesList.value = roles; allPermissions.value = permissions;
        }); } finally { loadingRoles.value = false; } };
        const roleDialog = ref(false), isEditingRole = ref(false), savingRole = ref(false);
        const emptyRole = () => ({ code: '', name: '', description: '', permissions: [] });
        const currentRole = ref(emptyRole());
        const groupedPermissions = computed(() => allPermissions.value.reduce((groups, p) => {
          const group = p.module || p.group || 'General'; (groups[group] ||= []).push(p); return groups;
        }, {}));
        const toggleSelectAllRolePermissions = () => { currentRole.value.permissions = currentRole.value.permissions.length === allPermissions.value.length ? [] : allPermissions.value.map(p => p.id); };
        const toggleGroupPermissions = (perms) => {
          const ids = perms.map(p => p.id), selected = new Set(currentRole.value.permissions);
          const all = ids.every(id => selected.has(id)); ids.forEach(id => all ? selected.delete(id) : selected.add(id));
          currentRole.value.permissions = [...selected];
        };
        const openCreateRoleDialog = () => { isEditingRole.value = false; currentRole.value = emptyRole(); roleDialog.value = true; };
        const openEditRoleDialog = (role) => { isEditingRole.value = true; currentRole.value = { ...role, description: role.description || '', permissions: (role.permissions || []).map(p => typeof p === 'object' ? p.id : p) }; roleDialog.value = true; };
        const submitRoleForm = async () => { savingRole.value = true; try { await run(async () => {
          const r = currentRole.value;
          await request(isEditingRole.value ? '/roles/' + encodeURIComponent(r.id) : '/roles', {
            method: isEditingRole.value ? 'PUT' : 'POST', body: JSON.stringify({ ...(isEditingRole.value ? {} : { code: r.code.trim().toUpperCase() }), name: r.name.trim(), description: r.description.trim(), permissionIds: r.permissions })
          }); roleDialog.value = false; await fetchRoles();
        }, 'Role saved'); } finally { savingRole.value = false; } };
        const getModulesForRole = () => []; // No module grants exist in the current roles API.
        const createUserDialog = ref(false), editUserDialog = ref(false), savingUser = ref(false);
        const emptyUser = () => ({ username: '', fullName: '', email: '', password: '', userType: 'USER', roleId: '' });
        const newUser = ref(emptyUser()), editUser = ref({});
        const openCreateUserDialog = () => { newUser.value = emptyUser(); createUserDialog.value = true; };
        const openEditUserDialog = (user) => { editUser.value = { ...user, roleId: user.roles?.[0]?.id || user.roleId || '' }; editUserDialog.value = true; };
        const submitCreateUser = async () => { savingUser.value = true; try { await run(async () => {
          const { roleId, ...user } = newUser.value;
          await request('/users', { method: 'POST', body: JSON.stringify({ ...user, roleIds: roleId ? [roleId] : [] }) }); createUserDialog.value = false; await fetchUsers();
        }, 'User created'); } finally { savingUser.value = false; } };
        const submitEditUser = async () => { savingUser.value = true; try { await run(async () => {
          const u = editUser.value;
          await request('/users/' + encodeURIComponent(u.id) + '/permissions', { method: 'PUT', body: JSON.stringify({ roleIds: u.roleId ? [u.roleId] : [], isActive: u.isActive }) });
          editUserDialog.value = false; await fetchUsers();
        }, 'User updated'); } finally { savingUser.value = false; } };
        const deleteUser = (id) => { if (confirm('Delete this user?')) run(async () => { await request('/users/' + encodeURIComponent(id), { method: 'DELETE' }); await fetchUsers(); }, 'User deleted'); };

        // PLUGINS MANAGEMENT
        const pluginsList = ref([]), loadingPlugins = ref(false), actionInProgressId = ref(null);
        const pluginSearchQuery = ref(''), pluginStatusFilter = ref('all');
        const selectedActivePlugin = ref(null);
        const uploadDragActive = ref(false);

        const activePlugins = computed(() => pluginsList.value.filter(p => p.status === 'ACTIVE' || p.status === 'active' || p.enabled === true));
        const activePluginsCount = computed(() => activePlugins.value.length);
        const filteredPlugins = computed(() => pluginsList.value.filter(p => {
          const status = pluginStatusFilter.value;
          const isActive = (p.status === 'ACTIVE' || p.status === 'active' || p.enabled === true);
          return (status === 'all' || isActive === (status === 'active')) &&
            [p.name, p.id, p.description].some(v => String(v || '').toLowerCase().includes(pluginSearchQuery.value.trim().toLowerCase()));
        }));

        const openPluginView = (plugin) => {
          selectedActivePlugin.value = plugin;
          switchTab('plugin-' + plugin.id);
        };

        const fetchPlugins = async () => { loadingPlugins.value = true; try { await run(async () => {
          const result = await request('/api/v1/plugins'); pluginsList.value = Array.isArray(result) ? result : (result.data || []);
        }); } finally { loadingPlugins.value = false; } };

        const pluginAction = (plugin, action, method = 'POST') => run(async () => {
          actionInProgressId.value = plugin.id;
          try { await request('/api/v1/plugins/' + encodeURIComponent(plugin.id) + action, { method }); await fetchPlugins(); }
          finally { actionInProgressId.value = null; }
        }, 'Plugin updated');

        const togglePluginStatus = (plugin) => {
          const isActive = (plugin.status === 'ACTIVE' || plugin.status === 'active' || plugin.enabled === true);
          return pluginAction(plugin, isActive ? '/disable' : '/enable');
        };

        const confirmUninstallPlugin = (plugin) => { if (confirm('Uninstall ' + (plugin.name || plugin.id) + '?')) pluginAction(plugin, '', 'DELETE'); };

        const uploadPluginDialog = ref(false), selectedPluginFile = ref(null), uploadAutoEnable = ref(true), isSubmittingUpload = ref(false);
        const openUploadDialog = () => { selectedPluginFile.value = null; uploadAutoEnable.value = true; uploadPluginDialog.value = true; };
        const onPluginFileChange = (e) => { selectedPluginFile.value = e.target.files?.[0] || null; };
        const onPluginFileDrop = (e) => { uploadDragActive.value = false; selectedPluginFile.value = e.dataTransfer.files?.[0] || null; };

        const submitUploadPlugin = async () => { if (!selectedPluginFile.value) return; isSubmittingUpload.value = true; try { await run(async () => {
          const body = new FormData(); body.append('file', selectedPluginFile.value); body.append('autoEnable', String(uploadAutoEnable.value));
          await request('/api/v1/plugins/upload', { method: 'POST', headers: headers(false), body, form: true }); uploadPluginDialog.value = false; await fetchPlugins();
        }, 'Plugin installed'); } finally { isSubmittingUpload.value = false; } };

        const installUrlDialog = ref(false), pluginInstallUrl = ref(''), isSubmittingUrl = ref(false);
        const openInstallUrlDialog = () => { pluginInstallUrl.value = ''; uploadAutoEnable.value = true; installUrlDialog.value = true; };

        const submitInstallUrl = async () => { isSubmittingUrl.value = true; try { await run(async () => {
          await request('/api/v1/plugins/install-url', { method: 'POST', body: JSON.stringify({ url: pluginInstallUrl.value.trim(), autoEnable: uploadAutoEnable.value }) });
          installUrlDialog.value = false; await fetchPlugins();
        }, 'Plugin installed'); } finally { isSubmittingUrl.value = false; } };

        const configPluginDialog = ref(false), pluginToConfig = ref(null), pluginConfigJson = ref('{}'), pluginConfigError = ref(''), isSavingConfig = ref(false);
        const openPluginConfig = (plugin) => { pluginToConfig.value = plugin; pluginConfigJson.value = JSON.stringify(plugin.config || {}, null, 2); pluginConfigError.value = ''; configPluginDialog.value = true; };

        const savePluginConfig = async () => {
          let config; try { config = JSON.parse(pluginConfigJson.value); } catch (_) { pluginConfigError.value = 'Invalid JSON'; return; }
          isSavingConfig.value = true; pluginConfigError.value = '';
          try { await request('/api/v1/plugins/' + encodeURIComponent(pluginToConfig.value.id) + '/config', { method: 'PATCH', body: JSON.stringify(config) }); configPluginDialog.value = false; await fetchPlugins(); showToast('Configuration saved', 'success'); }
          catch (error) { pluginConfigError.value = error.message; }
          finally { isSavingConfig.value = false; }
        };

        const degradedModulesList = ref([]), hasDegradedModules = computed(() => degradedModulesList.value.length > 0);
        onMounted(async () => {
          await fetchSession();
          if (!sessionExpired.value) await Promise.all([fetchDbHealth(), fetchRoles(), fetchUsers(), fetchPlugins()]);
        });
        return { currentUser, sessionExpired, sessionLoading, activeTab, activeTabLabel, sidebarOpen, sidebarCollapsed, userMenuOpen, currentTheme, userInitials, isSuperAdmin, toast, showToast,
          switchTab, toggleSidebarCollapse, handleGlobalClick, navigateTo, setTheme, handleLogout, dbHealth, fetchDbHealth, reloadDbConfig, systemVersionInfo, restartConfirmDialog, restartingServer, serverLogsDialog, serverLogs, openServerLogsDialog, confirmRestartServer, loadingServerLogs,
          usersList, rolesList, allPermissions, loadingUsers, loadingRoles, fetchUsers, fetchRoles, roleDialog, isEditingRole, savingRole, currentRole, groupedPermissions, toggleSelectAllRolePermissions, toggleGroupPermissions, openCreateRoleDialog, openEditRoleDialog, submitRoleForm, getModulesForRole,
          createUserDialog, editUserDialog, savingUser, newUser, editUser, openCreateUserDialog, openEditUserDialog, submitCreateUser, submitEditUser, deleteUser,
          pluginsList, loadingPlugins, actionInProgressId, pluginSearchQuery, pluginStatusFilter, activePlugins, activePluginsCount, filteredPlugins, selectedActivePlugin, uploadDragActive,
          openPluginView, fetchPlugins, togglePluginStatus, confirmUninstallPlugin,
          uploadPluginDialog, selectedPluginFile, uploadAutoEnable, isSubmittingUpload, openUploadDialog, onPluginFileChange, onPluginFileDrop, submitUploadPlugin,
          installUrlDialog, pluginInstallUrl, isSubmittingUrl, openInstallUrlDialog, submitInstallUrl,
          configPluginDialog, pluginToConfig, pluginConfigJson, pluginConfigError, isSavingConfig, openPluginConfig, savePluginConfig,
          degradedModulesList, hasDegradedModules, restartProgress };
      }
    });

    app.component('c-module-boundary', CModuleBoundary);

    app.config.errorHandler = function(err, vm, info) {
      console.error('[Vue Root ErrorHandler]:', err, info);
      const appEl = document.getElementById('app');
      if (appEl && appEl.hasAttribute('v-cloak')) {
        appEl.removeAttribute('v-cloak');
      }
    };

    try {
      app.mount('#app');
      const appEl = document.getElementById('app');
      if (appEl && appEl.hasAttribute('v-cloak')) {
        appEl.removeAttribute('v-cloak');
      }
    } catch (e) {
      console.error('[Vue Mount Failed]:', e);
      const appEl = document.getElementById('app');
      if (appEl) {
        appEl.innerHTML = '<div class="p-8 text-center text-red-400 font-semibold"><i class="fa-solid fa-triangle-exclamation mr-2"></i>Giao diện Control Panel gặp lỗi khi tải. Vui lòng tải lại trang (F5).</div>';
        appEl.removeAttribute('v-cloak');
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
