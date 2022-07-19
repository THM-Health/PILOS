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
import sinon from 'sinon';
import Base from '../../../../../resources/js/api/base';
import Vuex from 'vuex';

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

describe('ServerPoolsIndex', function () {
  beforeEach(function () {
    moxios.install();
    oldUser = PermissionService.currentUser;
  });

  afterEach(function () {
    moxios.uninstall();
    PermissionService.setCurrentUser(oldUser);
  });

  it('list of server pools with pagination gets displayed', function (done) {
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'serverPools.viewAny'] });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      store,
      attachTo: createContainer()
    });

    moxios.wait(function () {
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
        expect(html).toContain(2);

        view.destroy();
        done();
      });
    });
  });

  it('list of server pools with search', function (done) {
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

    moxios.wait(function () {
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

        moxios.wait(function () {
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
            done();
          });
        });
      });
    });
  });

  it('update and delete buttons only shown if user has the permission', function (done) {
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

    moxios.wait(function () {
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
        done();
      });
    });
  });

  it('error handler gets called if an error occurs during loading of data', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      store
    });

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 500,
        response: {
          message: 'Test'
        }
      }).then(() => {
        return view.vm.$nextTick();
      }).then(() => {
        sinon.assert.calledOnce(Base.error);
        Base.error.restore();
        view.destroy();
        done();
      });
    });
  });

  it('property gets cleared correctly if deletion gets aborted', function (done) {
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

    moxios.wait(function () {
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
        done();
      });
    });
  });

  it('server pool delete', function (done) {
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

    moxios.wait(async () => {
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

      moxios.wait(async () => {
        // delete without room types attached
        const request = moxios.requests.mostRecent();
        expect(request.config.url).toBe('/api/v1/serverPools/2');
        expect(request.config.method).toBe('delete');
        expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);

        await request.respondWith({
          status: 204
        });

        moxios.wait(async () => {
          // reload data for server pools
          const request = moxios.requests.mostRecent();
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
          done();
        });
      });
    });
  });

  it('server pool delete 404 handling', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

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

    moxios.wait(async () => {
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

      moxios.wait(async () => {
        // delete non existing server pool
        const request = moxios.requests.mostRecent();
        await request.respondWith({
          status: 404,
          response: {
            message: 'Test'
          }
        });
        moxios.wait(async () => {
          // reload data for roomTypes
          const request = moxios.requests.mostRecent();
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

          sinon.assert.calledOnce(Base.error);
          Base.error.restore();

          view.destroy();
          done();
        });
      });
    });
  });

  it('server pool delete error room types attached', function (done) {
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

    moxios.wait(async () => {
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

      moxios.wait(async () => {
        // delete with still attached room types
        const request = moxios.requests.mostRecent();
        await request.respondWith({
          status: 428,
          response: {
            error: 428,
            message: 'app.errors.server_pool_delete_failed',
            roomTypes: [
              { id: 1, short: 'TA', description: 'Test A', color: '#ffffff', model_name: 'RoomType', updated_at: '2021-01-12T14:35:11.000000Z' },
              { id: 2, short: 'TB', description: 'Test B', color: '#000000', model_name: 'RoomType', updated_at: '2021-01-12T14:35:11.000000Z' }
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
        done();
      });
    });
  });

  it('server pool delete error handler called', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);
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

    moxios.wait(async () => {
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

      moxios.wait(async () => {
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

        sinon.assert.calledOnce(Base.error);
        Base.error.restore();
        expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
        expect(view.vm.$data.serverPoolToDelete).toBeUndefined();

        view.destroy();
        done();
      });
    });
  });

  it('new server pool button is displayed if the user has the corresponding permissions', function (done) {
    PermissionService.setCurrentUser({ permissions: ['settings.manage'] });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      store
    });

    moxios.wait(function () {
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
        done();
      });
    });
  });
});
