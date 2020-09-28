import View from '../../../../../resources/js/views/settings/roles/View';
import { createLocalVue, mount } from '@vue/test-utils';
import PermissionService from '../../../../../resources/js/services/PermissionService';
import moxios from 'moxios';
import BootstrapVue, { IconsPlugin, BFormInput } from 'bootstrap-vue';
import Multiselect from 'vue-multiselect';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(IconsPlugin);

let oldUser;

const permissionsResponse = {
  data: Array.from(Array(10).keys()).map(item => { return { id: item + 1, name: `tests.test${item + 1}` }; }),
  meta: {
    per_page: 5,
    current_page: 2,
    total: 10,
    last_page: 2
  }
};

const roleResponse = {
  data: {
    id: '1',
    name: 'admin',
    default: false,
    model_name: 'Role',
    room_limit: null,
    updated_at: '2020-09-08 15:13:26',
    permissions: [
      {
        id: 1,
        name: 'tests.test1'
      },
      {
        id: 10,
        name: 'tests.test10'
      }
    ]
  }
};

describe('RolesView', function () {
  beforeEach(function () {
    oldUser = PermissionService.currentUser;
    PermissionService.setCurrentUser({ permissions: ['roles.view', 'roles.create', 'roles.update', 'settings.manage'] });

    moxios.stubRequest('/api/v1/permissions', {
      status: 200,
      response: permissionsResponse
    });
    moxios.stubRequest('/api/v1/roles/1', {
      status: 200,
      response: roleResponse
    });

    moxios.install();
  });

  afterEach(function () {
    PermissionService.setCurrentUser(oldUser);
    moxios.uninstall();
  });

  it('role name in title gets translated for detail view', function (done) {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key === 'settings.roles.view' ? `${key} ${values.name}` : key,
        $te: key => key === 'app.roles.admin' || key.startsWith('app.permissions.tests.test')
      },
      propsData: {
        viewOnly: true,
        id: '1'
      }
    });

    moxios.wait(function () {
      expect(view.html()).toContain('settings.roles.view app.roles.admin');
      done();
    });
  });

  it('role name in title gets translated for update view', function (done) {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key === 'settings.roles.edit' ? `${key} ${values.name}` : key,
        $te: key => key === 'app.roles.admin' || key.startsWith('app.permissions.tests.test')
      },
      propsData: {
        viewOnly: false,
        id: '1'
      }
    });

    moxios.wait(function () {
      expect(view.html()).toContain('settings.roles.edit app.roles.admin');
      done();
    });
  });

  it('input fields are disabled if the role is displayed in view mode', function (done) {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key === 'settings.roles.view' ? `${key} ${values.name}` : key,
        $te: key => key === 'app.roles.admin' || key.startsWith('app.permissions.tests.test')
      },
      propsData: {
        viewOnly: true,
        id: '1'
      }
    });

    moxios.wait(function () {
      expect(view.findAllComponents(BFormInput).wrappers.every(input => input.attributes('disabled'))).toBe(true);
      expect(view.findComponent(Multiselect).props('disabled')).toBe(true);
      done();
    });
  });

  it('data gets loaded for update view of a role', function () {

  });

  it('loading indicator gets displayed during load of data', function () {

  });

  it('error handler gets called if an error occurs during load of data', function () {

  });

  it('back button causes a back navigation without persistence', function () {

  });

  it('request with updates get send during saving the role', function () {

  });

  it('validation errors gets shown for the appropriate fields', function () {

  });

  it('modal gets shown for stale errors and a overwrite can be forced', function () {

  });

  it('modal gets shown for stale errors and the new model can be applied to current form', function () {

  });
});
