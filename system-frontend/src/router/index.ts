import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import AppLayout from '../layouts/AppLayout.vue';

const LoginView = () => import('../views/LoginView.vue');
const DashboardView = () => import('../views/DashboardView.vue');
const DeviceListView = () => import('../views/DeviceListView.vue');
const PluginManagerView = () => import('../views/PluginManagerView.vue');
const NotFoundView = () => import('../views/NotFoundView.vue');

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { title: 'Login', public: true },
  },
  {
    path: '/',
    name: 'AppLayout',
    component: AppLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: DashboardView,
        meta: { title: 'Dashboard', icon: 'Odometer' },
      },
      {
        path: 'devices',
        name: 'Devices',
        component: DeviceListView,
        meta: { title: 'Device Management', icon: 'Cpu' },
      },
      {
        path: 'plugins',
        name: 'Plugins',
        component: PluginManagerView,
        meta: { title: 'Plugin Center', icon: 'Connection' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundView,
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  if (!to.meta?.public && !authStore.isAuthenticated) {
    next({ path: '/login', query: { redirect: to.fullPath } });
    return;
  }

  if (to.meta?.permissions) {
    const required = to.meta.permissions as string[];
    if (!authStore.hasPermission(required)) {
      next({ path: '/dashboard' });
      return;
    }
  }

  next();
});

export default router;
