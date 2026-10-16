<template>
  <div class="app-layout">
    <TopNavbar />
    <div class="layout-body">
      <SidebarNav />
      <main class="main-content">
        <BreadcrumbBar />
        <div class="content-view">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import TopNavbar from './TopNavbar.vue';
import SidebarNav from './SidebarNav.vue';
import BreadcrumbBar from './BreadcrumbBar.vue';
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #f8fafc;
}

.layout-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background-color: #f1f5f9;
}

.content-view {
  flex: 1;
  padding: 24px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
