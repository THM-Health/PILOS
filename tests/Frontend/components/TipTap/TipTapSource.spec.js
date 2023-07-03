import { mount } from '@vue/test-utils';
import { createContainer, createLocalVue, waitModalShown, waitModalHidden } from '../../helper';
import { BButton, BFormTextarea, BModal, BootstrapVue } from 'bootstrap-vue';
import TipTapSource from '../../../../resources/js/components/TipTap/TipTapSource.vue';
import { expect, it } from 'vitest';

const localVue = createLocalVue();
localVue.use(BootstrapVue);

describe('TipTap Source', () => {
  it('Edit code', async () => {
    const setContentSpy = vi.fn();

    const editor = {
      getHTML: () => {
        return '<p>Test</p>';
      },
      commands: {
        setContent: (content) => {
          setContentSpy(content);
        }
      }
    };

    const view = mount(TipTapSource, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true,
        editor
      },
      stubs: {
        transition: false
      }
    });

    await view.vm.$nextTick();

    const button = view.findComponent(BButton);
    const modal = view.findComponent(BModal);

    // Find button to open modal
    expect(button.exists()).toBe(true);

    // Check if modal is hidden
    expect(modal.vm.$data.isVisible).toBe(false);

    // Click on button to open modal
    await waitModalShown(view, async () => await button.trigger('click'));

    // Check if modal is shown
    expect(modal.vm.$data.isVisible).toBe(true);

    // Check modal title
    const modalTitle = modal.find('.modal-title');
    expect(modalTitle.text()).toBe('rooms.description.modals.source_code.title');

    // Check modal body
    const textarea = modal.findComponent(BFormTextarea);

    expect(textarea.element.value).toBe('<p>Test</p>');

    // Find buttons (delete, cancel, save)
    const buttons = modal.findAllComponents(BButton);
    expect(buttons.length).toBe(2);
    expect(buttons.at(0).text()).toBe('app.cancel');
    expect(buttons.at(1).text()).toBe('app.save');

    // Change link to invalid value
    await textarea.setValue('<p>Demo</p>');

    // Click on save button
    await waitModalHidden(view, async () => await buttons.at(1).trigger('click'));

    // Check if modal is hidden
    expect(modal.vm.$data.isVisible).toBe(false);

    // Check if insertContent was called
    expect(setContentSpy).toHaveBeenCalledWith('<p>Demo</p>');

    view.destroy();
  });
});
