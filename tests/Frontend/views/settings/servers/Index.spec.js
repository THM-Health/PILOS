import Index from '../../../../../resources/js/views/settings/servers/Index';
import { createLocalVue, mount } from '@vue/test-utils';
import PermissionService from '../../../../../resources/js/services/PermissionService';
import moxios from 'moxios';
import BootstrapVue, {

  BTr,
  BTbody,
  BButton,
  BModal,
  BButtonClose,
  BFormInput
} from 'bootstrap-vue';
import Base from '../../../../../resources/js/api/base';
import Vuex from 'vuex';
import { waitMoxios, createContainer } from '../../../helper';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(Vuex);

const defaultResponse = {
  data: [
    {
      id: 1,
      name: 'Server 01',
      description: 'Testserver 01',
      strength: 1,
      status: 1,
      participant_count: 10,
      listener_count: 5,
      voice_participant_count: 5,
      video_count: 5,
      meeting_count: 2,
      own_meeting_count: 2,
      version: '2.4.5',
      model_name: 'Server',
      updated_at: '2020-12-21T13:43:21.000000Z'
    },
    {
      id: 2,
      name: 'Server 02',
      description: 'Testserver 02',
      strength: 1,
      status: 1,
      participant_count: 50,
      listener_count: 25,
      voice_participant_count: 30,
      video_count: 5,
      meeting_count: 10,
      own_meeting_count: 9,
      version: null,
      model_name: 'Server',
      updated_at: '2020-12-21T13:43:21.000000Z'
    },
    {
      id: 3,
      name: 'Server 03',
      description: 'Testserver 03',
      strength: 1,
      status: -1,
      participant_count: null,
      listener_count: null,
      voice_participant_count: null,
      video_count: null,
      meeting_count: null,
      own_meeting_count: null,
      version: null,
      model_name: 'Server',
      updated_at: '2020-12-21T13:43:21.000000Z'
    },
    {
      id: 4,
      name: 'Server 04',
      description: 'Testserver 04',
      strength: 1,
      status: 0,
      participant_count: null,
      listener_count: null,
      voice_participant_count: null,
      video_count: null,
      meeting_count: null,
      own_meeting_count: null,
      version: null,
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

describe('ServersIndex', () => {
  beforeEach(() => {
    moxios.install();
    oldUser = PermissionService.currentUser;
  });

  afterEach(() => {
    moxios.uninstall();
    PermissionService.setCurrentUser(oldUser);
  });

  it('list of servers with pagination gets displayed', async () => {
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'servers.viewAny'] });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

    const request = moxios.requests.mostRecent();
    await request.respondWith({
      status: 200,
      response: defaultResponse
    });
    await view.vm.$nextTick();

    const server01 = view.findComponent(BTbody).findAllComponents(BTr).at(0).findAll('td');
    expect(server01.at(1).html()).toContain('Server 01');
    expect(server01.at(2).html()).toContain('fa-solid fa-play');
    expect(server01.at(3).html()).toContain('2.4.5');
    expect(server01.at(4).html()).toContain('2');
    expect(server01.at(5).html()).toContain('10');
    expect(server01.at(6).html()).toContain('5');

    const server02 = view.findComponent(BTbody).findAllComponents(BTr).at(1).findAll('td');
    expect(server02.at(1).html()).toContain('Server 02');
    expect(server02.at(2).html()).toContain('fa-solid fa-play');
    expect(server02.at(3).html()).toContain('---');
    expect(server02.at(4).html()).toContain('10');
    expect(server02.at(5).html()).toContain('50');
    expect(server02.at(6).html()).toContain('5');

    const server03 = view.findComponent(BTbody).findAllComponents(BTr).at(2).findAll('td');
    expect(server03.at(1).html()).toContain('Server 03');
    expect(server03.at(2).html()).toContain('fa-solid fa-pause');
    expect(server03.at(3).html()).toContain('---');
    expect(server03.at(4).html()).toContain('---');
    expect(server03.at(5).html()).toContain('---');
    expect(server03.at(6).html()).toContain('---');

    const server04 = view.findComponent(BTbody).findAllComponents(BTr).at(3).findAll('td');
    expect(server04.at(1).html()).toContain('Server 04');
    expect(server04.at(2).html()).toContain('fa-solid fa-stop');
    expect(server04.at(3).html()).toContain('---');
    expect(server04.at(4).html()).toContain('---');
    expect(server04.at(5).html()).toContain('---');
    expect(server04.at(6).html()).toContain('---');

    view.destroy();
  });

  it('list of servers with search', async () => {
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'servers.viewAny'] });

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

    await waitMoxios();
    expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

    let request = moxios.requests.mostRecent();
    await request.respondWith({
      status: 200,
      response: defaultResponse
    });
    await view.vm.$nextTick();
    expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(4);

    const search = view.findComponent(BFormInput);
    expect(search.exists()).toBeTruthy();
    expect(search.html()).toContain('app.search');
    await search.setValue('Server 02');

    await waitMoxios();
    expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

    request = moxios.requests.mostRecent();
    expect(request.config.params.name).toBe('Server 02');
    await request.respondWith({
      status: 200,
      response: {
        data: [
          {
            id: 2,
            name: 'Server 02',
            description: 'Testserver 02',
            strength: 1,
            status: 1,
            participant_count: 50,
            listener_count: 25,
            voice_participant_count: 30,
            video_count: 5,
            meeting_count: 10,
            version: null,
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
    expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(1);
    view.destroy();
  });

  it('update and delete buttons only shown if user has the permission', async () => {
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

    await waitMoxios();
    await moxios.requests.mostRecent().respondWith(response);
    await view.vm.$nextTick();

    view.findComponent(BTbody).findAllComponents(BTr).wrappers.forEach((row) => {
      expect(row.findAllComponents(BButton).length).toEqual(0);
    });

    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'servers.update', 'servers.view', 'servers.delete'] });

    await view.vm.$nextTick();
    const rows = view.findComponent(BTbody).findAllComponents(BTr);
    expect(rows.at(0).findAllComponents(BButton).length).toEqual(2);
    expect(rows.at(1).findAllComponents(BButton).length).toEqual(2);
    expect(rows.at(2).findAllComponents(BButton).length).toEqual(3);

    view.destroy();
  });

  it('error handler gets called if an error occurs during loading of data', async () => {
    const spy = jest.spyOn(Base, 'error').mockImplementation();

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      store
    });

    await waitMoxios();
    const request = moxios.requests.mostRecent();
    await request.respondWith({
      status: 500,
      response: {
        message: 'Test'
      }
    });
    await view.vm.$nextTick();

    expect(spy).toBeCalledTimes(1);

    view.destroy();
  });

  it('property gets cleared correctly if deletion gets aborted', async () => {
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

    await waitMoxios();
    await moxios.requests.mostRecent().respondWith(response);
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.serverToDelete).toBeUndefined();
    view.findComponent(BTbody).findAllComponents(BTr).at(2).findComponent(BButton).trigger('click');

    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    expect(view.vm.$data.serverToDelete.id).toEqual(3);
    view.findComponent(BModal).findComponent(BButtonClose).trigger('click');

    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.serverToDelete).toBeUndefined();

    view.destroy();
  });

  it('server delete', async () => {
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

    await waitMoxios();
    await moxios.requests.mostRecent().respondWith(response);
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.serverToDelete).toBeUndefined();

    // check if four servers  visible
    expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(4);

    // open delete modal for third server
    view.findComponent(BTbody).findAllComponents(BTr).at(2).findComponent(BButton).trigger('click');
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    expect(view.vm.$data.serverToDelete.id).toEqual(3);
    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
    await view.vm.$nextTick();

    await waitMoxios();
    // delete without replacement
    let request = moxios.requests.mostRecent();
    expect(request.config.url).toBe('/api/v1/servers/3');
    expect(request.config.method).toBe('delete');
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);

    await request.respondWith({
      status: 204
    });

    await waitMoxios();
    // reload data for servers
    request = moxios.requests.mostRecent();
    expect(request.config.url).toBe('/api/v1/servers');
    expect(request.config.method).toBe('get');
    await request.respondWith({
      status: 200,
      response: {
        data: [
          {
            id: 1,
            name: 'Server 01',
            description: 'Testserver 01',
            strength: 1,
            status: 1,
            participant_count: 10,
            listener_count: 5,
            voice_participant_count: 5,
            video_count: 5,
            meeting_count: 2,
            own_meeting_count: 2,
            version: '2.4.5',
            model_name: 'Server',
            updated_at: '2020-12-21T13:43:21.000000Z'
          },
          {
            id: 2,
            name: 'Server 02',
            description: 'Testserver 02',
            strength: 1,
            status: 1,
            participant_count: 50,
            listener_count: 25,
            voice_participant_count: 30,
            video_count: 5,
            meeting_count: 10,
            version: '2.4.4',
            model_name: 'Server',
            updated_at: '2020-12-21T13:43:21.000000Z'
          },
          {
            id: 4,
            name: 'Server 04',
            description: 'Testserver 04',
            strength: 1,
            status: 0,
            participant_count: null,
            listener_count: null,
            voice_participant_count: null,
            video_count: null,
            meeting_count: null,
            own_meeting_count: null,
            version: null,
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
          to: 3,
          total: 3
        }
      }
    });

    await view.vm.$nextTick();
    // entry removed, modal closes and data reset
    expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(3);
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.serverToDelete).toBeUndefined();

    view.destroy();
  });

  it('server delete 404 handling', async () => {
    const spy = jest.spyOn(Base, 'error').mockImplementation();

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

    await waitMoxios();
    await moxios.requests.mostRecent().respondWith(response);
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.serverToDelete).toBeUndefined();

    // check if four servers visible
    expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(4);

    // open delete modal for first server
    view.findComponent(BTbody).findAllComponents(BTr).at(2).findComponent(BButton).trigger('click');
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    expect(view.vm.$data.serverToDelete.id).toEqual(3);
    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
    await view.vm.$nextTick();

    await waitMoxios();
    // delete without replacement
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
    expect(request.config.url).toBe('/api/v1/servers');
    expect(request.config.method).toBe('get');
    await request.respondWith({
      status: 200,
      response: {
        data: [
          {
            id: 1,
            name: 'Server 01',
            description: 'Testserver 01',
            strength: 1,
            status: 1,
            participant_count: 10,
            listener_count: 5,
            voice_participant_count: 5,
            video_count: 5,
            meeting_count: 2,
            own_meeting_count: 2,
            version: '2.4.5',
            model_name: 'Server',
            updated_at: '2020-12-21T13:43:21.000000Z'
          },
          {
            id: 2,
            name: 'Server 02',
            description: 'Testserver 02',
            strength: 1,
            status: 1,
            participant_count: 50,
            listener_count: 25,
            voice_participant_count: 30,
            video_count: 5,
            meeting_count: 10,
            version: '2.4.4',
            model_name: 'Server',
            updated_at: '2020-12-21T13:43:21.000000Z'
          },
          {
            id: 4,
            name: 'Server 04',
            description: 'Testserver 04',
            strength: 1,
            status: 0,
            participant_count: null,
            listener_count: null,
            voice_participant_count: null,
            video_count: null,
            meeting_count: null,
            own_meeting_count: null,
            version: null,
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
          to: 3,
          total: 3
        }
      }
    });

    await view.vm.$nextTick();
    // entry removed, modal closes and data reset
    expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(3);
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.serverToDelete).toBeUndefined();

    expect(spy).toBeCalledTimes(1);

    view.destroy();
  });

  it('server delete error handler called', async () => {
    const spy = jest.spyOn(Base, 'error').mockImplementation();
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

    await waitMoxios();
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

    await waitMoxios();
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

    expect(spy).toBeCalledTimes(1);

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.serverToDelete).toBeUndefined();

    view.destroy();
  });

  it('new server button is displayed if the user has the corresponding permissions', async () => {
    PermissionService.setCurrentUser({ permissions: ['settings.manage'] });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      store
    });

    await waitMoxios();
    const request = moxios.requests.mostRecent();
    await request.respondWith({
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
    });
    await view.vm.$nextTick();

    expect(view.findComponent({ ref: 'newServer' }).exists()).toBeFalsy();
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'servers.create'] });
    await view.vm.$nextTick();

    expect(view.findComponent({ ref: 'newServer' }).html()).toContain('settings.servers.new');
    view.destroy();
  });

  it('reload button displayed and triggers reload', async () => {
    PermissionService.setCurrentUser({ permissions: ['settings.manage'] });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      store
    });

    // During normal load the usage should not be updated
    await waitMoxios();
    let request = moxios.requests.mostRecent();
    expect(request.config.params.update_usage).toBeFalsy();
    await request.respondWith({
      status: 200,
      response: defaultResponse
    });
    await view.vm.$nextTick();

    expect(view.findComponent(BButton).exists()).toBeTruthy();
    expect(view.findComponent(BButton).html()).toContain('settings.servers.reload');

    view.findComponent(BButton).trigger('click');

    await waitMoxios();
    // reload data for roomTypes and force update of usage data
    request = moxios.requests.mostRecent();
    expect(request.config.url).toBe('/api/v1/servers');
    expect(request.config.method).toBe('get');
    expect(request.config.params.update_usage).toBeTruthy();

    await request.respondWith({
      status: 200,
      response: {
        data: [
          {
            id: 1,
            name: 'Server 01',
            description: 'Testserver 01',
            strength: 1,
            status: 1,
            participant_count: 14,
            listener_count: 7,
            voice_participant_count: 7,
            video_count: 7,
            meeting_count: 3,
            version: '2.4.5',
            model_name: 'Server',
            updated_at: '2020-12-21T13:43:21.000000Z'
          },
          {
            id: 2,
            name: 'Server 02',
            description: 'Testserver 02',
            strength: 1,
            status: 1,
            participant_count: 50,
            listener_count: 25,
            voice_participant_count: 30,
            video_count: 5,
            meeting_count: 10,
            version: '2.4.4',
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
    expect(html).toContain('14');
    expect(html).toContain('7');
    expect(html).toContain('3');

    // during future normal requests the force usage should be disabled again
    view.vm.$root.$emit('bv::refresh::table', 'servers-table');
    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.params.update_usage).toBeFalsy();

    view.destroy();
  });
});
