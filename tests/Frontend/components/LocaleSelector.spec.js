import { mount } from '@vue/test-utils';
import LocaleSelector from '../../../resources/js/components/LocaleSelector.vue';
import BootstrapVue, { BFormInvalidFeedback, BDropdownItem } from 'bootstrap-vue';
import moxios from 'moxios';
import Base from '../../../resources/js/api/base';
import { createLocalVue, waitMoxios } from '../helper';
import { createTestingPinia } from '@pinia/testing';
import { PiniaVuePlugin } from 'pinia';
import { useLoadingStore } from '../../../resources/js/stores/loading';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(PiniaVuePlugin);

describe('LocaleSelector', () => {
  beforeEach(() => {
    vi.mock('@/lang/LocaleMap', () => {
      return {
        default: {
          de: 'German',
          en: 'English',
          ru: 'Russian'
        }
      };
    });

    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it('validates `availableLocales` correctly', async () => {
    const availableLocales = LocaleSelector.props.availableLocales;

    expect(availableLocales.type).toEqual(Array);
    expect(availableLocales.required).toBe(true);
    expect(availableLocales.validator).toBeInstanceOf(Function);
    expect(availableLocales.validator([1, 2, 3])).toBeFalsy();
    expect(availableLocales.validator(['de', 'en', 'ru'])).toBeTruthy();
    expect(availableLocales.validator(['pl', 'es'])).toBeFalsy();
    expect(availableLocales.validator(['a', 'b'])).toBeFalsy();
    expect(availableLocales.validator([{ foo: 'bar' }])).toBeFalsy();
  });

  it('only locales specified in `availableLocales` property gets rendered', async () => {
    const wrapper = mount(LocaleSelector, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        availableLocales: ['de', 'ru']
      },
      pinia: createTestingPinia()
    });

    const dropdownItems = wrapper.findAllComponents(BDropdownItem);
    expect(dropdownItems.length).toBe(2);
    expect(dropdownItems.filter(w => w.text() === 'English').length).toBe(0);
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
      propsData: {
        availableLocales: ['de', 'ru']
      },
      pinia: createTestingPinia({ initialState: { locale: { currentLocale: 'ru' } } })
    });

    const activeItems = wrapper.findAllComponents(BDropdownItem).filter(item => item.props().active);
    expect(activeItems.length).toBe(1);
    expect(activeItems.at(0).text()).toBe('Russian');

    wrapper.destroy();
  });

  it('shows an corresponding error message and doesn\'t change the language on 422', async () => {
    const flashMessageSpy = vi.fn();
    const flashMessage = { error: flashMessageSpy };

    const wrapper = mount(LocaleSelector, {
      localVue,
      mocks: {
        $t: (key) => key,
        flashMessage: flashMessage
      },
      propsData: {
        availableLocales: ['de', 'ru']
      },
      pinia: createTestingPinia({ initialState: { locale: { currentLocale: 'ru' } }, stubActions: false })
    });

    moxios.stubRequest('/api/v1/setLocale', {
      status: 422,
      response: {
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

    await waitMoxios();

    activeItems = wrapper.findAllComponents(BDropdownItem).filter(item => item.props().active);
    expect(activeItems.length).toBe(1);
    expect(activeItems.at(0).text()).toBe('Russian');

    expect(flashMessageSpy).toHaveBeenCalledTimes(1);
    expect(flashMessageSpy).toHaveBeenCalledWith('Test');

    wrapper.destroy();
  });

  it('calls global error handler on other errors than 422 and finishes loading', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const wrapper = mount(LocaleSelector, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        availableLocales: ['de', 'ru']
      },
      pinia: createTestingPinia({ initialState: { locale: { currentLocale: 'ru' } }, stubActions: false })
    });

    moxios.stubRequest('/api/v1/setLocale', {
      status: 500,
      response: {
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

    expect(loadingStore.loadingCounter).toEqual(1);

    await waitMoxios();

    activeItems = wrapper.findAllComponents(BDropdownItem).filter(item => item.props().active);
    expect(activeItems.length).toBe(1);
    expect(activeItems.at(0).text()).toBe('Russian');
    expect(wrapper.findAllComponents(BFormInvalidFeedback).length).toBe(0);
    expect(loadingStore.loadingCounter).toEqual(0);

    expect(spy).toHaveBeenCalledTimes(1);

    wrapper.destroy();
  });

  it('changes to the selected language successfully', async () => {
    const wrapper = mount(LocaleSelector, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        availableLocales: ['de', 'ru']
      },
      pinia: createTestingPinia({ initialState: { locale: { currentLocale: 'ru' } }, stubActions: false })
    });

    moxios.stubRequest('/api/v1/setLocale', {
      status: 200
    });
    moxios.stubRequest('/api/v1/currentUser', {
      status: 200,
      response: {
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

    await waitMoxios();

    activeItems = wrapper.findAllComponents(BDropdownItem).filter(item => item.props().active);
    expect(activeItems.length).toBe(1);
    expect(activeItems.at(0).text()).toBe('German');

    wrapper.destroy();
  });
});
