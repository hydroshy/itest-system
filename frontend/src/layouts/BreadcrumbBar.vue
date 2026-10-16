<template>
  <div class="breadcrumb-bar">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/dashboard' }">Home</el-breadcrumb-item>
      <el-breadcrumb-item v-for="(item, idx) in breadcrumbs" :key="idx">
        {{ item }}
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const breadcrumbs = computed(() => {
  const metaTitle = (route.meta?.title as string) || '';
  if (metaTitle && metaTitle !== 'Dashboard') {
    return [metaTitle];
  }
  const pathParts = route.path.split('/').filter(Boolean);
  return pathParts.map((p) => p.charAt(0).toUpperCase() + p.slice(1));
});
</script>

<style scoped>
.breadcrumb-bar {
  padding: 12px 24px;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}
</style>
