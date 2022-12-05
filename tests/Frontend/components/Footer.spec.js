import { createLocalVue, mount } from '@vue/test-utils';
import FooterComponent from '../../../resources/js/components/FooterComponent.vue';
import moxios from 'moxios';
import VueRouter from 'vue-router';
import { BootstrapVue } from 'bootstrap-vue';
import RawText from '../../../resources/js/components/RawText.vue';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { useSettingsStore } from '../../../resources/js/stores/settings';

localVue.use(VueRouter);
localVue.use(PiniaVuePlugin);

describe('Footer Component', () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it('footer test with two urls', async () => {
    const view = mount(FooterComponent, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: (key) => key
      }
    });

    const settings = useSettingsStore();
    settings.settings = {
      legal_notice_url: 'https://legal.org',
      privacy_policy_url: 'https://privacy.org'
    };

    await view.vm.$nextTick();

    // test if footer exists
    const footer = view.findComponent({ ref: 'url_footer' });
    expect((footer).exists()).toBe(true);

    // test if text and | is shown and if correct links are inserted
    const links = footer.findAll('a');
    expect(links.length).toBe(2);
    expect(links.at(0).text()).toBe('app.footer.legal_notice');
    expect(links.at(0).attributes('href')).toBe('https://legal.org');
    expect(links.at(1).text()).toBe('app.footer.privacy_policy');
    expect(links.at(1).attributes('href')).toBe('https://privacy.org');
    expect(view.findComponent(RawText).exists()).toBeTruthy();
  });

  it('footer test with only legal notice', async () => {
    const view = mount(FooterComponent, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: (key) => key
      }
    });

    // set URLs for testing
    const settings = useSettingsStore();
    settings.settings = {
      legal_notice_url: 'https://legal.org'
    };

    await view.vm.$nextTick();

    // test if footer exists
    const footer = view.findComponent({ ref: 'url_footer' });
    expect((footer).exists()).toBe(true);

    // test if text and no | is shown and if correct links is inserted
    const links = footer.findAll('a');
    expect(links.length).toBe(1);
    expect(links.at(0).text()).toBe('app.footer.legal_notice');
    expect(links.at(0).attributes('href')).toBe('https://legal.org');
    expect(view.findComponent(RawText).exists()).toBeFalsy();
  });

  it('footer test with only privacy policy', async () => {
    const view = mount(FooterComponent, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: (key) => key
      }
    });

    // set URLs for testing
    const settings = useSettingsStore();
    settings.settings = {
      privacy_policy_url: 'https://privacy.org'
    };

    await view.vm.$nextTick();

    // test if footer exists
    const footer = view.findComponent({ ref: 'url_footer' });
    expect((footer).exists()).toBe(true);

    // test if text and no | is shown and if correct links is inserted
    const links = footer.findAll('a');
    expect(links.length).toBe(1);
    expect(links.at(0).text()).toBe('app.footer.privacy_policy');
    expect(links.at(0).attributes('href')).toBe('https://privacy.org');
    expect(view.findComponent(RawText).exists()).toBeFalsy();
  });

  it('footer test with no urls', function () {
    const view = mount(FooterComponent, {
      localVue,
      pinia: createTestingPinia(),
      mocks: {
        $t: (key) => key
      }
    });

    // test if no footer exists
    const footer = view.findComponent({ ref: 'url_footer' });
    expect((footer).exists()).toBe(false);
  });
});
