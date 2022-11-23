import { createLocalVue, createWrapper, mount } from '@vue/test-utils';
import { createContainer, localVue } from '../helper';
import BootstrapVue, { BButton } from 'bootstrap-vue';

const testComponent = {
  name: 'test-component',
  props: {
    hideButtons: {
      type: Boolean,
      default: false,
      required: false
    }
  },
  /* eslint-disable @intlify/vue-i18n/no-raw-text */
  template: '<div>' +
    '<b-button title="test" v-if="!hideButtons" v-b-tooltip.hover >button1</b-button>' +
    '<b-button title="test" v-if="!hideButtons" v-b-tooltip.hover v-tooltip-hide-click>button2</b-button>' +
    '<b-button title="test" v-b-tooltip.hover v-tooltip-hide-click>button3</b-button>' +
    '<b-button title="test" id="demo" v-b-tooltip.hover v-tooltip-hide-click>button4</b-button>' +
    '</div>'
};

describe('HideTooltip', () => {
  it('adding random id', async () => {
    const wrapper = mount(testComponent, {
      localVue,
      attachTo: createContainer()
    });

    const buttons = wrapper.findAllComponents(BButton);

    expect(buttons.at(0).attributes('id')).toBeUndefined();
    expect(buttons.at(1).attributes('id')).toBe('randid-1');
    expect(buttons.at(2).attributes('id')).toBe('randid-2');
    expect(buttons.at(3).attributes('id')).toBe('demo');

    wrapper.destroy();
  });

  it('trigger click', async () => {
    const wrapper = mount(testComponent, {
      localVue,
      attachTo: createContainer()
    });
    const rootWrapper = createWrapper(wrapper.vm.$root);

    const buttons = wrapper.findAllComponents(BButton);

    const emitted = rootWrapper.emitted();

    await buttons.at(0).trigger('click');
    await wrapper.vm.$nextTick();
    expect(emitted).toEqual({});

    await buttons.at(1).trigger('click');
    await wrapper.vm.$nextTick();
    expect(emitted['bv::hide::tooltip'].length).toBe(1);
    expect(emitted['bv::hide::tooltip']).toStrictEqual([[buttons.at(1).attributes('id')]]);

    await buttons.at(3).trigger('click');
    await wrapper.vm.$nextTick();
    expect(emitted['bv::hide::tooltip'].length).toBe(2);
    expect(emitted['bv::hide::tooltip']).toStrictEqual([[buttons.at(1).attributes('id')], ['demo']]);

    wrapper.destroy();
  });

  it('test unbind', async () => {
    const wrapper = mount(testComponent, {
      localVue,
      attachTo: createContainer()
    });

    let buttons = wrapper.findAllComponents(BButton);

    // Spy on button with and without directive
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    wrapper.findAllComponents(BButton).at(0).element.removeEventListener = spy1;
    wrapper.findAllComponents(BButton).at(1).element.removeEventListener = spy2;

    expect(buttons.length).toBe(4);

    await wrapper.setProps({ hideButtons: true });
    await wrapper.vm.$nextTick();

    buttons = wrapper.findAllComponents(BButton);
    expect(buttons.length).toBe(2);

    // check if button with directive has one more removeEventListener call
    expect(spy2).toBeCalledTimes(spy1.mock.calls.length + 1);

    wrapper.destroy();
  });
});
