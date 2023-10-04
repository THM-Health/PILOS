import { mount } from '@vue/test-utils';
import RoomList from '../../../../resources/js/views/rooms/Index.vue';
import { BButton, BFormInput, BFormSelect } from 'bootstrap-vue';
import NewRoomComponent from '../../../../resources/js/components/Room/NewRoomComponent.vue';
import PermissionService from '../../../../resources/js/services/PermissionService';
import _ from 'lodash';
import VueRouter from 'vue-router';
import Base from '../../../../resources/js/api/base';
import { mockAxios, createContainer, createLocalVue, i18nDateMock } from '../../helper';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: [], model_name: 'User', room_limit: -1 };
const initialState = { auth: { currentUser: exampleUser } };

const localVue = createLocalVue();
localVue.use(VueRouter);
localVue.use(PiniaVuePlugin);

describe('Create new rooms', () => {
  beforeEach(() => {
    mockAxios.reset();
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
        last_meeting: null,
        type: {
          id: 2,
          short: 'ME',
          description: 'Meeting',
          color: '#4a5c66',
          default: false
        },
        is_favorite: false,
        short_description: 'Own room'
      },
      {
        id: 'def-abc-123',
        name: 'Meeting Two',
        owner: {
          id: 1,
          name: 'John Doe'
        },
        last_meeting: {
          start: '2023-08-21 08:18:28:00',
          end: null
        },
        type: {
          id: 2,
          short: 'ME',
          description: 'Meeting',
          color: '#4a5c66',
          default: false
        },
        is_favorite: false,
        short_description: null
      },
      {
        id: 'def-abc-456',
        name: 'Meeting Three',
        owner: {
          id: 1,
          name: 'John Doe'
        },
        last_meeting: {
          start: '2023-08-21 08:18:28:00',
          end: '2023-08-21 08:20:28:00'
        },
        type: {
          id: 2,
          short: 'ME',
          description: 'Meeting',
          color: '#4a5c66',
          default: false
        },
        is_favorite: false,
        short_description: null
      }
    ],
    meta: {
      current_page: 1,
      from: 1,
      last_page: 1,
      per_page: 10,
      to: 5,
      total: 3,
      total_no_filter: 3,
      total_own: 1
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

  it('frontend permission test', async () => {
    mockAxios.request('/api/v1/rooms', { page: 1 }).respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    PermissionService.setCurrentUser(exampleUser);
    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: i18nDateMock
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    const missingNewRoomComponent = view.findComponent(NewRoomComponent);
    expect(missingNewRoomComponent.exists()).toBeFalsy();

    const newUser = _.cloneDeep(exampleUser);
    newUser.permissions.push('rooms.create');

    PermissionService.setCurrentUser(newUser);

    await view.vm.$nextTick();
    // ToDo Permission was changed but component still missing
    console.log(PermissionService.currentUser.permissions);
    await view.vm.$nextTick();
    console.log(view.html());

    const newRoomComponent = view.findComponent(NewRoomComponent);
    expect(newRoomComponent.exists()).toBeTruthy();

    view.destroy();
  });

  it('frontend room limit test', async () => {
    mockAxios.request('/api/v1/rooms', { filter_own: 1, filter_shared: 1, filter_public: 0, filter_all: 0, only_favorites: 0, sort_by: 'last_started', page: 1 }).respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    mockAxios.request('/api/v1/roomTypes', { filter: 'own' }).respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const newUser = _.cloneDeep(exampleUser);
    newUser.permissions.push('rooms.create');
    newUser.room_limit = 1;

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: i18nDateMock
      },
      pinia: createTestingPinia({
        initialState: {
          auth: {
            currentUser: newUser
          }
        }
      }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    let disabledNewRoomComponent = view.findComponent(NewRoomComponent);
    expect(disabledNewRoomComponent.exists()).toBeTruthy();
    expect(disabledNewRoomComponent.findComponent(BButton).element.disabled).toBeTruthy();

    const searchField = view.findComponent({ ref: 'search' });
    expect(searchField.exists()).toBeTruthy();

    // Enter search query
    await searchField.setValue('test');

    const ownRequest = mockAxios.request('/api/v1/rooms', { filter_own: 1, filter_shared: 1, filter_public: 0, filter_all: 0, only_favorites: 0, sort_by: 'last_started', page: 1 });

    searchField.trigger('change');

    await ownRequest.wait();
    // Check if requests use the search string
    expect(ownRequest.config.params.search).toBe('test');

    await ownRequest.respondWith({
      status: 200,
      data: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 10,
          to: null,
          total: 0,
          total_no_filter: 1,
          total_own: 1
        }
      }
    });

    disabledNewRoomComponent = view.findComponent(NewRoomComponent);
    expect(disabledNewRoomComponent.exists()).toBeTruthy();
    expect(disabledNewRoomComponent.findComponent(BButton).element.disabled).toBeTruthy();

    view.destroy();
  });

  it('submit valid', async () => {
    const router = new VueRouter();
    const spy = vi.spyOn(router, 'push').mockImplementation(() => {});

    mockAxios.request('/api/v1/roomTypes', { filter: 'own' }).respondWith({
      status: 200,
      data: exampleRoomTypeResponse
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
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    const typeInput = view.findComponent(BFormSelect);
    const meetingOption = typeInput.findAll('option').at(2);
    expect(meetingOption.text()).toEqual('Meeting');
    meetingOption.element.selected = true;
    await typeInput.trigger('change');
    const nameInput = view.findComponent(BFormInput);
    await nameInput.setValue('Test');

    const request = mockAxios.request('/api/v1/rooms');

    view.vm.handleSubmit();
    await request.wait();

    expect(JSON.parse(request.config.data)).toMatchObject({ room_type: 2, name: 'Test' });
    await request.respondWith({
      status: 201,
      data: { data: { id: 'zej-p5h-2wf', name: 'Test', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66' } } }
    });

    await view.vm.$nextTick();
    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith({ name: 'rooms.view', params: { id: 'zej-p5h-2wf' } });
    view.destroy();
  });

  it('submit forbidden', async () => {
    const toastErrorSpy = vi.fn();

    mockAxios.request('/api/v1/roomTypes', { filter: 'own' }).respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(NewRoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        toastError: toastErrorSpy
      },
      propsData: {
        modalStatic: true
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    const typeInput = view.findComponent(BFormSelect);
    const meetingOption = typeInput.findAll('option').at(2);
    expect(meetingOption.text()).toEqual('Meeting');
    meetingOption.element.selected = true;
    await typeInput.trigger('change');
    const nameInput = view.findComponent(BFormInput);
    await nameInput.setValue('Test');

    const request = mockAxios.request('/api/v1/rooms');

    view.vm.handleSubmit();

    await request.wait();

    expect(JSON.parse(request.config.data)).toMatchObject({ room_type: 2, name: 'Test' });
    await request.respondWith({
      status: 403
    });

    expect(toastErrorSpy).toBeCalledTimes(1);
    expect(toastErrorSpy).toBeCalledWith('rooms.flash.no_new_room');

    view.destroy();
  });

  it('submit reached room limit', async () => {
    const baseError = vi.spyOn(Base, 'error').mockImplementation(() => {});

    mockAxios.request('/api/v1/roomTypes', { filter: 'own' }).respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(NewRoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        modalStatic: true
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await mockAxios.wait();

    await view.vm.$nextTick();

    const typeInput = view.findComponent(BFormSelect);
    const meetingOption = typeInput.findAll('option').at(2);
    expect(meetingOption.text()).toEqual('Meeting');
    meetingOption.element.selected = true;
    await typeInput.trigger('change');
    const nameInput = view.findComponent(BFormInput);
    await nameInput.setValue('Test');

    const request = mockAxios.request('/api/v1/rooms');

    view.vm.handleSubmit();

    await request.wait();

    expect(JSON.parse(request.config.data)).toMatchObject({ room_type: 2, name: 'Test' });
    await request.respondWith({
      status: 463,
      data: { message: 'test' }
    });

    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.data.message).toBe('test');
    expect(view.emitted().limitReached).toBeTruthy();
    view.destroy();
  });

  it('submit without name', async () => {
    mockAxios.request('/api/v1/roomTypes', { filter: 'own' }).respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(NewRoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        modalStatic: true
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await mockAxios.wait();

    await view.vm.$nextTick();
    const typeInput = view.findComponent(BFormSelect);
    const meetingOption = typeInput.findAll('option').at(2);
    expect(meetingOption.text()).toEqual('Meeting');
    meetingOption.element.selected = true;
    await typeInput.trigger('change');
    const nameInput = view.findComponent(BFormInput);

    const request = mockAxios.request('/api/v1/rooms');

    view.vm.handleSubmit();

    await request.wait();

    await request.respondWith({
      status: 422,
      data: { message: 'The given data was invalid.', errors: { name: ['The Name field is required.'] } }
    });

    await view.vm.$nextTick();
    expect(nameInput.classes()).toContain('is-invalid');
    view.destroy();
  });

  it('submit invalid room type', async () => {
    mockAxios.request('/api/v1/roomTypes', { filter: 'own' }).respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(NewRoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        modalStatic: true
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    mockAxios.request('/api/v1/roomTypes', { filter: 'own' }).respondWith({
      status: 200,
      data: {
        data: [{ id: 3, short: 'ME', description: 'Meeting', color: '#4a5c66' }]
      }
    });

    const typeInput = view.findComponent(BFormSelect);
    const meetingOption = typeInput.findAll('option').at(2);
    expect(meetingOption.text()).toEqual('Meeting');
    meetingOption.element.selected = true;
    await typeInput.trigger('change');

    const request = mockAxios.request('/api/v1/rooms');

    view.vm.handleSubmit();
    await request.wait();
    await request.respondWith({
      status: 422,
      data: { message: 'The given data was invalid.', errors: { room_type: ['error'] } }
    });
    await view.vm.$nextTick();
    expect(typeInput.classes()).toContain('is-invalid');

    expect(view.vm.$data.room.room_type).toBeNull();

    view.destroy();
  });

  it('cancel or close', async () => {
    const roomTypes = [{ id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66' }];

    mockAxios.request('/api/v1/roomTypes', { filter: 'own' }).respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(NewRoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        roomTypes,
        modalStatic: true
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    const typeInput = view.findComponent(BFormSelect);
    const meetingOption = typeInput.findAll('option').at(2);
    expect(meetingOption.text()).toEqual('Meeting');
    meetingOption.element.selected = true;
    await typeInput.trigger('change');

    await view.findComponent(BFormInput).setValue('Test');
    expect(view.vm.$data.room).toMatchObject({ room_type: { color: '#4a5c66', description: 'Meeting', id: 2, short: 'ME' }, name: 'Test' });
    view.vm.handleCancel();
    view.destroy();
    expect(view.vm.$data.room).toMatchObject({});
  });
});
