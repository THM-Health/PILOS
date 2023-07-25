import Index from '../../../../../resources/js/views/settings/serverPools/Index.vue';
import { mount } from '@vue/test-utils';
import PermissionService from '../../../../../resources/js/services/PermissionService';

import BootstrapVue, {
  BTr,
  BTbody,
  BButton,
  BModal,
  BButtonClose,
  BFormInput, BAlert
} from 'bootstrap-vue';
import Base from '../../../../../resources/js/api/base';
import { mockAxios, createContainer, createLocalVue } from '../../../helper';

const localVue = createLocalVue();
localVue.use(BootstrapVue);

const defaultResponse = {
  data: [
    {
      id: 1,
      name: 'Test',
      description: 'Pool for testing',
      server_count: 2,
      model_name: 'ServerPool',
      updated_at: '2020-12-21T13:43:21.000000Z'
    },
    {
      id: 2,
      name: 'Production',
      description: 'Pool for producation',
      server_count: 1,
      model_name: 'ServerPool',
      updated_at: '2020-12-21T13:43:21.000000Z'
    }
  ],
  links: {
    first: 'http://localhost/api/v1/serverPools?page=1',
    last: 'http://localhost/api/v1/serverPools?page=1',
    prev: null,
    next: null
  },
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    path: 'http://localhost/api/v1/serverPools',
    per_page: 15,
    to: 2,
    total: 2
  }
};

let oldUser;

describe('ServerPoolsIndex', () => {
  beforeEach(() => {
    mockAxios.reset();
    oldUser = PermissionService.currentUser;
  });

  afterEach(() => {
    PermissionService.setCurrentUser(oldUser);
  });

  it('list of server pools with pagination gets displayed', async () => {
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'serverPools.viewAny'] });

    const request = mockAxios.request('api/v1/serverPools');

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });
    await request.wait();
    expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

    await request.respondWith({
      status: 200,
      data: defaultResponse
    });

    await view.vm.$nextTick();
    const html = view.findComponent(BTbody).findAllComponents(BTr).at(0).html();
    expect(html).toContain('Test');
    expect(html).toContain('2');

    view.destroy();
  });

  it('list of server pools with search', async () => {
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'serverPools.viewAny'] });

    let request = mockAxios.request('api/v1/serverPools');

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        searchDebounce: 0
      },
      attachTo: createContainer()
    });
    await view.vm.$nextTick();
    await request.wait();
    expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

    await request.respondWith({
      status: 200,
      data: defaultResponse
    });
    await view.vm.$nextTick();
    expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(2);

    const search = view.findComponent(BFormInput);
    expect(search.exists()).toBeTruthy();
    expect(search.html()).toContain('app.search');

    request = mockAxios.request('api/v1/serverPools');

    await search.setValue('Prod');

    await request.wait();
    expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

    expect(request.config.params.name).toBe('Prod');
    await request.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 2,
            name: 'Production',
            description: 'Pool for producation',
            server_count: 1,
            model_name: 'ServerPool',
            updated_at: '2020-12-21T13:43:21.000000Z'
          }
        ],
        links: {
          first: 'http://localhost/api/v1/serverPools?page=1',
          last: 'http://localhost/api/v1/serverPools?page=1',
          prev: null,
          next: null
        },
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          path: 'http://localhost/api/v1/serverPools',
          per_page: 15,
          to: 1,
          total: 1
        }
      }
    });
    await view.vm.$nextTick();
    expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(1);
    view.destroy();
  });

  it('update and delete buttons only shown if user has the permission', async () => {
    PermissionService.setCurrentUser({ permissions: ['settings.manage'] });

    mockAxios.request('api/v1/serverPools').respondWith({
      status: 200,
      data: defaultResponse
    });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    view.findComponent(BTbody).findAllComponents(BTr).wrappers.forEach((row) => {
      expect(row.findAllComponents(BButton).length).toEqual(0);
    });

    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'serverPools.update', 'serverPools.view', 'serverPools.delete'] });

    await view.vm.$nextTick();

    const rows = view.findComponent(BTbody).findAllComponents(BTr);
    expect(rows.at(0).findAllComponents(BButton).length).toEqual(3);
    expect(rows.at(1).findAllComponents(BButton).length).toEqual(3);

    view.destroy();
  });

  it('error handler gets called if an error occurs during loading of data', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    mockAxios.request('api/v1/serverPools').respondWith({
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
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(spy).toBeCalledTimes(1);

    view.destroy();
  });

  it('property gets cleared correctly if deletion gets aborted', async () => {
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'serverPools.delete'] });

    mockAxios.request('api/v1/serverPools').respondWith({
      status: 200,
      data: defaultResponse
    });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      }
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.serverPoolToDelete).toBeUndefined();
    view.findComponent(BTbody).findAllComponents(BTr).at(1).findComponent(BButton).trigger('click');

    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    expect(view.vm.$data.serverPoolToDelete.id).toEqual(2);
    view.findComponent(BModal).findComponent(BButtonClose).trigger('click');

    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.serverPoolToDelete).toBeUndefined();

    view.destroy();
  });

  it('server pool delete', async () => {
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'serverPools.delete'] });

    mockAxios.request('api/v1/serverPools').respondWith({
      status: 200,
      data: defaultResponse
    });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      }
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.serverPoolToDelete).toBeUndefined();

    // check if two server pools  visible
    expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(2);

    // open delete modal for second server pool
    view.findComponent(BTbody).findAllComponents(BTr).at(1).findComponent(BButton).trigger('click');
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    expect(view.vm.$data.serverPoolToDelete.id).toEqual(2);

    const deleteRequest = mockAxios.request('api/v1/serverPools/2');

    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
    await view.vm.$nextTick();

    // delete without room types attached
    await deleteRequest.wait();
    expect(deleteRequest.config.method).toBe('delete');
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);

    const request = mockAxios.request('api/v1/serverPools');

    await deleteRequest.respondWith({
      status: 204
    });

    // reload data for server pools
    await request.wait();
    expect(request.config.method).toBe('get');
    await request.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 1,
            name: 'Test',
            description: 'Pool for testing',
            server_count: 2,
            model_name: 'ServerPool',
            updated_at: '2020-12-21T13:43:21.000000Z'
          }
        ],
        links: {
          first: 'http://localhost/api/v1/serverPools?page=1',
          last: 'http://localhost/api/v1/serverPools?page=1',
          prev: null,
          next: null
        },
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          path: 'http://localhost/api/v1/serverPools',
          per_page: 15,
          to: 1,
          total: 1
        }
      }
    });

    await view.vm.$nextTick();
    // entry removed, modal closes and data reset
    expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(1);
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.serverPoolToDelete).toBeUndefined();

    view.destroy();
  });

  it('server pool delete 404 handling', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'serverPools.delete'] });

    mockAxios.request('api/v1/serverPools').respondWith({
      status: 200,
      data: defaultResponse
    });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      }
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.serverPoolToDelete).toBeUndefined();

    // check if two server pools visible
    expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(2);

    // open delete modal for second server pool
    view.findComponent(BTbody).findAllComponents(BTr).at(1).findComponent(BButton).trigger('click');
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    expect(view.vm.$data.serverPoolToDelete.id).toEqual(2);

    const deleteRequest = mockAxios.request('api/v1/serverPools/2');

    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
    await view.vm.$nextTick();

    // delete non existing server pool
    await deleteRequest.wait();

    const request = mockAxios.request('api/v1/serverPools');

    await deleteRequest.respondWith({
      status: 404,
      data: {
        message: 'Test'
      }
    });

    // reload data for roomTypes
    await request.wait();
    expect(request.config.method).toBe('get');
    await request.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 1,
            name: 'Test',
            description: 'Pool for testing',
            server_count: 2,
            model_name: 'ServerPool',
            updated_at: '2020-12-21T13:43:21.000000Z'
          }
        ],
        links: {
          first: 'http://localhost/api/v1/serverPools?page=1',
          last: 'http://localhost/api/v1/serverPools?page=1',
          prev: null,
          next: null
        },
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          path: 'http://localhost/api/v1/serverPools',
          per_page: 15,
          to: 1,
          total: 1
        }
      }
    });

    await view.vm.$nextTick();
    // entry removed, modal closes and data reset
    expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(1);
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.serverPoolToDelete).toBeUndefined();

    expect(spy).toBeCalledTimes(1);

    view.destroy();
  });

  it('server pool delete error room types attached', async () => {
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'serverPools.delete'] });

    mockAxios.request('api/v1/serverPools').respondWith({
      status: 200,
      data: defaultResponse
    });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      }
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.serverPoolToDelete).toBeUndefined();

    // check if two server pools visible
    expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(2);

    // open delete modal for second server pool
    view.findComponent(BTbody).findAllComponents(BTr).at(1).findComponent(BButton).trigger('click');
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    expect(view.vm.$data.serverPoolToDelete.id).toEqual(2);

    const deleteRequest = mockAxios.request('api/v1/serverPools/2');

    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
    await view.vm.$nextTick();

    // delete with still attached room types
    await deleteRequest.wait();
    await deleteRequest.respondWith({
      status: 428,
      data: {
        error: 428,
        message: 'app.errors.server_pool_delete_failed',
        room_types: [
          {
            id: 1,
            short: 'TA',
            description: 'Test A',
            color: '#ffffff',
            model_name: 'RoomType',
            updated_at: '2021-01-12T14:35:11.000000Z'
          },
          {
            id: 2,
            short: 'TB',
            description: 'Test B',
            color: '#000000',
            model_name: 'RoomType',
            updated_at: '2021-01-12T14:35:11.000000Z'
          }
        ]
      }
    });

    await view.vm.$nextTick();
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    const roomTypeErrorMessage = view.findComponent(BAlert);
    expect(roomTypeErrorMessage.exists()).toBeTruthy();
    expect(roomTypeErrorMessage.text()).toContain('settings.server_pools.delete.failed');
    const roomTypeList = view.findComponent(BModal).find('ul');
    expect(roomTypeList.exists()).toBeTruthy();
    const roomTypes = roomTypeList.findAll('li');
    expect(roomTypes.length).toEqual(2);
    expect(roomTypes.at(0).text()).toContain('Test A');
    expect(roomTypes.at(1).text()).toContain('Test B');
    view.destroy();
  });

  it('server pool delete error handler called', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'serverPools.delete'] });

    mockAxios.request('api/v1/serverPools').respondWith({
      status: 200,
      data: defaultResponse
    });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      }
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.serverToDelete).toBeUndefined();

    // open delete modal for second server pool
    view.findComponent(BTbody).findAllComponents(BTr).at(1).findComponent(BButton).trigger('click');
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    expect(view.vm.$data.serverPoolToDelete.id).toEqual(2);

    const deleteRequest = mockAxios.request('api/v1/serverPools/2');

    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
    await view.vm.$nextTick();

    // delete
    await deleteRequest.wait();
    expect(deleteRequest.config.method).toBe('delete');
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);

    const request = mockAxios.request('api/v1/serverPools');

    // server error
    await deleteRequest.respondWith({
      status: 500
    });

    await view.vm.$nextTick();

    await request.respondWith({
      status: 200,
      data: {
        data: [],
        links: {
          first: 'http://localhost/api/v1/serverPools?page=1',
          last: 'http://localhost/api/v1/serverPools?page=1',
          prev: null,
          next: null
        },
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          path: 'http://localhost/api/v1/serverPools',
          per_page: 15,
          to: 0,
          total: 0
        }
      }
    });

    expect(spy).toBeCalledTimes(1);

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.serverPoolToDelete).toBeUndefined();

    view.destroy();
  });

  it('new server pool button is displayed if the user has the corresponding permissions', async () => {
    PermissionService.setCurrentUser({ permissions: ['settings.manage'] });

    mockAxios.request('api/v1/serverPools').respondWith({
      status: 200,
      data: {
        data: [],
        links: {
          first: 'http://localhost/api/v1/serverPools?page=1',
          last: 'http://localhost/api/v1/serverPools?page=1',
          prev: null,
          next: null
        },
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          path: 'http://localhost/api/v1/serverPools',
          per_page: 15,
          to: 0,
          total: 0
        }
      }
    });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.findComponent({ ref: 'newServerPool' }).exists()).toBeFalsy();
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'serverPools.create'] });
    await view.vm.$nextTick();

    expect(view.findComponent({ ref: 'newServerPool' }).html()).toContain('settings.server_pools.new');
    view.destroy();
  });
});
