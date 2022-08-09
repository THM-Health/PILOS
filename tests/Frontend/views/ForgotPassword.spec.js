import Vuex from 'vuex';
import store from '../../../resources/js/store';
import ForgotPassword from '../../../resources/js/views/ForgotPassword';
import { createLocalVue, mount } from '@vue/test-utils';
import moxios from 'moxios';
import BootstrapVue, { BButton, BFormInput } from 'bootstrap-vue';
import VueRouter from 'vue-router';
import Base from '../../../resources/js/api/base';
import { waitMoxios } from '../helper';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(Vuex);
localVue.use(VueRouter);

describe('ForgotPassword', () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it('before route enter redirects to the 404 page if the self reset is disabled', async () => {
    const oldState = store.state['session/settings'];
    store.commit('session/setSettings', { password_self_reset_enabled: false });

    const to = await new Promise((resolve) => {
      ForgotPassword.beforeRouteEnter({}, {}, (to) => {
        resolve(to);
      });
    });

    expect(to).toBe('/404');
    store.commit('session/setSettings', oldState);
  });

  it('before route enter continues to the view if the self reset is enabled', async () => {
    const oldState = store.state['session/settings'];
    store.commit('session/setSettings', { password_self_reset_enabled: true });

    const to = await new Promise((resolve) => {
      ForgotPassword.beforeRouteEnter({}, {}, (to) => {
        resolve(to);
      });
    });

    expect(to).toBe(undefined);
    store.commit('session/setSettings', oldState);
  });

  it('submit handles errors correctly', async () => {
    const spy = jest.spyOn(Base, 'error').mockImplementation();

    const view = mount(ForgotPassword, {
      localVue,
      mocks: {
        $t: (key) => key
      }
    });

    await view.findComponent(BFormInput).setValue('foo@bar.com');
    await view.findComponent(BButton).trigger('submit');
    await waitMoxios();
    await moxios.requests.mostRecent().respondWith({
      status: 500,
      response: {
        message: 'Internal server error'
      }
    });
    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0][0].response.status).toEqual(500);

    view.destroy();
  });

  it('submit redirects to home page withe a success message on success', async () => {
    const router = new VueRouter();
    const routerSpy = jest.spyOn(router, 'push').mockImplementation();

    const flashMessageSpy = jest.fn();
    const flashMessage = { success: flashMessageSpy };

    const view = mount(ForgotPassword, {
      localVue,
      mocks: {
        $t: (key) => key,
        flashMessage: flashMessage
      },
      router
    });

    await view.findComponent(BFormInput).setValue('foo@bar.com');
    await view.findComponent(BButton).trigger('submit');
    await waitMoxios();
    await moxios.requests.mostRecent().respondWith({
      status: 200
    });
    await waitMoxios();
    await moxios.requests.mostRecent().respondWith({
      status: 200,
      response: {
        message: 'Success!'
      }
    });

    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'home' });

    expect(flashMessageSpy).toBeCalledTimes(1);
    expect(flashMessageSpy).toBeCalledWith({ title: 'Success!' });

    view.destroy();
  });
});
