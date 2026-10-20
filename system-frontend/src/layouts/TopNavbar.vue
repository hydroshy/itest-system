<template>
  <header class="top-navbar">
    <div class="navbar-left">
      <div class="brand">
        <el-icon class="brand-icon"><Platform /></el-icon>
        <span class="brand-title">Universal IoT Platform</span>
      </div>

      <!-- Tenant Selector -->
      <div class="tenant-selector">
        <el-dropdown trigger="click" @command="handleTenantChange">
          <span class="tenant-trigger">
            <el-icon><OfficeBuilding /></el-icon>
            <span>{{ tenant.name }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="tenant-default:Default Production Plant">
                Plant 01 - Default Production
              </el-dropdown-item>
              <el-dropdown-item command="tenant-rnd:R&D Lab Facility">
                Plant 02 - R&D Lab Facility
              </el-dropdown-item>
              <el-dropdown-item command="tenant-test:QA & Testing Floor">
                Plant 03 - QA & Testing Floor
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <div class="navbar-right">
      <!-- Search Input -->
      <div class="search-box">
        <el-input
          v-model="searchQuery"
          placeholder="Search devices, telemetry, protocols..."
          prefix-icon="Search"
          size="small"
          clearable
        />
      </div>

      <!-- Notifications -->
      <el-badge :value="3" class="notification-badge" type="danger">
        <el-button circle size="small">
          <el-icon><Bell /></el-icon>
        </el-button>
      </el-badge>

      <!-- User Menu -->
      <el-dropdown trigger="click" @command="handleUserCommand">
        <span class="user-trigger">
          <el-avatar :size="28" icon="UserFilled" />
          <span class="username">{{ user?.username }}</span>
          <el-tag size="small" type="success" effect="plain" class="role-tag">
            {{ user?.roles?.[0] || 'User' }}
          </el-tag>
          <el-icon><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item disabled>
              Signed in as <strong>{{ user?.username }}</strong>
            </el-dropdown-item>
            <el-dropdown-item divided command="profile">
              <el-icon><User /></el-icon> Profile & Access
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon> Platform Settings
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon> Log Out
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Platform,
  OfficeBuilding,
  ArrowDown,
  Bell,
  User,
  Setting,
  SwitchButton,
} from '@element-plus/icons-vue';
import { useAuth } from '../composables/useAuth';
import { useTenant } from '../composables/useTenant';

const router = useRouter();
const { user, logout } = useAuth();
const { tenant, switchTenant } = useTenant();
const searchQuery = ref('');

function handleTenantChange(val: string) {
  const [id, name] = val.split(':');
  switchTenant(id, name);
}

function handleUserCommand(cmd: string) {
  if (cmd === 'logout') {
    logout();
    router.push('/login');
  }
}
</script>

<style scoped>
.top-navbar {
  height: 56px;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-sizing: border-box;
  z-index: 100;
}

.navbar-left,
.navbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 16px;
  color: #1e293b;
}

.brand-icon {
  font-size: 20px;
  color: #2563eb;
}

.tenant-selector {
  border-left: 1px solid #e2e8f0;
  padding-left: 16px;
}

.tenant-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #475569;
  font-weight: 500;
}

.search-box {
  width: 260px;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.user-trigger:hover {
  background-color: #f1f5f9;
}

.username {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.role-tag {
  font-size: 11px;
}
</style>
