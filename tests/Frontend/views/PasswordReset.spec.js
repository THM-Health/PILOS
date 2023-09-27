import { mount } from '@vue/test-utils';
import BootstrapVue, { BButton, BFormInput, BFormInvalidFeedback } from 'bootstrap-vue';
import VueRouter from 'vue-router';
import PasswordReset from '../../../resources/js/views/PasswordReset.vue';
import Base from '../../../resources/js/api/base';
import env from '../../../resources/js/env';
import { mockAxios, createLocalVue } from '../helper';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { useLocaleStore } from '../../../resources/js/stores/locale';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(PiniaVuePlugin);
localVue.use(VueRouter);

describe('PasswordReset', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it('submit handles errors correctly', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    mockAxios.request('/sanctum/csrf-cookie').respondWith({
      status: 200
    });
    let request = mockAxios.request('/api/v1/password/reset');

    const view = mount(PasswordReset, {
      localVue,
      mocks: {
        $t: (key) => key
      }
    });

    view.findComponent(BButton).trigger('submit');
    await request.wait();
    await request.respondWith({
      status: env.HTTP_UNPROCESSABLE_ENTITY,
      data: {
        errors: {
          password: ['Error Password'],
          password_confirmation: ['Error Password Confirmation'],
          email: ['Error Email'],
          token: ['Error Token']
        }
      }
    });
    const feedBacks = view.findAllComponents(BFormInvalidFeedback);
    expect(feedBacks.at(0).html()).toContain('Error Password');
    expect(feedBacks.at(1).html()).toContain('Error Password Confirmation');
    expect(feedBacks.at(2).html()).toContain('Error Email');
    expect(feedBacks.at(3).html()).toContain('Error Token');

    mockAxios.request('/sanctum/csrf-cookie').respondWith({
      status: 200
    });
    request = mockAxios.request('/api/v1/password/reset');

    view.findComponent(BButton).trigger('submit');
    await request.wait();
    await request.respondWith({
      status: 500,
      data: {
        message: 'Internal server error'
      }
    });

    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0][0].response.status).toEqual(500);
  });

  it('submit loads the current user after login and changes the application language to the corresponding one', async () => {
    const router = new VueRouter();
    const routerSpy = vi.spyOn(router, 'push').mockImplementation(() => {});

    const toastSuccessSpy = vi.fn();

    const csrfRequest = mockAxios.request('/sanctum/csrf-cookie');
    const request = mockAxios.request('/api/v1/password/reset');

    const view = mount(PasswordReset, {
      localVue,
      mocks: {
        $t: (key) => key,
        toastSuccess: toastSuccessSpy
      },
      router,
      pinia: createTestingPinia({ stubActions: false }),
      propsData: {
        email: 'foo@bar.com',
        token: 'Test123'
      }
    });

    const localeStore = useLocaleStore();

    const inputs = view.findAllComponents(BFormInput);
    await inputs.at(0).setValue('Test123');
    await inputs.at(1).setValue('Test123');
    await view.findComponent(BButton).trigger('submit');

    await csrfRequest.wait();

    document.cookie = 'XSRF-TOKEN=test-csrf';

    await csrfRequest.respondWith({
      status: 200
    });

    await request.wait();
    expect(request.config.headers['X-XSRF-TOKEN']).toBe('test-csrf');
    const data = JSON.parse(request.config.data);
    expect(data.email).toBe('foo@bar.com');
    expect(data.token).toBe('Test123');
    expect(data.password).toBe('Test123');
    expect(data.password_confirmation).toBe('Test123');

    const currentUserRequest = mockAxios.request('/api/v1/currentUser');

    await request.respondWith({
      status: 200,
      data: {
        message: 'Success!'
      }
    });

    expect(toastSuccessSpy).toBeCalledTimes(1);
    expect(toastSuccessSpy).toBeCalledWith('Success!');

    await currentUserRequest.wait();
    await currentUserRequest.respondWith({
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

    expect(localeStore.currentLocale).toEqual('de');

    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'home' });

    view.destroy();
  });
});
