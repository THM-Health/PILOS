import { createLocalVue, mount } from '@vue/test-utils';
import LocaleSelector from '../../../resources/js/components/LocaleSelector.vue';
import BootstrapVue, { BFormInvalidFeedback, BDropdownItem } from 'bootstrap-vue';
import store from '../../../resources/js/store';
import moxios from 'moxios';
import Base from '../../../resources/js/api/base';
import { waitMoxios, localVue } from '../helper';

describe('LocaleSelector', () => {
  beforeEach(() => {
    LocaleSelector.__Rewire__('LocaleMap', {
      de: 'German',
      en: 'English',
      ru: 'Russian'
    });
    moxios.install();
  });

  afterEach(() => {
    LocaleSelector.__ResetDependency__('LocaleMap');
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
      store
    });

    const dropdownItems = wrapper.findAllComponents(BDropdownItem);
    expect(dropdownItems.length).toBe(2);
    expect(dropdownItems.filter(w => w.text() === 'English').length).toBe(0);
    expect(dropdownItems.filter(w => w.text() === 'Russian').length).toBe(1);
    expect(dropdownItems.filter(w => w.text() === 'German').length).toBe(1);

    wrapper.destroy();
  });

  it('the `currentLocale` should be active in the dropdown', async () => {
    store.commit('session/setCurrentLocale', 'ru');
    const wrapper = mount(LocaleSelector, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        availableLocales: ['de', 'ru']
      },
      store
    });

    const activeItems = wrapper.findAllComponents(BDropdownItem).filter(item => item.props().active);
    expect(activeItems.length).toBe(1);
    expect(activeItems.at(0).text()).toBe('Russian');

    wrapper.destroy();
  });

  it('shows an corresponding error message and doesn\'t change the language on 422', async () => {
    store.commit('session/setCurrentLocale', 'ru');
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
      store
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

    expect(flashMessageSpy).toBeCalledTimes(1);
    expect(flashMessageSpy).toBeCalledWith('Test');

    wrapper.destroy();
  });

  it('calls global error handler on other errors than 422 and finishes loading', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation( () => {} );

    store.commit('session/setCurrentLocale', 'ru');
    const wrapper = mount(LocaleSelector, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        availableLocales: ['de', 'ru']
      },
      store
    });
    moxios.stubRequest('/api/v1/setLocale', {
      status: 500,
      response: {
        message: 'Test'
      }
    });

    const items = wrapper.findAllComponents(BDropdownItem);
    let activeItems = items.filter(item => item.props().active);
    expect(activeItems.length).toBe(1);
    expect(activeItems.at(0).text()).toBe('Russian');
    expect(wrapper.findAllComponents(BFormInvalidFeedback).length).toBe(0);

    items.filter(item => item !== activeItems.at(0)).at(0).get('a').trigger('click');

    expect(store.state.loadingCounter).toEqual(1);

    await waitMoxios();

    activeItems = wrapper.findAllComponents(BDropdownItem).filter(item => item.props().active);
    expect(activeItems.length).toBe(1);
    expect(activeItems.at(0).text()).toBe('Russian');
    expect(wrapper.findAllComponents(BFormInvalidFeedback).length).toBe(0);
    expect(store.state.loadingCounter).toEqual(0);

    expect(spy).toBeCalledTimes(1);

    wrapper.destroy();
  });

  it('changes to the selected language successfully', async () => {
    store.commit('session/setCurrentLocale', 'ru');
    const wrapper = mount(LocaleSelector, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        availableLocales: ['de', 'ru']
      },
      store
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
