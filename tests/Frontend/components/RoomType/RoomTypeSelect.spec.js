import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, { BButton, BFormSelect } from 'bootstrap-vue';
import moxios from 'moxios';
import PermissionService from '../../../../resources/js/services/PermissionService';
import VueRouter from 'vue-router';
import Vuex from 'vuex';
import Base from '../../../../resources/js/api/base';
import RoomTypeSelect from '../../../../resources/js/components/RoomType/RoomTypeSelect.vue';
import { waitMoxios, overrideStub, createContainer, localVue } from '../../helper';

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: [], model_name: 'User', room_limit: -1 };

localVue.use(VueRouter);
localVue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    session: {
      namespaced: true,
      actions: {
        getCurrentUser ({ state }) { }
      },
      state: {
        currentUser: exampleUser
      },
      getters: {
        isAuthenticated: () => true,
        settings: () => (setting) => null
      },
      mutations: {
        setCurrentUser (state, currentUser) {
          PermissionService.setCurrentUser(currentUser);
          state.currentUser = currentUser;
        }
      }
    }
  },
  state: {
    loadingCounter: 0
  }
});

describe('RoomType Select', () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
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
    moxios.stubRequest('/api/v1/roomTypes?filter=own', {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(RoomTypeSelect, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        value: { id: 1, short: 'VL', description: 'Vorlesung', color: '#80BA27' }
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    expect(view.vm.$data.roomType).toEqual({ id: 1, short: 'VL', description: 'Vorlesung', color: '#80BA27' });

    view.destroy();
  });

  it('disabled param', async () => {
    moxios.stubRequest('/api/v1/roomTypes?filter=own', {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(RoomTypeSelect, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        value: { id: 1, short: 'VL', description: 'Vorlesung', color: '#80BA27' }
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();

    expect(view.findComponent(BButton).attributes('disabled')).toBeFalsy();
    expect(view.findComponent(BFormSelect).attributes('disabled')).toBeFalsy();

    await view.setProps({ disabled: true });

    expect(view.findComponent(BButton).attributes('disabled')).toBeTruthy();
    expect(view.findComponent(BFormSelect).attributes('disabled')).toBeTruthy();

    view.destroy();
  });

  it('invalid value passed', async () => {
    moxios.stubRequest('/api/v1/roomTypes?filter=own', {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(RoomTypeSelect, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        value: { id: 10, short: 'VL', description: 'Test', color: '#80BA27' }
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    expect(view.vm.$data.roomType).toBeNull();

    view.destroy();
  });

  it('busy events emitted', async () => {
    moxios.stubRequest('/api/v1/roomTypes?filter=own', {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(RoomTypeSelect, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        value: { id: 1, short: 'VL', description: 'Vorlesung', color: '#80BA27' }
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();

    expect(view.emitted().busy[0]).toEqual([true]);
    expect(view.emitted().busy[1]).toEqual([false]);

    const typeInput = view.findComponent(BFormSelect);
    const meetingOption = typeInput.findAll('option').at(2);
    expect(meetingOption.text()).toEqual('Meeting');
    meetingOption.element.selected = true;
    await typeInput.trigger('change');

    expect(view.vm.$data.roomType).toEqual({ id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66' });

    await view.vm.$nextTick();
    expect(view.emitted().input[0]).toEqual([{ id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66' }]);

    view.destroy();
  });

  it('error events emitted', async () => {
    moxios.stubRequest('/api/v1/roomTypes?filter=own', {
      status: 500,
      response: {
        message: 'Test'
      }
    });

    const spy = vi.spyOn(Base, 'error').mockImplementation( () => {} );

    const view = mount(RoomTypeSelect, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        value: { id: 1, short: 'VL', description: 'Vorlesung', color: '#80BA27' }
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();

    expect(view.emitted().loadingError[0]).toEqual([true]);
    expect(spy).toBeCalledTimes(1);

    const restoreRoomTypeResponse = overrideStub('/api/v1/roomTypes?filter=own', {
      status: 200,
      response: {
        data: [{ id: 3, short: 'ME', description: 'Meeting', color: '#4a5c66' }]
      }
    });

    view.vm.reloadRoomTypes();
    await waitMoxios();
    await view.vm.$nextTick();
    expect(view.emitted().loadingError[1]).toEqual([false]);

    restoreRoomTypeResponse();
    view.destroy();
  });

  it('reload room types', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation( () => {} );

    moxios.stubRequest('/api/v1/roomTypes?filter=own', {
      status: 200,
      response: exampleRoomTypeResponse
    });

    const view = mount(RoomTypeSelect, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();

    const typeInput = view.findComponent(BFormSelect);
    const meetingOption = typeInput.findAll('option').at(2);
    expect(meetingOption.text()).toEqual('Meeting');
    meetingOption.element.selected = true;
    await typeInput.trigger('change');
    expect(view.vm.$data.roomType).toEqual({ id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66' });
    view.vm.reloadRoomTypes();

    await waitMoxios();
    await view.vm.$nextTick();
    expect(view.vm.$data.roomType).toEqual({ id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66' });

    let restoreRoomTypeResponse = overrideStub('/api/v1/roomTypes?filter=own', {
      status: 200,
      response: {
        data: [{ id: 3, short: 'ME', description: 'Meeting', color: '#4a5c66' }]
      }
    });

    view.vm.reloadRoomTypes();

    await waitMoxios();
    await view.vm.$nextTick();

    expect(view.vm.$data.roomType).toBeNull();
    restoreRoomTypeResponse();
    restoreRoomTypeResponse = overrideStub('/api/v1/roomTypes?filter=own', {
      status: 500,
      response: {
        message: 'Test'
      }
    });

    view.vm.reloadRoomTypes();
    await waitMoxios();
    expect(spy).toBeCalledTimes(1);

    restoreRoomTypeResponse();
    view.destroy();
  });
});
