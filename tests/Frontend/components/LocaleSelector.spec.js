import { createLocalVue, mount } from '@vue/test-utils';
import LocaleSelector from '../../../resources/js/components/LocaleSelector';
import BootstrapVue, { BFormInvalidFeedback, BDropdownItem } from 'bootstrap-vue';
import store from '../../../resources/js/store';
import moxios from 'moxios';

const localVue = createLocalVue();
localVue.use(BootstrapVue);

describe('LocaleSelector', function () {
  beforeEach(function () {
    LocaleSelector.__set__('LocaleMap', {
      de: 'German',
      en: 'English',
      ru: 'Russian'
    });
    moxios.install();
  });

  afterEach(function () {
    LocaleSelector.__ResetDependency__('LocaleMap');
    moxios.uninstall();
  });

  it('validates `availableLocales` correctly', function () {
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

  it('only locales specified in `availableLocales` property gets rendered', function () {
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
  });

  it('the `currentLocale` should be active in the dropdown', function () {
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
  });

  it('shows an corresponding error message and doesn\'t change the language on 422', function (done) {
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

    moxios.wait(() => {
      activeItems = wrapper.findAllComponents(BDropdownItem).filter(item => item.props().active);
      expect(activeItems.length).toBe(1);
      expect(activeItems.at(0).text()).toBe('Russian');

      const invalidFeedbackItems = wrapper.findAllComponents(BFormInvalidFeedback);
      expect(invalidFeedbackItems.length).toBe(1);
      expect(invalidFeedbackItems.at(0).text()).toBe('Test');

      done();
    });
  });

  it('changes to the selected language successfully', function (done) {
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

    items.filter(item => item !== activeItems.at(0)).at(0).get('a').trigger('click');

    moxios.wait(() => {
      activeItems = wrapper.findAllComponents(BDropdownItem).filter(item => item.props().active);
      expect(activeItems.length).toBe(1);
      expect(activeItems.at(0).text()).toBe('German');

      done();
    });
  });
});
