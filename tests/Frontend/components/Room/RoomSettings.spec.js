import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, {
  BButton,
  BFormInput,
  BFormTextarea,
  BOverlay
} from 'bootstrap-vue';
import moxios from 'moxios';
import SettingsComponent from '../../../../resources/js/components/Room/SettingsComponent.vue';
import Clipboard from 'v-clipboard';
import Vuex from 'vuex';
import Base from '../../../../resources/js/api/base';
import PermissionService from '../../../../resources/js/services/PermissionService';
import { waitMoxios, createContainer } from '../../helper';
import _ from 'lodash';

const localVue = createLocalVue();

localVue.use(BootstrapVue);
localVue.use(Clipboard);
localVue.use(Vuex);

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

const settings = {
  attendance: {
    enabled: true
  },
  bbb: {
    welcome_message_limit: 250
  }
};

const store = new Vuex.Store({
  modules: {
    session: {
      namespaced: true,
      actions: {
        getCurrentUser () {}
      },
      state: {
        currentUser: exampleUser
      },
      getters: {
        isAuthenticated: () => true,
        settings: () => (setting) => _.get(settings, setting)
      }
    }
  },
  state: {
    loadingCounter: 0
  }
});

describe('RoomSettings', () => {
  beforeEach(() => {
    moxios.install();
  });
  afterEach(() => {
    moxios.uninstall();
  });

  it('load settings, fill form fields, disable fields if no write permission, calculate welcome message', async () => {
    PermissionService.setCurrentUser(exampleUser);
    moxios.stubRequest(`/api/v1/roomTypes?filter=${exampleRoom.id}`, {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(SettingsComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      propsData: {
        room: exampleRoom
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    // check for settings request and reply with settings
    const request = moxios.requests.at(0);
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/settings');
    await request.respondWith({
      status: 200,
      response: {
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
    const textArea = view.findComponent(BFormTextarea);
    const checkboxes = view.findAll('input[type="checkbox"]');
    const radios = view.findAll('input[type="radio"]');

    // check all input have the correct value

    // general
    expect(inputFields.at(0).element.value).toBe('Meeting One');
    expect(textArea.element.value).toBe('welcome');
    // check if welcome char limit is shown
    expect(textArea.element.parentElement.parentElement.children[1].innerHTML).toContain('rooms.settings.general.chars:{"chars":"7 / 250"}');
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
    expect(checkboxes.at(3).element.parentElement.outerHTML).toContain('rooms.settings.participants.recordAttendance');

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
    expect(textArea.attributes('disabled')).toBe('disabled');
    checkboxes.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));
    radios.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));

    view.destroy();
  });

  it('load settings owner, check fields disabled during loading', async () => {
    PermissionService.setCurrentUser(exampleUser);
    moxios.stubRequest(`/api/v1/roomTypes?filter=${exampleRoom.id}`, {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(SettingsComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: ownerRoom
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    const request = moxios.requests.at(0);
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/settings');

    const inputFields = view.findAllComponents(BFormInput);
    const buttons = view.findAllComponents(BButton);
    const textArea = view.findComponent(BFormTextarea);
    const checkboxes = view.findAll('input[type="checkbox"]');
    const radios = view.findAll('input[type="radio"]');

    // check if all fields and buttons are disabled during loading
    inputFields.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));
    buttons.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));
    expect(textArea.attributes('disabled')).toBe('disabled');
    checkboxes.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));
    radios.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));

    await request.respondWith({
      status: 200,
      response: {
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
    expect(textArea.attributes('disabled')).toBeUndefined();
    checkboxes.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());
    radios.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());

    view.destroy();
  });

  it('load settings co-owner', async () => {
    PermissionService.setCurrentUser(exampleUser);
    moxios.stubRequest(`/api/v1/roomTypes?filter=${exampleRoom.id}`, {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(SettingsComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: coOwnerRoom
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    const request = moxios.requests.at(0);
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/settings');
    await request.respondWith({
      status: 200,
      response: {
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
    const textArea = view.findComponent(BFormTextarea);
    const checkboxes = view.findAll('input[type="checkbox"]');
    const radios = view.findAll('input[type="radio"]');

    // check if all fields and buttons are enabled
    inputFields.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());
    buttons.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());
    expect(textArea.attributes('disabled')).toBeUndefined();
    checkboxes.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());
    radios.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());

    view.destroy();
  });

  it('load settings with room manage permission', async () => {
    PermissionService.setCurrentUser(adminUser);
    moxios.stubRequest(`/api/v1/roomTypes?filter=${exampleRoom.id}`, {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(SettingsComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: exampleRoom
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    const request = moxios.requests.at(0);
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/settings');
    await request.respondWith({
      status: 200,
      response: {
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
    const textArea = view.findComponent(BFormTextarea);
    const checkboxes = view.findAll('input[type="checkbox"]');
    const radios = view.findAll('input[type="radio"]');

    // check if all fields and buttons are enabled
    inputFields.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());
    buttons.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());
    expect(textArea.attributes('disabled')).toBeUndefined();
    checkboxes.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());
    radios.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());

    view.destroy();
  });

  it('load settings error', async () => {
    PermissionService.setCurrentUser(exampleUser);

    const baseError = jest.spyOn(Base, 'error').mockImplementation();

    moxios.stubRequest(`/api/v1/roomTypes?filter=${exampleRoom.id}`, {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(SettingsComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: ownerRoom
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    let request = moxios.requests.at(0);
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/settings');

    // check if overlay is shown during request
    expect(view.vm.isBusy).toBe(true);
    expect(view.findComponent(BOverlay).props('show')).toBe(true);
    // check if reload button is not shown during request
    expect(view.findComponent({ ref: 'reload' }).exists()).toBeFalsy();

    const inputFields = view.findAllComponents(BFormInput);
    const buttons = view.findAllComponents(BButton);
    const textArea = view.findComponent(BFormTextarea);
    const checkboxes = view.findAll('input[type="checkbox"]');
    const radios = view.findAll('input[type="radio"]');

    // check if all fields and buttons are disabled during loading
    inputFields.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));
    buttons.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));
    expect(textArea.attributes('disabled')).toBe('disabled');
    checkboxes.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));
    radios.wrappers.forEach(element => expect(element.attributes('disabled')).toBe('disabled'));

    // respond with server error
    await request.respondWith({
      status: 500,
      response: {
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
    expect(textArea.attributes('disabled')).toBe('disabled');
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

    // click reload button
    await reloadButton.trigger('click');
    await waitMoxios();
    await view.vm.$nextTick();
    request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/settings');
    // respond with a successful response
    await request.respondWith({
      status: 200,
      response: {
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
    expect(textArea.attributes('disabled')).toBeUndefined();
    checkboxes.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());
    radios.wrappers.forEach(element => expect(element.attributes('disabled')).toBeUndefined());

    view.destroy();
  });

  it('save settings', async () => {
    const baseError = jest.spyOn(Base, 'error').mockImplementation();
    PermissionService.setCurrentUser(exampleUser);
    moxios.stubRequest(`/api/v1/roomTypes?filter=${exampleRoom.id}`, {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(SettingsComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: ownerRoom
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    let request = moxios.requests.at(0);
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/settings');
    await request.respondWith({
      status: 200,
      response: {
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
    expect(saveButton.text()).toBe('app.save');

    // test server error
    await saveButton.trigger('click');
    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789');
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
      response: {
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
    await saveButton.trigger('click');
    await waitMoxios();
    request = moxios.requests.mostRecent();
    await request.respondWith({
      status: 200,
      response: {
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
    await saveButton.trigger('click');
    await waitMoxios();
    request = moxios.requests.mostRecent();
    await request.respondWith({
      status: 422,
      response: {
        message: 'The given data was invalid.',
        errors: {
          welcome: ['The Welcome message may not be greater than 250 characters.']
        }
      }
    });
    await view.vm.$nextTick();

    // check if error message is shown
    const welcome = view.findComponent(BFormTextarea);
    expect(welcome.element.parentElement.parentElement.children[2].innerHTML).toContain('The Welcome message may not be greater than 250 characters.');

    view.destroy();
  });

  it('load and save settings with attendance logging globally disabled', async () => {
    const settings = {
      attendance: {
        enabled: false
      },
      bbb: {
        welcome_message_limit: 250
      }
    };

    const store = new Vuex.Store({
      modules: {
        session: {
          namespaced: true,
          actions: {
            getCurrentUser () {
            }
          },
          state: {
            currentUser: exampleUser
          },
          getters: {
            isAuthenticated: () => true,
            settings: () => (setting) => _.get(settings, setting)
          }
        }
      },
      state: {
        loadingCounter: 0
      }
    });

    PermissionService.setCurrentUser(exampleUser);
    moxios.stubRequest(`/api/v1/roomTypes?filter=${ownerRoom.id}`, {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(SettingsComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      propsData: {
        room: ownerRoom
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    // check for settings request and reply with settings
    let request = moxios.requests.at(0);
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/settings');
    await request.respondWith({
      status: 200,
      response: {
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
    expect(checkboxes.at(3).element.parentElement.outerHTML).not.toContain('rooms.settings.participants.recordAttendance');

    // search for save button
    const saveButton = view.findAllComponents(BButton).at(5);
    expect(saveButton.text()).toBe('app.save');

    // test server error
    await saveButton.trigger('click');
    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789');
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
      max_participants: 10,
      duration: 5,
      default_role: 1,
      lobby: 1,
      listed: true,
      record_attendance: true
    });

    view.destroy();
  });
});
