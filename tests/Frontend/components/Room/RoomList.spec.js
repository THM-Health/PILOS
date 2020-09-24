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
import Base from '../../../../resources/js/api/base';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(IconsPlugin);
localVue.use(VueRouter);
localVue.use(Vuex);

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

  const exampleRoomListResponse = {
    myRooms: [
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
    sharedRooms: [
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
    ]
  };

  it('server error with route', function (done) {
    moxios.stubRequest('/api/v1/rooms', {
      status: 500
    });

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store
    });

    const from = { matched: ['test'] };

    RoomList.beforeRouteEnter.call(view.vm, undefined, from, async error => {
      expect(error.response.status).toBe(500);
      done();
    });
  });

  it('server error without route', function (done) {
    moxios.stubRequest('/api/v1/rooms', {
      status: 500,
      response: { message: 'test' }
    });

    const flashMessageSpy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(flashMessageSpy);

    const routerSpy = sinon.spy();
    const router = new VueRouter();
    router.push = routerSpy;

    const view = mount(RoomList, {
      localVue,
      router,
      mocks: {
        $t: (key) => key
      },
      store,
      Base
    });

    const from = { matched: [] };

    RoomList.beforeRouteEnter.call(view.vm, undefined, from, async next => {
      next(view.vm);
      expect(flashMessageSpy.calledOnce).toBeTruthy();
      expect(flashMessageSpy.getCall(0).args[0].response.data.message).toEqual('test');

      sinon.assert.calledOnce(routerSpy);
      sinon.assert.calledWith(routerSpy, '/');

      Base.error.restore();
      done();
    });
  });

  it('check list of rooms', function (done) {
    moxios.stubRequest('/api/v1/rooms', {
      status: 200,
      response: { data: exampleRoomListResponse }
    });

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store
    });

    RoomList.beforeRouteEnter.call(view.vm, undefined, undefined, async next => {
      next(view.vm);
      await view.vm.$nextTick();

      expect(view.vm.rooms).toEqual(exampleRoomListResponse);
      const rooms = view.findAllComponents(RoomComponent);
      expect(rooms.length).toBe(3);

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
      store
    });

    view.findComponent(BCard).trigger('click');

    moxios.wait(() => {
      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, { name: 'rooms.view', params: { id: exampleRoomListEntry.id } });
      done();
    });
  });

  it('test reload function and room limit reach event', function (done) {
    moxios.stubRequest('/api/v1/rooms', {
      status: 200,
      response: {
        data: {
          myRooms: [
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
          sharedRooms: []
        }
      }
    });

    const newUser = _.cloneDeep(exampleUser);
    newUser.room_limit = 2;
    store.commit('session/setCurrentUser', newUser);

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store
    });

    RoomList.beforeRouteEnter.call(view.vm, undefined, undefined, async next => {
      next(view.vm);
      await view.vm.$nextTick();
      // find current amount of rooms
      const rooms = view.findAllComponents(RoomComponent);
      expect(rooms.length).toBe(1);

      // change response and fire event
      overrideStub('/api/v1/rooms', {
        status: 200,
        response: {
          data: {
            myRooms: [
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
                id: 'abc-def-456',
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
            sharedRooms: []
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
        expect(rooms.length).toBe(2);

        // try to find new room component, should be missing as the limit is reached
        const newRoomComponent = view.findComponent(NewRoomComponent);
        expect(newRoomComponent.exists()).toBeFalsy();

        done();
      });
    });
  });
});
