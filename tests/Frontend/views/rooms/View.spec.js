import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, { BButton } from 'bootstrap-vue';
import moxios from 'moxios';
import RoomView from '../../../../resources/js/views/rooms/View.vue';
import AdminComponent from '../../../../resources/js/components/Room/AdminComponent';
import Clipboard from 'v-clipboard';
import Vuex from 'vuex';
import sinon from 'sinon';
import Base from '../../../../resources/js/api/base';
import VueRouter from 'vue-router';
import PermissionService from '../../../../resources/js/services/PermissionService';
import Vue from 'vue';
import _ from 'lodash';
import env from '../../../../resources/js/env';

const localVue = createLocalVue();

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};

localVue.use(BootstrapVue);
localVue.use(Clipboard);
localVue.use(Vuex);
localVue.use(VueRouter);

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
        isAuthenticated: (state) => !$.isEmptyObject(state.currentUser),
        settings: () => (setting) => null
      },
      mutations: {
        setCurrentUser (state, { currentUser, emit = true }) {
          state.currentUser = currentUser;
          PermissionService.setCurrentUser(state.currentUser, emit);
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

    const routerSpy = sinon.spy();
    const router = new VueRouter();
    router.push = routerSpy;
    const sandbox = sinon.createSandbox();
    sandbox.replaceGetter(router, 'currentRoute', function () {
      return { path: '/rooms/knz-6ah-anr' };
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      router,
      attachTo: createContainer()
    });

    const to = { params: { id: 'abc-def-123' } };

    RoomView.beforeRouteEnter.call(view.vm, to, undefined, async next => {
      next(view.vm);
      await view.vm.$nextTick();
      expect(view.html()).toContain('rooms.onlyUsedByAuthenticatedUsers');

      const tryAgain = view.findAllComponents(BButton).at(0);
      const login = view.findAllComponents(BButton).at(1);

      expect(tryAgain.html()).toContain('rooms.tryAgain');
      expect(login.html()).toContain('rooms.login');

      await tryAgain.trigger('click');

      moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.config.url).toBe('/api/v1/rooms/abc-def-123');
        await view.vm.$nextTick();

        await login.trigger('click');
        sinon.assert.calledOnce(routerSpy);
        sinon.assert.calledWith(routerSpy, { name: 'login', query: { redirect: '/rooms/knz-6ah-anr' } });
        sandbox.restore();
        view.destroy();
        done();
      });
    });
  });

  it('ask access token', function (done) {
    moxios.stubRequest('/api/v1/rooms/abc-def-456', {
      status: 200,
      response: { data: { id: 'abc-def-456', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: false, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: false, running: false } }
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
      view.destroy();
      done();
    });
  });

  it('room details auth. guest', function (done) {
    moxios.stubRequest('/api/v1/rooms/abc-def-789', {
      status: 200,
      response: { data: { id: 'abc-def-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: false, running: true } }
    });

    store.commit('session/setCurrentUser', { currentUser: null });

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
      expect(view.html()).toContain('Max Doe');
      expect(view.vm.invitationText).not.toContain('rooms.invitation.code');

      const joinButton = view.findComponent({ ref: 'joinMeeting' });
      const nameInput = view.findComponent({ ref: 'guestName' });
      expect(joinButton.attributes('disabled')).toEqual('disabled');
      nameInput.setValue('John Doe');
      await view.vm.$nextTick();
      expect(joinButton.attributes('disabled')).toBeUndefined();
      view.destroy();
      done();
    });
  });

  it('room details moderator', function (done) {
    moxios.stubRequest('/api/v1/rooms/cba-fed-123', {
      status: 200,
      response: { data: { id: 'cba-fed-123', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: true, canStart: true, running: false, accessCode: 123456789, files: [] } }
    });
    PermissionService.setCurrentUser(exampleUser);

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
      expect(view.html()).toContain('Max Doe');
      expect(view.vm.invitationText).toContain('rooms.invitation.code');

      const adminComponent = view.findComponent(AdminComponent);
      expect(adminComponent.exists()).toBeFalsy();
      view.destroy();
      done();
    });
  });

  it('room admin components for owner', function (done) {
    const oldUser = PermissionService.currentUser;

    moxios.stubRequest('/api/v1/rooms/gs4-6fb-kk8', {
      status: 200,
      response: { data: { id: 'gs4-6fb-kk8', name: 'Meeting One', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: true, running: false, accessCode: 123456789, files: [] } }
    });
    PermissionService.setCurrentUser(exampleUser);

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      attachTo: createContainer()
    });

    const to = { params: { id: 'gs4-6fb-kk8' } };

    RoomView.beforeRouteEnter.call(view.vm, to, undefined, async next => {
      next(view.vm);
      await view.vm.$nextTick();
      expect(view.html()).toContain('Meeting One');
      expect(view.html()).toContain('John Doe');

      expect(view.vm.invitationText).toContain('rooms.invitation.code');
      const adminComponent = view.findComponent(AdminComponent);
      expect(adminComponent.exists()).toBeTruthy();

      PermissionService.setCurrentUser(oldUser);
      view.destroy();
      done();
    });
  });

  it('room admin components for co-owner', function (done) {
    const oldUser = PermissionService.currentUser;

    moxios.stubRequest('/api/v1/rooms/gs4-6fb-kk8', {
      status: 200,
      response: { data: { id: 'gs4-6fb-kk8', name: 'Meeting One', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: true, isModerator: false, canStart: true, running: false, accessCode: 123456789, files: [] } }
    });
    PermissionService.setCurrentUser(exampleUser);

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      attachTo: createContainer()
    });

    const to = { params: { id: 'gs4-6fb-kk8' } };

    RoomView.beforeRouteEnter.call(view.vm, to, undefined, async next => {
      next(view.vm);
      await view.vm.$nextTick();
      expect(view.html()).toContain('Meeting One');
      expect(view.html()).toContain('John Doe');

      expect(view.vm.invitationText).toContain('rooms.invitation.code');
      const adminComponent = view.findComponent(AdminComponent);
      expect(adminComponent.exists()).toBeTruthy();

      PermissionService.setCurrentUser(oldUser);
      view.destroy();
      done();
    });
  });

  it('room admin components with rooms.viewAll permission', function (done) {
    const oldUser = PermissionService.currentUser;

    moxios.stubRequest('/api/v1/rooms/gs4-6fb-kk8', {
      status: 200,
      response: { data: { id: 'gs4-6fb-kk8', name: 'Meeting One', owner: { id: 2, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: true, running: false, accessCode: 123456789, files: [] } }
    });
    PermissionService.setCurrentUser(exampleUser);

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      attachTo: createContainer()
    });

    const to = { params: { id: 'gs4-6fb-kk8' } };

    RoomView.beforeRouteEnter.call(view.vm, to, undefined, async next => {
      next(view.vm);
      await view.vm.$nextTick();
      expect(view.html()).toContain('Meeting One');
      expect(view.html()).toContain('John Doe');

      expect(view.findComponent(AdminComponent).exists()).toBeFalsy();

      const newUser = _.clone(exampleUser);
      newUser.permissions = ['rooms.viewAll'];
      PermissionService.setCurrentUser(newUser);
      await Vue.nextTick();
      expect(view.findComponent(AdminComponent).exists()).toBeTruthy();

      PermissionService.setCurrentUser(oldUser);
      view.destroy();
      done();
    });
  });

  it('reload', function (done) {
    moxios.stubRequest('/api/v1/rooms/cba-fed-345', {
      status: 200,
      response: { data: { id: 'cba-fed-234', name: 'Meeting One', owner: { id: 2, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: true, isModerator: false, canStart: true, running: false, accessCode: 123456789, files: [] } }
    });
    PermissionService.setCurrentUser(exampleUser);

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
        response: { data: { id: 'cba-fed-234', name: 'Meeting Two', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: true, canStart: true, running: false, accessCode: 123456789, files: [] } }
      });
      await moxios.wait(() => {
        expect(view.html()).toContain('Meeting Two');
        view.destroy();
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
    expect(flashMessageSpy.getCall(0).args[0]).toBe('rooms.flash.accessCodeInvalid');
    expect(reload.calledOnce).toBeTruthy();
    reload.restore();
    view.destroy();
  });

  it('handle empty code', function (done) {
    moxios.stubRequest('/api/v1/rooms/abc-def-456', {
      status: 200,
      response: { data: { id: 'abc-def-456', name: 'Meeting One', owner: 'John Doe', type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: false, allowMembership: false, isMember: false, isOwner: false, isGuest: true, isModerator: false, canStart: false, running: false } }
    });

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
      store,
      attachTo: createContainer()
    });
    const to = { params: { id: 'abc-def-456' } };

    // load room view
    RoomView.beforeRouteEnter.call(view.vm, to, undefined, async next => {
      next(view.vm);
      await view.vm.$nextTick();
      // check if require access code is shown
      expect(view.html()).toContain('rooms.requireAccessCode');

      // reinstall moxios to disable stub
      moxios.uninstall();
      moxios.install();

      // click on the login button without input to access code field
      const loginButton = view.findAllComponents(BButton).at(1);
      expect(loginButton.text()).toBe('rooms.login');
      await loginButton.trigger('click');

      // check if request is send to server with empty access code
      moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.url).toBe('/api/v1/rooms/abc-def-456');
        expect(request.config.headers['Access-Code']).toBe('');
        // respond with invalid access code error message
        await request.respondWith({
          status: 401,
          response: { message: 'invalid_code' }
        });
        await view.vm.$nextTick();
        // check if internal access code is reset and error is shown
        expect(view.vm.$data.accessCodeValid).toBeFalsy();
        expect(view.vm.$data.accessCode).toBeNull();
        expect(flashMessageSpy.calledOnce).toBeTruthy();
        expect(flashMessageSpy.getCall(0).args[0]).toBe('rooms.flash.accessCodeInvalid');

        // check if room is reloaded without access code
        moxios.wait(async () => {
          const request = moxios.requests.mostRecent();
          expect(request.url).toBe('/api/v1/rooms/abc-def-456');
          expect(request.config.headers['Access-Code']).toBeUndefined();
          await request.respondWith({
            status: 200,
            response: { data: { id: 'abc-def-456', name: 'Meeting One', owner: 'John Doe', type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: false, allowMembership: false, isMember: false, isOwner: false, isGuest: true, isModerator: false, canStart: false, running: false } }
          });
          // check if reload was successful and no other error message is shown
          expect(flashMessageSpy.calledOnce).toBeTruthy();

          view.destroy();
          done();
        });
      });
    });
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
        room: { id: 'cba-fed-234', name: 'Meeting Two', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: false, running: false, accessCode: 123456789 },
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
    view.destroy();
  });

  it('error beforeRouteEnter', function (done) {
    moxios.stubRequest('/api/v1/rooms/abc-def-456', {
      status: env.HTTP_SERVICE_UNAVAILABLE
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

    const next = (error) => {
      expect(error instanceof Error).toBeTruthy();
      expect(error.response.status).toBe(env.HTTP_SERVICE_UNAVAILABLE);
      view.destroy();
      done();
    };
    RoomView.beforeRouteEnter.call(view.vm, to, undefined, next);
  });
});
