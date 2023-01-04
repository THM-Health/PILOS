import { mount } from '@vue/test-utils';
import { createContainer, createLocalVue } from '../../helper';
import { createTestingPinia } from '@pinia/testing';
import { PiniaVuePlugin } from 'pinia';
import ProfileComponent from '../../../../resources/js/components/User/ProfileComponent.vue';
import { BButton, BFormInput, BImg } from 'bootstrap-vue';
import PermissionService from '../../../../resources/js/services/PermissionService';
import LocaleSelect from '../../../../resources/js/components/Inputs/LocaleSelect.vue';
import TimezoneSelect from '../../../../resources/js/components/Inputs/TimezoneSelect.vue';

const localVue = createLocalVue();
localVue.use(PiniaVuePlugin);

const ldapUser = {
  id: 1,
  authenticator: 'ldap',
  email: 'john@doe.com',
  username: 'jdo',
  firstname: 'John',
  lastname: 'Doe',
  model_name: 'User',
  image: null,
  timezone: 'Europe/Berlin',
  user_locale: 'de',
  permissions: []
};

const user = {
  id: 2,
  authenticator: 'users',
  email: 'john@doe.com',
  username: null,
  firstname: 'John',
  lastname: 'Doe',
  model_name: 'User',
  image: null,
  timezone: 'Europe/Berlin',
  user_locale: 'de',
  permissions: []
};

const adminUser = {
  id: 3,
  authenticator: 'users',
  email: 'admin@domin.com',
  username: null,
  firstname: 'Admin',
  lastname: 'User',
  model_name: 'User',
  permissions: ['users.update']
};
describe('ProfileComponent', () => {
  it('check admin view and edit normal user', async () => {
    const oldUser = PermissionService.currentUser;
    PermissionService.setCurrentUser(adminUser);

    const wrapper = mount(ProfileComponent, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user: user,
        modalStatic: false,
        viewOnly: false
      },
      stubs: {
        VueCropper: true,
        'timezone-select': true,
        'locale-select': true
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    const inputs = wrapper.findAllComponents(BFormInput);

    // Check firstname and lastname
    expect(inputs.at(0).props('id')).toBe('firstname');
    expect(inputs.at(0).props('value')).toBe('John');
    expect(inputs.at(0).props('disabled')).toBeFalsy();

    expect(inputs.at(1).props('id')).toBe('lastname');
    expect(inputs.at(1).props('value')).toBe('Doe');
    expect(inputs.at(0).props('disabled')).toBeFalsy();

    // Check no username
    expect(inputs.length).toBe(2);

    // Check empty image
    const image = wrapper.findComponent(BImg);
    expect(image.exists()).toBe(true);
    expect(image.attributes('src')).toBe('/images/default_profile.png');

    // Check locale select
    const localeSelect = wrapper.findComponent(LocaleSelect);
    expect(localeSelect.exists()).toBe(true);
    expect(localeSelect.props('disabled')).toBeFalsy();
    expect(localeSelect.props('value')).toBe('de');

    // Check timezone select
    const timezoneSelect = wrapper.findComponent(TimezoneSelect);
    expect(timezoneSelect.exists()).toBe(true);
    expect(timezoneSelect.props('disabled')).toBeFalsy();
    expect(timezoneSelect.props('value')).toBe('Europe/Berlin');

    // Check buttons
    const buttons = wrapper.findAllComponents(BButton);
    expect(buttons.length).toBe(2);
    // Upload image
    expect(buttons.at(0).text()).toBe('settings.users.image.upload');
    expect(buttons.at(0).attributes('disabled')).toBeFalsy();
    // Save
    expect(buttons.at(1).text()).toBe('app.save');
    expect(buttons.at(1).attributes('disabled')).toBeFalsy();

    // View only mode
    await wrapper.setProps({ viewOnly: true });
    await wrapper.vm.$nextTick();
    expect(inputs.at(0).props('disabled')).toBeTruthy();
    expect(inputs.at(1).props('disabled')).toBeTruthy();
    expect(wrapper.findAllComponents(BButton).length).toBe(0);
    expect(localeSelect.props('disabled')).toBeTruthy();
    expect(timezoneSelect.props('disabled')).toBeTruthy();

    PermissionService.setCurrentUser(oldUser);
    wrapper.destroy();
  });

  it('check admin view and edit ldap user', async () => {
    const oldUser = PermissionService.currentUser;
    PermissionService.setCurrentUser(adminUser);

    const wrapper = mount(ProfileComponent, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user: ldapUser,
        modalStatic: false,
        viewOnly: false
      },
      stubs: {
        VueCropper: true,
        'timezone-select': true,
        'locale-select': true
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    const inputs = wrapper.findAllComponents(BFormInput);

    // Check username
    expect(inputs.length).toBe(3);
    expect(inputs.at(2).props('id')).toBe('username');
    expect(inputs.at(2).props('value')).toBe('jdo');
    expect(inputs.at(2).props('disabled')).toBeTruthy();

    PermissionService.setCurrentUser(oldUser);
    wrapper.destroy();
  });

  it('check admin view and edit self without permission to change own attributes', async () => {
    const oldUser = PermissionService.currentUser;
    PermissionService.setCurrentUser({ id: 2, permissions: [] });

    const wrapper = mount(ProfileComponent, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user: user,
        modalStatic: false,
        viewOnly: false
      },
      stubs: {
        VueCropper: true,
        'timezone-select': true,
        'locale-select': true
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    const inputs = wrapper.findAllComponents(BFormInput);

    // Check firstname and lastname
    expect(inputs.at(0).props('id')).toBe('firstname');
    expect(inputs.at(0).props('disabled')).toBeTruthy();

    expect(inputs.at(1).props('id')).toBe('lastname');
    expect(inputs.at(0).props('disabled')).toBeTruthy();

    // -- Only firstname and lastname should be disabled --

    // Check buttons
    const buttons = wrapper.findAllComponents(BButton);
    expect(buttons.length).toBe(2);
    // Upload image
    expect(buttons.at(0).text()).toBe('settings.users.image.upload');
    expect(buttons.at(0).attributes('disabled')).toBeFalsy();
    // Save
    expect(buttons.at(1).text()).toBe('app.save');
    expect(buttons.at(1).attributes('disabled')).toBeFalsy();

    // Check locale select
    const localeSelect = wrapper.findComponent(LocaleSelect);
    expect(localeSelect.props('disabled')).toBeFalsy();

    // Check timezone select
    const timezoneSelect = wrapper.findComponent(TimezoneSelect);
    expect(timezoneSelect.props('disabled')).toBeFalsy();

    PermissionService.setCurrentUser(oldUser);
    wrapper.destroy();
  });

  it('check admin view and edit self with permission to change own attributes', async () => {
    const oldUser = PermissionService.currentUser;
    PermissionService.setCurrentUser({ id: 2, permissions: ['users.updateOwnAttributes'] });

    const wrapper = mount(ProfileComponent, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user: user,
        modalStatic: false,
        viewOnly: false
      },
      stubs: {
        VueCropper: true,
        'timezone-select': true,
        'locale-select': true
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    const inputs = wrapper.findAllComponents(BFormInput);

    // Check firstname and lastname
    expect(inputs.at(0).props('id')).toBe('firstname');
    expect(inputs.at(0).props('disabled')).toBeFalsy();

    expect(inputs.at(1).props('id')).toBe('lastname');
    expect(inputs.at(0).props('disabled')).toBeFalsy();

    // Check buttons
    const buttons = wrapper.findAllComponents(BButton);
    expect(buttons.length).toBe(2);
    // Upload image
    expect(buttons.at(0).text()).toBe('settings.users.image.upload');
    expect(buttons.at(0).attributes('disabled')).toBeFalsy();
    // Save
    expect(buttons.at(1).text()).toBe('app.save');
    expect(buttons.at(1).attributes('disabled')).toBeFalsy();

    // Check locale select
    const localeSelect = wrapper.findComponent(LocaleSelect);
    expect(localeSelect.props('disabled')).toBeFalsy();

    // Check timezone select
    const timezoneSelect = wrapper.findComponent(TimezoneSelect);
    expect(timezoneSelect.props('disabled')).toBeFalsy();

    PermissionService.setCurrentUser(oldUser);
    wrapper.destroy();
  });
});
