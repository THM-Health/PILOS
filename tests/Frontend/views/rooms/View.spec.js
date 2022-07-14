import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, { BAlert, BButton, BFormCheckbox } from 'bootstrap-vue';
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

import storeOrg from '../../../../resources/js/store';
import i18n from '../../../../resources/js/i18n';

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

const routerMock = new VueRouter({
  mode: 'abstract',
  routes: [{
    path: '/rooms/:id/:token?',
    name: 'rooms.view',
    component: RoomView
  }]
});

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

describe('Room', function () {
  beforeEach(function () {
    store.commit('session/setCurrentUser', { currentUser: exampleUser });
    moxios.install();
  });
  afterEach(function () {
    moxios.uninstall();
  });

  it('guest forbidden', function (done) {
    moxios.stubRequest('/api/v1/rooms/abc-def-123', {
      status: 403,
      response: {
        message: 'guests_not_allowed'
      }
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

  it('room token', function (done) {
    const flashMessageSpy = sinon.spy();
    const flashMessage = {
      info (param) {
        flashMessageSpy(param);
      }
    };

    const routerSpy = sinon.spy();
    const router = new VueRouter();
    router.push = routerSpy;
    const sandbox = sinon.createSandbox();
    sandbox.replaceGetter(router, 'currentRoute', function () {
      return { path: '/rooms/knz-6ah-anr' };
    });
    sandbox.stub(storeOrg, 'getters').value({ 'session/isAuthenticated': false });
    Vue.prototype.flashMessage = flashMessage;

    store.commit('session/setCurrentUser', { currentUser: null });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      router,
      attachTo: createContainer()
    });

    const to = { params: { id: 'abc-def-123', token: 'xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR' } };

    RoomView.beforeRouteEnter.call(view.vm, to, undefined, async next => {
      next(view.vm);
      await view.vm.$nextTick();

      expect(view.html()).toContain('Meeting One');
      expect(view.html()).toContain('Max Doe');

      expect(view.findComponent({ ref: 'guestName' }).element.value).toBe('John Doe');

      expect(view.vm.$data.reloadInterval).not.toBeNull();

      const reloadButton = view.findComponent({ ref: 'reloadButton' });
      await reloadButton.trigger('click');
      await moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.config.method).toEqual('get');
        expect(request.config.url).toEqual('/api/v1/rooms/abc-def-123');
        expect(request.headers.Token).toBe('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
        await moxios.requests.mostRecent().respondWith({
          status: 200,
          response: { data: { id: 'abc-def-456', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, username: 'Peter Doe', allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: false, running: false, current_user: null } }
        });

        await view.vm.$nextTick();
        expect(view.findComponent({ ref: 'guestName' }).element.value).toBe('Peter Doe');

        sandbox.restore();
        view.destroy();
        done();
      });
    });

    moxios.wait(async () => {
      const request = moxios.requests.mostRecent();
      expect(request.config.method).toEqual('get');
      expect(request.config.url).toEqual('/api/v1/rooms/abc-def-123');
      expect(request.headers.Token).toBe('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');

      await moxios.requests.mostRecent().respondWith({
        status: 200,
        response: { data: { id: 'abc-def-456', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, username: 'John Doe', allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: false, running: false, current_user: null } }
      });
    });
  });

  it('room token invalid', function (done) {
    const flashMessageSpy = sinon.spy();
    const flashMessage = {
      info (param) {
        flashMessageSpy(param);
      }
    };

    const routerSpy = sinon.spy();
    const router = new VueRouter();
    router.push = routerSpy;
    const sandbox = sinon.createSandbox();
    sandbox.replaceGetter(router, 'currentRoute', function () {
      return { path: '/rooms/knz-6ah-anr' };
    });
    sandbox.stub(storeOrg, 'getters').value({ 'session/isAuthenticated': false });
    Vue.prototype.flashMessage = flashMessage;

    store.commit('session/setCurrentUser', { currentUser: null });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      router,
      attachTo: createContainer()
    });

    const to = { params: { id: 'abc-def-123', token: 'xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR' } };

    RoomView.beforeRouteEnter.call(view.vm, to, undefined, async next => {
      next(view.vm);
      await view.vm.$nextTick();

      const alert = view.findComponent(BAlert);
      expect(alert.exists()).toBeTruthy();
      expect(alert.text()).toBe('rooms.invalidPersonalLink');

      expect(view.vm.$data.reloadInterval).toBeNull();

      sandbox.restore();
      view.destroy();
      done();
    });

    moxios.wait(async () => {
      const request = moxios.requests.mostRecent();
      expect(request.config.method).toEqual('get');
      expect(request.config.url).toEqual('/api/v1/rooms/abc-def-123');
      expect(request.headers.Token).toBe('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');

      await moxios.requests.mostRecent().respondWith({
        status: 401,
        response: { message: 'invalid_token' }
      });
    });
  });

  it('room token as authenticated user', function (done) {
    const flashMessageSpy = sinon.spy();
    const flashMessage = {
      info (param) {
        flashMessageSpy(param);
      }
    };

    const routerSpy = sinon.spy();
    const router = new VueRouter();
    router.push = routerSpy;
    const sandbox = sinon.createSandbox();
    sandbox.stub(storeOrg, 'getters').value({ 'session/isAuthenticated': true });
    sandbox.stub(i18n, 't').callsFake((key) => key);

    Vue.prototype.flashMessage = flashMessage;

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      router,
      attachTo: createContainer()
    });

    const to = { params: { id: 'abc-def-123', token: 'xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR' } };

    RoomView.beforeRouteEnter.call(view.vm, to, undefined, async next => {
      expect(next).toBe('/');
      expect(flashMessageSpy.calledOnce).toBeTruthy();
      expect(flashMessageSpy.getCall(0).args[0]).toBe('app.flash.guestsOnly');

      Vue.prototype.flashMessage = undefined;

      sandbox.restore();
      view.destroy();
      done();
    });
  });

  it('room not found', function (done) {
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
      expect(next).toBe('/404');
      view.destroy();
      done();
    });

    moxios.wait(async () => {
      const request = moxios.requests.mostRecent();
      expect(request.config.method).toEqual('get');
      expect(request.config.url).toEqual('/api/v1/rooms/abc-def-123');

      await moxios.requests.mostRecent().respondWith({
        status: 404,
        response: {
          message: 'No query results for model [App\\Room] abc-def-123'
        }
      });
    });
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

  it('ask access token', function (done) {
    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      attachTo: createContainer(),
      router: routerMock,
      data () {
        return {
          room: { id: 'abc-def-456', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: false, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: false, running: false, current_user: exampleUser },
          room_id: 'abc-def-456'
        };
      }
    });

    view.vm.$nextTick().then(() => {
      expect(view.html()).toContain('rooms.requireAccessCode');
      view.destroy();
      done();
    });
  });

  it('room details auth. guest', function (done) {
    store.commit('session/setCurrentUser', { currentUser: null });
    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      router: routerMock,
      attachTo: createContainer(),
      data () {
        return {
          room: { id: 'abc-def-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: false, running: true, current_user: null },
          room_id: 'abc-def-789'
        };
      }
    });

    view.vm.$nextTick().then(async () => {
      expect(view.html()).toContain('Meeting One');
      expect(view.html()).toContain('Max Doe');
      expect(view.vm.invitationText).not.toContain('rooms.invitation.code');

      const joinButton = view.findComponent({ ref: 'joinMeeting' });
      const nameInput = view.findComponent({ ref: 'guestName' });
      expect(joinButton.attributes('disabled')).toEqual('disabled');
      nameInput.setValue('John Doe');
      await view.vm.$nextTick();
      expect(joinButton.attributes('disabled')).toBeUndefined();
      expect(view.findComponent({ ref: 'roomTypeInvalidAlert' }).exists()).toBe(false);
      view.vm.$set(view.vm.$data.room, 'roomTypeInvalid', true);
      await view.vm.$nextTick();
      expect(view.findComponent({ ref: 'roomTypeInvalidAlert' }).exists()).toBe(false);

      view.destroy();
      done();
    });
  });

  it('room details moderator', function (done) {
    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      router: routerMock,
      attachTo: createContainer(),
      data () {
        return {
          room: { id: 'cba-fed-123', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: true, isCoOwner: false, isModerator: true, canStart: true, running: false, accessCode: 123456789, current_user: exampleUser },
          room_id: 'cba-fed-123'
        };
      }
    });

    view.vm.$nextTick().then(async () => {
      expect(view.html()).toContain('Meeting One');
      expect(view.html()).toContain('Max Doe');
      expect(view.vm.invitationText).toContain('rooms.invitation.code');

      const adminComponent = view.findComponent(AdminComponent);
      expect(adminComponent.exists()).toBeFalsy();
      expect(view.findComponent({ ref: 'roomTypeInvalidAlert' }).exists()).toBe(false);
      view.vm.$set(view.vm.$data.room, 'roomTypeInvalid', true);
      await view.vm.$nextTick();
      expect(view.findComponent({ ref: 'roomTypeInvalidAlert' }).exists()).toBe(true);
      view.destroy();
      done();
    });
  });

  it('room admin components for owner', function (done) {
    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      router: routerMock,
      attachTo: createContainer(),
      data () {
        return {
          room: { id: 'gs4-6fb-kk8', name: 'Meeting One', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: true, running: false, accessCode: 123456789, current_user: exampleUser },
          room_id: 'gs4-6fb-kk8'
        };
      }
    });

    view.vm.$nextTick().then(async () => {
      expect(view.html()).toContain('Meeting One');
      expect(view.html()).toContain('John Doe');

      expect(view.vm.invitationText).toContain('rooms.invitation.code');
      const adminComponent = view.findComponent(AdminComponent);

      expect(adminComponent.exists()).toBeTruthy();

      expect(view.findComponent({ ref: 'roomTypeInvalidAlert' }).exists()).toBe(false);
      view.vm.$set(view.vm.$data.room, 'roomTypeInvalid', true);
      await view.vm.$nextTick();
      expect(view.findComponent({ ref: 'roomTypeInvalidAlert' }).exists()).toBe(true);

      view.destroy();
      done();
    });
  });

  it('room admin components for co-owner', function (done) {
    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      router: routerMock,
      attachTo: createContainer(),
      data () {
        return {
          room: { id: 'gs4-6fb-kk8', name: 'Meeting One', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: true, isCoOwner: true, isModerator: false, canStart: true, running: false, accessCode: 123456789, current_user: exampleUser },
          room_id: 'gs4-6fb-kk8'
        };
      }
    });

    view.vm.$nextTick().then(async () => {
      expect(view.html()).toContain('Meeting One');
      expect(view.html()).toContain('John Doe');

      expect(view.vm.invitationText).toContain('rooms.invitation.code');
      const adminComponent = view.findComponent(AdminComponent);
      expect(adminComponent.exists()).toBeTruthy();

      expect(view.findComponent({ ref: 'roomTypeInvalidAlert' }).exists()).toBe(false);
      view.vm.$set(view.vm.$data.room, 'roomTypeInvalid', true);
      await view.vm.$nextTick();
      expect(view.findComponent({ ref: 'roomTypeInvalidAlert' }).exists()).toBe(true);

      view.destroy();
      done();
    });
  });

  it('room admin components with rooms.viewAll permission', function (done) {
    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      router: routerMock,
      attachTo: createContainer(),
      data () {
        return {
          room: { id: 'gs4-6fb-kk8', name: 'Meeting One', owner: { id: 2, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: true, running: false, accessCode: 123456789, current_user: exampleUser },
          room_id: 'gs4-6fb-kk8'
        };
      }
    });

    view.vm.$nextTick().then(async () => {
      expect(view.html()).toContain('Meeting One');
      expect(view.html()).toContain('John Doe');

      expect(view.findComponent(AdminComponent).exists()).toBeFalsy();

      const newUser = _.clone(exampleUser);
      newUser.permissions = ['rooms.viewAll'];
      store.commit('session/setCurrentUser', { currentUser: newUser });

      await Vue.nextTick();
      expect(view.findComponent(AdminComponent).exists()).toBeTruthy();

      view.destroy();
      done();
    });
  });

  it('reload', function (done) {
    const baseError = sinon.stub(Base, 'error');

    const handleInvalidCode = sinon.stub(RoomView.methods, 'handleInvalidCode');
    const handleGuestsNotAllowed = sinon.stub(RoomView.methods, 'handleGuestsNotAllowed');
    const handleInvalidToken = sinon.stub(RoomView.methods, 'handleInvalidToken');

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs: {
        'room-admin': true
      },
      store,
      router: routerMock,
      attachTo: createContainer(),
      data () {
        return {
          room: { id: 'cba-fed-234', name: 'Meeting One', owner: { id: 2, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: true, isCoOwner: true, isModerator: false, canStart: true, running: false, accessCode: 123456789, current_user: exampleUser },
          room_id: 'cba-fed-234'
        };
      }
    });

    view.vm.$nextTick(async () => {
      expect(view.html()).toContain('Meeting One');
      expect(view.html()).toContain('John Doe');

      const reloadButton = view.findComponent({ ref: 'reloadButton' });
      await reloadButton.trigger('click');

      moxios.wait(async () => {
        await view.vm.$nextTick();
        const request = moxios.requests.mostRecent();
        expect(request.config.method).toEqual('get');
        expect(request.config.url).toEqual('/api/v1/rooms/cba-fed-234');
        await moxios.requests.mostRecent().respondWith({
          status: 200,
          response: { data: { id: 'cba-fed-234', name: 'Meeting Two', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: true, isCoOwner: false, isModerator: true, canStart: true, running: false, accessCode: 123456789, current_user: exampleUser } }
        });

        expect(view.html()).toContain('Meeting Two');

        await reloadButton.trigger('click');
        await moxios.wait(async () => {
          await moxios.requests.mostRecent().respondWith({
            status: 401,
            response: { message: 'invalid_code' }
          });

          expect(handleInvalidCode.calledOnce).toBeTruthy();

          await reloadButton.trigger('click');
          await moxios.wait(async () => {
            await moxios.requests.mostRecent().respondWith({
              status: 401,
              response: { message: 'invalid_token' }
            });

            expect(handleInvalidToken.calledOnce).toBeTruthy();

            await reloadButton.trigger('click');
            await moxios.wait(async () => {
              await moxios.requests.mostRecent().respondWith({
                status: 403,
                response: { message: 'guests_not_allowed' }
              });

              expect(handleGuestsNotAllowed.calledOnce).toBeTruthy();

              handleGuestsNotAllowed.restore();
              handleInvalidToken.restore();
              handleInvalidCode.restore();

              await reloadButton.trigger('click');
              await moxios.wait(async () => {
                await moxios.requests.mostRecent().respondWith({
                  status: 500,
                  data: { message: 'Internal server error' }
                });

                expect(baseError.calledOnce).toBeTruthy();
                expect(baseError.getCall(0).args[0].response.status).toEqual(500);
                Base.error.restore();

                view.destroy();
                done();
              });
            });
          });
        });
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

  it('handle invalid token', function () {
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
      data () {
        return {
          room: { id: 'abc-def-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, username: 'John Doe', allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: false, running: true, record_attendance: false, current_user: null },
          room_id: 'abc-def-789',
          name: 'John Doe',
          token: 'xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR'
        };
      },
      store,
      attachTo: createContainer()
    });

    view.vm.handleInvalidToken();
    expect(view.vm.$data.room).toBeNull();
    expect(flashMessageSpy.calledOnce).toBeTruthy();
    expect(flashMessageSpy.getCall(0).args[0]).toBe('rooms.flash.tokenInvalid');
    expect(view.vm.$data.reloadInterval).toBeNull();
    view.destroy();
  });

  it('handle empty code', function (done) {
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
      attachTo: createContainer(),
      data () {
        return {
          room: { id: 'abc-def-456', name: 'Meeting One', owner: 'John Doe', type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: false, allowMembership: false, isMember: false, isOwner: false, isGuest: true, isModerator: false, canStart: false, running: false, current_user: null },
          room_id: 'abc-def-456'
        };
      }
    });

    // load room view
    view.vm.$nextTick().then(async () => {
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
            response: { data: { id: 'abc-def-456', name: 'Meeting One', owner: 'John Doe', type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: false, allowMembership: false, isMember: false, isOwner: false, isGuest: true, isModerator: false, canStart: false, running: false, current_user: null } }
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
    const handleGuestsNotAllowed = sinon.stub(RoomView.methods, 'handleGuestsNotAllowed');
    const handleInvalidToken = sinon.stub(RoomView.methods, 'handleInvalidToken');
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
        room: { id: 'cba-fed-234', name: 'Meeting Two', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: false, running: false, accessCode: 123456789, current_user: exampleUser },
        accessCode: 123456789
      },
      store,
      attachTo: createContainer()
    });

    view.vm.onFileListError({ response: { status: 401, data: { message: 'invalid_code' } } });
    expect(handleInvalidCode.calledOnce).toBeTruthy();

    view.vm.onFileListError({ response: { status: 403, data: { message: 'require_code' } } });
    expect(handleInvalidCode.calledTwice).toBeTruthy();

    view.vm.onFileListError({ response: { status: 403, data: { message: 'guests_not_allowed' } } });
    expect(handleGuestsNotAllowed.calledOnce).toBeTruthy();

    view.vm.onFileListError({ response: { status: 401, data: { message: 'invalid_token' } } });
    expect(handleInvalidToken.calledOnce).toBeTruthy();

    view.vm.onFileListError({ response: { status: 500, data: { message: 'Internal server error' } } });
    expect(baseError.calledOnce).toBeTruthy();
    expect(baseError.getCall(0).args[0].response.status).toEqual(500);

    Base.error.restore();
    handleGuestsNotAllowed.restore();
    handleInvalidToken.restore();
    handleInvalidCode.restore();
    view.destroy();
  });

  it('join running meeting', function (done) {
    const oldWindow = window.location;
    delete window.location;
    window.location = null;

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs: {
        'file-component': true
      },
      store,
      attachTo: createContainer(),
      data () {
        return {
          room: { id: 'abc-def-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: false, running: true, record_attendance: false, current_user: exampleUser },
          room_id: 'abc-def-789'
        };
      }
    });

    view.vm.$nextTick().then(async () => {
      expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeFalsy();

      const joinButton = view.findComponent({ ref: 'joinMeeting' });
      await view.vm.$nextTick();

      expect(joinButton.attributes('disabled')).toBeUndefined();

      await joinButton.trigger('click');
      await view.vm.$nextTick();

      expect(joinButton.attributes('disabled')).toEqual('disabled');

      moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.config.method).toEqual('get');
        expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/join');
        expect(request.config.params).toEqual({ name: '', record_attendance: 0 });

        await moxios.requests.mostRecent().respondWith({
          status: 200,
          response: {
            url: 'test.tld'
          }
        });

        await view.vm.$nextTick();

        expect(joinButton.attributes('disabled')).toBeUndefined();

        expect(window.location).toEqual('test.tld');
        window.location = oldWindow;
        view.destroy();
        done();
      });
    });
  });

  it('join running meeting, attendance logging', function (done) {
    const oldWindow = window.location;
    delete window.location;
    window.location = null;

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs: {
        'file-component': true
      },
      store,
      attachTo: createContainer(),
      data () {
        return {
          room: { id: 'abc-def-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: false, running: true, record_attendance: true, current_user: exampleUser },
          room_id: 'abc-def-789'
        };
      }
    });

    view.vm.$nextTick().then(async () => {
      expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeTruthy();
      const agreementCheckbox = view.findComponent({ ref: 'recordingAttendanceInfo' }).findComponent(BFormCheckbox);
      await agreementCheckbox.get('input').trigger('click');

      const joinButton = view.findComponent({ ref: 'joinMeeting' });
      await view.vm.$nextTick();
      await joinButton.trigger('click');

      moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.config.method).toEqual('get');
        expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/join');
        expect(request.config.params).toEqual({ name: '', record_attendance: 1 });

        await moxios.requests.mostRecent().respondWith({
          status: 200,
          response: {
            url: 'test.tld'
          }
        });

        expect(window.location).toEqual('test.tld');
        window.location = oldWindow;

        view.destroy();
        done();
      });
    });
  });

  it('join running meeting guests', function (done) {
    store.commit('session/setCurrentUser', { currentUser: null });

    const oldWindow = window.location;
    delete window.location;
    window.location = null;

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs: {
        'file-component': true
      },
      store,
      attachTo: createContainer(),
      data () {
        return {
          room: { id: 'abc-def-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: false, running: true, record_attendance: true, current_user: null },
          room_id: 'abc-def-789'
        };
      }
    });

    view.vm.$nextTick().then(async () => {
      expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeTruthy();
      const agreementCheckbox = view.findComponent({ ref: 'recordingAttendanceInfo' }).findComponent(BFormCheckbox);
      await agreementCheckbox.get('input').trigger('click');

      const joinButton = view.findComponent({ ref: 'joinMeeting' });
      const nameInput = view.findComponent({ ref: 'guestName' });
      expect(joinButton.attributes('disabled')).toEqual('disabled');
      nameInput.setValue('John Doe 123!');
      await view.vm.$nextTick();
      expect(joinButton.attributes('disabled')).toBeUndefined();

      await view.vm.$nextTick();
      await joinButton.trigger('click');

      // Check with invalid chars in guest name
      moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.config.method).toEqual('get');
        expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/join');
        expect(request.config.params).toEqual({ name: 'John Doe 123!', record_attendance: 1 });

        // respond with validation errors
        await moxios.requests.mostRecent().respondWith({
          status: 422,
          response: {
            message: 'The given data was invalid.',
            errors: { name: ['The name contains the following non-permitted characters: 123!'] }
          }
        });

        // check if error is shown
        await view.vm.$nextTick();
        const nameGroup = view.find('#guest-name-group');
        expect(nameGroup.classes()).toContain('is-invalid');
        expect(nameGroup.text()).toContain('The name contains the following non-permitted characters: 123!');

        // Check with valid name
        nameInput.setValue('John Doe');
        await view.vm.$nextTick();
        await joinButton.trigger('click');

        moxios.wait(async () => {
          const request = moxios.requests.mostRecent();
          expect(request.config.method).toEqual('get');
          expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/join');
          expect(request.config.params).toEqual({ name: 'John Doe', record_attendance: 1 });

          // check if errors are removed on new request
          expect(nameGroup.classes()).not.toContain('is-invalid');
          expect(nameGroup.text()).not.toContain('The name contains the following non-permitted characters: 123!');

          await moxios.requests.mostRecent().respondWith({
            status: 200,
            response: {
              url: 'test.tld'
            }
          });

          expect(window.location).toEqual('test.tld');
          window.location = oldWindow;
          view.destroy();
          done();
        });
      });
    });
  });

  it('join running meeting guests with access token', function (done) {
    store.commit('session/setCurrentUser', { currentUser: null });

    const oldWindow = window.location;
    delete window.location;
    window.location = null;

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs: {
        'file-component': true
      },
      store,
      attachTo: createContainer(),
      data () {
        return {
          room: { id: 'abc-def-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: false, running: true, record_attendance: true, current_user: null },
          room_id: 'abc-def-789',
          accessCode: '905992606'
        };
      }
    });

    view.vm.$nextTick().then(async () => {
      expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeTruthy();
      const agreementCheckbox = view.findComponent({ ref: 'recordingAttendanceInfo' }).findComponent(BFormCheckbox);
      await agreementCheckbox.get('input').trigger('click');

      const joinButton = view.findComponent({ ref: 'joinMeeting' });
      const nameInput = view.findComponent({ ref: 'guestName' });
      expect(joinButton.attributes('disabled')).toEqual('disabled');
      nameInput.setValue('John Doe 123!');
      await view.vm.$nextTick();
      expect(joinButton.attributes('disabled')).toBeUndefined();

      await view.vm.$nextTick();
      await joinButton.trigger('click');

      // Check with invalid chars in guest name
      moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.config.method).toEqual('get');
        expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/join');
        expect(request.config.headers['Access-Code']).toBe('905992606');
        expect(request.config.params).toEqual({ name: 'John Doe 123!', record_attendance: 1 });

        // respond with validation errors
        await moxios.requests.mostRecent().respondWith({
          status: 422,
          response: {
            message: 'The given data was invalid.',
            errors: { name: ['The name contains the following non-permitted characters: 123!'] }
          }
        });

        // check if error is shown
        await view.vm.$nextTick();
        const nameGroup = view.find('#guest-name-group');
        expect(nameGroup.classes()).toContain('is-invalid');
        expect(nameGroup.text()).toContain('The name contains the following non-permitted characters: 123!');

        // Check with valid name
        nameInput.setValue('John Doe');
        await view.vm.$nextTick();
        await joinButton.trigger('click');

        moxios.wait(async () => {
          const request = moxios.requests.mostRecent();
          expect(request.config.method).toEqual('get');
          expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/join');
          expect(request.config.headers['Access-Code']).toBe('905992606');
          expect(request.config.params).toEqual({ name: 'John Doe', record_attendance: 1 });

          // check if errors are removed on new request
          expect(nameGroup.classes()).not.toContain('is-invalid');
          expect(nameGroup.text()).not.toContain('The name contains the following non-permitted characters: 123!');

          await moxios.requests.mostRecent().respondWith({
            status: 200,
            response: {
              url: 'test.tld'
            }
          });

          expect(window.location).toEqual('test.tld');
          window.location = oldWindow;
          view.destroy();
          done();
        });
      });
    });
  });

  it('join running meeting token', function (done) {
    store.commit('session/setCurrentUser', { currentUser: null });

    const oldWindow = window.location;
    delete window.location;
    window.location = null;

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs: {
        'file-component': true
      },
      store,
      attachTo: createContainer(),
      data () {
        return {
          room: { id: 'abc-def-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, username: 'John Doe', allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: false, running: true, record_attendance: false, current_user: null },
          room_id: 'abc-def-789',
          name: 'John Doe',
          token: 'xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR'
        };
      }
    });

    view.vm.$nextTick().then(async () => {
      const joinButton = view.findComponent({ ref: 'joinMeeting' });
      const nameInput = view.findComponent({ ref: 'guestName' });

      expect(joinButton.attributes('disabled')).toBeUndefined();
      expect(nameInput.attributes('disabled')).toBe('disabled');
      expect(nameInput.element.value).toBe('John Doe');

      await joinButton.trigger('click');

      // Check with invalid chars in guest name
      moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.config.method).toEqual('get');
        expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/join');
        expect(request.config.headers.Token).toBe('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
        expect(request.config.params).toEqual({ name: null, record_attendance: 0 });

        await moxios.requests.mostRecent().respondWith({
          status: 200,
          response: {
            url: 'test.tld'
          }
        });

        expect(window.location).toEqual('test.tld');
        window.location = oldWindow;
        view.destroy();
        done();
      });
    });
  });

  it('join meeting errors', function (done) {
    const handleInvalidCode = sinon.stub(RoomView.methods, 'handleInvalidCode');
    const handleGuestsNotAllowed = sinon.stub(RoomView.methods, 'handleGuestsNotAllowed');
    const handleInvalidToken = sinon.stub(RoomView.methods, 'handleInvalidToken');
    const baseError = sinon.stub(Base, 'error');

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs: {
        'file-component': true
      },
      store,
      attachTo: createContainer(),
      data () {
        return {
          room: { id: 'abc-def-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: false, running: true, record_attendance: false, current_user: exampleUser },
          room_id: 'abc-def-789'
        };
      }
    });

    view.vm.$nextTick().then(async () => {
      const joinButton = view.findComponent({ ref: 'joinMeeting' });
      expect(joinButton.attributes('disabled')).toBeUndefined();

      // Test guests not allowed
      await joinButton.trigger('click');
      moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.config.method).toEqual('get');
        expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/join');
        expect(request.config.params).toEqual({ name: '', record_attendance: 0 });
        await moxios.requests.mostRecent().respondWith({
          status: 403,
          response: { message: 'guests_not_allowed' }
        });
        await view.vm.$nextTick();

        expect(handleGuestsNotAllowed.calledOnce).toBeTruthy();

        // Test invalid access token
        await joinButton.trigger('click');
        moxios.wait(async () => {
          const request = moxios.requests.mostRecent();
          expect(request.config.method).toEqual('get');
          expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/join');
          expect(request.config.params).toEqual({ name: '', record_attendance: 0 });
          await moxios.requests.mostRecent().respondWith({
            status: 401,
            response: { message: 'invalid_code' }
          });
          await view.vm.$nextTick();
          expect(handleInvalidCode.calledOnce).toBeTruthy();

          // Test invalid access token
          await joinButton.trigger('click');
          moxios.wait(async () => {
            const request = moxios.requests.mostRecent();
            expect(request.config.method).toEqual('get');
            expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/join');
            expect(request.config.params).toEqual({ name: '', record_attendance: 0 });
            await moxios.requests.mostRecent().respondWith({
              status: 403,
              response: { message: 'require_code' }
            });
            await view.vm.$nextTick();
            expect(handleInvalidCode.calledTwice).toBeTruthy();

            // Test invalid token
            await joinButton.trigger('click');
            moxios.wait(async () => {
              const request = moxios.requests.mostRecent();
              expect(request.config.method).toEqual('get');
              expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/join');
              expect(request.config.params).toEqual({ name: '', record_attendance: 0 });

              await moxios.requests.mostRecent().respondWith({
                status: 401,
                response: { message: 'invalid_token' }
              });

              await view.vm.$nextTick();
              expect(handleInvalidToken.calledOnce).toBeTruthy();

              // Test without required recording agreement
              expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeFalsy();
              await joinButton.trigger('click');

              moxios.wait(async () => {
                const request = moxios.requests.mostRecent();
                expect(request.config.method).toEqual('get');
                expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/join');
                expect(request.config.params).toEqual({ name: '', record_attendance: 0 });
                await moxios.requests.mostRecent().respondWith({
                  status: 470,
                  response: {
                    message: 'Consent to record attendance is required.'
                  }
                });
                await view.vm.$nextTick();
                expect(baseError.calledOnce).toBeTruthy();
                expect(baseError.getCall(0).args[0].response.status).toEqual(470);
                expect(baseError.getCall(0).args[0].response.data.message).toEqual('Consent to record attendance is required.');
                expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeTruthy();

                // Test Room closed
                const agreementCheckbox = view.findComponent({ ref: 'recordingAttendanceInfo' }).findComponent(BFormCheckbox);
                await agreementCheckbox.get('input').trigger('click');

                const joinButton = view.findComponent({ ref: 'joinMeeting' });
                expect(joinButton.attributes('disabled')).toBeUndefined();
                await joinButton.trigger('click');

                moxios.wait(async () => {
                  const request = moxios.requests.mostRecent();
                  expect(request.config.method).toEqual('get');
                  expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/join');
                  expect(request.config.params).toEqual({ name: '', record_attendance: 1 });

                  await moxios.requests.mostRecent().respondWith({
                    status: 460,
                    response: {
                      message: 'Joining failed! The room is currently closed.'
                    }
                  });

                  expect(baseError.calledTwice).toBeTruthy();
                  expect(baseError.getCall(1).args[0].response.status).toEqual(460);
                  expect(baseError.getCall(1).args[0].response.data.message).toEqual('Joining failed! The room is currently closed.');

                  expect(view.findComponent({ ref: 'joinMeeting' }).exists()).toBeFalsy();

                  Base.error.restore();
                  handleGuestsNotAllowed.restore();
                  handleInvalidToken.restore();
                  handleInvalidCode.restore();
                  view.destroy();
                  done();
                });
              });
            });
          });
        });
      });
    });
  });

  it('start meeting', function (done) {
    const oldWindow = window.location;
    delete window.location;
    window.location = null;

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs: {
        'file-component': true
      },
      store,
      attachTo: createContainer(),
      data () {
        return {
          room: { id: 'abc-def-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: true, running: false, record_attendance: false, current_user: exampleUser },
          room_id: 'abc-def-789'
        };
      }
    });

    view.vm.$nextTick().then(async () => {
      expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeFalsy();

      const startButton = view.findComponent({ ref: 'startMeeting' });
      await view.vm.$nextTick();
      expect(startButton.attributes('disabled')).toBeUndefined();

      await startButton.trigger('click');
      await view.vm.$nextTick();

      expect(startButton.attributes('disabled')).toEqual('disabled');

      moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.config.method).toEqual('get');
        expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/start');
        expect(request.config.params).toEqual({ name: '', record_attendance: 0 });

        await moxios.requests.mostRecent().respondWith({
          status: 200,
          response: {
            url: 'test.tld'
          }
        });

        await view.vm.$nextTick();

        expect(startButton.attributes('disabled')).toBeUndefined();

        expect(window.location).toEqual('test.tld');
        window.location = oldWindow;
        view.destroy();
        done();
      });
    });
  });

  it('start meeting, attendance logging', function (done) {
    const oldWindow = window.location;
    delete window.location;
    window.location = null;

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs: {
        'file-component': true
      },
      store,
      attachTo: createContainer(),
      data () {
        return {
          room: { id: 'abc-def-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: true, running: false, record_attendance: true, current_user: exampleUser },
          room_id: 'abc-def-789'
        };
      }
    });

    view.vm.$nextTick().then(async () => {
      expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeTruthy();
      const agreementCheckbox = view.findComponent({ ref: 'recordingAttendanceInfo' }).findComponent(BFormCheckbox);
      await agreementCheckbox.get('input').trigger('click');

      const startButton = view.findComponent({ ref: 'startMeeting' });
      await view.vm.$nextTick();
      await startButton.trigger('click');

      moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.config.method).toEqual('get');
        expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/start');
        expect(request.config.params).toEqual({ name: '', record_attendance: 1 });

        await moxios.requests.mostRecent().respondWith({
          status: 200,
          response: {
            url: 'test.tld'
          }
        });

        expect(window.location).toEqual('test.tld');
        window.location = oldWindow;

        view.destroy();
        done();
      });
    });
  });

  it('start meeting guests', function (done) {
    store.commit('session/setCurrentUser', { currentUser: null });

    const oldWindow = window.location;
    delete window.location;
    window.location = null;

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs: {
        'file-component': true
      },
      store,
      attachTo: createContainer(),
      data () {
        return {
          room: { id: 'abc-def-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: true, running: false, record_attendance: true, current_user: null },
          room_id: 'abc-def-789'
        };
      }
    });

    view.vm.$nextTick().then(async () => {
      expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeTruthy();
      const agreementCheckbox = view.findComponent({ ref: 'recordingAttendanceInfo' }).findComponent(BFormCheckbox);
      await agreementCheckbox.get('input').trigger('click');

      const startButton = view.findComponent({ ref: 'startMeeting' });
      const nameInput = view.findComponent({ ref: 'guestName' });
      expect(startButton.attributes('disabled')).toEqual('disabled');
      nameInput.setValue('John Doe 123!');
      await view.vm.$nextTick();
      expect(startButton.attributes('disabled')).toBeUndefined();

      await view.vm.$nextTick();
      await startButton.trigger('click');

      // Check with invalid chars in name
      moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.config.method).toEqual('get');
        expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/start');
        expect(request.config.params).toEqual({ name: 'John Doe 123!', record_attendance: 1 });

        // respond with validation errors
        await moxios.requests.mostRecent().respondWith({
          status: 422,
          response: {
            message: 'The given data was invalid.',
            errors: { name: ['The name contains the following non-permitted characters: 123!'] }
          }
        });

        // check if error is shown
        await view.vm.$nextTick();
        const nameGroup = view.find('#guest-name-group');
        expect(nameGroup.classes()).toContain('is-invalid');
        expect(nameGroup.text()).toContain('The name contains the following non-permitted characters: 123!');

        // try without invalid chars
        nameInput.setValue('John Doe');
        await view.vm.$nextTick();
        await startButton.trigger('click');

        moxios.wait(async () => {
          const request = moxios.requests.mostRecent();
          expect(request.config.method).toEqual('get');
          expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/start');
          expect(request.config.params).toEqual({ name: 'John Doe', record_attendance: 1 });

          // check if errors are removed on new request
          expect(nameGroup.classes()).not.toContain('is-invalid');
          expect(nameGroup.text()).not.toContain('The name contains the following non-permitted characters: 123!');

          await moxios.requests.mostRecent().respondWith({
            status: 200,
            response: {
              url: 'test.tld'
            }
          });

          expect(window.location).toEqual('test.tld');
          window.location = oldWindow;
          view.destroy();
          done();
        });
      });
    });
  });

  it('start meeting errors', function (done) {
    const handleInvalidCode = sinon.stub(RoomView.methods, 'handleInvalidCode');
    const handleGuestsNotAllowed = sinon.stub(RoomView.methods, 'handleGuestsNotAllowed');
    const handleInvalidToken = sinon.stub(RoomView.methods, 'handleInvalidToken');

    const fileComponentReloadSpy = sinon.spy();
    const fileComponent = {
      name: 'test-component',
      /* eslint-disable @intlify/vue-i18n/no-raw-text */
      template: '<p>test</p>',
      methods: {
        reload: fileComponentReloadSpy
      }
    };

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
      stubs: {
        'file-component': fileComponent
      },
      store,
      attachTo: createContainer(),
      data () {
        return {
          room: { id: 'abc-def-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: true, running: false, record_attendance: false, current_user: exampleUser },
          room_id: 'abc-def-789'
        };
      }
    });

    view.vm.$nextTick().then(async () => {
      expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeFalsy();

      const startButton = view.findComponent({ ref: 'startMeeting' });
      expect(startButton.attributes('disabled')).toBeUndefined();

      // Test guests not allowed
      await startButton.trigger('click');
      moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.config.method).toEqual('get');
        expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/start');
        expect(request.config.params).toEqual({ name: '', record_attendance: 0 });
        await moxios.requests.mostRecent().respondWith({
          status: 403,
          response: { message: 'guests_not_allowed' }
        });
        await view.vm.$nextTick();

        expect(handleGuestsNotAllowed.calledOnce).toBeTruthy();

        // Test invalid access token
        await startButton.trigger('click');
        moxios.wait(async () => {
          const request = moxios.requests.mostRecent();
          expect(request.config.method).toEqual('get');
          expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/start');
          expect(request.config.params).toEqual({ name: '', record_attendance: 0 });
          await moxios.requests.mostRecent().respondWith({
            status: 401,
            response: { message: 'invalid_code' }
          });
          await view.vm.$nextTick();
          expect(handleInvalidCode.calledOnce).toBeTruthy();

          // Test access token required
          await startButton.trigger('click');
          moxios.wait(async () => {
            const request = moxios.requests.mostRecent();
            expect(request.config.method).toEqual('get');
            expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/start');
            expect(request.config.params).toEqual({ name: '', record_attendance: 0 });
            await moxios.requests.mostRecent().respondWith({
              status: 403,
              response: { message: 'require_code' }
            });
            await view.vm.$nextTick();
            expect(handleInvalidCode.calledTwice).toBeTruthy();

            // Test invalid token
            await startButton.trigger('click');
            moxios.wait(async () => {
              const request = moxios.requests.mostRecent();
              expect(request.config.method).toEqual('get');
              expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/start');
              expect(request.config.params).toEqual({ name: '', record_attendance: 0 });

              await moxios.requests.mostRecent().respondWith({
                status: 401,
                response: { message: 'invalid_token' }
              });

              await view.vm.$nextTick();
              expect(handleInvalidToken.calledOnce).toBeTruthy();

              await startButton.trigger('click');
              moxios.wait(async () => {
                const request = moxios.requests.mostRecent();
                expect(request.config.method).toEqual('get');
                expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/start');
                expect(request.config.params).toEqual({ name: '', record_attendance: 0 });

                await moxios.requests.mostRecent().respondWith({
                  status: 470,
                  response: {
                    message: 'Consent to record attendance is required.'
                  }
                });

                await view.vm.$nextTick();

                expect(baseError.calledOnce).toBeTruthy();
                expect(baseError.getCall(0).args[0].response.status).toEqual(470);
                expect(baseError.getCall(0).args[0].response.data.message).toEqual('Consent to record attendance is required.');
                Base.error.restore();

                expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeTruthy();
                const agreementCheckbox = view.findComponent({ ref: 'recordingAttendanceInfo' }).findComponent(BFormCheckbox);
                await agreementCheckbox.get('input').trigger('click');

                const startButton = view.findComponent({ ref: 'startMeeting' });
                expect(startButton.exists()).toBeTruthy();
                expect(startButton.attributes('disabled')).toBeUndefined();
                await startButton.trigger('click');

                moxios.wait(async () => {
                  const request = moxios.requests.mostRecent();
                  expect(request.config.method).toEqual('get');
                  expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/start');
                  expect(request.config.params).toEqual({ name: '', record_attendance: 1 });

                  await moxios.requests.mostRecent().respondWith({
                    status: 403,
                    response: {
                      message: 'This action is unauthorized.'
                    }
                  });

                  sinon.assert.calledOnceWithExactly(flashMessageSpy, 'rooms.flash.startForbidden');
                  expect(view.findComponent({ ref: 'startMeeting' }).exists()).toBeFalsy();

                  moxios.wait(async () => {
                    const request = moxios.requests.mostRecent();
                    expect(request.config.method).toEqual('get');
                    expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789');

                    await moxios.requests.mostRecent().respondWith({
                      status: 200,
                      response: { data: { id: 'abc-def-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: true, running: false, record_attendance: false, current_user: exampleUser } }
                    });

                    sinon.assert.calledOnce(fileComponentReloadSpy);

                    handleGuestsNotAllowed.restore();
                    handleInvalidToken.restore();
                    handleInvalidCode.restore();
                    view.destroy();
                    done();
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  it('start meeting access token', function (done) {
    const oldWindow = window.location;
    delete window.location;
    window.location = null;

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs: {
        'file-component': true
      },
      store,
      attachTo: createContainer(),
      data () {
        return {
          room: { id: 'abc-def-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: true, running: false, record_attendance: false, current_user: exampleUser },
          room_id: 'abc-def-789',
          accessCode: '905992606'
        };
      }
    });

    view.vm.$nextTick().then(async () => {
      expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeFalsy();

      const startButton = view.findComponent({ ref: 'startMeeting' });
      await view.vm.$nextTick();
      expect(startButton.attributes('disabled')).toBeUndefined();

      await startButton.trigger('click');
      await view.vm.$nextTick();

      expect(startButton.attributes('disabled')).toEqual('disabled');

      moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.config.method).toEqual('get');
        expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/start');
        expect(request.config.headers['Access-Code']).toBe('905992606');
        expect(request.config.params).toEqual({ name: '', record_attendance: 0 });

        await moxios.requests.mostRecent().respondWith({
          status: 200,
          response: {
            url: 'test.tld'
          }
        });

        await view.vm.$nextTick();

        expect(startButton.attributes('disabled')).toBeUndefined();

        expect(window.location).toEqual('test.tld');
        window.location = oldWindow;
        view.destroy();
        done();
      });
    });
  });

  it('start meeting token', function (done) {
    const oldWindow = window.location;
    delete window.location;
    window.location = null;

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs: {
        'file-component': true
      },
      store,
      attachTo: createContainer(),
      data () {
        return {
          room: { id: 'abc-def-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: true, running: false, record_attendance: false, current_user: exampleUser },
          room_id: 'abc-def-789',
          token: 'xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR'
        };
      }
    });

    view.vm.$nextTick().then(async () => {
      expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeFalsy();

      const startButton = view.findComponent({ ref: 'startMeeting' });
      await view.vm.$nextTick();
      expect(startButton.attributes('disabled')).toBeUndefined();

      await startButton.trigger('click');
      await view.vm.$nextTick();

      expect(startButton.attributes('disabled')).toEqual('disabled');

      moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.config.method).toEqual('get');
        expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/start');
        expect(request.config.headers.Token).toBe('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
        expect(request.config.params).toEqual({ name: null, record_attendance: 0 });

        await moxios.requests.mostRecent().respondWith({
          status: 200,
          response: {
            url: 'test.tld'
          }
        });

        await view.vm.$nextTick();

        expect(startButton.attributes('disabled')).toBeUndefined();

        expect(window.location).toEqual('test.tld');
        window.location = oldWindow;
        view.destroy();
        done();
      });
    });
  });

  it('end membership', function (done) {
    moxios.stubRequest('/api/v1/rooms/cba-fed-123/files', {
      status: 200,
      response: {
        data: {
          files: [],
          default: null
        }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      data () {
        return {
          room: { id: 'cba-fed-123', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: true, isCoOwner: false, isModerator: false, canStart: true, running: false, accessCode: 123456789, current_user: exampleUser },
          room_id: 'cba-fed-123'
        };
      }
    });

    view.vm.$nextTick().then(async () => {
      // Find confirm modal and check if it is hidden
      const leaveMembershipModal = view.findComponent({ ref: 'leave-membership-modal' });
      expect(leaveMembershipModal.vm.$data.isVisible).toBe(false);
      // Click button to leave membership
      await view.find('#leave-membership-button').trigger('click');

      // Wait until modal is open
      view.vm.$root.$once('bv::modal::shown', async () => {
        await view.vm.$nextTick();

        // Confirm modal is shown
        expect(leaveMembershipModal.vm.$data.isVisible).toBe(true);

        // Find the confirm button and click it
        const leaveConfirmButton = leaveMembershipModal.findAllComponents(BButton).at(1);
        expect(leaveConfirmButton.text()).toBe('rooms.endMembership.yes');
        await leaveConfirmButton.trigger('click');

        // Check if modal is closed
        view.vm.$root.$once('bv::modal::hidden', async () => {
          await view.vm.$nextTick();

          // Check if the modal is hidden
          expect(leaveMembershipModal.vm.$data.isVisible).toBe(false);

          // Check leave membership request
          moxios.wait(async () => {
            const request = moxios.requests.mostRecent();
            expect(request.config.method).toEqual('delete');
            expect(request.config.url).toEqual('/api/v1/rooms/cba-fed-123/membership');

            // Respond to leave membership request
            await moxios.requests.mostRecent().respondWith({
              status: 204,
              response: {}
            });

            // response for room reload, now with the user not beeing a member anymore
            moxios.wait(async () => {
              const request = moxios.requests.mostRecent();
              expect(request.config.method).toEqual('get');
              expect(request.config.url).toEqual('/api/v1/rooms/cba-fed-123');

              // Respond to leave membership request
              await moxios.requests.mostRecent().respondWith({
                status: 200,
                response: { data: { id: 'cba-fed-123', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: true, running: false, accessCode: 123456789, current_user: exampleUser } }
              });

              // Check if the leave membership button is not shown anymore, as the user is no longer a member
              expect(view.find('#leave-membership-button').exists()).toBeFalsy();

              view.destroy();
              done();
            });
          });
        });
      });
    });
  });

  it('logged in status change', function (done) {
    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      data () {
        return {
          room: { id: 'cba-fed-234', name: 'Meeting One', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: false, running: false, accessCode: 123456789, current_user: exampleUser },
          room_id: 'cba-fed-234'
        };
      },
      store,
      router: routerMock,
      attachTo: createContainer()
    });

    view.vm.$nextTick().then(() => {
      expect(view.findComponent(AdminComponent).exists()).toBeTruthy();

      const reloadButton = view.findComponent({ ref: 'reloadButton' });
      reloadButton.trigger('click');

      moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.config.method).toEqual('get');
        expect(request.config.url).toEqual('/api/v1/rooms/cba-fed-234');
        await moxios.requests.mostRecent().respondWith({
          status: 200,
          response: { data: { id: 'cba-fed-234', name: 'Meeting One', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: true, running: false, current_user: null } }
        });

        await view.vm.$nextTick();
        expect(view.findComponent(AdminComponent).exists()).toBeFalsy();
        expect(store.getters['session/isAuthenticated']).toBeFalsy();

        await reloadButton.trigger('click');
        moxios.wait(async () => {
          await moxios.requests.mostRecent().respondWith({
            status: 200,
            response: { data: { id: 'cba-fed-234', name: 'Meeting One', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: true, isCoOwner: true, isModerator: false, canStart: true, running: false, accessCode: 123456789, current_user: exampleUser } }
          });

          expect(store.getters['session/isAuthenticated']).toBeTruthy();
          expect(view.findComponent(AdminComponent).exists()).toBeTruthy();

          await reloadButton.trigger('click');
          moxios.wait(async () => {
            await moxios.requests.mostRecent().respondWith({
              status: 403,
              response: { message: 'guests_not_allowed' }
            });

            expect(view.findComponent(AdminComponent).exists()).toBeFalsy();
            expect(store.getters['session/isAuthenticated']).toBeFalsy();

            view.destroy();
            done();
          });
        });
      });
    });
  });

  it('random polling interval', async function () {
    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      data () {
        return {
          room: { id: 'cba-fed-234', name: 'Meeting One', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: false, running: false, accessCode: 123456789, current_user: exampleUser },
          room_id: 'cba-fed-234'
        };
      },
      store,
      router: routerMock,
      attachTo: createContainer()
    });

    await view.vm.$nextTick();
    // use fixed random value for testing only
    const random = sinon.stub(Math, 'random').returns(0.4);

    // check for pos. integer
    const refresh = sinon.stub(env, 'REFRESH_RATE').value(10);
    expect(view.vm.getRandomRefreshInterval()).toBe(14);

    // check for zero
    sinon.stub(env, 'REFRESH_RATE').value(0);
    expect(view.vm.getRandomRefreshInterval()).toBe(4);

    // check for neg. integer
    sinon.stub(env, 'REFRESH_RATE').value(-20);
    expect(view.vm.getRandomRefreshInterval()).toBe(24);

    // check for float
    sinon.stub(env, 'REFRESH_RATE').value(4.2);
    expect(view.vm.getRandomRefreshInterval()).toBe(8.2);

    // restore stubbed functions and properties
    random.restore();
    refresh.restore();

    view.destroy();
  });
});
