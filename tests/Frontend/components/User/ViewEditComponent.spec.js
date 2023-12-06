import { mount } from '@vue/test-utils';

import { waitModalShown, waitModalHidden, createContainer, createLocalVue, mockAxios } from '../../helper';
import ViewEditComponent from '@/components/User/ViewEditComponent.vue';
import EmailSettingsComponent from '@/components/User/EmailSettingsComponent.vue';
import ProfileComponent from '@/components/User/ProfileComponent.vue';
import AuthenticationSettingsComponent from '@/components/User/AuthenticationSettingsComponent.vue';
import OtherSettingsComponent from '@/components/User/OtherSettingsComponent.vue';
import _ from 'lodash';
import { BButton, BLink, BModal, BOverlay } from 'bootstrap-vue';
import Base from '@/api/base';
import VueRouter from 'vue-router';

const localVue = createLocalVue();

const ldapUser = {
  id: 1,
  authenticator: 'ldap',
  email: 'john@doe.com',
  external_id: 'jdo',
  firstname: 'John',
  lastname: 'Doe',
  model_name: 'User',
  image: null,
  timezone: 'Europe/Berlin',
  user_locale: 'de',
  permissions: [],
  room_limit: -1,
  updated_at: '2020-01-01T01:00:00.000000Z',
  roles: [{
    id: 1,
    name: 'Test 1',
    automatic: true
  }, {
    id: 2,
    name: 'Test 2',
    automatic: false
  }],
  bbb_skip_check_audio: false,
  initial_password_set: false
};

describe('ViewEditComponent', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it('load model', async () => {
    const request = mockAxios.request('/api/v1/users/1');

    const wrapper = mount(ViewEditComponent, {
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        id: 1,
        viewOnly: false,
        modalStatic: true
      },
      stubs: {
        ProfileComponent: true,
        EmailSettingsComponent: true,
        OtherSettingsComponent: true,
        AuthenticationSettingsComponent: true
      },
      attachTo: createContainer()
    });

    await request.wait();
    expect(request.config.method).toBe('get');

    // Check loading overlay
    expect(wrapper.vm.isBusy).toBe(true);
    expect(wrapper.findComponent(BOverlay).props('show')).toBe(true);

    await request.respondWith({
      status: 200,
      data: {
        data: _.cloneDeep(ldapUser)
      }
    });

    await wrapper.vm.$nextTick();

    // Check overlay hidden
    expect(wrapper.vm.isBusy).toBe(false);
    expect(wrapper.findComponent(BOverlay).props('show')).toBe(false);

    // Check if automatic roles are disabled
    wrapper.vm.user.roles.forEach(role => {
      expect(role.$isDisabled).toBe(role.automatic);
    });

    // Check if user updated event is emitted
    expect(wrapper.emitted('update-user')).toBeTruthy();
    expect(wrapper.emitted('update-user')[0][0].id).toBe(ldapUser.id);

    wrapper.destroy();
  });

  it('load model with error', async () => {
    const baseErrorSpy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    let request = mockAxios.request('/api/v1/users/1');

    const wrapper = mount(ViewEditComponent, {
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        id: 1,
        viewOnly: false,
        modalStatic: true
      },
      stubs: {
        ProfileComponent: true,
        EmailSettingsComponent: true,
        OtherSettingsComponent: true,
        AuthenticationSettingsComponent: true
      },
      attachTo: createContainer()
    });

    await request.wait();
    expect(request.config.method).toBe('get');

    // Check loading overlay
    expect(wrapper.vm.isBusy).toBe(true);
    expect(wrapper.findComponent(BOverlay).props('show')).toBe(true);

    await request.respondWith({
      status: 500,
      data: {
        message: 'Error'
      }
    });

    await wrapper.vm.$nextTick();

    // Check overlay shown
    expect(wrapper.vm.isBusy).toBe(false);
    expect(wrapper.findComponent(BOverlay).props('show')).toBe(true);

    // Find reload button
    const reloadButton = wrapper.findComponent(BButton);
    expect(reloadButton.exists()).toBe(true);
    expect(reloadButton.text()).toBe('app.reload');

    // Check if user updated event is not emitted
    expect(wrapper.emitted('update-user')).toBeFalsy();

    // Check if error handler is called
    expect(baseErrorSpy).toBeCalledTimes(1);
    expect(baseErrorSpy.mock.calls[0][0].response.status).toBe(500);

    request = mockAxios.request('/api/v1/users/1');

    // Trigger reload
    await reloadButton.trigger('click');

    await request.wait();
    expect(request.config.method).toBe('get');

    // Check loading overlay
    expect(wrapper.vm.isBusy).toBe(true);
    expect(wrapper.findComponent(BOverlay).props('show')).toBe(true);

    await request.respondWith({
      status: 200,
      data: {
        data: ldapUser
      }
    });

    await wrapper.vm.$nextTick();

    // Check overlay hidden
    expect(wrapper.vm.isBusy).toBe(false);
    expect(wrapper.findComponent(BOverlay).props('show')).toBe(false);

    // Check if user updated event is emitted
    expect(wrapper.emitted('update-user')).toBeTruthy();
    expect(wrapper.emitted('update-user')[0][0].id).toBe(ldapUser.id);

    wrapper.destroy();
  });

  it('test update user event', async () => {
    mockAxios.request('/api/v1/users/1').respondWith({
      status: 200,
      data: {
        data: _.cloneDeep(ldapUser)
      }
    });

    const wrapper = mount(ViewEditComponent, {
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        id: 1,
        viewOnly: false,
        modalStatic: true
      },
      stubs: {
        transition: false,
        ProfileComponent: true,
        EmailSettingsComponent: true,
        OtherSettingsComponent: true,
        AuthenticationSettingsComponent: true
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await wrapper.vm.$nextTick();

    const newUser = _.cloneDeep(ldapUser);
    newUser.id = 2;

    wrapper.vm.updateUser(newUser);

    // Check if user updated event is emitted
    expect(wrapper.emitted('update-user')).toBeTruthy();
    expect(wrapper.emitted('update-user')[1][0].id).toBe(newUser.id);

    // New user should be set in data
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.user).toEqual(newUser);

    wrapper.destroy();
  });

  it('test user not found event', async () => {
    const baseErrorSpy = vi.spyOn(Base, 'error').mockImplementation(() => {});
    const router = new VueRouter();
    const routerSpy = vi.spyOn(router, 'push').mockImplementation(() => {});

    mockAxios.request('/api/v1/users/1').respondWith({
      status: 200,
      data: {
        data: _.cloneDeep(ldapUser)
      }
    });

    const wrapper = mount(ViewEditComponent, {
      localVue,
      mocks: {
        $t: key => key,
        $router: router
      },
      propsData: {
        id: 1,
        viewOnly: false,
        modalStatic: true
      },
      stubs: {
        transition: false,
        ProfileComponent: true,
        EmailSettingsComponent: true,
        OtherSettingsComponent: true,
        AuthenticationSettingsComponent: true
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await wrapper.vm.$nextTick();

    const newUser = _.cloneDeep(ldapUser);
    newUser.id = 2;

    wrapper.vm.updateUser(newUser);

    wrapper.vm.handleNotFoundError({ response: { message: 'No query results for model [App\\Models\\User] 1', status: 404, statusText: 'Not Found' } });

    // Check redirect to users list
    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'settings.users' });

    // Check if error handler is called
    expect(baseErrorSpy).toBeCalledTimes(1);
    expect(baseErrorSpy.mock.calls[0][0].response.status).toBe(404);

    wrapper.destroy();
  });

  it('test stale user event', async () => {
    mockAxios.request('/api/v1/users/1').respondWith({
      status: 200,
      data: {
        data: _.cloneDeep(ldapUser)
      }
    });

    const wrapper = mount(ViewEditComponent, {
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        id: 1,
        viewOnly: false,
        modalStatic: true
      },
      stubs: {
        transition: false,
        ProfileComponent: true,
        EmailSettingsComponent: true,
        OtherSettingsComponent: true,
        AuthenticationSettingsComponent: true
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await wrapper.vm.$nextTick();

    const newUser = _.cloneDeep(ldapUser);
    newUser.firstname = 'Peter';
    newUser.roles = [{
      id: 1,
      name: 'Test 1',
      automatic: false
    }, {
      id: 2,
      name: 'Test 2',
      automatic: true
    }];

    // Check if modal is shown
    await waitModalShown(wrapper, async () => {
      await wrapper.vm.handleStaleError({ error: 428, message: 'The user entity was updated in the meanwhile!', new_model: newUser });
    });

    const modal = wrapper.findComponent(BModal);

    // Find reload button
    const reloadButton = modal.findComponent(BButton);
    expect(reloadButton.exists()).toBe(true);
    expect(reloadButton.text()).toBe('app.reload');

    // Check if user is not updated before click
    expect(wrapper.vm.user.firstname).toEqual('John');

    // Check if modal is hidden on click
    await waitModalHidden(wrapper, async () => {
      await reloadButton.trigger('click');
    });

    // Check if user is updated after click
    expect(wrapper.vm.user.firstname).toEqual('Peter');

    // Check if automatic roles are disabled
    wrapper.vm.user.roles.forEach(role => {
      expect(role.$isDisabled).toBe(role.automatic);
    });

    // Check if update user event is emitted
    expect(wrapper.emitted('update-user')).toBeTruthy();
    expect(wrapper.emitted('update-user')[1][0].id).toBe(newUser.id);

    wrapper.destroy();
  });

  it('profile component', async () => {
    const spyUpdateUser = vi.spyOn(ViewEditComponent.methods, 'updateUser').mockImplementation(() => {});
    const spyHandleStaleError = vi.spyOn(ViewEditComponent.methods, 'handleStaleError').mockImplementation(() => {});
    const spyHandleNotFoundError = vi.spyOn(ViewEditComponent.methods, 'handleNotFoundError').mockImplementation(() => {});

    mockAxios.request('/api/v1/users/1').respondWith({
      status: 200,
      data: {
        data: _.cloneDeep(ldapUser)
      }
    });

    const wrapper = mount(ViewEditComponent, {
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        id: 1,
        viewOnly: false,
        modalStatic: true
      },
      stubs: {
        transition: false,
        ProfileComponent: true,
        EmailSettingsComponent: true,
        OtherSettingsComponent: true,
        AuthenticationSettingsComponent: true
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await wrapper.vm.$nextTick();

    // Check if profile component is rendered
    const profileComponent = wrapper.findComponent(ProfileComponent);
    expect(profileComponent.exists()).toBe(true);
    expect(profileComponent.props('user').firstname).toEqual(ldapUser.firstname);
    expect(profileComponent.props('viewOnly')).toBe(false);

    await wrapper.setProps({ viewOnly: true });
    expect(profileComponent.props('viewOnly')).toBe(true);

    // Test events
    const newUser = _.cloneDeep(ldapUser);
    newUser.id = 2;
    await profileComponent.vm.$emit('update-user', newUser);
    expect(spyUpdateUser).toBeCalledTimes(1);
    expect(spyUpdateUser.mock.calls[0][0]).toEqual(newUser);

    await profileComponent.vm.$emit('stale-error', new Error('Stale'));
    expect(spyHandleStaleError).toBeCalledTimes(1);
    expect(spyHandleStaleError.mock.calls[0][0].message).toEqual('Stale');

    await profileComponent.vm.$emit('not-found-error', new Error('NotFound'));
    expect(spyHandleNotFoundError).toBeCalledTimes(1);
    expect(spyHandleNotFoundError.mock.calls[0][0].message).toEqual('NotFound');

    wrapper.destroy();
  });

  it('email settings component', async () => {
    const spyUpdateUser = vi.spyOn(ViewEditComponent.methods, 'updateUser').mockImplementation(() => {});
    const spyHandleNotFoundError = vi.spyOn(ViewEditComponent.methods, 'handleNotFoundError').mockImplementation(() => {});

    mockAxios.request('/api/v1/users/1').respondWith({
      status: 200,
      data: {
        data: _.cloneDeep(ldapUser)
      }
    });

    const wrapper = mount(ViewEditComponent, {
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        id: 1,
        viewOnly: false,
        modalStatic: true
      },
      stubs: {
        transition: false,
        ProfileComponent: true,
        EmailSettingsComponent: true,
        OtherSettingsComponent: true,
        AuthenticationSettingsComponent: true
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await wrapper.vm.$nextTick();

    // Check if profile component is rendered
    expect(wrapper.findComponent(EmailSettingsComponent).exists()).toBe(false);

    const tabsButtons = wrapper.findAllComponents(BLink);
    expect(tabsButtons.length).toBe(4);
    await tabsButtons.at(1).trigger('click');

    await wrapper.vm.$nextTick();
    const emailSettingsComponent = wrapper.findComponent(EmailSettingsComponent);
    expect(emailSettingsComponent.exists()).toBe(true);

    expect(emailSettingsComponent.props('user').email).toEqual(ldapUser.email);
    expect(emailSettingsComponent.props('viewOnly')).toBe(false);

    await wrapper.setProps({ viewOnly: true });
    expect(emailSettingsComponent.props('viewOnly')).toBe(true);

    // Test events
    const newUser = _.cloneDeep(ldapUser);
    newUser.id = 2;
    await emailSettingsComponent.vm.$emit('update-user', newUser);
    expect(spyUpdateUser).toBeCalledTimes(1);
    expect(spyUpdateUser.mock.calls[0][0]).toEqual(newUser);

    await emailSettingsComponent.vm.$emit('not-found-error', new Error('NotFound'));
    expect(spyHandleNotFoundError).toBeCalledTimes(1);
    expect(spyHandleNotFoundError.mock.calls[0][0].message).toEqual('NotFound');

    wrapper.destroy();
  });

  it('authentication settings component', async () => {
    const spyUpdateUser = vi.spyOn(ViewEditComponent.methods, 'updateUser').mockImplementation(() => {});
    const spyHandleStaleError = vi.spyOn(ViewEditComponent.methods, 'handleStaleError').mockImplementation(() => {});
    const spyHandleNotFoundError = vi.spyOn(ViewEditComponent.methods, 'handleNotFoundError').mockImplementation(() => {});

    mockAxios.request('/api/v1/users/1').respondWith({
      status: 200,
      data: {
        data: _.cloneDeep(ldapUser)
      }
    });

    const wrapper = mount(ViewEditComponent, {
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        id: 1,
        viewOnly: false,
        modalStatic: true
      },
      stubs: {
        transition: false,
        ProfileComponent: true,
        EmailSettingsComponent: true,
        OtherSettingsComponent: true,
        AuthenticationSettingsComponent: true
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await wrapper.vm.$nextTick();

    // Check if profile component is rendered
    expect(wrapper.findComponent(AuthenticationSettingsComponent).exists()).toBe(false);

    const tabsButtons = wrapper.findAllComponents(BLink);
    expect(tabsButtons.length).toBe(4);
    await tabsButtons.at(2).trigger('click');

    await wrapper.vm.$nextTick();
    const authenticationSettingsComponent = wrapper.findComponent(AuthenticationSettingsComponent);
    expect(authenticationSettingsComponent.exists()).toBe(true);

    expect(authenticationSettingsComponent.props('user').roles[0].id).toEqual(ldapUser.roles[0].id);
    expect(authenticationSettingsComponent.props('viewOnly')).toBe(false);

    await wrapper.setProps({ viewOnly: true });
    expect(authenticationSettingsComponent.props('viewOnly')).toBe(true);

    // Test events
    // Test events
    const newUser = _.cloneDeep(ldapUser);
    newUser.id = 2;
    await authenticationSettingsComponent.vm.$emit('update-user', newUser);
    expect(spyUpdateUser).toBeCalledTimes(1);
    expect(spyUpdateUser.mock.calls[0][0]).toEqual(newUser);

    await authenticationSettingsComponent.vm.$emit('stale-error', new Error('Stale'));
    expect(spyHandleStaleError).toBeCalledTimes(1);
    expect(spyHandleStaleError.mock.calls[0][0].message).toEqual('Stale');

    await authenticationSettingsComponent.vm.$emit('not-found-error', new Error('NotFound'));
    expect(spyHandleNotFoundError).toBeCalledTimes(1);
    expect(spyHandleNotFoundError.mock.calls[0][0].message).toEqual('NotFound');

    wrapper.destroy();
  });

  it('other settings component', async () => {
    const spyUpdateUser = vi.spyOn(ViewEditComponent.methods, 'updateUser').mockImplementation(() => {});
    const spyHandleStaleError = vi.spyOn(ViewEditComponent.methods, 'handleStaleError').mockImplementation(() => {});
    const spyHandleNotFoundError = vi.spyOn(ViewEditComponent.methods, 'handleNotFoundError').mockImplementation(() => {});

    mockAxios.request('/api/v1/users/1').respondWith({
      status: 200,
      data: {
        data: _.cloneDeep(ldapUser)
      }
    });

    const wrapper = mount(ViewEditComponent, {
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        id: 1,
        viewOnly: false,
        modalStatic: true
      },
      stubs: {
        transition: false,
        ProfileComponent: true,
        EmailSettingsComponent: true,
        OtherSettingsComponent: true,
        AuthenticationSettingsComponent: true
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await wrapper.vm.$nextTick();

    // Check if profile component is rendered
    expect(wrapper.findComponent(OtherSettingsComponent).exists()).toBe(false);

    const tabsButtons = wrapper.findAllComponents(BLink);
    expect(tabsButtons.length).toBe(4);
    await tabsButtons.at(3).trigger('click');

    await wrapper.vm.$nextTick();
    const otherSettingsComponent = wrapper.findComponent(OtherSettingsComponent);
    expect(otherSettingsComponent.exists()).toBe(true);

    expect(otherSettingsComponent.props('user').bbb_skip_check_audio).toEqual(ldapUser.bbb_skip_check_audio);
    expect(otherSettingsComponent.props('viewOnly')).toBe(false);

    await wrapper.setProps({ viewOnly: true });
    expect(otherSettingsComponent.props('viewOnly')).toBe(true);

    // Test events
    // Test events
    const newUser = _.cloneDeep(ldapUser);
    newUser.id = 2;
    await otherSettingsComponent.vm.$emit('update-user', newUser);
    expect(spyUpdateUser).toBeCalledTimes(1);
    expect(spyUpdateUser.mock.calls[0][0]).toEqual(newUser);

    await otherSettingsComponent.vm.$emit('stale-error', new Error('Stale'));
    expect(spyHandleStaleError).toBeCalledTimes(1);
    expect(spyHandleStaleError.mock.calls[0][0].message).toEqual('Stale');

    await otherSettingsComponent.vm.$emit('not-found-error', new Error('NotFound'));
    expect(spyHandleNotFoundError).toBeCalledTimes(1);
    expect(spyHandleNotFoundError.mock.calls[0][0].message).toEqual('NotFound');

    wrapper.destroy();
  });
});
