import { createLocalVue, mount } from '@vue/test-utils';
import App from '../../resources/js/views/App';
import Vuex from 'vuex';
import BootstrapVue, { BDropdownDivider, BDropdownItem } from 'bootstrap-vue';
import PermissionService from '../../resources/js/services/PermissionService';
import Vue from 'vue';

const localVue = createLocalVue();
localVue.use(Vuex);
localVue.use(BootstrapVue);

const currentUser = {
  firstname: 'Darth',
  lastname: 'Vader',
  permissions: []
};

const store = new Vuex.Store({
  modules: {
    session: {
      namespaced: true,
      state: {
        currentUser
      },
      getters: {
        isAuthenticated: () => true,
        settings: () => (setting) => null
      }
    }
  },
  state: {
    loadingCounter: 0
  }
});

describe('App', function () {
  it('settings menu item and divider gets only shown if the user has permissions to manage settings', async function () {
    const oldUser = PermissionService.currentUser;
    PermissionService.setCurrentUser(currentUser);

    const wrapper = mount(App, {
      localVue,
      store,
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

    await Vue.nextTick();
    expect(wrapper.findAllComponents(BDropdownDivider).length).toBe(0);
    expect(wrapper.findAllComponents(BDropdownItem).filter((w) => {
      return w.text() === 'settings.title';
    }).length).toBe(0);

    currentUser.permissions = ['settings.manage'];
    PermissionService.setCurrentUser(currentUser);
    await Vue.nextTick();
    expect(wrapper.findAllComponents(BDropdownDivider).length).toBe(1);
    expect(wrapper.findAllComponents(BDropdownItem).filter((w) => {
      return w.text() === 'settings.title';
    }).length).toBe(1);

    wrapper.destroy();
    PermissionService.setCurrentUser(oldUser);
  });
});
