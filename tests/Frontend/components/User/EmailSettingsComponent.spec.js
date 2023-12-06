import { mount } from '@vue/test-utils';
import { createContainer, createLocalVue, mockAxios } from '../../helper';
import { createTestingPinia } from '@pinia/testing';
import { PiniaVuePlugin } from 'pinia';
import EmailSettingsComponent from '@/components/User/EmailSettingsComponent.vue';
import { BAlert, BButton, BFormInput } from 'bootstrap-vue';

import Base from '@/api/base';
import PermissionService from '@/services/PermissionService';

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

describe('EmailSettingsComponent', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  // Admin can change email of normal user without password confirmation
  it('admin change email', async () => {
    PermissionService.setCurrentUser(adminUser);

    const wrapper = mount(EmailSettingsComponent, {
      pinia: createTestingPinia({ initialState: { auth: { currentUser: adminUser } } }),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user,
        viewOnly: false
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    // Check if email is set
    const inputs = wrapper.findAllComponents(BFormInput);
    expect(inputs.length).toBe(1);
    expect(inputs.at(0).props('value')).toBe('john@doe.com');

    // Change email
    await inputs.at(0).find('input').setValue('john.doe@example.com');

    // Find save button
    const saveButton = wrapper.findComponent(BButton);
    expect(saveButton.text()).toBe('auth.change_email');

    const request = mockAxios.request('/api/v1/users/2/email');

    // Click save button
    await saveButton.trigger('click');

    // Check request
    await request.wait();
    expect(request.config.method).toBe('put');
    expect(JSON.parse(request.config.data)).toEqual({ email: 'john.doe@example.com' });

    const newUser = { ...user, email: 'john.doe@example.com' };

    await request.respondWith({
      status: 200,
      data: {
        data: newUser
      }
    });

    await wrapper.vm.$nextTick();

    // Check if event is emitted
    expect(wrapper.emitted('update-user')).toBeTruthy();
    expect(wrapper.emitted('update-user')[0][0]).toEqual(newUser);

    wrapper.destroy();
  });

  // Check if user cannot change email without permission
  it('edit own email without permission', async () => {
    PermissionService.setCurrentUser(user);

    const wrapper = mount(EmailSettingsComponent, {
      pinia: createTestingPinia({ initialState: { auth: { currentUser: user } } }),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user,
        viewOnly: false
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    // Check if email is set but disabled
    const inputs = wrapper.findAllComponents(BFormInput);
    expect(inputs.length).toBe(1);
    expect(inputs.at(0).props('value')).toBe('john@doe.com');
    expect(inputs.at(0).props('disabled')).toBeTruthy();

    // Find save button
    const saveButton = wrapper.findComponent(BButton);
    expect(saveButton.exists()).toBeFalsy();

    wrapper.destroy();
  });

  // Require own user to enter current password to change email
  it('edit own email', async () => {
    PermissionService.setCurrentUser({ ...user, permissions: ['users.updateOwnAttributes'] });

    const wrapper = mount(EmailSettingsComponent, {
      pinia: createTestingPinia({ initialState: { auth: { currentUser: user } } }),
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      propsData: {
        user,
        viewOnly: false
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    // Check if email is set
    const inputs = wrapper.findAllComponents(BFormInput);
    expect(inputs.length).toBe(2);
    expect(inputs.at(1).props('value')).toBe('john@doe.com');

    // Set current password
    await inputs.at(0).find('input').setValue('secretPassword123#');

    // Change email
    await inputs.at(1).find('input').setValue('john.doe@example.com');

    // Find save button
    const saveButton = wrapper.findComponent(BButton);
    expect(saveButton.text()).toBe('auth.change_email');

    let request = mockAxios.request('/api/v1/users/2/email');

    // Click save button
    await saveButton.trigger('click');

    // Check request
    await request.wait();
    expect(request.config.method).toBe('put');
    expect(JSON.parse(request.config.data)).toEqual({ email: 'john.doe@example.com', current_password: 'secretPassword123#' });

    // Check if field are disabled during request
    expect(inputs.at(0).props('disabled')).toBeTruthy();
    expect(inputs.at(1).props('disabled')).toBeTruthy();
    expect(saveButton.attributes('disabled')).toBeTruthy();

    await request.respondWith({
      status: 202
    });

    await wrapper.vm.$nextTick();

    // Check if field are enabled after the request
    expect(inputs.at(0).props('disabled')).toBeFalsy();
    expect(inputs.at(1).props('disabled')).toBeFalsy();
    expect(saveButton.attributes('disabled')).toBeFalsy();

    // Check if no event is emitted
    expect(wrapper.emitted('update-user')).toBeFalsy();

    // Check if email is changed back to original
    expect(inputs.at(1).props('value')).toBe('john@doe.com');

    // Check if message is shown with new email
    let message = wrapper.findComponent(BAlert);
    expect(message.exists()).toBeTruthy();
    expect(message.text()).toContain('auth.send_email_confirm_mail:{"email":"john.doe@example.com"}');

    // Check if password field is cleared
    expect(inputs.at(0).props('value')).toBeNull();

    // Submit again but server already has changed email
    await inputs.at(0).find('input').setValue('secretPassword123#');
    await inputs.at(1).find('input').setValue('john.doe@example.com');

    request = mockAxios.request('/api/v1/users/2/email');

    await saveButton.trigger('click');

    await request.wait();

    // Check if message is hidden
    message = wrapper.findComponent(BAlert);
    expect(message.exists()).toBeFalsy();

    await request.respondWith({
      status: 200,
      data: {
        data: { ...user, email: 'john.doe@example.com' }
      }
    });

    await wrapper.vm.$nextTick();

    // Check if event is emitted
    expect(wrapper.emitted('update-user')).toBeTruthy();
    expect(wrapper.emitted('update-user')[0][0]).toEqual({ ...user, email: 'john.doe@example.com' });

    // Check if new email is shown
    expect(inputs.at(1).props('value')).toBe('john.doe@example.com');

    wrapper.destroy();
  });

  // Error handling on submit
  it('error handling', async () => {
    PermissionService.setCurrentUser(adminUser);
    const baseErrorSpy = vi.spyOn(Base, 'error').mockImplementation(() => {});
    const toastErrorSpy = vi.fn();

    const wrapper = mount(EmailSettingsComponent, {
      pinia: createTestingPinia({ initialState: { auth: { currentUser: adminUser } } }),
      localVue,
      mocks: {
        $t: key => key,
        toastError: toastErrorSpy
      },
      propsData: {
        user,
        viewOnly: false
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    // Find submit button
    const saveButton = wrapper.findComponent(BButton);
    // --- Check 404 error ---

    let request = mockAxios.request('/api/v1/users/2/email');

    await saveButton.trigger('click');
    await request.wait();
    await request.respondWith({
      status: 404,
      data: {
        message: 'User not found'
      }
    });

    await wrapper.vm.$nextTick();

    // Check if error is emitted
    expect(wrapper.emitted('not-found-error')).toBeTruthy();

    // --- Check email change throttle error ---
    request = mockAxios.request('/api/v1/users/2/email');
    await saveButton.trigger('click');
    await request.wait();
    await request.respondWith({
      status: 471
    });

    await wrapper.vm.$nextTick();

    // Check if toast error is called
    expect(toastErrorSpy).toHaveBeenCalled();

    // --- Check form validation error ---
    request = mockAxios.request('/api/v1/users/2/email');
    await saveButton.trigger('click');
    await request.wait();
    // Respond with errors
    await request.respondWith({
      status: 422,
      data: {
        errors: {
          email: ['The email field is required.']
        }
      }
    });

    await wrapper.vm.$nextTick();

    // Check if errors are shown
    const emailInput = wrapper.findComponent(BFormInput);
    expect(emailInput.props('state')).toBe(false);

    // --- Check other errors ---
    request = mockAxios.request('/api/v1/users/2/email');
    await saveButton.trigger('click');
    await request.wait();

    // Reset form validation error shown on next request
    expect(emailInput.props('state')).toBeNull();

    await request.respondWith({
      status: 500,
      data: {
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
