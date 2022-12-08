import { mount } from '@vue/test-utils';
import BootstrapVue, { BButton, BFormInvalidFeedback, BSpinner } from 'bootstrap-vue';
import moxios from 'moxios';
import Login from '../../../resources/js/views/Login.vue';
import EmailLoginComponent from '../../../resources/js/components/Login/EmailLoginComponent.vue';
import LdapLoginComponent from '../../../resources/js/components/Login/LdapLoginComponent.vue';
import env from '../../../resources/js/env';
import Base from '../../../resources/js/api/base';
import VueRouter from 'vue-router';
import { waitMoxios, createLocalVue } from '../helper';
import { createTestingPinia } from '@pinia/testing';
import { PiniaVuePlugin } from 'pinia';

const localVue = createLocalVue();
localVue.use(VueRouter);
localVue.use(BootstrapVue);
localVue.use(PiniaVuePlugin);

describe('Login', () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it('correct data gets sent on ldap login', async () => {
    const view = mount(Login, {
      localVue,
      pinia: createTestingPinia({ initialState: { settings: { settings: { ldap: true } } }, stubActions: false }),
      mocks: {
        $t: (key) => key
      }
    });

    const ldapLoginComponent = view.findComponent(LdapLoginComponent);
    await ldapLoginComponent.find('#ldapUsername').setValue('user');
    await ldapLoginComponent.find('#ldapPassword').setValue('password');
    await ldapLoginComponent.findComponent(BButton).trigger('submit');
    expect(ldapLoginComponent.findComponent(BSpinner).exists()).toBe(true);

    await waitMoxios();
    let request = moxios.requests.mostRecent();

    expect(request.config.url).toBe('/sanctum/csrf-cookie');

    document.cookie = 'XSRF-TOKEN=test-csrf';
    await request.respondWith({
      status: 200
    });

    await waitMoxios();
    request = moxios.requests.mostRecent();

    expect(request.headers['X-XSRF-TOKEN']).toBe('test-csrf');
    expect(request.config.url).toBe('/api/v1/login/ldap');

    const data = JSON.parse(request.config.data);
    expect(data.username).toBe('user');
    expect(data.password).toBe('password');
    view.destroy();
  });

  it('hide ldap login if disabled', () => {
    const view = mount(Login, {
      localVue,
      pinia: createTestingPinia({ initialState: { settings: { settings: { ldap: false } } }, stubActions: false }),
      mocks: {
        $t: (key) => key
      }
    });

    const ldapLoginComponent = view.findComponent(LdapLoginComponent);
    expect(ldapLoginComponent.exists()).toBeFalsy();
    view.destroy();
  });

  it('correct data gets sent on email login', async () => {
    const view = mount(Login, {
      localVue,
      pinia: createTestingPinia({ stubActions: false }),
      mocks: {
        $t: (key) => key
      }
    });

    const emailLoginComponent = view.findComponent(EmailLoginComponent);
    await emailLoginComponent.find('#defaultEmail').setValue('user');
    await emailLoginComponent.find('#defaultPassword').setValue('password');
    await emailLoginComponent.findComponent(BButton).trigger('submit');
    expect(emailLoginComponent.findComponent(BSpinner).exists()).toBe(true);

    await waitMoxios();
    let request = moxios.requests.mostRecent();

    expect(request.config.url).toBe('/sanctum/csrf-cookie');

    document.cookie = 'XSRF-TOKEN=test-csrf';
    await request.respondWith({
      status: 200
    });

    await waitMoxios();
    request = moxios.requests.mostRecent();

    expect(request.headers['X-XSRF-TOKEN']).toBe('test-csrf');
    expect(request.config.url).toBe('/api/v1/login');

    const data = JSON.parse(request.config.data);
    expect(data.email).toBe('user');
    expect(data.password).toBe('password');

    view.destroy();
  });

  it('redirect if query set', async () => {
    const flashMessageSpy = vi.fn();
    const flashMessage = { success: flashMessageSpy };

    const router = new VueRouter({ mode: 'abstract' });
    await router.push('/foo?redirect=%2Fredirect_path');
    const routerSpy = vi.spyOn(router, 'push').mockImplementation(() => {});

    const view = mount(Login, {
      localVue,
      pinia: createTestingPinia({ stubActions: false }),
      mocks: {
        $t: (key) => key,
        flashMessage: flashMessage
      },
      router
    });

    moxios.stubRequest('/sanctum/csrf-cookie', {
      status: 200
    });
    moxios.stubRequest('/api/v1/login/ldap', {
      status: 204
    });
    moxios.stubRequest('/api/v1/currentUser', {
      status: 200,
      response: {
        data: {
          id: 1,
          authenticator: 'ldap',
          email: 'john.doe@domain.tld',
          username: 'user',
          firstname: 'John',
          lastname: 'Doe',
          user_locale: 'de',
          permissions: [],
          model_name: 'User',
          room_limit: -1
        }
      }
    });

    await view.vm.handleLogin({
      id: 'ldap',
      data: {
        username: 'user',
        password: 'password'
      }
    });

    expect(flashMessageSpy).toBeCalledTimes(1);
    expect(flashMessageSpy).toBeCalledWith('auth.flash.login');

    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith('/redirect_path');

    view.destroy();
  });

  it('redirect to room overview if redirect query not set', async () => {
    const flashMessageSpy = vi.fn();
    const flashMessage = { success: flashMessageSpy };

    const router = new VueRouter({ mode: 'abstract' });
    const routerSpy = vi.spyOn(router, 'push').mockImplementation(() => {});

    const view = mount(Login, {
      localVue,
      pinia: createTestingPinia({ stubActions: false }),
      mocks: {
        $t: (key) => key,
        flashMessage: flashMessage
      },
      router
    });

    moxios.stubRequest('/sanctum/csrf-cookie', {
      status: 200
    });
    moxios.stubRequest('/api/v1/login/ldap', {
      status: 204
    });
    moxios.stubRequest('/api/v1/currentUser', {
      status: 200,
      response: {
        data: {
          id: 1,
          authenticator: 'ldap',
          email: 'john.doe@domain.tld',
          username: 'user',
          firstname: 'John',
          lastname: 'Doe',
          user_locale: 'de',
          permissions: [],
          model_name: 'User',
          room_limit: -1
        }
      }
    });

    await view.vm.handleLogin({
      id: 'ldap',
      data: {
        username: 'user',
        password: 'password'
      }
    });

    expect(flashMessageSpy).toBeCalledTimes(1);
    expect(flashMessageSpy).toBeCalledWith('auth.flash.login');
    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'rooms.own_index' });

    view.destroy();
  });

  it('unprocessable entity errors gets displayed for the corresponding fields', async () => {
    const view = mount(Login, {
      localVue,
      pinia: createTestingPinia({ stubActions: false }),
      mocks: {
        $t: (key) => key
      }
    });

    const emailLoginComponent = view.findComponent(EmailLoginComponent);
    await emailLoginComponent.find('#defaultEmail').setValue('user');
    await emailLoginComponent.find('#defaultPassword').setValue('password');
    await emailLoginComponent.findComponent(BButton).trigger('submit');

    expect(emailLoginComponent.findComponent(BSpinner).exists()).toBe(true);

    await waitMoxios();
    let request = moxios.requests.mostRecent();

    expect(request.config.url).toBe('/sanctum/csrf-cookie');

    document.cookie = 'XSRF-TOKEN=test-csrf';
    await request.respondWith({
      status: 200
    });

    await waitMoxios();
    request = moxios.requests.mostRecent();

    expect(request.headers['X-XSRF-TOKEN']).toBe('test-csrf');
    expect(request.config.url).toBe('/api/v1/login');

    const data = JSON.parse(request.config.data);
    expect(data.email).toBe('user');
    expect(data.password).toBe('password');

    await request.respondWith({
      status: env.HTTP_UNPROCESSABLE_ENTITY,
      response: {
        errors: {
          email: ['Password or Email wrong!']
        }
      }
    });

    const invalidFeedback = emailLoginComponent.findComponent(BFormInvalidFeedback);

    expect(invalidFeedback.exists()).toBe(true);
    expect(invalidFeedback.html()).toContain('Password or Email wrong!');

    view.destroy();
  });

  it('error for too many login requests gets displayed', async () => {
    const view = mount(Login, {
      localVue,
      pinia: createTestingPinia({ stubActions: false }),
      mocks: {
        $t: (key) => key
      }
    });

    const emailLoginComponent = view.findComponent(EmailLoginComponent);
    await emailLoginComponent.find('#defaultEmail').setValue('user');
    await emailLoginComponent.find('#defaultPassword').setValue('password');
    await emailLoginComponent.findComponent(BButton).trigger('submit');

    expect(emailLoginComponent.findComponent(BSpinner).exists()).toBe(true);

    await waitMoxios();
    let request = moxios.requests.mostRecent();

    expect(request.config.url).toBe('/sanctum/csrf-cookie');

    document.cookie = 'XSRF-TOKEN=test-csrf';
    await request.respondWith({
      status: 200
    });

    await waitMoxios();
    request = moxios.requests.mostRecent();

    expect(request.headers['X-XSRF-TOKEN']).toBe('test-csrf');
    expect(request.config.url).toBe('/api/v1/login');

    const data = JSON.parse(request.config.data);
    expect(data.email).toBe('user');
    expect(data.password).toBe('password');

    await request.respondWith({
      status: env.HTTP_TOO_MANY_REQUESTS,
      response: {
        errors: {
          email: ['Too many logins. Please try again later!']
        }
      }
    });
    const invalidFeedback = emailLoginComponent.findComponent(BFormInvalidFeedback);

    expect(invalidFeedback.exists()).toBe(true);
    expect(invalidFeedback.html()).toContain('Too many logins. Please try again later!');

    view.destroy();
  });

  it('other api errors gets thrown and handled by the global error handler', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const view = mount(Login, {
      localVue,
      pinia: createTestingPinia({ stubActions: false }),
      mocks: {
        $t: (key) => key
      }
    });

    const emailLoginComponent = view.findComponent(EmailLoginComponent);
    await emailLoginComponent.find('#defaultEmail').setValue('user');
    await emailLoginComponent.find('#defaultPassword').setValue('password');
    await emailLoginComponent.findComponent(BButton).trigger('submit');

    expect(emailLoginComponent.findComponent(BSpinner).exists()).toBe(true);

    await waitMoxios();
    const request = moxios.requests.mostRecent();

    expect(request.config.url).toBe('/sanctum/csrf-cookie');

    await request.respondWith({
      status: 500
    });
    expect(spy).toBeCalledTimes(1);

    view.destroy();
  });
});
