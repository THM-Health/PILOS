import { mount } from '@vue/test-utils';
import { createContainer, createLocalVue, mockAxios } from '../../helper';
import { BButton, BFormInvalidFeedback, BootstrapVue } from 'bootstrap-vue';
import RoomDescriptionComponent from '../../../../resources/js/components/Room/RoomDescriptionComponent.vue';
import RoomDescriptionHtmlComponent from '../../../../resources/js/components/Room/RoomDescriptionHtmlComponent.vue';
import TipTapEditor from '../../../../resources/js/components/TipTap/TipTapEditor.vue';
import PermissionService from '../../../../resources/js/services/PermissionService';
import Base from '../../../../resources/js/api/base';
import { expect, it } from 'vitest';

const localVue = createLocalVue();
localVue.use(BootstrapVue);

const room = {
  id: 'gs4-6fb-kk8',
  name: 'Meeting One',
  description: '<script>alert("XSS Code")</script><a href="https://example.org">Link text</a><p>Regular content</p>',
  owner: { id: 2, name: 'John Doe' },
  type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
  model_name: 'Room',
  authenticated: false,
  allow_membership: false,
  is_member: true,
  is_co_owner: false,
  is_moderator: false,
  can_start: true,
  running: false
};

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], model_name: 'User', room_limit: -1 };

describe('RoomDescriptionComponent', () => {
  beforeEach(() => {
    PermissionService.setCurrentUser(exampleUser);
    mockAxios.reset();
  });

  it('Sanitize html and replace links', async () => {
    const view = mount(RoomDescriptionComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer(),
      stubs: {
        'room-description-html-component': true,
        'tip-tap-editor': true
      },
      propsData: {
        room,
        accessCode: null,
        token: null
      }
    });

    await view.vm.$nextTick();

    // Test if edit buttons are hidden for regular users
    const buttons = view.findAllComponents(BButton);
    expect(buttons.length).toBe(0);

    // Test if dompurify is removing dangerous code and if links are replaced on mount
    const htmlComponent = view.findComponent(RoomDescriptionHtmlComponent);
    expect(htmlComponent.exists()).toBe(true);
    expect(htmlComponent.props('html')).toBe('<a href="" data-href="https://example.org" data-target="safeLink">Link text</a><p>Regular content</p>');

    // Test if dompurify is removing dangerous code and if links are replaced on props change
    const roomDescriptionChanged = { ...room, description: '<script>alert("XSS Code")</script><a href="https://example.org">Link text</a><p>Regular content</p><img src="https://example.org/demo.png" width="250px" />' };
    await view.setProps({ room: roomDescriptionChanged });
    expect(htmlComponent.props('html')).toBe('<a href="" data-href="https://example.org" data-target="safeLink">Link text</a><p>Regular content</p><img width="250px" src="https://example.org/demo.png">');
  });

  it('Show edit buttons for owners', async () => {
    const newRoom = { ...room, owner: { id: 1, name: 'John Doe' } };
    const view = mount(RoomDescriptionComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer(),
      stubs: {
        'room-description-html-component': true,
        'tip-tap-editor': true
      },
      propsData: {
        room: newRoom,
        accessCode: null,
        token: null
      }
    });

    await view.vm.$nextTick();

    // Test if edit button is shown for room owner
    const buttons = view.findAllComponents(BButton);
    expect(buttons.length).toBe(1);

    view.destroy();
  });

  it('Show edit buttons for co-owners', async () => {
    const newRoom = { ...room, is_co_owner: true };
    const view = mount(RoomDescriptionComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer(),
      stubs: {
        'room-description-html-component': true,
        'tip-tap-editor': true
      },
      propsData: {
        room: newRoom,
        accessCode: null,
        token: null
      }
    });

    await view.vm.$nextTick();

    // Test if edit button is shown for room co-owner
    const buttons = view.findAllComponents(BButton);
    expect(buttons.length).toBe(1);

    view.destroy();
  });

  it('Show edit buttons for user with rooms.manage permission', async () => {
    const currentUser = { ...exampleUser, permissions: ['rooms.manage'] };
    PermissionService.setCurrentUser(currentUser);

    const view = mount(RoomDescriptionComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer(),
      stubs: {
        'room-description-html-component': true,
        'tip-tap-editor': true
      },
      propsData: {
        room,
        accessCode: null,
        token: null
      }
    });

    await view.vm.$nextTick();

    // Test if edit button is shown for users with rooms.manage permission'
    const buttons = view.findAllComponents(BButton);
    expect(buttons.length).toBe(1);

    view.destroy();
  });

  it('Hide edit buttons for user with rooms.viewAll permission', async () => {
    const currentUser = { ...exampleUser, permissions: ['rooms.viewAll'] };
    PermissionService.setCurrentUser(currentUser);

    const view = mount(RoomDescriptionComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer(),
      stubs: {
        'room-description-html-component': true,
        'tip-tap-editor': true
      },
      propsData: {
        room,
        accessCode: null,
        token: null
      }
    });

    await view.vm.$nextTick();

    // Test if edit button is NOT shown for users with rooms.viewAll permission'
    const buttons = view.findAllComponents(BButton);
    expect(buttons.length).toBe(0);

    view.destroy();
  });

  it('Test toggle edit/cancel', async () => {
    const newRoom = { ...room, owner: { id: 1, name: 'John Doe' } };
    const view = mount(RoomDescriptionComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer(),
      stubs: {
        'room-description-html-component': true,
        'tip-tap-editor': true
      },
      propsData: {
        room: newRoom,
        accessCode: null,
        token: null
      }
    });

    await view.vm.$nextTick();

    // Test if edit button is shown for room owner
    const editButton = view.findComponent(BButton);
    expect(editButton.text()).toBe('rooms.description.edit');

    // Check if description is shown by default and editor is hidden
    expect(view.findComponent(RoomDescriptionHtmlComponent).exists()).toBe(true);
    expect(view.findComponent(TipTapEditor).exists()).toBe(false);

    // Click edit button
    await editButton.trigger('click');

    // Check if editor is shown and description is hidden
    expect(view.findComponent(RoomDescriptionHtmlComponent).exists()).toBe(false);
    expect(view.findComponent(TipTapEditor).exists()).toBe(true);

    // Check if save and cancel buttons are shown
    const buttons = view.findAllComponents(BButton);
    expect(buttons.length).toBe(2);
    expect(buttons.at(0).text()).toBe('rooms.description.save');
    expect(buttons.at(1).text()).toBe('rooms.description.cancel');

    // Click cancel button
    await view.findAllComponents(BButton).at(1).trigger('click');

    // Check if description is shown again and editor is hidden
    expect(view.findComponent(RoomDescriptionHtmlComponent).exists()).toBe(true);
    expect(view.findComponent(TipTapEditor).exists()).toBe(false);

    view.destroy();
  });

  it('Check if description change is shown immediately in view mode but not in edit mode', async () => {
    const newRoom = { ...room, owner: { id: 1, name: 'John Doe' } };
    const view = mount(RoomDescriptionComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer(),
      stubs: {
        'room-description-html-component': true,
        'tip-tap-editor': true
      },
      propsData: {
        room: newRoom,
        accessCode: null,
        token: null
      }
    });

    await view.vm.$nextTick();

    // Check description content in view mode
    const htmlComponent = view.findComponent(RoomDescriptionHtmlComponent);
    expect(htmlComponent.props('html')).toBe('<a href="" data-href="https://example.org" data-target="safeLink">Link text</a><p>Regular content</p>');

    // Update description
    const roomDescriptionChanged = { ...newRoom, description: '<p>Test</p>' };
    await view.setProps({ room: roomDescriptionChanged });

    // Check if description is updated in view mode
    expect(htmlComponent.props('html')).toBe('<p>Test</p>');

    // Click edit button
    const editButton = view.findComponent(BButton);
    await editButton.trigger('click');

    // Check if source code is passed to editor
    const editor = view.findComponent(TipTapEditor);
    expect(editor.props('value')).toBe('<p>Test</p>');

    // Update description
    const roomDescriptionChanged2 = { ...newRoom, description: '<p>Test 2</p>' };
    await view.setProps({ room: roomDescriptionChanged2 });

    // Check if description is NOT updated in edit mode
    expect(editor.props('value')).toBe('<p>Test</p>');

    view.destroy();
  });

  it('Test edit description', async () => {
    const newRoom = { ...room, owner: { id: 1, name: 'John Doe' } };
    const view = mount(RoomDescriptionComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer(),
      stubs: {
        'room-description-html-component': true,
        'tip-tap-editor': true
      },
      propsData: {
        room: newRoom,
        accessCode: null,
        token: null
      }
    });

    await view.vm.$nextTick();

    // Click edit button
    const editButton = view.findComponent(BButton);
    await editButton.trigger('click');

    // Check if raw source code is passed to editor
    const editor = view.findComponent(TipTapEditor);
    expect(editor.props('value')).toBe('<script>alert("XSS Code")</script><a href="https://example.org">Link text</a><p>Regular content</p>');

    // Update description
    editor.vm.$emit('input', '<p>Test 2</p>');

    // Check if save and cancel buttons are shown
    const saveButton = view.findComponent(BButton);

    const request = mockAxios.request('/api/v1/rooms/gs4-6fb-kk8/description');

    // Click save button
    await saveButton.trigger('click');

    // Check if request is sent
    await request.wait();
    expect(request.config.method).toBe('put');
    expect(JSON.parse(request.config.data)).toStrictEqual({ description: '<p>Test 2</p>' });
    await request.respondWith({
      status: 200,
      data: {
        data: { ...newRoom, description: '<p>Test 2</p>' }
      }
    });

    // Check if event is emitted
    expect(view.emitted('settingsChanged')).toBeTruthy();

    // Check if editor is hidden and description is shown
    expect(view.findComponent(RoomDescriptionHtmlComponent).exists()).toBe(true);
    expect(view.findComponent(TipTapEditor).exists()).toBe(false);

    view.destroy();
  });

  it('Test edit description with error', async () => {
    const newRoom = { ...room, owner: { id: 1, name: 'John Doe' } };
    const baseError = vi.spyOn(Base, 'error').mockImplementation(() => {});
    const view = mount(RoomDescriptionComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer(),
      stubs: {
        'room-description-html-component': true,
        'tip-tap-editor': true
      },
      propsData: {
        room: newRoom,
        accessCode: null,
        token: null
      }
    });

    await view.vm.$nextTick();

    // Click edit button
    const editButton = view.findComponent(BButton);
    await editButton.trigger('click');

    // Check if save and cancel buttons are shown
    const saveButton = view.findComponent(BButton);

    const request = mockAxios.request('/api/v1/rooms/gs4-6fb-kk8/description');

    // Click save button
    await saveButton.trigger('click');

    // Check if request is sent
    await request.wait();
    await request.respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });
    await view.vm.$nextTick();

    // Check if global error handler is called
    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(500);

    // Check if event is NOT emitted and editor is still shown
    expect(view.emitted('settingsChanged')).toBeFalsy();
    expect(view.findComponent(TipTapEditor).exists()).toBe(true);

    const request2 = mockAxios.request('/api/v1/rooms/gs4-6fb-kk8/description');

    // Save description again
    await saveButton.trigger('click');

    // Check if request is sent
    await request2.wait();
    await request2.respondWith({
      status: 422,
      data: { message: 'The Description must not be greater than 65000 characters', errors: { description: ['The Description must not be greater than 65000 characters.'] } }
    });

    await view.vm.$nextTick();

    // Check if event is NOT emitted and editor is still shown
    expect(view.emitted('settingsChanged')).toBeFalsy();
    expect(view.findComponent(TipTapEditor).exists()).toBe(true);

    // Check if error is shown
    const error = view.findComponent(BFormInvalidFeedback);
    expect(error.exists()).toBe(true);
    expect(error.text()).toBe('The Description must not be greater than 65000 characters.');
    expect(view.findComponent(TipTapEditor).classes()).toContain('is-invalid');

    view.destroy();
  });
});
