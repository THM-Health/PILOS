import { mount } from '@vue/test-utils';
import { createContainer, createLocalVue, waitModalShown, waitModalHidden } from '../../helper';
import { BButton, BModal, BootstrapVue } from 'bootstrap-vue';
import RoomDescriptionHtmlComponent from '@/components/Room/RoomDescriptionHtmlComponent.vue';
import PermissionService from '@/services/PermissionService';
import { expect, it } from 'vitest';

const localVue = createLocalVue();
localVue.use(BootstrapVue);

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], model_name: 'User', room_limit: -1 };

describe('RoomDescriptionHtmlComponent', () => {
  beforeEach(() => {
    PermissionService.setCurrentUser(exampleUser);
  });

  it('Open external link modal', async () => {
    // Mock window.open
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => {});

    const view = mount(RoomDescriptionHtmlComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true,
        html: '<a href="" data-href="https://example.org" data-target="safeLink">Link text</a><p>Regular content</p>'
      },
      stubs: {
        transition: false
      }
    });

    await view.vm.$nextTick();

    const link = view.find('a');

    // Check if modal is not visible yet
    const modal = view.findComponent(BModal);
    expect(modal.vm.$data.isVisible).toBe(false);

    // Click on link
    await waitModalShown(view, async () => {
      await link.trigger('click');
    });

    // Check if modal is visible and shows warning
    expect(modal.vm.$data.isVisible).toBe(true);
    const modalBody = modal.find('.modal-body');
    expect(modalBody.html()).toContain('rooms.description.external_link_warning.description:{"link":"https://example.org"}');

    // Check if modal has two action buttons
    const buttons = modal.findAllComponents(BButton);
    expect(buttons.length).toBe(2);

    // Click on continue button
    expect(buttons.at(1).text()).toBe('app.continue');
    await waitModalHidden(view, async () => {
      await buttons.at(1).trigger('click');
    });

    // Check if modal is closed and window.open was called
    expect(modal.vm.$data.isVisible).toBe(false);
    expect(windowOpenSpy).toHaveBeenCalledWith('https://example.org', '_blank');

    view.destroy();
  });

  it('Cancel open external link modal', async () => {
    // Mock window.open
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => {});

    const view = mount(RoomDescriptionHtmlComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true,
        html: '<a href="" data-href="https://example.org" data-target="safeLink">Link text</a><p>Regular content</p>'
      },
      stubs: {
        transition: false
      }
    });

    await view.vm.$nextTick();

    const link = view.find('a');
    const modal = view.findComponent(BModal);

    // Click on link
    await waitModalShown(view, async () => {
      await link.trigger('click');
    });

    // Check if modal has two action buttons
    const buttons = modal.findAllComponents(BButton);
    expect(buttons.length).toBe(2);

    // Click on cancel button
    expect(buttons.at(0).text()).toBe('app.cancel');
    await waitModalHidden(view, async () => {
      await buttons.at(0).trigger('click');
    });

    // Check if modal is closed and window.open was not called
    expect(modal.vm.$data.isVisible).toBe(false);
    expect(windowOpenSpy).not.toHaveBeenCalled();

    view.destroy();
  });

  it('Check if modal works on changed html code', async () => {
    // Mock window.open
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => {});

    const view = mount(RoomDescriptionHtmlComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true,
        html: '<a href="" data-href="https://example.org" data-target="safeLink">Link text</a><p>Regular content</p>'
      },
      stubs: {
        transition: false
      }
    });

    await view.vm.$nextTick();

    // Change props
    await view.setProps({ html: '<a href="" data-href="https://example.org" data-target="safeLink">First link</a><p>Regular content</p><a href="" data-href="https://example.com" data-target="safeLink">Second link</a>' });

    const links = view.findAll('a');
    expect(links.length).toBe(2);

    // Check if modal is not visible yet
    const modal = view.findComponent(BModal);
    expect(modal.vm.$data.isVisible).toBe(false);

    // Click on link
    await waitModalShown(view, async () => {
      await links.at(1).trigger('click');
    });

    // Check if modal is visible and shows warning
    expect(modal.vm.$data.isVisible).toBe(true);
    const modalBody = modal.find('.modal-body');
    expect(modalBody.html()).toContain('rooms.description.external_link_warning.description:{"link":"https://example.com"}');

    // Check if modal has two action buttons
    const buttons = modal.findAllComponents(BButton);
    expect(buttons.length).toBe(2);

    // Click on continue button
    expect(buttons.at(1).text()).toBe('app.continue');
    await waitModalHidden(view, async () => {
      await buttons.at(1).trigger('click');
    });

    // Check if modal is closed and window.open was called
    expect(modal.vm.$data.isVisible).toBe(false);
    expect(windowOpenSpy).toHaveBeenCalledWith('https://example.com', '_blank');

    view.destroy();
  });
});
