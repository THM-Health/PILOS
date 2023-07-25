import { mount } from '@vue/test-utils';
import RoomList from '../../../../resources/js/views/rooms/Index.vue';
import {
  BButton,
  BCol, BFormInput,
  BListGroupItem,
  BOverlay,
  BPagination,
  BSpinner
} from 'bootstrap-vue';

import VueRouter from 'vue-router';
import _ from 'lodash';
import PermissionService from '../../../../resources/js/services/PermissionService';
import Base from '../../../../resources/js/api/base';
import { mockAxios, createContainer, createLocalVue } from '../../helper';
import RoomStatusComponent from '../../../../resources/js/components/Room/RoomStatusComponent.vue';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

const localVue = createLocalVue();
localVue.use(VueRouter);
localVue.use(PiniaVuePlugin);

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], model_name: 'User', room_limit: -1 };

describe('Room Index', () => {
  beforeEach(() => {
    mockAxios.reset();
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
          id: 2,
          name: 'Max Doe'
        },
        running: true,
        type: {
          id: 1,
          short: 'VL',
          description: 'Vorlesung',
          color: '#80BA27',
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
      total: 2
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

  it('show different heading depending on permission', async () => {
    const oldUser = PermissionService.currentUser;

    mockAxios.request('/api/v1/rooms').respondWith({
      status: 200,
      data: exampleRoomResponse
    });
    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      attachTo: createContainer()
    });

    // user without view all permissions
    await view.vm.$nextTick();
    expect(view.findAll('h2').at(0).text()).toEqual('rooms.find_rooms');

    // user with view all permission
    const newUser = _.cloneDeep(exampleUser);
    newUser.permissions = ['rooms.viewAll'];
    PermissionService.setCurrentUser(newUser);
    await view.vm.$nextTick();
    expect(view.findAll('h2').at(0).text()).toEqual('rooms.all_rooms');

    PermissionService.setCurrentUser(oldUser);
    view.destroy();
  });

  it('load rooms, load room types and open room', async () => {
    const oldUser = PermissionService.currentUser;

    const spy = vi.fn();
    const router = new VueRouter();
    router.push = spy;

    const roomRequest = mockAxios.request('/api/v1/rooms');
    const roomTypeRequest = mockAxios.request('/api/v1/roomTypes');

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia(),
      router,
      attachTo: createContainer()
    });

    await roomRequest.wait();

    // check if spinners are active and buttons disabled during loading
    expect(view.vm.$data.isBusy).toBeTruthy();
    expect(view.vm.$data.roomTypesBusy).toBeTruthy();
    expect(view.findAllComponents(BSpinner).length).toEqual(2);
    expect(view.findComponent(BPagination).props('disabled')).toBeTruthy();
    expect(view.findAllComponents(BButton).at(0).attributes('disabled')).toBeTruthy();
    expect(view.findAllComponents(BButton).at(1).text()).toEqual('rooms.filter.apply');
    expect(view.findAllComponents(BButton).at(1).attributes('disabled')).toBeTruthy();

    // respond with example data to room and roomType requests
    await roomRequest.respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    await roomTypeRequest.respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });
    await roomTypeRequest.wait();

    // check if spinners are disabled and buttons active
    await view.vm.$nextTick();
    expect(view.vm.$data.isBusy).toBeFalsy();
    expect(view.vm.$data.roomTypesBusy).toBeFalsy();
    expect(view.findComponent(BPagination).props('disabled')).toBeFalsy();
    expect(view.findAllComponents(BButton).at(0).attributes('disabled')).toBeUndefined();
    expect(view.findAllComponents(BButton).at(1).attributes('disabled')).toBeUndefined();
    expect(view.findAllComponents(BSpinner).length).toEqual(0);

    // check rooms appear in the list
    const rooms = view.findAllComponents(BListGroupItem);
    expect(rooms.length).toEqual(2);

    expect(rooms.at(0).get('h5').text()).toEqual('Meeting One');
    expect(rooms.at(0).get('small').text()).toEqual('John Doe');
    expect(rooms.at(0).get('.room-icon').text()).toEqual('ME');
    expect(rooms.at(0).findComponent(RoomStatusComponent).props('running')).toBeFalsy();

    expect(rooms.at(1).get('h5').text()).toEqual('Meeting Two');
    expect(rooms.at(1).get('small').text()).toEqual('Max Doe');
    expect(rooms.at(1).get('.room-icon').text()).toEqual('VL');
    expect(rooms.at(1).findComponent(RoomStatusComponent).props('running')).toBeTruthy();

    // check if all room types are shown
    const roomTypes = view.findAll('[name="room-types-checkbox"]');
    expect(roomTypes.length).toEqual(4);
    expect(roomTypes.at(0).element.parentElement.children[1].children[0].innerHTML).toEqual('Vorlesung');
    expect(roomTypes.at(1).element.parentElement.children[1].children[0].innerHTML).toEqual('Meeting');
    expect(roomTypes.at(2).element.parentElement.children[1].children[0].innerHTML).toEqual('Pr\u00fcfung');
    expect(roomTypes.at(3).element.parentElement.children[1].children[0].innerHTML).toEqual('\u00dcbung');

    // open a room
    await rooms.at(1).trigger('click');
    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith({ name: 'rooms.view', params: { id: 'abc-def-345' } });

    // check if opening another is prohibited while the other room is opening
    await rooms.at(0).trigger('click');
    expect(spy).toBeCalledTimes(1);

    PermissionService.setCurrentUser(oldUser);
    view.destroy();
  });

  it('error loading rooms', async () => {
    const oldUser = PermissionService.currentUser;

    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    // respond with server error for room load
    mockAxios.request('/api/v1/rooms').respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });
    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // check buttons and input fields are disabled after an error occurred
    expect(view.findComponent(BFormInput).props('disabled')).toBeTruthy();
    expect(view.findComponent(BPagination).props('disabled')).toBeTruthy();
    expect(view.findAllComponents(BButton).at(0).attributes('disabled')).toBeTruthy();
    expect(view.findAllComponents(BButton).at(1).text()).toEqual('rooms.filter.apply');
    expect(view.findAllComponents(BButton).at(1).attributes('disabled')).toBeTruthy();

    // check if error message is shown
    expect(spy).toBeCalledTimes(1);

    const request = mockAxios.request('/api/v1/rooms');

    // check if reload button is shown and if a click reloads the resource
    const reloadButton = view.findAllComponents(BCol).at(3).findComponent(BOverlay).findComponent(BButton);
    expect(reloadButton.text()).toEqual('app.reload');
    await reloadButton.trigger('click');

    await request.wait();
    // restore valid response
    await request.respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    // check if all rooms are shown and the buttons/input fields are active
    expect(view.findAllComponents(BListGroupItem).length).toEqual(2);
    expect(view.findComponent(BFormInput).props('disabled')).toBeFalsy();
    expect(view.findComponent(BPagination).props('disabled')).toBeFalsy();
    expect(view.findAllComponents(BButton).at(0).attributes('disabled')).toBeFalsy();
    expect(view.findAllComponents(BButton).at(1).attributes('disabled')).toBeFalsy();

    PermissionService.setCurrentUser(oldUser);
    view.destroy();
  });

  it('error loading room types', async () => {
    const oldUser = PermissionService.currentUser;

    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    // respond with server error for room type load
    mockAxios.request('/api/v1/rooms').respondWith({
      status: 200,
      data: exampleRoomResponse
    });
    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // check apply filter button disabled after an error occurred
    expect(view.findAllComponents(BButton).at(2).text()).toEqual('rooms.filter.apply');
    expect(view.findAllComponents(BButton).at(2).attributes('disabled')).toBeTruthy();

    // check if error message is shown
    expect(spy).toBeCalledTimes(1);

    const request = mockAxios.request('/api/v1/roomTypes');

    // check if reload button is shown and if a click reloads the resource
    const reloadButton = view.findAllComponents(BCol).at(2).findComponent(BOverlay).findComponent(BButton);
    expect(reloadButton.text()).toEqual('app.reload');
    await reloadButton.trigger('click');

    await request.wait();
    // restore valid response
    await request.respondWith({ status: 200, data: exampleRoomTypeResponse });

    // check if all room types are shown and the apply filter button is active
    const roomTypes = view.findAll('[name="room-types-checkbox"]');
    expect(roomTypes.length).toEqual(4);
    expect(view.findAllComponents(BButton).at(1).text()).toEqual('rooms.filter.apply');
    expect(view.findAllComponents(BButton).at(1).attributes('disabled')).toBeFalsy();

    PermissionService.setCurrentUser(oldUser);
    view.destroy();
  });

  it('search and filter rooms', async () => {
    const oldUser = PermissionService.currentUser;

    mockAxios.request('/api/v1/rooms').respondWith({
      status: 200,
      data: exampleRoomResponse
    });
    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // enter search query
    await view.findComponent(BFormInput).setValue('Meeting');

    let request = mockAxios.request('/api/v1/rooms');

    await view.findComponent(BButton).trigger('click');

    // check if new request with the search query is send
    await request.wait();
    expect(request.config.params).toEqual({ page: 1, search: 'Meeting', room_types: [] });
    await request.respondWith({
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
          total: 1
        }
      }
    });

    // check if room list was updated
    await view.vm.$nextTick();
    const rooms = view.findAllComponents(BListGroupItem);
    expect(rooms.length).toEqual(1);
    expect(rooms.at(0).get('h5').text()).toEqual('Meeting One');
    expect(rooms.at(0).get('small').text()).toEqual('John Doe');
    expect(rooms.at(0).get('.room-icon').text()).toEqual('ME');

    // check if no room info is missing
    expect(view.find('em').exists()).toBeFalsy();

    // find room type checkboxes and select two
    const roomTypes = view.findAll('[name="room-types-checkbox"]');
    expect(roomTypes.length).toEqual(4);
    await roomTypes.at(0).setChecked(true);
    await roomTypes.at(2).setChecked(true);

    // find apply filter button and click to apply filter
    const applyFilter = view.findAllComponents(BButton).at(1);
    expect(applyFilter.text()).toEqual('rooms.filter.apply');

    request = mockAxios.request('/api/v1/rooms');

    await applyFilter.trigger('click');

    await request.wait();
    // check if the search query and the room filter are send, respond with no rooms found
    expect(request.config.params).toEqual({ page: 1, search: 'Meeting', room_types: [1, 3] });
    await request.respondWith({
      status: 200,
      data: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 10,
          to: null,
          total: 0
        }
      }
    });

    // check if room list is empty and noRoomsAvailable message is shown
    await view.vm.$nextTick();
    expect(view.findAllComponents(BListGroupItem).length).toEqual(0);
    expect(view.find('em').text()).toEqual('rooms.no_rooms_available');

    PermissionService.setCurrentUser(oldUser);
    view.destroy();
  });

  it('sends request to list all rooms if user has rooms.viewAll permission', async () => {
    const oldUser = PermissionService.currentUser;

    const newUser = _.cloneDeep(exampleUser);
    newUser.permissions = ['rooms.viewAll'];
    PermissionService.setCurrentUser(newUser);

    const roomRequest = mockAxios.request('/api/v1/rooms');
    const roomTypeRequest = mockAxios.request('/api/v1/roomTypes');

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await roomRequest.wait();
    // respond with demo content to the rooms and roomTypes requests
    await roomRequest.respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    await roomTypeRequest.wait();
    expect(roomTypeRequest.config.params).toBeUndefined();
    await roomRequest.respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    PermissionService.setCurrentUser(oldUser);
    view.destroy();
  });

  it('sends request to list all rooms if user has not rooms.viewAll permission', async () => {
    const roomRequest = mockAxios.request('/api/v1/rooms');
    const roomTypeRequest = mockAxios.request('/api/v1/roomTypes');

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await roomRequest.wait();
    // respond with demo content to the rooms and roomTypes requests
    await roomRequest.respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    await roomTypeRequest.wait();
    expect(roomTypeRequest.config.params).toStrictEqual({ filter: 'searchable' });
    await roomTypeRequest.respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    view.destroy();
  });
});
