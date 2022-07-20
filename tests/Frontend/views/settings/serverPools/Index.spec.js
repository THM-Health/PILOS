import Index from '../../../../../resources/js/views/settings/serverPools/Index';
import { createLocalVue, mount } from '@vue/test-utils';
import PermissionService from '../../../../../resources/js/services/PermissionService';
import moxios from 'moxios';
import BootstrapVue, {

  BTr,
  BTbody,
  BButton,
  BModal,
  BButtonClose,
  BFormInput, BAlert
} from 'bootstrap-vue';
import Base from '../../../../../resources/js/api/base';
import Vuex from 'vuex';
import { waitMoxios } from '../../../helper';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(Vuex);

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

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};

const store = new Vuex.Store({
  modules: {
    session: {
      namespaced: true,
      getters: {
        settings: () => (setting) => setting === 'pagination_page_size' ? 15 : null
      }
    }
  }
});

let oldUser;

describe('ServerPoolsIndex', () => {
  beforeEach(() => {
    moxios.install();
    oldUser = PermissionService.currentUser;
  });

  afterEach(() => {
    moxios.uninstall();
    PermissionService.setCurrentUser(oldUser);
  });

  it('list of server pools with pagination gets displayed', async () => {
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'serverPools.viewAny'] });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios(function () {
      expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: defaultResponse
      }).then(() => {
        return view.vm.$nextTick();
      }).then(() => {
        const html = view.findComponent(BTbody).findAllComponents(BTr).at(0).html();
        expect(html).toContain('Test');
        expect(html).toContain('2');

        view.destroy();
      });
    });
  });

  it('list of server pools with search', async () => {
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'serverPools.viewAny'] });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      propsData: {
        searchDebounce: 0
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios(function () {
      expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: defaultResponse
      }).then(async () => {
        await view.vm.$nextTick();
        expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(2);

        const search = view.findComponent(BFormInput);
        expect(search.exists()).toBeTruthy();
        expect(search.html()).toContain('app.search');
        await search.setValue('Prod');

        await waitMoxios(function () {
          expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

          const request = moxios.requests.mostRecent();
          expect(request.config.params.name).toBe('Prod');
          request.respondWith({
            status: 200,
            response: {
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
          }).then(async () => {
            await view.vm.$nextTick();
            expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(1);
            view.destroy();
          });
        });
      });
    });
  });

  it('update and delete buttons only shown if user has the permission',
    async () => {
      PermissionService.setCurrentUser({ permissions: ['settings.manage'] });

      const response = {
        status: 200,
        response: defaultResponse
      };

      const view = mount(Index, {
        localVue,
        mocks: {
          $t: key => key
        },
        attachTo: createContainer(),
        store
      });

      await waitMoxios(function () {
        moxios.requests.mostRecent().respondWith(response).then(() => {
          return view.vm.$nextTick();
        }).then(() => {
          view.findComponent(BTbody).findAllComponents(BTr).wrappers.forEach((row) => {
            expect(row.findAllComponents(BButton).length).toEqual(0);
          });

          PermissionService.setCurrentUser({ permissions: ['settings.manage', 'serverPools.update', 'serverPools.view', 'serverPools.delete'] });

          return view.vm.$nextTick();
        }).then(() => {
          const rows = view.findComponent(BTbody).findAllComponents(BTr);
          expect(rows.at(0).findAllComponents(BButton).length).toEqual(3);
          expect(rows.at(1).findAllComponents(BButton).length).toEqual(3);

          view.destroy();
        });
      });
    }
  );

  it('error handler gets called if an error occurs during loading of data',
    async () => {
      const spy = jest.spyOn(Base, 'error').mockImplementation();

      const view = mount(Index, {
        localVue,
        mocks: {
          $t: key => key
        },
        attachTo: createContainer(),
        store
      });

      await waitMoxios(function () {
        const request = moxios.requests.mostRecent();
        request.respondWith({
          status: 500,
          response: {
            message: 'Test'
          }
        }).then(() => {
          return view.vm.$nextTick();
        }).then(() => {
          expect(spy).toBeCalledTimes(1);
          Base.error.mockRestore();
          view.destroy();
        });
      });
    }
  );

  it('property gets cleared correctly if deletion gets aborted',
    async () => {
      PermissionService.setCurrentUser({ permissions: ['settings.manage', 'serverPools.delete'] });

      const response = {
        status: 200,
        response: defaultResponse
      };

      const view = mount(Index, {
        localVue,
        mocks: {
          $t: key => key
        },
        attachTo: createContainer(),
        propsData: {
          modalStatic: true
        },
        store
      });

      await waitMoxios(function () {
        moxios.requests.mostRecent().respondWith(response).then(() => {
          return view.vm.$nextTick();
        }).then(() => {
          expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
          expect(view.vm.$data.serverPoolToDelete).toBeUndefined();
          view.findComponent(BTbody).findAllComponents(BTr).at(1).findComponent(BButton).trigger('click');

          return view.vm.$nextTick();
        }).then(() => {
          expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
          expect(view.vm.$data.serverPoolToDelete.id).toEqual(2);
          view.findComponent(BModal).findComponent(BButtonClose).trigger('click');

          return view.vm.$nextTick();
        }).then(() => {
          expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
          expect(view.vm.$data.serverPoolToDelete).toBeUndefined();

          view.destroy();
        });
      });
    }
  );

  it('server pool delete', async () => {
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'serverPools.delete'] });

    const response = {
      status: 200,
      response: defaultResponse
    };

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      },
      store
    });

    await waitMoxios();
    await moxios.requests.mostRecent().respondWith(response);
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
    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
    await view.vm.$nextTick();

    await waitMoxios();
    // delete without room types attached
    request = moxios.requests.mostRecent();
    expect(request.config.url).toBe('/api/v1/serverPools/2');
    expect(request.config.method).toBe('delete');
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);

    await request.respondWith({
      status: 204
    });

    await waitMoxios();
    // reload data for server pools
    let request = moxios.requests.mostRecent();
    expect(request.config.url).toBe('/api/v1/serverPools');
    expect(request.config.method).toBe('get');
    await request.respondWith({
      status: 200,
      response: {
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
    const spy = jest.spyOn(Base, 'error').mockImplementation();

    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'serverPools.delete'] });

    const response = {
      status: 200,
      response: defaultResponse
    };

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      },
      store
    });

    await waitMoxios();
    await moxios.requests.mostRecent().respondWith(response);
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
    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
    await view.vm.$nextTick();

    await waitMoxios();
    // delete non existing server pool
    let request = moxios.requests.mostRecent();
    await request.respondWith({
      status: 404,
      response: {
        message: 'Test'
      }
    });
    await waitMoxios();
    // reload data for roomTypes
    request = moxios.requests.mostRecent();
    expect(request.config.url).toBe('/api/v1/serverPools');
    expect(request.config.method).toBe('get');
    await request.respondWith({
      status: 200,
      response: {
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
    Base.error.mockRestore();

    view.destroy();
  });

  it('server pool delete error room types attached', async () => {
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'serverPools.delete'] });

    const response = {
      status: 200,
      response: defaultResponse
    };

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      },
      store
    });

    await waitMoxios();
    await moxios.requests.mostRecent().respondWith(response);
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
    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
    await view.vm.$nextTick();

    await waitMoxios();
    // delete with still attached room types
    const request = moxios.requests.mostRecent();
    await request.respondWith({
      status: 428,
      response: {
        error: 428,
        message: 'app.errors.server_pool_delete_failed',
        roomTypes: [
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
    expect(roomTypeErrorMessage.text()).toContain('settings.serverPools.delete.failed');
    const roomTypeList = view.findComponent(BModal).find('ul');
    expect(roomTypeList.exists()).toBeTruthy();
    const roomTypes = roomTypeList.findAll('li');
    expect(roomTypes.length).toEqual(2);
    expect(roomTypes.at(0).text()).toContain('Test A');
    expect(roomTypes.at(1).text()).toContain('Test B');
    view.destroy();
  });

  it('server pool delete error handler called', async () => {
    const spy = jest.spyOn(Base, 'error').mockImplementation();
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'serverPools.delete'] });

    const response = {
      status: 200,
      response: defaultResponse
    };

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      },
      store
    });

    await waitMoxios();
    await moxios.requests.mostRecent().respondWith(response);
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.serverToDelete).toBeUndefined();

    // open delete modal for second server pool
    view.findComponent(BTbody).findAllComponents(BTr).at(1).findComponent(BButton).trigger('click');
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    expect(view.vm.$data.serverPoolToDelete.id).toEqual(2);
    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
    await view.vm.$nextTick();

    await waitMoxios();
    // delete
    const request = moxios.requests.mostRecent();
    expect(request.config.url).toBe('/api/v1/serverPools/2');
    expect(request.config.method).toBe('delete');
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    // error replacement required
    await request.respondWith({
      status: 500
    });

    await view.vm.$nextTick();

    expect(spy).toBeCalledTimes(1);
    Base.error.mockRestore();
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.serverPoolToDelete).toBeUndefined();

    view.destroy();
  });

  it('new server pool button is displayed if the user has the corresponding permissions',
    async () => {
      PermissionService.setCurrentUser({ permissions: ['settings.manage'] });

      const view = mount(Index, {
        localVue,
        mocks: {
          $t: key => key
        },
        attachTo: createContainer(),
        store
      });

      await waitMoxios(function () {
        const request = moxios.requests.mostRecent();
        request.respondWith({
          status: 200,
          response: {
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
        }).then(() => {
          return view.vm.$nextTick();
        }).then(() => {
          expect(view.findComponent({ ref: 'newServerPool' }).exists()).toBeFalsy();
          PermissionService.setCurrentUser({ permissions: ['settings.manage', 'serverPools.create'] });
          return view.vm.$nextTick();
        }).then(() => {
          expect(view.findComponent({ ref: 'newServerPool' }).html()).toContain('settings.serverPools.new');
          view.destroy();
        });
      });
    }
  );
});
