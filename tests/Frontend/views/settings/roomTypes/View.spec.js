import View from '../../../../../resources/js/views/settings/roomTypes/View';
import { createLocalVue, mount } from '@vue/test-utils';
import PermissionService from '../../../../../resources/js/services/PermissionService';
import moxios from 'moxios';
import BootstrapVue, {

  BFormInput,
  BOverlay,
  BButton, BForm, BFormInvalidFeedback, BModal
} from 'bootstrap-vue';
import VSwatches from 'vue-swatches';
import Vuex from 'vuex';
import Base from '../../../../../resources/js/api/base';
import VueRouter from 'vue-router';
import env from '../../../../../resources/js/env';
import _ from 'lodash';
import Multiselect from 'vue-multiselect';
import { waitMoxios, overrideStub } from '../../../helper';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
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

let oldUser;

describe('RoomTypeView', () => {
  beforeEach(() => {
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
        updated_at: '2020-09-08T15:13:26.000000Z',
        roles: []
      }
    };

    moxios.stubRequest('/api/v1/roomTypes/1', {
      status: 200,
      response: roomTypeResponse
    });

    const serverPoolsResponse = {
      data: [
        { id: 1, name: 'Pool1', description: 'test1' },
        { id: 2, name: 'Pool2', description: 'test2' }
      ],
      meta: {
        current_page: 1,
        from: 1,
        last_page: 2,
        per_page: 2,
        to: 2,
        total: 4
      }
    };

    moxios.stubRequest('/api/v1/serverPools?page=1', {
      status: 200,
      response: serverPoolsResponse
    });

    moxios.stubRequest('/api/v1/roles?page=1', {
      status: 200,
      response: {
        data: Array.from(Array(5).keys()).map(item => {
          return {
            id: item + 1,
            name: 'Test ' + (item + 1),
            default: true,
            updated_at: '2020-01-01T01:00:00.000000Z',
            model_name: 'Role',
            room_limit: null
          };
        }),
        meta: {
          per_page: 5,
          current_page: 1,
          total: 10,
          last_page: 2
        }
      }
    });
  });

  afterEach(() => {
    PermissionService.setCurrentUser(oldUser);
    moxios.uninstall();
  });

  it('room type description in title gets shown for detail view', async () => {
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

    await waitMoxios();
    expect(view.html()).toContain('settings.roomTypes.view Meeting');
    view.destroy();
  });

  it('room type description in title gets translated for update view', async () => {
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

    await waitMoxios();
    expect(view.html()).toContain('settings.roomTypes.edit Meeting');
    view.destroy();
  });

  it('server pools get loaded, pagination and error handling', async () => {
    const spy = jest.spyOn(Base, 'error').mockImplementation();

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

    const multiSelect = view.findComponent(Multiselect);
    const saveButton = view.findAllComponents(BButton).at(3);
    expect(saveButton.html()).toContain('app.save');

    // load server pools
    await waitMoxios();
    let request = moxios.requests.mostRecent();
    expect(request.url).toBe('/api/v1/serverPools?page=1');
    await view.vm.$nextTick();

    // check drop down values
    expect(multiSelect.html()).toContain('Pool1');
    expect(multiSelect.html()).toContain('Pool2');

    // check pagination
    const paginationButtons = multiSelect.findAllComponents(BButton);
    expect(paginationButtons.at(0).attributes('disabled')).toBe('disabled');
    expect(paginationButtons.at(1).attributes('disabled')).toBeUndefined();

    // test navigate to next page
    await paginationButtons.at(1).trigger('click');
    // dropdown show loading spinner during load and save disabled
    expect(multiSelect.props('loading')).toBeTruthy();
    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.url).toBe('/api/v1/serverPools?page=2');
    await request.respondWith({
      status: 200,
      response: {
        data: [
          { id: 3, name: 'Pool3', description: 'test3' },
          { id: 4, name: 'Pool4', description: 'test4' }
        ],
        meta: {
          current_page: 2,
          from: 3,
          last_page: 2,
          per_page: 2,
          to: 4,
          total: 4
        }
      }
    });
    await view.vm.$nextTick();

    // hide loading spinner and active save button
    expect(multiSelect.props('loading')).toBeFalsy();
    expect(saveButton.attributes('disabled')).toBeUndefined();

    expect(paginationButtons.at(0).attributes('disabled')).toBeUndefined();
    expect(paginationButtons.at(1).attributes('disabled')).toBe('disabled');

    // test error during load
    const restoreServerPoolResponse = overrideStub('/api/v1/serverPools?page=1', {
      status: 500,
      response: {
        message: 'Test'
      }
    });
    await paginationButtons.at(0).trigger('click');
    await waitMoxios();
    await view.vm.$nextTick();

    // hide loading spinner, disable dropdown and prevent saving
    expect(multiSelect.props('loading')).toBeFalsy();
    expect(multiSelect.props('disabled')).toBeTruthy();
    expect(saveButton.attributes('disabled')).toBe('disabled');

    expect(spy).toBeCalledTimes(1);

    restoreServerPoolResponse();

    const reloadButton = view.findAllComponents(BButton).at(2);
    expect(reloadButton.html()).toContain('fa-solid fa-sync');

    await reloadButton.trigger('click');

    // load server pools
    await waitMoxios();
    expect(saveButton.attributes('disabled')).toBe('disabled');
    request = moxios.requests.mostRecent();
    expect(request.url).toBe('/api/v1/serverPools?page=2');
    await request.respondWith({
      status: 200,
      response: {
        data: [
          { id: 3, name: 'Pool3', description: 'test3' },
          { id: 4, name: 'Pool4', description: 'test4' }
        ],
        meta: {
          current_page: 2,
          from: 3,
          last_page: 2,
          per_page: 2,
          to: 4,
          total: 4
        }
      }
    });
    await view.vm.$nextTick();

    // hide loading spinner, enable dropdown and enable saving
    expect(multiSelect.props('loading')).toBeFalsy();
    expect(multiSelect.props('disabled')).toBeFalsy();
    expect(saveButton.attributes('disabled')).toBeUndefined();
    view.destroy();
  });

  it('input fields are disabled if the room type is displayed in view mode', async () => {
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

    await waitMoxios();
    expect(view.findAllComponents(BFormInput).wrappers.every(input => input.attributes('disabled'))).toBe(true);
    expect(view.findAllComponents(VSwatches).wrappers.every(input => input.vm.disabled)).toBe(true);
    expect(view.findComponent(Multiselect).props('disabled')).toBeTruthy();
    view.destroy();
  });

  it('error handler gets called if an error occurs during load of data and reload button reloads data', async () => {
    const spy = jest.spyOn(Base, 'error').mockImplementation();

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

    await waitMoxios();
    expect(spy).toBeCalledTimes(1);
    expect(view.vm.isBusy).toBe(false);
    expect(view.findComponent(BOverlay).props('show')).toBe(true);

    restoreRoomTypeResponse();

    const reloadButton = view.findComponent({ ref: 'reloadRoomType' });
    expect(reloadButton.exists()).toBeTruthy();
    reloadButton.trigger('click');

    await waitMoxios();
    expect(view.vm.isBusy).toBe(false);
    expect(view.findComponent(BOverlay).props('show')).toBe(false);

    expect(view.vm.$data.model.id).toBe(1);
    expect(view.vm.$data.model.description).toEqual('Meeting');
    view.destroy();
  });

  it('error handler gets called and redirected if a 404 error occurs during load of data', async () => {
    const routerSpy = jest.fn();
    const router = new VueRouter();
    router.push = routerSpy;

    const spy = jest.spyOn(Base, 'error').mockImplementation();

    const restoreRoomTypeResponse = overrideStub('/api/v1/roomTypes/1', {
      status: 404,
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
      store,
      router
    });

    await waitMoxios();
    expect(spy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'settings.room_types' });

    restoreRoomTypeResponse();
    view.destroy();
  });

  it('error handler gets called and redirected if a 404 error occurs during save of data', async () => {
    const routerSpy = jest.fn();
    const router = new VueRouter();
    router.push = routerSpy;

    const spy = jest.spyOn(Base, 'error').mockImplementation();

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      store,
      router
    });

    await waitMoxios();
    const restoreRoomTypeResponse = overrideStub('/api/v1/roomTypes/1', {
      status: 404,
      response: {
        message: 'Test'
      }
    });

    view.findComponent(BForm).trigger('submit');

    await waitMoxios();
    expect(spy).toBeCalledTimes(1);

    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'settings.room_types' });
    restoreRoomTypeResponse();
    view.destroy();
  });

  it('error handler gets called if an error occurs during update', async () => {
    const spy = jest.spyOn(Base, 'error').mockImplementation();

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

    await waitMoxios();
    const restoreRoomTypeResponse = overrideStub('/api/v1/roomTypes/1', {
      status: 500,
      response: {
        message: 'Test'
      }
    });

    view.findComponent(BForm).trigger('submit');

    await waitMoxios();
    expect(spy).toBeCalledTimes(1);
    restoreRoomTypeResponse();
    view.destroy();
  });

  it('back button causes a back navigation without persistence', async () => {
    const spy = jest.fn();

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

    await waitMoxios();
    const requestCount = moxios.requests.count();

    await view.findAllComponents(BButton).filter(button => button.text() === 'app.back').at(0).trigger('click');
    expect(moxios.requests.count()).toBe(requestCount);
    expect(spy).toBeCalledTimes(1);
    view.destroy();
  });

  it('request with updates get send during saving the room type', async () => {
    const spy = jest.fn();

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

    await waitMoxios();
    await view.vm.$nextTick();
    const inputs = view.findAllComponents(BFormInput).wrappers;

    await inputs[0].setValue('Meeting');
    await inputs[1].setValue('ME');
    await inputs[2].setValue('#333333');
    await view.findComponent(Multiselect).findAll('li').at(1).find('span').trigger('click');

    view.findComponent(BForm).trigger('submit');

    let restoreRoomTypeResponse = overrideStub('/api/v1/roomTypes/1', {
      status: env.HTTP_UNPROCESSABLE_ENTITY,
      response: {
        message: 'The given data was invalid.',
        errors: {
          description: ['Test description'],
          short: ['Test short'],
          color: ['Test color']
        }
      }
    });

    await waitMoxios();
    const request = moxios.requests.mostRecent();
    const data = JSON.parse(request.config.data);

    expect(data.description).toBe('Meeting');
    expect(data.short).toBe('ME');
    expect(data.color).toBe('#333333');
    expect(data.server_pool).toBe(2);

    const feedback = view.findAllComponents(BFormInvalidFeedback).wrappers;
    expect(feedback[0].html()).toContain('Test description');
    expect(feedback[1].html()).toContain('Test short');
    expect(feedback[2].html()).toContain('Test color');

    restoreRoomTypeResponse();
    restoreRoomTypeResponse = overrideStub('/api/v1/roomTypes/1', {
      status: 204
    });

    view.findComponent(BForm).trigger('submit');

    await waitMoxios();
    expect(spy).toBeCalledTimes(1);
    restoreRoomTypeResponse();
    view.destroy();
  });

  it('modal gets shown for stale errors and a overwrite can be forced', async () => {
    const spy = jest.fn();

    const router = new VueRouter();
    router.push = spy;

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key
      },
      propsData: {
        viewOnly: false,
        id: '1',
        modalStatic: true
      },
      store,
      router
    });

    await waitMoxios();
    const newModel = _.cloneDeep(view.vm.model);
    newModel.updated_at = '2020-09-08T16:13:26.000000Z';

    let restoreRoomTypeResponse = overrideStub('/api/v1/roomTypes/1', {
      status: env.HTTP_STALE_MODEL,
      response: {
        error: env.HTTP_STALE_MODEL,
        message: 'test',
        new_model: newModel
      }
    });

    view.findComponent(BForm).trigger('submit');

    await waitMoxios();
    const staleModelModal = view.findComponent({ ref: 'stale-roomType-modal' });
    expect(staleModelModal.vm.$data.isVisible).toBe(true);

    restoreRoomTypeResponse();
    restoreRoomTypeResponse = overrideStub('/api/v1/roomTypes/1', {
      status: 204
    });

    staleModelModal.vm.$refs['ok-button'].click();

    await waitMoxios();
    const request = moxios.requests.mostRecent();
    const data = JSON.parse(request.config.data);

    expect(data.updated_at).toBe(newModel.updated_at);
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    restoreRoomTypeResponse();
    view.destroy();
  });

  it('modal gets shown for stale errors and the new model can be applied to current form', async () => {
    const spy = jest.fn();

    const router = new VueRouter();
    router.push = spy;

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key
      },
      propsData: {
        viewOnly: false,
        id: '1',
        modalStatic: true
      },
      store,
      router
    });

    await waitMoxios();
    const newModel = _.cloneDeep(view.vm.model);
    newModel.updated_at = '2020-09-08T16:13:26.000000Z';
    newModel.description = 'Test';

    const restoreRoomTypeResponse = overrideStub('/api/v1/roomTypes/1', {
      status: env.HTTP_STALE_MODEL,
      response: {
        error: env.HTTP_STALE_MODEL,
        message: 'test',
        new_model: newModel
      }
    });

    view.findComponent(BForm).trigger('submit');

    await waitMoxios();
    const staleModelModal = view.findComponent({ ref: 'stale-roomType-modal' });
    expect(staleModelModal.vm.$data.isVisible).toBe(true);
    expect(view.findAllComponents(BFormInput).at(0).element.value).toBe('Meeting');

    restoreRoomTypeResponse();

    staleModelModal.vm.$refs['cancel-button'].click();

    await view.vm.$nextTick();
    expect(view.findAllComponents(BFormInput).at(0).element.value).toBe('Test');
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    view.destroy();
  });
});
