import ForgotPassword from '@/views/ForgotPassword.vue';
import { mount } from '@vue/test-utils';

import BootstrapVue, { BButton, BFormInput } from 'bootstrap-vue';
import VueRouter from 'vue-router';
import Base from '@/api/base';
import { mockAxios, createLocalVue } from '../helper';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(VueRouter);

describe('ForgotPassword', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it('submit handles errors correctly', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    mockAxios.request('/sanctum/csrf-cookie').respondWith({
      status: 200
    });

    const request = mockAxios.request('/api/v1/password/email');

    const view = mount(ForgotPassword, {
      localVue,
      mocks: {
        $t: (key) => key
      }
    });

    await view.findComponent(BFormInput).setValue('foo@bar.com');
    await view.findComponent(BButton).trigger('submit');
    await request.wait();
    await request.respondWith({
      status: 500,
      data: {
        message: 'Internal server error'
      }
    });
    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0][0].response.status).toEqual(500);

    view.destroy();
  });

  it('submit redirects to home page withe a success message on success', async () => {
    const router = new VueRouter();
    const routerSpy = vi.spyOn(router, 'push').mockImplementation(() => {});

    const toastSuccessSpy = vi.fn();

    const view = mount(ForgotPassword, {
      localVue,
      mocks: {
        $t: (key) => key,
        toastSuccess: toastSuccessSpy
      },
      router
    });

    const csrfRequest = mockAxios.request('/sanctum/csrf-cookie');
    const request = mockAxios.request('/api/v1/password/email');

    await view.findComponent(BFormInput).setValue('foo@bar.com');
    await view.findComponent(BButton).trigger('submit');
    await csrfRequest.wait();

    document.cookie = 'XSRF-TOKEN=test-csrf';

    await csrfRequest.respondWith({
      status: 200
    });

    await request.wait();
    expect(request.config.headers['X-XSRF-TOKEN']).toBe('test-csrf');
    await request.respondWith({
      status: 200,
      data: {
        message: 'Success!'
      }
    });

    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'home' });

    expect(toastSuccessSpy).toBeCalledTimes(1);
    expect(toastSuccessSpy).toBeCalledWith('Success!');

    view.destroy();
  });
});
