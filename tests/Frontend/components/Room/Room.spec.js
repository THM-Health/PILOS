import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue from 'bootstrap-vue';
import moxios from 'moxios';
import RoomView from '../../../../resources/js/views/rooms/View.vue';
import AdminComponent from '../../../../resources/js/components/Room/AdminComponent';
import Clipboard from 'v-clipboard';
import Vuex from 'vuex';
import sinon from 'sinon';
import Base from '../../../../resources/js/api/base';

const localVue = createLocalVue();

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};

localVue.use(BootstrapVue);
localVue.use(Clipboard);
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

describe('Room', function () {
  beforeEach(function () {
    moxios.install();
  });
  afterEach(function () {
    moxios.uninstall();
  });

  it('guest forbidden', function (done) {
    moxios.stubRequest('/api/v1/rooms/abc-def-123', {
      status: 403
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      attachTo: createContainer()
    });

    const to = { params: { id: 'abc-def-123' } };

    RoomView.beforeRouteEnter.call(view.vm, to, undefined, async next => {
      next(view.vm);
      await view.vm.$nextTick();
      expect(view.html()).toContain('rooms.onlyUsedByAuthenticatedUsers');
      done();
    });
  });

  it('ask access token', function (done) {
    moxios.stubRequest('/api/v1/rooms/abc-def-456', {
      status: 200,
      response: { data: { id: 'abc-def-456', name: 'Meeting One', owner: 'John Doe', type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, authenticated: false, allowMembership: false, isMember: false, isOwner: false, isGuest: true, isModerator: false, canStart: false, running: false } }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      attachTo: createContainer()
    });

    const to = { params: { id: 'abc-def-456' } };

    RoomView.beforeRouteEnter.call(view.vm, to, undefined, async next => {
      next(view.vm);
      await view.vm.$nextTick();
      expect(view.html()).toContain('rooms.requireAccessCode');
      done();
    });
  });

  it('room details auth. guest', function (done) {
    moxios.stubRequest('/api/v1/rooms/abc-def-789', {
      status: 200,
      response: { data: { id: 'abc-def-789', name: 'Meeting One', owner: 'John Doe', type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, authenticated: true, allowMembership: false, isMember: false, isOwner: false, isGuest: true, isModerator: false, canStart: false, running: true } }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      attachTo: createContainer()
    });

    const to = { params: { id: 'abc-def-789' } };

    RoomView.beforeRouteEnter.call(view.vm, to, undefined, async next => {
      next(view.vm);
      await view.vm.$nextTick();
      expect(view.html()).toContain('Meeting One');
      expect(view.html()).toContain('John Doe');
      expect(view.vm.invitationText).not.toContain('rooms.invitation.code');

      const joinButton = view.findComponent({ ref: 'joinMeeting' });
      const nameInput = view.findComponent({ ref: 'guestName' });
      expect(joinButton.attributes('disabled')).toEqual('disabled');
      nameInput.setValue('John Doe');
      await view.vm.$nextTick();
      expect(joinButton.attributes('disabled')).toBeUndefined();

      done();
    });
  });

  it('room details moderator', function (done) {
    moxios.stubRequest('/api/v1/rooms/cba-fed-123', {
      status: 200,
      response: { data: { id: 'gs4-6fb-kk8', name: 'Meeting One', owner: 'John Doe', type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, authenticated: true, allowMembership: false, isMember: false, isOwner: false, isGuest: false, isModerator: true, canStart: true, running: false, accessCode: 123456789, files: [] } }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      attachTo: createContainer()
    });

    const to = { params: { id: 'cba-fed-123' } };

    RoomView.beforeRouteEnter.call(view.vm, to, undefined, async next => {
      next(view.vm);
      await view.vm.$nextTick();
      expect(view.html()).toContain('Meeting One');
      expect(view.html()).toContain('John Doe');
      expect(view.vm.invitationText).toContain('rooms.invitation.code');

      const adminComponent = view.findComponent(AdminComponent);
      expect(adminComponent.exists()).toBeFalsy();

      done();
    });
  });

  it('room admin components', function (done) {
    moxios.stubRequest('/api/v1/rooms/cba-fed-234', {
      status: 200,
      response: { data: { id: 'gs4-6fb-kk8', name: 'Meeting One', owner: 'John Doe', type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, authenticated: true, allowMembership: false, isMember: false, isOwner: true, isGuest: false, isModerator: true, canStart: true, running: false, accessCode: 123456789, files: [] } }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      attachTo: createContainer()
    });

    const to = { params: { id: 'cba-fed-234' } };

    RoomView.beforeRouteEnter.call(view.vm, to, undefined, async next => {
      next(view.vm);
      await view.vm.$nextTick();
      expect(view.html()).toContain('Meeting One');
      expect(view.html()).toContain('John Doe');
      expect(view.vm.invitationText).toContain('rooms.invitation.code');

      const adminComponent = view.findComponent(AdminComponent);
      expect(adminComponent.exists()).toBeTruthy();

      done();
    });
  });

  it('reload', function (done) {
    moxios.stubRequest('/api/v1/rooms/cba-fed-345', {
      status: 200,
      response: { data: { id: 'cba-fed-234', name: 'Meeting One', owner: 'John Doe', type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, authenticated: true, allowMembership: false, isMember: false, isOwner: true, isGuest: false, isModerator: true, canStart: true, running: false, accessCode: 123456789, files: [] } }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      attachTo: createContainer()
    });

    const to = { params: { id: 'cba-fed-345' } };

    RoomView.beforeRouteEnter.call(view.vm, to, undefined, async next => {
      next(view.vm);
      await view.vm.$nextTick();
      expect(view.html()).toContain('Meeting One');
      expect(view.html()).toContain('John Doe');

      const reloadButton = view.findComponent({ ref: 'reloadButton' });
      reloadButton.trigger('click');

      overrideStub('/api/v1/rooms/cba-fed-345', {
        status: 200,
        response: { data: { id: 'cba-fed-234', name: 'Meeting Two', owner: 'John Doe', type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, authenticated: true, allowMembership: false, isMember: false, isOwner: true, isGuest: false, isModerator: true, canStart: true, running: false, accessCode: 123456789, files: [] } }
      });
      await moxios.wait(() => {
        expect(view.html()).toContain('Meeting Two');
        done();
      });
    });
  });

  it('handle invalid code', function () {
    const reload = sinon.stub(RoomView.methods, 'reload');
    const flashMessageSpy = sinon.spy();
    const flashMessage = {
      error (param) {
        flashMessageSpy(param);
      }
    };

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key,
        flashMessage: flashMessage
      },
      propsData: {
        accessCodeValid: null,
        accessCode: 123456789
      },
      store,
      attachTo: createContainer()
    });

    view.vm.handleInvalidCode();
    expect(view.vm.$data.accessCodeValid).toBeFalsy();
    expect(view.vm.$data.accessCode).toBeNull();
    expect(flashMessageSpy.calledOnce).toBeTruthy();
    expect(flashMessageSpy.getCall(0).args[0]).toBe('rooms.flash.accessCodeChanged');
    expect(reload.calledOnce).toBeTruthy();
    reload.restore();
  });

  it('handle file list errors', function () {
    const handleInvalidCode = sinon.stub(RoomView.methods, 'handleInvalidCode');
    const baseError = sinon.stub(Base, 'error');
    const flashMessageSpy = sinon.spy();
    const flashMessage = {
      error (param) {
        flashMessageSpy(param);
      }
    };

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key,
        flashMessage: flashMessage
      },
      propsData: {
        room: { id: 'cba-fed-234', name: 'Meeting Two', owner: 'John Doe', type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, authenticated: true, allowMembership: false, isMember: false, isOwner: false, isGuest: false, isModerator: false, canStart: false, running: false, accessCode: 123456789 },
        accessCode: 123456789
      },
      store,
      attachTo: createContainer()
    });

    view.vm.onFileListError({ response: { status: 401, data: { message: 'invalid_code' } } });
    expect(handleInvalidCode.calledOnce).toBeTruthy();

    view.vm.onFileListError({ response: { status: 403, data: { message: 'require_code' } } });
    expect(handleInvalidCode.calledTwice).toBeTruthy();

    view.vm.onFileListError({ response: { status: 403, data: { message: 'This action is unauthorized.' } } });
    expect(view.vm.$data.accessCode).toBeNull();
    expect(view.vm.$data.room).toBeNull();

    view.vm.onFileListError({ response: { status: 500, data: { message: 'Internal server error' } } });
    expect(baseError.calledOnce).toBeTruthy();
    expect(baseError.getCall(0).args[0].response.status).toEqual(500);

    Base.error.restore();
    handleInvalidCode.restore();
  });
});
