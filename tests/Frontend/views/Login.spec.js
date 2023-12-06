import { mount } from '@vue/test-utils';
import BootstrapVue, { BButton, BFormInvalidFeedback, BSpinner } from 'bootstrap-vue';

import Login from '@/views/Login.vue';
import ExternalLoginComponent from '@/components/Login/ExternalLoginComponent.vue';
import LocalLoginComponent from '@/components/Login/LocalLoginComponent.vue';
import LdapLoginComponent from '@/components/Login/LdapLoginComponent.vue';
import env from '@/env';
import Base from '@/api/base';
import VueRouter from 'vue-router';
import { mockAxios, createLocalVue } from '../helper';
import { createTestingPinia } from '@pinia/testing';
import { PiniaVuePlugin } from 'pinia';
import { expect } from 'vitest';

const localVue = createLocalVue();
localVue.use(VueRouter);
localVue.use(BootstrapVue);
localVue.use(PiniaVuePlugin);

describe('Login', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it('correct data gets sent on ldap login', async () => {
    const view = mount(Login, {
      localVue,
      pinia: createTestingPinia({ initialState: { settings: { settings: { auth: { ldap: true } } } }, stubActions: false }),
      mocks: {
        $t: (key) => key
      }
    });

    const csrfRequest = mockAxios.request('/sanctum/csrf-cookie');

    const ldapLoginComponent = view.findComponent(LdapLoginComponent);
    await ldapLoginComponent.find('#ldapUsername').setValue('user');
    await ldapLoginComponent.find('#ldapPassword').setValue('password');
    await ldapLoginComponent.findComponent(BButton).trigger('submit');
    expect(ldapLoginComponent.findComponent(BSpinner).exists()).toBe(true);

    await csrfRequest.wait();

    const loginRequest = mockAxios.request('/api/v1/login/ldap');

    document.cookie = 'XSRF-TOKEN=test-csrf';

    await csrfRequest.respondWith({
      status: 200
    });

    await loginRequest.wait();

    expect(loginRequest.config.headers['X-XSRF-TOKEN']).toBe('test-csrf');

    const data = JSON.parse(loginRequest.config.data);
    expect(data.username).toBe('user');
    expect(data.password).toBe('password');
    view.destroy();
  });

  it('hide ldap login if disabled', () => {
    const view = mount(Login, {
      localVue,
      pinia: createTestingPinia({ initialState: { settings: { settings: { auth: { ldap: false } } } }, stubActions: false }),
      mocks: {
        $t: (key) => key
      }
    });

    const ldapLoginComponent = view.findComponent(LdapLoginComponent);
    expect(ldapLoginComponent.exists()).toBeFalsy();
    view.destroy();
  });

  it('hide local login if disabled', () => {
    const view = mount(Login, {
      localVue,
      pinia: createTestingPinia({ initialState: { settings: { settings: { auth: { local: false } } } }, stubActions: false }),
      mocks: {
        $t: (key) => key
      }
    });

    const localLoginComponent = view.findComponent(LocalLoginComponent);
    expect(localLoginComponent.exists()).toBeFalsy();
    view.destroy();
  });

  it('correct data gets sent on email login', async () => {
    const view = mount(Login, {
      localVue,
      pinia: createTestingPinia({ initialState: { settings: { settings: { auth: { local: true } } } }, stubActions: false }),
      mocks: {
        $t: (key) => key
      }
    });

    const csrfRequest = mockAxios.request('/sanctum/csrf-cookie');

    const localLoginComponent = view.findComponent(LocalLoginComponent);
    await localLoginComponent.find('#localEmail').setValue('user');
    await localLoginComponent.find('#localPassword').setValue('password');
    await localLoginComponent.findComponent(BButton).trigger('submit');
    expect(localLoginComponent.findComponent(BSpinner).exists()).toBe(true);

    await csrfRequest.wait();

    const loginRequest = mockAxios.request('/api/v1/login/local');

    document.cookie = 'XSRF-TOKEN=test-csrf';

    await csrfRequest.respondWith({
      status: 200
    });

    await loginRequest.wait();
    expect(loginRequest.config.headers['X-XSRF-TOKEN']).toBe('test-csrf');
    const data = JSON.parse(loginRequest.config.data);
    expect(data.email).toBe('user');
    expect(data.password).toBe('password');

    view.destroy();
  });

  it('redirect if query set', async () => {
    const toastSuccessSpy = vi.fn();

    const router = new VueRouter({ mode: 'abstract' });
    await router.push('/foo?redirect=%2Fredirect_path');
    const routerSpy = vi.spyOn(router, 'push').mockImplementation(() => {});

    const view = mount(Login, {
      localVue,
      pinia: createTestingPinia({ stubActions: false }),
      mocks: {
        $t: (key) => key,
        toastSuccess: toastSuccessSpy
      },
      router
    });

    mockAxios.request('/sanctum/csrf-cookie').respondWith({
      status: 200
    });
    mockAxios.request('/api/v1/login/ldap').respondWith({
      status: 204
    });
    mockAxios.request('/api/v1/currentUser').respondWith({
      status: 200,
      data: {
        data: {
          id: 1,
          authenticator: 'ldap',
          email: 'john.doe@domain.tld',
          external_id: 'user',
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

    expect(toastSuccessSpy).toBeCalledTimes(1);
    expect(toastSuccessSpy).toBeCalledWith('auth.flash.login');

    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith('/redirect_path');

    view.destroy();
  });

  it('redirect to room overview if redirect query not set', async () => {
    const toastSuccessSpy = vi.fn();

    const router = new VueRouter({ mode: 'abstract' });
    const routerSpy = vi.spyOn(router, 'push').mockImplementation(() => {});

    const view = mount(Login, {
      localVue,
      pinia: createTestingPinia({ stubActions: false }),
      mocks: {
        $t: (key) => key,
        toastSuccess: toastSuccessSpy
      },
      router
    });

    mockAxios.request('/sanctum/csrf-cookie').respondWith({
      status: 200
    });
    mockAxios.request('/api/v1/login/ldap').respondWith({
      status: 204
    });
    mockAxios.request('/api/v1/currentUser').respondWith({
      status: 200,
      data: {
        data: {
          id: 1,
          authenticator: 'ldap',
          email: 'john.doe@domain.tld',
          external_id: 'user',
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

    expect(toastSuccessSpy).toBeCalledTimes(1);
    expect(toastSuccessSpy).toBeCalledWith('auth.flash.login');
    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'rooms.index' });

    view.destroy();
  });

  it('unprocessable entity errors gets displayed for the corresponding fields', async () => {
    const view = mount(Login, {
      localVue,
      pinia: createTestingPinia({ initialState: { settings: { settings: { auth: { local: true } } } }, stubActions: false }),
      mocks: {
        $t: (key) => key
      }
    });

    const csrfRequest = mockAxios.request('/sanctum/csrf-cookie');

    const localLoginComponent = view.findComponent(LocalLoginComponent);
    await localLoginComponent.find('#localEmail').setValue('user');
    await localLoginComponent.find('#localPassword').setValue('password');
    await localLoginComponent.findComponent(BButton).trigger('submit');

    expect(localLoginComponent.findComponent(BSpinner).exists()).toBe(true);

    await csrfRequest.wait();

    const loginRequest = mockAxios.request('/api/v1/login/local');

    document.cookie = 'XSRF-TOKEN=test-csrf';

    await csrfRequest.respondWith({
      status: 200
    });

    await loginRequest.wait();
    expect(loginRequest.config.headers['X-XSRF-TOKEN']).toBe('test-csrf');

    const data = JSON.parse(loginRequest.config.data);
    expect(data.email).toBe('user');
    expect(data.password).toBe('password');

    await loginRequest.respondWith({
      status: env.HTTP_UNPROCESSABLE_ENTITY,
      data: {
        errors: {
          email: ['Password or Email wrong!']
        }
      }
    });

    const invalidFeedback = localLoginComponent.findComponent(BFormInvalidFeedback);

    expect(invalidFeedback.exists()).toBe(true);
    expect(invalidFeedback.html()).toContain('Password or Email wrong!');

    view.destroy();
  });

  it('error for too many login requests gets displayed', async () => {
    const view = mount(Login, {
      localVue,
      pinia: createTestingPinia({ initialState: { settings: { settings: { auth: { local: true } } } }, stubActions: false }),
      mocks: {
        $t: (key) => key
      }
    });

    const csrfRequest = mockAxios.request('/sanctum/csrf-cookie');

    const localLoginComponent = view.findComponent(LocalLoginComponent);
    await localLoginComponent.find('#localEmail').setValue('user');
    await localLoginComponent.find('#localPassword').setValue('password');
    await localLoginComponent.findComponent(BButton).trigger('submit');

    expect(localLoginComponent.findComponent(BSpinner).exists()).toBe(true);

    await csrfRequest.wait();

    const loginRequest = mockAxios.request('/api/v1/login/local');

    document.cookie = 'XSRF-TOKEN=test-csrf';

    await csrfRequest.respondWith({
      status: 200
    });

    await loginRequest.wait();
    expect(loginRequest.config.headers['X-XSRF-TOKEN']).toBe('test-csrf');

    const data = JSON.parse(loginRequest.config.data);
    expect(data.email).toBe('user');
    expect(data.password).toBe('password');

    await loginRequest.respondWith({
      status: env.HTTP_TOO_MANY_REQUESTS,
      data: {
        errors: {
          email: ['Too many logins. Please try again later!']
        }
      }
    });
    const invalidFeedback = localLoginComponent.findComponent(BFormInvalidFeedback);

    expect(invalidFeedback.exists()).toBe(true);
    expect(invalidFeedback.html()).toContain('Too many logins. Please try again later!');

    view.destroy();
  });

  it('other api errors gets thrown and handled by the global error handler', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const view = mount(Login, {
      localVue,
      pinia: createTestingPinia({ initialState: { settings: { settings: { auth: { local: true } } } }, stubActions: false }),
      mocks: {
        $t: (key) => key
      }
    });

    const csrfRequest = mockAxios.request('/sanctum/csrf-cookie');

    const localLoginComponent = view.findComponent(LocalLoginComponent);
    await localLoginComponent.find('#localEmail').setValue('user');
    await localLoginComponent.find('#localPassword').setValue('password');
    await localLoginComponent.findComponent(BButton).trigger('submit');

    expect(localLoginComponent.findComponent(BSpinner).exists()).toBe(true);

    await csrfRequest.wait();

    await csrfRequest.respondWith({
      status: 500
    });
    expect(spy).toBeCalledTimes(1);

    view.destroy();
  });

  it('hide shibboleth login if disabled', () => {
    const view = mount(Login, {
      localVue,
      pinia: createTestingPinia({ initialState: { settings: { settings: { auth: { shibboleth: false } } } }, stubActions: false }),
      mocks: {
        $t: (key) => key
      }
    });

    const externalLoginComponent = view.findComponent(ExternalLoginComponent);
    expect(externalLoginComponent.exists()).toBeFalsy();
    view.destroy();
  });

  it('shibboleth login', async () => {
    const router = new VueRouter({ mode: 'abstract' });
    await router.push('/foo');

    const view = mount(Login, {
      localVue,
      pinia: createTestingPinia({ initialState: { settings: { settings: { auth: { shibboleth: true } } } }, stubActions: false }),
      mocks: {
        $t: (key) => key
      },
      router
    });

    const externalLoginComponent = view.findComponent(ExternalLoginComponent);
    expect(externalLoginComponent.exists()).toBeTruthy();

    const externalLoginButton = externalLoginComponent.findComponent(BButton);
    expect(externalLoginButton.exists()).toBeTruthy();
    expect(externalLoginButton.attributes('href')).toBe('/auth/shibboleth/redirect');

    view.destroy();
  });

  it('shibboleth login with redirect path', async () => {
    const router = new VueRouter({ mode: 'abstract' });
    await router.push('/foo?redirect=%2Fredirect_path');

    const view = mount(Login, {
      localVue,
      pinia: createTestingPinia({ initialState: { settings: { settings: { auth: { shibboleth: true } } } }, stubActions: false }),
      mocks: {
        $t: (key) => key
      },
      router
    });

    const externalLoginComponent = view.findComponent(ExternalLoginComponent);
    expect(externalLoginComponent.exists()).toBeTruthy();

    const externalLoginButton = externalLoginComponent.findComponent(BButton);
    expect(externalLoginButton.exists()).toBeTruthy();
    expect(externalLoginButton.attributes('href')).toBe('/auth/shibboleth/redirect?redirect=%2Fredirect_path');

    view.destroy();
  });
});
