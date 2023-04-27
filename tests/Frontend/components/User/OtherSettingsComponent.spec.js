import { mount } from '@vue/test-utils';
import { createContainer, createLocalVue, waitMoxios } from '../../helper';
import { createTestingPinia } from '@pinia/testing';
import { PiniaVuePlugin } from 'pinia';
import OtherSettingsComponent from '../../../../resources/js/components/User/OtherSettingsComponent.vue';
import { BButton, BFormCheckbox } from 'bootstrap-vue';
import moxios from 'moxios';
import Base from '../../../../resources/js/api/base';

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
  permissions: []
};

describe('OtherSettingComponent', () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it('check admin view and edit normal user', async () => {
    const wrapper = mount(OtherSettingsComponent, {
      pinia: createTestingPinia(),
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

    // Check if checkbox is checked
    const checkbox = wrapper.findComponent(BFormCheckbox);
    expect(checkbox.props('checked')).toBe(true);
    expect(wrapper.vm.$data.model.bbb_skip_check_audio).toBe(true);

    // Uncheck checkbox
    await checkbox.find('input').setChecked(false);
    await wrapper.vm.$nextTick();

    // Check if checkbox is unchecked
    expect(checkbox.props('checked')).toBe(false);
    expect(wrapper.vm.$data.model.bbb_skip_check_audio).toBe(false);

    // View only mode
    await wrapper.setProps({ viewOnly: true });
    await wrapper.vm.$nextTick();
    expect(checkbox.props('disabled')).toBeTruthy();
    expect(wrapper.findAllComponents(BButton).length).toBe(0);

    wrapper.destroy();
  });

  it('check reactivity for user prop', async () => {
    const wrapper = mount(OtherSettingsComponent, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user,
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

    // Check if checkbox is checked
    const checkbox = wrapper.findComponent(BFormCheckbox);
    expect(checkbox.props('checked')).toBe(true);
    expect(wrapper.vm.$data.model.bbb_skip_check_audio).toBe(true);

    // Change user prop
    const newUser = { ...user, bbb_skip_check_audio: false };
    wrapper.setProps({ user: newUser });
    await wrapper.vm.$nextTick();

    // Check if checkbox is unchecked
    expect(checkbox.props('checked')).toBe(false);
    expect(wrapper.vm.$data.model.bbb_skip_check_audio).toBe(false);

    wrapper.destroy();
  });

  it('submit form', async () => {
    const wrapper = mount(OtherSettingsComponent, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user,
        modalStatic: false,
        viewOnly: false
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    // Uncheck checkbox
    const checkbox = wrapper.findComponent(BFormCheckbox);
    await checkbox.find('input').setChecked(false);
    await wrapper.vm.$nextTick();

    // Check buttons
    const button = wrapper.findComponent(BButton);
    expect(button.attributes('disabled')).toBeFalsy();
    await button.trigger('click');

    await waitMoxios();
    const request = moxios.requests.mostRecent();
    expect(request.config.method).toBe('post');
    expect(request.config.url).toBe('/api/v1/users/2');
    expect(JSON.parse(request.config.data).bbb_skip_check_audio).toBeFalsy();

    // Check button and input disabled during request
    expect(button.attributes('disabled')).toBeTruthy();
    expect(checkbox.props('disabled')).toBeTruthy();

    const userAfterChanges = { ...user, bbb_skip_check_audio: true };

    await request.respondWith({
      status: 200,
      response: {
        data: userAfterChanges
      }
    });

    // Check if changes are emitted
    expect(wrapper.emitted('updateUser')[0][0]).toBe(userAfterChanges);
    // Update user prop
    await wrapper.setProps({ user: userAfterChanges });
    await wrapper.vm.$nextTick();

    // Check button and input enabled after request and have correct values
    expect(button.attributes('disabled')).toBeFalsy();
    expect(checkbox.props('disabled')).toBeFalsy();

    expect(checkbox.props('checked')).toBeTruthy();

    wrapper.destroy();
  });

  it('error on submit', async () => {
    const baseErrorSpy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const wrapper = mount(OtherSettingsComponent, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        user,
        modalStatic: false,
        viewOnly: false
      },
      attachTo: createContainer()
    });

    await wrapper.vm.$nextTick();

    const button = wrapper.findComponent(BButton);
    expect(button.text()).toBe('app.save');

    // --- Check 404 error ---

    await button.trigger('click');
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

    // --- Check 428 error ---

    await button.trigger('click');
    await waitMoxios();
    request = moxios.requests.mostRecent();
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

    await button.trigger('click');
    await waitMoxios();
    request = moxios.requests.mostRecent();
    // Respond with errors
    await request.respondWith({
      status: 422,
      response: {
        errors: {
          bbb_skip_check_audio: ['The bbb skip check audio field is required.']
        }
      }
    });

    await wrapper.vm.$nextTick();

    // Check if error is shown
    const checkbox = wrapper.findComponent(BFormCheckbox);
    expect(checkbox.props('state')).toBe(false);

    // --- Check other errors ---

    await button.trigger('click');
    await waitMoxios();
    request = moxios.requests.mostRecent();

    // Reset form validation error shown on next request
    expect(checkbox.props('state')).toBeNull();

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
