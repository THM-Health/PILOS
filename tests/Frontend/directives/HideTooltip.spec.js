import { createLocalVue, createWrapper, mount } from '@vue/test-utils';
import { createContainer } from '../helper';
import BootstrapVue, { BButton } from 'bootstrap-vue';
import HideTooltip from '../../../resources/js/directives/hide-tooltip';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.directive('tooltip-hide-click', HideTooltip);

const testComponent = {
  name: 'test-component',
  /* eslint-disable @intlify/vue-i18n/no-raw-text */
  template: '<div>' +
    '<b-button title="test" v-b-tooltip.hover v-tooltip-hide-click>button1</b-button>' +
    '<b-button title="test" v-b-tooltip.hover v-tooltip-hide-click>button2</b-button>' +
    '<b-button title="test" id="demo" v-b-tooltip.hover v-tooltip-hide-click>button3</b-button>' +
    '</div>'
};

describe('HideTooltip', () => {
  it('adding random id', async () => {
    const wrapper = mount(testComponent, {
      localVue,
      attachTo: createContainer()
    });

    const buttons = wrapper.findAllComponents(BButton);

    expect(buttons.at(0).attributes('id')).toBe('randid-1');
    expect(buttons.at(1).attributes('id')).toBe('randid-2');
    expect(buttons.at(2).attributes('id')).toBe('demo');
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

    expect(emitted['bv::hide::tooltip'].length).toBe(1);
    expect(emitted['bv::hide::tooltip']).toStrictEqual([[buttons.at(0).attributes('id')]]);

    await buttons.at(2).trigger('click');
    await wrapper.vm.$nextTick();
    expect(emitted['bv::hide::tooltip'].length).toBe(2);
    expect(emitted['bv::hide::tooltip']).toStrictEqual([[buttons.at(0).attributes('id')], ['demo']]);
  });
});
