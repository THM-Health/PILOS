import { createLocalVue, mount } from '@vue/test-utils';
import RoomList from '../../../../resources/js/views/rooms/Index';
import BootstrapVue, {
  BButton,
  BCol, BFormInput,
  BListGroupItem,
  BOverlay,
  BPagination,
  BSpinner
} from 'bootstrap-vue';
import moxios from 'moxios';
import sinon from 'sinon';
import VueRouter from 'vue-router';
import _ from 'lodash';
import Vuex from 'vuex';
import PermissionService from '../../../../resources/js/services/PermissionService';
import Base from '../../../../resources/js/api/base';
import {waitMoxios} from "../../helper";

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(VueRouter);
localVue.use(Vuex);

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], model_name: 'User', room_limit: -1 };

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
        settings: () => (setting) => null
      },
      mutations: {
        setCurrentUser (state, currentUser) {
          PermissionService.setCurrentUser(currentUser);
          state.currentUser = currentUser;
        }
      }
    }
  },
  state: {
    loadingCounter: 0
  }
});

function overrideStub (url, response) {
  const l = moxios.stubs.count();
  for (let i = 0; i < l; i++) {
    const stub = moxios.stubs.at(i);
    if (stub.url === url) {
      const oldResponse = stub.response;
      const restoreFunc = () => { stub.response = oldResponse; };

      stub.response = response;
      return restoreFunc;
    }
  }
}

describe('Room Index', () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
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

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      attachTo: createContainer()
    });

    // user without view all permissions
    await view.vm.$nextTick();
    expect(view.findAll('h2').at(0).text()).toEqual('rooms.findRooms');

    // user with view all permission
    const newUser = _.cloneDeep(exampleUser);
    newUser.permissions = ['rooms.viewAll'];
    PermissionService.setCurrentUser(newUser);
    await view.vm.$nextTick();
    expect(view.findAll('h2').at(0).text()).toEqual('rooms.allRooms');

    PermissionService.setCurrentUser(oldUser);
    view.destroy();
  });

  it('load rooms, load room types and open room', async () => {
    const oldUser = PermissionService.currentUser;

    const spy = sinon.spy();
    const router = new VueRouter();
    router.push = spy;

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      router,
      attachTo: createContainer()
    });

    await waitMoxios(async () => {
      // check if spinners are active and buttons disabled during loading
      expect(view.vm.$data.isBusy).toBeTruthy();
      expect(view.vm.$data.roomTypesBusy).toBeTruthy();
      expect(view.findAllComponents(BSpinner).length).toEqual(2);
      expect(view.findComponent(BPagination).props('disabled')).toBeTruthy();
      expect(view.findAllComponents(BButton).at(0).attributes('disabled')).toBeTruthy();
      expect(view.findAllComponents(BButton).at(1).text()).toEqual('rooms.filter.apply');
      expect(view.findAllComponents(BButton).at(1).attributes('disabled')).toBeTruthy();

      // respond with example data to room and roomType requests
      expect(moxios.requests.at(0).config.url).toEqual('/api/v1/rooms');
      await moxios.requests.at(0).respondWith({
        status: 200,
        response: exampleRoomResponse
      });
      expect(moxios.requests.at(1).config.url).toEqual('/api/v1/roomTypes');
      await moxios.requests.at(1).respondWith({
        status: 200,
        response: exampleRoomTypeResponse
      });

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
      expect(rooms.at(0).get('.roomicon').text()).toEqual('ME');

      expect(rooms.at(1).get('h5').text()).toEqual('Meeting Two');
      expect(rooms.at(1).get('small').text()).toEqual('Max Doe');
      expect(rooms.at(1).get('.roomicon').text()).toEqual('VL');

      // check if all room types are shown
      const roomTypes = view.findAll('[name="room-types-checkbox"]');
      expect(roomTypes.length).toEqual(4);
      expect(roomTypes.at(0).element.parentElement.children[1].children[0].innerHTML).toEqual('Vorlesung');
      expect(roomTypes.at(1).element.parentElement.children[1].children[0].innerHTML).toEqual('Meeting');
      expect(roomTypes.at(2).element.parentElement.children[1].children[0].innerHTML).toEqual('Pr\u00fcfung');
      expect(roomTypes.at(3).element.parentElement.children[1].children[0].innerHTML).toEqual('\u00dcbung');

      // open a room
      await rooms.at(1).trigger('click');
      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, {name: 'rooms.view', params: {id: 'abc-def-345'}});

      // check if opening another is prohibited while the other room is opening
      await rooms.at(0).trigger('click');
      sinon.assert.calledOnce(spy);

      PermissionService.setCurrentUser(oldUser);
      view.destroy();
    });
  });

  it('error loading rooms', async () => {
    const oldUser = PermissionService.currentUser;

    const spy = jest.spyOn(Base, 'error').mockImplementation();

    // respond with server error for room load
    moxios.stubRequest('/api/v1/rooms?page=1', {
      status: 500,
      response: {
        message: 'Test'
      }
    });
    moxios.stubRequest('/api/v1/roomTypes?filter=searchable', {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios(async () => {
      await view.vm.$nextTick();

      // check buttons and input fields are disabled after an error occurred
      expect(view.findComponent(BFormInput).props('disabled')).toBeTruthy();
      expect(view.findComponent(BPagination).props('disabled')).toBeTruthy();
      expect(view.findAllComponents(BButton).at(0).attributes('disabled')).toBeTruthy();
      expect(view.findAllComponents(BButton).at(1).text()).toEqual('rooms.filter.apply');
      expect(view.findAllComponents(BButton).at(1).attributes('disabled')).toBeTruthy();

      // check if error message is shown
      expect(spy).toBeCalledTimes(1);
      Base.error.restore();

      // restore valid response
      const restoreRoomResponse = overrideStub('/api/v1/rooms?page=1', {
        status: 200,
        response: exampleRoomResponse
      });

      // check if reload button is shown and if a click reloads the resource
      const reloadButton = view.findAllComponents(BCol).at(3).findComponent(BOverlay).findComponent(BButton);
      expect(reloadButton.text()).toEqual('app.reload');
      await reloadButton.trigger('click');

      await waitMoxios(async () => {
        expect(moxios.requests.mostRecent().config.url).toEqual('/api/v1/rooms');

        // check if all rooms are shown and the buttons/input fields are active
        expect(view.findAllComponents(BListGroupItem).length).toEqual(2);
        expect(view.findComponent(BFormInput).props('disabled')).toBeFalsy();
        expect(view.findComponent(BPagination).props('disabled')).toBeFalsy();
        expect(view.findAllComponents(BButton).at(0).attributes('disabled')).toBeFalsy();
        expect(view.findAllComponents(BButton).at(1).attributes('disabled')).toBeFalsy();

        restoreRoomResponse();
        PermissionService.setCurrentUser(oldUser);
        view.destroy();
      });
    });
  });

  it('error loading room types', async () => {
    const oldUser = PermissionService.currentUser;

    const spy = jest.spyOn(Base, 'error').mockImplementation();

    // respond with server error for room type load
    moxios.stubRequest('/api/v1/rooms?page=1', {
      status: 200,
      response: exampleRoomResponse
    });
    moxios.stubRequest('/api/v1/roomTypes?filter=searchable', {
      status: 500,
      response: {
        message: 'Test'
      }
    });

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios(async () => {
      await view.vm.$nextTick();

      // check apply filter button disabled after an error occurred
      expect(view.findAllComponents(BButton).at(2).text()).toEqual('rooms.filter.apply');
      expect(view.findAllComponents(BButton).at(2).attributes('disabled')).toBeTruthy();

      // check if error message is shown
      expect(spy).toBeCalledTimes(1);
      Base.error.restore();

      // restore valid response
      const restoreRoomResponse = overrideStub('/api/v1/roomTypes?filter=searchable', {
        status: 200,
        response: exampleRoomTypeResponse
      });

      // check if reload button is shown and if a click reloads the resource
      const reloadButton = view.findAllComponents(BCol).at(2).findComponent(BOverlay).findComponent(BButton);
      expect(reloadButton.text()).toEqual('app.reload');
      await reloadButton.trigger('click');

      await waitMoxios(async () => {
        expect(moxios.requests.mostRecent().config.url).toEqual('/api/v1/roomTypes');

        // check if all room types are shown and the apply filter button is active
        const roomTypes = view.findAll('[name="room-types-checkbox"]');
        expect(roomTypes.length).toEqual(4);
        expect(view.findAllComponents(BButton).at(1).text()).toEqual('rooms.filter.apply');
        expect(view.findAllComponents(BButton).at(1).attributes('disabled')).toBeFalsy();

        restoreRoomResponse();
        PermissionService.setCurrentUser(oldUser);
        view.destroy();
      });
    });
  });

  it('search and filter rooms', async () => {
    const oldUser = PermissionService.currentUser;

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios(async () => {
      // respond with demo content to the rooms and roomTypes requests
      expect(moxios.requests.at(0).config.url).toEqual('/api/v1/rooms');
      await moxios.requests.at(0).respondWith({
        status: 200,
        response: exampleRoomResponse
      });
      expect(moxios.requests.at(1).config.url).toEqual('/api/v1/roomTypes');
      await moxios.requests.at(1).respondWith({
        status: 200,
        response: exampleRoomTypeResponse
      });

      await view.vm.$nextTick();

      // enter search query and click search button
      await view.findComponent(BFormInput).setValue('Meeting');
      await view.findAllComponents(BButton).trigger('click');

      // check if new request with the search query is send
      await waitMoxios(async () => {
        expect(moxios.requests.mostRecent().config.url).toEqual('/api/v1/rooms');
        expect(moxios.requests.mostRecent().config.params).toEqual({ page: 1, search: 'Meeting', roomTypes: [] });
        await moxios.requests.mostRecent().respondWith({
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
        expect(rooms.at(0).get('.roomicon').text()).toEqual('ME');

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
        await applyFilter.trigger('click');

        await waitMoxios(async () => {
          // check if the search query and the room filter are send, respond with no rooms found
          expect(moxios.requests.mostRecent().config.url).toEqual('/api/v1/rooms');
          expect(moxios.requests.mostRecent().config.params).toEqual({ page: 1, search: 'Meeting', roomTypes: [1, 3] });
          await moxios.requests.mostRecent().respondWith({
            status: 200,
            response: {
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
          expect(view.find('em').text()).toEqual('rooms.noRoomsAvailable');

          PermissionService.setCurrentUser(oldUser);
          view.destroy();
        });
      });
    });
  });

  it('sends request to list all rooms if user has rooms.viewAll permission',
    async () => {
      const oldUser = PermissionService.currentUser;

      const newUser = _.cloneDeep(exampleUser);
      newUser.permissions = ['rooms.viewAll'];
      PermissionService.setCurrentUser(newUser);

      const view = mount(RoomList, {
        localVue,
        mocks: {
          $t: (key) => key
        },
        store,
        attachTo: createContainer()
      });

      await waitMoxios(async () => {
        // respond with demo content to the rooms and roomTypes requests
        expect(moxios.requests.at(0).config.url).toEqual('/api/v1/rooms');
        await moxios.requests.at(0).respondWith({
          status: 200,
          response: exampleRoomResponse
        });
        expect(moxios.requests.at(1).config.url).toEqual('/api/v1/roomTypes');
        expect(moxios.requests.at(1).config.params).toBeUndefined();
        await moxios.requests.at(1).respondWith({
          status: 200,
          response: exampleRoomTypeResponse
        });

        PermissionService.setCurrentUser(oldUser);
        view.destroy();
      });
    }
  );

  it('sends request to list all rooms if user has not rooms.viewAll permission',
    async () => {
      const view = mount(RoomList, {
        localVue,
        mocks: {
          $t: (key) => key
        },
        store,
        attachTo: createContainer()
      });

      await waitMoxios(async () => {
        // respond with demo content to the rooms and roomTypes requests
        expect(moxios.requests.at(0).config.url).toEqual('/api/v1/rooms');
        await moxios.requests.at(0).respondWith({
          status: 200,
          response: exampleRoomResponse
        });
        expect(moxios.requests.at(1).config.url).toEqual('/api/v1/roomTypes');
        expect(moxios.requests.at(1).config.params).toStrictEqual({ filter: 'searchable' });
        await moxios.requests.at(1).respondWith({
          status: 200,
          response: exampleRoomTypeResponse
        });

        view.destroy();
      });
    }
  );
});
