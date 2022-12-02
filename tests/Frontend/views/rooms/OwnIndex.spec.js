import { createLocalVue, mount } from '@vue/test-utils';
import RoomList from '../../../../resources/js/views/rooms/OwnIndex';
import BootstrapVue, { BBadge, BCard } from 'bootstrap-vue';
import moxios from 'moxios';
import RoomComponent from '../../../../resources/js/components/Room/RoomComponent';
import VueRouter from 'vue-router';
import NewRoomComponent from '../../../../resources/js/components/Room/NewRoomComponent';
import PermissionService from '../../../../resources/js/services/PermissionService';
import { waitMoxios, overrideStub, createContainer } from '../../helper';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { useAuthStore } from '../../../../resources/js/stores/auth';
import _ from 'lodash';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(VueRouter);
localVue.use(PiniaVuePlugin);

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], model_name: 'User', room_limit: -1 };

const initialState = { auth: { currentUser: exampleUser } };

describe('Own Room Index', () => {
  beforeEach(() => {
    moxios.install();
    PermissionService.currentUser = exampleUser;
  });

  afterEach(() => {
    moxios.uninstall();
  });

  const exampleOwnRoomResponse = {
    data: [
      {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 1,
          name: 'John Doe'
        },
        running: false,
        type: {
          id: 2,
          short: 'ME',
          description: 'Meeting',
          color: '#4a5c66',
          default: false
        }
      }
    ],
    meta: {
      current_page: 1,
      from: 1,
      last_page: 1,
      per_page: 10,
      to: 1,
      total: 1,
      total_no_filter: 1
    }
  };
  const exampleSharedRoomResponse = {
    data: [
      {
        id: 'def-abc-123',
        name: 'Meeting Two',
        owner: {
          id: 1,
          name: 'John Doe'
        },
        running: true,
        type: {
          id: 2,
          short: 'ME',
          description: 'Meeting',
          color: '#4a5c66',
          default: false
        }
      },
      {
        id: 'def-abc-456',
        name: 'Meeting Three',
        owner: {
          id: 1,
          name: 'John Doe'
        },
        running: false,
        type: {
          id: 2,
          short: 'ME',
          description: 'Meeting',
          color: '#4a5c66',
          default: false
        }
      }
    ],
    meta: {
      current_page: 1,
      from: 1,
      last_page: 1,
      per_page: 10,
      to: 5,
      total: 2,
      total_no_filter: 2
    }
  };
  const exampleRoomTypeResponse = {
    data: [
      { id: 1, short: 'VL', description: 'Vorlesung', color: '#80BA27', default: false },
      { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: true },
      { id: 3, short: 'PR', description: 'Pr\u00fcfung', color: '#9C132E', default: false },
      { id: 4, short: '\u00dcB', description: '\u00dcbung', color: '#00B8E4', default: false }
    ]
  };

  it('check list of rooms and attribute bindings', async () => {
    moxios.stubRequest('/api/v1/rooms?filter=own&page=1', {
      status: 200,
      response: exampleOwnRoomResponse
    });
    moxios.stubRequest('/api/v1/rooms?filter=shared&page=1', {
      status: 200,
      response: exampleSharedRoomResponse
    });
    moxios.stubRequest('/api/v1/roomTypes', {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();

    expect(view.vm.ownRooms).toEqual(exampleOwnRoomResponse);
    expect(view.vm.sharedRooms).toEqual(exampleSharedRoomResponse);
    const rooms = view.findAllComponents(RoomComponent);

    expect(rooms.at(0).vm.id).toBe('abc-def-123');
    expect(rooms.at(0).vm.name).toBe('Meeting One');
    expect(rooms.at(0).vm.shared).toBe(false);
    expect(rooms.at(0).vm.type).toEqual({ id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false });
    expect(rooms.at(0).vm.running).toBe(false);
    expect(rooms.at(0).vm.sharedBy).toBeUndefined();

    expect(rooms.at(1).vm.id).toBe('def-abc-123');
    expect(rooms.at(1).vm.name).toBe('Meeting Two');
    expect(rooms.at(1).vm.shared).toBe(true);
    expect(rooms.at(1).vm.type).toEqual({ id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false });
    expect(rooms.at(1).vm.running).toBe(true);
    expect(rooms.at(1).vm.sharedBy).toEqual({ id: 1, name: 'John Doe' });

    expect(rooms.at(2).vm.id).toBe('def-abc-456');
    expect(rooms.at(2).vm.name).toBe('Meeting Three');
    expect(rooms.at(2).vm.shared).toBe(true);
    expect(rooms.at(2).vm.type).toEqual({ id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false });
    expect(rooms.at(2).vm.running).toBe(false);
    expect(rooms.at(2).vm.sharedBy).toEqual({ id: 1, name: 'John Doe' });

    view.destroy();
  });

  it('click on room in list', async () => {
    const router = new VueRouter();
    const routerSpy = jest.spyOn(router, 'push').mockImplementation(() => Promise.resolve());

    const exampleRoomListEntry = {
      id: 'abc-def-123',
      name: 'Meeting One',
      owner: {
        id: 1,
        name: 'John Doe'
      },
      running: false,
      type: {
        id: 2,
        short: 'ME',
        description: 'Meeting',
        color: '#4a5c66',
        default: false
      }
    };

    const view = mount(RoomComponent, {
      localVue,
      router,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: exampleRoomListEntry.id,
        name: exampleRoomListEntry.name,
        type: exampleRoomListEntry.type
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    view.findComponent(BCard).trigger('click');

    await waitMoxios();
    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'rooms.view', params: { id: exampleRoomListEntry.id } });

    view.destroy();
  });

  it('test reload function and room limit reach event', async () => {
    moxios.stubRequest('/api/v1/rooms?filter=own&page=1', {
      status: 200,
      response: exampleOwnRoomResponse
    });
    moxios.stubRequest('/api/v1/rooms?filter=shared&page=1', {
      status: 200,
      response: exampleSharedRoomResponse
    });
    moxios.stubRequest('/api/v1/roomTypes', {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    const authStore = useAuthStore();
    authStore.currentUser.room_limit = 2;

    await waitMoxios();
    await view.vm.$nextTick();
    // find current amount of rooms
    let rooms = view.findAllComponents(RoomComponent);
    expect(rooms.length).toBe(3);

    // change response and fire event
    overrideStub('/api/v1/rooms?filter=own&page=1', {
      status: 200,
      response: {
        data: [
          {
            id: 'abc-def-123',
            name: 'Meeting One',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            running: false,
            type: {
              id: 2,
              short: 'ME',
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            }
          },
          {
            id: 'abc-def-345',
            name: 'Meeting Two',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            running: false,
            type: {
              id: 2,
              short: 'ME',
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            }
          }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          per_page: 10,
          to: 2,
          total: 2,
          total_no_filter: 2
        }
      }
    });

    // find new room component and fire event
    let newRoomComponent = view.findComponent(NewRoomComponent);
    expect(newRoomComponent.exists()).toBeTruthy();
    newRoomComponent.vm.$emit('limitReached');

    await waitMoxios();
    await view.vm.$nextTick();
    // check if now two rooms are displayed
    rooms = view.findAllComponents(RoomComponent);
    expect(rooms.length).toBe(4);

    // try to find new room component, should be missing as the limit is reached
    newRoomComponent = view.findComponent(NewRoomComponent);
    expect(newRoomComponent.exists()).toBeFalsy();

    view.destroy();
  });

  it('test search', async () => {
    moxios.stubRequest('/api/v1/rooms?filter=own&page=1', {
      status: 200,
      response: exampleOwnRoomResponse
    });
    moxios.stubRequest('/api/v1/rooms?filter=shared&page=1', {
      status: 200,
      response: exampleSharedRoomResponse
    });
    moxios.stubRequest('/api/v1/roomTypes', {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();

    let searchField = view.findComponent({ ref: 'search' });
    expect(searchField.exists()).toBeTruthy();

    // Enter search query
    await searchField.setValue('test');
    searchField.trigger('change');

    // Check room pagination reset
    expect(view.vm.$data.ownRooms.meta.current_page).toBe(1);
    expect(view.vm.$data.sharedRooms.meta.current_page).toBe(1);

    moxios.requests.reset();

    await waitMoxios();
    // Check if requests use the search string
    let ownRequest = moxios.requests.at(0);
    let sharedRequest = moxios.requests.at(1);

    expect(ownRequest.url).toBe('/api/v1/rooms?filter=own&page=1&search=test');
    expect(sharedRequest.url).toBe('/api/v1/rooms?filter=shared&page=1&search=test');

    await ownRequest.respondWith({
      status: 200,
      response: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 10,
          to: null,
          total: 0,
          total_no_filter: 1
        }
      }
    });
    await sharedRequest.respondWith({
      status: 200,
      response: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 10,
          to: null,
          total: 0,
          total_no_filter: 1
        }
      }
    });

    // check if message shows users that the user has rooms, but none that match the search query
    let sectionOwnRooms = view.find('#ownRooms');
    let sectionSharedRooms = view.find('#sharedRooms');
    expect(sectionOwnRooms.find('em').text()).toBe('rooms.no_rooms_available_search');
    expect(sectionSharedRooms.find('em').text()).toBe('rooms.no_rooms_available_search');

    // check empty list message for no user rooms
    searchField = view.findComponent({ ref: 'search' });
    await searchField.setValue('test2');
    searchField.trigger('change');
    moxios.requests.reset();
    await waitMoxios();
    ownRequest = moxios.requests.at(0);
    sharedRequest = moxios.requests.at(1);
    expect(ownRequest.url).toBe('/api/v1/rooms?filter=own&page=1&search=test2');
    expect(sharedRequest.url).toBe('/api/v1/rooms?filter=shared&page=1&search=test2');
    await ownRequest.respondWith({
      status: 200,
      response: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 10,
          to: null,
          total: 0,
          total_no_filter: 0
        }
      }
    });
    await sharedRequest.respondWith({
      status: 200,
      response: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 10,
          to: null,
          total: 0,
          total_no_filter: 0
        }
      }
    });

    sectionOwnRooms = view.find('#ownRooms');
    sectionSharedRooms = view.find('#sharedRooms');
    expect(sectionOwnRooms.find('em').text()).toBe('rooms.no_rooms_available');
    expect(sectionSharedRooms.find('em').text()).toBe('rooms.no_rooms_available');

    view.destroy();
  });

  it('test room limit', async () => {
    moxios.stubRequest('/api/v1/rooms?filter=own&page=1', {
      status: 200,
      response: exampleOwnRoomResponse
    });
    moxios.stubRequest('/api/v1/rooms?filter=shared&page=1', {
      status: 200,
      response: exampleSharedRoomResponse
    });
    moxios.stubRequest('/api/v1/roomTypes', {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    const authStore = useAuthStore();

    await waitMoxios();
    await view.vm.$nextTick();

    // Hide room count for users without limit
    expect(view.findComponent(BBadge).exists()).toBeFalsy();

    // Show room count for users with limit
    authStore.currentUser.room_limit = 2;

    await view.vm.$nextTick();
    expect(view.findComponent(BBadge).exists()).toBeTruthy();
    expect(view.findComponent(BBadge).text()).toBe('rooms.room_limit:{"has":1,"max":2}');

    // Enter search query
    const searchField = view.findComponent({ ref: 'search' });
    await searchField.setValue('test');
    searchField.trigger('change');
    moxios.requests.reset();
    await waitMoxios();
    const ownRequest = moxios.requests.at(0);
    const sharedRequest = moxios.requests.at(1);
    await ownRequest.respondWith({
      status: 200,
      response: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 10,
          to: null,
          total: 0,
          total_no_filter: 1
        }
      }
    });
    await sharedRequest.respondWith({
      status: 200,
      response: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 10,
          to: null,
          total: 0,
          total_no_filter: 1
        }
      }
    });

    // Check if room count is not based on items on the current page or the total results,
    // but all rooms of the user, independent of the search query
    expect(view.findComponent(BBadge).exists()).toBeTruthy();
    expect(view.findComponent(BBadge).text()).toBe('rooms.room_limit:{"has":1,"max":2}');

    view.destroy();
  });
});
