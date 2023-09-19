import { mount } from '@vue/test-utils';
import BootstrapVue, { BCard } from 'bootstrap-vue';

import ExternalLogin from '../../../resources/js/views/ExternalLogin.vue';
import VueRouter from 'vue-router';
import { mockAxios, createLocalVue } from '../helper';
import { PiniaVuePlugin } from 'pinia';
import { expect } from 'vitest';

const localVue = createLocalVue();
localVue.use(VueRouter);
localVue.use(BootstrapVue);
localVue.use(PiniaVuePlugin);

describe('ExternalLogin', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it('show login message and redirect to home page', async () => {
    const toastSuccessSpy = vi.fn();

    const router = new VueRouter({ mode: 'abstract' });
    await router.push('/foo');
    const routerSpy = vi.spyOn(router, 'push').mockImplementation(() => {});

    const view = mount(ExternalLogin, {
      localVue,
      mocks: {
        $t: (key) => key,
        toastSuccess: toastSuccessSpy
      },
      router
    });

    // Check if error messages are not shown
    expect(view.findComponent(BCard).exists()).toBe(false);

    // Check success message is shown
    expect(toastSuccessSpy).toBeCalledTimes(1);
    expect(toastSuccessSpy).toBeCalledWith('auth.flash.login');

    // Check user is redirected the home page
    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'rooms.own_index' });

    view.destroy();
  });

  it('show login message and redirect to other page', async () => {
    const toastSuccessSpy = vi.fn();

    const router = new VueRouter({ mode: 'abstract' });
    await router.push('/foo?redirect=%2Fredirect_path');
    const routerSpy = vi.spyOn(router, 'push').mockImplementation(() => {});

    const view = mount(ExternalLogin, {
      localVue,
      mocks: {
        $t: (key) => key,
        toastSuccess: toastSuccessSpy
      },
      router
    });

    // Check if error messages are not shown
    expect(view.findComponent(BCard).exists()).toBe(false);

    // Check success message is shown
    expect(toastSuccessSpy).toBeCalledTimes(1);
    expect(toastSuccessSpy).toBeCalledWith('auth.flash.login');

    // Check user is redirected to the correct page
    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith('/redirect_path');

    view.destroy();
  });

  it('show login message and redirect to other page', async () => {
    const toastSuccessSpy = vi.fn();

    const router = new VueRouter({ mode: 'abstract' });
    await router.push('/foo');
    const routerSpy = vi.spyOn(router, 'push').mockImplementation(() => {});

    const view = mount(ExternalLogin, {
      localVue,
      propsData: {
        error: 'missing_attributes'
      },
      mocks: {
        $t: (key) => key,
        toastSuccess: toastSuccessSpy
      },
      router
    });

    // Check error message is shown
    expect(view.findComponent(BCard).exists()).toBe(true);
    expect(view.text()).toContain('auth.error.missing_attributes');

    // Check that no redirect is done and no success message is shown
    expect(toastSuccessSpy).toBeCalledTimes(0);
    expect(routerSpy).toBeCalledTimes(0);

    view.destroy();
  });
});
