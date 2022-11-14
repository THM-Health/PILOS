import Index from '../../../../../resources/js/views/settings/roomTypes/Index';
import { createLocalVue, mount } from '@vue/test-utils';
import PermissionService from '../../../../../resources/js/services/PermissionService';
import moxios from 'moxios';
import BootstrapVue, {

  BTr,
  BTbody,
  BButton,
  BModal,
  BButtonClose,
  BFormSelect
} from 'bootstrap-vue';
import Base from '../../../../../resources/js/api/base';
import Vuex from 'vuex';
import { waitMoxios, createContainer } from '../../../helper';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    session: {
      namespaced: true,
      getters: {
        settings: () => (setting) => setting === 'pagination_page_size' ? 5 : null
      }
    }
  }
});

describe('RoomTypesIndex', () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it('list of room types with pagination gets displayed', async () => {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['settings.manage'] });

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
      response: {
        data: [{
          id: '1',
          short: 'ME',
          color: '#333333',
          description: 'Meeting',
          model_name: 'RoomType'
        }]
      }
    });
    await view.vm.$nextTick();

    const html = view.findComponent(BTbody).findComponent(BTr).html();
    expect(html).toContain('Meeting');
    expect(html).toContain('ME');

    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('update and delete buttons only shown if user has the permission', async () => {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['settings.manage'] });

    const response = {
      status: 200,
      response: {
        data: [{
          id: '1',
          short: 'ME',
          color: '#333333',
          description: 'Meeting',
          model_name: 'RoomType'
        }]
      }
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

    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'roomTypes.update', 'roomTypes.view', 'roomTypes.delete'] });

    await view.vm.$nextTick();

    const rows = view.findComponent(BTbody).findAllComponents(BTr);
    expect(rows.at(0).findAllComponents(BButton).length).toEqual(3);

    view.destroy();
    PermissionService.setCurrentUser(oldUser);
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
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'roomTypes.delete'] });

    const response = {
      status: 200,
      response: {
        data: [{
          id: '1',
          short: 'ME',
          color: '#333333',
          description: 'Meeting',
          model_name: 'RoomType'
        }]
      }
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

    const response = {
      status: 200,
      response: {
        data: [
          {
            id: '1',
            short: 'ME',
            color: '#333333',
            description: 'Meeting',
            model_name: 'RoomType'
          },
          {
            id: '2',
            short: 'TE',
            color: '#333333',
            description: 'Test',
            model_name: 'RoomType'
          }
        ]
      }
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
    expect(view.vm.$data.roomTypeToDelete).toBeUndefined();

    // check if two room types visible
    expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(2);

    // open delete modal for first room type
    view.findComponent(BTbody).findAllComponents(BTr).at(0).findComponent(BButton).trigger('click');
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    expect(view.vm.$data.roomTypeToDelete.id).toEqual('1');
    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
    await view.vm.$nextTick();

    await waitMoxios();
    // delete without replacement
    let request = moxios.requests.mostRecent();
    expect(request.config.url).toBe('/api/v1/roomTypes/1');
    expect(request.config.method).toBe('delete');
    expect(request.config.data).toBe('{"replacement_room_type":null}');
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    // error replacement required
    await request.respondWith({
      status: 422,
      response: {
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
    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
    await view.vm.$nextTick();

    await waitMoxios();
    // delete data with replacement
    request = moxios.requests.mostRecent();
    expect(request.config.url).toBe('/api/v1/roomTypes/1');
    expect(request.config.method).toBe('delete');
    expect(request.config.data).toBe('{"replacement_room_type":2}');
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    await request.respondWith({
      status: 204
    });

    await waitMoxios();
    // reload data for roomTypes
    request = moxios.requests.mostRecent();
    expect(request.config.url).toBe('/api/v1/roomTypes');
    expect(request.config.method).toBe('get');
    await request.respondWith({
      status: 200,
      response: {
        data: [
          {
            id: '2',
            short: 'TE',
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
    const spy = jest.spyOn(Base, 'error').mockImplementation();

    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'roomTypes.delete'] });

    const response = {
      status: 200,
      response: {
        data: [
          {
            id: '1',
            short: 'ME',
            color: '#333333',
            description: 'Meeting',
            model_name: 'RoomType'
          },
          {
            id: '2',
            short: 'TE',
            color: '#333333',
            description: 'Test',
            model_name: 'RoomType'
          }
        ]
      }
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
    expect(view.vm.$data.roomTypeToDelete).toBeUndefined();

    // check if two room types visible
    expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(2);

    // open delete modal for first room type
    view.findComponent(BTbody).findAllComponents(BTr).at(0).findComponent(BButton).trigger('click');
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    expect(view.vm.$data.roomTypeToDelete.id).toEqual('1');
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
    expect(request.config.url).toBe('/api/v1/roomTypes');
    expect(request.config.method).toBe('get');
    await request.respondWith({
      status: 200,
      response: {
        data: [
          {
            id: '2',
            short: 'TE',
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
    const spy = jest.spyOn(Base, 'error').mockImplementation();
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'roomTypes.delete'] });

    const response = {
      status: 200,
      response: {
        data: [
          {
            id: '1',
            short: 'ME',
            color: '#333333',
            description: 'Meeting',
            model_name: 'RoomType'
          }
        ]
      }
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
    expect(view.vm.$data.roomTypeToDelete).toBeUndefined();

    // open delete modal for first room type
    view.findComponent(BTbody).findComponent(BTr).findComponent(BButton).trigger('click');
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    expect(view.vm.$data.roomTypeToDelete.id).toEqual('1');
    view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
    await view.vm.$nextTick();

    await waitMoxios();
    // delete
    const request = moxios.requests.mostRecent();
    expect(request.config.url).toBe('/api/v1/roomTypes/1');
    expect(request.config.method).toBe('delete');
    expect(request.config.data).toBe('{"replacement_room_type":null}');
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    // error replacement required
    await request.respondWith({
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
        data: []
      }
    });
    await view.vm.$nextTick();

    expect(view.findComponent(BButton).exists()).toBeFalsy();
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'roomTypes.create'] });
    await view.vm.$nextTick();

    expect(view.findComponent(BButton).html()).toContain('settings.room_types.new');
    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });
});
