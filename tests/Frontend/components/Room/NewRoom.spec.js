import { createLocalVue, mount } from '@vue/test-utils';
import RoomList from '../../../../resources/js/views/rooms/Index';
import BootstrapVue, { BFormInput, BFormSelect, IconsPlugin } from 'bootstrap-vue';
import moxios from 'moxios';
import NewRoomComponent from '../../../../resources/js/components/Room/NewRoomComponent';
import PermissionService from '../../../../resources/js/services/PermissionService';
import _ from 'lodash';
import sinon from 'sinon';
import VueRouter from 'vue-router';
import Vuex from 'vuex';
import Base from '../../../../resources/js/api/base';

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: [], model_name: 'User', room_limit: -1 };

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

const store = new Vuex.Store({
  modules: {
    session: {
      namespaced: true,
      actions: {
        getCurrentUser ({ state }) { }
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

describe('Create new rooms', function () {
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
      { id: 1, short: 'VL', description: 'Vorlesung', color: '#80BA27' },
      { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66' },
      { id: 3, short: 'PR', description: 'Pr\u00fcfung', color: '#9C132E' },
      { id: 4, short: '\u00dcB', description: '\u00dcbung', color: '#00B8E4' }
    ]
  };

  it('frontend permission test', function (done) {
    moxios.stubRequest('/api/v1/rooms?filter=own&page=1', {
      status: 200,
      response: exampleOwnRoomResponse
    });
    moxios.stubRequest('/api/v1/rooms?filter=shared&page=1', {
      status: 200,
      response: exampleSharedRoomResponse
    });

    PermissionService.setCurrentUser(exampleUser);
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

      const missingNewRoomComponent = view.findComponent(NewRoomComponent);
      expect(missingNewRoomComponent.exists()).toBeFalsy();

      const newUser = _.cloneDeep(exampleUser);
      newUser.permissions.push('rooms.create');

      PermissionService.setCurrentUser(newUser);

      await view.vm.$nextTick();

      const newRoomComponent = view.findComponent(NewRoomComponent);
      expect(newRoomComponent.exists()).toBeTruthy();

      view.destroy();
      done();
    });
  });

  it('frontend room limit test', function (done) {
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

    const newUser = _.cloneDeep(exampleUser);
    newUser.permissions.push('rooms.create');
    newUser.room_limit = 1;
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

      const missingNewRoomComponent = view.findComponent(NewRoomComponent);
      expect(missingNewRoomComponent.exists()).toBeFalsy();

      view.destroy();
      done();
    });
  });

  it('submit valid', function (done) {
    const spy = sinon.spy();

    const router = new VueRouter();
    router.push = spy;

    moxios.stubRequest('/api/v1/roomTypes', {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(NewRoomComponent, {
      localVue,
      router,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        modalStatic: true
      },
      store
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();

      const typeInput = view.findComponent(BFormSelect);
      await typeInput.setValue(2);
      const nameInput = view.findComponent(BFormInput);
      await nameInput.setValue('Test');
      view.vm.handleSubmit();
      moxios.wait(function () {
        const request = moxios.requests.mostRecent();
        expect(JSON.parse(request.config.data)).toMatchObject({ roomType: 2, name: 'Test' });
        request.respondWith({
          status: 201,
          response: { data: { id: 'zej-p5h-2wf', name: 'Test', owner: 'John Doe', type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66' } } }
        })
          .then(async () => {
            await view.vm.$nextTick();
            sinon.assert.calledOnce(spy);
            sinon.assert.calledWith(spy, { name: 'rooms.view', params: { id: 'zej-p5h-2wf' } });
            view.destroy();
            done();
          });
      });
    });
  });

  it('submit forbidden', function (done) {
    const flashMessageSpy = sinon.spy();
    const flashMessage = {
      error (param) {
        flashMessageSpy(param);
      }
    };

    moxios.stubRequest('/api/v1/roomTypes', {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(NewRoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        flashMessage: flashMessage
      },
      propsData: {
        modalStatic: true
      },
      store
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();

      const typeInput = view.findComponent(BFormSelect);
      await typeInput.setValue(2);
      const nameInput = view.findComponent(BFormInput);
      await nameInput.setValue('Test');
      view.vm.handleSubmit();

      moxios.wait(function () {
        const request = moxios.requests.mostRecent();
        expect(JSON.parse(request.config.data)).toMatchObject({ roomType: 2, name: 'Test' });
        request.respondWith({
          status: 403
        })
          .then(function () {
            sinon.assert.calledOnce(flashMessageSpy);
            sinon.assert.calledWith(flashMessageSpy, 'rooms.flash.noNewRoom');
            view.destroy();
            done();
          });
      });
    });
  });

  it('submit reached room limit', function (done) {
    const flashMessageSpy = sinon.spy();

    sinon.stub(Base, 'error').callsFake(flashMessageSpy);

    moxios.stubRequest('/api/v1/roomTypes', {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(NewRoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        modalStatic: true
      },
      store,
      Base
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();

      const typeInput = view.findComponent(BFormSelect);
      await typeInput.setValue(2);
      const nameInput = view.findComponent(BFormInput);
      await nameInput.setValue('Test');
      view.vm.handleSubmit();

      moxios.wait(function () {
        const request = moxios.requests.mostRecent();
        expect(JSON.parse(request.config.data)).toMatchObject({ roomType: 2, name: 'Test' });
        request.respondWith({
          status: 463,
          response: { message: 'test' }
        })
          .then(function () {
            expect(flashMessageSpy.calledOnce).toBeTruthy();
            expect(flashMessageSpy.getCall(0).args[0].response.data.message).toEqual('test');
            expect(view.emitted().limitReached).toBeTruthy();
            view.destroy();
            Base.error.restore();
            done();
          });
      });
    });
  });

  it('submit without name', function (done) {
    moxios.stubRequest('/api/v1/roomTypes', {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(NewRoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        modalStatic: true
      },
      store
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();
      const typeInput = view.findComponent(BFormSelect);
      await typeInput.setValue(2);
      const nameInput = view.findComponent(BFormInput);
      view.vm.handleSubmit();

      moxios.wait(function () {
        const request = moxios.requests.mostRecent();
        request.respondWith({
          status: 422,
          response: { message: 'The given data was invalid.', errors: { name: ['The Name field is required.'] } }
        })
          .then(async () => {
            await view.vm.$nextTick();
            expect(nameInput.classes()).toContain('is-invalid');
            view.destroy();
            done();
          });
      });
    });
  });

  it('submit invalid room type', function (done) {
    moxios.stubRequest('/api/v1/roomTypes', {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(NewRoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        modalStatic: true
      },
      store
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();

      const restoreRoomTypeResponse = overrideStub('/api/v1/roomTypes', {
        status: 200,
        response: {
          data: [{ id: 3, short: 'ME', description: 'Meeting', color: '#4a5c66' }]
        }
      });

      const typeInput = view.findComponent(BFormSelect);
      await typeInput.setValue(2);

      view.vm.handleSubmit();
      moxios.wait(function () {
        const request = moxios.requests.mostRecent();
        request.respondWith({
          status: 422,
          response: { message: 'The given data was invalid.', errors: { roomType: ['error'] } }
        }).then(async () => {
          await view.vm.$nextTick();
          expect(typeInput.classes()).toContain('is-invalid');

          const request = moxios.requests.mostRecent();
          expect(request.url).toEqual('/api/v1/roomTypes');

          expect(view.vm.$data.room.roomType).toBeNull();

          restoreRoomTypeResponse();
          view.destroy();
          done();
        });
      });
    });
  });

  it('cancel or close', function (done) {
    const roomTypes = [{ id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66' }];

    moxios.stubRequest('/api/v1/roomTypes', {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(NewRoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        roomTypes: roomTypes,
        modalStatic: true
      },
      store
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();

      await view.findComponent(BFormSelect).setValue(2);
      await view.findComponent(BFormInput).setValue('Test');
      expect(view.vm.$data.room).toMatchObject({ roomType: 2, name: 'Test' });
      view.vm.handleCancel();
      view.destroy();
      expect(view.vm.$data.room).toMatchObject({});

      done();
    });
  });
});
