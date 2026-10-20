<template>
  <div class="not-found-view">
    <el-result
      icon="warning"
      title="404 - Page Not Found"
      sub-title="The page you requested does not exist or may belong to a disabled plugin."
    >
      <template #extra>
        <el-button type="primary" @click="$router.push('/dashboard')">Back to Dashboard</el-button>
        <el-button @click="$router.push('/plugins')">Check Plugin Center</el-button>
      </template>
    </el-result>
  </div>
</template>

<style scoped>
.not-found-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}
</style>
