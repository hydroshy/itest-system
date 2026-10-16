<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <el-icon class="login-icon"><Platform /></el-icon>
        <h2>Universal IoT Platform</h2>
        <p class="subtitle">Industrial Communication & Edge Monitoring</p>
      </div>

      <el-form :model="form" @submit.prevent="handleLogin" label-position="top">
        <el-form-item label="Username">
          <el-input v-model="form.username" prefix-icon="User" placeholder="Enter username (e.g. admin)" />
        </el-form-item>

        <el-form-item label="Password">
          <el-input
            v-model="form.password"
            type="password"
            prefix-icon="Lock"
            placeholder="Enter password"
            show-password
          />
        </el-form-item>

        <el-form-item label="Plant / Facility Tenant">
          <el-select v-model="form.tenantId" style="width: 100%">
            <el-option label="Plant 01 - Default Production" value="tenant-default" />
            <el-option label="Plant 02 - R&D Lab Facility" value="tenant-rnd" />
            <el-option label="Plant 03 - QA & Testing Floor" value="tenant-test" />
          </el-select>
        </el-form-item>

        <el-button type="primary" native-type="submit" :loading="loading" class="login-btn">
          Sign In to Platform
        </el-button>
      </el-form>

      <div class="demo-hints">
        <p>Demo Accounts:</p>
        <div class="hint-chips">
          <el-tag size="small" @click="fillAccount('admin')">Admin (Full Access)</el-tag>
          <el-tag size="small" type="info" @click="fillAccount('operator')">Operator (Read-Only)</el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Platform } from '@element-plus/icons-vue';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);

const form = reactive({
  username: 'admin',
  password: 'password123',
  tenantId: 'tenant-default',
});

function fillAccount(type: 'admin' | 'operator') {
  if (type === 'admin') {
    form.username = 'admin';
  } else {
    form.username = 'operator';
  }
}

async function handleLogin() {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    const isAdmin = form.username === 'admin';
    authStore.setAuth('jwt-token-' + Date.now(), {
      id: isAdmin ? 'user-admin' : 'user-operator',
      username: form.username,
      roles: isAdmin ? ['admin', 'engineer'] : ['operator'],
      permissions: isAdmin
        ? ['*', 'device:read', 'device:write', 'telemetry:read', 'plugin:manage', 'serial:access']
        : ['device:read', 'telemetry:read'],
      tenantId: form.tenantId,
      tenantName: form.tenantId === 'tenant-default' ? 'Default Production Plant' : 'Secondary Facility',
    });
    router.push('/dashboard');
  }, 400);
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

.login-icon {
  font-size: 36px;
  color: #2563eb;
  margin-bottom: 8px;
}

.login-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.login-btn {
  width: 100%;
  margin-top: 8px;
  padding: 12px;
  font-weight: 600;
}

.demo-hints {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px dashed #e2e8f0;
  font-size: 12px;
  color: #64748b;
}

.hint-chips {
  display: flex;
  gap: 8px;
  margin-top: 6px;
  cursor: pointer;
}
</style>
