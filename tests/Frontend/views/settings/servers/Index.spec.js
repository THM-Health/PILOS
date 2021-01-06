import Index from '../../../../../resources/js/views/settings/servers/Index';
import { createLocalVue, mount } from '@vue/test-utils';
import PermissionService from '../../../../../resources/js/services/PermissionService';
import moxios from 'moxios';
import BootstrapVue, {
  IconsPlugin,
  BTr,
  BTbody,
  BButton,
  BModal,
  BButtonClose,
  BFormInput
} from 'bootstrap-vue';
import sinon from 'sinon';
import Base from '../../../../../resources/js/api/base';
import Vuex from 'vuex';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(IconsPlugin);

const defaultResponse = {
  data: [
    {
      id: 1,
      description: 'Server 01',
      strength: 1,
      status: 1,
      participant_count: 10,
      listener_count: 5,
      voice_participant_count: 5,
      video_count: 5,
      meeting_count: 2,
      own_meeting_count: 2,
      model_name: 'Server',
      updated_at: '2020-12-21T13:43:21.000000Z'
    },
    {
      id: 2,
      description: 'Server 02',
      strength: 1,
      status: 1,
      participant_count: 50,
      listener_count: 25,
      voice_participant_count: 30,
      video_count: 5,
      meeting_count: 10,
      own_meeting_count: 9,
      model_name: 'Server',
      updated_at: '2020-12-21T13:43:21.000000Z'
    },
    {
      id: 3,
      description: 'Server 03',
      strength: 1,
      status: -1,
      participant_count: null,
      listener_count: null,
      voice_participant_count: null,
      video_count: null,
      meeting_count: null,
      own_meeting_count: null,
      model_name: 'Server',
      updated_at: '2020-12-21T13:43:21.000000Z'
    }
  ],
  links: {
    first: 'http://localhost/api/v1/servers?page=1',
    last: 'http://localhost/api/v1/servers?page=1',
    prev: null,
    next: null
  },
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    path: 'http://localhost/api/v1/servers',
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

describe('ServersIndex', function () {
  beforeEach(function () {
    moxios.install();
    oldUser = PermissionService.currentUser;
  });

  afterEach(function () {
    moxios.uninstall();
    PermissionService.setCurrentUser(oldUser);
  });

  it('list of servers with pagination gets displayed', function (done) {
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'servers.viewAny'] });

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
        expect(html).toContain('Server 01');
        expect(html).toContain(10);
        expect(html).toContain(5);
        expect(html).toContain(2);

        view.destroy();
        done();
      });
    });
  });

  it('list of servers with search', function (done) {
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'servers.viewAny'] });

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
      }).then(async () => {
        await view.vm.$nextTick();
        expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(3);

        const search = view.findComponent(BFormInput);
        expect(search.exists()).toBeTruthy();
        expect(search.html()).toContain('app.search');
        await search.setProps({ debounce: 0 });
        await search.setValue('Server 02');

        moxios.wait(function () {
          expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

          const request = moxios.requests.mostRecent();
          expect(request.config.params.description).toBe('Server 02');
          request.respondWith({
            status: 200,
            response: {
              data: [
                {
                  id: 2,
                  description: 'Server 02',
                  strength: 1,
                  status: 1,
                  participant_count: 50,
                  listener_count: 25,
                  voice_participant_count: 30,
                  video_count: 5,
                  meeting_count: 10,
                  model_name: 'Server',
                  updated_at: '2020-12-21T13:43:21.000000Z'
                }
              ],
              links: {
                first: 'http://localhost/api/v1/servers?page=1',
                last: 'http://localhost/api/v1/servers?page=1',
                prev: null,
                next: null
              },
              meta: {
                current_page: 1,
                from: 1,
                last_page: 1,
                path: 'http://localhost/api/v1/servers',
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

        PermissionService.setCurrentUser({ permissions: ['settings.manage', 'servers.update', 'servers.view', 'servers.delete'] });

        return view.vm.$nextTick();
      }).then(() => {
        const rows = view.findComponent(BTbody).findAllComponents(BTr);
        expect(rows.at(0).findAllComponents(BButton).length).toEqual(2);
        expect(rows.at(1).findAllComponents(BButton).length).toEqual(2);
        expect(rows.at(2).findAllComponents(BButton).length).toEqual(3);

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
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'servers.delete'] });

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
        expect(view.vm.$data.serverToDelete).toBeUndefined();
        view.findComponent(BTbody).findAllComponents(BTr).at(2).findComponent(BButton).trigger('click');

        return view.vm.$nextTick();
      }).then(() => {
        expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
        expect(view.vm.$data.serverToDelete.id).toEqual(3);
        view.findComponent(BModal).findComponent(BButtonClose).trigger('click');

        return view.vm.$nextTick();
      }).then(() => {
        expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
        expect(view.vm.$data.serverToDelete).toBeUndefined();

        view.destroy();
        done();
      });
    });
  });

  it('server delete', function (done) {
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'servers.delete'] });

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

      // check if three servers  visible
      expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(3);

      // open delete modal for third server
      view.findComponent(BTbody).findAllComponents(BTr).at(2).findComponent(BButton).trigger('click');
      await view.vm.$nextTick();

      expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
      expect(view.vm.$data.serverToDelete.id).toEqual(3);
      view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
      await view.vm.$nextTick();

      moxios.wait(async () => {
        // delete without replacement
        const request = moxios.requests.mostRecent();
        expect(request.config.url).toBe('/api/v1/servers/3');
        expect(request.config.method).toBe('delete');
        expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);

        await request.respondWith({
          status: 204
        });

        moxios.wait(async () => {
          // reload data for roomTypes
          const request = moxios.requests.mostRecent();
          expect(request.config.url).toBe('/api/v1/servers');
          expect(request.config.method).toBe('get');
          await request.respondWith({
            status: 200,
            response: {
              data: [
                {
                  id: 1,
                  description: 'Server 01',
                  strength: 1,
                  status: 1,
                  participant_count: 10,
                  listener_count: 5,
                  voice_participant_count: 5,
                  video_count: 5,
                  meeting_count: 2,
                  own_meeting_count: 2,
                  model_name: 'Server',
                  updated_at: '2020-12-21T13:43:21.000000Z'
                },
                {
                  id: 2,
                  description: 'Server 02',
                  strength: 1,
                  status: 1,
                  participant_count: 50,
                  listener_count: 25,
                  voice_participant_count: 30,
                  video_count: 5,
                  meeting_count: 10,
                  model_name: 'Server',
                  updated_at: '2020-12-21T13:43:21.000000Z'
                }
              ],
              links: {
                first: 'http://localhost/api/v1/servers?page=1',
                last: 'http://localhost/api/v1/servers?page=1',
                prev: null,
                next: null
              },
              meta: {
                current_page: 1,
                from: 1,
                last_page: 1,
                path: 'http://localhost/api/v1/servers',
                per_page: 15,
                to: 1,
                total: 1
              }
            }
          });

          await view.vm.$nextTick();
          // entry removed, modal closes and data reset
          expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(2);
          expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
          expect(view.vm.$data.serverToDelete).toBeUndefined();

          view.destroy();
          done();
        });
      });
    });
  });

  it('server delete 404 handling', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'servers.delete'] });

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

      // check if three servers visible
      expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(3);

      // open delete modal for first server
      view.findComponent(BTbody).findAllComponents(BTr).at(2).findComponent(BButton).trigger('click');
      await view.vm.$nextTick();

      expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
      expect(view.vm.$data.serverToDelete.id).toEqual(3);
      view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
      await view.vm.$nextTick();

      moxios.wait(async () => {
        // delete without replacement
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
          expect(request.config.url).toBe('/api/v1/servers');
          expect(request.config.method).toBe('get');
          await request.respondWith({
            status: 200,
            response: {
              data: [
                {
                  id: 1,
                  description: 'Server 01',
                  strength: 1,
                  status: 1,
                  participant_count: 10,
                  listener_count: 5,
                  voice_participant_count: 5,
                  video_count: 5,
                  meeting_count: 2,
                  own_meeting_count: 2,
                  model_name: 'Server',
                  updated_at: '2020-12-21T13:43:21.000000Z'
                },
                {
                  id: 2,
                  description: 'Server 02',
                  strength: 1,
                  status: 1,
                  participant_count: 50,
                  listener_count: 25,
                  voice_participant_count: 30,
                  video_count: 5,
                  meeting_count: 10,
                  model_name: 'Server',
                  updated_at: '2020-12-21T13:43:21.000000Z'
                }
              ],
              links: {
                first: 'http://localhost/api/v1/servers?page=1',
                last: 'http://localhost/api/v1/servers?page=1',
                prev: null,
                next: null
              },
              meta: {
                current_page: 1,
                from: 1,
                last_page: 1,
                path: 'http://localhost/api/v1/servers',
                per_page: 15,
                to: 1,
                total: 1
              }
            }
          });

          await view.vm.$nextTick();
          // entry removed, modal closes and data reset
          expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(2);
          expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
          expect(view.vm.$data.serverToDelete).toBeUndefined();

          sinon.assert.calledOnce(Base.error);
          Base.error.restore();

          view.destroy();
          done();
        });
      });
    });
  });

  it('server delete error handler called', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'servers.delete'] });

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

      // open delete modal for third server
      view.findComponent(BTbody).findAllComponents(BTr).at(2).findComponent(BButton).trigger('click');
      await view.vm.$nextTick();

      expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
      expect(view.vm.$data.serverToDelete.id).toEqual(3);
      view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
      await view.vm.$nextTick();

      moxios.wait(async () => {
        // delete
        const request = moxios.requests.mostRecent();
        expect(request.config.url).toBe('/api/v1/servers/3');
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
        expect(view.vm.$data.serverToDelete).toBeUndefined();

        view.destroy();
        done();
      });
    });
  });

  it('new server button is displayed if the user has the corresponding permissions', function (done) {
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
            first: 'http://localhost/api/v1/servers?page=1',
            last: 'http://localhost/api/v1/servers?page=1',
            prev: null,
            next: null
          },
          meta: {
            current_page: 1,
            from: 1,
            last_page: 1,
            path: 'http://localhost/api/v1/servers',
            per_page: 15,
            to: 0,
            total: 0
          }
        }
      }).then(() => {
        return view.vm.$nextTick();
      }).then(() => {
        expect(view.findComponent({ ref: 'newServer' }).exists()).toBeFalsy();
        PermissionService.setCurrentUser({ permissions: ['settings.manage', 'servers.create'] });
        return view.vm.$nextTick();
      }).then(() => {
        expect(view.findComponent({ ref: 'newServer' }).html()).toContain('settings.servers.new');
        view.destroy();
        done();
      });
    });
  });

  it('reload button displayed and triggers reload', function (done) {
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
        response: defaultResponse
      }).then(() => {
        return view.vm.$nextTick();
      }).then(() => {
        expect(view.findComponent(BButton).exists()).toBeTruthy();
        expect(view.findComponent(BButton).html()).toContain('settings.servers.reload');

        view.findComponent(BButton).trigger('click');

        moxios.wait(async () => {
          // reload data for roomTypes
          const request = moxios.requests.mostRecent();
          expect(request.config.url).toBe('/api/v1/servers');
          expect(request.config.method).toBe('get');
          await request.respondWith({
            status: 200,
            response: {
              data: [
                {
                  id: 1,
                  description: 'Server 01',
                  strength: 1,
                  status: 1,
                  participant_count: 14,
                  listener_count: 7,
                  voice_participant_count: 7,
                  video_count: 7,
                  meeting_count: 3,
                  model_name: 'Server',
                  updated_at: '2020-12-21T13:43:21.000000Z'
                },
                {
                  id: 2,
                  description: 'Server 02',
                  strength: 1,
                  status: 1,
                  participant_count: 50,
                  listener_count: 25,
                  voice_participant_count: 30,
                  video_count: 5,
                  meeting_count: 10,
                  model_name: 'Server',
                  updated_at: '2020-12-21T13:43:21.000000Z'
                }
              ],
              links: {
                first: 'http://localhost/api/v1/servers?page=1',
                last: 'http://localhost/api/v1/servers?page=1',
                prev: null,
                next: null
              },
              meta: {
                current_page: 1,
                from: 1,
                last_page: 1,
                path: 'http://localhost/api/v1/servers',
                per_page: 15,
                to: 2,
                total: 2
              }
            }
          });

          await view.vm.$nextTick();

          const html = view.findComponent(BTbody).findAllComponents(BTr).at(0).html();
          expect(html).toContain('Server 01');
          expect(html).toContain(14);
          expect(html).toContain(7);
          expect(html).toContain(3);

          view.destroy();
          done();
        });
      });
    });
  });
});
