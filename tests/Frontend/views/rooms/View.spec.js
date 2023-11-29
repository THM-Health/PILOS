import { mount } from '@vue/test-utils';
import BootstrapVue, { BAlert, BButton, BFormCheckbox } from 'bootstrap-vue';
import RoomView from '@/views/rooms/View.vue';
import AdminTabsComponent from '@/components/Room/AdminTabsComponent.vue';
import TabsComponent from '@/components/Room/TabsComponent.vue';
import Base from '@/api/base';
import VueRouter from 'vue-router';
import PermissionService from '@/services/PermissionService';
import _ from 'lodash';
import { mockAxios, createContainer, createLocalVue } from '../../helper';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import { expect } from 'vitest';
import EventBus from '@/services/EventBus';
import { EVENT_CURRENT_ROOM_CHANGED } from '@/constants/events';

const localVue = createLocalVue();

localVue.use(BootstrapVue);
localVue.use(PiniaVuePlugin);
localVue.use(VueRouter);

const stubs = {
  'room-details-component': true,
  'room-invitation': true,
  'browser-notification': true,
  'tabs-component': true,
  'admin-tabs-component': true,
  'room-favorite-dropdown-button': true,
  'room-membership-dropdown-button': true,
  'delete-room-dropdown-button': true,
  'room-type-badge': true
};

const routerMock = new VueRouter({
  mode: 'abstract',
  routes: [{
    path: '/rooms/:id/:token?',
    name: 'rooms.view',
    component: RoomView
  }]
});

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], model_name: 'User', room_limit: -1 };

const initialState = { auth: { currentUser: exampleUser }, settings: { settings: { room_refresh_rate: 30, name: 'PILOS' } } };
const initialStateNoUser = { settings: { settings: { room_refresh_rate: 30, name: 'PILOS' } } };

describe('Room', () => {
  beforeEach(() => {
    PermissionService.setCurrentUser(exampleUser);
    mockAxios.reset();
  });

  it('guest forbidden', async () => {
    mockAxios.request('/api/v1/rooms/abc-def-123').respondWith({
      status: 403,
      data: {
        message: 'guests_not_allowed'
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs,
      propsData: {
        id: 'abc-def-123'
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      attachTo: createContainer()
    });
    await mockAxios.wait();

    await view.vm.$nextTick();
    expect(view.html()).toContain('rooms.only_used_by_authenticated_users');

    const tryAgain = view.findAllComponents(BButton).at(0);

    expect(tryAgain.html()).toContain('rooms.try_again');

    const request = mockAxios.request('/api/v1/rooms/abc-def-123');

    await tryAgain.trigger('click');

    await request.wait();

    view.destroy();
  });

  it('room token', async () => {
    let request = mockAxios.request('/api/v1/rooms/abc-def-123');

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: 'abc-def-123',
        token: 'xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR'
      },
      stubs,
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialStateNoUser), stubActions: false }),
      attachTo: createContainer()
    });

    // wait for the request from load()
    await request.wait();
    expect(request.config.headers.Token).toBe('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
    await request.respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-123',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          username: 'John Doe',
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: false,
          current_user: null
        }
      }
    });

    await view.vm.$nextTick();

    // check if view shows meeting data and the correct guests name (due to the personalized room link token)
    expect(view.html()).toContain('Meeting One');

    expect(view.findComponent({ ref: 'guestName' }).element.value).toBe('John Doe');
    expect(view.vm.$data.reloadInterval).not.toBeNull();

    // reload page
    const reloadButton = view.findComponent({ ref: 'reloadButton' });

    request = mockAxios.request('/api/v1/rooms/abc-def-123');

    await reloadButton.trigger('click');

    // respond with different name (room owner changed the name of the personalized room link in the meantime)
    await request.wait();
    expect(request.config.headers.Token).toBe('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
    await request.respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-123',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          username: 'Peter Doe',
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: false,
          current_user: null
        }
      }
    });

    await mockAxios.wait();

    // check if ui reflects the change
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'guestName' }).element.value).toBe('Peter Doe');

    view.destroy();
  });

  it('room token invalid', async () => {
    const router = new VueRouter();
    vi.spyOn(router, 'push').mockImplementation(() => {});

    const request = mockAxios.request('/api/v1/rooms/abc-def-123');

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: 'abc-def-123',
        token: 'xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR'
      },
      stubs,
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialStateNoUser), stubActions: false }),
      router,
      attachTo: createContainer()
    });

    // wait for the request
    await request.wait();
    expect(request.config.headers.Token).toBe('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
    await request.respondWith({
      status: 401,
      data: {
        message: 'invalid_token'
      }
    });

    await view.vm.$nextTick();

    // check if error message for invalid personal link is shown
    const alert = view.findComponent(BAlert);
    expect(alert.exists()).toBeTruthy();
    expect(alert.text()).toBe('rooms.invalid_personal_link');

    expect(view.vm.$data.reloadInterval).toBeNull();

    view.destroy();
  });

  it('room token as authenticated user', async () => {
    const router = new VueRouter();
    const routerSpy = vi.spyOn(router, 'replace').mockImplementation(() => {});
    const toastInfoSpy = vi.fn();

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key,
        toastInfo: toastInfoSpy
      },
      propsData: {
        id: 'abc-def-123',
        token: 'xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR'
      },
      stubs,
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      router,
      attachTo: createContainer()
    });

    expect(toastInfoSpy).toBeCalledTimes(1);
    expect(toastInfoSpy).toBeCalledWith('app.flash.guests_only');
    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'home' });

    view.destroy();
  });

  it('test room loading', async () => {
    const roomRequest = mockAxios.request('/api/v1/rooms/abc-def-456');

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: 'abc-def-456'
      },
      stubs,
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      attachTo: createContainer(),
      router: routerMock
    });

    await roomRequest.wait();
    await view.vm.$nextTick();

    // test if spinner shows that room is loading
    expect(view.findComponent({ ref: 'room-loading-spinner' }).exists()).toBeTruthy();
    expect(view.html()).not.toContain('Meeting One');

    await roomRequest.respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-456',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          username: 'John Doe',
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: false,
          current_user: null
        }
      }
    });

    // test if room is shown and spinner hidden
    expect(view.findComponent({ ref: 'room-loading-spinner' }).exists()).toBeFalsy();
    expect(view.html()).toContain('Meeting One');

    // test if room name is shown in the title
    expect(document.title).toBe('Meeting One - PILOS');

    view.destroy();
  });

  it('test error', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    mockAxios.request('/api/v1/rooms/abc-def-456').respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: 'abc-def-456'
      },
      stubs,
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      attachTo: createContainer(),
      router: routerMock
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(spy).toBeCalledTimes(1);
    // find reload button
    let reloadButton = view.findComponent({ ref: 'reload' });
    expect(reloadButton.exists()).toBeTruthy();
    expect(reloadButton.element.disabled).toBeFalsy();
    expect(view.html()).not.toContain('Meeting One');

    // trigger reload button and reload with valid data
    const roomRequest = mockAxios.request('/api/v1/rooms/abc-def-456');
    await reloadButton.trigger('click');
    await roomRequest.wait();

    await roomRequest.respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-456',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          username: 'John Doe',
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: false,
          current_user: null
        }
      }
    });

    reloadButton = view.findComponent({ ref: 'reload' });
    expect(reloadButton.exists()).toBeFalsy();
    expect(view.html()).toContain('Meeting One');

    view.destroy();
  });

  it('room not found', async () => {
    const router = new VueRouter();
    const routerSpy = vi.spyOn(router, 'push').mockImplementation(() => {});

    const request = mockAxios.request('/api/v1/rooms/abc-def-123');

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: 'abc-def-123'
      },
      stubs,
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      router,
      attachTo: createContainer()
    });

    // wait for the request from the beforeRouteEnter hook in the RoomView
    await request.wait();
    await request.respondWith({
      status: 404,
      data: {
        message: 'No query results for model [App\\Room] abc-def-123'
      }
    });

    // wait for promise to be resolved (room data is loaded)
    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: '404' });

    view.destroy();
  });

  it('ask access token', async () => {
    mockAxios.request('/api/v1/rooms/abc-def-456').respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-456',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: false,
          allow_membership: false,
          is_member: false,
          is_owner: false,
          is_guest: false,
          is_moderator: false,
          can_start: false,
          current_user: exampleUser
        }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: 'abc-def-456'
      },
      stubs,
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      attachTo: createContainer(),
      router: routerMock
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.html()).toContain('rooms.require_access_code');
    view.destroy();
  });

  it('room details auth. guest', async () => {
    mockAxios.request('/api/v1/rooms/abc-def-789').respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-789',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          last_meeting: { start: '2023-08-21 08:18:28:00', end: null },
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: false,
          current_user: null
        }
      }
    });
    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: 'abc-def-789'
      },
      stubs,
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialStateNoUser), stubActions: false }),
      router: routerMock,
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.html()).toContain('Meeting One');

    // Check if invitation component is not shown
    const invitationComponent = view.findComponent({ ref: 'room-invitation' });
    expect(invitationComponent.exists()).toBeFalsy();

    // Check if join button is disabled as long as no name is entered
    const joinButton = view.findComponent({ ref: 'joinMeeting' });
    const nameInput = view.findComponent({ ref: 'guestName' });
    expect(joinButton.attributes('disabled')).toEqual('disabled');

    // Check if join button is shown if name is entered
    nameInput.setValue('John Doe');
    await view.vm.$nextTick();
    expect(joinButton.attributes('disabled')).toBeUndefined();

    view.destroy();
  });

  it('room details moderator', async () => {
    mockAxios.request('/api/v1/rooms/cba-fed-123').respondWith({
      status: 200,
      data: {
        data: {
          id: 'cba-fed-123',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: true,
          is_co_owner: false,
          is_moderator: true,
          can_start: true,
          access_code: 123456789,
          current_user: exampleUser
        }
      }
    });
    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: 'cba-fed-123'
      },
      stubs,
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      router: routerMock,
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.html()).toContain('Meeting One');

    // Check if invitation component is shown
    const invitationComponent = view.findComponent({ ref: 'room-invitation' });
    expect(invitationComponent.exists()).toBeTruthy();
    expect(invitationComponent.props('room').id).toBe('cba-fed-123');

    view.destroy();
  });

  it('room tabs component', async () => {
    const handleInvalidCode = vi.spyOn(RoomView.methods, 'handleInvalidCode').mockImplementation(() => {});
    const handleGuestsNotAllowed = vi.spyOn(RoomView.methods, 'handleGuestsNotAllowed').mockImplementation(() => {});
    const handleInvalidToken = vi.spyOn(RoomView.methods, 'handleInvalidToken').mockImplementation(() => {});

    mockAxios.request('/api/v1/rooms/gs4-6fb-kk8').respondWith({
      status: 200,
      data: {
        data: {
          id: 'gs4-6fb-kk8',
          name: 'Meeting One',
          owner: { id: 2, name: 'John Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: true,
          access_code: 123456789,
          current_user: exampleUser
        }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: 'gs4-6fb-kk8'
      },
      stubs,
      router: routerMock,
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    const tabsComponent = view.findComponent({ name: 'TabsComponent' });

    // room is passed to tabs component
    expect(tabsComponent.props('room').id).toEqual('gs4-6fb-kk8');

    // handle invalid code error
    tabsComponent.vm.$emit('invalid-code');
    expect(handleInvalidCode).toBeCalledTimes(1);

    // handle guests not allowed error
    tabsComponent.vm.$emit('guests-not-allowed');
    expect(handleGuestsNotAllowed).toBeCalledTimes(1);

    // handle invalid token error
    tabsComponent.vm.$emit('invalid-token');
    expect(handleInvalidToken).toBeCalledTimes(1);

    view.destroy();
  });

  it('room tabs components for authenticated users/guests with access token', async () => {
    const roomRequest = mockAxios.request('/api/v1/rooms/gs4-6fb-kk8');
    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: 'gs4-6fb-kk8'
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      router: routerMock,
      attachTo: createContainer(),
      stubs,
      data () {
        return {
          accessCode: 905992606
        };
      }
    });
    await roomRequest.wait();
    expect(roomRequest.config.headers['Access-Code']).toBe('905992606');

    await roomRequest.respondWith({
      status: 200,
      data: {
        data: {
          id: 'gs4-6fb-kk8',
          name: 'Meeting One',
          owner: { id: 2, name: 'John Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: true
        }
      }
    });

    await view.vm.$nextTick();

    const tabsComponent = view.findComponent(TabsComponent);

    expect(tabsComponent.exists()).toBeTruthy();

    expect(tabsComponent.props('room').id).toEqual('gs4-6fb-kk8');
    expect(tabsComponent.props('accessCode')).toEqual(905992606);

    view.destroy();
  });

  it('room tabs components for guests with token', async () => {
    mockAxios.request('/api/v1/rooms/gs4-6fb-kk8').respondWith({
      status: 200,
      data: {
        data: {
          id: 'gs4-6fb-kk8',
          name: 'Meeting One',
          owner: { id: 2, name: 'John Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: true
        }
      }
    });
    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: 'gs4-6fb-kk8',
        token: 'xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR'
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialStateNoUser), stubActions: false }),
      router: routerMock,
      attachTo: createContainer(),
      stubs
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    const tabsComponent = view.findComponent(TabsComponent);

    expect(tabsComponent.exists()).toBeTruthy();

    expect(tabsComponent.props('room').id).toEqual('gs4-6fb-kk8');
    expect(tabsComponent.props('token')).toEqual('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');

    view.destroy();
  });

  it('room tabs components for members', async () => {
    mockAxios.request('/api/v1/rooms/gs4-6fb-kk8').respondWith({
      status: 200,
      data: {
        data: {
          id: 'gs4-6fb-kk8',
          name: 'Meeting One',
          owner: { id: 2, name: 'John Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: true,
          is_co_owner: false,
          is_moderator: false,
          can_start: true
        }
      }
    });
    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: 'gs4-6fb-kk8'
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      router: routerMock,
      attachTo: createContainer(),
      stubs
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    const tabsComponent = view.findComponent(TabsComponent);

    expect(tabsComponent.exists()).toBeTruthy();

    expect(tabsComponent.props('room').id).toEqual('gs4-6fb-kk8');

    view.destroy();
  });

  it('room admin tabs component', async () => {
    mockAxios.request('/api/v1/rooms/gs4-6fb-kk8').respondWith({
      status: 200,
      data: {
        data: {
          id: 'gs4-6fb-kk8',
          name: 'Meeting One',
          owner: { id: 2, name: 'John Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: true,
          is_moderator: false,
          can_start: true,
          access_code: 123456789,
          current_user: exampleUser
        }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: 'gs4-6fb-kk8'
      },
      stubs,
      router: routerMock,
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    const adminTabsComponent = view.findComponent({ name: 'AdminTabsComponent' });

    // room is passed to tabs component
    expect(adminTabsComponent.props('room').id).toEqual('gs4-6fb-kk8');

    const request = mockAxios.request('/api/v1/rooms/gs4-6fb-kk8');

    // handle settings-changed event
    adminTabsComponent.vm.$emit('settings-changed');

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          id: 'gs4-6fb-kk8',
          name: 'Meeting Two',
          owner: { id: 2, name: 'John Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: true,
          is_moderator: false,
          can_start: true,
          access_code: 123456789,
          current_user: exampleUser
        }
      }
    });

    await view.vm.$nextTick();

    // check if room name is updated
    expect(view.html()).toContain('Meeting Two');

    view.destroy();
  });

  it('room admin tabs components for owner', async () => {
    mockAxios.request('/api/v1/rooms/gs4-6fb-kk8').respondWith({
      status: 200,
      data: {
        data: {
          id: 'gs4-6fb-kk8',
          name: 'Meeting One',
          owner: { id: 1, name: 'John Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: true,
          access_code: 123456789,
          current_user: exampleUser
        }
      }
    });
    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs,
      propsData: {
        id: 'gs4-6fb-kk8'
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      router: routerMock,
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    const adminComponent = view.findComponent(AdminTabsComponent);

    expect(adminComponent.exists()).toBeTruthy();

    expect(adminComponent.props('room').id).toEqual('gs4-6fb-kk8');

    view.destroy();
  });

  it('room admin tabs components for co-owner', async () => {
    mockAxios.request('/api/v1/rooms/gs4-6fb-kk8').respondWith({
      status: 200,
      data: {
        data: {
          id: 'gs4-6fb-kk8',
          name: 'Meeting One',
          owner: { id: 2, name: 'John Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: true,
          is_co_owner: true,
          is_moderator: false,
          can_start: true,
          access_code: null,
          current_user: exampleUser
        }
      }
    });
    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs,
      propsData: {
        id: 'gs4-6fb-kk8'
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      router: routerMock,
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    const adminComponent = view.findComponent(AdminTabsComponent);

    expect(adminComponent.exists()).toBeTruthy();

    expect(adminComponent.props('room').id).toEqual('gs4-6fb-kk8');

    view.destroy();
  });

  it('room admin tabs components with rooms.viewAll permission', async () => {
    mockAxios.request('/api/v1/rooms/gs4-6fb-kk8').respondWith({
      status: 200,
      data: {
        data: {
          id: 'gs4-6fb-kk8',
          name: 'Meeting One',
          owner: { id: 2, name: 'John Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: true,
          access_code: 123456789,
          current_user: exampleUser
        }
      }
    });
    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs,
      propsData: {
        id: 'gs4-6fb-kk8'
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      router: routerMock,
      attachTo: createContainer()
    });

    const authStore = useAuthStore();
    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.findComponent(AdminTabsComponent).exists()).toBeFalsy();
    expect(view.findComponent(TabsComponent).exists()).toBeTruthy();

    const newUser = _.clone(exampleUser);
    newUser.permissions = ['rooms.viewAll'];
    authStore.setCurrentUser(newUser);

    await view.vm.$nextTick();
    expect(view.findComponent(AdminTabsComponent).exists()).toBeTruthy();
    expect(view.findComponent(TabsComponent).exists()).toBeFalsy();

    view.destroy();
  });

  it('reload', async () => {
    const baseError = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const currentRoomChangedEventSpy = vi.fn();
    EventBus.on(EVENT_CURRENT_ROOM_CHANGED, currentRoomChangedEventSpy);

    const handleInvalidCode = vi.spyOn(RoomView.methods, 'handleInvalidCode').mockImplementation(() => {});
    const handleGuestsNotAllowed = vi.spyOn(RoomView.methods, 'handleGuestsNotAllowed').mockImplementation(() => {});
    const handleInvalidToken = vi.spyOn(RoomView.methods, 'handleInvalidToken').mockImplementation(() => {});

    mockAxios.request('/api/v1/rooms/cba-fed-234').respondWith({
      status: 200,
      data: {
        data: {
          id: 'cba-fed-234',
          name: 'Meeting One',
          owner: { id: 2, name: 'John Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: true,
          is_co_owner: true,
          is_moderator: false,
          can_start: true,
          access_code: 123456789,
          current_user: exampleUser
        }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs,
      propsData: {
        id: 'cba-fed-234'
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      router: routerMock,
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.html()).toContain('Meeting One');

    const details = view.findComponent({ name: 'RoomDetailsComponent' });
    expect(details.exists()).toBeTruthy();
    expect(details.props('room').name).toEqual('Meeting One');

    // test if room name is shown in the title
    expect(document.title).toBe('Meeting One - PILOS');

    // test reload with changes of the room data
    let request = mockAxios.request('/api/v1/rooms/cba-fed-234');
    const reloadButton = view.findComponent({ ref: 'reloadButton' });
    await reloadButton.trigger('click');
    await view.vm.$nextTick();
    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          id: 'cba-fed-234',
          name: 'Meeting Two',
          owner: { id: 1, name: 'John Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: true,
          is_co_owner: false,
          is_moderator: true,
          can_start: true,
          access_code: 123456789,
          current_user: exampleUser
        }
      }
    });
    expect(view.html()).toContain('Meeting Two');

    expect(details.props('room').name).toEqual('Meeting Two');

    // test if room name is updated in the title
    expect(document.title).toBe('Meeting Two - PILOS');

    // test if currentRoomChangedEvent is emitted
    expect(currentRoomChangedEventSpy).toBeCalledTimes(1);

    // test reload with room not found
    request = mockAxios.request('/api/v1/rooms/cba-fed-234');
    await reloadButton.trigger('click');
    await request.wait();
    await request.respondWith({
      status: 404,
      data: { message: 'No query results for model [App\\Room] abc-def-123' }
    });

    // test reload with access code now invalid, changed in the meantime
    request = mockAxios.request('/api/v1/rooms/cba-fed-234');
    await reloadButton.trigger('click');
    await request.wait();
    await request.respondWith({
      status: 401,
      data: { message: 'invalid_code' }
    });
    expect(handleInvalidCode).toBeCalledTimes(1);

    // test reload with personalized room token now invalid, deleted/expired in the meantime
    request = mockAxios.request('/api/v1/rooms/cba-fed-234');
    await reloadButton.trigger('click');
    await request.wait();
    await request.respondWith({
      status: 401,
      data: { message: 'invalid_token' }
    });
    expect(handleInvalidToken).toBeCalledTimes(1);

    // test reload with changed access policy, now guests are not allowed anymore
    request = mockAxios.request('/api/v1/rooms/cba-fed-234');
    await reloadButton.trigger('click');
    await request.wait();
    await request.respondWith({
      status: 403,
      data: { message: 'guests_not_allowed' }
    });
    expect(handleGuestsNotAllowed).toBeCalledTimes(1);

    // test reload with some server errors
    request = mockAxios.request('/api/v1/rooms/cba-fed-234');
    await reloadButton.trigger('click');
    await request.wait();
    await request.respondWith({
      status: 500,
      data: { message: 'Internal server error' }
    });
    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(500);

    view.destroy();
  });

  it('handle invalid code', async () => {
    const reload = vi.spyOn(RoomView.methods, 'reload').mockImplementation(() => {});
    const toastErrorSpy = vi.fn();

    mockAxios.request('/api/v1/rooms/abc-def-789').respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-789',
          name: 'Meeting One',
          owner: 'John Doe',
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: false,
          allow_membership: false,
          is_member: false,
          is_owner: false,
          is_guest: true,
          is_moderator: false,
          can_start: false,
          current_user: null
        }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key,
        toastError: toastErrorSpy
      },
      data () {
        return {
          accessCodeValid: null,
          accessCode: 123456789
        };
      },
      stubs,
      propsData: {
        id: 'abc-def-789'
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      attachTo: createContainer()
    });
    await mockAxios.request();
    await view.vm.$nextTick();

    view.vm.handleInvalidCode();
    expect(view.vm.$data.accessCodeValid).toBeFalsy();
    expect(view.vm.$data.accessCode).toBeNull();
    expect(toastErrorSpy).toBeCalledTimes(1);
    expect(toastErrorSpy.mock.calls[0][0]).toBe('rooms.flash.access_code_invalid');
    expect(reload).toBeCalledTimes(1);

    view.destroy();
  });

  it('handle invalid token', async () => {
    const toastErrorSpy = vi.fn();
    const clearInterval = vi.spyOn(global, 'clearInterval').mockImplementation(() => {});
    mockAxios.request('/api/v1/rooms/abc-def-789').respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-789',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          username: 'John Doe',
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: false,
          record_attendance: false,
          current_user: null
        }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key,
        toastError: toastErrorSpy
      },
      propsData: {
        id: 'abc-def-789',
        token: 'xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR'
      },
      stubs,
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialStateNoUser), stubActions: false }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    view.vm.handleInvalidToken();
    expect(toastErrorSpy).toBeCalledTimes(1);
    expect(toastErrorSpy.mock.calls[0][0]).toBe('rooms.flash.token_invalid');
    expect(clearInterval).toBeCalledTimes(1);
    view.destroy();
  });

  it('handle empty code', async () => {
    const toastErrorSpy = vi.fn();

    mockAxios.request('/api/v1/rooms/abc-def-456').respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-456',
          name: 'Meeting One',
          owner: 'John Doe',
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: false,
          allow_membership: false,
          is_member: false,
          is_owner: false,
          is_guest: true,
          is_moderator: false,
          can_start: false,
          current_user: null
        }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key,
        toastError: toastErrorSpy
      },
      propsData: {
        id: 'abc-def-456'
      },
      stubs,
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      attachTo: createContainer()
    });

    await mockAxios.wait();

    // load room view
    await view.vm.$nextTick();
    // check if require access code is shown
    expect(view.html()).toContain('rooms.require_access_code');

    // click on the login button without input to access code field
    const loginButton = view.findAllComponents(BButton).at(1);
    expect(loginButton.text()).toBe('rooms.login');

    const request = mockAxios.request('/api/v1/rooms/abc-def-456');

    await loginButton.trigger('click');

    // check if request is send to server with empty access code
    await request.wait();
    expect(request.config.headers['Access-Code']).toBe('');

    const autoReloadRequest = mockAxios.request('/api/v1/rooms/abc-def-456');

    // respond with invalid access code error message
    await request.respondWith({
      status: 401,
      data: { message: 'invalid_code' }
    });
    await view.vm.$nextTick();
    // check if internal access code is reset and error is shown
    expect(view.vm.$data.accessCodeValid).toBeFalsy();
    expect(view.vm.$data.accessCode).toBeNull();
    expect(toastErrorSpy).toBeCalledTimes(1);
    expect(toastErrorSpy.mock.calls[0][0]).toBe('rooms.flash.access_code_invalid');

    // check if room is reloaded without access code
    await autoReloadRequest.wait();
    expect(autoReloadRequest.config.headers['Access-Code']).toBeUndefined();
    await autoReloadRequest.respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-456',
          name: 'Meeting One',
          owner: 'John Doe',
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: false,
          allow_membership: false,
          is_member: false,
          is_owner: false,
          is_guest: true,
          is_moderator: false,
          can_start: false,
          current_user: null
        }
      }
    });
    // check if reload was successful and no other error message is shown
    expect(toastErrorSpy).toBeCalledTimes(1);

    view.destroy();
  });

  it('join running meeting', async () => {
    const oldWindow = window.location;
    delete window.location;
    window.location = null;
    mockAxios.request('/api/v1/rooms/abc-def-789').respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-789',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          last_meeting: { start: '2023-08-21 08:18:28:00', end: null },
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: false,
          record_attendance: false,
          current_user: exampleUser
        }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs,
      propsData: {
        id: 'abc-def-789'
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeFalsy();

    const joinButton = view.findComponent({ ref: 'joinMeeting' });
    await view.vm.$nextTick();

    expect(joinButton.attributes('disabled')).toBeUndefined();

    const joinRequest = mockAxios.request('/api/v1/rooms/abc-def-789/join');

    await joinButton.trigger('click');
    await view.vm.$nextTick();

    expect(joinButton.attributes('disabled')).toEqual('disabled');

    await joinRequest.wait();
    expect(joinRequest.config.params).toEqual({ name: '', record_attendance: 0 });

    await joinRequest.respondWith({
      status: 200,
      data: {
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
    mockAxios.request('/api/v1/rooms/abc-def-789').respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-789',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          last_meeting: { start: '2023-08-21 08:18:28:00', end: null },
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: false,
          record_attendance: true,
          current_user: exampleUser
        }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs,
      propsData: {
        id: 'abc-def-789'
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeTruthy();
    const agreementCheckbox = view.findComponent({ ref: 'recordingAttendanceInfo' }).findComponent(BFormCheckbox);
    await agreementCheckbox.get('input').trigger('click');

    const joinButton = view.findComponent({ ref: 'joinMeeting' });
    await view.vm.$nextTick();

    const joinRequest = mockAxios.request('/api/v1/rooms/abc-def-789/join');

    await joinButton.trigger('click');

    await joinRequest.wait();
    expect(joinRequest.config.params).toEqual({ name: '', record_attendance: 1 });

    await joinRequest.respondWith({
      status: 200,
      data: {
        url: 'test.tld'
      }
    });

    expect(window.location).toEqual('test.tld');
    window.location = oldWindow;

    view.destroy();
  });

  it('join running meeting guests', async () => {
    const oldWindow = window.location;
    delete window.location;
    window.location = null;

    mockAxios.request('/api/v1/rooms/abc-def-789').respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-789',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          last_meeting: { start: '2023-08-21 08:18:28:00', end: null },
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: false,
          record_attendance: true,
          current_user: null
        }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs,
      propsData: {
        id: 'abc-def-789'
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialStateNoUser), stubActions: false }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
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

    let joinRequest = mockAxios.request('/api/v1/rooms/abc-def-789/join');

    await joinButton.trigger('click');

    // check with invalid chars in guest name
    await joinRequest.wait();
    expect(joinRequest.config.params).toEqual({ name: 'John Doe 123!', record_attendance: 1 });

    // respond with validation errors
    await joinRequest.respondWith({
      status: 422,
      data: {
        message: 'The given data was invalid.',
        errors: { name: ['The name contains the following non-permitted characters: 123!'] }
      }
    });

    // check if error is shown
    await view.vm.$nextTick();
    const nameGroup = view.find('#guest-name-group');
    expect(nameGroup.classes()).toContain('is-invalid');
    expect(nameGroup.text()).toContain('The name contains the following non-permitted characters: 123!');

    // check with valid name
    nameInput.setValue('John Doe');
    await view.vm.$nextTick();

    joinRequest = mockAxios.request('/api/v1/rooms/abc-def-789/join');

    await joinButton.trigger('click');

    await joinRequest.wait();
    expect(joinRequest.config.params).toEqual({ name: 'John Doe', record_attendance: 1 });

    // check if errors are removed on new request
    expect(nameGroup.classes()).not.toContain('is-invalid');
    expect(nameGroup.text()).not.toContain('The name contains the following non-permitted characters: 123!');

    await joinRequest.respondWith({
      status: 200,
      data: {
        url: 'test.tld'
      }
    });

    expect(window.location).toEqual('test.tld');
    window.location = oldWindow;
    view.destroy();
  });

  it('join running meeting guests with access token', async () => {
    const oldWindow = window.location;
    delete window.location;
    window.location = null;
    mockAxios.request('/api/v1/rooms/abc-def-789').respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-789',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          last_meeting: { start: '2023-08-21 08:18:28:00', end: null },
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: false,
          record_attendance: true,
          current_user: null
        }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs,
      propsData: {
        id: 'abc-def-789'
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialStateNoUser), stubActions: false }),
      attachTo: createContainer(),
      data () {
        return {
          accessCode: 905992606
        };
      }
    });

    await mockAxios.wait();
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
    let joinRequest = mockAxios.request('/api/v1/rooms/abc-def-789/join');
    await joinButton.trigger('click');

    // check with invalid chars in guest name
    await joinRequest.wait();
    expect(joinRequest.config.headers['Access-Code']).toBe('905992606');
    expect(joinRequest.config.params).toEqual({ name: 'John Doe 123!', record_attendance: 1 });

    // respond with validation errors
    await joinRequest.respondWith({
      status: 422,
      data: {
        message: 'The given data was invalid.',
        errors: { name: ['The name contains the following non-permitted characters: 123!'] }
      }
    });

    // check if error is shown
    await view.vm.$nextTick();
    const nameGroup = view.find('#guest-name-group');
    expect(nameGroup.classes()).toContain('is-invalid');
    expect(nameGroup.text()).toContain('The name contains the following non-permitted characters: 123!');

    // check with valid name
    nameInput.setValue('John Doe');
    await view.vm.$nextTick();
    joinRequest = mockAxios.request('/api/v1/rooms/abc-def-789/join');
    await joinButton.trigger('click');

    await joinRequest.wait();
    expect(joinRequest.config.headers['Access-Code']).toBe('905992606');
    expect(joinRequest.config.params).toEqual({ name: 'John Doe', record_attendance: 1 });

    // check if errors are removed on new request
    expect(nameGroup.classes()).not.toContain('is-invalid');
    expect(nameGroup.text()).not.toContain('The name contains the following non-permitted characters: 123!');

    await joinRequest.respondWith({
      status: 200,
      data: {
        url: 'test.tld'
      }
    });

    expect(window.location).toEqual('test.tld');
    window.location = oldWindow;
    view.destroy();
  });

  it('join running meeting token', async () => {
    const oldWindow = window.location;
    delete window.location;
    window.location = null;
    mockAxios.request('/api/v1/rooms/abc-def-789').respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-789',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          last_meeting: { start: '2023-08-21 08:18:28:00', end: null },
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          username: 'John Doe',
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: false,
          record_attendance: false,
          current_user: null
        }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs,
      propsData: {
        id: 'abc-def-789',
        token: 'xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR'
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialStateNoUser), stubActions: false }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    const joinButton = view.findComponent({ ref: 'joinMeeting' });
    const nameInput = view.findComponent({ ref: 'guestName' });

    expect(joinButton.attributes('disabled')).toBeUndefined();
    expect(nameInput.attributes('disabled')).toBe('disabled');
    expect(nameInput.element.value).toBe('John Doe');

    const joinRequest = mockAxios.request('/api/v1/rooms/abc-def-789/join');

    await joinButton.trigger('click');

    // check with invalid chars in guest name
    await joinRequest.wait();
    expect(joinRequest.config.headers.Token).toBe('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
    expect(joinRequest.config.params).toEqual({ name: null, record_attendance: 0 });

    await joinRequest.respondWith({
      status: 200,
      data: {
        url: 'test.tld'
      }
    });

    expect(window.location).toEqual('test.tld');
    window.location = oldWindow;
    view.destroy();
  });

  it('join meeting errors', async () => {
    const handleInvalidCode = vi.spyOn(RoomView.methods, 'handleInvalidCode').mockImplementation(() => {});
    const handleGuestsNotAllowed = vi.spyOn(RoomView.methods, 'handleGuestsNotAllowed').mockImplementation(() => {});
    const handleInvalidToken = vi.spyOn(RoomView.methods, 'handleInvalidToken').mockImplementation(() => {});
    const baseError = vi.spyOn(Base, 'error').mockImplementation(() => {});
    mockAxios.request('/api/v1/rooms/abc-def-789').respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-789',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          last_meeting: { start: '2023-08-21 08:18:28', end: null },
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          short_description: null,
          is_favorite: false,
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: false,
          record_attendance: false,
          current_user: exampleUser
        }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs,
      propsData: {
        id: 'abc-def-789'
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();
    let joinButton = view.findComponent({ ref: 'joinMeeting' });
    expect(joinButton.attributes('disabled')).toBeUndefined();

    let joinRequest = mockAxios.request('/api/v1/rooms/abc-def-789/join');

    // test guests not allowed
    await joinButton.trigger('click');
    await joinRequest.wait();
    expect(joinRequest.config.params).toEqual({ name: '', record_attendance: 0 });
    await joinRequest.respondWith({
      status: 403,
      data: { message: 'guests_not_allowed' }
    });
    await view.vm.$nextTick();
    expect(handleGuestsNotAllowed).toBeCalledTimes(1);

    // test invalid access token
    joinRequest = mockAxios.request('/api/v1/rooms/abc-def-789/join');
    await joinButton.trigger('click');
    await joinRequest.wait();
    expect(joinRequest.config.params).toEqual({ name: '', record_attendance: 0 });
    await joinRequest.respondWith({
      status: 401,
      data: { message: 'invalid_code' }
    });
    await view.vm.$nextTick();
    expect(handleInvalidCode).toBeCalledTimes(1);

    // test invalid access token
    joinRequest = mockAxios.request('/api/v1/rooms/abc-def-789/join');
    await joinButton.trigger('click');
    await joinRequest.wait();
    expect(joinRequest.config.params).toEqual({ name: '', record_attendance: 0 });
    await joinRequest.respondWith({
      status: 403,
      data: { message: 'require_code' }
    });
    await view.vm.$nextTick();
    expect(handleInvalidCode).toBeCalledTimes(2);

    // test invalid token
    joinRequest = mockAxios.request('/api/v1/rooms/abc-def-789/join');
    await joinButton.trigger('click');
    await joinRequest.wait();
    expect(joinRequest.config.params).toEqual({ name: '', record_attendance: 0 });
    await joinRequest.respondWith({
      status: 401,
      data: { message: 'invalid_token' }
    });
    await view.vm.$nextTick();
    expect(handleInvalidToken).toBeCalledTimes(1);

    // test without required recording agreement
    joinRequest = mockAxios.request('/api/v1/rooms/abc-def-789/join');
    expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeFalsy();
    await joinButton.trigger('click');
    await joinRequest.wait();
    expect(joinRequest.config.params).toEqual({ name: '', record_attendance: 0 });
    await joinRequest.respondWith({
      status: 470,
      data: {
        message: 'Consent to record attendance is required.'
      }
    });
    await view.vm.$nextTick();
    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(470);
    expect(baseError.mock.calls[0][0].response.data.message).toEqual('Consent to record attendance is required.');
    expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeTruthy();

    // test Room closed
    const agreementCheckbox = view.findComponent({ ref: 'recordingAttendanceInfo' }).findComponent(BFormCheckbox);
    await agreementCheckbox.get('input').trigger('click');

    joinButton = view.findComponent({ ref: 'joinMeeting' });
    expect(joinButton.attributes('disabled')).toBeUndefined();

    joinRequest = mockAxios.request('/api/v1/rooms/abc-def-789/join');
    const reloadRequest = mockAxios.request('/api/v1/rooms/abc-def-789');

    await joinButton.trigger('click');

    await joinRequest.wait();
    expect(joinRequest.config.params).toEqual({ name: '', record_attendance: 1 });

    await joinRequest.respondWith({
      status: 460,
      data: {
        message: 'Joining failed! The room is currently closed.'
      }
    });

    expect(baseError).toBeCalledTimes(2);
    expect(baseError.mock.calls[1][0].response.status).toEqual(460);
    expect(baseError.mock.calls[1][0].response.data.message).toEqual('Joining failed! The room is currently closed.');

    await reloadRequest.wait();
    await reloadRequest.respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-789',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          last_meeting: { start: '2023-08-21 08:18:28', end: '2023-08-21 08:18:30' },
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          short_description: null,
          is_favorite: false,
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: false,
          record_attendance: false,
          current_user: exampleUser
        }
      }
    });
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'joinMeeting' }).exists()).toBeFalsy();

    view.destroy();
  });

  it('start meeting', async () => {
    const oldWindow = window.location;
    delete window.location;
    window.location = null;
    mockAxios.request('/api/v1/rooms/abc-def-789').respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-789',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: true,
          record_attendance: false,
          current_user: exampleUser
        }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs,
      propsData: {
        id: 'abc-def-789'
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeFalsy();

    const startButton = view.findComponent({ ref: 'startMeeting' });
    await view.vm.$nextTick();
    expect(startButton.attributes('disabled')).toBeUndefined();

    const startRequest = mockAxios.request('/api/v1/rooms/abc-def-789/start');

    await startButton.trigger('click');
    await view.vm.$nextTick();

    expect(startButton.attributes('disabled')).toEqual('disabled');

    await startRequest.wait();
    expect(startRequest.config.params).toEqual({ name: '', record_attendance: 0 });

    await startRequest.respondWith({
      status: 200,
      data: {
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
    mockAxios.request('/api/v1/rooms/abc-def-789').respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-789',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: true,
          record_attendance: true,
          current_user: exampleUser
        }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs,
      propsData: {
        id: 'abc-def-789'
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeTruthy();
    const agreementCheckbox = view.findComponent({ ref: 'recordingAttendanceInfo' }).findComponent(BFormCheckbox);
    await agreementCheckbox.get('input').trigger('click');

    const startButton = view.findComponent({ ref: 'startMeeting' });

    const startRequest = mockAxios.request('/api/v1/rooms/abc-def-789/start');

    await view.vm.$nextTick();
    await startButton.trigger('click');

    await startRequest.wait();
    expect(startRequest.config.params).toEqual({ name: '', record_attendance: 1 });

    await startRequest.respondWith({
      status: 200,
      data: {
        url: 'test.tld'
      }
    });

    expect(window.location).toEqual('test.tld');
    window.location = oldWindow;

    view.destroy();
  });

  it('start meeting guests', async () => {
    const oldWindow = window.location;
    delete window.location;
    window.location = null;
    mockAxios.request('/api/v1/rooms/abc-def-789').respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-789',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: true,
          record_attendance: true,
          current_user: null
        }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs,
      propsData: {
        id: 'abc-def-789'
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialStateNoUser), stubActions: false }),
      attachTo: createContainer()
    });
    await mockAxios.wait();
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

    let startRequest = mockAxios.request('/api/v1/rooms/abc-def-789/start');

    await view.vm.$nextTick();
    await startButton.trigger('click');

    // check with invalid chars in name
    await startRequest.wait();
    expect(startRequest.config.params).toEqual({ name: 'John Doe 123!', record_attendance: 1 });

    // respond with validation errors
    await startRequest.respondWith({
      status: 422,
      data: {
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
    startRequest = mockAxios.request('/api/v1/rooms/abc-def-789/start');
    await startButton.trigger('click');

    await startRequest.wait();
    expect(startRequest.config.params).toEqual({ name: 'John Doe', record_attendance: 1 });

    // check if errors are removed on new request
    expect(nameGroup.classes()).not.toContain('is-invalid');
    expect(nameGroup.text()).not.toContain('The name contains the following non-permitted characters: 123!');

    await startRequest.respondWith({
      status: 200,
      data: {
        url: 'test.tld'
      }
    });

    expect(window.location).toEqual('test.tld');
    window.location = oldWindow;
    view.destroy();
  });

  it('start meeting errors', async () => {
    const handleInvalidCode = vi.spyOn(RoomView.methods, 'handleInvalidCode').mockImplementation(() => {});
    const handleGuestsNotAllowed = vi.spyOn(RoomView.methods, 'handleGuestsNotAllowed').mockImplementation(() => {});
    const handleInvalidToken = vi.spyOn(RoomView.methods, 'handleInvalidToken').mockImplementation(() => {});

    const baseError = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const toastErrorSpy = vi.fn();
    mockAxios.request('/api/v1/rooms/abc-def-789').respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-789',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: true,
          record_attendance: false,
          current_user: exampleUser
        }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key,
        toastError: toastErrorSpy
      },
      stubs,
      propsData: {
        id: 'abc-def-789'
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeFalsy();

    let startButton = view.findComponent({ ref: 'startMeeting' });
    expect(startButton.attributes('disabled')).toBeUndefined();

    // test guests not allowed
    let startRequest = mockAxios.request('/api/v1/rooms/abc-def-789/start');
    await startButton.trigger('click');
    await startRequest.wait();
    expect(startRequest.config.params).toEqual({ name: '', record_attendance: 0 });
    await startRequest.respondWith({
      status: 403,
      data: { message: 'guests_not_allowed' }
    });
    await view.vm.$nextTick();

    expect(handleGuestsNotAllowed).toBeCalledTimes(1);

    // test invalid access token
    startRequest = mockAxios.request('/api/v1/rooms/abc-def-789/start');
    await startButton.trigger('click');
    await startRequest.wait();
    expect(startRequest.config.params).toEqual({ name: '', record_attendance: 0 });
    await startRequest.respondWith({
      status: 401,
      data: { message: 'invalid_code' }
    });
    await view.vm.$nextTick();
    expect(handleInvalidCode).toBeCalledTimes(1);

    // test access token required
    startRequest = mockAxios.request('/api/v1/rooms/abc-def-789/start');
    await startButton.trigger('click');
    await startRequest.wait();
    expect(startRequest.config.params).toEqual({ name: '', record_attendance: 0 });
    await startRequest.respondWith({
      status: 403,
      data: { message: 'require_code' }
    });
    await view.vm.$nextTick();
    expect(handleInvalidCode).toBeCalledTimes(2);

    // test invalid token
    startRequest = mockAxios.request('/api/v1/rooms/abc-def-789/start');
    await startButton.trigger('click');
    await startRequest.wait();
    expect(startRequest.config.params).toEqual({ name: '', record_attendance: 0 });
    await startRequest.respondWith({
      status: 401,
      data: { message: 'invalid_token' }
    });

    await view.vm.$nextTick();
    expect(handleInvalidToken).toBeCalledTimes(1);

    startRequest = mockAxios.request('/api/v1/rooms/abc-def-789/start');
    await startButton.trigger('click');
    await startRequest.wait();
    expect(startRequest.config.params).toEqual({ name: '', record_attendance: 0 });
    await startRequest.respondWith({
      status: 470,
      data: {
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

    startRequest = mockAxios.request('/api/v1/rooms/abc-def-789/start');
    await startButton.trigger('click');
    await startRequest.wait();
    expect(startRequest.config.params).toEqual({ name: '', record_attendance: 1 });

    const reloadRequest = mockAxios.request('/api/v1/rooms/abc-def-789');

    await startRequest.respondWith({
      status: 403,
      data: {
        message: 'This action is unauthorized.'
      }
    });

    expect(toastErrorSpy).toBeCalledTimes(1);
    expect(toastErrorSpy).toBeCalledWith('rooms.flash.start_forbidden');

    expect(view.findComponent({ ref: 'startMeeting' }).exists()).toBeFalsy();

    await reloadRequest.wait();
    await reloadRequest.respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-789',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: true,
          record_attendance: false,
          current_user: exampleUser
        }
      }
    });

    view.destroy();
  });

  it('start meeting access token', async () => {
    const oldWindow = window.location;
    delete window.location;
    window.location = null;
    mockAxios.request('/api/v1/rooms/abc-def-789').respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-789',
          name: 'Meeting One',
          owner: { id: 2, name: 'Max Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: true,
          record_attendance: false,
          current_user: exampleUser
        }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs,
      propsData: {
        id: 'abc-def-789'
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      attachTo: createContainer(),
      data () {
        return {
          accessCode: 905992606
        };
      }
    });

    await mockAxios.wait();
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeFalsy();

    const startButton = view.findComponent({ ref: 'startMeeting' });
    await view.vm.$nextTick();
    expect(startButton.attributes('disabled')).toBeUndefined();

    const startRequest = mockAxios.request('/api/v1/rooms/abc-def-789/start');

    await startButton.trigger('click');
    await view.vm.$nextTick();

    expect(startButton.attributes('disabled')).toEqual('disabled');

    await startRequest.wait();
    expect(startRequest.config.headers['Access-Code']).toBe('905992606');
    expect(startRequest.config.params).toEqual({ name: '', record_attendance: 0 });

    await startRequest.respondWith({
      status: 200,
      data: {
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

    mockAxios.request('/api/v1/rooms/abc-def-789').respondWith({
      status: 200,
      data: {
        data: {
          id: 'abc-def-789',
          name: 'Meeting One',
          last_meeting: null,
          owner: { id: 2, name: 'Max Doe' },
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          username: 'John Doe',
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: true,
          record_attendance: false,
          current_user: null
        }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs,
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialStateNoUser), stubActions: false }),
      attachTo: createContainer(),
      propsData: {
        id: 'abc-def-789',
        token: 'xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR'
      }
    });

    await mockAxios.wait();
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'recordingAttendanceInfo' }).exists()).toBeFalsy();

    const startButton = view.findComponent({ ref: 'startMeeting' });
    await view.vm.$nextTick();
    expect(startButton.attributes('disabled')).toBeUndefined();

    const startRequest = mockAxios.request('/api/v1/rooms/abc-def-789/start');

    await startButton.trigger('click');
    await view.vm.$nextTick();

    expect(startButton.attributes('disabled')).toEqual('disabled');

    await startRequest.wait();
    expect(startRequest.config.headers.Token).toBe('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
    expect(startRequest.config.params).toEqual({ name: null, record_attendance: 0 });

    await startRequest.respondWith({
      status: 200,
      data: {
        url: 'test.tld'
      }
    });

    await view.vm.$nextTick();

    expect(startButton.attributes('disabled')).toBeUndefined();

    expect(window.location).toEqual('test.tld');
    window.location = oldWindow;
    view.destroy();
  });

  it('membership dropdown button', async () => {
    const handleInvalidCode = vi.spyOn(RoomView.methods, 'handleInvalidCode').mockImplementation(() => {});

    const room = {
      id: 'cba-fed-123',
      name: 'Meeting One',
      owner: { id: 2, name: 'Max Doe' },
      last_meeting: null,
      type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
      model_name: 'Room',
      authenticated: true,
      allow_membership: false,
      is_member: true,
      is_co_owner: false,
      is_moderator: false,
      can_start: true,
      current_user: exampleUser
    };

    mockAxios.request('/api/v1/rooms/cba-fed-123').respondWith({
      status: 200,
      data: {
        data: { ...room, is_member: true }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      attachTo: createContainer(),
      propsData: {
        modalStatic: true,
        id: 'cba-fed-123'
      },
      data () {
        return {
          accessCode: 123456789
        };
      },
      stubs
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // Find the room membership dropdown button
    const roomMembershipDropdownButton = view.findComponent({ name: 'RoomMembershipDropdownButton' });

    // Check if the membership is correctly passed as prop
    expect(roomMembershipDropdownButton.props('room').is_member).toBeTruthy();

    let reloadRequest = mockAxios.request('/api/v1/rooms/cba-fed-123');

    // Trigger event on successful leave membership
    roomMembershipDropdownButton.vm.$emit('removed');

    // response for room reload, now with the user not being a member anymore
    await reloadRequest.wait();
    await reloadRequest.respondWith({
      status: 200,
      data: {
        data: { ...room, is_member: false }
      }
    });

    // check if the prop is updated
    expect(roomMembershipDropdownButton.props('room').is_member).toBeFalsy();

    // Trigger event on error while attempting to join membership due to invalid code
    expect(handleInvalidCode).toBeCalledTimes(0);

    roomMembershipDropdownButton.vm.$emit('invalid-code');

    // Check if invalid code handler is called
    expect(handleInvalidCode).toBeCalledTimes(1);

    // Trigger event on error while attempting to join membership due to invalid code
    reloadRequest = mockAxios.request('/api/v1/rooms/cba-fed-123');

    roomMembershipDropdownButton.vm.$emit('membership-disabled');

    // response for room reload to check the membership allowed state
    await reloadRequest.wait();
    await reloadRequest.respondWith({
      status: 200,
      data: {
        data: { ...room, is_member: false }
      }
    });

    // Trigger event on successful join membership
    reloadRequest = mockAxios.request('/api/v1/rooms/cba-fed-123');
    roomMembershipDropdownButton.vm.$emit('added');

    await reloadRequest.wait();

    // Check if access code is reset after joining membership and not used for the next request
    expect(view.vm.$data.accessCode).toEqual(null);
    expect(reloadRequest.config.headers['Access-Code']).toBeUndefined();

    await reloadRequest.respondWith({
      status: 200,
      data: {
        data: { ...room, is_member: true }
      }
    });

    // check if the prop is updated
    expect(roomMembershipDropdownButton.props('room').is_member).toBeTruthy();

    view.destroy();
  });

  it('favorites dropdown button', async () => {
    const room = {
      id: 'cba-fed-123',
      name: 'Meeting One',
      owner: { id: 2, name: 'Max Doe' },
      last_meeting: null,
      type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
      model_name: 'Room',
      authenticated: true,
      allow_membership: false,
      is_member: true,
      is_co_owner: false,
      is_moderator: false,
      is_favorite: false,
      can_start: true,
      current_user: exampleUser
    };

    mockAxios.request('/api/v1/rooms/cba-fed-123').respondWith({
      status: 200,
      data: {
        data: { ...room, is_favorite: false }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      attachTo: createContainer(),
      propsData: {
        modalStatic: true,
        id: 'cba-fed-123'
      },
      data () {
        return {
          accessCode: 123456789
        };
      },
      stubs
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // find room favorite component
    const roomFavoriteDropdownButton = view.findComponent({ name: 'RoomFavoriteDropdownButton' });

    // Check if the membership is correctly passed as prop
    expect(roomFavoriteDropdownButton.props('room').is_favorite).toBeFalsy();

    const roomRequest = mockAxios.request('/api/v1/rooms/cba-fed-123');

    // fire event
    roomFavoriteDropdownButton.vm.$emit('favorites-changed');
    await roomRequest.wait();

    await roomRequest.respondWith({
      status: 200,
      data: {
        data: { ...room, is_favorite: true }
      }
    });

    view.destroy();
  });

  it('transfer ownership dropdown button', async () => {
    const room = {
      id: 'cba-fed-123',
      name: 'Meeting One',
      owner: { id: 1, name: 'John Doe' },
      last_meeting: null,
      type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
      model_name: 'Room',
      authenticated: true,
      allow_membership: false,
      is_member: false,
      is_co_owner: false,
      is_moderator: false,
      is_favorite: false,
      can_start: true,
      current_user: exampleUser
    };

    mockAxios.request('/api/v1/rooms/cba-fed-123').respondWith({
      status: 200,
      data: {
        data: { ...room, owner: { id: 1, name: 'John Doe' }, is_member: false, is_co_owner: false, is_moderator: false }
      }
    });

    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      attachTo: createContainer(),
      propsData: {
        modalStatic: true,
        id: 'cba-fed-123'
      },
      data () {
        return {
          accessCode: 123456789
        };
      },
      stubs
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // find the transfer ownership dropdown button
    const transferOwnershipDropdownButton = view.findComponent({ name: 'TransferOwnershipDropdownButton' });
    expect(transferOwnershipDropdownButton.exists()).toBeTruthy();

    // Check if the owner and membership are correctly passed as prop
    expect(transferOwnershipDropdownButton.props('room').owner.id).toBe(1);
    expect(transferOwnershipDropdownButton.props('room').owner.name).toBe('John Doe');
    expect(transferOwnershipDropdownButton.props('room').is_member).toBeFalsy();
    expect(transferOwnershipDropdownButton.props('room').is_co_owner).toBeFalsy();
    expect(transferOwnershipDropdownButton.props('room').is_moderator).toBeFalsy();

    const roomRequest = mockAxios.request('/api/v1/rooms/cba-fed-123');

    // fire event
    transferOwnershipDropdownButton.vm.$emit('transferred-ownership');
    await roomRequest.wait();

    // respond with different owner and current user as co_owner
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: { ...room, owner: { id: 2, name: 'Max Doe' }, is_member: true, is_co_owner: true, is_moderator: false }
      }
    });
    await view.vm.$nextTick();

    // make sure that the transfer ownership dropdown button is not shown for user that is not the owner
    expect(transferOwnershipDropdownButton.exists()).toBeFalsy();

    view.destroy();
  });

  it('logged in status change', async () => {
    mockAxios.request('/api/v1/rooms/cba-fed-234').respondWith({
      status: 200,
      data: {
        data: {
          id: 'cba-fed-234',
          name: 'Meeting One',
          owner: { id: 1, name: 'John Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: false,
          access_code: 123456789,
          current_user: exampleUser
        }
      }
    });
    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs,
      propsData: {
        id: 'cba-fed-234'
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      router: routerMock,
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();
    expect(view.findComponent({ name: 'AdminTabsComponent' }).exists()).toBeTruthy();
    expect(view.findComponent({ name: 'TabsComponent' }).exists()).toBeFalsy();

    let reloadRequest = mockAxios.request('/api/v1/rooms/cba-fed-234');

    const reloadButton = view.findComponent({ ref: 'reloadButton' });
    reloadButton.trigger('click');

    await reloadRequest.wait();
    await reloadRequest.respondWith({
      status: 200,
      data: {
        data: {
          id: 'cba-fed-234',
          name: 'Meeting One',
          owner: { id: 1, name: 'John Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: true,
          current_user: null
        }
      }
    });

    const authStore = useAuthStore();

    await view.vm.$nextTick();
    expect(view.findComponent({ name: 'AdminTabsComponent' }).exists()).toBeFalsy();
    expect(view.findComponent({ name: 'TabsComponent' }).exists()).toBeTruthy();

    expect(authStore.isAuthenticated).toBeFalsy();

    reloadRequest = mockAxios.request('/api/v1/rooms/cba-fed-234');

    await reloadButton.trigger('click');
    await reloadRequest.wait();
    await reloadRequest.respondWith({
      status: 200,
      data: {
        data: {
          id: 'cba-fed-234',
          name: 'Meeting One',
          owner: { id: 1, name: 'John Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: true,
          is_co_owner: true,
          is_moderator: false,
          can_start: true,
          access_code: 123456789,
          current_user: exampleUser
        }
      }
    });
    await view.vm.$nextTick();
    expect(authStore.isAuthenticated).toBeTruthy();
    expect(view.findComponent({ name: 'AdminTabsComponent' }).exists()).toBeTruthy();
    expect(view.findComponent({ name: 'TabsComponent' }).exists()).toBeFalsy();

    reloadRequest = mockAxios.request('/api/v1/rooms/cba-fed-234');

    await reloadButton.trigger('click');
    await reloadRequest.wait();
    await reloadRequest.respondWith({
      status: 403,
      data: { message: 'guests_not_allowed' }
    });

    expect(view.findComponent({ name: 'AdminTabsComponent' }).exists()).toBeFalsy();
    expect(view.findComponent({ name: 'TabsComponent' }).exists()).toBeFalsy();
    expect(authStore.isAuthenticated).toBeFalsy();
    view.destroy();
  });

  it('random polling interval', async () => {
    mockAxios.request('/api/v1/rooms/cba-fed-234').respondWith({
      status: 200,
      data: {
        data: {
          id: 'cba-fed-234',
          name: 'Meeting One',
          owner: { id: 1, name: 'John Doe' },
          last_meeting: null,
          type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
          model_name: 'Room',
          authenticated: true,
          allow_membership: false,
          is_member: false,
          is_co_owner: false,
          is_moderator: false,
          can_start: false,
          access_code: 123456789,
          current_user: exampleUser
        }
      }
    });
    const view = mount(RoomView, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      stubs,
      propsData: {
        id: 'cba-fed-234'
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState), stubActions: false }),
      router: routerMock,
      attachTo: createContainer()
    });
    const settingsStore = useSettingsStore();

    await mockAxios.wait();
    await view.vm.$nextTick();
    // use fixed random value for testing only
    vi.spyOn(Math, 'random').mockReturnValue(0.4);

    // check for pos. integer
    settingsStore.settings.room_refresh_rate = 10;
    expect(view.vm.getRandomRefreshInterval()).toBe(9.7);

    // check for zero
    settingsStore.settings.room_refresh_rate = 0;
    expect(view.vm.getRandomRefreshInterval()).toBe(0);

    // check for neg. integer
    settingsStore.settings.room_refresh_rate = -20;
    expect(view.vm.getRandomRefreshInterval()).toBe(19.4);

    // check for float
    settingsStore.settings.room_refresh_rate = 4.2;
    expect(view.vm.getRandomRefreshInterval()).toBe(4.074);

    view.destroy();
  });
});
