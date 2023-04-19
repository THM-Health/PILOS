import { mount } from '@vue/test-utils';
import { createContainer, createLocalVue, waitMoxios } from '../../helper';
import { createTestingPinia } from '@pinia/testing';
import { PiniaVuePlugin } from 'pinia';
import PasswordComponent from '../../../../resources/js/components/User/PasswordComponent.vue';
import { BButton, BFormInput } from 'bootstrap-vue';
import moxios from 'moxios';
import Base from '../../../../resources/js/api/base';
import PermissionService from '../../../../resources/js/services/PermissionService';

const localVue = createLocalVue();
localVue.use(PiniaVuePlugin);

const user = {
  id: 2,
  authenticator: 'users',
  email: 'john@doe.com',
  username: null,
  firstname: 'John',
  lastname: 'Doe',
  model_name: 'User',
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

describe('PasswordComponent', () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  // Admin can change password without password confirmation
  it('admin change password', async () => {
    PermissionService.setCurrentUser(adminUser);
    const toastSuccessSpy = vi.fn();

    const wrapper = mount(PasswordComponent, {
      pinia: createTestingPinia({ initialState: { auth: { currentUser: adminUser } } }),
      localVue,
      mocks: {
        $t: key => key,
        toastSuccess: toastSuccessSpy
      },
      propsData: {
        user
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    // Check if only two input field are shown
    const inputs = wrapper.findAllComponents(BFormInput);
    expect(inputs.length).toBe(2);

    // Change password
    await inputs.at(0).find('input').setValue('secretPassword123#');
    await inputs.at(1).find('input').setValue('confirmSecretPassword123#');

    // Find save button
    const saveButton = wrapper.findComponent(BButton);
    expect(saveButton.text()).toBe('auth.change_password');

    // Click save button
    await saveButton.trigger('click');
    await waitMoxios();

    // Check request
    const request = moxios.requests.mostRecent();
    expect(request.config.method).toBe('put');
    expect(request.config.url).toBe('/api/v1/users/2/password');
    expect(JSON.parse(request.config.data)).toEqual({ new_password: 'secretPassword123#', new_password_confirmation: 'confirmSecretPassword123#' });

    await request.respondWith({
      status: 200,
      response: {
        data: user
      }
    });

    await wrapper.vm.$nextTick();

    // Check if event is emitted
    expect(wrapper.emitted().updateUser).toBeTruthy();
    expect(wrapper.emitted().updateUser[0][0]).toEqual(user);

    // Check if toast is shown
    expect(toastSuccessSpy).toHaveBeenCalled();

    // Check if inputs are empty
    expect(inputs.at(0).props('value')).toBeNull();
    expect(inputs.at(1).props('value')).toBeNull();

    wrapper.destroy();
  });

  // Check if user has to enter password confirmation if changing own password
  it('changing own password', async () => {
    PermissionService.setCurrentUser(user);
    const toastSuccessSpy = vi.fn();

    const wrapper = mount(PasswordComponent, {
      pinia: createTestingPinia({ initialState: { auth: { currentUser: user } } }),
      localVue,
      mocks: {
        $t: key => key,
        toastSuccess: toastSuccessSpy
      },
      propsData: {
        user,
        viewOnly: false
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    // Check if three input field are shown
    const inputs = wrapper.findAllComponents(BFormInput);
    expect(inputs.length).toBe(3);

    // Enter current password
    await inputs.at(0).find('input').setValue('secretPassword123#');

    // Change password
    await inputs.at(1).find('input').setValue('newSecretPassword123#');
    await inputs.at(2).find('input').setValue('confirmNewSecretPassword123#');

    // Find save button
    const saveButton = wrapper.findComponent(BButton);
    expect(saveButton.text()).toBe('auth.change_password');

    // Click save button
    await saveButton.trigger('click');
    await waitMoxios();

    // Check request
    const request = moxios.requests.mostRecent();
    expect(request.config.method).toBe('put');
    expect(request.config.url).toBe('/api/v1/users/2/password');
    expect(JSON.parse(request.config.data)).toEqual({ current_password: 'secretPassword123#', new_password: 'newSecretPassword123#', new_password_confirmation: 'confirmNewSecretPassword123#' });

    await request.respondWith({
      status: 200,
      response: {
        data: user
      }
    });

    await wrapper.vm.$nextTick();

    // Check if event is emitted
    expect(wrapper.emitted().updateUser).toBeTruthy();
    expect(wrapper.emitted().updateUser[0][0]).toEqual(user);

    // Check if toast is shown
    expect(toastSuccessSpy).toHaveBeenCalled();

    // Check if inputs are empty
    expect(inputs.at(0).props('value')).toBeNull();
    expect(inputs.at(1).props('value')).toBeNull();

    wrapper.destroy();
  });

  // Error handling on submit
  it('error handling', async () => {
    PermissionService.setCurrentUser(user);
    const baseErrorSpy = vi.spyOn(Base, 'error').mockImplementation(() => {});
    const toastErrorSpy = vi.fn();

    const wrapper = mount(PasswordComponent, {
      pinia: createTestingPinia({ initialState: { auth: { currentUser: user } } }),
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

    await saveButton.trigger('click');
    await waitMoxios();
    let request = moxios.requests.mostRecent();
    await request.respondWith({
      status: 404,
      response: {
        message: 'User not found'
      }
    });

    await wrapper.vm.$nextTick();

    // Check if error is emitted
    expect(wrapper.emitted().notFoundError).toBeTruthy();

    // --- Check form validation error ---

    await saveButton.trigger('click');
    await waitMoxios();
    request = moxios.requests.mostRecent();
    // Respond with errors
    await request.respondWith({
      status: 422,
      response: {
        errors: {
          current_password: [
            'The current password field is required.'
          ],
          new_password: [
            'The new password confirmation does not match.'
          ]
        }
      }
    });

    await wrapper.vm.$nextTick();

    // Check if errors are shown
    const inputs = wrapper.findAllComponents(BFormInput);
    expect(inputs.at(0).props('state')).toBe(false);
    expect(inputs.at(1).props('state')).toBe(false);

    // --- Check other errors ---

    await saveButton.trigger('click');
    await waitMoxios();
    request = moxios.requests.mostRecent();

    // Reset form validation error shown on next request
    expect(inputs.at(0).props('state')).toBeNull();
    expect(inputs.at(1).props('state')).toBeNull();

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
