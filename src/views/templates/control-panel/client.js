// Control Panel client: only the modules rendered by the current partial templates.
(function () {
  'use strict';
  function init() {
    if (!window.Vue) { setTimeout(init, 50); return; }
    const { createApp, ref, computed, onMounted } = Vue;
    // Keep the page in place on 401; the user chooses when to sign in again.
    const root = document.getElementById('app');
    if (!root) return;
    const banner = document.createElement('div');
    banner.setAttribute('v-if', 'sessionExpired');
    banner.className = 'bg-amber-950 border-b border-amber-500 px-4 py-3 text-amber-100 text-sm flex items-center justify-between gap-3';
    banner.innerHTML = '<span>Phiên đăng nhập đã hết hạn hoặc tài khoản không khả dụng. Vui lòng đăng nhập lại.</span><a href="/login" class="font-bold underline">Đăng nhập lại</a>';
    root.prepend(banner);
    createApp({
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
          if (!['overview', 'database', 'roles', 'users'].includes(tab)) return;
          activeTab.value = tab;
          sidebarOpen.value = false;
        };
        const activeTabLabel = computed(() => ({ overview: 'Overview', database: 'Database Manager', roles: 'Roles & Permissions', users: 'Users' })[activeTab.value]);
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
        const restartConfirmDialog = ref(false), restartingServer = ref(false);
        const serverLogsDialog = ref(false), serverLogs = ref('');
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

        const degradedModulesList = ref([]), hasDegradedModules = computed(() => degradedModulesList.value.length > 0);
        onMounted(async () => {
          await fetchSession();
          if (!sessionExpired.value) await Promise.all([fetchDbHealth(), fetchRoles(), fetchUsers()]);
        });
        return { currentUser, sessionExpired, sessionLoading, activeTab, activeTabLabel, sidebarOpen, sidebarCollapsed, userMenuOpen, currentTheme, userInitials, isSuperAdmin, toast,
          switchTab, toggleSidebarCollapse, handleGlobalClick, navigateTo, setTheme, handleLogout, dbHealth, fetchDbHealth, reloadDbConfig, systemVersionInfo, restartConfirmDialog, restartingServer, serverLogsDialog, serverLogs, openServerLogsDialog, confirmRestartServer,
          usersList, rolesList, allPermissions, loadingUsers, loadingRoles, fetchUsers, fetchRoles, roleDialog, isEditingRole, savingRole, currentRole, groupedPermissions, toggleSelectAllRolePermissions, toggleGroupPermissions, openCreateRoleDialog, openEditRoleDialog, submitRoleForm, getModulesForRole,
          createUserDialog, editUserDialog, savingUser, newUser, editUser, openCreateUserDialog, openEditUserDialog, submitCreateUser, submitEditUser, deleteUser,
          degradedModulesList, hasDegradedModules };
      }
    }).mount('#app');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
