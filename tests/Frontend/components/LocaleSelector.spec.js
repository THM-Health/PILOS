import { mount } from '@vue/test-utils';
import LocaleSelector from '@/components/LocaleSelector.vue';
import BootstrapVue, { BFormInvalidFeedback, BDropdownItem } from 'bootstrap-vue';
import Base from '@/api/base';
import { createLocalVue, mockAxios } from '../helper';
import { createTestingPinia } from '@pinia/testing';
import { PiniaVuePlugin } from 'pinia';
import { useLoadingStore } from '@/stores/loading';
import { expect, vi } from 'vitest';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(PiniaVuePlugin);

describe('LocaleSelector', () => {
  beforeEach(() => {
    vi.mock('@/i18n.js', async () => {
      const mod = await import('@/i18n.js');
      return {
        ...mod,
        getLocaleList: () => {
          return {
            de: 'German',
            en: 'English',
            ru: 'Russian'
          };
        }
      };
    });

    mockAxios.reset();
  });

  it('all locales loaded in i18n gets rendered', async () => {
    vi.resetModules();
    const wrapper = mount(LocaleSelector, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia()
    });

    const dropdownItems = wrapper.findAllComponents(BDropdownItem);
    expect(dropdownItems.length).toBe(3);
    expect(dropdownItems.filter(w => w.text() === 'English').length).toBe(1);
    expect(dropdownItems.filter(w => w.text() === 'Russian').length).toBe(1);
    expect(dropdownItems.filter(w => w.text() === 'German').length).toBe(1);

    wrapper.destroy();
  });

  it('the `currentLocale` should be active in the dropdown', async () => {
    const wrapper = mount(LocaleSelector, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia({ initialState: { locale: { currentLocale: 'ru' } } })
    });

    const activeItems = wrapper.findAllComponents(BDropdownItem).filter(item => item.props().active);
    expect(activeItems.length).toBe(1);
    expect(activeItems.at(0).text()).toBe('Russian');

    wrapper.destroy();
  });

  it('shows an corresponding error message and doesn\'t change the language on 422', async () => {
    const toastErrorSpy = vi.fn();

    const wrapper = mount(LocaleSelector, {
      localVue,
      mocks: {
        $t: (key) => key,
        toastError: toastErrorSpy
      },
      pinia: createTestingPinia({ initialState: { locale: { currentLocale: 'ru' } }, stubActions: false })
    });

    mockAxios.request('/api/v1/locale').respondWith({
      status: 422,
      data: {
        errors: {
          locale: ['Test']
        }
      }
    });

    const items = wrapper.findAllComponents(BDropdownItem);
    let activeItems = items.filter(item => item.props().active);
    expect(activeItems.length).toBe(1);
    expect(activeItems.at(0).text()).toBe('Russian');
    expect(wrapper.findAllComponents(BFormInvalidFeedback).length).toBe(0);

    items.filter(item => item !== activeItems.at(0)).at(0).get('a').trigger('click');

    await mockAxios.wait();

    activeItems = wrapper.findAllComponents(BDropdownItem).filter(item => item.props().active);
    expect(activeItems.length).toBe(1);
    expect(activeItems.at(0).text()).toBe('Russian');

    expect(toastErrorSpy).toHaveBeenCalledTimes(1);
    expect(toastErrorSpy).toHaveBeenCalledWith('Test');

    wrapper.destroy();
  });

  it('calls global error handler on other errors than 422 and finishes loading', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const wrapper = mount(LocaleSelector, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia({ initialState: { locale: { currentLocale: 'ru' } }, stubActions: false })
    });

    mockAxios.request('/api/v1/locale').respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    const loadingStore = useLoadingStore();

    const items = wrapper.findAllComponents(BDropdownItem);
    let activeItems = items.filter(item => item.props().active);
    expect(activeItems.length).toBe(1);
    expect(activeItems.at(0).text()).toBe('Russian');
    expect(wrapper.findAllComponents(BFormInvalidFeedback).length).toBe(0);

    items.filter(item => item !== activeItems.at(0)).at(0).get('a').trigger('click');

    expect(loadingStore.overlayLoadingCounter).toEqual(1);

    await mockAxios.wait();

    activeItems = wrapper.findAllComponents(BDropdownItem).filter(item => item.props().active);
    expect(activeItems.length).toBe(1);
    expect(activeItems.at(0).text()).toBe('Russian');
    expect(wrapper.findAllComponents(BFormInvalidFeedback).length).toBe(0);
    expect(loadingStore.overlayLoadingCounter).toEqual(0);

    expect(spy).toHaveBeenCalledTimes(1);

    wrapper.destroy();
  });

  it('changes to the selected language successfully', async () => {
    const wrapper = mount(LocaleSelector, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia({ initialState: { locale: { currentLocale: 'ru' } }, stubActions: false })
    });

    mockAxios.request('/api/v1/locale').respondWith({
      status: 200
    });

    mockAxios.request('/api/v1/currentUser').respondWith({
      status: 200,
      data: {
        data: {
          data: null
        }
      }
    });

    const items = wrapper.findAllComponents(BDropdownItem);
    let activeItems = items.filter(item => item.props().active);
    expect(activeItems.length).toBe(1);
    expect(activeItems.at(0).text()).toBe('Russian');
    expect(wrapper.findAllComponents(BFormInvalidFeedback).length).toBe(0);

    await items.filter(item => item !== activeItems.at(0)).at(0).get('a').trigger('click');

    await mockAxios.wait();

    activeItems = wrapper.findAllComponents(BDropdownItem).filter(item => item.props().active);
    expect(activeItems.length).toBe(1);
    expect(activeItems.at(0).text()).toBe('German');

    wrapper.destroy();
  });
});
