import View from '@/views/settings/roomTypes/View.vue';
import { mount } from '@vue/test-utils';
import PermissionService from '@/services/PermissionService';

import BootstrapVue, {

  BFormInput,
  BOverlay,
  BButton, BForm, BFormInvalidFeedback, BModal
} from 'bootstrap-vue';
import Base from '@/api/base';
import ColorSelect from '@/components/Inputs/ColorSelect.vue';
import VueRouter from 'vue-router';
import env from '@/env';
import _ from 'lodash';
import { Multiselect } from 'vue-multiselect';
import { mockAxios, createLocalVue } from '../../../helper';
const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(VueRouter);

let oldUser;

describe('RoomTypeView', () => {
  beforeEach(() => {
    oldUser = PermissionService.currentUser;
    PermissionService.setCurrentUser({ permissions: ['roomTypes.view', 'roomTypes.create', 'roomTypes.update', 'settings.manage'] });
    mockAxios.reset();

    const roomTypeResponse = {
      data: {
        id: 1,
        color: '#333333',
        description: 'Meeting',
        model_name: 'RoomType',
        updated_at: '2020-09-08T15:13:26.000000Z',
        roles: []
      }
    };

    mockAxios.request('/api/v1/roomTypes/1').respondWith({
      status: 200,
      data: roomTypeResponse
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

    mockAxios.request('/api/v1/serverPools', { page: 1 }).respondWith({
      status: 200,
      data: serverPoolsResponse
    });

    mockAxios.request('/api/v1/roles', { page: 1 }).respondWith({
      status: 200,
      data: {
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
  });

  it('room type description in title gets shown for detail view', async () => {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key === 'settings.room_types.view' ? `${key} ${values.name}` : key
      },
      propsData: {
        id: 1,
        viewOnly: true
      }
    });

    await mockAxios.wait();
    expect(view.html()).toContain('settings.room_types.view Meeting');
    view.destroy();
  });

  it('room type description in title gets translated for update view', async () => {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key === 'settings.room_types.edit' ? `${key} ${values.name}` : key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      }
    });

    await mockAxios.wait();
    expect(view.html()).toContain('settings.room_types.edit Meeting');
    view.destroy();
  });

  it('server pools get loaded, pagination and error handling', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key === 'settings.room_types.edit' ? `${key} ${values.name}` : key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      }
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    const multiSelect = view.findComponent(Multiselect);
    const saveButton = view.findAllComponents(BButton).at(3);
    expect(saveButton.html()).toContain('app.save');

    // check drop down values
    expect(multiSelect.html()).toContain('Pool1');
    expect(multiSelect.html()).toContain('Pool2');

    // check pagination
    const paginationButtons = multiSelect.findAllComponents(BButton);
    expect(paginationButtons.at(0).attributes('disabled')).toBe('disabled');
    expect(paginationButtons.at(1).attributes('disabled')).toBeUndefined();

    let serverPoolRequest = mockAxios.request('/api/v1/serverPools', { page: 2 });

    // test navigate to next page
    await paginationButtons.at(1).trigger('click');
    // dropdown show loading spinner during load and save disabled
    expect(multiSelect.props('loading')).toBeTruthy();
    await serverPoolRequest.wait();
    await serverPoolRequest.respondWith({
      status: 200,
      data: {
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
    mockAxios.request('/api/v1/serverPools', { page: 2 }).respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });
    await paginationButtons.at(0).trigger('click');
    await mockAxios.wait();
    await view.vm.$nextTick();

    // hide loading spinner, disable dropdown and prevent saving
    expect(multiSelect.props('loading')).toBeFalsy();
    expect(multiSelect.props('disabled')).toBeTruthy();
    expect(saveButton.attributes('disabled')).toBe('disabled');

    expect(spy).toBeCalledTimes(1);

    const reloadButton = view.findAllComponents(BButton).at(2);
    expect(reloadButton.html()).toContain('fa-solid fa-sync');

    serverPoolRequest = mockAxios.request('/api/v1/serverPools', { page: 2 });

    await reloadButton.trigger('click');

    // load server pools
    await serverPoolRequest.wait();
    expect(saveButton.attributes('disabled')).toBe('disabled');
    await serverPoolRequest.respondWith({
      status: 200,
      data: {
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
      }
    });

    await mockAxios.wait();
    expect(view.findAllComponents(BFormInput).wrappers.every(input => input.attributes('disabled'))).toBe(true);
    expect(view.findAllComponents(ColorSelect).wrappers.every(input => input.vm.disabled)).toBe(true);
    expect(view.findComponent(Multiselect).props('disabled')).toBeTruthy();
    view.destroy();
  });

  it('error handler gets called if an error occurs during load of data and reload button reloads data', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    mockAxios.reset();
    mockAxios.request('/api/v1/roles', { page: 1 }).respondWith({
      status: 200,
      data: {
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
    mockAxios.request('/api/v1/serverPools', { page: 1 }).respondWith({
      status: 200,
      data: {
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
      }
    });
    mockAxios.request('/api/v1/roomTypes/1').respondWith({
      status: 500,
      data: {
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
      }
    });

    await mockAxios.wait();
    expect(spy).toBeCalledTimes(1);
    expect(view.vm.isBusy).toBe(false);
    expect(view.findComponent(BOverlay).props('show')).toBe(true);

    const reloadButton = view.findComponent({ ref: 'reloadRoomType' });

    expect(reloadButton.exists()).toBeTruthy();

    const request = mockAxios.request('/api/v1/roomTypes/1');

    reloadButton.trigger('click');

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: {
          id: 1,
          color: '#333333',
          description: 'Meeting',
          model_name: 'RoomType',
          updated_at: '2020-09-08T15:13:26.000000Z',
          roles: []
        }
      }
    });

    expect(view.vm.isBusy).toBe(false);
    expect(view.findComponent(BOverlay).props('show')).toBe(false);

    expect(view.vm.$data.model.id).toBe(1);
    expect(view.vm.$data.model.description).toEqual('Meeting');
    view.destroy();
  });

  it('error handler gets called and redirected if a 404 error occurs during load of data', async () => {
    const routerSpy = vi.fn();
    const router = new VueRouter();
    router.push = routerSpy;

    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    mockAxios.reset();
    mockAxios.request('/api/v1/roles', { page: 1 }).respondWith({
      status: 200,
      data: {
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
    mockAxios.request('/api/v1/serverPools', { page: 1 }).respondWith({
      status: 200,
      data: {
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
      }
    });
    mockAxios.request('/api/v1/roomTypes/1').respondWith({
      status: 404,
      data: {
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
      router
    });

    await mockAxios.wait();
    expect(spy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'settings.room_types' });

    view.destroy();
  });

  it('error handler gets called and redirected if a 404 error occurs during save of data', async () => {
    const routerSpy = vi.fn();
    const router = new VueRouter();
    router.push = routerSpy;

    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      router
    });

    await mockAxios.wait();

    const request = mockAxios.request('/api/v1/roomTypes/1');

    view.findComponent(BForm).trigger('submit');

    await request.wait();
    await request.respondWith({
      status: 404,
      data: {
        message: 'Test'
      }
    });
    expect(spy).toBeCalledTimes(1);

    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'settings.room_types' });

    view.destroy();
  });

  it('error handler gets called if an error occurs during update', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        viewOnly: false,
        id: '1'
      }
    });

    await mockAxios.wait();
    const request = mockAxios.request('/api/v1/roomTypes/1');

    view.findComponent(BForm).trigger('submit');

    await request.wait();
    await request.respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    expect(spy).toBeCalledTimes(1);

    view.destroy();
  });

  it('back button causes a back navigation without persistence', async () => {
    const spy = vi.fn();

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
      router
    });

    await mockAxios.wait();

    await view.findAllComponents(BButton).filter(button => button.text() === 'app.back').at(0).trigger('click');
    expect(spy).toBeCalledTimes(1);

    view.destroy();
  });

  it('request with updates get send during saving the room type', async () => {
    const spy = vi.fn();

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
      router
    });

    await mockAxios.wait();
    await view.vm.$nextTick();
    const inputs = view.findAllComponents(BFormInput).wrappers;

    await inputs[0].setValue('Meeting');
    await inputs[1].setValue('#333333');
    await view.findComponent(Multiselect).findAll('li').at(1).find('span').trigger('click');

    const request = mockAxios.request('/api/v1/roomTypes/1');

    view.findComponent(BForm).trigger('submit');

    await request.wait();
    const data = JSON.parse(request.config.data);

    expect(data.description).toBe('Meeting');
    expect(data.color).toBe('#333333');
    expect(data.server_pool).toBe(2);

    await request.respondWith({
      status: env.HTTP_UNPROCESSABLE_ENTITY,
      data: {
        message: 'The given data was invalid.',
        errors: {
          description: ['Test description'],
          color: ['Test color']
        }
      }
    });

    const feedback = view.findAllComponents(BFormInvalidFeedback).wrappers;
    expect(feedback[0].html()).toContain('Test description');
    expect(feedback[1].html()).toContain('Test color');

    mockAxios.request('/api/v1/roomTypes/1').respondWith({
      status: 204
    });

    view.findComponent(BForm).trigger('submit');

    await mockAxios.wait();
    expect(spy).toBeCalledTimes(1);

    view.destroy();
  });

  it('modal gets shown for stale errors and a overwrite can be forced', async () => {
    const spy = vi.fn();

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
      router
    });

    await mockAxios.wait();
    const newModel = _.cloneDeep(view.vm.model);
    newModel.updated_at = '2020-09-08T16:13:26.000000Z';

    mockAxios.request('/api/v1/roomTypes/1').respondWith({
      status: env.HTTP_STALE_MODEL,
      data: {
        error: env.HTTP_STALE_MODEL,
        message: 'test',
        new_model: newModel
      }
    });

    view.findComponent(BForm).trigger('submit');

    await mockAxios.wait();
    const staleModelModal = view.findComponent({ ref: 'stale-roomType-modal' });
    expect(staleModelModal.vm.$data.isVisible).toBe(true);

    const request = mockAxios.request('/api/v1/roomTypes/1');

    staleModelModal.vm.$refs['ok-button'].click();

    await request.wait();
    const data = JSON.parse(request.config.data);

    expect(data.updated_at).toBe(newModel.updated_at);

    await request.respondWith({
      status: 204
    });

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);

    view.destroy();
  });

  it('modal gets shown for stale errors and the new model can be applied to current form', async () => {
    const spy = vi.fn();

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
      router
    });

    await mockAxios.wait();
    const newModel = _.cloneDeep(view.vm.model);
    newModel.updated_at = '2020-09-08T16:13:26.000000Z';
    newModel.description = 'Test';

    mockAxios.request('/api/v1/roomTypes/1').respondWith({
      status: env.HTTP_STALE_MODEL,
      data: {
        error: env.HTTP_STALE_MODEL,
        message: 'test',
        new_model: newModel
      }
    });

    view.findComponent(BForm).trigger('submit');

    await mockAxios.wait();
    const staleModelModal = view.findComponent({ ref: 'stale-roomType-modal' });
    expect(staleModelModal.vm.$data.isVisible).toBe(true);
    expect(view.findAllComponents(BFormInput).at(0).element.value).toBe('Meeting');

    staleModelModal.vm.$refs['cancel-button'].click();

    await view.vm.$nextTick();
    expect(view.findAllComponents(BFormInput).at(0).element.value).toBe('Test');
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    view.destroy();
  });
});
