import { mount } from '@vue/test-utils';
import TextTruncate from '@/components/TextTruncate.vue';
import { createContainer, createLocalVue } from '../helper';

const localVue = createLocalVue();

describe('TextTruncate', () => {
  it('show hide tooltip', async () => {
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

    await view.vm.$nextTick();
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
    await view.vm.$nextTick();
    expect(div.attributes('disabled')).toBe('disabled');
    expect(div.attributes('title')).toBeUndefined();
    expect(div.attributes('data-original-title')).toBeUndefined();
    expect(div.text()).toBe(content);

    // Text does not fit in parent element
    offsetWidth = 100;
    scrollWidth = 200;
    await window.dispatchEvent(new Event('resize'));
    await view.vm.$nextTick();

    expect(div.attributes('disabled')).toBeUndefined();
    expect(div.attributes('title')).toBe(content);
    expect(div.attributes('data-original-title')).toBeUndefined();
    expect(div.text()).toBe(content);

    // Test mouseover
    await div.trigger('mouseenter');
    await view.vm.$nextTick();
    expect(div.attributes('title')).toBe('');
    expect(div.attributes('data-original-title')).toBe(content);
    expect(div.text()).toBe(content);

    view.destroy();
  });
});
