import { createLocalVue, mount } from '@vue/test-utils';
import RoomList from '../../../../resources/js/views/rooms/Index';
import BootstrapVue, { BFormInput, IconsPlugin } from 'bootstrap-vue';
import store from '../../../../resources/js/store';
import moxios from 'moxios';
import NewRoomComponent from '../../../../resources/js/components/Room/NewRoomComponent';
import PermissionService from '../../../../resources/js/services/PermissionService';
import _ from 'lodash';
import sinon from 'sinon';
import VueRouter from 'vue-router';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(IconsPlugin);

describe('Create new rooms', function () {
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

  const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: [], modelName: 'User' };

  it('frontend permission test', function (done) {
    moxios.stubRequest('/api/v1/rooms', {
      status: 200,
      response: { data: exampleRoomListResponse }
    });

    moxios.stubRequest('/api/v1/currentUser', {
      status: 200,
      response: { data: exampleUser }
    });

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store
    });

    store.dispatch('initialize', {});

    RoomList.beforeRouteEnter.call(view.vm, undefined, undefined, async next => {
      next(view.vm);
      await view.vm.$nextTick();

      const missingNewRoomComponent = view.findComponent(NewRoomComponent);
      expect(missingNewRoomComponent.exists()).toBeFalsy();

      const newUser = _.cloneDeep(exampleUser);
      newUser.permissions.push('rooms.create');

      PermissionService.setCurrentUser(newUser);

      await view.vm.$nextTick();

      const newRoomComponent = view.findComponent(NewRoomComponent);
      expect(newRoomComponent.exists()).toBeTruthy();

      done();
    });
  });

  it('submit valid', function (done) {
    const roomTypes = [{ id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: true }];
    const spy = sinon.spy();

    const $router = new VueRouter();
    $router.push = spy;

    const view = mount(NewRoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $router
      },
      propsData: {
        roomTypes: roomTypes,
        modalStatic: true
      },
      store
    });

    const nameInput = view.findComponent(BFormInput);
    nameInput.setValue('Test');
    view.vm.handleSubmit();
    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      expect(JSON.parse(request.config.data)).toMatchObject({ roomType: 2, name: 'Test' });
      request.respondWith({
        status: 201,
        response: { data: { id: 'zej-p5h-2wf', name: 'Test', owner: 'John Doe', type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: true } } }
      })
        .then(function () {
          view.vm.$nextTick();
          sinon.assert.calledOnce(spy);
          sinon.assert.calledWith(spy, { name: 'rooms.view', params: { id: 'zej-p5h-2wf' } });
          done();
        });
    });
  });

  it('submit forbidden', function (done) {
    const roomTypes = [{ id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: true }];
    const flashMessageSpy = sinon.spy();
    const flashMessage = {
      error (param) {
        flashMessageSpy(param);
      }
    };

    const view = mount(NewRoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        flashMessage: flashMessage
      },
      propsData: {
        roomTypes: roomTypes,
        modalStatic: true
      },
      store
    });

    view.vm.handleSubmit();
    const nameInput = view.findComponent(BFormInput);
    nameInput.setValue('Test');
    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      expect(JSON.parse(request.config.data)).toMatchObject({ roomType: 2, name: 'Test' });
      request.respondWith({
        status: 403
      })
        .then(function () {
          view.vm.$nextTick();
          sinon.assert.calledOnce(flashMessageSpy);
          sinon.assert.calledWith(flashMessageSpy, 'rooms.flash.noNewRoom');
          done();
        });
    });
  });

  it('submit without name', function (done) {
    const roomTypes = [{ id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: true }];
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
    view.vm.handleSubmit();
    const nameInput = view.findComponent(BFormInput);
    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 422,
        response: { message: 'The given data was invalid.', errors: { name: ['The Name field is required.'] } }
      })
        .then(function () {
          view.vm.$nextTick();
          expect(nameInput.classes()).toContain('is-invalid');
          done();
        });
    });
  });

  it('cancel or close', function () {
    const roomTypes = [{ id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: true }];

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

    view.findComponent(BFormInput).setValue('Test');
    expect(view.vm.$data.room).toMatchObject({ roomType: 2, name: 'Test' });
    view.vm.handleCancel();
    expect(view.vm.$data.room).toMatchObject({});
  });
});
