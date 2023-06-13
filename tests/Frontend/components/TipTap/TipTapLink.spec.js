import { mount } from '@vue/test-utils';
import { createContainer, createLocalVue, waitModalShown, waitModalHidden } from '../../helper';
import { BButton, BFormInput, BModal, BootstrapVue } from 'bootstrap-vue';
import TipTapLink from '../../../../resources/js/components/TipTap/TipTapLink.vue';
import { expect, it } from 'vitest';

const localVue = createLocalVue();
localVue.use(BootstrapVue);

describe('TipTap Link', () => {
  it('Edit link', async () => {
    const setLinkSpy = vi.fn();

    const editor = {
      isActive: (type) => {
        return type === 'link';
      },
      getAttributes: (type) => {
        if (type === 'link') {
          return {
            href: 'https://example.org'
          };
        }
      },
      chain: () => {
        return {
          focus: () => {
            return {
              setLink: (href) => {
                return {
                  run: () => {
                    setLinkSpy(href);
                  }
                };
              }
            };
          }
        };
      }
    };

    const view = mount(TipTapLink, {
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
    expect(modalTitle.text()).toBe('rooms.description.modals.link.edit');

    // Check modal body
    const input = modal.findComponent(BFormInput);
    expect(input.element.value).toBe('https://example.org');

    // Change link to invalid value
    await input.setValue('invalid');

    // Find buttons
    const buttons = modal.findAllComponents(BButton);
    expect(buttons.length).toBe(3);

    // Check if delete button is shown
    expect(buttons.at(0).text()).toBe('app.delete');

    // Check if save button is disabled
    expect(buttons.at(2).text()).toBe('app.save');
    expect(buttons.at(2).attributes('disabled')).toBe('disabled');

    // Check if error message is shown
    expect(modal.find('.invalid-feedback').classes()).toContain('d-block');

    // Change link to valid value
    await input.setValue('https://example.com');

    // Check if save button is enabled
    expect(buttons.at(2).attributes('disabled')).toBe(undefined);

    // Check if error message is hidden
    expect(modal.find('.invalid-feedback').classes()).not.toContain('d-block');

    // Click on save button
    await waitModalHidden(view, async () => await buttons.at(2).trigger('click'));

    // Check if modal is hidden
    expect(modal.vm.$data.isVisible).toBe(false);

    // Check if setLink was called
    expect(setLinkSpy).toHaveBeenCalledWith({ href: 'https://example.com' });

    view.destroy();
  });

  it('Remove link', async () => {
    const unsetLinkSpy = vi.fn();

    const editor = {
      isActive: (type) => {
        return type === 'link';
      },
      getAttributes: (type) => {
        if (type === 'link') {
          return {
            href: 'https://example.org'
          };
        }
      },
      chain: () => {
        return {
          focus: () => {
            return {
              unsetLink: () => {
                return {
                  run: () => {
                    unsetLinkSpy();
                  }
                };
              }
            };
          }
        };
      }
    };

    const view = mount(TipTapLink, {
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

    // Find buttons
    const buttons = modal.findAllComponents(BButton);
    expect(buttons.length).toBe(3);

    // Check if delete button is shown and click on it
    expect(buttons.at(0).text()).toBe('app.delete');
    await buttons.at(0).trigger('click');

    // Check if modal is hidden
    expect(modal.vm.$data.isVisible).toBe(false);

    // Check if setLink was called
    expect(unsetLinkSpy).toHaveBeenCalled();

    view.destroy();
  });

  it('Add link', async () => {
    const setLinkSpy = vi.fn();

    const editor = {
      isActive: (type) => {
        return false;
      },
      chain: () => {
        return {
          focus: () => {
            return {
              setLink: (href) => {
                return {
                  run: () => {
                    setLinkSpy(href);
                  }
                };
              }
            };
          }
        };
      }
    };

    const view = mount(TipTapLink, {
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

    // Check if button is not active if editor indicates that a link element is not selected
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
    expect(modalTitle.text()).toBe('rooms.description.modals.link.new');

    // Check modal body
    const input = modal.findComponent(BFormInput);
    expect(input.element.value).toBe('');

    // Change link to invalid value
    await input.setValue('invalid');

    // Add new link
    await input.setValue('https://example.com');

    // Find buttons (delete button is not shown)
    const buttons = modal.findAllComponents(BButton);
    expect(buttons.length).toBe(2);

    // Check if save button is enabled
    expect(buttons.at(1).attributes('disabled')).toBe(undefined);

    // Click on save button
    await waitModalHidden(view, async () => await buttons.at(1).trigger('click'));

    // Check if modal is hidden
    expect(modal.vm.$data.isVisible).toBe(false);

    // Check if setLink was called
    expect(setLinkSpy).toHaveBeenCalledWith({ href: 'https://example.com' });

    view.destroy();
  });
});
