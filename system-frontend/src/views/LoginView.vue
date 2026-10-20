<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <el-icon class="login-icon"><Platform /></el-icon>
        <h2>ITEST System Platform</h2>
        <p class="subtitle">Micro-kernel System Administration & Services</p>
      </div>

      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        show-icon
        closable
        class="mb-4"
        @close="errorMessage = ''"
      />

      <el-form :model="form" @submit.prevent="handleLogin" label-position="top">
        <el-form-item label="Username or Email">
          <el-input
            v-model="form.username"
            prefix-icon="User"
            placeholder="Enter username (e.g. admin)"
            autocomplete="username"
          />
        </el-form-item>

        <el-form-item label="Password">
          <el-input
            v-model="form.password"
            type="password"
            prefix-icon="Lock"
            placeholder="Enter password"
            show-password
            autocomplete="current-password"
          />
        </el-form-item>

        <el-button
          type="primary"
          native-type="submit"
          :loading="loading"
          class="login-btn"
        >
          Sign In
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Platform } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const errorMessage = ref('');

const form = reactive({
  username: '',
  password: '',
});

async function handleLogin() {
  if (!form.username || !form.password) {
    errorMessage.value = 'Please provide both username and password';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await axios.post('/api/v1/auth/login', {
      username: form.username,
      usernameOrEmail: form.username,
      password: form.password,
    });

    const data = response.data;
    if (data && data.access_token) {
      const rawUser = data.user || {};
      const roleCodes = Array.isArray(rawUser.roles)
        ? rawUser.roles.map((r: any) => (typeof r === 'string' ? r : r.code || r.name))
        : [];
      const permissions = Array.isArray(rawUser.permissions) ? rawUser.permissions : [];

      authStore.setAuth(data.access_token, {
        id: rawUser.id || 'user-' + Date.now(),
        username: rawUser.username || form.username,
        email: rawUser.email,
        fullName: rawUser.fullName,
        userType: rawUser.userType,
        roles: roleCodes,
        permissions: permissions,
      });

      ElMessage.success('Login successful');
      router.push('/dashboard');
    } else {
      errorMessage.value = 'Authentication failed: Invalid response from server';
    }
  } catch (error: any) {
    const respMsg = error.response?.data?.message || error.message || 'Authentication failed';
    errorMessage.value = Array.isArray(respMsg) ? respMsg.join(', ') : respMsg;
  } finally {
    loading.value = false;
  }
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

.mb-4 {
  margin-bottom: 16px;
}

.login-btn {
  width: 100%;
  margin-top: 8px;
  padding: 12px;
  font-weight: 600;
}
</style>
