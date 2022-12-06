import { mount } from '@vue/test-utils';
import { createContainer, localVue } from '../../helper';
import RoomStatusComponent from '../../../../resources/js/components/Room/RoomStatusComponent.vue';
import BootstrapVue from 'bootstrap-vue';

describe('RoomStatus', () => {
  it('empty status', async () => {
    const view = mount(RoomStatusComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer()
    });

    const status = view.find('div');
    expect(status.attributes('title')).toBe('rooms.status.not_running');
    expect(status.classes()).toEqual(['room-status']);
  });
  it('offline status', async () => {
    const view = mount(RoomStatusComponent, {
      localVue,
      propsData: {
        running: false
      },
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer()
    });

    const status = view.find('div');
    expect(status.attributes('title')).toBe('rooms.status.not_running');
    expect(status.classes()).toEqual(['room-status']);
  });
  it('online status', async () => {
    const view = mount(RoomStatusComponent, {
      localVue,
      propsData: {
        running: true
      },
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer()
    });

    const status = view.find('div');
    expect(status.attributes('title')).toBe('rooms.status.running');
    expect(status.classes()).toEqual(['room-status', 'running']);
  });
  it('status change', async () => {
    const view = mount(RoomStatusComponent, {
      localVue,
      propsData: {
        running: true
      },
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer()
    });

    const status = view.find('div');
    expect(status.attributes('title')).toBe('rooms.status.running');
    expect(status.classes()).toEqual(['room-status', 'running']);

    await view.setProps({ running: false });
    await view.vm.$nextTick();
    expect(status.attributes('title')).toBe('rooms.status.not_running');
    expect(status.classes()).toEqual(['room-status']);

    await view.setProps({ running: true });
    await view.vm.$nextTick();
    expect(status.attributes('title')).toBe('rooms.status.running');
    expect(status.classes()).toEqual(['room-status', 'running']);
  });
});
