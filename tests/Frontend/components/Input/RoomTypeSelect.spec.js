import { mount } from '@vue/test-utils';
import { BButton, BFormSelect } from 'bootstrap-vue';
import VueRouter from 'vue-router';
import Base from '../../../../resources/js/api/base';
import RoomTypeSelect from '../../../../resources/js/components/Inputs/RoomTypeSelect.vue';
import { mockAxios, createContainer, createLocalVue } from '../../helper';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

const localVue = createLocalVue();
localVue.use(VueRouter);
localVue.use(PiniaVuePlugin);

describe('RoomType Select', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  const exampleRoomTypeResponse = {
    data: [
      { id: 1, short: 'VL', description: 'Vorlesung', color: '#80BA27' },
      { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66' },
      { id: 3, short: 'PR', description: 'Pr\u00fcfung', color: '#9C132E' },
      { id: 4, short: '\u00dcB', description: '\u00dcbung', color: '#00B8E4' }
    ]
  };

  it('value passed', async () => {
    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomTypeSelect, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        value: { id: 1, short: 'VL', description: 'Vorlesung', color: '#80BA27' }
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    expect(view.vm.$data.roomType).toEqual(1);

    view.destroy();
  });

  it('disabled param', async () => {
    const request = mockAxios.request('/api/v1/roomTypes');
    request.respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomTypeSelect, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        value: { id: 1, short: 'VL', description: 'Vorlesung', color: '#80BA27' }
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    expect(request.config.params.filter).toEqual('own');

    await view.vm.$nextTick();

    expect(view.findComponent(BButton).attributes('disabled')).toBeFalsy();
    expect(view.findComponent(BFormSelect).attributes('disabled')).toBeFalsy();

    await view.setProps({ disabled: true });

    expect(view.findComponent(BButton).attributes('disabled')).toBeTruthy();
    expect(view.findComponent(BFormSelect).attributes('disabled')).toBeTruthy();

    view.destroy();
  });

  it('invalid value passed', async () => {
    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomTypeSelect, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        value: { id: 10, short: 'VL', description: 'Test', color: '#80BA27' }
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();
    expect(view.vm.$data.roomType).toBeNull();

    view.destroy();
  });

  it('busy events emitted', async () => {
    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomTypeSelect, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        value: { id: 1, short: 'VL', description: 'Vorlesung', color: '#80BA27' }
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.emitted().busy[0]).toEqual([true]);
    expect(view.emitted().busy[1]).toEqual([false]);

    const typeInput = view.findComponent(BFormSelect);
    const meetingOption = typeInput.findAll('option').at(2);
    expect(meetingOption.text()).toEqual('Meeting');
    meetingOption.element.selected = true;
    await typeInput.trigger('change');

    expect(view.vm.$data.roomType).toEqual(2);

    await view.vm.$nextTick();
    expect(view.emitted().input[0]).toEqual([{ id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66' }]);

    view.destroy();
  });

  it('error events emitted', async () => {
    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const view = mount(RoomTypeSelect, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        value: { id: 1, short: 'VL', description: 'Vorlesung', color: '#80BA27' }
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.emitted().loadingError[0]).toEqual([true]);
    expect(spy).toBeCalledTimes(1);

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: {
        data: [{ id: 3, short: 'ME', description: 'Meeting', color: '#4a5c66' }]
      }
    });

    view.vm.reloadRoomTypes();
    await mockAxios.wait();
    await view.vm.$nextTick();
    expect(view.emitted().loadingError[1]).toEqual([false]);

    view.destroy();
  });

  it('reload room types', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomTypeSelect, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    const typeInput = view.findComponent(BFormSelect);
    const meetingOption = typeInput.findAll('option').at(2);
    expect(meetingOption.text()).toEqual('Meeting');
    meetingOption.element.selected = true;
    await typeInput.trigger('change');
    expect(view.vm.$data.roomType).toEqual(2);

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    view.vm.reloadRoomTypes();

    await mockAxios.wait();
    await view.vm.$nextTick();
    expect(view.vm.$data.roomType).toEqual(2);

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: {
        data: [{ id: 3, short: 'ME', description: 'Meeting', color: '#4a5c66' }]
      }
    });

    view.vm.reloadRoomTypes();

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.vm.$data.roomType).toBeNull();

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    view.vm.reloadRoomTypes();

    await mockAxios.wait();

    expect(spy).toBeCalledTimes(1);

    view.destroy();
  });
});
