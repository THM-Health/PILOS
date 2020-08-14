import { createLocalVue, shallowMount } from '@vue/test-utils';
import AdminIndex from '../../../../resources/js/views/admin/Index';
import MenuButton from '../../../../resources/js/components/Admin/MenuButton';
import SettingsView from '../../../../resources/js/components/Admin/SettingsView';
import BootstrapVue from 'bootstrap-vue';

const localVue = createLocalVue();
localVue.use(BootstrapVue);

describe('AdminIndex', function () {
  let wrapper;

  beforeEach(function () {
    wrapper = shallowMount(AdminIndex, {
      localVue,
      mocks: {
        $t: (key) => key
      }
    });
  });

  it('contains a SettingsView component', function () {
    const settingsView = wrapper.findComponent(SettingsView);
    expect(settingsView.exists()).toBe(true);
  });

  it('contains a MenuButton component', function () {
    const menuButton = wrapper.findComponent(MenuButton);
    expect(menuButton.exists()).toBe(true);
  });
});
