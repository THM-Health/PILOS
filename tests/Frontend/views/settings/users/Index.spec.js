import { mount } from '@vue/test-utils';
import { BButton, BButtonClose, BTbody, BTr } from 'bootstrap-vue';

import PermissionService from '../../../../../resources/js/services/PermissionService';
import Index from '../../../../../resources/js/views/settings/users/Index.vue';
import Base from '../../../../../resources/js/api/base';
import { Multiselect } from 'vue-multiselect';
import { mockAxios, createContainer, createLocalVue } from '../../../helper';
import { useSettingsStore } from '../../../../../resources/js/stores/settings';
import { createTestingPinia } from '@pinia/testing';
import { PiniaVuePlugin } from 'pinia';

const localVue = createLocalVue();
localVue.use(PiniaVuePlugin);

describe('UsersIndex', () => {
  beforeEach(() => {
    mockAxios.reset();

    mockAxios.request('/api/v1/roles').respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 1,
            name: 'admin',
            default: true,
            updated_at: '2021-01-08T15:51:08.000000Z',
            model_name: 'Role',
            room_limit: -1
          },
          {
            id: 2,
            name: 'Staff',
            default: false,
            updated_at: '2021-03-19T09:12:44.000000Z',
            model_name: 'Role',
            room_limit: 20
          },
          {
            id: 3,
            name: 'Students',
            default: false,
            updated_at: '2021-05-22T11:55:21.000000Z',
            model_name: 'Role',
            room_limit: 1
          }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 2,
          per_page: 3,
          to: 3,
          total: 6
        }
      }
    });
  });

  it('list of users with pagination gets displayed', async () => {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['users.viewAny', 'settings.manage'] });

    let request = mockAxios.request('/api/v1/users');

    const view = mount(Index, {
      pinia: createTestingPinia({ initialState: { settings: { settings: { auth: { local: true } } } } }),
      localVue,
      mocks: {
        $t: key => key,
        $te: (key) => key === 'app.role_lables.admin'
      },
      attachTo: createContainer()
    });

    await request.wait();
    expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');
    await request.respondWith({
      status: 200,
      data: {
        data: [{
          id: 1,
          authenticator: 'local',
          email: 'john@doe.com',
          external_id: 'jdo',
          firstname: 'John',
          lastname: 'Doe',
          user_locale: 'en',
          model_name: 'User',
          roles: [
            { id: 3, name: 'Students', automatic: true },
            { id: 1, name: 'admin', automatic: false }
          ],
          room_limit: 0,
          updated_at: '2020-01-01T01:00:00.000000Z'
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

    expect(html).toContain('1');
    expect(html).toContain('John');
    expect(html).toContain('Doe');
    expect(html).toContain('john@doe.com');
    expect(html).toContain('Students');
    expect(html).toContain('app.role_lables.admin');
    expect(html).toContain('settings.users.authenticator.local');

    request = mockAxios.request('/api/v1/users');

    view.vm.$root.$emit('bv::refresh::table', 'users-table');

    await request.wait();
    expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

    await request.respondWith({
      status: 200,
      data: {
        data: [{
          id: 2,
          authenticator: 'external',
          email: 'darth@vader.com',
          external_id: 'dvr',
          firstname: 'Darth',
          lastname: 'Vader',
          user_locale: 'de',
          model_name: 'User',
          roles: [
            { id: 3, name: 'Students', automatic: true }
          ],
          room_limit: 0,
          updated_at: '2020-01-01T01:00:00.000000Z'
        }],
        meta: {
          per_page: 1,
          current_page: 1,
          total: 1
        }
      }
    });

    html = view.findComponent(BTbody).findComponent(BTr).html();
    expect(html).toContain('2');
    expect(html).toContain('Darth');
    expect(html).toContain('Vader');
    expect(html).toContain('Students');
    expect(html).toContain('darth@vader.com');
    expect(html).toContain('settings.users.authenticator.external');

    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('reset password button only shown if the user has the permission and local users are enabled and it handles errors as expected', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ id: 4, permissions: ['users.viewAny', 'settings.manage'] });

    mockAxios.request('/api/v1/users').respondWith({
      status: 200,
      data: {
        data: [{
          id: 1,
          authenticator: 'local',
          email: 'john@doe.com',
          external_id: 'jdo',
          firstname: 'John',
          lastname: 'Doe',
          user_locale: 'en',
          model_name: 'User',
          room_limit: 0,
          updated_at: '2020-01-01T01:00:00.000000Z'
        }, {
          id: 2,
          authenticator: 'local',
          email: 'john1@doe.com',
          external_id: 'jdo',
          firstname: 'John',
          lastname: 'Doe',
          user_locale: 'en',
          model_name: 'User',
          room_limit: 0,
          updated_at: '2020-01-01T01:00:00.000000Z',
          initial_password_set: true
        }, {
          id: 3,
          authenticator: 'external',
          email: 'darth@vader.com',
          external_id: 'dvr',
          firstname: 'Darth',
          lastname: 'Vader',
          user_locale: 'de',
          model_name: 'User',
          room_limit: 0,
          updated_at: '2020-01-01T01:00:00.000000Z'
        }],
        meta: {
          per_page: 3,
          current_page: 1,
          total: 3
        }
      }
    });

    const view = mount(Index, {
      pinia: createTestingPinia({ initialState: { settings: { settings: { auth: { local: true } } } } }),
      localVue,
      mocks: {
        $t: key => key,
        $te: (key) => key === 'app.role_lables.admin'
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      }
    });

    const settings = useSettingsStore();

    await mockAxios.wait();
    await view.vm.$nextTick();

    view.findComponent(BTbody).findAllComponents(BTr).wrappers.forEach((row) => {
      expect(row.findAllComponents(BButton).length).toEqual(0);
    });

    PermissionService.setCurrentUser({
      id: 4,
      permissions: ['users.viewAny', 'settings.manage', 'users.update']
    });

    await view.vm.$nextTick();

    const rows = view.findComponent(BTbody).findAllComponents(BTr);
    expect(rows.at(0).findAllComponents(BButton).length).toEqual(2);
    expect(rows.at(1).findAllComponents(BButton).length).toEqual(1);
    expect(rows.at(2).findAllComponents(BButton).length).toEqual(1);

    rows.at(0).findAllComponents(BButton).filter(button => {
      return button.attributes('id') === 'resetPassword1';
    }).at(0).trigger('click');

    await view.vm.$nextTick();

    expect(view.findComponent({ ref: 'reset-user-password-modal' }).vm.$data.isVisible).toBe(true);

    const resetPasswordRequest = mockAxios.request('/api/v1/users/1/resetPassword');

    view.findComponent({ ref: 'reset-user-password-modal' }).vm.$refs['ok-button'].click();

    await resetPasswordRequest.wait();
    await resetPasswordRequest.respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });
    await view.vm.$nextTick();

    expect(view.findComponent({ ref: 'reset-user-password-modal' }).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.userToResetPassword).toBeUndefined();
    expect(spy).toBeCalledTimes(1);

    // Check if reset password button is hidden if local users are disabled
    settings.settings.auth.local = false;
    await view.vm.$nextTick();
    expect(rows.at(0).findAllComponents(BButton).length).toEqual(1);
    expect(rows.at(0).findAllComponents(BButton).at(0).html()).toContain('fa-edit');

    // Check if reset password button is shown if local users are enabled
    settings.settings.auth.local = true;
    await view.vm.$nextTick();
    expect(rows.at(0).findAllComponents(BButton).length).toEqual(2);
    expect(rows.at(0).findAllComponents(BButton).at(0).html()).toContain('fa-edit');
    expect(rows.at(0).findAllComponents(BButton).at(1).html()).toContain('fa-key');

    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('reset password works as expected', async () => {
    const toastSuccessSpy = vi.fn();
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({
      id: 4,
      permissions: ['users.viewAny', 'settings.manage', 'users.update']
    });

    mockAxios.request('/api/v1/users').respondWith({
      status: 200,
      data: {
        data: [{
          id: 1,
          authenticator: 'local',
          email: 'john@doe.com',
          external_id: 'jdo',
          firstname: 'John',
          lastname: 'Doe',
          user_locale: 'en',
          model_name: 'User',
          room_limit: 0,
          updated_at: '2020-01-01T01:00:00.000000Z'
        }, {
          id: 2,
          authenticator: 'local',
          email: 'john1@doe.com',
          external_id: 'jdo',
          firstname: 'John',
          lastname: 'Doe',
          user_locale: 'en',
          model_name: 'User',
          room_limit: 0,
          updated_at: '2020-01-01T01:00:00.000000Z',
          initial_password_set: true
        }, {
          id: 3,
          authenticator: 'external',
          email: 'darth@vader.com',
          external_id: 'dvr',
          firstname: 'Darth',
          lastname: 'Vader',
          user_locale: 'de',
          model_name: 'User',
          room_limit: 0,
          updated_at: '2020-01-01T01:00:00.000000Z'
        }],
        meta: {
          per_page: 3,
          current_page: 1,
          total: 3
        }
      }
    });

    const view = mount(Index, {
      pinia: createTestingPinia({ initialState: { settings: { settings: { auth: { local: true } } } } }),
      localVue,
      mocks: {
        $t: key => key,
        $te: (key) => key === 'app.role_lables.admin',
        toastSuccess: toastSuccessSpy
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      }
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    await view.findComponent(BTbody).findComponent(BTr).findAllComponents(BButton).filter(button => {
      return button.attributes('id') === 'resetPassword1';
    }).at(0).trigger('click');

    await view.vm.$nextTick();

    expect(view.findComponent({ ref: 'reset-user-password-modal' }).vm.$data.isVisible).toBe(true);

    const resetPasswordRequest = mockAxios.request('/api/v1/users/1/resetPassword');

    view.findComponent({ ref: 'reset-user-password-modal' }).vm.$refs['ok-button'].click();

    await resetPasswordRequest.wait();
    await resetPasswordRequest.respondWith({
      status: 200
    });
    expect(toastSuccessSpy).toBeCalledTimes(1);
    expect(toastSuccessSpy.mock.calls[0][0]).toEqual('settings.users.password_reset_success');
    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('update and delete buttons only shown if user has the permission', async () => {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ id: 1, permissions: ['users.viewAny', 'settings.manage'] });

    mockAxios.request('/api/v1/users').respondWith({
      status: 200,
      data: {
        data: [{
          id: 1,
          authenticator: 'local',
          email: 'john@doe.com',
          external_id: 'jdo',
          firstname: 'John',
          lastname: 'Doe',
          user_locale: 'en',
          model_name: 'User',
          room_limit: 0,
          updated_at: '2020-01-01T01:00:00.000000Z'
        }, {
          id: 2,
          authenticator: 'external',
          email: 'darth@vader.com',
          external_id: 'dvr',
          firstname: 'Darth',
          lastname: 'Vader',
          user_locale: 'de',
          model_name: 'User',
          room_limit: 0,
          updated_at: '2020-01-01T01:00:00.000000Z'
        }],
        meta: {
          per_page: 2,
          current_page: 1,
          total: 2
        }
      }
    });

    const view = mount(Index, {
      pinia: createTestingPinia({ initialState: { settings: { settings: { auth: { local: true } } } } }),
      localVue,
      mocks: {
        $t: key => key,
        $te: (key) => key === 'app.role_lables.admin'
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    view.findComponent(BTbody).findAllComponents(BTr).wrappers.forEach((row) => {
      expect(row.findAllComponents(BButton).length).toEqual(0);
    });

    PermissionService.setCurrentUser({
      id: 1,
      permissions: ['users.viewAny', 'settings.manage', 'users.update', 'users.view', 'users.delete']
    });

    await view.vm.$nextTick();

    const rows = view.findComponent(BTbody).findAllComponents(BTr);
    expect(rows.at(0).findAllComponents(BButton).length).toEqual(2);
    expect(rows.at(1).findAllComponents(BButton).length).toEqual(3);

    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('error handler gets called if an error occurs during loading of data', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    mockAxios.request('/api/v1/users').respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    const view = mount(Index, {
      pinia: createTestingPinia({ initialState: { settings: { settings: { auth: { local: true } } } } }),
      localVue,
      mocks: {
        $t: key => key,
        $te: (key) => key === 'app.role_lables.admin'
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(spy).toBeCalledTimes(1);

    view.destroy();
  });

  it('not own users can be deleted', async () => {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ id: 1, permissions: ['users.viewAny', 'settings.manage', 'users.delete'] });

    mockAxios.request('/api/v1/users').respondWith({
      status: 200,
      data: {
        data: [{
          id: 2,
          authenticator: 'external',
          email: 'darth@vader.com',
          external_id: 'dvr',
          firstname: 'Darth',
          lastname: 'Vader',
          user_locale: 'de',
          model_name: 'User',
          room_limit: 0,
          updated_at: '2020-01-01T01:00:00.000000Z'
        }],
        meta: {
          per_page: 2,
          current_page: 1,
          total: 1
        }
      }
    });

    const view = mount(Index, {
      pinia: createTestingPinia({ initialState: { settings: { settings: { auth: { local: true } } } } }),
      localVue,
      mocks: {
        $t: key => key,
        $te: (key) => key === 'app.role_lables.admin'
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      }
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.findComponent({ ref: 'delete-user-modal' }).vm.$data.isVisible).toBe(false);
    view.findComponent(BTbody).findComponent(BTr).findComponent(BButton).trigger('click');

    await view.vm.$nextTick();

    expect(view.findComponent({ ref: 'delete-user-modal' }).vm.$data.isVisible).toBe(true);

    const deleteRequest = mockAxios.request('/api/v1/users/2', 'delete');

    view.findComponent({ ref: 'delete-user-modal' }).vm.$refs['ok-button'].click();

    await deleteRequest.wait();

    const reloadRquest = mockAxios.request('/api/v1/users');

    await deleteRequest.respondWith({ status: 204 });
    expect(view.findComponent({ ref: 'delete-user-modal' }).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.userToDelete).toBeUndefined();

    await reloadRquest.wait();
    await reloadRquest.respondWith({
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

    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('property gets cleared correctly if deletion gets aborted', async () => {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['users.viewAny', 'settings.manage', 'users.delete'] });

    mockAxios.request('/api/v1/users').respondWith({
      status: 200,
      data: {
        data: [{
          id: 2,
          authenticator: 'external',
          email: 'darth@vader.com',
          external_id: 'dvr',
          firstname: 'Darth',
          lastname: 'Vader',
          user_locale: 'de',
          model_name: 'User',
          room_limit: 0,
          updated_at: '2020-01-01T01:00:00.000000Z'
        }],
        meta: {
          per_page: 2,
          current_page: 1,
          total: 1
        }
      }
    });

    const view = mount(Index, {
      pinia: createTestingPinia({ initialState: { settings: { settings: { auth: { local: true } } } } }),
      localVue,
      mocks: {
        $t: key => key,
        $te: (key) => key === 'app.role_lables.admin'
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      }
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    expect(view.findComponent({ ref: 'delete-user-modal' }).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.userToDelete).toBeUndefined();
    view.findComponent(BTbody).findComponent(BTr).findComponent(BButton).trigger('click');

    await view.vm.$nextTick();

    expect(view.findComponent({ ref: 'delete-user-modal' }).vm.$data.isVisible).toBe(true);
    expect(view.vm.$data.userToDelete.id).toEqual(2);
    view.findComponent({ ref: 'delete-user-modal' }).findComponent(BButtonClose).trigger('click');

    await view.vm.$nextTick();

    expect(view.findComponent({ ref: 'delete-user-modal' }).vm.$data.isVisible).toBe(false);
    expect(view.vm.$data.userToDelete).toBeUndefined();

    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('new user button is displayed if the user has the corresponding permissions and local users are enabled', async () => {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['users.viewAny', 'settings.manage', 'users.create'] });

    mockAxios.request('/api/v1/users').respondWith({
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

    const view = mount(Index, {
      pinia: createTestingPinia({ initialState: { settings: { settings: { auth: { local: true } } } } }),
      localVue,
      mocks: {
        $t: key => key,
        $te: (key) => key === 'app.role_lables.admin'
      },
      attachTo: createContainer()
    });

    const settings = useSettingsStore();

    await mockAxios.wait();
    await view.vm.$nextTick();

    const newButton = view.findComponent({ ref: 'new-user-button' });
    expect(newButton.html()).toContain('settings.users.new');
    expect(newButton.props('to')).toEqual({ name: 'settings.users.new' });

    // Check if button is hidden if user has no permission
    PermissionService.setCurrentUser({ permissions: ['users.viewAny', 'settings.manage'] });
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'new-user-button' }).exists()).toBeFalsy();
    PermissionService.setCurrentUser({ permissions: ['users.viewAny', 'settings.manage', 'users.create'] });

    // Check if button is hidden if local users are disabled
    settings.settings.auth.local = false;
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'new-user-button' }).exists()).toBeFalsy();

    // Check if button is shown if local users are enabled
    settings.settings.auth.local = true;
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'new-user-button' }).exists()).toBeTruthy();

    view.destroy();
    PermissionService.setCurrentUser(oldUser);
  });

  it('role filter', async () => {
    let request = mockAxios.request('/api/v1/users');

    PermissionService.setCurrentUser({ permissions: ['users.viewAny', 'settings.manage'] });
    const view = mount(Index, {
      pinia: createTestingPinia({ initialState: { settings: { settings: { auth: { local: true } } } } }),
      localVue,
      mocks: {
        $t: key => key,
        $te: (key) => key === 'app.role_lables.admin'
      },
      attachTo: createContainer()
    });

    await request.wait();

    expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

    await request.respondWith({
      status: 200,
      data: {
        data: [{
          id: 1,
          authenticator: 'local',
          email: 'john@doe.com',
          external_id: 'jdo',
          firstname: 'John',
          lastname: 'Doe',
          user_locale: 'en',
          model_name: 'User',
          roles: [
            { id: 3, name: 'Students', automatic: true },
            { id: 1, name: 'admin', automatic: false }
          ],
          room_limit: 0,
          updated_at: '2020-01-01T01:00:00.000000Z'
        }],
        meta: {
          per_page: 1,
          current_page: 1,
          total: 1
        }
      }
    });

    const roleSelector = view.findComponent(Multiselect);
    const roleOptions = roleSelector.findAll('li');

    // check drop down values
    expect(roleOptions.at(0).html()).toContain('app.role_lables.admin');
    expect(roleOptions.at(1).html()).toContain('Staff');
    expect(roleOptions.at(2).html()).toContain('Students');

    // check pagination
    let paginationButtons = roleSelector.findAllComponents(BButton);
    expect(paginationButtons.at(0).attributes('disabled')).toBe('disabled');
    expect(paginationButtons.at(1).attributes('disabled')).toBeUndefined();

    const rolesRequest = mockAxios.request('/api/v1/roles', { page: 2 });

    // test navigate to next page
    await paginationButtons.at(1).trigger('click');

    // dropdown show loading spinner during load
    expect(roleSelector.props('loading')).toBeTruthy();
    await rolesRequest.wait();
    await rolesRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 4,
            name: 'Dean',
            default: false,
            updated_at: '2021-01-08T15:51:08.000000Z',
            model_name: 'Role',
            room_limit: 20
          },
          {
            id: 5,
            name: 'Faculty',
            default: false,
            updated_at: '2021-03-19T09:12:44.000000Z',
            model_name: 'Role',
            room_limit: 20
          },
          {
            id: 6,
            name: 'Manager',
            default: false,
            updated_at: '2021-05-22T11:55:21.000000Z',
            model_name: 'Role',
            room_limit: -1
          }
        ],
        meta: {
          current_page: 2,
          from: 4,
          last_page: 2,
          per_page: 3,
          to: 6,
          total: 6
        }
      }
    });

    // check drop down values
    expect(roleOptions.at(0).html()).toContain('Dean');
    expect(roleOptions.at(1).html()).toContain('Faculty');
    expect(roleOptions.at(2).html()).toContain('Manager');

    // check pagination
    paginationButtons = roleSelector.findAllComponents(BButton);
    expect(paginationButtons.at(0).attributes('disabled')).toBeUndefined();
    expect(paginationButtons.at(1).attributes('disabled')).toBe('disabled');

    // check clear roles button and select option
    expect(view.findComponent({ ref: 'clearRolesButton' }).exists()).toBeFalsy();
    request = mockAxios.request('/api/v1/users');
    await roleOptions.at(0).find('span').trigger('click');

    expect(view.findComponent({ ref: 'clearRolesButton' }).exists()).toBeTruthy();

    await request.wait();
    expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

    expect(request.config.params.role).toBe(4);

    await request.respondWith({
      status: 200,
      data: {
        data: [{
          id: 1,
          authenticator: 'local',
          email: 'john@doe.com',
          external_id: 'jdo',
          firstname: 'John',
          lastname: 'Doe',
          user_locale: 'en',
          model_name: 'User',
          roles: [
            { id: 4, name: 'Dean', automatic: false }
          ],
          room_limit: 0,
          updated_at: '2020-01-01T01:00:00.000000Z'
        }],
        meta: {
          per_page: 1,
          current_page: 1,
          total: 1
        }
      }
    });

    // select other role
    request = mockAxios.request('/api/v1/users');
    await roleOptions.at(1).find('span').trigger('click');
    await request.wait();
    expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

    expect(request.config.params.role).toBe(5);
    await request.respondWith({
      status: 200,
      data: {
        data: [],
        meta: {
          per_page: 1,
          current_page: 1,
          total: 0
        }
      }
    });

    // clear role
    request = mockAxios.request('/api/v1/users');
    await view.findComponent({ ref: 'clearRolesButton' }).trigger('click');
    await request.wait();
    expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

    expect(request.config.params.role).toBeUndefined();
    view.destroy();
  });

  it('role filter error', async () => {
    mockAxios.reset();
    mockAxios.request('/api/v1/roles').respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    const request = mockAxios.request('/api/v1/users');

    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    PermissionService.setCurrentUser({ permissions: ['users.viewAny', 'settings.manage'] });
    const view = mount(Index, {
      pinia: createTestingPinia({ initialState: { settings: { settings: { auth: { local: true } } } } }),
      localVue,
      mocks: {
        $t: key => key,
        $te: (key) => key === 'app.role_lables.admin'
      },
      attachTo: createContainer()
    });

    await request.wait();

    expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

    await request.respondWith({
      status: 200,
      data: {
        data: [{
          id: 1,
          authenticator: 'local',
          email: 'john@doe.com',
          external_id: 'jdo',
          firstname: 'John',
          lastname: 'Doe',
          user_locale: 'en',
          model_name: 'User',
          roles: [
            { id: 3, name: 'Students', automatic: true },
            { id: 1, name: 'admin', automatic: false }
          ],
          room_limit: 0,
          updated_at: '2020-01-01T01:00:00.000000Z'
        }],
        meta: {
          per_page: 1,
          current_page: 1,
          total: 1
        }
      }
    });
    await view.vm.$nextTick();

    // check error for role loading failed
    expect(spy).toBeCalledTimes(1);

    // check if role selector disabled
    const roleSelector = view.findComponent(Multiselect);
    expect(roleSelector.vm.disabled).toBe(true);

    // check reload button visible
    expect(view.findComponent({ ref: 'reloadRolesButton' }).exists()).toBeTruthy();

    // change response to a valid response
    const rolesRequest = mockAxios.request('/api/v1/roles', { page: 1 });

    // reload roles list
    await view.findComponent({ ref: 'reloadRolesButton' }).trigger('click');
    expect(roleSelector.props('loading')).toBeTruthy();

    await rolesRequest.wait();
    await rolesRequest.respondWith({
      status: 200,
      data: {
        data: [
          {
            id: 1,
            name: 'admin',
            default: true,
            updated_at: '2021-01-08T15:51:08.000000Z',
            model_name: 'Role',
            room_limit: -1
          },
          {
            id: 2,
            name: 'Staff',
            default: false,
            updated_at: '2021-03-19T09:12:44.000000Z',
            model_name: 'Role',
            room_limit: 20
          },
          {
            id: 3,
            name: 'Students',
            default: false,
            updated_at: '2021-05-22T11:55:21.000000Z',
            model_name: 'Role',
            room_limit: 1
          }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 2,
          per_page: 3,
          to: 3,
          total: 6
        }
      }
    });
    await view.vm.$nextTick();

    expect(roleSelector.props('loading')).toBeFalsy();

    // check if reload button hidden after a successfully request
    expect(view.findComponent({ ref: 'reloadRolesButton' }).exists()).toBeFalsy();

    // check drop down values
    const roleOptions = roleSelector.findAll('li');
    expect(roleOptions.at(0).html()).toContain('app.role_lables.admin');
    expect(roleOptions.at(1).html()).toContain('Staff');
    expect(roleOptions.at(2).html()).toContain('Students');

    view.destroy();
  });
});
