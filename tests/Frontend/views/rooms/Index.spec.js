import { mount } from '@vue/test-utils';
import RoomIndex from '@/views/rooms/Index.vue';
import {
  BAlert,
  BButton,
  BDropdown,
  BDropdownItem,
  BFormCheckbox,
  BFormGroup,
  BFormSelect,
  BFormSelectOption,
  BInputGroupAppend, BInputGroupPrepend,
  BOverlay, BPagination
} from 'bootstrap-vue';

import _ from 'lodash';
import PermissionService from '@/services/PermissionService';
import Base from '@/api/base';
import { mockAxios, createContainer, createLocalVue, i18nDateMock } from '../../helper';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { useAuthStore } from '@/stores/auth';
import { expect } from 'vitest';

const localVue = createLocalVue();
localVue.use(PiniaVuePlugin);

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], model_name: 'User', room_limit: -1 };
const initialState = { auth: { currentUser: exampleUser } };

describe('Room Index', () => {
  beforeEach(() => {
    mockAxios.reset();
    PermissionService.currentUser = exampleUser;
  });

  const exampleRoomResponse = {
    data: [
      {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: {
          id: 1,
          name: 'John Doe'
        },
        last_meeting: null,
        type: {
          id: 2,
          description: 'Meeting',
          color: '#4a5c66',
          default: false
        },
        is_favorite: false,
        short_description: 'Own room'
      },
      {
        id: 'def-abc-123',
        name: 'Meeting Two',
        owner: {
          id: 1,
          name: 'John Doe'
        },
        last_meeting: {
          start: '2023-08-21 08:18:28:00',
          end: null
        },
        type: {
          id: 2,
          description: 'Meeting',
          color: '#4a5c66',
          default: false
        },
        is_favorite: false,
        short_description: null
      },
      {
        id: 'def-abc-456',
        name: 'Meeting Three',
        owner: {
          id: 1,
          name: 'John Doe'
        },
        last_meeting: {
          start: '2023-08-21 08:18:28:00',
          end: '2023-08-21 08:20:28:00'
        },
        type: {
          id: 2,
          description: 'Meeting',
          color: '#4a5c66',
          default: false
        },
        is_favorite: false,
        short_description: null
      }
    ],
    meta: {
      current_page: 1,
      from: 1,
      last_page: 1,
      per_page: 10,
      to: 5,
      total: 3,
      total_no_filter: 3,
      total_own: 1
    }
  };

  const exampleRoomTypeResponse = {
    data: [
      { id: 1, description: 'Vorlesung', color: '#80BA27', default: false },
      { id: 2, description: 'Meeting', color: '#4a5c66', default: true },
      { id: 3, description: 'Pr\u00fcfung', color: '#9C132E', default: false },
      { id: 4, description: '\u00dcbung', color: '#00B8E4', default: false }
    ]
  };

  it('check list of rooms and attribute bindings', async () => {
    const roomRequest = mockAxios.request('/api/v1/rooms', { filter_own: 1, filter_shared: 1, filter_public: 0, filter_all: 0, only_favorites: 0, sort_by: 'last_started' });
    const roomTypeRequest = mockAxios.request('/api/v1/roomTypes');

    const view = mount(RoomIndex, {
      localVue,
      stubs: {
        'room-skeleton-component': true,
        'room-card-component': true,
        'new-room-component': true
      },
      mocks: {
        $t: (key) => key,
        $d: i18nDateMock
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    await roomRequest.wait();

    // check if overlay is active and buttons disabled during loading
    expect(view.vm.$data.loadingRooms).toBeTruthy();
    expect(view.vm.$data.roomTypesBusy).toBeTruthy();
    expect(view.getComponent(BOverlay).attributes('aria-busy')).toBeTruthy();
    // search
    expect(view.getComponent({ ref: 'search' }).element.disabled).toBeTruthy();
    expect(view.getComponent(BInputGroupAppend).getComponent(BButton).element.disabled).toBeTruthy();
    // dropdown for sorting type
    expect(view.getComponent(BDropdown).getComponent(BButton).element.disabled).toBeTruthy();

    // filter button on small devices
    expect(view.findAllComponents(BButton).at(2).element.disabled).toBeFalsy();
    // favorites button
    expect(view.findAllComponents(BButton).at(3).element.disabled).toBeTruthy();
    // filter checkboxes
    expect(view.findComponent(BFormGroup).exists()).toBeTruthy();
    expect(view.findComponent(BFormGroup).element.disabled).toBeTruthy();
    // room type select
    expect(view.findComponent(BFormSelect).exists()).toBeTruthy();
    expect(view.findComponent(BFormSelect).element.disabled).toBeTruthy();

    // respond with example data to room and roomType request
    await roomRequest.respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    // check if overlay is disabled and buttons active
    expect(view.vm.$data.loadingRooms).toBeFalsy();
    expect(view.vm.$data.roomTypesBusy).toBeTruthy();
    expect(view.getComponent(BOverlay).attributes('aria-busy')).toBeUndefined();
    // search
    expect(view.getComponent({ ref: 'search' }).element.disabled).toBeFalsy();
    expect(view.getComponent(BInputGroupAppend).getComponent(BButton).element.disabled).toBeFalsy();
    // dropdown for sorting type
    expect(view.getComponent(BDropdown).getComponent(BButton).element.disabled).toBeFalsy();
    // filter button on small devices
    expect(view.findAllComponents(BButton).at(2).element.disabled).toBeFalsy();
    // favorites button
    expect(view.findAllComponents(BButton).at(3).element.disabled).toBeFalsy();
    // filter checkboxes
    expect(view.findComponent(BFormGroup).element.disabled).toBeFalsy();
    // room type select
    expect(view.findComponent(BFormSelect).element.disabled).toBeTruthy();

    await roomTypeRequest.respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    expect(view.vm.$data.roomTypesBusy).toBeFalsy();
    expect(view.findComponent(BFormSelect).element.disabled).toBeFalsy();

    await mockAxios.wait();
    await view.vm.$nextTick();

    // check attribute bindings
    const rooms = view.findAllComponents({ name: 'RoomCardComponent' });
    expect(rooms.length).toEqual(3);
    expect(rooms.at(0).props('room').id).toBe('abc-def-123');
    expect(rooms.at(1).props('room').id).toBe('def-abc-123');
    expect(rooms.at(2).props('room').id).toBe('def-abc-456');

    view.destroy();
  });

  it('test newRoom component shown', async () => {
    mockAxios.request('/api/v1/rooms', { filter_own: 1, filter_shared: 1, filter_public: 0, filter_all: 0, only_favorites: 0, sort_by: 'last_started' }).respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomIndex, {
      localVue,
      stubs: {
        'room-skeleton-component': true,
        'room-card-component': true,
        'new-room-component': true
      },
      mocks: {
        $t: (key) => key,
        $d: i18nDateMock
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    const authStore = useAuthStore();

    // check if new room component is shown
    const missingNewRoomComponent = view.findComponent({ name: 'NewRoomComponent' });
    expect(missingNewRoomComponent.exists()).toBeTruthy();

    // check if enabled user has no room limit
    authStore.currentUser.room_limit = -1;
    await view.vm.$nextTick();
    expect(missingNewRoomComponent.props('disabled')).toBeFalsy();

    // check if enabled user has room limit but not reached
    authStore.currentUser.room_limit = 2;
    await view.vm.$nextTick();
    expect(missingNewRoomComponent.props('disabled')).toBeFalsy();

    // check if enabled user has room limit and reached
    authStore.currentUser.room_limit = 1;
    await view.vm.$nextTick();
    expect(missingNewRoomComponent.props('disabled')).toBeTruthy();

    // remove permission to create rooms
    const oldUser = PermissionService.currentUser;
    const newUser = _.cloneDeep(exampleUser);
    newUser.permissions.pop('rooms.create');
    PermissionService.setCurrentUser(newUser);
    await view.vm.$nextTick();

    // check if new room component is not shown
    expect(view.findComponent({ name: 'NewRoomComponent' }).exists()).toBeFalsy();

    PermissionService.setCurrentUser(oldUser);
    view.destroy();
  });

  it('test room limit event', async () => {
    mockAxios.request('/api/v1/rooms', { filter_own: 1, filter_shared: 1, filter_public: 0, filter_all: 0, only_favorites: 0, sort_by: 'last_started' }).respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomIndex, {
      localVue,
      stubs: {
        'room-skeleton-component': true,
        'room-card-component': true,
        'new-room-component': true
      },
      mocks: {
        $t: (key) => key,
        $d: i18nDateMock
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    const authStore = useAuthStore();
    authStore.currentUser.room_limit = 2;

    await mockAxios.wait();
    await view.vm.$nextTick();

    // find current amount of rooms
    let rooms = view.findAllComponents({ name: 'RoomCardComponent' });
    expect(rooms.length).toBe(3);

    // find new room component and fire event
    let newRoomComponent = view.findComponent({ name: 'NewRoomComponent' });
    expect(newRoomComponent.exists()).toBeTruthy();
    let roomRequest = mockAxios.request('/api/v1/rooms');
    newRoomComponent.vm.$emit('limit-reached');

    await roomRequest.wait();
    expect(roomRequest.config.params.page).toBe(1);

    // respond with 3 rooms on 2 different pages
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 'abc-def-123',
            name: 'Meeting One',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 2,

              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: false,
            short_description: 'Own room'
          },
          {
            id: 'abc-def-345',
            name: 'Meeting Two',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 2,
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: false,
            short_description: 'Own room 2'
          }],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 2,
          per_page: 2,
          to: 2,
          total: 3,
          total_no_filter: 3,
          total_own: 2
        }
      }
    });
    await view.vm.$nextTick();

    // check if now two rooms are displayed
    rooms = view.findAllComponents({ name: 'RoomCardComponent' });
    expect(rooms.length).toBe(2);

    // try to find new room component, should be disabled as the limit is reached
    newRoomComponent = view.findComponent({ name: 'NewRoomComponent' });
    expect(newRoomComponent.exists()).toBeTruthy();
    expect(newRoomComponent.props('disabled')).toBeTruthy();

    // find pagination
    const pagination = view.findComponent(BPagination);
    expect(pagination.exists()).toBeTruthy();
    expect(pagination.props('disabled')).toBeFalsy();

    // switch to the next page and make sure that new room component stays disabled
    roomRequest = mockAxios.request('/api/v1/rooms');
    await pagination.findAll('li').at(5).find('button').trigger('click');
    await roomRequest.wait();
    expect(roomRequest.config.params.page).toBe(2);
    expect(newRoomComponent.props('disabled')).toBeTruthy();

    // respond with 1 room on the second page
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 'abc-def-456',
            name: 'Meeting Three',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 2,
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: false,
            short_description: 'Own room'
          }
        ],
        meta: {
          current_page: 2,
          from: 3,
          last_page: 3,
          per_page: 2,
          to: 3,
          total: 3,
          total_no_filter: 3,
          total_own: 2
        }
      }
    });

    // find new room component, check if still disabled even is fewer rooms than the limit are displayed
    newRoomComponent = view.findComponent({ name: 'NewRoomComponent' });
    expect(newRoomComponent.props('disabled')).toBeTruthy();

    // re-trigger limit reached event
    roomRequest = mockAxios.request('/api/v1/rooms');
    newRoomComponent.vm.$emit('limit-reached');

    await roomRequest.wait();

    // make sure that the page stays the same
    expect(roomRequest.config.params.page).toBe(2);

    view.destroy();
  });

  it('test room limit', async () => {
    mockAxios.request('/api/v1/rooms', { filter_own: 1, filter_shared: 1, filter_public: 0, filter_all: 0, only_favorites: 0, sort_by: 'last_started' }).respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomIndex, {
      localVue,
      stubs: {
        'room-skeleton-component': true,
        'room-card-component': true,
        'new-room-component': true
      },
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        $d: i18nDateMock
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    const authStore = useAuthStore();

    await mockAxios.wait();
    await view.vm.$nextTick();

    // hide room count for users without limit
    expect(view.findComponent({ ref: 'room-limit' }).exists()).toBeFalsy();

    // show room count for users with limit
    authStore.currentUser.room_limit = 2;

    await view.vm.$nextTick();
    // check if room limit is shown correct
    expect(view.findComponent({ ref: 'room-limit' }).exists()).toBeTruthy();
    expect(view.findComponent({ ref: 'room-limit' }).text()).toBe('rooms.room_limit:{"has":1,"max":2}');

    // enter search query
    const searchField = view.findComponent({ ref: 'search' });
    await searchField.setValue('test');

    const roomRequest = mockAxios.request('/api/v1/rooms');
    searchField.trigger('change');
    await roomRequest.wait();
    expect(roomRequest.config.params.search).toBe('test');
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 10,
          to: null,
          total: 0,
          total_no_filter: 1,
          total_own: 1
        }
      }
    });

    // check if room count is not based on items on the current page or the total results,
    // but all rooms of the user, independent of the search query
    expect(view.findComponent({ ref: 'room-limit' }).exists()).toBeTruthy();
    expect(view.findComponent({ ref: 'room-limit' }).text()).toBe('rooms.room_limit:{"has":1,"max":2}');

    view.destroy();
  });

  it('test search', async () => {
    mockAxios.request('/api/v1/rooms', { filter_own: 1, filter_shared: 1, filter_public: 0, filter_all: 0, only_favorites: 0, sort_by: 'last_started' }).respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomIndex, {
      localVue,
      stubs: {
        'room-skeleton-component': true,
        'room-card-component': true,
        'new-room-component': true
      },
      mocks: {
        $t: (key) => key,
        $d: i18nDateMock
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // find search field
    let searchField = view.findComponent({ ref: 'search' });
    expect(searchField.exists()).toBeTruthy();

    // enter search query
    await searchField.setValue('test');

    let roomRequest = mockAxios.request('/api/v1/rooms');
    searchField.trigger('change');

    await roomRequest.wait();

    // check if request uses the search string
    expect(roomRequest.config.params.search).toBe('test');

    // respond (no rooms found for this search query)
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 10,
          to: null,
          total: 0,
          total_no_filter: 1,
          total_own: 1
        }
      }
    });

    // check if message shows user that the user has rooms, but none that match the search query
    expect(view.find('em').text()).toBe('rooms.no_rooms_found');

    // check empty list message for user rooms
    searchField = view.findComponent({ ref: 'search' });
    // enter another search query
    await searchField.setValue('test2');

    roomRequest = mockAxios.request('/api/v1/rooms');
    searchField.trigger('change');
    await roomRequest.wait();

    expect(roomRequest.config.params.search).toBe('test2');

    // respond no rooms available
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 10,
          to: null,
          total: 0,
          total_no_filter: 0,
          total_own: 0
        }
      }
    });

    // check if message shows user that there are no rooms available
    expect(view.find('em').text()).toBe('rooms.no_rooms_available');

    // enter another search query
    await searchField.setValue('One');

    roomRequest = mockAxios.request('/api/v1/rooms');
    searchField.trigger('change');
    await roomRequest.wait();

    expect(roomRequest.config.params.search).toBe('One');

    // respond with 2 rooms on 2 pages
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 'abc-def-123',
            name: 'Meeting One',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 2,
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: false,
            short_description: 'Own room'
          }],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 2,
          per_page: 1,
          to: 1,
          total: 2,
          total_no_filter: 3,
          total_own: 1
        }
      }
    });

    // check if room is found
    let rooms = view.findAllComponents({ name: 'RoomCardComponent' });
    expect(rooms.length).toBe(1);
    expect(rooms.at(0).props('room').id).toBe('abc-def-123');

    // test reset of the current page after entering a search query
    // find pagination and switch to the next page
    const pagination = view.findComponent(BPagination);
    expect(pagination.exists()).toBeTruthy();
    expect(pagination.props('disabled')).toBeFalsy();

    const paginationButtons = pagination.findAll('li');
    expect(paginationButtons.at(0).find('button').exists()).toBeFalsy();
    expect(paginationButtons.at(1).find('button').exists()).toBeFalsy();
    expect(paginationButtons.at(2).find('button').exists()).toBeTruthy();
    expect(paginationButtons.at(3).find('button').exists()).toBeTruthy();
    expect(paginationButtons.at(4).find('button').exists()).toBeTruthy();
    expect(paginationButtons.at(5).find('button').exists()).toBeTruthy();

    roomRequest = mockAxios.request('/api/v1/rooms');
    await paginationButtons.at(4).find('button').trigger('click');
    await roomRequest.wait();

    expect(roomRequest.config.params.page).toBe(2);
    expect(roomRequest.config.params.search).toBe('One');

    // respond with room on the second page
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 'abc-def-456',
            name: 'Meeting Two',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 2,
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: false,
            short_description: 'Own room'
          }],
        meta: {
          current_page: 2,
          from: 2,
          last_page: 2,
          per_page: 1,
          to: 2,
          total: 2,
          total_no_filter: 3,
          total_own: 1
        }
      }
    });

    // check if room is changed
    rooms = view.findAllComponents({ name: 'RoomCardComponent' });
    expect(rooms.length).toBe(1);
    expect(rooms.at(0).props('room').id).toBe('abc-def-456');

    // enter search query again and check if page is changed to the first page
    roomRequest = mockAxios.request('/api/v1/rooms');
    searchField.trigger('change');
    await roomRequest.wait();
    expect(roomRequest.config.params.page).toBe(1);
    expect(roomRequest.config.params.search).toBe('One');

    view.destroy();
  });

  it('test sorting', async () => {
    mockAxios.request('/api/v1/rooms', { filter_own: 1, filter_shared: 1, filter_public: 0, filter_all: 0, only_favorites: 0, sort_by: 'last_started' }).respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomIndex, {
      localVue,
      stubs: {
        'room-skeleton-component': true,
        'room-card-component': true,
        'new-room-component': true
      },
      mocks: {
        $t: (key) => key,
        $d: i18nDateMock
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // find dropdown to change sorting
    const sortingDropdown = view.findComponent(BDropdown);
    expect(sortingDropdown.getComponent(BButton).text()).toBe('rooms.index.sorting.last_started');

    // check if the options show
    const sortingDropdownOptions = sortingDropdown.findAllComponents(BDropdownItem);
    expect(sortingDropdownOptions.length).toBe(4);
    expect(sortingDropdownOptions.at(0).text()).toBe('rooms.index.sorting.select_sorting');
    expect(sortingDropdownOptions.at(0).props().disabled).toBeTruthy();
    expect(sortingDropdownOptions.at(1).text()).toBe('rooms.index.sorting.last_started');
    expect(sortingDropdownOptions.at(2).text()).toBe('rooms.index.sorting.alpha');
    expect(sortingDropdownOptions.at(3).text()).toBe('rooms.index.sorting.room_type');

    // click on Dropdown Item to change the sorting to alpha
    let roomRequest = mockAxios.request('/api/v1/rooms');
    sortingDropdownOptions.at(2).get('a').trigger('click');

    await roomRequest.wait();
    expect(roomRequest.config.params.sort_by).toBe('alpha');
    expect(sortingDropdown.getComponent(BButton).text()).toBe('rooms.index.sorting.alpha');
    expect(roomRequest.config.params.page).toBe(1);

    // respond with 3 rooms on 3 different pages
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 'abc-def-123',
            name: 'Meeting One',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 2,
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: false,
            short_description: 'Own room'
          }],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 3,
          per_page: 1,
          to: 1,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    });

    // find pagination and switch to the next page
    const pagination = view.findComponent(BPagination);
    expect(pagination.exists()).toBeTruthy();
    expect(pagination.props('disabled')).toBeFalsy();

    roomRequest = mockAxios.request('/api/v1/rooms');

    // switch to next page and check if sorting stays the same
    await pagination.findAll('li').at(5).find('button').trigger('click');
    await roomRequest.wait();

    expect(roomRequest.config.params.page).toBe(2);
    expect(roomRequest.config.params.sort_by).toBe('alpha');
    expect(sortingDropdown.getComponent(BButton).text()).toBe('rooms.index.sorting.alpha');

    // respond with room on the second page
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 'abc-def-456',
            name: 'Meeting Two',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 2,
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: false,
            short_description: 'Own room'
          }],
        meta: {
          current_page: 2,
          from: 2,
          last_page: 3,
          per_page: 1,
          to: 2,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    });

    // click on Dropdown Item to change the sorting to room type
    roomRequest = mockAxios.request('/api/v1/rooms');
    sortingDropdownOptions.at(3).get('a').trigger('click');

    await roomRequest.wait();
    expect(roomRequest.config.params.sort_by).toBe('room_type');
    expect(sortingDropdown.getComponent(BButton).text()).toBe('rooms.index.sorting.room_type');

    // check if the room page was reset
    expect(roomRequest.config.params.page).toBe(1);

    view.destroy();
  });

  it('test filter without viewAll permission', async () => {
    mockAxios.request('/api/v1/rooms', { filter_own: 1, filter_shared: 1, filter_public: 0, filter_all: 0, only_favorites: 0, sort_by: 'last_started' }).respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomIndex, {
      localVue,
      stubs: {
        'room-skeleton-component': true,
        'room-card-component': true,
        'new-room-component': true
      },
      mocks: {
        $t: (key) => key,
        $d: i18nDateMock
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // find filter checkboxes
    const checkboxes = view.findAllComponents(BFormCheckbox);
    expect(checkboxes.length).toBe(3);

    // make sure that checkboxes are shown correct
    expect(checkboxes.at(0).props('checked')).toBeTruthy();
    expect(checkboxes.at(0).text()).toBe('rooms.index.show_own');
    expect(checkboxes.at(1).props('checked')).toBeTruthy();
    expect(checkboxes.at(1).text()).toBe('rooms.index.show_shared');
    expect(checkboxes.at(2).props('checked')).toBeFalsy();
    expect(checkboxes.at(2).text()).toBe('rooms.index.show_public');

    // trigger checkbox
    let roomRequest = mockAxios.request('/api/v1/rooms');
    checkboxes.at(2).get('input').trigger('click');
    await roomRequest.wait();
    expect(roomRequest.config.params.filter_own).toBeTruthy();
    expect(roomRequest.config.params.filter_shared).toBeTruthy();
    expect(roomRequest.config.params.filter_public).toBeTruthy();
    expect(checkboxes.at(2).props('checked')).toBeTruthy();
    expect(roomRequest.config.params.page).toBe(1);

    // respond with 3 rooms on 3 different pages
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 'abc-def-123',
            name: 'Meeting One',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 2,
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: false,
            short_description: 'Own room'
          }],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 3,
          per_page: 1,
          to: 1,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    });

    // find pagination
    const pagination = view.findComponent(BPagination);
    expect(pagination.exists()).toBeTruthy();
    expect(pagination.props('disabled')).toBeFalsy();

    // switch to the next page and make sure that the filter stays the same
    roomRequest = mockAxios.request('/api/v1/rooms');
    await pagination.findAll('li').at(5).find('button').trigger('click');
    await roomRequest.wait();

    expect(roomRequest.config.params.page).toBe(2);
    expect(roomRequest.config.params.filter_own).toBeTruthy();
    expect(roomRequest.config.params.filter_shared).toBeTruthy();
    expect(roomRequest.config.params.filter_public).toBeTruthy();
    expect(checkboxes.at(2).props('checked')).toBeTruthy();

    // respond with room on the second page
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 'abc-def-456',
            name: 'Meeting Two',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 2,
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: false,
            short_description: 'Own room'
          }],
        meta: {
          current_page: 2,
          from: 2,
          last_page: 3,
          per_page: 1,
          to: 2,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    });

    // trigger another checkbox
    roomRequest = mockAxios.request('/api/v1/rooms');
    checkboxes.at(1).get('input').trigger('click');
    await roomRequest.wait();
    expect(roomRequest.config.params.filter_own).toBeTruthy();
    expect(roomRequest.config.params.filter_shared).toBeFalsy();
    expect(roomRequest.config.params.filter_public).toBeTruthy();
    expect(checkboxes.at(1).props('checked')).toBeFalsy();

    // make sure that the page was reset
    expect(roomRequest.config.params.page).toBe(1);

    view.destroy();
  });

  it('test filter with viewAll permission', async () => {
    const oldUser = PermissionService.currentUser;
    const newUser = _.cloneDeep(exampleUser);
    newUser.permissions.push('rooms.viewAll');
    PermissionService.setCurrentUser(newUser);

    mockAxios.request('/api/v1/rooms', { filter_own: 1, filter_shared: 1, filter_public: 0, filter_all: 0, only_favorites: 0, sort_by: 'last_started' }).respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomIndex, {
      localVue,
      stubs: {
        'room-skeleton-component': true,
        'room-card-component': true,
        'new-room-component': true
      },
      mocks: {
        $t: (key) => key,
        $d: i18nDateMock
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    const checkboxes = view.findAllComponents(BFormCheckbox);
    expect(checkboxes.length).toBe(4);
    // make sure that checkboxes are shown correct
    expect(checkboxes.at(0).props('checked')).toBeTruthy();
    expect(checkboxes.at(0).text()).toBe('rooms.index.show_own');
    expect(checkboxes.at(1).props('checked')).toBeTruthy();
    expect(checkboxes.at(1).text()).toBe('rooms.index.show_shared');
    expect(checkboxes.at(2).props('checked')).toBeFalsy();
    expect(checkboxes.at(2).text()).toBe('rooms.index.show_public');
    expect(checkboxes.at(3).props('checked')).toBeFalsy();
    expect(checkboxes.at(3).text()).toBe('rooms.index.show_all');

    // trigger show all checkbox
    let roomRequest = mockAxios.request('/api/v1/rooms');
    checkboxes.at(3).get('input').trigger('click');
    await roomRequest.wait();
    expect(roomRequest.config.params.filter_own).toBeTruthy();
    expect(roomRequest.config.params.filter_shared).toBeTruthy();
    expect(roomRequest.config.params.filter_public).toBeTruthy();
    expect(roomRequest.config.params.filter_all).toBeTruthy();
    expect(roomRequest.config.params.page).toBe(1);

    // respond with 3 rooms on 3 different pages
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 'abc-def-123',
            name: 'Meeting One',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 2,
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: false,
            short_description: 'Own room'
          }],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 3,
          per_page: 1,
          to: 1,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    });

    // check if all checkboxes are checked
    expect(checkboxes.at(0).props('checked')).toBeTruthy();
    expect(checkboxes.at(1).props('checked')).toBeTruthy();
    expect(checkboxes.at(2).props('checked')).toBeTruthy();
    expect(checkboxes.at(3).props('checked')).toBeTruthy();

    // find pagination
    const pagination = view.findComponent(BPagination);
    expect(pagination.exists()).toBeTruthy();
    expect(pagination.props('disabled')).toBeFalsy();

    // switch to the next page and make sure that the filter stays the same
    roomRequest = mockAxios.request('/api/v1/rooms');
    await pagination.findAll('li').at(5).find('button').trigger('click');
    await roomRequest.wait();

    expect(roomRequest.config.params.page).toBe(2);
    expect(roomRequest.config.params.filter_own).toBeTruthy();
    expect(roomRequest.config.params.filter_shared).toBeTruthy();
    expect(roomRequest.config.params.filter_public).toBeTruthy();
    expect(roomRequest.config.params.filter_all).toBeTruthy();

    // respond with room on the second page
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 'abc-def-456',
            name: 'Meeting Two',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 2,
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: false,
            short_description: 'Own room'
          }],
        meta: {
          current_page: 2,
          from: 2,
          last_page: 3,
          per_page: 1,
          to: 2,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    });

    // check if all checkboxes are checked
    expect(checkboxes.at(0).props('checked')).toBeTruthy();
    expect(checkboxes.at(1).props('checked')).toBeTruthy();
    expect(checkboxes.at(2).props('checked')).toBeTruthy();
    expect(checkboxes.at(3).props('checked')).toBeTruthy();

    // trigger show all checkbox again
    roomRequest = mockAxios.request('/api/v1/rooms');
    checkboxes.at(3).get('input').trigger('click');
    await roomRequest.wait();
    expect(roomRequest.config.params.filter_own).toBeTruthy();
    expect(roomRequest.config.params.filter_shared).toBeTruthy();
    expect(roomRequest.config.params.filter_public).toBeTruthy();
    expect(roomRequest.config.params.filter_all).toBeFalsy();
    // make sure that the page was reset
    expect(roomRequest.config.params.page).toBe(1);

    await roomRequest.respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    // check if all checkboxes are checked
    expect(checkboxes.at(0).props('checked')).toBeTruthy();
    expect(checkboxes.at(1).props('checked')).toBeTruthy();
    expect(checkboxes.at(2).props('checked')).toBeTruthy();
    expect(checkboxes.at(3).props('checked')).toBeFalsy();

    // trigger show all checkbox again and check if all checkboxes are checked
    roomRequest = mockAxios.request('/api/v1/rooms');
    checkboxes.at(3).get('input').trigger('click');
    await roomRequest.wait();
    expect(roomRequest.config.params.filter_own).toBeTruthy();
    expect(roomRequest.config.params.filter_shared).toBeTruthy();
    expect(roomRequest.config.params.filter_public).toBeTruthy();
    expect(roomRequest.config.params.filter_all).toBeTruthy();
    await roomRequest.respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    expect(checkboxes.at(0).props('checked')).toBeTruthy();
    expect(checkboxes.at(1).props('checked')).toBeTruthy();
    expect(checkboxes.at(2).props('checked')).toBeTruthy();
    expect(checkboxes.at(3).props('checked')).toBeTruthy();

    // trigger another checkbox
    roomRequest = mockAxios.request('/api/v1/rooms');
    checkboxes.at(2).get('input').trigger('click');
    await roomRequest.wait();
    expect(roomRequest.config.params.page).toBe(1);
    expect(roomRequest.config.params.filter_own).toBeTruthy();
    expect(roomRequest.config.params.filter_shared).toBeTruthy();
    expect(roomRequest.config.params.filter_public).toBeFalsy();
    expect(roomRequest.config.params.filter_all).toBeFalsy();
    await roomRequest.respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    // check if show all checkbox are unchecked
    expect(checkboxes.at(0).props('checked')).toBeTruthy();
    expect(checkboxes.at(1).props('checked')).toBeTruthy();
    expect(checkboxes.at(2).props('checked')).toBeFalsy();
    expect(checkboxes.at(3).props('checked')).toBeFalsy();

    PermissionService.setCurrentUser(oldUser);
    view.destroy();
  });

  it('test no filter message', async () => {
    mockAxios.request('/api/v1/rooms', { filter_own: 1, filter_shared: 1, filter_public: 0, filter_all: 0, only_favorites: 0, sort_by: 'last_started' }).respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomIndex, {
      localVue,
      stubs: {
        'room-skeleton-component': true,
        'room-card-component': true,
        'new-room-component': true
      },
      mocks: {
        $t: (key) => key,
        $d: i18nDateMock
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // find filter checkboxes
    const checkboxes = view.findAllComponents(BFormCheckbox);
    expect(checkboxes.length).toBe(3);

    // trigger checkboxes
    let roomRequest = mockAxios.request('/api/v1/rooms');
    checkboxes.at(1).get('input').trigger('click');
    await roomRequest.wait();
    expect(roomRequest.config.params.filter_own).toBeTruthy();
    expect(roomRequest.config.params.filter_shared).toBeFalsy();
    expect(roomRequest.config.params.filter_public).toBeFalsy();
    expect(roomRequest.config.params.filter_all).toBeFalsy();
    await roomRequest.respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    checkboxes.at(0).get('input').trigger('click');
    await view.vm.$nextTick();

    // check if all checkboxes are unchecked
    expect(checkboxes.at(0).props('checked')).toBeFalsy();
    expect(checkboxes.at(1).props('checked')).toBeFalsy();
    expect(checkboxes.at(2).props('checked')).toBeFalsy();

    // make sure that the checkboxes are not disabled
    expect(view.findComponent(BFormGroup).element.disabled).toBeFalsy();

    // check if no filter message and reset button are shown
    expect(view.find('em').text()).toBe('rooms.index.no_rooms_selected');
    const resetButton = view.findComponent({ ref: 'reset' });
    expect(resetButton.exists()).toBeTruthy();
    expect(resetButton.text()).toBe('rooms.index.reset_filter');
    expect(resetButton.element.disabled).toBeFalsy();

    // trigger reset button
    roomRequest = mockAxios.request('/api/v1/rooms');
    await resetButton.trigger('click');
    await roomRequest.wait();
    expect(roomRequest.config.params.filter_own).toBeTruthy();
    expect(roomRequest.config.params.filter_shared).toBeTruthy();
    expect(roomRequest.config.params.filter_public).toBeFalsy();
    expect(roomRequest.config.params.filter_all).toBeFalsy();
    await roomRequest.respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    // check if checkboxes are reset
    expect(checkboxes.at(0).props('checked')).toBeTruthy();
    expect(checkboxes.at(1).props('checked')).toBeTruthy();
    expect(checkboxes.at(2).props('checked')).toBeFalsy();

    view.destroy();
  });

  it('test filter room type', async () => {
    mockAxios.request('/api/v1/rooms', { filter_own: 1, filter_shared: 1, filter_public: 0, filter_all: 0, only_favorites: 0, sort_by: 'last_started' }).respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomIndex, {
      localVue,
      stubs: {
        'room-skeleton-component': true,
        'room-card-component': true,
        'new-room-component': true
      },
      mocks: {
        $t: (key) => key,
        $d: i18nDateMock
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // find room type select and check if it is shown correctly
    const select = view.findComponent(BFormSelect);
    expect(select.element.value).toBe('');
    const selectOptions = select.findAllComponents(BFormSelectOption);
    expect(selectOptions.length).toBe(6);
    // make sure select options are shown correctly
    expect(selectOptions.at(0).element.value).toBe('-1');
    expect(selectOptions.at(0).text()).toBe('rooms.room_types.select_type');
    expect(selectOptions.at(0).attributes().disabled).toBeTruthy();
    expect(selectOptions.at(1).element.value).toBe('');
    expect(selectOptions.at(1).text()).toBe('rooms.room_types.all');
    expect(selectOptions.at(2).element.value).toBe('1');
    expect(selectOptions.at(2).text()).toBe('Vorlesung');
    expect(selectOptions.at(3).element.value).toBe('2');
    expect(selectOptions.at(3).text()).toBe('Meeting');
    expect(selectOptions.at(4).element.value).toBe('3');
    expect(selectOptions.at(4).text()).toBe('Pr\u00fcfung');
    expect(selectOptions.at(5).element.value).toBe('4');
    expect(selectOptions.at(5).text()).toBe('\u00dcbung');

    // change select option
    let roomRequest = mockAxios.request('/api/v1/rooms');
    await select.setValue('2');
    await roomRequest.wait;

    expect(roomRequest.config.params.room_type).toBe(2);
    expect(roomRequest.config.params.page).toBe(1);
    expect(select.element.value).toBe('2');

    // respond with 3 rooms on 3 different pages
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 'abc-def-123',
            name: 'Meeting One',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 2,
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: false,
            short_description: 'Own room'
          }],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 3,
          per_page: 1,
          to: 1,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    });

    // find pagination
    const pagination = view.findComponent(BPagination);
    expect(pagination.exists()).toBeTruthy();
    expect(pagination.props('disabled')).toBeFalsy();

    // switch to the next page and make sure that the room type stays the same
    roomRequest = mockAxios.request('/api/v1/rooms');
    await pagination.findAll('li').at(5).find('button').trigger('click');
    await roomRequest.wait();

    expect(roomRequest.config.params.page).toBe(2);
    expect(roomRequest.config.params.room_type).toBe(2);

    // respond with room on the second page
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 'abc-def-456',
            name: 'Meeting Two',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 2,
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: false,
            short_description: 'Own room'
          }],
        meta: {
          current_page: 2,
          from: 2,
          last_page: 3,
          per_page: 1,
          to: 2,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    });

    // change select option again
    roomRequest = mockAxios.request('/api/v1/rooms');
    await select.setValue('3');
    await roomRequest.wait;

    expect(roomRequest.config.params.room_type).toBe(3);
    expect(select.element.value).toBe('3');
    // make sure that the page was reset
    expect(roomRequest.config.params.page).toBe(1);

    // respond no rooms found for this room type
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 10,
          to: null,
          total: 0,
          total_no_filter: 3,
          total_own: 1
        }
      }
    });

    // check if message shows user that the user has rooms, but none that match the search query
    expect(view.find('em').text()).toBe('rooms.no_rooms_found');

    // change select option again
    roomRequest = mockAxios.request('/api/v1/rooms');
    await select.setValue('2');
    await roomRequest.wait;

    expect(roomRequest.config.params.room_type).toBe(2);
    expect(select.element.value).toBe('2');
    expect(roomRequest.config.params.page).toBe(1);

    // respond no rooms available
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 10,
          to: null,
          total: 0,
          total_no_filter: 0,
          total_own: 1
        }
      }
    });

    // check if message shows user that there are no rooms available
    expect(view.find('em').text()).toBe('rooms.no_rooms_available');

    view.destroy();
  });

  it('test show favorites', async () => {
    mockAxios.request('/api/v1/rooms', { filter_own: 1, filter_shared: 1, filter_public: 0, filter_all: 0, only_favorites: 0, sort_by: 'last_started' }).respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomIndex, {
      localVue,
      stubs: {
        'room-skeleton-component': true,
        'room-card-component': true,
        'new-room-component': true
      },
      mocks: {
        $t: (key) => key,
        $d: i18nDateMock
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // find favorites button and check if it is shown correct
    const favoritesButton = view.findAllComponents(BButton).at(3);
    expect(favoritesButton.html()).toContain('fa-star');
    expect(favoritesButton.element.disabled).toBeFalsy();
    // check if filter options are not disabled
    // filter checkboxes
    expect(view.findComponent(BFormGroup).element.disabled).toBeFalsy();
    // room type select and button to reload room types
    expect(view.findComponent(BFormSelect).element.disabled).toBeFalsy();
    expect(view.findAllComponents(BInputGroupAppend).at(1).getComponent(BButton).element.disabled).toBeFalsy();

    // trigger favorites button
    let roomRequest = mockAxios.request('/api/v1/rooms');
    favoritesButton.trigger('click');
    await roomRequest.wait();

    expect(roomRequest.config.params.only_favorites).toBeTruthy();
    expect(roomRequest.config.params.page).toBe(1);

    // respond with 3 rooms on 3 different pages
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 'abc-def-123',
            name: 'Meeting One',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 2,
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: true,
            short_description: 'Own room'
          }],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 3,
          per_page: 1,
          to: 1,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    });

    // check if filter options are disabled
    // filter checkboxes
    expect(view.findComponent(BFormGroup).element.disabled).toBeTruthy();
    // room type select and button to reload room types
    expect(view.findComponent(BFormSelect).element.disabled).toBeTruthy();
    expect(view.findAllComponents(BInputGroupAppend).at(1).getComponent(BButton).element.disabled).toBeTruthy();

    // find pagination
    const pagination = view.findComponent(BPagination);
    expect(pagination.exists()).toBeTruthy();
    expect(pagination.props('disabled')).toBeFalsy();

    // switch to the next page and make sure that only_favorites stays the same
    roomRequest = mockAxios.request('/api/v1/rooms');
    await pagination.findAll('li').at(5).find('button').trigger('click');
    await roomRequest.wait();
    expect(roomRequest.config.params.page).toBe(2);
    expect(roomRequest.config.params.only_favorites).toBeTruthy();

    // respond with room on the second page
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 'abc-def-456',
            name: 'Meeting Two',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 2,
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: true,
            short_description: 'Own room'
          }],
        meta: {
          current_page: 2,
          from: 2,
          last_page: 3,
          per_page: 1,
          to: 2,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    });

    // trigger favorites button again
    roomRequest = mockAxios.request('/api/v1/rooms');
    favoritesButton.trigger('click');
    await roomRequest.wait();

    expect(roomRequest.config.params.only_favorites).toBeFalsy();
    // make sure that the page was reset
    expect(roomRequest.config.params.page).toBe(1);

    await roomRequest.respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    // check if filter options are disabled
    // filter checkboxes
    expect(view.findComponent(BFormGroup).element.disabled).toBeFalsy();
    // room type select and button to reload room types
    expect(view.findComponent(BFormSelect).element.disabled).toBeFalsy();
    expect(view.findAllComponents(BInputGroupAppend).at(1).getComponent(BButton).element.disabled).toBeFalsy();

    // trigger favorites button again and respond without rooms
    roomRequest = mockAxios.request('/api/v1/rooms');
    favoritesButton.trigger('click');
    await roomRequest.wait();

    expect(roomRequest.config.params.only_favorites).toBeTruthy();
    expect(roomRequest.config.params.page).toBe(1);

    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 10,
          to: null,
          total: 0,
          total_no_filter: 0,
          total_own: 1
        }
      }
    });

    // check if no favorites message is shown
    expect(view.find('em').text()).toBe('rooms.index.no_favorites');

    view.destroy();
  });

  it('test trigger favorites', async () => {
    mockAxios.request('/api/v1/rooms', { filter_own: 1, filter_shared: 1, filter_public: 0, filter_all: 0, only_favorites: 0, sort_by: 'last_started' }).respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomIndex, {
      localVue,
      stubs: {
        'room-skeleton-component': true,
        'room-card-component': true,
        'new-room-component': true
      },
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        $d: i18nDateMock
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // find rooms
    let rooms = view.findAllComponents({ name: 'RoomCardComponent' });
    expect(rooms.length).toBe(3);

    // fire event and check if rooms are reload
    let roomRequest = mockAxios.request('/api/v1/rooms');
    rooms.at(0).vm.$emit('favorites-changed');
    await roomRequest.wait();
    expect(roomRequest.config.params.page).toBe(1);
    // respond with 3 rooms on 3 different pages
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 'abc-def-123',
            name: 'Meeting One',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 2,
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: true,
            short_description: 'Own room'
          }],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 3,
          per_page: 1,
          to: 1,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    });
    // find pagination
    const pagination = view.findComponent(BPagination);
    expect(pagination.exists()).toBeTruthy();
    expect(pagination.props('disabled')).toBeFalsy();

    // switch to the next page
    roomRequest = mockAxios.request('/api/v1/rooms');
    await pagination.findAll('li').at(5).find('button').trigger('click');
    await roomRequest.wait();
    expect(roomRequest.config.params.page).toBe(2);

    // respond with room on the second page
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 'abc-def-456',
            name: 'Meeting One',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 2,
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: true,
            short_description: 'Own room'
          }],
        meta: {
          current_page: 2,
          from: 2,
          last_page: 3,
          per_page: 1,
          to: 2,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    });

    // fire event for another room and check if rooms are reload
    roomRequest = mockAxios.request('/api/v1/rooms');
    rooms = view.findAllComponents({ name: 'RoomCardComponent' });
    rooms.at(0).vm.$emit('favorites-changed');
    await roomRequest.wait();
    // make sure that the page stay the same
    expect(roomRequest.config.params.page).toBe(2);

    view.destroy();
  });

  it('test trigger favorites only show favorites', async () => {
    mockAxios.request('/api/v1/rooms', { filter_own: 1, filter_shared: 1, filter_public: 0, filter_all: 0, only_favorites: 0, sort_by: 'last_started' }).respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomIndex, {
      localVue,
      stubs: {
        'room-skeleton-component': true,
        'room-card-component': true,
        'new-room-component': true
      },
      mocks: {
        $t: (key) => key,
        $d: i18nDateMock
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // find favorites button and check if it is shown correct
    const favoritesButton = view.findAllComponents(BButton).at(3);
    expect(favoritesButton.html()).toContain('fa-star');
    expect(favoritesButton.element.disabled).toBeFalsy();

    // trigger favorites button
    let roomRequest = mockAxios.request('/api/v1/rooms');
    favoritesButton.trigger('click');
    await roomRequest.wait();

    expect(roomRequest.config.params.only_favorites).toBeTruthy();
    expect(roomRequest.config.params.page).toBe(1);

    await roomRequest.respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    // find rooms
    let rooms = view.findAllComponents({ name: 'RoomCardComponent' });
    expect(rooms.length).toBe(3);

    // fire event and check if rooms are reload and page and only_favorites stay the same
    roomRequest = mockAxios.request('/api/v1/rooms');
    rooms.at(1).vm.$emit('favorites-changed');
    await roomRequest.wait();
    expect(roomRequest.config.params.page).toBe(1);
    expect(roomRequest.config.params.only_favorites).toBeTruthy();

    // respond with 4 rooms on 2 different pages
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 'abc-def-123',
            name: 'Meeting One',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 2,
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: true,
            short_description: 'Own room'
          },
          {
            id: 'def-abc-123',
            name: 'Meeting Two',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: {
              start: '2023-08-21 08:18:28:00',
              end: null
            },
            type: {
              id: 2,
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: true,
            short_description: null
          }],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 2,
          per_page: 2,
          to: 2,
          total: 4,
          total_no_filter: 4,
          total_own: 1
        }
      }
    });

    // find pagination
    const pagination = view.findComponent(BPagination);
    expect(pagination.exists()).toBeTruthy();
    expect(pagination.props('disabled')).toBeFalsy();

    // switch to the next page and make sure that only_favorites stays the same
    roomRequest = mockAxios.request('/api/v1/rooms');
    await pagination.findAll('li').at(5).find('button').trigger('click');
    await roomRequest.wait();
    expect(roomRequest.config.params.page).toBe(2);
    expect(roomRequest.config.params.only_favorites).toBeTruthy();

    // respond with 2 rooms on the second page
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 'abc-def-456',
            name: 'Meeting Three',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 2,
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: true,
            short_description: 'Own room'
          },
          {
            id: 'def-abc-456',
            name: 'Meeting Four',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: {
              start: '2023-08-21 08:18:28:00',
              end: '2023-08-21 08:20:28:00'
            },
            type: {
              id: 2,
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: true,
            short_description: null
          }],
        meta: {
          current_page: 2,
          from: 3,
          last_page: 2,
          per_page: 2,
          to: 4,
          total: 4,
          total_no_filter: 4,
          total_own: 1
        }
      }
    });

    // find rooms
    rooms = view.findAllComponents({ name: 'RoomCardComponent' });
    expect(rooms.length).toBe(2);

    // fire event and check if rooms are reload and page and only_favorites stay the same
    roomRequest = mockAxios.request('/api/v1/rooms');
    rooms.at(1).vm.$emit('favorites-changed');
    await roomRequest.wait();
    expect(roomRequest.config.params.page).toBe(2);
    expect(roomRequest.config.params.only_favorites).toBeTruthy();

    // respond with 1 rooms on the second page
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 'abc-def-456',
            name: 'Meeting Three',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 2,
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: true,
            short_description: 'Own room'
          }],
        meta: {
          current_page: 2,
          from: 3,
          last_page: 2,
          per_page: 2,
          to: 3,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    });

    // find room
    rooms = view.findAllComponents({ name: 'RoomCardComponent' });
    expect(rooms.length).toBe(1);

    // fire event and check if rooms are reload
    roomRequest = mockAxios.request('/api/v1/rooms');
    const secondRoomRequest = mockAxios.request('/api/v1/rooms');
    rooms.at(0).vm.$emit('favorites-changed');
    await roomRequest.wait();
    // reload with no rooms on the second page
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [],
        meta: {
          current_page: 2,
          from: null,
          last_page: 1,
          per_page: 2,
          to: null,
          total: 2,
          total_no_filter: 2,
          total_own: 1
        }
      }
    });
    // check if the rooms get reload again with the last page
    await secondRoomRequest.wait();
    // make sure page is reset and only_favorites stays the same
    expect(secondRoomRequest.config.params.page).toBe(1);
    expect(secondRoomRequest.config.params.only_favorites).toBeTruthy();

    view.destroy();
  });

  it('error loading rooms', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    // respond with server error for room load
    mockAxios.request('/api/v1/rooms', { filter_own: 1, filter_shared: 1, filter_public: 0, filter_all: 0, only_favorites: 0, sort_by: 'last_started' }).respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomIndex, {
      localVue,
      stubs: {
        'room-skeleton-component': true,
        'room-card-component': true,
        'new-room-component': true
      },
      mocks: {
        $t: (key) => key,
        $d: i18nDateMock
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // check if error message, overlay and reload button are shown
    expect(spy).toBeCalledTimes(1);
    expect(view.getComponent(BOverlay).attributes('aria-busy')).toBeTruthy();
    let reloadButton = view.findComponent({ ref: 'reload' });
    expect(reloadButton.exists()).toBeTruthy();
    expect(reloadButton.element.disabled).toBeFalsy();

    // check if room skeleton components are shown
    expect(view.findAllComponents({ name: 'RoomSkeletonComponent' }).length).toBe(3);

    // check if buttons are not disabled
    // search
    expect(view.getComponent({ ref: 'search' }).element.disabled).toBeFalsy();
    expect(view.getComponent(BInputGroupAppend).getComponent(BButton).element.disabled).toBeFalsy();
    // dropdown for sorting type
    expect(view.getComponent(BDropdown).getComponent(BButton).element.disabled).toBeFalsy();
    // filter button on small devices
    expect(view.findAllComponents(BButton).at(3).element.disabled).toBeFalsy();
    // favorites button
    expect(view.findAllComponents(BButton).at(4).element.disabled).toBeFalsy();
    // filter checkboxes
    expect(view.findComponent(BFormGroup).element.disabled).toBeFalsy();
    // room type select
    expect(view.findComponent(BFormSelect).element.disabled).toBeFalsy();

    // trigger reload button
    let roomRequest = mockAxios.request('/api/v1/rooms');
    let roomTypeRequest = mockAxios.request('/api/v1/roomTypes');
    await reloadButton.trigger('click');
    await roomRequest.wait();
    expect(roomRequest.config.params.page).toBe(1);
    await roomTypeRequest.wait();

    // respond with 3 rooms on 3 different pages
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 'abc-def-123',
            name: 'Meeting One',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: null,
            type: {
              id: 2,
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: false,
            short_description: 'Own room'
          }],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 3,
          per_page: 1,
          to: 1,
          total: 3,
          total_no_filter: 3,
          total_own: 1
        }
      }
    });

    await roomTypeRequest.respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });
    await view.vm.$nextTick();

    // check if overlay is disabled
    expect(view.getComponent(BOverlay).attributes('aria-busy')).toBeUndefined();
    reloadButton = view.findComponent({ ref: 'reload' });
    expect(reloadButton.exists()).toBeFalsy();
    expect(view.findAllComponents({ name: 'RoomCardComponent' }).length).toBe(1);

    // check if buttons are not disabled
    // search
    expect(view.getComponent({ ref: 'search' }).element.disabled).toBeFalsy();
    expect(view.getComponent(BInputGroupAppend).getComponent(BButton).element.disabled).toBeFalsy();
    // dropdown for sorting type
    expect(view.getComponent(BDropdown).getComponent(BButton).element.disabled).toBeFalsy();
    // filter button on small devices
    expect(view.findAllComponents(BButton).at(3).element.disabled).toBeFalsy();
    // favorites button
    expect(view.findAllComponents(BButton).at(4).element.disabled).toBeFalsy();
    // filter checkboxes
    expect(view.findComponent(BFormGroup).element.disabled).toBeFalsy();
    // room type select
    expect(view.findComponent(BFormSelect).element.disabled).toBeFalsy();

    // find pagination
    const pagination = view.findComponent(BPagination);
    expect(pagination.exists()).toBeTruthy();
    expect(pagination.props('disabled')).toBeFalsy();

    // switch to next page
    roomRequest = mockAxios.request('/api/v1/rooms');
    await pagination.findAll('li').at(5).find('button').trigger('click');
    await roomRequest.wait();

    expect(roomRequest.config.params.page).toBe(2);

    // respond with error
    await roomRequest.respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    reloadButton = view.findComponent({ ref: 'reload' });
    expect(reloadButton.exists()).toBeTruthy();

    // trigger reload button
    roomRequest = mockAxios.request('/api/v1/rooms');
    roomTypeRequest = mockAxios.request('/api/v1/roomTypes');
    await reloadButton.trigger('click');
    await roomRequest.wait();
    // make sure that the page stays the same
    expect(roomRequest.config.params.page).toBe(2);
    await roomTypeRequest.wait();

    view.destroy();
  });

  it('error loading room types', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    // respond with server error for room type load
    mockAxios.request('/api/v1/rooms', { filter_own: 1, filter_shared: 1, filter_public: 0, filter_all: 0, only_favorites: 0, sort_by: 'last_started' }).respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    const view = mount(RoomIndex, {
      localVue,
      stubs: {
        'room-skeleton-component': true,
        'room-card-component': true,
        'new-room-component': true
      },
      mocks: {
        $t: (key) => key,
        $d: i18nDateMock
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // check if error message is shown
    expect(spy).toBeCalledTimes(1);

    // test if input group is shown correctly
    let inputGroupPrepend = view.findComponent(BInputGroupPrepend);
    expect(inputGroupPrepend.exists()).toBeTruthy();
    expect(inputGroupPrepend.findComponent(BAlert).text()).toBe('rooms.room_types.loading_error');
    expect(view.findComponent(BFormSelect).exists()).toBeFalsy();
    const reloadRoomTypesButton = view.findAllComponents(BInputGroupAppend).at(1).getComponent(BButton);
    expect(reloadRoomTypesButton.element.disabled).toBeFalsy();

    // trigger reload room types button
    const roomTypeRequest = mockAxios.request('/api/v1/roomTypes');
    await reloadRoomTypesButton.trigger('click');
    await roomTypeRequest.wait();
    expect(reloadRoomTypesButton.element.disabled).toBeTruthy();

    await roomTypeRequest.respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });
    await view.vm.$nextTick();

    inputGroupPrepend = view.findComponent(BInputGroupPrepend);
    expect(inputGroupPrepend.exists()).toBeFalsy();
    expect(reloadRoomTypesButton.element.disabled).toBeFalsy();
    expect(view.findComponent(BFormSelect).exists()).toBeTruthy();

    view.destroy();
  });
});
