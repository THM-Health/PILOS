import { mount } from '@vue/test-utils';
import { BFormInput, BFormSelect } from 'bootstrap-vue';
import NewRoomComponent from '@/components/Room/NewRoomComponent.vue';
import VueRouter from 'vue-router';
import Base from '@/api/base';
import { mockAxios, createContainer, createLocalVue } from '../../helper';
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

  const exampleRoomTypeResponse = {
    data: [
      { id: 1, description: 'Vorlesung', color: '#80BA27' },
      { id: 2, description: 'Meeting', color: '#4a5c66' },
      { id: 3, description: 'Pr\u00fcfung', color: '#9C132E' },
      { id: 4, description: '\u00dcbung', color: '#00B8E4' }
    ]
  };

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
      data: { data: { id: 'zej-p5h-2wf', name: 'Test', owner: { id: 1, name: 'John Doe' }, type: { id: 2, description: 'Meeting', color: '#4a5c66' } } }
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
    expect(view.emitted('limit-reached')).toBeTruthy();
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
        data: [{ id: 3, description: 'Meeting', color: '#4a5c66' }]
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
    const roomTypes = [{ id: 2, description: 'Meeting', color: '#4a5c66' }];

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
    expect(view.vm.$data.room).toMatchObject({ room_type: { color: '#4a5c66', description: 'Meeting', id: 2 }, name: 'Test' });
    view.vm.handleCancel();
    view.destroy();
    expect(view.vm.$data.room).toMatchObject({});
  });
});
