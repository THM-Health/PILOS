import { createLocalVue, mount } from '@vue/test-utils';
import App from '../../resources/js/views/App';
import BootstrapVue, { BNavItem } from 'bootstrap-vue';
import PermissionService from '../../resources/js/services/PermissionService';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { useAuthStore } from '../../resources/js/stores/auth';

const localVue = createLocalVue();
localVue.use(PiniaVuePlugin);
localVue.use(BootstrapVue);

const currentUser = {
  firstname: 'Darth',
  lastname: 'Vader',
  permissions: []
};

describe('App', () => {
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
        FlashMessage: true,
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
});
