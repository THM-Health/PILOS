import { mount } from '@vue/test-utils';
import FooterComponent from '../../../resources/js/components/FooterComponent.vue';
import VueRouter from 'vue-router';
import RawText from '../../../resources/js/components/RawText.vue';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { useSettingsStore } from '../../../resources/js/stores/settings';
import { createLocalVue } from '../helper';

const localVue = createLocalVue();
localVue.use(VueRouter);
localVue.use(PiniaVuePlugin);

describe('Footer Component', () => {
  it('footer test with two urls, no version', async () => {
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
      privacy_policy_url: 'https://privacy.org',
      version: null
    };

    await view.vm.$nextTick();

    // test if footer exists
    const footer = view.findComponent({ ref: 'footer_container' });
    expect((footer).exists()).toBe(true);

    // test if text and | is shown and if correct links are inserted
    const links = footer.findAll('a');
    expect(links.length).toBe(2);
    expect(links.at(0).text()).toBe('app.footer.legal_notice');
    expect(links.at(0).attributes('href')).toBe('https://legal.org');
    expect(links.at(1).text()).toBe('app.footer.privacy_policy');
    expect(links.at(1).attributes('href')).toBe('https://privacy.org');
    expect(view.findComponent(RawText).exists()).toBeTruthy();

    // test if version is not shown
    expect(view.text()).not.toContain('app.version');
    expect(view.text()).not.toContain('1.0.0');
  });

  it('footer test with only legal notice, no version', async () => {
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
      legal_notice_url: 'https://legal.org',
      privacy_policy_url: '',
      version: null
    };

    await view.vm.$nextTick();

    // test if footer exists
    const footer = view.findComponent({ ref: 'footer_container' });
    expect((footer).exists()).toBe(true);

    // test if text and no | is shown and if correct links is inserted
    const links = footer.findAll('a');
    expect(links.length).toBe(1);
    expect(links.at(0).text()).toBe('app.footer.legal_notice');
    expect(links.at(0).attributes('href')).toBe('https://legal.org');
    expect(view.findComponent(RawText).exists()).toBeFalsy();

    // test if version is not shown
    expect(view.text()).not.toContain('app.version');
    expect(view.text()).not.toContain('1.0.0');
  });

  it('footer test with only privacy policy, no version', async () => {
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
      legal_notice_url: '',
      privacy_policy_url: 'https://privacy.org',
      version: null
    };

    await view.vm.$nextTick();

    // test if footer exists
    const footer = view.findComponent({ ref: 'footer_container' });
    expect((footer).exists()).toBe(true);

    // test if text and no | is shown and if correct links is inserted
    const links = footer.findAll('a');
    expect(links.length).toBe(1);
    expect(links.at(0).text()).toBe('app.footer.privacy_policy');
    expect(links.at(0).attributes('href')).toBe('https://privacy.org');
    expect(view.findComponent(RawText).exists()).toBeFalsy();

    // test if version is not shown
    expect(view.text()).not.toContain('app.version');
    expect(view.text()).not.toContain('1.0.0');
  });

  it('footer test with no urls, no version', async () => {
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
      legal_notice_url: '',
      privacy_policy_url: '',
      version: null
    };

    await view.vm.$nextTick();

    // test if no footer exists
    const footer = view.findComponent({ ref: 'footer_container' });
    expect((footer).exists()).toBe(false);

    // test if version is not shown
    expect(view.text()).not.toContain('app.version');
    expect(view.text()).not.toContain('1.0.0');
  });

  it('footer test with two urls and version', async () => {
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
      privacy_policy_url: 'https://privacy.org',
      version: '1.0.0'
    };

    await view.vm.$nextTick();

    // test if footer exists
    const footer = view.findComponent({ ref: 'footer_container' });
    expect((footer).exists()).toBe(true);

    // test if text and | is shown and if correct links are inserted
    const links = footer.findAll('a');
    expect(links.length).toBe(2);
    expect(links.at(0).text()).toBe('app.footer.legal_notice');
    expect(links.at(0).attributes('href')).toBe('https://legal.org');
    expect(links.at(1).text()).toBe('app.footer.privacy_policy');
    expect(links.at(1).attributes('href')).toBe('https://privacy.org');
    expect(view.findComponent(RawText).exists()).toBeTruthy();

    // test if version is shown
    expect(view.text()).toContain('app.version');
    expect(view.text()).toContain('1.0.0');
  });

  it('footer test with only legal notice and version', async () => {
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
      legal_notice_url: 'https://legal.org',
      privacy_policy_url: '',
      version: '1.0.0'
    };

    await view.vm.$nextTick();

    // test if footer exists
    const footer = view.findComponent({ ref: 'footer_container' });
    expect((footer).exists()).toBe(true);

    // test if text and no | is shown and if correct links is inserted
    const links = footer.findAll('a');
    expect(links.length).toBe(1);
    expect(links.at(0).text()).toBe('app.footer.legal_notice');
    expect(links.at(0).attributes('href')).toBe('https://legal.org');
    expect(view.findComponent(RawText).exists()).toBeFalsy();

    // test if version is shown
    expect(view.text()).toContain('app.version');
    expect(view.text()).toContain('1.0.0');
  });

  it('footer test with only privacy policy and version', async () => {
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
      legal_notice_url: '',
      privacy_policy_url: 'https://privacy.org',
      version: '1.0.0'
    };

    await view.vm.$nextTick();

    // test if footer exists
    const footer = view.findComponent({ ref: 'footer_container' });
    expect((footer).exists()).toBe(true);

    // test if text and no | is shown and if correct links is inserted
    const links = footer.findAll('a');
    expect(links.length).toBe(1);
    expect(links.at(0).text()).toBe('app.footer.privacy_policy');
    expect(links.at(0).attributes('href')).toBe('https://privacy.org');
    expect(view.findComponent(RawText).exists()).toBeFalsy();

    // test if version is shown
    expect(view.text()).toContain('app.version');
    expect(view.text()).toContain('1.0.0');
  });

  it('footer test with no urls, only version', async () => {
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
      legal_notice_url: '',
      privacy_policy_url: '',
      version: '1.0.0'
    };

    await view.vm.$nextTick();

    // test if footer exists
    const footer = view.findComponent({ ref: 'footer_container' });
    expect((footer).exists()).toBe(true);

    // test if no links are shown
    const links = footer.findAll('a');
    expect(links.length).toBe(0);

    // test if version is shown
    expect(view.text()).toContain('app.version');
    expect(view.text()).toContain('1.0.0');
  });
});
