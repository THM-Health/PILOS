import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, { BButton, BFormSelect, IconsPlugin } from 'bootstrap-vue';
import moxios from 'moxios';
import PermissionService from '../../../../resources/js/services/PermissionService';
import sinon from 'sinon';
import VueRouter from 'vue-router';
import Vuex from 'vuex';
import Base from '../../../../resources/js/api/base';
import RoomTypeSelect from '../../../../resources/js/components/RoomType/RoomTypeSelect';

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: [], model_name: 'User', room_limit: -1 };

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(IconsPlugin);
localVue.use(VueRouter);
localVue.use(Vuex);

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};

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

describe('RoomType Select', function () {
  beforeEach(function () {
    moxios.install();
  });

  afterEach(function () {
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

  it('value passed', function (done) {
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

    moxios.wait(async () => {
      await view.vm.$nextTick();
      expect(view.vm.$data.roomType).toEqual({ id: 1, short: 'VL', description: 'Vorlesung', color: '#80BA27' });

      view.destroy();
      done();
    });
  });

  it('disabled param', function (done) {
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

    moxios.wait(async () => {
      await view.vm.$nextTick();

      expect(view.findComponent(BButton).attributes('disabled')).toBeFalsy();
      expect(view.findComponent(BFormSelect).attributes('disabled')).toBeFalsy();

      await view.setProps({ disabled: true });

      expect(view.findComponent(BButton).attributes('disabled')).toBeTruthy();
      expect(view.findComponent(BFormSelect).attributes('disabled')).toBeTruthy();

      view.destroy();
      done();
    });
  });

  it('invalid value passed', function (done) {
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

    moxios.wait(async () => {
      await view.vm.$nextTick();
      expect(view.vm.$data.roomType).toBeNull();

      view.destroy();
      done();
    });
  });

  it('busy events emitted', function (done) {
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

    moxios.wait(async () => {
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
      done();
    });
  });

  it('error events emitted', function (done) {
    moxios.stubRequest('/api/v1/roomTypes?filter=own', {
      status: 500,
      response: {
        message: 'Test'
      }
    });

    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

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

    moxios.wait(async () => {
      await view.vm.$nextTick();

      expect(view.emitted().loadingError[0]).toEqual([true]);
      sinon.assert.calledOnce(Base.error);
      Base.error.restore();

      const restoreRoomTypeResponse = overrideStub('/api/v1/roomTypes?filter=own', {
        status: 200,
        response: {
          data: [{ id: 3, short: 'ME', description: 'Meeting', color: '#4a5c66' }]
        }
      });

      view.vm.reloadRoomTypes();
      moxios.wait(async () => {
        await view.vm.$nextTick();
        expect(view.emitted().loadingError[1]).toEqual([false]);

        restoreRoomTypeResponse();
        view.destroy();
        done();
      });
    });
  });

  it('reload room types', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

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

    moxios.wait(async () => {
      await view.vm.$nextTick();

      const typeInput = view.findComponent(BFormSelect);
      const meetingOption = typeInput.findAll('option').at(2);
      expect(meetingOption.text()).toEqual('Meeting');
      meetingOption.element.selected = true;
      await typeInput.trigger('change');
      expect(view.vm.$data.roomType).toEqual({ id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66' });
      view.vm.reloadRoomTypes();

      moxios.wait(async () => {
        await view.vm.$nextTick();
        expect(view.vm.$data.roomType).toEqual({ id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66' });

        let restoreRoomTypeResponse = overrideStub('/api/v1/roomTypes?filter=own', {
          status: 200,
          response: {
            data: [{ id: 3, short: 'ME', description: 'Meeting', color: '#4a5c66' }]
          }
        });

        view.vm.reloadRoomTypes();

        moxios.wait(async () => {
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
          moxios.wait(function () {
            sinon.assert.calledOnce(Base.error);
            Base.error.restore();
            restoreRoomTypeResponse();
            view.destroy();
            done();
          });
        });
      });
    });
  });
});
