<template>
  <aside class="sidebar-nav" :class="{ 'is-collapsed': isCollapsed }">
    <div class="sidebar-toggle" @click="isCollapsed = !isCollapsed">
      <el-icon><Fold v-if="!isCollapsed" /><Expand v-else /></el-icon>
      <span v-if="!isCollapsed" class="toggle-text">Collapse Menu</span>
    </div>

    <el-menu
      :default-active="activePath"
      class="sidebar-menu"
      :collapse="isCollapsed"
      router
    >
      <!-- Core Menu Group -->
      <div class="menu-section-label" v-if="!isCollapsed">CORE PLATFORM</div>

      <el-menu-item index="/dashboard">
        <el-icon><Odometer /></el-icon>
        <template #title>Dashboard</template>
      </el-menu-item>

      <el-menu-item index="/devices">
        <el-icon><Cpu /></el-icon>
        <template #title>Device Management</template>
      </el-menu-item>

      <el-menu-item index="/plugins">
        <el-icon><Connection /></el-icon>
        <template #title>Plugin Center</template>
      </el-menu-item>

      <!-- Dynamic Plugin Menus -->
      <template v-if="pluginMenus.length > 0">
        <div class="menu-section-label" v-if="!isCollapsed">EXTENSIONS & PROTOCOLS</div>

        <template v-for="menu in pluginMenus" :key="menu.id">
          <!-- Nested Submenu -->
          <el-sub-menu v-if="menu.children && menu.children.length > 0" :index="menu.id">
            <template #title>
              <el-icon><component :is="resolveIcon(menu.icon)" /></el-icon>
              <span>{{ menu.label }}</span>
            </template>
            <el-menu-item
              v-for="child in menu.children"
              :key="child.id"
              :index="child.route"
            >
              <el-icon v-if="child.icon"><component :is="resolveIcon(child.icon)" /></el-icon>
              <template #title>{{ child.label }}</template>
            </el-menu-item>
          </el-sub-menu>

          <!-- Single Menu Item -->
          <el-menu-item v-else :index="menu.route">
            <el-icon><component :is="resolveIcon(menu.icon)" /></el-icon>
            <template #title>{{ menu.label }}</template>
          </el-menu-item>
        </template>
      </template>
    </el-menu>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import {
  Odometer,
  Cpu,
  Connection,
  Fold,
  Expand,
  Tools,
  Monitor,
  Share,
  Setting,
} from '@element-plus/icons-vue';
import { usePlugins } from '../composables/usePlugins';

const route = useRoute();
const { activeMenus } = usePlugins();
const isCollapsed = ref(false);

const activePath = computed(() => route.path);

const pluginMenus = computed(() => {
  return activeMenus.value;
});

function resolveIcon(iconName?: string) {
  switch (iconName) {
    case 'Monitor':
      return Monitor;
    case 'Tools':
      return Tools;
    case 'Share':
      return Share;
    case 'Setting':
      return Setting;
    default:
      return Connection;
  }
}
</script>

<style scoped>
.sidebar-nav {
  width: 240px;
  background-color: #1e293b;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  height: 100%;
}

.sidebar-nav.is-collapsed {
  width: 64px;
}

.sidebar-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  cursor: pointer;
  border-bottom: 1px solid #334155;
  color: #94a3b8;
  font-size: 13px;
  user-select: none;
}

.sidebar-toggle:hover {
  color: #ffffff;
  background-color: #334155;
}

.toggle-text {
  font-size: 12px;
}

.sidebar-menu {
  border-right: none;
  background-color: transparent;
  flex: 1;
  overflow-y: auto;
}

:deep(.el-menu) {
  background-color: transparent;
  border-right: none;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  color: #cbd5e1;
  height: 48px;
  line-height: 48px;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: #334155;
  color: #ffffff;
}

:deep(.el-menu-item.is-active) {
  background-color: #2563eb;
  color: #ffffff;
  font-weight: 600;
}

.menu-section-label {
  padding: 16px 20px 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #64748b;
  text-transform: uppercase;
}
</style>
