import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import PermissionGuard from '../components/shared/PermissionGuard.vue';
import { useAuthStore } from '../stores/auth';

describe('PermissionGuard Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders content when user has required permission', () => {
    const authStore = useAuthStore();
    authStore.user = {
      id: 'test-user',
      username: 'tester',
      roles: ['operator'],
      permissions: ['device:read'],
      tenantId: 'test-tenant',
    };

    const wrapper = mount(PermissionGuard, {
      props: {
        permission: 'device:read',
      },
      slots: {
        default: '<div class="content">Protected Content</div>',
      },
    });

    expect(wrapper.find('.content').exists()).toBe(true);
    expect(wrapper.text()).toContain('Protected Content');
  });

  it('hides content and renders fallback when user lacks permission', () => {
    const authStore = useAuthStore();
    authStore.user = {
      id: 'test-user',
      username: 'tester',
      roles: ['viewer'],
      permissions: ['device:read'],
      tenantId: 'test-tenant',
    };

    const wrapper = mount(PermissionGuard, {
      props: {
        permission: 'device:write',
      },
      slots: {
        default: '<div class="content">Protected Content</div>',
        fallback: '<div class="fallback">Access Denied</div>',
      },
    });

    expect(wrapper.find('.content').exists()).toBe(false);
    expect(wrapper.find('.fallback').exists()).toBe(true);
    expect(wrapper.text()).toContain('Access Denied');
  });

  it('grants access unconditionally if user has wildcard or admin role', () => {
    const authStore = useAuthStore();
    authStore.user = {
      id: 'admin-user',
      username: 'admin',
      roles: ['admin'],
      permissions: ['*'],
      tenantId: 'test-tenant',
    };

    const wrapper = mount(PermissionGuard, {
      props: {
        permission: 'critical:nuclear:shutdown',
      },
      slots: {
        default: '<div class="content">Critical Button</div>',
      },
    });

    expect(wrapper.find('.content').exists()).toBe(true);
  });
});
