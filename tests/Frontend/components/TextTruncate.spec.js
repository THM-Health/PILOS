import { createLocalVue, mount } from '@vue/test-utils';
import Vue from 'vue';
import TextTruncate from '../../../resources/js/components/TextTruncate';
import BootstrapVue from 'bootstrap-vue';

const localVue = createLocalVue();

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};
localVue.use(BootstrapVue);
describe('TextTruncate', function () {
  it('show hide tooltip', async function () {
    const content = 'Lorem ipsum dolor sit amet';

    const view = mount(TextTruncate, {
      localVue,
      mocks: {
        $t: key => key
      },
      slots: {
        default: content
      },
      attachTo: createContainer()
    });

    await Vue.nextTick();
    const div = view.find('div');

    // Stub offsetWidth and scrollWidth
    let offsetWidth = 0;
    let scrollWidth = 0;
    Object.defineProperties(view.vm.$refs.overflow, {
      offsetWidth: { get () { return offsetWidth; } },
      scrollWidth: { get () { return scrollWidth; } }
    });

    // Text fits in parent element
    offsetWidth = 100;
    scrollWidth = 100;
    await window.dispatchEvent(new Event('resize'));
    await Vue.nextTick();
    expect(div.attributes('disabled')).toBe('disabled');
    expect(div.attributes('title')).toBeUndefined();
    expect(div.attributes('data-original-title')).toBeUndefined();
    expect(div.text()).toBe(content);

    // Text does not fit in parent element
    offsetWidth = 100;
    scrollWidth = 200;
    await window.dispatchEvent(new Event('resize'));
    await Vue.nextTick();

    expect(div.attributes('disabled')).toBeUndefined();
    expect(div.attributes('title')).toBe(content);
    expect(div.attributes('data-original-title')).toBeUndefined();
    expect(div.text()).toBe(content);

    // Test mouseover
    await div.trigger('mouseenter');
    await Vue.nextTick();
    expect(div.attributes('title')).toBe('');
    expect(div.attributes('data-original-title')).toBe(content);
    expect(div.text()).toBe(content);

    view.destroy();
  });
});
