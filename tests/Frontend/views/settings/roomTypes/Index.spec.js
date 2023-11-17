import Index from '@/views/settings/roomTypes/Index.vue';
import { mount } from '@vue/test-utils';
import PermissionService from '@/services/PermissionService';

import BootstrapVue, {

  BTr,
  BTbody,
  BButton,
  BModal,
  BButtonClose,
  BFormSelect
} from 'bootstrap-vue';
import Base from '@/api/base';
import { mockAxios, createContainer, createLocalVue } from '../../../helper';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(PiniaVuePlugin);

const initialState = { settings: { settings: { pagination_page_size: 5 } } };

describe('RoomTypesIndex', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it('list of room types with pagination gets displayed', async () => {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['settings.manage'] });

    const request = mockAxios.request('/api/v1/roomTypes');

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await request.wait();
    expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');
    await request.respondWith({
      status: 200,
      data: {
        data: [{
          id: '1',
          color: '#333333',
          description: 'Meeting',
          model_name: 'RoomType'
        }]
      }
    });
    await view.vm.$nextTick();

    const html = view.findComponent(BTbody).findComponent(BTr).html();
    expect(html).toContain('Meeting');

    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('update and delete buttons only shown if user has the permission', async () => {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['settings.manage'] });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: {
        data: [{
          id: '1',
          color: '#333333',
          description: 'Meeting',
          model_name: 'RoomType'
        }]
      }
    });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      pinia: createTestingPinia({ initialState })
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    view.findComponent(BTbody).findAllComponents(BTr).wrappers.forEach((row) => {
      expect(row.findAllComponents(BButton).length).toEqual(0);
    });

    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'roomTypes.update', 'roomTypes.view', 'roomTypes.delete'] });

    await view.vm.$nextTick();

    const rows = view.findComponent(BTbody).findAllComponents(BTr);
    expect(rows.at(0).findAllComponents(BButton).length).toEqual(3);

    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('error handler gets called if an error occurs during loading of data', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      pinia: createTestingPinia({ initialState })
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(spy).toBeCalledTimes(1);

    view.destroy();
  });

  it('property gets cleared correctly if deletion gets aborted', async () => {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'roomTypes.delete'] });
    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: {
        data: [{
          id: '1',
          color: '#333333',
          description: 'Meeting',
          model_name: 'RoomType'
        }]
      }
    });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      },
      pinia: createTestingPinia({ initialState })
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.roomTypeToDelete).toBeUndefined();
    view.findComponent(BTbody).findComponent(BTr).findComponent(BButton).trigger('click');

    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    expect(view.vm.$data.roomTypeToDelete.id).toEqual('1');
    view.findComponent(BModal).findComponent(BButtonClose).trigger('click');

    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.roomTypeToDelete).toBeUndefined();

    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('room types delete', async () => {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'roomTypes.delete'] });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: {
        data: [
          {
            id: '1',
            color: '#333333',
            description: 'Meeting',
            model_name: 'RoomType'
          },
          {
            id: '2',
            color: '#333333',
            description: 'Test',
            model_name: 'RoomType'
          }
        ]
      }
    });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      },
      pinia: createTestingPinia({ initialState })
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.roomTypeToDelete).toBeUndefined();

    // check if two room types visible
    expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(2);

    // open delete modal for first room type
    view.findComponent(BTbody).findAllComponents(BTr).at(0).findComponent(BButton).trigger('click');
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    expect(view.vm.$data.roomTypeToDelete.id).toEqual('1');

    let deleteRequest = mockAxios.request('/api/v1/roomTypes/1');

    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
    await view.vm.$nextTick();

    await deleteRequest.wait();
    // delete without replacement
    expect(deleteRequest.config.method).toBe('delete');
    expect(deleteRequest.config.data).toBe('{"replacement_room_type":null}');
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    // error replacement required
    await deleteRequest.respondWith({
      status: 422,
      data: {
        message: 'The given data was invalid.',
        errors: {
          replacement_room_type: ['test']
        }
      }
    });

    await view.vm.$nextTick();
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);

    // select replacement and delete again
    await view.findComponent(BModal).findComponent(BFormSelect).setValue(2);

    deleteRequest = mockAxios.request('/api/v1/roomTypes/1');

    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
    await view.vm.$nextTick();

    await deleteRequest.wait();
    // delete data with replacement
    expect(deleteRequest.config.url).toBe('/api/v1/roomTypes/1');
    expect(deleteRequest.config.method).toBe('delete');
    expect(deleteRequest.config.data).toBe('{"replacement_room_type":2}');
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);

    const reloadRequest = mockAxios.request('/api/v1/roomTypes');

    await deleteRequest.respondWith({
      status: 204
    });

    await reloadRequest.wait();
    // reload data for roomTypes
    expect(reloadRequest.config.method).toBe('get');
    await reloadRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: '2',
            color: '#333333',
            description: 'Test',
            model_name: 'RoomType'
          }
        ]
      }
    });

    await view.vm.$nextTick();
    // entry removed, modal closes and data reset
    expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(1);
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.roomTypeToDelete).toBeUndefined();

    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('room types delete 404 handling', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'roomTypes.delete'] });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: {
        data: [
          {
            id: '1',
            color: '#333333',
            description: 'Meeting',
            model_name: 'RoomType'
          },
          {
            id: '2',
            color: '#333333',
            description: 'Test',
            model_name: 'RoomType'
          }
        ]
      }
    });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      },
      pinia: createTestingPinia({ initialState })
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.roomTypeToDelete).toBeUndefined();

    // check if two room types visible
    expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(2);

    // open delete modal for first room type
    view.findComponent(BTbody).findAllComponents(BTr).at(0).findComponent(BButton).trigger('click');
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    expect(view.vm.$data.roomTypeToDelete.id).toEqual('1');

    const deleteRequest = mockAxios.request('/api/v1/roomTypes/1');
    const reloadRequest = mockAxios.request('/api/v1/roomTypes');

    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
    await view.vm.$nextTick();

    await deleteRequest.wait();
    // delete without replacement
    await deleteRequest.respondWith({
      status: 404,
      data: {
        message: 'Test'
      }
    });
    await reloadRequest.wait();
    // reload data for roomTypes
    expect(reloadRequest.config.method).toBe('get');
    await reloadRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: '2',
            color: '#333333',
            description: 'Test',
            model_name: 'RoomType'
          }
        ]
      }
    });

    await view.vm.$nextTick();
    // entry removed, modal closes and data reset
    expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(1);
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.roomTypeToDelete).toBeUndefined();

    expect(spy).toBeCalledTimes(1);

    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('room types delete error handler called', async () => {
    const oldUser = PermissionService.currentUser;
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'roomTypes.delete'] });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: {
        data: [
          {
            id: '1',
            color: '#333333',
            description: 'Meeting',
            model_name: 'RoomType'
          }
        ]
      }
    });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      },
      pinia: createTestingPinia({ initialState })
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.roomTypeToDelete).toBeUndefined();

    // open delete modal for first room type
    view.findComponent(BTbody).findComponent(BTr).findComponent(BButton).trigger('click');
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    expect(view.vm.$data.roomTypeToDelete.id).toEqual('1');
    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');

    const deleteRequest = mockAxios.request('/api/v1/roomTypes/1');

    await view.vm.$nextTick();
    await deleteRequest.wait();
    // delete
    expect(deleteRequest.config.method).toBe('delete');
    expect(deleteRequest.config.data).toBe('{"replacement_room_type":null}');
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    // error replacement required
    await deleteRequest.respondWith({
      status: 500
    });

    await view.vm.$nextTick();

    expect(spy).toBeCalledTimes(1);

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.roomTypeToDelete).toBeUndefined();

    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('new room type button is displayed if the user has the corresponding permissions', async () => {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['settings.manage'] });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: {
        data: []
      }
    });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      pinia: createTestingPinia({ initialState })
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.findComponent(BButton).exists()).toBeFalsy();
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'roomTypes.create'] });
    await view.vm.$nextTick();

    expect(view.findComponent(BButton).html()).toContain('settings.room_types.new');
    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });
});
