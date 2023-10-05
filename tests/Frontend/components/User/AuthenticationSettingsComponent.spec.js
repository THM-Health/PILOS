import { mount } from '@vue/test-utils';
import { createContainer, createLocalVue } from '../../helper';
import AuthenticationSettingsComponent
  from '../../../../resources/js/components/User/AuthenticationSettingsComponent.vue';
import { createTestingPinia } from '@pinia/testing';
import { PiniaVuePlugin } from 'pinia';
import RolesAndPermissionsComponent from '../../../../resources/js/components/User/RolesAndPermissionsComponent.vue';
import _ from 'lodash';
import PasswordComponent from '../../../../resources/js/components/User/PasswordComponent.vue';
import { useAuthStore } from '../../../../resources/js/stores/auth';
import { useSettingsStore } from '../../../../resources/js/stores/settings';
import SessionsComponent from '../../../../resources/js/components/User/SessionsComponent.vue';

const localVue = createLocalVue();
localVue.use(PiniaVuePlugin);

const ldapUser = {
  id: 1,
  authenticator: 'ldap',
  email: 'john@doe.com',
  external_id: 'jdo',
  firstname: 'John',
  lastname: 'Doe',
  model_name: 'User',
  permissions: []
};

const user = {
  id: 2,
  authenticator: 'local',
  email: 'john@doe.com',
  external_id: null,
  firstname: 'John',
  lastname: 'Doe',
  model_name: 'User',
  permissions: []
};

const adminUser = {
  id: 3,
  authenticator: 'local',
  email: 'admin@domin.com',
  external_id: null,
  firstname: 'Admin',
  lastname: 'User',
  model_name: 'User',
  permissions: []
};

describe('AuthenticationSettingsComponent', () => {
  it('roles and permissions', async () => {
    const wrapper = mount(AuthenticationSettingsComponent, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user
      },
      stubs: {
        'roles-and-permissions-component': true,
        'password-component': true,
        'sessions-component': true
      },
      attachTo: createContainer()
    });

    const roles = wrapper.findComponent(RolesAndPermissionsComponent);
    expect(roles.exists()).toBe(true);

    // Check props
    expect(roles.props('user')).toEqual(user);
    expect(roles.props('viewOnly')).toBe(false);

    // Check events emitted to parent
    const newUser = _.cloneDeep(user);
    newUser.id = 3;
    roles.vm.$emit('updateUser', newUser);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted().updateUser[0][0].id).toEqual(3);

    roles.vm.$emit('staleError', new Error('Stale'));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted().staleError[0][0].message).toEqual('Stale');

    roles.vm.$emit('notFoundError', new Error('NotFound'));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted().notFoundError[0][0].message).toEqual('NotFound');

    wrapper.destroy();
  });

  it('password', async () => {
    const wrapper = mount(AuthenticationSettingsComponent, {
      pinia: createTestingPinia({ initialState: { auth: { currentUser: adminUser }, settings: { settings: { password_change_allowed: false } } }, stubActions: false }),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user
      },
      stubs: {
        'roles-and-permissions-component': true,
        'password-component': true,
        'sessions-component': true
      },
      attachTo: createContainer()
    });
    const auth = useAuthStore();
    const settings = useSettingsStore();

    // Check if available to admin
    expect(wrapper.findComponent(PasswordComponent).exists()).toBe(true);

    // Hide password component for view only
    await wrapper.setProps({ viewOnly: true });
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(PasswordComponent).exists()).toBe(false);

    // Disable view only
    await wrapper.setProps({ viewOnly: false });
    expect(wrapper.findComponent(PasswordComponent).exists()).toBe(true);

    // Hide password for ldap user
    await wrapper.setProps({ user: ldapUser });
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(PasswordComponent).exists()).toBe(false);

    // Change user back to normal user
    await wrapper.setProps({ user });
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(PasswordComponent).exists()).toBe(true);

    // Check if hidden for own user without permission to change password
    auth.setCurrentUser(user);
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(PasswordComponent).exists()).toBe(false);

    // Check if shown for own user with permission to change password
    settings.settings.password_change_allowed = true;
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(PasswordComponent).exists()).toBe(true);

    const passwordComponent = wrapper.findComponent(PasswordComponent);

    // Check events emitted to parent
    const newUser = _.cloneDeep(user);
    newUser.id = 3;
    passwordComponent.vm.$emit('updateUser', newUser);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted().updateUser[0][0].id).toEqual(3);

    passwordComponent.vm.$emit('notFoundError', new Error('NotFound'));
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted().notFoundError[0][0].message).toEqual('NotFound');

    wrapper.destroy();
  });

  it('sessions', async () => {
    const wrapper = mount(AuthenticationSettingsComponent, {
      pinia: createTestingPinia({ initialState: { auth: { currentUser: adminUser }, settings: { settings: { password_change_allowed: false } } }, stubActions: false }),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user
      },
      stubs: {
        'roles-and-permissions-component': true,
        'password-component': true,
        'sessions-component': true
      },
      attachTo: createContainer()
    });

    const auth = useAuthStore();

    // Check if not available to other users
    expect(wrapper.findComponent(SessionsComponent).exists()).toBe(false);

    // Check if available to own user
    auth.setCurrentUser(user);
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(SessionsComponent).exists()).toBe(true);

    wrapper.destroy();
  });
});
