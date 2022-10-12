import { createLocalVue, mount } from '@vue/test-utils';
import FooterComponent from '../../../resources/js/components/FooterComponent';
import moxios from 'moxios';
import _ from 'lodash';
import VueRouter from 'vue-router';
import Vuex from 'vuex';
import { BootstrapVue } from 'bootstrap-vue';
import RawText from '../../../resources/js/components/RawText';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(VueRouter);
localVue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    session: {
      namespaced: true,
      state: { settings: null },
      getters: {
        settings: (state) => (setting) => {
          return _.isEmpty(state.settings) ? undefined : _.get(state.settings, setting);
        }
      },
      mutations: {
        setSettings (state, settings) {
          state.settings = settings;
        }
      }
    }
  }
});

describe('Footer Component', () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
    return store.commit('session/setSettings', { });
  });

  it('footer test with two urls', async () => {
    const view = mount(FooterComponent, {
      localVue,
      store,
      mocks: {
        $t: (key) => key
      }
    });

    // set URLs for testing
    await store.commit('session/setSettings', {
      legal_notice_url: 'https://legal.org',
      privacy_policy_url: 'https://privacy.org'
    });

    // test if footer exists
    const footer = view.findComponent({ ref: 'url_footer' });
    expect((footer).exists()).toBe(true);

    // test if text and | is shown and if correct links are inserted
    const links = footer.findAll('a');
    expect(links.length).toBe(2);
    expect(links.at(0).text()).toBe('app.footer.legalNotice');
    expect(links.at(0).attributes('href')).toBe('https://legal.org');
    expect(links.at(1).text()).toBe('app.footer.privacyPolicy');
    expect(links.at(1).attributes('href')).toBe('https://privacy.org');
    expect(view.findComponent(RawText).exists()).toBeTruthy();
  });

  it('footer test with only legal notice', async () => {
    const view = mount(FooterComponent, {
      localVue,
      store,
      mocks: {
        $t: (key) => key
      }
    });

    // set URLs for testing
    await store.commit('session/setSettings', {
      legal_notice_url: 'https://legal.org'
    });

    // test if footer exists
    const footer = view.findComponent({ ref: 'url_footer' });
    expect((footer).exists()).toBe(true);

    // test if text and no | is shown and if correct links is inserted
    const links = footer.findAll('a');
    expect(links.length).toBe(1);
    expect(links.at(0).text()).toBe('app.footer.legalNotice');
    expect(links.at(0).attributes('href')).toBe('https://legal.org');
    expect(view.findComponent(RawText).exists()).toBeFalsy();
  });

  it('footer test with only privacy policy', async () => {
    const view = mount(FooterComponent, {
      localVue,
      store,
      mocks: {
        $t: (key) => key
      }
    });

    // set URLs for testing
    await store.commit('session/setSettings', {
      privacy_policy_url: 'https://privacy.org'
    });

    // test if footer exists
    const footer = view.findComponent({ ref: 'url_footer' });
    expect((footer).exists()).toBe(true);

    // test if text and no | is shown and if correct links is inserted
    const links = footer.findAll('a');
    expect(links.length).toBe(1);
    expect(links.at(0).text()).toBe('app.footer.privacyPolicy');
    expect(links.at(0).attributes('href')).toBe('https://privacy.org');
    expect(view.findComponent(RawText).exists()).toBeFalsy();
  });

  it('footer test with no urls', function () {
    const view = mount(FooterComponent, {
      localVue,
      store,
      mocks: {
        $t: (key) => key
      }
    });

    // test if no footer exists
    const footer = view.findComponent({ ref: 'url_footer' });
    expect((footer).exists()).toBe(false);
  });
});
