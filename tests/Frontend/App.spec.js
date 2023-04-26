import { mount } from '@vue/test-utils';
import App from '../../resources/js/views/App.vue';
import Profile from '../../resources/js/views/Profile.vue';
import BootstrapVue, { BNavItem } from 'bootstrap-vue';
import PermissionService from '../../resources/js/services/PermissionService';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { useAuthStore } from '../../resources/js/stores/auth';
import { createLocalVue, waitMoxios } from './helper';
import VueRouter from 'vue-router';
import moxios from 'moxios';

const localVue = createLocalVue();
localVue.use(VueRouter);
localVue.use(PiniaVuePlugin);
localVue.use(BootstrapVue);

const currentUser = {
  firstname: 'Darth',
  lastname: 'Vader',
  permissions: []
};

describe('App', () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it('settings menu item gets only shown if the user has permissions to manage settings', async () => {
    const oldUser = PermissionService.currentUser;
    PermissionService.setCurrentUser(currentUser);

    const view = mount(App, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: (key) => key
      },
      stubs: {
        RouterView: true,
        LocaleSelector: true
      },
      data () {
        return {
          availableLocales: []
        };
      }
    });

    const authStore = useAuthStore();
    authStore.currentUser = currentUser;

    // Check without permissions
    await view.vm.$nextTick();
    expect(view.findAllComponents(BNavItem).filter((w) => {
      return w.text() === 'settings.title';
    }).length).toBe(0);

    // Check with permissions
    currentUser.permissions = ['settings.manage'];
    PermissionService.setCurrentUser(currentUser);
    await view.vm.$nextTick();
    expect(view.findAllComponents(BNavItem).filter((w) => {
      return w.text() === 'settings.title';
    }).length).toBe(1);

    // Cleanup
    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('successfull logout', async () => {
    const oldUser = PermissionService.currentUser;
    PermissionService.setCurrentUser(currentUser);

    const router = new VueRouter({
      mode: 'abstract',
      routes: [{
        path: '/profile',
        name: 'profile',
        component: Profile
      }]
    });
    const spy = vi.spyOn(router, 'push').mockImplementation(() => {});

    const view = mount(App, {
      localVue,
      pinia: createTestingPinia({ stubActions: false }),
      mocks: {
        $t: (key) => key
      },
      router,
      stubs: {
        RouterView: true,
        LocaleSelector: true
      },
      data () {
        return {
          availableLocales: []
        };
      }
    });

    // Set currently logged in user
    const authStore = useAuthStore();
    authStore.currentUser = currentUser;

    await view.vm.$nextTick();

    // Find logout menu item and click it
    const logoutMenu = view.findComponent({ ref: 'logout' });
    await logoutMenu.find('a').trigger('click');

    // Wait for request to be sent
    await waitMoxios();
    const request = moxios.requests.mostRecent();
    expect(request.config.method).toBe('post');
    expect(request.config.url).toBe('/api/v1/logout');

    // Reply with successfull logout
    await request.respondWith({
      status: 204
    });

    await view.vm.$nextTick();

    // Check if user is redirected to logout page
    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith({ name: 'logout' });

    // Check if user state is reset
    expect(authStore.currentUser).toEqual(null);

    // Cleanup
    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('failed logout', async () => {
    const oldUser = PermissionService.currentUser;
    PermissionService.setCurrentUser(currentUser);

    const router = new VueRouter({
      mode: 'abstract',
      routes: [{
        path: '/profile',
        name: 'profile',
        component: Profile
      }]
    });
    const routerSpy = vi.spyOn(router, 'push').mockImplementation(() => {});
    const toastErrorSpy = vi.fn();

    const view = mount(App, {
      localVue,
      pinia: createTestingPinia({ stubActions: false }),
      mocks: {
        $t: (key) => key,
        toastError: toastErrorSpy
      },
      router,
      stubs: {
        RouterView: true,
        LocaleSelector: true
      },
      data () {
        return {
          availableLocales: []
        };
      }
    });

    // Set currently logged in user
    const authStore = useAuthStore();
    authStore.currentUser = currentUser;

    await view.vm.$nextTick();

    // Find logout menu item and click it
    const logoutMenu = view.findComponent({ ref: 'logout' });
    await logoutMenu.find('a').trigger('click');

    // Wait for request to be sent
    await waitMoxios();
    const request = moxios.requests.mostRecent();
    expect(request.config.method).toBe('post');
    expect(request.config.url).toBe('/api/v1/logout');

    // Reply with failed logout (e.g. server error)
    await request.respondWith({
      status: 500,
      response: {
        message: 'Test'
      }
    });

    await view.vm.$nextTick();

    // Check if user is not redirected to logout page
    expect(routerSpy).toBeCalledTimes(0);

    // Check if user is shown an error message
    expect(toastErrorSpy).toBeCalledTimes(1);

    // Check if user state is not reset, is still logged in
    expect(authStore.currentUser).toEqual(currentUser);

    // Cleanup
    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });
});
