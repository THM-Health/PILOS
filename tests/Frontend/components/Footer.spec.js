import { createLocalVue, mount } from '@vue/test-utils';
import FooterComponent from '../../../resources/js/components/FooterComponent';
import moxios from 'moxios';
import _ from 'lodash';
import VueRouter from 'vue-router';
import Vuex from 'vuex';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(VueRouter);
localVue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    session: {
      namespaced: true,
      getters: {
        settings: () => (setting) => setting === 'legal_notice_url' ? 'legal_notice_url' : 'https:/localhost'
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
  });

  it('footer test with two urls', function () {
    const view = mount(FooterComponent, {
      localVue,
      store
    });
    const footer = view.findComponent({ref: 'url_footer'});
    expect((footer).exists()).toBe(true);
    //console.log(store.getters['session/settings']);
  });

  it('footer test with one url', function () {

  });

  it('footer test with no urls', function () {

  });
});
