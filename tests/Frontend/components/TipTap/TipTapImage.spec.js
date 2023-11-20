import { mount } from '@vue/test-utils';
import { createContainer, createLocalVue, waitModalShown, waitModalHidden } from '../../helper';
import { BButton, BFormInput, BModal, BootstrapVue } from 'bootstrap-vue';
import TipTapImage from '@/components/TipTap/TipTapImage.vue';
import { expect, it } from 'vitest';

const localVue = createLocalVue();
localVue.use(BootstrapVue);

describe('TipTap Image', () => {
  it('Edit image', async () => {
    const insertContentSpy = vi.fn();

    const editor = {
      isActive: (type) => {
        return type === 'image';
      },
      getAttributes: (type) => {
        if (type === 'image') {
          return {
            src: 'https://example.org/image.jpg',
            width: '250px',
            alt: 'Image description'
          };
        }
      },
      chain: () => {
        return {
          insertContent: (data) => {
            return {
              run: () => {
                insertContentSpy(data);
              }
            };
          }
        };
      }
    };

    const view = mount(TipTapImage, {
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

    // Check if button is active if editor indicates that a link element is selected
    expect(button.exists()).toBe(true);
    expect(button.classes()).toContain('active');

    // Check if modal is hidden
    expect(modal.vm.$data.isVisible).toBe(false);

    // Click on button to open modal
    await waitModalShown(view, async () => await button.trigger('click'));

    // Check if modal is shown
    expect(modal.vm.$data.isVisible).toBe(true);

    // Check modal title
    const modalTitle = modal.find('.modal-title');
    expect(modalTitle.text()).toBe('rooms.description.modals.image.edit');

    // Check modal body
    const input = modal.findAllComponents(BFormInput);

    expect(input.at(0).element.value).toBe('https://example.org/image.jpg');
    expect(input.at(1).element.value).toBe('250px');
    expect(input.at(2).element.value).toBe('Image description');

    // Find buttons (delete, cancel, save)
    const buttons = modal.findAllComponents(BButton);
    expect(buttons.length).toBe(3);
    expect(buttons.at(0).text()).toBe('app.delete');
    expect(buttons.at(1).text()).toBe('app.cancel');
    expect(buttons.at(2).text()).toBe('app.save');

    // Change link to invalid value
    await input.at(0).setValue('invalid');

    // Check if save button is disabled
    expect(buttons.at(2).attributes('disabled')).toBe('disabled');

    // Check if error message is shown
    expect(modal.find('.invalid-feedback').classes()).toContain('d-block');

    // Change link to valid value
    await input.at(0).setValue('https://example.com/img.png');

    // Check if save button is enabled
    expect(buttons.at(2).attributes('disabled')).toBe(undefined);

    // Check if error message is hidden
    expect(modal.find('.invalid-feedback').classes()).not.toContain('d-block');

    // Click on save button
    await waitModalHidden(view, async () => await buttons.at(2).trigger('click'));

    // Check if modal is hidden
    expect(modal.vm.$data.isVisible).toBe(false);

    // Check if insertContent was called
    expect(insertContentSpy).toHaveBeenCalledWith({
      attrs: {
        alt: 'Image description',
        src: 'https://example.com/img.png',
        width: '250px'
      },
      type: 'image'
    });

    view.destroy();
  });

  it('Delete image', async () => {
    const deleteSelectionSpy = vi.fn();

    const editor = {
      isActive: (type) => {
        return type === 'image';
      },
      getAttributes: (type) => {
        if (type === 'image') {
          return {
            src: 'https://example.org/image.jpg',
            width: '250px',
            alt: 'Image description'
          };
        }
      },
      commands: {
        deleteSelection: () => {
          deleteSelectionSpy();
        }
      }
    };

    const view = mount(TipTapImage, {
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

    // Click on button to open modal
    await waitModalShown(view, async () => await button.trigger('click'));

    // Find buttons (delete, cancel, save)
    const buttons = modal.findAllComponents(BButton);
    expect(buttons.length).toBe(3);
    expect(buttons.at(0).text()).toBe('app.delete');

    // Click on delete button
    await waitModalHidden(view, async () => await buttons.at(0).trigger('click'));

    // Check if modal is hidden
    expect(modal.vm.$data.isVisible).toBe(false);

    // Check if deleteSelection command was called
    expect(deleteSelectionSpy).toHaveBeenCalled();

    view.destroy();
  });

  it('Add image', async () => {
    const insertContentSpy = vi.fn();

    const editor = {
      isActive: () => {
        return false;
      },
      chain: () => {
        return {
          insertContent: (data) => {
            return {
              run: () => {
                insertContentSpy(data);
              }
            };
          }
        };
      }
    };

    const view = mount(TipTapImage, {
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

    // Check if button is active if editor indicates that a link element is selected
    expect(button.exists()).toBe(true);
    expect(button.classes()).not.toContain('active');

    // Check if modal is hidden
    expect(modal.vm.$data.isVisible).toBe(false);

    // Click on button to open modal
    await waitModalShown(view, async () => await button.trigger('click'));

    // Check if modal is shown
    expect(modal.vm.$data.isVisible).toBe(true);

    // Check modal title
    const modalTitle = modal.find('.modal-title');
    expect(modalTitle.text()).toBe('rooms.description.modals.image.new');

    // Check modal body
    const input = modal.findAllComponents(BFormInput);

    expect(input.at(0).element.value).toBe('');
    expect(input.at(1).element.value).toBe('');
    expect(input.at(2).element.value).toBe('');

    // Find buttons (delete, cancel, save)
    const buttons = modal.findAllComponents(BButton);
    expect(buttons.length).toBe(2);
    expect(buttons.at(0).text()).toBe('app.cancel');
    expect(buttons.at(1).text()).toBe('app.save');

    // Check if save button is disabled
    expect(buttons.at(1).attributes('disabled')).toBe('disabled');

    // Add image src
    await input.at(0).setValue('https://example.com/img.png');

    // Check if save button is enabled
    expect(buttons.at(1).attributes('disabled')).toBe(undefined);

    // Click on save button
    await waitModalHidden(view, async () => await buttons.at(1).trigger('click'));

    // Check if modal is hidden
    expect(modal.vm.$data.isVisible).toBe(false);

    // Check if insertContent was called
    expect(insertContentSpy).toHaveBeenCalledWith({
      attrs: {
        alt: null,
        src: 'https://example.com/img.png',
        width: null
      },
      type: 'image'
    });

    view.destroy();
  });
});
