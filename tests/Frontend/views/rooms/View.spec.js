import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, { BAlert, BButton, BFormCheckbox } from 'bootstrap-vue';
import moxios from 'moxios';
import RoomView from '../../../../resources/js/views/rooms/View.vue';
import AdminComponent from '../../../../resources/js/components/Room/AdminComponent';
import Clipboard from 'v-clipboard';
import Vuex from 'vuex';
import Base from '../../../../resources/js/api/base';
import VueRouter from 'vue-router';
import PermissionService from '../../../../resources/js/services/PermissionService';
import Vue from 'vue';
import _ from 'lodash';
import env from '../../../../resources/js/env';

import storeOrg from '../../../../resources/js/store';
import i18n from '../../../../resources/js/i18n';
import { waitModalHidden, waitModalShown, waitMoxios, createContainer } from '../../helper';

const localVue = createLocalVue();

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
        currentUser: exampleUser,
        settings: {
          room_refresh_rate: 30
        }
      },
      getters: {
        isAuthenticated: (state) => !_.isEmpty(state.currentUser),
        settings: (state) => (setting) => _.isEmpty(state.settings) ? undefined : _.get(state.settings, setting)
      },
      mutations: {
        setCurrentUser (state, { currentUser, emit = true }) {
          state.currentUser = currentUser;
          PermissionService.setCurrentUser(state.currentUser, emit);
        },
        setSettings (state, settings) {
          state.settings = settings;
        }
      }
    }
  },
  state: {
    loadingCounter: 0
  }
});

describe('Room', () => {
  beforeEach(() => {
    store.commit('session/setCurrentUser', { currentUser: exampleUser });
    moxios.install();
  });
  afterEach(() => {
    moxios.uninstall();
  });

  it('guest forbidden', async () => {
    moxios.stubRequest('/api/v1/rooms/abc-def-123', {
      status: 403,
      response: {
        message: 'guests_not_allowed'
      }
    });

    const router = new VueRouter({ mode: 'abstract' });
    await router.push('/rooms/knz-6ah-anr');
    const routerSpy = jest.spyOn(router, 'push').mockImplementation();

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

    const next = await new Promise((resolve) => {
      RoomView.beforeRouteEnter.call(view.vm, to, undefined, async next => {
        resolve(next);
      });
    });
    next(view.vm);

    await view.vm.$nextTick();
    expect(view.html()).toContain('rooms.onlyUsedByAuthenticatedUsers');

    const tryAgain = view.findAllComponents(BButton).at(0);
    const login = view.findAllComponents(BButton).at(1);

    expect(tryAgain.html()).toContain('rooms.tryAgain');
    expect(login.html()).toContain('rooms.login');

    await tryAgain.trigger('click');

    await waitMoxios();
    const request = moxios.requests.mostRecent();
    expect(request.config.url).toBe('/api/v1/rooms/abc-def-123');
    await view.vm.$nextTick();

    await login.trigger('click');
    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'login', query: { redirect: '/rooms/knz-6ah-anr' } });
    view.destroy();
  });

  it('room token', async () => {
    const flashMessageSpy = jest.fn();
    const flashMessage = { info: flashMessageSpy };

    const router = new VueRouter();
    jest.spyOn(router, 'push').mockImplementation();

    Vue.prototype.flashMessage = flashMessage;

    await store.commit('session/setCurrentUser', { currentUser: null });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      router,
      attachTo: createContainer()
    });

    const to = {
      params: {
        id: 'abc-def-123',
        token: 'xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR'
      }
    };

    // call before route enter hook and promise to call if next is executed (room data was loaded)
    const promise = new Promise((resolve) => {
      RoomView.beforeRouteEnter.call(view.vm, to, undefined, async next => {
        resolve(next);
      });
    });

    // wait for the request from the beforeRouteEnter hook in the RoomView
    await waitMoxios();
    let request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/rooms/abc-def-123');
    expect(request.headers.Token).toBe('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
    await moxios.requests.mostRecent().respondWith({
      status: 200,
      response: { data: { id: 'abc-def-456', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, username: 'John Doe', allow_membership: false, is_member: false, is_co_owner: false, is_moderator: false, can_start: false, running: false, current_user: null } }
    });

    // wait for promise to be resolved (room data is loaded)
    const next = await promise;
    next(view.vm);

    await view.vm.$nextTick();

    // check if view shows meeting data and the correct guests name (due to the personalized room link token)
    expect(view.html()).toContain('Meeting One');
    expect(view.html()).toContain('Max Doe');
    expect(view.findComponent({ ref: 'guestName' }).element.value).toBe('John Doe');
    expect(view.vm.$data.reloadInterval).not.toBeNull();

    // reload page
    const reloadButton = view.findComponent({ ref: 'reloadButton' });
    await reloadButton.trigger('click');

    // respond with different name (room owner changed the name of the personalized room link in the meantime)
    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/rooms/abc-def-123');
    expect(request.headers.Token).toBe('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
    await moxios.requests.mostRecent().respondWith({
      status: 200,
      response: { data: { id: 'abc-def-456', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, username: 'Peter Doe', allow_membership: false, is_member: false, is_co_owner: false, is_moderator: false, can_start: false, running: false, current_user: null } }
    });

    // check if ui reflects the change
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'guestName' }).element.value).toBe('Peter Doe');

    view.destroy();
  });

  it('room token invalid', async () => {
    const flashMessageSpy = jest.fn();
    const flashMessage = { info: flashMessageSpy };

    const router = new VueRouter();
    jest.spyOn(router, 'push').mockImplementation();

    await store.commit('session/setCurrentUser', { currentUser: null });

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

    const to = {
      params: {
        id: 'abc-def-123',
        token: 'xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR'
      }
    };

    // call before route enter hook and promise to call if next is executed (room data was loaded)
    const promise = new Promise((resolve) => {
      RoomView.beforeRouteEnter.call(view.vm, to, undefined, async next => {
        resolve(next);
      });
    });

    // wait for the request from the beforeRouteEnter hook in the RoomView
    await waitMoxios();
    const request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/rooms/abc-def-123');
    expect(request.headers.Token).toBe('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
    await moxios.requests.mostRecent().respondWith({
      status: 401,
      response: { message: 'invalid_token' }
    });

    // wait for promise to be resolved (room data is loaded)
    const next = await promise;
    next(view.vm);

    await view.vm.$nextTick();

    // check if error message for invalid personal link is shown
    const alert = view.findComponent(BAlert);
    expect(alert.exists()).toBeTruthy();
    expect(alert.text()).toBe('rooms.invalidPersonalLink');

    expect(view.vm.$data.reloadInterval).toBeNull();

    view.destroy();
  });

  it('room token as authenticated user', async () => {
    const flashMessageSpy = jest.fn();
    const flashMessage = { info: flashMessageSpy };

    const router = new VueRouter();
    jest.spyOn(router, 'push').mockImplementation();
    jest.spyOn(i18n, 't').mockImplementation((key) => key);

    await storeOrg.commit('session/setCurrentUser', { currentUser: exampleUser });

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

    // call before route enter hook and promise to call if next is executed (room data was loaded)
    const promise = new Promise((resolve) => {
      RoomView.beforeRouteEnter.call(view.vm, to, undefined, async next => {
        resolve(next);
      });
    });

    // wait for promise to be resolved (room data is loaded)
    const next = await promise;
    expect(next).toBe('/');

    expect(flashMessageSpy).toBeCalledTimes(1);
    expect(flashMessageSpy).toBeCalledWith('app.flash.guestsOnly');

    Vue.prototype.flashMessage = undefined;
    view.destroy();
  });

  it('room not found', async () => {
    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      attachTo: createContainer()
    });

    const to = { params: { id: 'abc-def-123' } };

    // call before route enter hook and promise to call if next is executed (room data was loaded)
    const promise = new Promise((resolve) => {
      RoomView.beforeRouteEnter.call(view.vm, to, undefined, async next => {
        resolve(next);
      });
    });

    // wait for the request from the beforeRouteEnter hook in the RoomView
    await waitMoxios();
    const request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/rooms/abc-def-123');
    await moxios.requests.mostRecent().respondWith({
      status: 404,
      response: {
        message: 'No query results for model [App\\Room] abc-def-123'
      }
    });

    // wait for promise to be resolved (room data is loaded)
    const next = await promise;
    expect(next).toBe('/404');

    view.destroy();
  });

  it('error beforeRouteEnter', async () => {
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

    // call before route enter hook and promise to call if next is executed (room data was loaded)
    const promise = new Promise((resolve) => {
      RoomView.beforeRouteEnter.call(view.vm, to, undefined, async next => {
        resolve(next);
      });
    });

    // wait for promise to be resolved (room data loading failed)
    const next = await promise;
    expect(next instanceof Error).toBeTruthy();
    expect(next.response.status).toBe(env.HTTP_SERVICE_UNAVAILABLE);
    view.destroy();
  });

  it('ask access token', async () => {
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
          room: { id: 'abc-def-456', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: false, allow_membership: false, is_member: false, is_co_owner: false, is_moderator: false, can_start: false, running: false, current_user: exampleUser },
          room_id: 'abc-def-456'
        };
      }
    });

    await view.vm.$nextTick();
    expect(view.html()).toContain('rooms.requireAccessCode');
    view.destroy();
  });

  it('room details auth. guest', async () => {
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
          room: {
            id: 'abc-def-789',
            name: 'Meeting One',
            owner: { id: 2, name: 'Max Doe' },
            type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
            model_name: 'Room',
            authenticated: true,
            allow_membership: false,
            is_member: false,
            is_co_owner: false,
            is_moderator: false,
            can_start: false,
            running: true,
            current_user: null
          },
          room_id: 'abc-def-789'
        };
      }
    });

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
    expect(view.findComponent({ ref: 'roomTypeInvalidAlert' }).exists()).toBe(false);
    view.vm.$set(view.vm.$data.room, 'room_type_invalid', true);
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'roomTypeInvalidAlert' }).exists()).toBe(false);

    view.destroy();
  });

  it('room details moderator', async () => {
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
          room: {
            id: 'cba-fed-123',
            name: 'Meeting One',
            owner: { id: 2, name: 'Max Doe' },
            type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
            model_name: 'Room',
            authenticated: true,
            allow_membership: false,
            is_member: true,
            is_co_owner: false,
            is_moderator: true,
            can_start: true,
            running: false,
            access_code: 123456789,
            current_user: exampleUser
          },
          room_id: 'cba-fed-123'
        };
      }
    });

    await view.vm.$nextTick();
    expect(view.html()).toContain('Meeting One');
    expect(view.html()).toContain('Max Doe');
    expect(view.vm.invitationText).toContain('rooms.invitation.code');

    const adminComponent = view.findComponent(AdminComponent);
    expect(adminComponent.exists()).toBeFalsy();
    expect(view.findComponent({ ref: 'roomTypeInvalidAlert' }).exists()).toBe(false);
    view.vm.$set(view.vm.$data.room, 'room_type_invalid', true);
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'roomTypeInvalidAlert' }).exists()).toBe(true);
    view.destroy();
  });

  it('room admin components for owner', async () => {
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
          room: {
            id: 'gs4-6fb-kk8',
            name: 'Meeting One',
            owner: { id: 1, name: 'John Doe' },
            type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
            model_name: 'Room',
            authenticated: true,
            allow_membership: false,
            is_member: false,
            is_co_owner: false,
            is_moderator: false,
            can_start: true,
            running: false,
            access_code: 123456789,
            current_user: exampleUser
          },
          room_id: 'gs4-6fb-kk8'
        };
      }
    });

    await view.vm.$nextTick();
    expect(view.html()).toContain('Meeting One');
    expect(view.html()).toContain('John Doe');

    expect(view.vm.invitationText).toContain('rooms.invitation.code');
    const adminComponent = view.findComponent(AdminComponent);

    expect(adminComponent.exists()).toBeTruthy();

    expect(view.findComponent({ ref: 'roomTypeInvalidAlert' }).exists()).toBe(false);
    view.vm.$set(view.vm.$data.room, 'room_type_invalid', true);
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'roomTypeInvalidAlert' }).exists()).toBe(true);

    view.destroy();
  });

  it('room admin components for co-owner', async () => {
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
          room: {
            id: 'gs4-6fb-kk8',
            name: 'Meeting One',
            owner: { id: 1, name: 'John Doe' },
            type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
            model_name: 'Room',
            authenticated: true,
            allow_membership: false,
            is_member: true,
            is_co_owner: true,
            is_moderator: false,
            can_start: true,
            running: false,
            access_code: 123456789,
            current_user: exampleUser
          },
          room_id: 'gs4-6fb-kk8'
        };
      }
    });

    await view.vm.$nextTick();
    expect(view.html()).toContain('Meeting One');
    expect(view.html()).toContain('John Doe');

    expect(view.vm.invitationText).toContain('rooms.invitation.code');
    const adminComponent = view.findComponent(AdminComponent);
    expect(adminComponent.exists()).toBeTruthy();

    expect(view.findComponent({ ref: 'roomTypeInvalidAlert' }).exists()).toBe(false);
    view.vm.$set(view.vm.$data.room, 'room_type_invalid', true);
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'roomTypeInvalidAlert' }).exists()).toBe(true);

    view.destroy();
  });

  it('room admin components with rooms.viewAll permission', async () => {
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
          room: {
            id: 'gs4-6fb-kk8',
            name: 'Meeting One',
            owner: { id: 2, name: 'John Doe' },
            type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
            model_name: 'Room',
            authenticated: true,
            allow_membership: false,
            is_member: false,
            is_co_owner: false,
            is_moderator: false,
            can_start: true,
            running: false,
            access_code: 123456789,
            current_user: exampleUser
          },
          room_id: 'gs4-6fb-kk8'
        };
      }
    });

    await view.vm.$nextTick();
    expect(view.html()).toContain('Meeting One');
    expect(view.html()).toContain('John Doe');

    expect(view.findComponent(AdminComponent).exists()).toBeFalsy();

    const newUser = _.clone(exampleUser);
    newUser.permissions = ['rooms.viewAll'];
    store.commit('session/setCurrentUser', { currentUser: newUser });

    await Vue.nextTick();
    expect(view.findComponent(AdminComponent).exists()).toBeTruthy();

    view.destroy();
  });

  it('reload', async () => {
    const baseError = jest.spyOn(Base, 'error').mockImplementation();

    const handleInvalidCode = jest.spyOn(RoomView.methods, 'handleInvalidCode').mockImplementation();
    const handleGuestsNotAllowed = jest.spyOn(RoomView.methods, 'handleGuestsNotAllowed').mockImplementation();
    const handleInvalidToken = jest.spyOn(RoomView.methods, 'handleInvalidToken').mockImplementation();

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
          room: { id: 'cba-fed-234', name: 'Meeting One', owner: { id: 2, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: true, is_co_owner: true, is_moderator: false, can_start: true, running: false, access_code: 123456789, current_user: exampleUser },
          room_id: 'cba-fed-234'
        };
      }
    });

    await view.vm.$nextTick();
    expect(view.html()).toContain('Meeting One');
    expect(view.html()).toContain('John Doe');

    // Test reload with changes of the room data
    const reloadButton = view.findComponent({ ref: 'reloadButton' });
    await reloadButton.trigger('click');
    await waitMoxios();
    await view.vm.$nextTick();
    const request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/rooms/cba-fed-234');
    await moxios.requests.mostRecent().respondWith({
      status: 200,
      response: { data: { id: 'cba-fed-234', name: 'Meeting Two', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: true, is_co_owner: false, is_moderator: true, can_start: true, running: false, access_code: 123456789, current_user: exampleUser } }
    });
    expect(view.html()).toContain('Meeting Two');

    // Test reload with access code now invalid, changed in the meantime
    await reloadButton.trigger('click');
    await waitMoxios();
    await moxios.requests.mostRecent().respondWith({
      status: 401,
      response: { message: 'invalid_code' }
    });
    expect(handleInvalidCode).toBeCalledTimes(1);

    // Test reload with personalized room token now invalid, deleted/expired in the meantime
    await reloadButton.trigger('click');
    await waitMoxios();
    await moxios.requests.mostRecent().respondWith({
      status: 401,
      response: { message: 'invalid_token' }
    });
    expect(handleInvalidToken).toBeCalledTimes(1);

    // Test reload with changed access policy, now guests are not allowed anymore
    await reloadButton.trigger('click');
    await waitMoxios();
    await moxios.requests.mostRecent().respondWith({
      status: 403,
      response: { message: 'guests_not_allowed' }
    });
    expect(handleGuestsNotAllowed).toBeCalledTimes(1);

    // Test reload with some server errors
    await reloadButton.trigger('click');
    await waitMoxios();
    await moxios.requests.mostRecent().respondWith({
      status: 500,
      data: { message: 'Internal server error' }
    });
    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(500);

    view.destroy();
  });

  it('handle invalid code', async () => {
    const reload = jest.spyOn(RoomView.methods, 'reload').mockImplementation();
    const flashMessageSpy = jest.fn();
    const flashMessage = { error: flashMessageSpy };

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key,
        flashMessage: flashMessage
      },
      data () {
        return {
          accessCodeValid: null,
          accessCode: 123456789
        };
      },
      store,
      attachTo: createContainer()
    });

    view.vm.handleInvalidCode();
    expect(view.vm.$data.accessCodeValid).toBeFalsy();
    expect(view.vm.$data.accessCode).toBeNull();
    expect(flashMessageSpy).toBeCalledTimes(1);
    expect(flashMessageSpy.mock.calls[0][0]).toBe('rooms.flash.accessCodeInvalid');
    expect(reload).toBeCalledTimes(1);

    view.destroy();
  });

  it('handle invalid token', async () => {
    const flashMessageSpy = jest.fn();
    const flashMessage = { error: flashMessageSpy };

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key,
        flashMessage: flashMessage
      },
      data () {
        return {
          room: { id: 'abc-def-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, username: 'John Doe', allow_membership: false, is_member: false, is_co_owner: false, is_moderator: false, can_start: false, running: true, record_attendance: false, current_user: null },
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
    expect(flashMessageSpy).toBeCalledTimes(1);
    expect(flashMessageSpy.mock.calls[0][0]).toBe('rooms.flash.tokenInvalid');
    expect(view.vm.$data.reloadInterval).toBeNull();
    view.destroy();
  });

  it('handle empty code', async () => {
    const flashMessageSpy = jest.fn();
    const flashMessage = { error: flashMessageSpy };

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
          room: {
            id: 'abc-def-456',
            name: 'Meeting One',
            owner: 'John Doe',
            type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
            model_name: 'Room',
            authenticated: false,
            allow_membership: false,
            is_member: false,
            is_owner: false,
            is_guest: true,
            is_moderator: false,
            can_start: false,
            running: false,
            current_user: null
          },
          room_id: 'abc-def-456'
        };
      }
    });

    // load room view
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
    await waitMoxios();
    let request = moxios.requests.mostRecent();
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
    expect(flashMessageSpy).toBeCalledTimes(1);
    expect(flashMessageSpy.mock.calls[0][0]).toBe('rooms.flash.accessCodeInvalid');

    // check if room is reloaded without access code
    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.url).toBe('/api/v1/rooms/abc-def-456');
    expect(request.config.headers['Access-Code']).toBeUndefined();
    await request.respondWith({
      status: 200,
      response: {
        data: {
          id: 'abc-def-456',
          name: 'Meeting One',
          owner: 'John Doe',
          type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: false,
          allow_membership: false,
          is_member: false,
          is_owner: false,
          is_guest: true,
          is_moderator: false,
          can_start: false,
          running: false,
          current_user: null
        }
      }
    });
    // check if reload was successful and no other error message is shown
    expect(flashMessageSpy).toBeCalledTimes(1);

    view.destroy();
  });

  it('handle file list errors', async () => {
    const handleInvalidCode = jest.spyOn(RoomView.methods, 'handleInvalidCode').mockImplementation();
    const handleGuestsNotAllowed = jest.spyOn(RoomView.methods, 'handleGuestsNotAllowed').mockImplementation();
    const handleInvalidToken = jest.spyOn(RoomView.methods, 'handleInvalidToken').mockImplementation();
    const baseError = jest.spyOn(Base, 'error').mockImplementation();
    const flashMessageSpy = jest.fn();
    const flashMessage = { error: flashMessageSpy };

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key,
        flashMessage: flashMessage
      },
      router: routerMock,
      store,
      attachTo: createContainer()
    });

    view.vm.onFileListError({ response: { status: 401, data: { message: 'invalid_code' } } });
    expect(handleInvalidCode).toBeCalledTimes(1);

    view.vm.onFileListError({ response: { status: 403, data: { message: 'require_code' } } });
    expect(handleInvalidCode).toBeCalledTimes(2);

    view.vm.onFileListError({ response: { status: 403, data: { message: 'guests_not_allowed' } } });
    expect(handleGuestsNotAllowed).toBeCalledTimes(1);

    view.vm.onFileListError({ response: { status: 401, data: { message: 'invalid_token' } } });
    expect(handleInvalidToken).toBeCalledTimes(1);

    view.vm.onFileListError({ response: { status: 500, data: { message: 'Internal server error' } } });
    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(500);

    view.destroy();
  });

  it('join running meeting', async () => {
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
          room: {
            id: 'abc-def-789',
            name: 'Meeting One',
            owner: { id: 2, name: 'Max Doe' },
            type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
            model_name: 'Room',
            authenticated: true,
            allow_membership: false,
            is_member: false,
            is_co_owner: false,
            is_moderator: false,
            can_start: false,
            running: true,
            record_attendance: false,
            current_user: exampleUser
          },
          room_id: 'abc-def-789'
        };
      }
    });

    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeFalsy();

    const joinButton = view.findComponent({ ref: 'joinMeeting' });
    await view.vm.$nextTick();

    expect(joinButton.attributes('disabled')).toBeUndefined();

    await joinButton.trigger('click');
    await view.vm.$nextTick();

    expect(joinButton.attributes('disabled')).toEqual('disabled');

    await waitMoxios();
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
  });

  it('join running meeting, attendance logging', async () => {
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
          room: {
            id: 'abc-def-789',
            name: 'Meeting One',
            owner: { id: 2, name: 'Max Doe' },
            type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
            model_name: 'Room',
            authenticated: true,
            allow_membership: false,
            is_member: false,
            is_co_owner: false,
            is_moderator: false,
            can_start: false,
            running: true,
            record_attendance: true,
            current_user: exampleUser
          },
          room_id: 'abc-def-789'
        };
      }
    });

    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeTruthy();
    const agreementCheckbox = view.findComponent({ ref: 'recordingAttendanceInfo' }).findComponent(BFormCheckbox);
    await agreementCheckbox.get('input').trigger('click');

    const joinButton = view.findComponent({ ref: 'joinMeeting' });
    await view.vm.$nextTick();
    await joinButton.trigger('click');

    await waitMoxios();
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
  });

  it('join running meeting guests', async () => {
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
          room: {
            id: 'abc-def-789',
            name: 'Meeting One',
            owner: { id: 2, name: 'Max Doe' },
            type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
            model_name: 'Room',
            authenticated: true,
            allow_membership: false,
            is_member: false,
            is_co_owner: false,
            is_moderator: false,
            can_start: false,
            running: true,
            record_attendance: true,
            current_user: null
          },
          room_id: 'abc-def-789'
        };
      }
    });

    await view.vm.$nextTick();
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
    await waitMoxios();
    let request = moxios.requests.mostRecent();
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

    await waitMoxios();
    request = moxios.requests.mostRecent();
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
  });

  it('join running meeting guests with access token', async () => {
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
          room: {
            id: 'abc-def-789',
            name: 'Meeting One',
            owner: { id: 2, name: 'Max Doe' },
            type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
            model_name: 'Room',
            authenticated: true,
            allow_membership: false,
            is_member: false,
            is_co_owner: false,
            is_moderator: false,
            can_start: false,
            running: true,
            record_attendance: true,
            current_user: null
          },
          room_id: 'abc-def-789',
          accessCode: '905992606'
        };
      }
    });

    await view.vm.$nextTick();
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
    await waitMoxios();
    let request = moxios.requests.mostRecent();
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

    await waitMoxios();
    request = moxios.requests.mostRecent();
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
  });

  it('join running meeting token', async () => {
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
          room: {
            id: 'abc-def-789',
            name: 'Meeting One',
            owner: { id: 2, name: 'Max Doe' },
            type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
            model_name: 'Room',
            authenticated: true,
            username: 'John Doe',
            allow_membership: false,
            is_member: false,
            is_co_owner: false,
            is_moderator: false,
            can_start: false,
            running: true,
            record_attendance: false,
            current_user: null
          },
          room_id: 'abc-def-789',
          name: 'John Doe',
          token: 'xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR'
        };
      }
    });

    await view.vm.$nextTick();
    const joinButton = view.findComponent({ ref: 'joinMeeting' });
    const nameInput = view.findComponent({ ref: 'guestName' });

    expect(joinButton.attributes('disabled')).toBeUndefined();
    expect(nameInput.attributes('disabled')).toBe('disabled');
    expect(nameInput.element.value).toBe('John Doe');

    await joinButton.trigger('click');

    // Check with invalid chars in guest name
    await waitMoxios();
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
  });

  it('join meeting errors', async () => {
    const handleInvalidCode = jest.spyOn(RoomView.methods, 'handleInvalidCode').mockImplementation();
    const handleGuestsNotAllowed = jest.spyOn(RoomView.methods, 'handleGuestsNotAllowed').mockImplementation();
    const handleInvalidToken = jest.spyOn(RoomView.methods, 'handleInvalidToken').mockImplementation();
    const baseError = jest.spyOn(Base, 'error').mockImplementation();

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
          room: {
            id: 'abc-def-789',
            name: 'Meeting One',
            owner: { id: 2, name: 'Max Doe' },
            type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
            model_name: 'Room',
            authenticated: true,
            allow_membership: false,
            is_member: false,
            is_co_owner: false,
            is_moderator: false,
            can_start: false,
            running: true,
            record_attendance: false,
            current_user: exampleUser
          },
          room_id: 'abc-def-789'
        };
      }
    });

    await view.vm.$nextTick();
    let joinButton = view.findComponent({ ref: 'joinMeeting' });
    expect(joinButton.attributes('disabled')).toBeUndefined();

    // Test guests not allowed
    await joinButton.trigger('click');
    await waitMoxios();
    let request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/join');
    expect(request.config.params).toEqual({ name: '', record_attendance: 0 });
    await moxios.requests.mostRecent().respondWith({
      status: 403,
      response: { message: 'guests_not_allowed' }
    });
    await view.vm.$nextTick();
    expect(handleGuestsNotAllowed).toBeCalledTimes(1);

    // Test invalid access token
    await joinButton.trigger('click');
    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/join');
    expect(request.config.params).toEqual({ name: '', record_attendance: 0 });
    await moxios.requests.mostRecent().respondWith({
      status: 401,
      response: { message: 'invalid_code' }
    });
    await view.vm.$nextTick();
    expect(handleInvalidCode).toBeCalledTimes(1);

    // Test invalid access token
    await joinButton.trigger('click');
    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/join');
    expect(request.config.params).toEqual({ name: '', record_attendance: 0 });
    await moxios.requests.mostRecent().respondWith({
      status: 403,
      response: { message: 'require_code' }
    });
    await view.vm.$nextTick();
    expect(handleInvalidCode).toBeCalledTimes(2);

    // Test invalid token
    await joinButton.trigger('click');
    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/join');
    expect(request.config.params).toEqual({ name: '', record_attendance: 0 });
    await moxios.requests.mostRecent().respondWith({
      status: 401,
      response: { message: 'invalid_token' }
    });
    await view.vm.$nextTick();
    expect(handleInvalidToken).toBeCalledTimes(1);

    // Test without required recording agreement
    expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeFalsy();
    await joinButton.trigger('click');
    await waitMoxios();
    request = moxios.requests.mostRecent();
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
    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(470);
    expect(baseError.mock.calls[0][0].response.data.message).toEqual('Consent to record attendance is required.');
    expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeTruthy();

    // Test Room closed
    const agreementCheckbox = view.findComponent({ ref: 'recordingAttendanceInfo' }).findComponent(BFormCheckbox);
    await agreementCheckbox.get('input').trigger('click');

    joinButton = view.findComponent({ ref: 'joinMeeting' });
    expect(joinButton.attributes('disabled')).toBeUndefined();
    await joinButton.trigger('click');

    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/join');
    expect(request.config.params).toEqual({ name: '', record_attendance: 1 });

    await moxios.requests.mostRecent().respondWith({
      status: 460,
      response: {
        message: 'Joining failed! The room is currently closed.'
      }
    });

    expect(baseError).toBeCalledTimes(2);
    expect(baseError.mock.calls[1][0].response.status).toEqual(460);
    expect(baseError.mock.calls[1][0].response.data.message).toEqual('Joining failed! The room is currently closed.');

    expect(view.findComponent({ ref: 'joinMeeting' }).exists()).toBeFalsy();

    view.destroy();
  });

  it('start meeting', async () => {
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
          room: {
            id: 'abc-def-789',
            name: 'Meeting One',
            owner: { id: 2, name: 'Max Doe' },
            type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
            model_name: 'Room',
            authenticated: true,
            allow_membership: false,
            is_member: false,
            is_co_owner: false,
            is_moderator: false,
            can_start: true,
            running: false,
            record_attendance: false,
            current_user: exampleUser
          },
          room_id: 'abc-def-789'
        };
      }
    });

    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeFalsy();

    const startButton = view.findComponent({ ref: 'startMeeting' });
    await view.vm.$nextTick();
    expect(startButton.attributes('disabled')).toBeUndefined();

    await startButton.trigger('click');
    await view.vm.$nextTick();

    expect(startButton.attributes('disabled')).toEqual('disabled');

    await waitMoxios();
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
  });

  it('start meeting, attendance logging', async () => {
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
          room: {
            id: 'abc-def-789',
            name: 'Meeting One',
            owner: { id: 2, name: 'Max Doe' },
            type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
            model_name: 'Room',
            authenticated: true,
            allow_membership: false,
            is_member: false,
            is_co_owner: false,
            is_moderator: false,
            can_start: true,
            running: false,
            record_attendance: true,
            current_user: exampleUser
          },
          room_id: 'abc-def-789'
        };
      }
    });

    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeTruthy();
    const agreementCheckbox = view.findComponent({ ref: 'recordingAttendanceInfo' }).findComponent(BFormCheckbox);
    await agreementCheckbox.get('input').trigger('click');

    const startButton = view.findComponent({ ref: 'startMeeting' });
    await view.vm.$nextTick();
    await startButton.trigger('click');

    await waitMoxios();
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
  });

  it('start meeting guests', async () => {
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
          room: {
            id: 'abc-def-789',
            name: 'Meeting One',
            owner: { id: 2, name: 'Max Doe' },
            type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
            model_name: 'Room',
            authenticated: true,
            allow_membership: false,
            is_member: false,
            is_co_owner: false,
            is_moderator: false,
            can_start: true,
            running: false,
            record_attendance: true,
            current_user: null
          },
          room_id: 'abc-def-789'
        };
      }
    });

    await view.vm.$nextTick();
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
    await waitMoxios();
    let request = moxios.requests.mostRecent();
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

    await waitMoxios();
    request = moxios.requests.mostRecent();
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
  });

  it('start meeting errors', async () => {
    const handleInvalidCode = jest.spyOn(RoomView.methods, 'handleInvalidCode').mockImplementation();
    const handleGuestsNotAllowed = jest.spyOn(RoomView.methods, 'handleGuestsNotAllowed').mockImplementation();
    const handleInvalidToken = jest.spyOn(RoomView.methods, 'handleInvalidToken').mockImplementation();

    const fileComponentReloadSpy = jest.fn();
    const fileComponent = {
      name: 'test-component',
      // eslint-disable @intlify/vue-i18n/no-raw-text
      template: '<p>test</p>',
      methods: {
        reload: fileComponentReloadSpy
      }
    };

    const baseError = jest.spyOn(Base, 'error').mockImplementation();

    const flashMessageSpy = jest.fn();
    const flashMessage = { error: flashMessageSpy };

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
          room: {
            id: 'abc-def-789',
            name: 'Meeting One',
            owner: { id: 2, name: 'Max Doe' },
            type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
            model_name: 'Room',
            authenticated: true,
            allow_membership: false,
            is_member: false,
            is_co_owner: false,
            is_moderator: false,
            can_start: true,
            running: false,
            record_attendance: false,
            current_user: exampleUser
          },
          room_id: 'abc-def-789'
        };
      }
    });

    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeFalsy();

    let startButton = view.findComponent({ ref: 'startMeeting' });
    expect(startButton.attributes('disabled')).toBeUndefined();

    // Test guests not allowed
    await startButton.trigger('click');
    await waitMoxios();
    let request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/start');
    expect(request.config.params).toEqual({ name: '', record_attendance: 0 });
    await moxios.requests.mostRecent().respondWith({
      status: 403,
      response: { message: 'guests_not_allowed' }
    });
    await view.vm.$nextTick();

    expect(handleGuestsNotAllowed).toBeCalledTimes(1);

    // Test invalid access token
    await startButton.trigger('click');
    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/start');
    expect(request.config.params).toEqual({ name: '', record_attendance: 0 });
    await moxios.requests.mostRecent().respondWith({
      status: 401,
      response: { message: 'invalid_code' }
    });
    await view.vm.$nextTick();
    expect(handleInvalidCode).toBeCalledTimes(1);

    // Test access token required
    await startButton.trigger('click');
    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/start');
    expect(request.config.params).toEqual({ name: '', record_attendance: 0 });
    await moxios.requests.mostRecent().respondWith({
      status: 403,
      response: { message: 'require_code' }
    });
    await view.vm.$nextTick();
    expect(handleInvalidCode).toBeCalledTimes(2);

    // Test invalid token
    await startButton.trigger('click');
    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/start');
    expect(request.config.params).toEqual({ name: '', record_attendance: 0 });

    await moxios.requests.mostRecent().respondWith({
      status: 401,
      response: { message: 'invalid_token' }
    });

    await view.vm.$nextTick();
    expect(handleInvalidToken).toBeCalledTimes(1);

    await startButton.trigger('click');
    await waitMoxios();
    request = moxios.requests.mostRecent();
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

    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(470);
    expect(baseError.mock.calls[0][0].response.data.message).toEqual('Consent to record attendance is required.');

    expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeTruthy();
    const agreementCheckbox = view.findComponent({ ref: 'recordingAttendanceInfo' }).findComponent(BFormCheckbox);
    await agreementCheckbox.get('input').trigger('click');

    startButton = view.findComponent({ ref: 'startMeeting' });
    expect(startButton.exists()).toBeTruthy();
    expect(startButton.attributes('disabled')).toBeUndefined();
    await startButton.trigger('click');

    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789/start');
    expect(request.config.params).toEqual({ name: '', record_attendance: 1 });

    await moxios.requests.mostRecent().respondWith({
      status: 403,
      response: {
        message: 'This action is unauthorized.'
      }
    });

    expect(flashMessageSpy).toBeCalledTimes(1);
    expect(flashMessageSpy).toBeCalledWith('rooms.flash.startForbidden');

    expect(view.findComponent({ ref: 'startMeeting' }).exists()).toBeFalsy();

    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/rooms/abc-def-789');

    await moxios.requests.mostRecent().respondWith({
      status: 200,
      response: {
        data: {
          id: 'abc-def-789',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: true,
          running: false,
          record_attendance: false,
          current_user: exampleUser
        }
      }
    });

    expect(fileComponentReloadSpy).toBeCalledTimes(1);

    view.destroy();
  });

  it('start meeting access token', async () => {
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
          room: {
            id: 'abc-def-789',
            name: 'Meeting One',
            owner: { id: 2, name: 'Max Doe' },
            type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
            model_name: 'Room',
            authenticated: true,
            allow_membership: false,
            is_member: false,
            is_co_owner: false,
            is_moderator: false,
            can_start: true,
            running: false,
            record_attendance: false,
            current_user: exampleUser
          },
          room_id: 'abc-def-789',
          accessCode: '905992606'
        };
      }
    });

    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeFalsy();

    const startButton = view.findComponent({ ref: 'startMeeting' });
    await view.vm.$nextTick();
    expect(startButton.attributes('disabled')).toBeUndefined();

    await startButton.trigger('click');
    await view.vm.$nextTick();

    expect(startButton.attributes('disabled')).toEqual('disabled');

    await waitMoxios();
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
  });

  it('start meeting token', async () => {
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
          room: {
            id: 'abc-def-789',
            name: 'Meeting One',
            owner: { id: 2, name: 'Max Doe' },
            type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
            model_name: 'Room',
            authenticated: true,
            allow_membership: false,
            is_member: false,
            is_co_owner: false,
            is_moderator: false,
            can_start: true,
            running: false,
            record_attendance: false,
            current_user: exampleUser
          },
          room_id: 'abc-def-789',
          token: 'xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR'
        };
      }
    });

    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeFalsy();

    const startButton = view.findComponent({ ref: 'startMeeting' });
    await view.vm.$nextTick();
    expect(startButton.attributes('disabled')).toBeUndefined();

    await startButton.trigger('click');
    await view.vm.$nextTick();

    expect(startButton.attributes('disabled')).toEqual('disabled');

    await waitMoxios();
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
  });

  it('end membership', async () => {
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
          room: {
            id: 'cba-fed-123',
            name: 'Meeting One',
            owner: { id: 2, name: 'Max Doe' },
            type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
            model_name: 'Room',
            authenticated: true,
            allow_membership: false,
            is_member: true,
            is_co_owner: false,
            is_moderator: false,
            can_start: true,
            running: false,
            access_code: 123456789,
            current_user: exampleUser
          },
          room_id: 'cba-fed-123'
        };
      }
    });

    await view.vm.$nextTick();
    // Find confirm modal and check if it is hidden
    const leaveMembershipModal = view.findComponent({ ref: 'leave-membership-modal' });
    expect(leaveMembershipModal.vm.$data.isVisible).toBe(false);
    // Click button to leave membership

    await waitModalShown(view, () => {
      view.find('#leave-membership-button').trigger('click');
    });

    // Wait until modal is open
    await view.vm.$nextTick();

    // Confirm modal is shown
    expect(leaveMembershipModal.vm.$data.isVisible).toBe(true);

    // Find the confirm button and click it
    const leaveConfirmButton = leaveMembershipModal.findAllComponents(BButton).at(1);
    expect(leaveConfirmButton.text()).toBe('rooms.endMembership.yes');

    await waitModalHidden(view, () => {
      leaveConfirmButton.trigger('click');
    });
    // Check if modal is closed
    await view.vm.$nextTick();

    // Check if the modal is hidden
    expect(leaveMembershipModal.vm.$data.isVisible).toBe(false);

    // Check leave membership request
    await waitMoxios();
    let request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('delete');
    expect(request.config.url).toEqual('/api/v1/rooms/cba-fed-123/membership');

    // Respond to leave membership request
    await moxios.requests.mostRecent().respondWith({
      status: 204,
      response: {}
    });

    // response for room reload, now with the user not beeing a member anymore
    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/rooms/cba-fed-123');

    // Respond to leave membership request
    await moxios.requests.mostRecent().respondWith({
      status: 200,
      response: {
        data: {
          id: 'cba-fed-123',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: true,
          running: false,
          access_code: 123456789,
          current_user: exampleUser
        }
      }
    });

    // Check if the leave membership button is not shown anymore, as the user is no longer a member
    expect(view.find('#leave-membership-button').exists()).toBeFalsy();

    view.destroy();
  });

  it('logged in status change', async () => {
    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      data () {
        return {
          room: {
            id: 'cba-fed-234',
            name: 'Meeting One',
            owner: { id: 1, name: 'John Doe' },
            type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
            model_name: 'Room',
            authenticated: true,
            allow_membership: false,
            is_member: false,
            is_co_owner: false,
            is_moderator: false,
            can_start: false,
            running: false,
            access_code: 123456789,
            current_user: exampleUser
          },
          room_id: 'cba-fed-234'
        };
      },
      store,
      router: routerMock,
      attachTo: createContainer()
    });

    await view.vm.$nextTick();
    expect(view.findComponent(AdminComponent).exists()).toBeTruthy();

    const reloadButton = view.findComponent({ ref: 'reloadButton' });
    reloadButton.trigger('click');

    await waitMoxios();
    const request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('get');
    expect(request.config.url).toEqual('/api/v1/rooms/cba-fed-234');
    await moxios.requests.mostRecent().respondWith({
      status: 200,
      response: {
        data: {
          id: 'cba-fed-234',
          name: 'Meeting One',
          owner: { id: 1, name: 'John Doe' },
          type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: true,
          running: false,
          current_user: null
        }
      }
    });

    await view.vm.$nextTick();
    expect(view.findComponent(AdminComponent).exists()).toBeFalsy();

    expect(store.getters['session/isAuthenticated']).toBeFalsy();

    await reloadButton.trigger('click');
    await waitMoxios();
    await moxios.requests.mostRecent().respondWith({
      status: 200,
      response: {
        data: {
          id: 'cba-fed-234',
          name: 'Meeting One',
          owner: { id: 1, name: 'John Doe' },
          type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: true,
          is_co_owner: true,
          is_moderator: false,
          can_start: true,
          running: false,
          access_code: 123456789,
          current_user: exampleUser
        }
      }
    });

    expect(store.getters['session/isAuthenticated']).toBeTruthy();
    expect(view.findComponent(AdminComponent).exists()).toBeTruthy();

    await reloadButton.trigger('click');
    await waitMoxios();
    await moxios.requests.mostRecent().respondWith({
      status: 403,
      response: { message: 'guests_not_allowed' }
    });

    expect(view.findComponent(AdminComponent).exists()).toBeFalsy();
    expect(store.getters['session/isAuthenticated']).toBeFalsy();
    view.destroy();
  });

  it('random polling interval', async () => {
    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      data () {
        return {
          room: { id: 'cba-fed-234', name: 'Meeting One', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: false, is_co_owner: false, is_moderator: false, can_start: false, running: false, access_code: 123456789, current_user: exampleUser },
          room_id: 'cba-fed-234'
        };
      },
      store,
      router: routerMock,
      attachTo: createContainer()
    });

    await view.vm.$nextTick();
    // use fixed random value for testing only
    jest.spyOn(Math, 'random').mockReturnValue(0.4);

    // check for pos. integer
    await store.commit('session/setSettings', { room_refresh_rate: 10 });
    expect(view.vm.getRandomRefreshInterval()).toBe(9.7);

    // check for zero
    await store.commit('session/setSettings', { room_refresh_rate: 0 });
    expect(view.vm.getRandomRefreshInterval()).toBe(0);

    // check for neg. integer
    await store.commit('session/setSettings', { room_refresh_rate: -20 });
    expect(view.vm.getRandomRefreshInterval()).toBe(19.4);

    // check for float
    await store.commit('session/setSettings', { room_refresh_rate: 4.2 });
    expect(view.vm.getRandomRefreshInterval()).toBe(4.074);

    view.destroy();
  });
});
