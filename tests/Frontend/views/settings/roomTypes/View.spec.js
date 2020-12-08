import View from '../../../../../resources/js/views/settings/roomTypes/View';
import { createLocalVue, mount } from '@vue/test-utils';
import PermissionService from '../../../../../resources/js/services/PermissionService';
import moxios from 'moxios';
import BootstrapVue, {
  IconsPlugin,
  BFormInput,
  BOverlay,
  BButton
} from 'bootstrap-vue';
import VSwatches from 'vue-swatches';
import Vuex from 'vuex';
import sinon from 'sinon';
import Base from '../../../../../resources/js/api/base';
import VueRouter from 'vue-router';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(IconsPlugin);
localVue.use(Vuex);
localVue.use(VueRouter);

const store = new Vuex.Store({
  modules: {
    session: {
      namespaced: true,
      getters: {
        settings: () => (setting) => setting === 'room_limit' ? -1 : null
      }
    }
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

let oldUser;

describe('RoomTypeView', function () {
  beforeEach(function () {
    oldUser = PermissionService.currentUser;
    PermissionService.setCurrentUser({ permissions: ['roomTypes.view', 'roomTypes.create', 'roomTypes.update', 'settings.manage'] });
    moxios.install();

    const roomTypeResponse = {
      data: {
        id: 1,
        short: 'ME',
        color: '#333333',
        description: 'Meeting',
        model_name: 'RoomType',
        updated_at: '2020-09-08 15:13:26'
      }
    };

    moxios.stubRequest('/api/v1/roomTypes/1', {
      status: 200,
      response: roomTypeResponse
    });
  });

  afterEach(function () {
    PermissionService.setCurrentUser(oldUser);
    moxios.uninstall();
  });

  it('room type description in title gets shown for detail view', function (done) {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key === 'settings.roomTypes.view' ? `${key} ${values.name}` : key
      },
      propsData: {
        id: 1,
        viewOnly: true
      }
    });

    moxios.wait(function () {
      expect(view.html()).toContain('settings.roomTypes.view Meeting');
      done();
    });
  });

  it('room type description in title gets translated for update view', function (done) {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key === 'settings.roomTypes.edit' ? `${key} ${values.name}` : key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      store
    });

    moxios.wait(function () {
      expect(view.html()).toContain('settings.roomTypes.edit Meeting');
      done();
    });
  });

  it('input fields are disabled if the role is displayed in view mode', function (done) {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key
      },
      propsData: {
        viewOnly: true,
        id: '1'
      },
      store
    });

    moxios.wait(function () {
      expect(view.findAllComponents(BFormInput).wrappers.every(input => input.attributes('disabled'))).toBe(true);
      expect(view.findAllComponents(VSwatches).wrappers.every(input => input.vm.disabled)).toBe(true);
      done();
    });
  });

  it('error handler gets called if an error occurs during load of data and reload button reloads data', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const restoreRoomTypeResponse = overrideStub('/api/v1/roomTypes/1', {
      status: 500,
      response: {
        message: 'Test'
      }
    });

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      store
    });

    moxios.wait(function () {
      sinon.assert.calledOnce(Base.error);
      expect(view.vm.isBusy).toBe(false);
      expect(view.findComponent(BOverlay).props('show')).toBe(true);
      Base.error.restore();
      restoreRoomTypeResponse();

      const reloadButton = view.findComponent({ ref: 'reloadRoomType' });
      expect(reloadButton.exists()).toBeTruthy();
      reloadButton.trigger('click');

      moxios.wait(function () {
        expect(view.vm.isBusy).toBe(false);
        expect(view.findComponent(BOverlay).props('show')).toBe(false);

        expect(view.vm.$data.model.id).toBe(1);
        expect(view.vm.$data.model.description).toEqual('Meeting');

        done();
      });
    });
  });

  it('back button causes a back navigation without persistence', function (done) {
    const spy = sinon.spy();

    const router = new VueRouter();
    router.push = spy;

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      store,
      router
    });

    const requestCount = moxios.requests.count();

    view.findAllComponents(BButton).filter(button => button.text() === 'app.back').at(0).trigger('click').then(() => {
      expect(moxios.requests.count()).toBe(requestCount);
      sinon.assert.calledOnce(spy);
      done();
    });
  });
});
