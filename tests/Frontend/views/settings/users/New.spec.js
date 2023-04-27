import { mount } from '@vue/test-utils';
import { BButton, BForm, BFormInput } from 'bootstrap-vue';
import moxios from 'moxios';
import VueRouter from 'vue-router';
import New from '../../../../../resources/js/views/settings/users/New.vue';
import TimezoneSelect from '../../../../../resources/js/components/Inputs/TimezoneSelect.vue';
import LocaleSelect from '../../../../../resources/js/components/Inputs/LocaleSelect.vue';
import RoleSelect from '../../../../../resources/js/components/Inputs/RoleSelect.vue';
import { createContainer, waitMoxios, createLocalVue } from '../../../helper';
import Base from '../../../../../resources/js/api/base';
import { createTestingPinia } from '@pinia/testing';
import { PiniaVuePlugin } from 'pinia';

const localVue = createLocalVue();
localVue.use(PiniaVuePlugin);
localVue.use(VueRouter);

describe('NewUserView', () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it('submit form', async () => {
    // Create fake router
    const router = new VueRouter();
    const routerSpy = vi.spyOn(router, 'push').mockImplementation(() => {});

    // Set global defaults
    import.meta.env.VITE_DEFAULT_LOCALE = 'en';

    const view = mount(New, {
      pinia: createTestingPinia({ initialState: { settings: { settings: { default_timezone: 'Europe/Berlin' } } } }),
      localVue,
      router,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      stubs: { 'timezone-select': true, 'locale-select': true, 'role-select': true },
      attachTo: createContainer()
    });

    // Check title
    expect(view.find('h3').text()).toEqual('settings.users.new');

    // Find all regular input fields and fill them
    const fields = view.findAllComponents(BFormInput);
    await fields.at(0).setValue('John');
    await fields.at(1).setValue('Doe');
    await fields.at(2).setValue('john.doe@domain.tld');
    await fields.at(3).setValue('!Test1234');
    await fields.at(4).setValue('!Test1234');

    for (let i = 0; i < fields.length; i++) {
      expect(fields.at(i).props('disabled')).toBeFalsy();
      expect(fields.at(i).props('required')).toBeTruthy();
    }

    // Find timezone select and set value
    const timezoneSelect = view.findComponent(TimezoneSelect);
    expect(timezoneSelect.exists()).toBeTruthy();
    expect(timezoneSelect.props('value')).toEqual('Europe/Berlin');
    expect(timezoneSelect.props('disabled')).toBeFalsy();
    expect(timezoneSelect.props('required')).toBeTruthy();
    await timezoneSelect.vm.$emit('input', 'Europe/London');

    // Find locale select and set value
    const localeSelect = view.findComponent(LocaleSelect);
    expect(localeSelect.exists()).toBeTruthy();
    expect(localeSelect.props('value')).toEqual('en');
    expect(localeSelect.props('disabled')).toBeFalsy();
    expect(localeSelect.props('required')).toBeTruthy();
    await localeSelect.vm.$emit('input', 'de');

    // Find role select and set value
    const roleSelect = view.findComponent(RoleSelect);
    expect(roleSelect.exists()).toBeTruthy();
    expect(roleSelect.props('value')).toEqual([]);
    expect(roleSelect.props('disabled')).toBeFalsy();
    const roles = [{ id: 1, name: 'admin', default: true, model_name: 'Role', room_limit: -1 }, { id: 2, name: 'user', default: false, model_name: 'Role', room_limit: null }];
    await roleSelect.vm.$emit('input', roles);

    await view.vm.$nextTick();

    // Find submit button and click it
    const form = view.findComponent(BForm);
    const buttons = form.findAllComponents(BButton);
    const submitButton = buttons.at(1);
    expect(submitButton.exists()).toBeTruthy();
    expect(submitButton.text()).toEqual('app.save');
    expect(submitButton.attributes('disabled')).toBeFalsy();
    await submitButton.trigger('click');

    // Check if request was sent and check content
    await waitMoxios();
    const request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('post');
    expect(request.config.url).toEqual('/api/v1/users');
    expect(JSON.parse(request.config.data)).toEqual({
      firstname: 'John',
      lastname: 'Doe',
      email: 'john.doe@domain.tld',
      user_locale: 'de',
      timezone: 'Europe/London',
      roles: [1, 2],
      generate_password: false,
      new_password: '!Test1234',
      new_password_confirmation: '!Test1234'
    });

    // Check if fields are disabled during processing
    for (let i = 0; i < fields.length; i++) {
      expect(fields.at(i).props('disabled')).toBeTruthy();
    }
    expect(timezoneSelect.props('disabled')).toBeTruthy();
    expect(localeSelect.props('disabled')).toBeTruthy();
    expect(roleSelect.props('disabled')).toBeTruthy();

    // Respond with success
    await request.respondWith({
      status: 200,
      response: {
        data: {
          id: 123,
          authenticator: 'local',
          image: null,
          email: 'john.doe@domain.tld',
          external_id: null,
          firstname: 'John',
          lastname: 'Doe',
          user_locale: 'de',
          model_name: 'User',
          room_limit: -1,
          updated_at: '2022-09-20T12:00:00.000000Z',
          roles: [{ id: 1, name: 'admin', automatic: false }, { id: 2, name: 'user', automatic: false }],
          bbb_skip_check_audio: false,
          initial_password_set: false,
          timezone: 'Europe/Berlin'
        }
      }
    });

    // Check if fields are enabled again
    for (let i = 0; i < fields.length; i++) {
      expect(fields.at(i).props('disabled')).toBeFalsy();
    }
    expect(timezoneSelect.props('disabled')).toBeFalsy();
    expect(localeSelect.props('disabled')).toBeFalsy();
    expect(roleSelect.props('disabled')).toBeFalsy();

    // Check if user is redirected to user view
    expect(routerSpy).toHaveBeenCalledWith({ name: 'settings.users.view', params: { id: 123 } });

    view.destroy();
  });

  it('submit form errors', async () => {
    // Set global defaults
    import.meta.env.VITE_DEFAULT_LOCALE = 'en';

    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const view = mount(New, {
      pinia: createTestingPinia({ initialState: { settings: { settings: { default_timezone: 'Europe/Berlin' } } } }),
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      stubs: { 'timezone-select': true, 'locale-select': true, 'role-select': true },
      attachTo: createContainer()
    });

    // Find submit button and click it
    const form = view.findComponent(BForm);
    const buttons = form.findAllComponents(BButton);
    const submitButton = buttons.at(1);
    expect(submitButton.exists()).toBeTruthy();
    expect(submitButton.text()).toEqual('app.save');
    expect(submitButton.attributes('disabled')).toBeFalsy();
    await submitButton.trigger('click');

    // Check if request was sent and check content
    await waitMoxios();
    let request = moxios.requests.mostRecent();
    expect(JSON.parse(request.config.data)).toEqual({
      firstname: null,
      lastname: null,
      email: null,
      user_locale: 'en',
      timezone: 'Europe/Berlin',
      roles: [],
      generate_password: false,
      new_password: null,
      new_password_confirmation: null
    });

    // Respond with errors
    await request.respondWith({
      status: 422,
      response: {
        errors: {
          firstname: ['The Firstname field is required.'],
          lastname: ['The Lastname field is required.'],
          email: ['The Email field is required.'],
          roles: ['The Roles field is required.'],
          new_password: ['The New password field is required when generate password is false.']
        }
      }
    });

    await view.vm.$nextTick();

    // Check if errors are shown
    const fields = form.findAllComponents(BFormInput);
    expect(fields.at(0).props('state')).toBe(false);
    expect(fields.at(1).props('state')).toBe(false);
    expect(fields.at(2).props('state')).toBe(false);
    expect(fields.at(3).props('state')).toBe(false);
    const roleSelect = form.findComponent(RoleSelect);
    expect(roleSelect.props('invalid')).toBeTruthy();

    // Submit again
    await submitButton.trigger('click');
    await waitMoxios();

    // Check if validation errors are cleared on new submit
    expect(fields.at(0).props('state')).toBeNull();
    expect(fields.at(1).props('state')).toBeNull();
    expect(fields.at(2).props('state')).toBeNull();
    expect(fields.at(3).props('state')).toBeNull();
    expect(roleSelect.props('invalid')).toBeFalsy();

    // Respond with server error
    request = moxios.requests.mostRecent();
    await request.respondWith({
      status: 500,
      response: {
        message: 'Internal Server Error'
      }
    });

    await view.vm.$nextTick();

    // Check if global error handler is called
    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0][0].response.status).toEqual(500);

    view.destroy();
  });

  it('handle component events', async () => {
    const view = mount(New, {
      pinia: createTestingPinia(),
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      stubs: { 'timezone-select': true, 'locale-select': true, 'role-select': true },
      attachTo: createContainer()
    });

    // Find components
    const timezoneSelect = view.findComponent(TimezoneSelect);
    const roleSelect = view.findComponent(RoleSelect);

    // Find submit button
    const form = view.findComponent(BForm);
    const buttons = form.findAllComponents(BButton);
    const submitButton = buttons.at(1);

    // Check submit button enabled
    expect(submitButton.attributes('disabled')).toBeFalsy();

    // Load roles
    await roleSelect.vm.$emit('busy', true);
    expect(submitButton.attributes('disabled')).toBeTruthy();
    await roleSelect.vm.$emit('busy', false);
    expect(submitButton.attributes('disabled')).toBeFalsy();

    // Load roles error
    await roleSelect.vm.$emit('loadingError', true);
    expect(submitButton.attributes('disabled')).toBeTruthy();
    await roleSelect.vm.$emit('loadingError', false);
    expect(submitButton.attributes('disabled')).toBeFalsy();

    // Load timezones
    await timezoneSelect.vm.$emit('busy', true);
    expect(submitButton.attributes('disabled')).toBeTruthy();
    await timezoneSelect.vm.$emit('busy', false);
    expect(submitButton.attributes('disabled')).toBeFalsy();

    // Load timezones error
    await timezoneSelect.vm.$emit('loadingError', true);
    expect(submitButton.attributes('disabled')).toBeTruthy();
    await timezoneSelect.vm.$emit('loadingError', false);
    expect(submitButton.attributes('disabled')).toBeFalsy();

    view.destroy();
  });
});
