import { createLocalVue, mount } from '@vue/test-utils';
import RoomList from '../../../../resources/js/views/rooms/Index';
import BootstrapVue, { BCard, IconsPlugin } from 'bootstrap-vue';
import moxios from 'moxios';
import RoomComponent from '../../../../resources/js/components/Room/RoomComponent';
import sinon from 'sinon';
import VueRouter from 'vue-router';
import NewRoomComponent from '../../../../resources/js/components/Room/NewRoomComponent';
import _ from 'lodash';
import Vuex from 'vuex';
import PermissionService from '../../../../resources/js/services/PermissionService';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(IconsPlugin);
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

describe('RoomList', function () {
  beforeEach(function () {
    moxios.install();
  });

  afterEach(function () {
    moxios.uninstall();
  });

  const exampleOwnRoomResponse = {
    data: [
      {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: 'John Doe',
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
  };
  const exampleSharedRoomResponse = {
    data: [
      {
        id: 'def-abc-123',
        name: 'Meeting Two',
        owner: 'John Doe',
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
        owner: 'John Doe',
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

  it('check list of rooms', function (done) {
    moxios.stubRequest('/api/v1/rooms?filter=own&page=1', {
      status: 200,
      response: exampleOwnRoomResponse
    });
    moxios.stubRequest('/api/v1/rooms?filter=shared&page=1', {
      status: 200,
      response: exampleSharedRoomResponse
    });
    moxios.stubRequest('/api/v1/room_types', {
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

    moxios.wait(async () => {
      await view.vm.$nextTick();

      expect(view.vm.ownRooms).toEqual(exampleOwnRoomResponse);
      expect(view.vm.sharedRooms).toEqual(exampleSharedRoomResponse);
      const rooms = view.findAllComponents(RoomComponent);

      expect(rooms.filter(room => room.vm.shared === false).length).toBe(1);
      expect(rooms.filter(room => room.vm.shared === true).length).toBe(2);
      done();
    });
  });

  it('click on room in list', function (done) {
    const spy = sinon.spy();

    const router = new VueRouter();
    router.push = spy;

    const exampleRoomListEntry = {
      id: 'abc-def-123',
      name: 'Meeting One',
      owner: 'John Doe',
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
      store,
      attachTo: createContainer()
    });

    view.findComponent(BCard).trigger('click');

    moxios.wait(() => {
      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, { name: 'rooms.view', params: { id: exampleRoomListEntry.id } });
      done();
    });
  });

  it('test reload function and room limit reach event', function (done) {
    moxios.stubRequest('/api/v1/rooms?filter=own&page=1', {
      status: 200,
      response: exampleOwnRoomResponse
    });
    moxios.stubRequest('/api/v1/rooms?filter=shared&page=1', {
      status: 200,
      response: exampleSharedRoomResponse
    });
    moxios.stubRequest('/api/v1/room_types', {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const newUser = _.cloneDeep(exampleUser);
    newUser.room_limit = 2;
    store.commit('session/setCurrentUser', newUser);

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      attachTo: createContainer()
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();
      // find current amount of rooms
      const rooms = view.findAllComponents(RoomComponent);
      expect(rooms.length).toBe(3);

      // change response and fire event
      overrideStub('/api/v1/rooms?filter=own&page=1', {
        status: 200,
        response: {
          data: [
            {
              id: 'abc-def-123',
              name: 'Meeting One',
              owner: 'John Doe',
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
              owner: 'John Doe',
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

      // find new room component and fire event
      const newRoomComponent = view.findComponent(NewRoomComponent);
      expect(newRoomComponent.exists()).toBeTruthy();
      newRoomComponent.vm.$emit('limitReached');

      moxios.wait(function () {
        view.vm.$nextTick();
        // check if now two rooms are displayed
        const rooms = view.findAllComponents(RoomComponent);
        expect(rooms.length).toBe(4);

        // try to find new room component, should be missing as the limit is reached
        const newRoomComponent = view.findComponent(NewRoomComponent);
        expect(newRoomComponent.exists()).toBeFalsy();

        done();
      });
    });
  });

  it('test search', function (done) {
    moxios.stubRequest('/api/v1/rooms?filter=own&page=1', {
      status: 200,
      response: exampleOwnRoomResponse
    });
    moxios.stubRequest('/api/v1/rooms?filter=shared&page=1', {
      status: 200,
      response: exampleSharedRoomResponse
    });
    moxios.stubRequest('/api/v1/room_types', {
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

    moxios.wait(async () => {
      await view.vm.$nextTick();

      const searchField = view.findComponent({ ref: 'search' });
      expect(searchField.exists()).toBeTruthy();

      // Enter search query
      await searchField.setValue('test');
      searchField.trigger('change');

      // Check room pagination reset
      expect(view.vm.$data.ownRooms.meta.current_page).toBe(1);
      expect(view.vm.$data.sharedRooms.meta.current_page).toBe(1);

      moxios.requests.reset();

      moxios.wait(function () {
        // Check if requests use the search string
        const firstRequest = moxios.requests.at(0);
        const secondRequest = moxios.requests.at(1);

        expect(firstRequest.url).toEqual(expect.stringContaining('&search=test'));
        expect(secondRequest.url).toEqual(expect.stringContaining('&search=test'));

        done();
      });
    });
  });
});
