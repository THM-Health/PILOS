import { mount } from '@vue/test-utils';
import { createContainer, createLocalVue, mockAxios } from '../../helper';
import { createTestingPinia } from '@pinia/testing';
import { PiniaVuePlugin } from 'pinia';
import RolesAndPermissionsComponent from '../../../../resources/js/components/User/RolesAndPermissionsComponent.vue';
import { BButton } from 'bootstrap-vue';

import Base from '../../../../resources/js/api/base';
import RoleSelect from '../../../../resources/js/components/Inputs/RoleSelect.vue';
import PermissionService from '../../../../resources/js/services/PermissionService';

const localVue = createLocalVue();
localVue.use(PiniaVuePlugin);

const user = {
  id: 2,
  authenticator: 'local',
  email: 'john@doe.com',
  external_id: null,
  firstname: 'John',
  lastname: 'Doe',
  model_name: 'User',
  bbb_skip_check_audio: true,
  roles: [
    {
      id: 1,
      name: 'Admin',
      automatic: true
    },
    {
      id: 2,
      name: 'Staff',
      automatic: false
    }
  ],
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
  permissions: ['users.update']
};

describe('RolesAndPermissionsComponent', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  // Admin can change roles of users
  it('admin can edit roles', async () => {
    PermissionService.setCurrentUser(adminUser);

    const wrapper = mount(RolesAndPermissionsComponent, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user,
        viewOnly: false
      },
      stubs: {
        'role-select': true
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    // Check model passed to role-select
    const roleSelect = wrapper.findComponent(RoleSelect);
    expect(roleSelect.props('value')).toEqual([{ id: 1, name: 'Admin', automatic: true }, { id: 2, name: 'Staff', automatic: false }]);

    // Check if enabled
    expect(roleSelect.props('disabled')).toBe(false);

    // Check list of displayed roles
    expect(roleSelect.props('disabledRoles')).toEqual([1]);

    // Emit busy event loading roles
    roleSelect.vm.$emit('busy', true);
    await wrapper.vm.$nextTick();

    // Check if save button is disabled
    const saveButton = wrapper.findComponent(BButton);
    expect(saveButton.attributes('disabled')).toBe('disabled');

    // Emit busy event after loading roles
    roleSelect.vm.$emit('busy', false);
    await wrapper.vm.$nextTick();

    // Check if save button is enabled
    expect(saveButton.attributes('disabled')).toBeUndefined();

    // Emit input event
    roleSelect.vm.$emit('input', [{ id: 1, name: 'Admin', automatic: true }]);

    const request = mockAxios.request('/api/v1/users/2');

    // Trigger save
    await saveButton.trigger('click');

    // Check if request was sent
    await request.wait();
    expect(request.config.method).toEqual('put');
    expect(request.config.data).toEqual(JSON.stringify({ roles: [1] }));

    // Check if save button and role select are disabled during request
    expect(roleSelect.props('disabled')).toBe(true);
    expect(saveButton.attributes('disabled')).toBe('disabled');

    const newUser = { ...user, roles: [{ id: 1, name: 'Admin', automatic: true }] };

    // Respond with success
    await request.respondWith({
      status: 200,
      response: {
        data: newUser
      }
    });

    // Check if save button and role select are enabled after request
    expect(roleSelect.props('disabled')).toBe(false);
    expect(saveButton.attributes('disabled')).toBeUndefined();

    // Check event emitted
    expect(wrapper.emitted('updateUser')[0][0]).toEqual(newUser);

    wrapper.destroy();
  });

  // Admin tries to edit his own roles
  it('admin cannot change own roles', async () => {
    PermissionService.setCurrentUser(adminUser);

    const wrapper = mount(RolesAndPermissionsComponent, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user: adminUser,
        viewOnly: false
      },
      stubs: {
        'role-select': true
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    // Check if disabled
    const roleSelect = wrapper.findComponent(RoleSelect);
    expect(roleSelect.props('disabled')).toBe(true);

    // Check if save button is missing
    const saveButton = wrapper.findComponent(BButton);
    expect(saveButton.exists()).toBe(false);

    wrapper.destroy();
  });

  // Disable role select and hide save button on view only
  it('role select is disabled on view only', async () => {
    PermissionService.setCurrentUser(adminUser);

    const wrapper = mount(RolesAndPermissionsComponent, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user,
        viewOnly: true
      },
      stubs: {
        'role-select': true
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    const roleSelect = wrapper.findComponent(RoleSelect);
    expect(roleSelect.props('disabled')).toBe(true);

    const saveButton = wrapper.findComponent(BButton);
    expect(saveButton.exists()).toBe(false);

    wrapper.destroy();
  });

  // User without permission cannot edit roles of other users
  it('user without permission cannot edit roles', async () => {
    PermissionService.setCurrentUser(user);

    const wrapper = mount(RolesAndPermissionsComponent, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user: adminUser,
        viewOnly: false
      },
      stubs: {
        'role-select': true
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    const roleSelect = wrapper.findComponent(RoleSelect);
    expect(roleSelect.exists()).toBe(true);
    expect(roleSelect.props('disabled')).toBe(true);

    const saveButton = wrapper.findComponent(BButton);
    expect(saveButton.exists()).toBe(false);

    wrapper.destroy();
  });

  // Handle role-select loading error
  it('handle role-select loading error', async () => {
    PermissionService.setCurrentUser(adminUser);

    const wrapper = mount(RolesAndPermissionsComponent, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user,
        viewOnly: false
      },
      stubs: {
        'role-select': true
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    // Emit loading roles error
    const roleSelect = wrapper.findComponent(RoleSelect);
    roleSelect.vm.$emit('loadingError', true);
    await wrapper.vm.$nextTick();

    // Save button should be disabled
    const saveButton = wrapper.findComponent(BButton);
    expect(saveButton.attributes('disabled')).toBe('disabled');

    // Resolve loading roles error
    roleSelect.vm.$emit('loadingError', false);
    await wrapper.vm.$nextTick();

    // Save button should be enabled
    expect(saveButton.attributes('disabled')).toBeUndefined();

    wrapper.destroy();
  });

  // Handle errors on saving roles
  it('handle errors on saving roles', async () => {
    PermissionService.setCurrentUser(adminUser);
    const baseErrorSpy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const wrapper = mount(RolesAndPermissionsComponent, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user,
        viewOnly: false
      },
      stubs: {
        'role-select': true
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    const button = wrapper.findComponent(BButton);
    expect(button.text()).toBe('app.save');

    // --- Check 404 error ---
    let request = mockAxios.request('/api/v1/users/2');
    await button.trigger('click');
    await request.wait();
    await request.respondWith({
      status: 404,
      response: {
        message: 'User not found'
      }
    });

    await wrapper.vm.$nextTick();

    // Check if error is emitted
    expect(wrapper.emitted().notFoundError).toBeTruthy();

    // --- Check stale error ---
    request = mockAxios.request('/api/v1/users/2');
    await button.trigger('click');
    await request.wait();
    const response = {
      error: 428,
      message: 'test',
      new_model: { ...user, firstname: 'Max' }
    };

    await request.respondWith({
      status: 428,
      response
    });

    await wrapper.vm.$nextTick();

    // Check if error is emitted
    expect(wrapper.emitted().staleError).toBeTruthy();
    expect(wrapper.emitted().staleError[0]).toEqual([response]);

    // --- Check form validation error ---

    request = mockAxios.request('/api/v1/users/2');
    await button.trigger('click');
    await request.wait();
    // Respond with errors
    await request.respondWith({
      status: 422,
      response: {
        errors: {
          roles: ['The roles field is required.']
        }
      }
    });

    await wrapper.vm.$nextTick();

    // Check if error is shown
    const roleSelect = wrapper.findComponent(RoleSelect);
    expect(roleSelect.props('invalid')).toBeTruthy();

    // --- Check other errors ---

    request = mockAxios.request('/api/v1/users/2');
    await button.trigger('click');
    await request.wait();

    // Reset form validation error shown on next request
    expect(roleSelect.props('state')).toBeFalsy();

    await request.respondWith({
      status: 500,
      response: {
        message: 'Internal server error'
      }
    });

    await wrapper.vm.$nextTick();

    // Check if error handler is called
    expect(baseErrorSpy).toBeCalledTimes(1);
    expect(baseErrorSpy.mock.calls[0][0].response.status).toBe(500);

    wrapper.destroy();
  });
});
