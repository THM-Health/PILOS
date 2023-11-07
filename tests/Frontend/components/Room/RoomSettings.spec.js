import { mount } from '@vue/test-utils';
import BootstrapVue, {
  BButton,
  BFormRadio,
  BFormInput,
  BFormTextarea,
  BOverlay
} from 'bootstrap-vue';

import SettingsComponent from '../../../../resources/js/components/Room/SettingsComponent.vue';

import Base from '../../../../resources/js/api/base';
import PermissionService from '../../../../resources/js/services/PermissionService';
import { mockAxios, createContainer, createLocalVue } from '../../helper';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { expect } from 'vitest';

const localVue = createLocalVue();

localVue.use(BootstrapVue);
localVue.use(PiniaVuePlugin);

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], model_name: 'User', room_limit: -1 };
const adminUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.manage'], model_name: 'User', room_limit: -1 };
const ownerRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: false, is_co_owner: false, is_moderator: false, can_start: false, running: false };
const coOwnerRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 2, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: true, is_co_owner: true, is_moderator: false, can_start: false, running: false };
const exampleRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: false, is_co_owner: false, is_moderator: false, can_start: false, running: false };

const exampleRoomTypeResponse = {
  data: [
    { id: 1, short: 'VL', description: 'Vorlesung', color: '#80BA27', allow_listing: true, model_name: 'RoomType' },
    { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', allow_listing: false, model_name: 'RoomType' },
    { id: 3, short: 'PR', description: 'Pr\u00fcfung', color: '#9C132E', allow_listing: false, model_name: 'RoomType' },
    { id: 4, short: '\u00dcB', description: '\u00dcbung', color: '#00B8E4', allow_listing: true, model_name: 'RoomType' }
  ]
};

const initialState = { settings: { settings: { attendance: { enabled: true }, bbb: { welcome_message_limit: 250 } } } };

describe('RoomSettings', () => {
  beforeEach(() => {
    mockAxios.reset();

    mockAxios.request('/api/v1/roomTypes', { filter: exampleRoom.id }).respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });
  });

  it('load settings, fill form fields, disable fields if no write permission, calculate welcome message', async () => {
    PermissionService.setCurrentUser(exampleUser);

    const request = mockAxios.request('/api/v1/rooms/123-456-789/settings');

    const view = mount(SettingsComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      propsData: {
        room: exampleRoom
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await request.wait();
    await view.vm.$nextTick();
    // check for settings request and reply with settings
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'Meeting One',
          room_type: {
            id: 1,
            short: 'VL',
            description: 'Vorlesung',
            color: '#80BA27',
            allow_listing: true,
            model_name: 'RoomType',
            updated_at: '2021-02-04T11:36:39.000000Z'
          },
          access_code: null,
          mute_on_start: true,
          lock_settings_disable_cam: false,
          webcams_only_for_moderator: true,
          lock_settings_disable_mic: false,
          lock_settings_disable_private_chat: false,
          lock_settings_disable_public_chat: true,
          lock_settings_disable_note: true,
          lock_settings_lock_on_join: true,
          lock_settings_hide_user_list: false,
          everyone_can_start: false,
          allow_guests: true,
          allow_membership: false,
          welcome: 'welcome',
          short_description: 'short description',
          max_participants: 10,
          duration: 5,
          default_role: 1,
          lobby: 1,
          listed: true,
          record_attendance: true
        }
      }
    });
    await view.vm.$nextTick();

    // load all form fields and buttons
    const inputFields = view.findAllComponents(BFormInput);
    const buttons = view.findAllComponents(BButton);
    const textAreas = view.findAllComponents(BFormTextarea);
    const checkboxes = view.findAll('input[type="checkbox"]');
    const radios = view.findAll('input[type="radio"]');

    // check all input have the correct value

    // general
    expect(inputFields.at(0).element.value).toBe('Meeting One');
    expect(textAreas.at(0).element.value).toBe('welcome');
    expect(textAreas.at(1).element.value).toBe('short description');
    // check if welcome char limit is shown
    expect(textAreas.at(0).element.parentElement.parentElement.children[1].innerHTML).toContain('rooms.settings.general.chars:{"chars":"7 / 250"}');
    expect(textAreas.at(1).element.parentElement.parentElement.children[1].innerHTML).toContain('rooms.settings.general.chars:{"chars":"17 / 300"}');
    expect(inputFields.at(1).element.value).toBe('5');

    // security
    expect(inputFields.at(2).element.value).toBe('');
    expect(checkboxes.at(0).element.checked).toBeTruthy();
    expect(checkboxes.at(1).element.checked).toBeFalsy();
    expect(checkboxes.at(2).element.checked).toBeTruthy();

    // participants
    expect(inputFields.at(3).element.value).toBe('10');
    expect(radios.at(0).element.checked).toBeTruthy();
    expect(radios.at(1).element.checked).toBeFalsy();
    expect(radios.at(2).element.checked).toBeFalsy();
    expect(radios.at(3).element.checked).toBeTruthy();
    expect(radios.at(4).element.checked).toBeFalsy();
    expect(checkboxes.at(3).element.checked).toBeTruthy();
    expect(checkboxes.at(3).element.parentElement.outerHTML).toContain('rooms.settings.participants.record_attendance');

    // permissions
    expect(checkboxes.at(4).element.checked).toBeFalsy();
    expect(checkboxes.at(5).element.checked).toBeTruthy();
    expect(checkboxes.at(6).element.checked).toBeTruthy();
    expect(checkboxes.at(7).element.checked).toBeFalsy();
    expect(checkboxes.at(8).element.checked).toBeTruthy();
    expect(checkboxes.at(9).element.checked).toBeFalsy();
    expect(checkboxes.at(10).element.checked).toBeTruthy();
    expect(checkboxes.at(11).element.checked).toBeFalsy();
    expect(checkboxes.at(12).element.checked).toBeTruthy();
    expect(checkboxes.at(13).element.checked).toBeFalsy();

    // check if all fields and buttons are disabled
    inputFields.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));
    buttons.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));
    expect(textAreas.at(0).attributes('disabled')).toBe('disabled');
    expect(textAreas.at(1).attributes('disabled')).toBe('disabled');
    checkboxes.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));
    radios.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));

    view.destroy();
  });

  it('load settings owner, check fields disabled during loading', async () => {
    PermissionService.setCurrentUser(exampleUser);

    const request = mockAxios.request('/api/v1/rooms/123-456-789/settings');

    const view = mount(SettingsComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: ownerRoom
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await request.wait();
    await view.vm.$nextTick();

    const inputFields = view.findAllComponents(BFormInput);
    const buttons = view.findAllComponents(BButton);
    const textAreas = view.findAllComponents(BFormTextarea);
    const checkboxes = view.findAll('input[type="checkbox"]');
    const radios = view.findAll('input[type="radio"]');

    // check if all fields and buttons are disabled during loading
    inputFields.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));
    buttons.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));
    expect(textAreas.at(0).attributes('disabled')).toBe('disabled');
    expect(textAreas.at(1).attributes('disabled')).toBe('disabled');
    checkboxes.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));
    radios.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));

    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'Meeting One',
          room_type: {
            id: 1,
            short: 'VL',
            description: 'Vorlesung',
            color: '#80BA27',
            allow_listing: true,
            model_name: 'RoomType',
            updated_at: '2021-02-04T11:36:39.000000Z'
          },
          access_code: null,
          mute_on_start: true,
          lock_settings_disable_cam: false,
          webcams_only_for_moderator: true,
          lock_settings_disable_mic: false,
          lock_settings_disable_private_chat: false,
          lock_settings_disable_public_chat: true,
          lock_settings_disable_note: true,
          lock_settings_lock_on_join: true,
          lock_settings_hide_user_list: false,
          everyone_can_start: false,
          allow_guests: true,
          allow_membership: false,
          welcome: 'welcome',
          short_description: 'short description',
          max_participants: 10,
          duration: 5,
          default_role: 1,
          lobby: 1,
          listed: true,
          record_attendance: true
        }
      }
    });
    await view.vm.$nextTick();

    // check if all fields and buttons are enabled
    inputFields.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());
    buttons.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());
    expect(textAreas.at(0).attributes('disabled')).toBeUndefined();
    expect(textAreas.at(1).attributes('disabled')).toBeUndefined();
    checkboxes.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());
    radios.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());

    view.destroy();
  });

  it('load settings co-owner', async () => {
    PermissionService.setCurrentUser(exampleUser);

    const request = mockAxios.request('/api/v1/rooms/123-456-789/settings');

    const view = mount(SettingsComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: coOwnerRoom
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await request.wait();
    await view.vm.$nextTick();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'Meeting One',
          room_type: {
            id: 1,
            short: 'VL',
            description: 'Vorlesung',
            color: '#80BA27',
            allow_listing: true,
            model_name: 'RoomType',
            updated_at: '2021-02-04T11:36:39.000000Z'
          },
          access_code: null,
          mute_on_start: true,
          lock_settings_disable_cam: false,
          webcams_only_for_moderator: true,
          lock_settings_disable_mic: false,
          lock_settings_disable_private_chat: false,
          lock_settings_disable_public_chat: true,
          lock_settings_disable_note: true,
          lock_settings_lock_on_join: true,
          lock_settings_hide_user_list: false,
          everyone_can_start: false,
          allow_guests: true,
          allow_membership: false,
          welcome: 'welcome',
          short_description: 'short description',
          max_participants: 10,
          duration: 5,
          default_role: 1,
          lobby: 1,
          listed: true,
          record_attendance: true
        }
      }
    });
    await view.vm.$nextTick();

    const inputFields = view.findAllComponents(BFormInput);
    const buttons = view.findAllComponents(BButton);
    const textAreas = view.findAllComponents(BFormTextarea);
    const checkboxes = view.findAll('input[type="checkbox"]');
    const radios = view.findAll('input[type="radio"]');

    // check if all fields and buttons are enabled
    inputFields.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());
    buttons.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());
    expect(textAreas.at(0).attributes('disabled')).toBeUndefined();
    expect(textAreas.at(1).attributes('disabled')).toBeUndefined();
    checkboxes.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());
    radios.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());

    view.destroy();
  });

  it('load settings with room manage permission', async () => {
    PermissionService.setCurrentUser(adminUser);

    const request = mockAxios.request('/api/v1/rooms/123-456-789/settings');

    const view = mount(SettingsComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: exampleRoom
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await request.wait();
    await view.vm.$nextTick();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'Meeting One',
          room_type: {
            id: 1,
            short: 'VL',
            description: 'Vorlesung',
            color: '#80BA27',
            allow_listing: true,
            model_name: 'RoomType',
            updated_at: '2021-02-04T11:36:39.000000Z'
          },
          access_code: null,
          mute_on_start: true,
          lock_settings_disable_cam: false,
          webcams_only_for_moderator: true,
          lock_settings_disable_mic: false,
          lock_settings_disable_private_chat: false,
          lock_settings_disable_public_chat: true,
          lock_settings_disable_note: true,
          lock_settings_lock_on_join: true,
          lock_settings_hide_user_list: false,
          everyone_can_start: false,
          allow_guests: true,
          allow_membership: false,
          welcome: 'welcome',
          short_description: 'short description',
          max_participants: 10,
          duration: 5,
          default_role: 1,
          lobby: 1,
          listed: true,
          record_attendance: true
        }
      }
    });
    await view.vm.$nextTick();

    const inputFields = view.findAllComponents(BFormInput);
    const buttons = view.findAllComponents(BButton);
    const textAreas = view.findAllComponents(BFormTextarea);
    const checkboxes = view.findAll('input[type="checkbox"]');
    const radios = view.findAll('input[type="radio"]');

    // check if all fields and buttons are enabled
    inputFields.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());
    buttons.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());
    expect(textAreas.at(0).attributes('disabled')).toBeUndefined();
    expect(textAreas.at(1).attributes('disabled')).toBeUndefined();
    checkboxes.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());
    radios.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());

    view.destroy();
  });

  it('load settings error', async () => {
    PermissionService.setCurrentUser(exampleUser);

    const baseError = vi.spyOn(Base, 'error').mockImplementation(() => {});

    let request = mockAxios.request('/api/v1/rooms/123-456-789/settings');

    const view = mount(SettingsComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: ownerRoom
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await request.wait();
    await view.vm.$nextTick();

    // check if overlay is shown during request
    expect(view.vm.isBusy).toBe(true);
    expect(view.findComponent(BOverlay).props('show')).toBe(true);
    // check if reload button is not shown during request
    expect(view.findComponent({ ref: 'reload' }).exists()).toBeFalsy();

    const inputFields = view.findAllComponents(BFormInput);
    const buttons = view.findAllComponents(BButton);
    const textAreas = view.findAllComponents(BFormTextarea);
    const checkboxes = view.findAll('input[type="checkbox"]');
    const radios = view.findAll('input[type="radio"]');

    // check if all fields and buttons are disabled during loading
    inputFields.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));
    buttons.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));
    expect(textAreas.at(0).attributes('disabled')).toBe('disabled');
    expect(textAreas.at(1).attributes('disabled')).toBe('disabled');
    checkboxes.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));
    radios.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));

    // respond with server error
    await request.respondWith({
      status: 500,
      data: {
        message: 'Server error'
      }
    });
    await view.vm.$nextTick();

    // check if overlay is still shown
    expect(view.vm.isBusy).toBe(false);
    expect(view.vm.modelLoadingError).toBe(true);
    expect(view.findComponent(BOverlay).props('show')).toBe(true);

    // check if all fields and buttons are disabled during loading
    inputFields.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));
    buttons.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));
    expect(textAreas.at(0).attributes('disabled')).toBe('disabled');
    expect(textAreas.at(1).attributes('disabled')).toBe('disabled');
    checkboxes.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));
    radios.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));

    // check if error is shown to user
    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(500);
    expect(baseError.mock.calls[0][0].response.data.message).toEqual('Server error');

    // check if reload button is visible
    const reloadButton = view.findComponent({ ref: 'reload' });
    expect(reloadButton.exists()).toBeTruthy();
    expect(reloadButton.text()).toBe('app.reload');

    request = mockAxios.request('/api/v1/rooms/123-456-789/settings');

    // click reload button
    await reloadButton.trigger('click');
    await request.wait();
    // respond with a successful response
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'Meeting One',
          room_type: {
            id: 1,
            short: 'VL',
            description: 'Vorlesung',
            color: '#80BA27',
            allow_listing: true,
            model_name: 'RoomType',
            updated_at: '2021-02-04T11:36:39.000000Z'
          },
          access_code: null,
          mute_on_start: true,
          lock_settings_disable_cam: false,
          webcams_only_for_moderator: true,
          lock_settings_disable_mic: false,
          lock_settings_disable_private_chat: false,
          lock_settings_disable_public_chat: true,
          lock_settings_disable_note: true,
          lock_settings_lock_on_join: true,
          lock_settings_hide_user_list: false,
          everyone_can_start: false,
          allow_guests: true,
          allow_membership: false,
          welcome: 'welcome',
          short_description: 'short description',
          max_participants: 10,
          duration: 5,
          default_role: 1,
          lobby: 1,
          listed: true,
          record_attendance: true
        }
      }
    });
    await view.vm.$nextTick();

    // check if overlay is hidden
    expect(view.vm.isBusy).toBe(false);
    expect(view.vm.modelLoadingError).toBe(false);
    expect(view.findComponent(BOverlay).props('show')).toBe(false);

    // check if all fields and buttons are enabled
    inputFields.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());
    buttons.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());
    expect(textAreas.at(0).attributes('disabled')).toBeUndefined();
    expect(textAreas.at(1).attributes('disabled')).toBeUndefined();
    checkboxes.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());
    radios.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());

    view.destroy();
  });

  it('save settings', async () => {
    const baseError = vi.spyOn(Base, 'error').mockImplementation(() => {});
    PermissionService.setCurrentUser(exampleUser);

    let request = mockAxios.request('/api/v1/rooms/123-456-789/settings');

    const view = mount(SettingsComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: ownerRoom
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await request.wait();
    await view.vm.$nextTick();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'Meeting One',
          room_type: {
            id: 1,
            short: 'VL',
            description: 'Vorlesung',
            color: '#80BA27',
            allow_listing: true,
            model_name: 'RoomType',
            updated_at: '2021-02-04T11:36:39.000000Z'
          },
          access_code: null,
          mute_on_start: true,
          lock_settings_disable_cam: false,
          webcams_only_for_moderator: true,
          lock_settings_disable_mic: false,
          lock_settings_disable_private_chat: false,
          lock_settings_disable_public_chat: true,
          lock_settings_disable_note: true,
          lock_settings_lock_on_join: true,
          lock_settings_hide_user_list: false,
          everyone_can_start: false,
          allow_guests: true,
          allow_membership: false,
          welcome: 'welcome',
          short_description: 'short description',
          max_participants: 10,
          duration: 5,
          default_role: 1,
          lobby: 1,
          listed: true,
          record_attendance: true
        }
      }
    });
    await view.vm.$nextTick();

    expect(view.vm.isBusy).toBe(false);

    const saveButton = view.findAllComponents(BButton).at(5);

    request = mockAxios.request('/api/v1/rooms/123-456-789');

    expect(saveButton.text()).toBe('app.save');

    // test server error
    await saveButton.trigger('click');
    await request.wait();
    expect(request.config.method).toBe('put');
    expect(JSON.parse(request.config.data)).toMatchObject({
      name: 'Meeting One',
      room_type: 1,
      access_code: null,
      mute_on_start: true,
      lock_settings_disable_cam: false,
      webcams_only_for_moderator: true,
      lock_settings_disable_mic: false,
      lock_settings_disable_private_chat: false,
      lock_settings_disable_public_chat: true,
      lock_settings_disable_note: true,
      lock_settings_lock_on_join: true,
      lock_settings_hide_user_list: false,
      everyone_can_start: false,
      allow_guests: true,
      allow_membership: false,
      welcome: 'welcome',
      short_description: 'short description',
      max_participants: 10,
      duration: 5,
      default_role: 1,
      lobby: 1,
      listed: true,
      record_attendance: true
    });

    expect(view.vm.isBusy).toBe(true);

    // respond with server error
    await request.respondWith({
      status: 500,
      data: {
        message: 'Server error'
      }
    });
    await view.vm.$nextTick();

    expect(view.vm.isBusy).toBe(false);

    // check if error is shown to user
    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(500);
    expect(baseError.mock.calls[0][0].response.data.message).toEqual('Server error');

    // test success
    request = mockAxios.request('/api/v1/rooms/123-456-789');
    await saveButton.trigger('click');
    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'Meeting One',
          room_type: {
            id: 1,
            short: 'VL',
            description: 'Vorlesung',
            color: '#80BA27',
            allow_listing: true,
            model_name: 'RoomType',
            updated_at: '2021-02-04T11:36:39.000000Z'
          },
          access_code: null,
          mute_on_start: true,
          lock_settings_disable_cam: false,
          webcams_only_for_moderator: true,
          lock_settings_disable_mic: false,
          lock_settings_disable_private_chat: false,
          lock_settings_disable_public_chat: true,
          lock_settings_disable_note: true,
          lock_settings_lock_on_join: true,
          lock_settings_hide_user_list: false,
          everyone_can_start: false,
          allow_guests: true,
          allow_membership: false,
          welcome: 'welcome',
          short_description: 'short description',
          max_participants: 10,
          duration: 5,
          default_role: 1,
          lobby: 1,
          listed: true,
          record_attendance: true
        }
      }
    });
    await view.vm.$nextTick();

    expect(view.emitted().settingsChanged).toBeTruthy();

    // test form validation error
    request = mockAxios.request('/api/v1/rooms/123-456-789');
    await saveButton.trigger('click');
    await request.wait();
    await request.respondWith({
      status: 422,
      data: {
        message: 'The given data was invalid.',
        errors: {
          welcome: ['The Welcome message may not be greater than 250 characters.'],
          short_description: ['The Short description may not be greater than 300 characters.']

        }
      }
    });
    await view.vm.$nextTick();

    // check if error message is shown
    const welcome = view.findAllComponents(BFormTextarea).at(0);
    const shortDescription = view.findAllComponents(BFormTextarea).at(1);
    expect(welcome.element.parentElement.parentElement.children[2].innerHTML).toContain('The Welcome message may not be greater than 250 characters.');
    expect(shortDescription.element.parentElement.parentElement.children[2].innerHTML).toContain('The Short description may not be greater than 300 characters.');

    view.destroy();
  });

  it('load and save settings with attendance logging globally disabled', async () => {
    PermissionService.setCurrentUser(exampleUser);

    let request = mockAxios.request('/api/v1/rooms/123-456-789/settings');

    const view = mount(SettingsComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      propsData: {
        room: ownerRoom
      },
      pinia: createTestingPinia({ initialState: { settings: { settings: { attendance: { enabled: false }, bbb: { welcome_message_limit: 250 } } } } }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();
    // check for settings request and reply with settings
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'Meeting One',
          room_type: {
            id: 1,
            short: 'VL',
            description: 'Vorlesung',
            color: '#80BA27',
            allow_listing: true,
            model_name: 'RoomType',
            updated_at: '2021-02-04T11:36:39.000000Z'
          },
          access_code: null,
          mute_on_start: true,
          lock_settings_disable_cam: false,
          webcams_only_for_moderator: true,
          lock_settings_disable_mic: false,
          lock_settings_disable_private_chat: false,
          lock_settings_disable_public_chat: true,
          lock_settings_disable_note: true,
          lock_settings_lock_on_join: true,
          lock_settings_hide_user_list: false,
          everyone_can_start: false,
          allow_guests: true,
          allow_membership: false,
          welcome: 'welcome',
          short_description: 'short description',
          max_participants: 10,
          duration: 5,
          default_role: 1,
          lobby: 1,
          listed: true,
          record_attendance: true
        }
      }
    });
    await view.vm.$nextTick();

    // check if the checkbox with the record attendance is missing
    const checkboxes = view.findAll('input[type="checkbox"]');
    expect(checkboxes.at(3).element.parentElement.outerHTML).not.toContain('rooms.settings.participants.record_attendance');

    // search for save button
    const saveButton = view.findAllComponents(BButton).at(5);
    expect(saveButton.text()).toBe('app.save');

    request = mockAxios.request('/api/v1/rooms/123-456-789');

    // test server error
    await saveButton.trigger('click');
    await request.wait();
    expect(request.config.method).toBe('put');
    expect(JSON.parse(request.config.data)).toMatchObject({
      name: 'Meeting One',
      room_type: 1,
      access_code: null,
      mute_on_start: true,
      lock_settings_disable_cam: false,
      webcams_only_for_moderator: true,
      lock_settings_disable_mic: false,
      lock_settings_disable_private_chat: false,
      lock_settings_disable_public_chat: true,
      lock_settings_disable_note: true,
      lock_settings_lock_on_join: true,
      lock_settings_hide_user_list: false,
      everyone_can_start: false,
      allow_guests: true,
      allow_membership: false,
      welcome: 'welcome',
      short_description: 'short description',
      max_participants: 10,
      duration: 5,
      default_role: 1,
      lobby: 1,
      listed: true,
      record_attendance: true
    });

    view.destroy();
  });

  it('show alert when default role moderator and waiting room active at the same time', async () => {
    PermissionService.setCurrentUser(exampleUser);

    const request = mockAxios.request('/api/v1/rooms/123-456-789/settings');

    const view = mount(SettingsComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key
      },
      propsData: {
        room: ownerRoom
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });
    await request.wait();
    await view.vm.$nextTick();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          name: 'Meeting One',
          room_type: {
            id: 1,
            short: 'VL',
            description: 'Vorlesung',
            color: '#80BA27',
            allow_listing: true,
            model_name: 'RoomType',
            updated_at: '2021-02-04T11:36:39.000000Z'
          },
          access_code: null,
          mute_on_start: true,
          lock_settings_disable_cam: false,
          webcams_only_for_moderator: true,
          lock_settings_disable_mic: false,
          lock_settings_disable_private_chat: false,
          lock_settings_disable_public_chat: true,
          lock_settings_disable_note: true,
          lock_settings_lock_on_join: true,
          lock_settings_hide_user_list: false,
          everyone_can_start: false,
          allow_guests: true,
          allow_membership: false,
          welcome: 'welcome',
          short_description: 'short description',
          max_participants: 10,
          duration: 5,
          default_role: 1,
          lobby: 0,
          listed: true,
          record_attendance: true
        }
      }
    });
    await view.vm.$nextTick();
    let alertEl = view.findComponent({ ref: 'waiting-room-alert' });

    const defaultRoleRadios = view.findComponent({ ref: 'defaultRole-group' }).findAllComponents(BFormRadio);
    const waitingRoomRadios = view.findComponent({ ref: 'waitingRoom-group' }).findAllComponents(BFormRadio);

    // test all variations with default role set to participant
    expect(alertEl.exists()).toBeFalsy();
    await waitingRoomRadios.at(0).find('input').setChecked();
    alertEl = view.findComponent({ ref: 'waiting-room-alert' });
    await view.vm.$nextTick();
    expect(alertEl.exists()).toBeFalsy();
    await waitingRoomRadios.at(1).find('input').setChecked();
    alertEl = view.findComponent({ ref: 'waiting-room-alert' });
    await view.vm.$nextTick();
    expect(alertEl.exists()).toBeFalsy();
    await waitingRoomRadios.at(2).find('input').setChecked();
    alertEl = view.findComponent({ ref: 'waiting-room-alert' });
    await view.vm.$nextTick();
    expect(alertEl.exists()).toBeFalsy();

    // test all variations with default role set to moderator
    await defaultRoleRadios.at(1).find('input').setChecked();
    await waitingRoomRadios.at(0).find('input').setChecked();
    alertEl = view.findComponent({ ref: 'waiting-room-alert' });
    await view.vm.$nextTick();
    expect(alertEl.exists()).toBeFalsy();
    await waitingRoomRadios.at(1).find('input').setChecked();
    alertEl = view.findComponent({ ref: 'waiting-room-alert' });
    await view.vm.$nextTick();
    expect(alertEl.exists()).toBeTruthy();
    await waitingRoomRadios.at(2).find('input').setChecked();
    alertEl = view.findComponent({ ref: 'waiting-room-alert' });
    await view.vm.$nextTick();
    expect(alertEl.exists()).toBeFalsy();
  });
});
