import Index from '@/views/settings/roles/Index.vue';
import { mount } from '@vue/test-utils';
import PermissionService from '@/services/PermissionService';

import { BTr, BTbody, BButton, BModal, BButtonClose } from 'bootstrap-vue';
import { mockAxios, createContainer, createLocalVue } from '../../../helper';
import Base from '@/api/base';
import { expect } from 'vitest';

const localVue = createLocalVue();

describe('RolesIndex', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it('list of roles with pagination gets displayed', async () => {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['roles.viewAny', 'settings.manage'] });

    let request = mockAxios.request('/api/v1/roles');

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key,
        $te: key => key === 'app.role_labels.admin'
      },
      attachTo: createContainer()
    });

    await request.wait();
    expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

    await request.respondWith({
      status: 200,
      data: {
        data: [{
          id: '1',
          name: 'Test',
          default: false,
          model_name: 'Role'
        }],
        meta: {
          per_page: 1,
          current_page: 1,
          total: 1
        }
      }
    });
    await view.vm.$nextTick();

    let html = view.findComponent(BTbody).findComponent(BTr).html();
    expect(html).toContain('Test');
    expect(html).toContain('app.no');
    expect(html).toContain('1');

    request = mockAxios.request('/api/v1/roles');

    view.vm.$root.$emit('bv::refresh::table', 'roles-table');

    await request.wait();
    expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

    await request.respondWith({
      status: 200,
      data: {
        data: [{
          id: '2',
          name: 'admin',
          default: true,
          model_name: 'Role'
        }],
        meta: {
          per_page: 1,
          current_page: 1,
          total: 1
        }
      }
    });
    html = view.findComponent(BTbody).findComponent(BTr).html();

    expect(html).toContain('app.role_labels.admin');
    expect(html).toContain('app.yes');
    expect(html).toContain('2');

    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('update and delete buttons only shown if user has the permission and the role is not system default', async () => {
    const oldUser = PermissionService.currentUser;

    const request = mockAxios.request('/api/v1/roles');

    PermissionService.setCurrentUser({ permissions: ['roles.viewAny', 'settings.manage'] });

    const response = {
      status: 200,
      data: {
        data: [{
          id: '1',
          name: 'Test',
          default: false,
          model_name: 'Role'
        }, {
          id: '2',
          name: 'admin',
          default: true,
          model_name: 'Role'
        }],
        meta: {
          per_page: 2,
          current_page: 1,
          total: 2
        }
      }
    };

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key,
        $te: key => key === 'app.role_labels.admin'
      },
      attachTo: createContainer()
    });

    await request.wait();
    await request.respondWith(response);
    await view.vm.$nextTick();

    view.findComponent(BTbody).findAllComponents(BTr).wrappers.forEach((row) => {
      expect(row.findAllComponents(BButton).length).toEqual(0);
    });

    PermissionService.setCurrentUser({ permissions: ['roles.viewAny', 'settings.manage', 'roles.update', 'roles.view', 'roles.delete'] });

    await view.vm.$nextTick();

    const rows = view.findComponent(BTbody).findAllComponents(BTr);
    expect(rows.at(0).findAllComponents(BButton).length).toEqual(3);
    expect(rows.at(1).findAllComponents(BButton).length).toEqual(1);
    expect(rows.at(1).findComponent(BButton).html()).toContain('settings.roles.view');

    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('error handler gets called if an error occurs during loading of data', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const request = mockAxios.request('/api/v1/roles');

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key,
        $te: key => key === 'app.role_labels.admin'
      },
      attachTo: createContainer()
    });

    await request.wait();
    await request.respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });
    await view.vm.$nextTick();

    expect(spy).toBeCalledTimes(1);

    view.destroy();
  });

  it('not system roles can be deleted', async () => {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['roles.viewAny', 'settings.manage', 'roles.delete'] });

    let request = mockAxios.request('/api/v1/roles');

    const response = {
      status: 200,
      data: {
        data: [{
          id: '1',
          name: 'Test',
          default: false,
          model_name: 'Role'
        }],
        meta: {
          per_page: 2,
          current_page: 1,
          total: 1
        }
      }
    };

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key,
        $te: key => key === 'app.role_labels.admin'
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      }
    });

    await request.wait();
    await request.respondWith(response);
    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    view.findComponent(BTbody).findComponent(BTr).findComponent(BButton).trigger('click');

    await view.vm.$nextTick();

    const deleteRequest = mockAxios.request('/api/v1/roles/1');

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    view.findComponent(BModal).vm.$refs['ok-button'].click();

    request = mockAxios.request('/api/v1/roles');

    await deleteRequest.wait();
    expect(deleteRequest.config.method).toEqual('delete');
    await deleteRequest.respondWith({ status: 204 });
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.roleToDelete).toBeUndefined();

    // Reload after delete
    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: [],
        meta: {
          per_page: 2,
          current_page: 1,
          total: 0
        }
      }
    });

    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.findComponent(BTbody).text()).toContain('settings.roles.nodata');

    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('property gets cleared correctly if deletion gets aborted', async () => {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['roles.viewAny', 'settings.manage', 'roles.delete'] });

    const request = mockAxios.request('/api/v1/roles');

    const response = {
      status: 200,
      data: {
        data: [{
          id: '1',
          name: 'Test',
          default: false,
          model_name: 'Role'
        }],
        meta: {
          per_page: 2,
          current_page: 1,
          total: 1
        }
      }
    };

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key,
        $te: key => key === 'app.role_labels.admin'
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      }
    });

    await request.wait();
    await request.respondWith(response);
    await view.vm.$nextTick();
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.roleToDelete).toBeUndefined();
    view.findComponent(BTbody).findComponent(BTr).findComponent(BButton).trigger('click');

    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
    expect(view.vm.$data.roleToDelete.id).toEqual('1');
    view.findComponent(BModal).findComponent(BButtonClose).trigger('click');

    await view.vm.$nextTick();

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.roleToDelete).toBeUndefined();

    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('new role button is displayed if the user has the corresponding permissions', async () => {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['roles.viewAny', 'settings.manage', 'roles.create'] });

    const request = mockAxios.request('/api/v1/roles');

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key,
        $te: key => key === 'app.role_labels.admin'
      },
      attachTo: createContainer()
    });

    await request.wait();
    await request.respondWith({
      status: 200,
      data: {
        data: [],
        meta: {
          per_page: 2,
          current_page: 1,
          total: 0
        }
      }
    });
    await view.vm.$nextTick();

    expect(view.findComponent(BButton).html()).toContain('settings.roles.new');

    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });
});
