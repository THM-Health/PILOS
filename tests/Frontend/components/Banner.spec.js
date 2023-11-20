import Banner from '@/components/Banner.vue';
import { mount } from '@vue/test-utils';
import { BAlert } from 'bootstrap-vue';
import { createLocalVue } from '../helper.js';

const localVue = createLocalVue();

describe('Banner', () => {
  it('alert contains the configured props data', async () => {
    const view = mount(Banner, {
      localVue,
      propsData: {
        enabled: true,
        message: 'Test message',
        background: '#000',
        color: '#fff'
      }
    });

    let content = view.html();
    expect(view.findComponent(BAlert).exists()).toBe(true);
    expect(content).toContain('Test message');
    expect(content).toContain('background-color: rgb(0, 0, 0)');
    expect(content).toContain('color: rgb(255, 255, 255)');

    await view.setProps({
      icon: 'fa-open-door',
      link: 'https://localhost'
    });

    content = view.html();
    expect(content).toContain('href="https://localhost"');
    expect(content).not.toContain('fa-open-door');

    await view.setProps({
      title: 'Foo'
    });

    content = view.html();
    expect(content).toContain('fa-open-door');
    expect(content).toContain('Foo');

    view.destroy();
  });
});
