import { mount } from '@vue/test-utils';
import ColorSelect from '../../../../resources/js/components/Inputs/ColorSelect.vue';
import { createContainer, createLocalVue } from '../../helper';
import { expect } from 'vitest';

const localVue = createLocalVue();

describe('ColorSelect', () => {
  it('check v-model and props', async () => {
    const view = mount(ColorSelect, {
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        value: '#FF0000',
        disabled: false,
        colors: ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff']
      },
      attachTo: createContainer()
    });

    // test if all colors are shown
    const colorItems = view.findAll('.color-select');
    expect(colorItems.length).toBe(5);

    // test if not selected color does not have check icon
    expect(colorItems.at(0).find('.fa-solid.fa-circle-check').exists()).toBe(false);

    // check default value
    const selectedColor = view.findAll('.color-select.selected');
    expect(selectedColor.length).toBe(1);
    expect(selectedColor.at(0).element.style.backgroundColor).toBe('rgb(255, 0, 0)');

    // check if check icon is shown on selected color
    expect(selectedColor.at(0).find('.fa-solid.fa-circle-check').exists()).toBe(true);

    // select another color
    await colorItems.at(1).trigger('click');

    // check if event is emitted on change
    expect(view.emitted('input')[0][0]).toBe('#ffffff');

    // change prop
    await view.setProps({ value: '#ffffff' });

    // check if selected color is changed
    const newSelectedColor = view.findAll('.color-select.selected');
    expect(newSelectedColor.length).toBe(1);
    expect(newSelectedColor.at(0).element.style.backgroundColor).toBe('rgb(255, 255, 255)');

    // check disabled prop
    await view.setProps({ disabled: true });

    // check if all colors are disabled on a css level
    const disabledColorItems = view.findAll('.color-select.disabled');
    expect(disabledColorItems.length).toBe(5);

    // check if no event is emitted on click
    await colorItems.at(0).trigger('click');
    expect(view.emitted('input').length).toBe(1);

    view.destroy();
  });
});
