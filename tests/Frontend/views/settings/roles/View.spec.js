import View from '../../../../../resources/js/views/settings/roles/View';
import { createLocalVue, mount } from '@vue/test-utils';
import PermissionService from '../../../../../resources/js/services/PermissionService';
import moxios from 'moxios';
import BootstrapVue, { IconsPlugin, BFormInput, BFormCheckbox, BOverlay } from 'bootstrap-vue';
import Vuex from 'vuex';
import sinon from 'sinon';
import Base from '../../../../../resources/js/api/base';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(IconsPlugin);
localVue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    session: {
      namespaced: true,
      getters: {
        settings: () => (setting) => setting === 'room_limit' ? -1 : null
      }
    }
  }
});

function overrideStub (url, response) {
  const l = moxios.stubs.count();
  for (let i = 0; i < l; i++) {
    const stub = moxios.stubs.at(i);
    if (stub.url === url) {
      const oldResponse = stub.response;
      const restoreFunc = () => { stub.response = oldResponse; };

      stub.response = response;
      return restoreFunc;
    }
  }
}

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
    moxios.install();

    moxios.stubRequest('/api/v1/permissions', {
      status: 200,
      response: permissionsResponse
    });
    moxios.stubRequest('/api/v1/roles/1', {
      status: 200,
      response: roleResponse
    });
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
      },
      store
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
      },
      store
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
      },
      store
    });

    moxios.wait(function () {
      expect(view.findAllComponents(BFormInput).wrappers.every(input => input.attributes('disabled'))).toBe(true);
      expect(view.findAllComponents(BFormCheckbox).wrappers.every(input => input.vm.isDisabled)).toBe(true);
      done();
    });
  });

  it('data gets loaded for update view of a role', function (done) {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => {
          if (key === 'settings.roles.edit') { return `${key} ${values.name}`; }
          if (key === 'settings.roles.roomLimit.default') { return `${key} ${values.value}`; }
          return key;
        },
        $te: key => key === 'app.roles.admin' || key.startsWith('app.permissions.tests.test')
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      store
    });

    view.vm.$nextTick().then(() => {
      expect(view.vm.isBusy).toBe(true);
      expect(view.findComponent(BOverlay).props('show')).toBe(true);

      moxios.wait(function () {
        expect(view.vm.isBusy).toBe(false);
        expect(view.findComponent(BOverlay).props('show')).toBe(false);

        let roomLimitDefaultCx;
        let roomLimitUnlimitedCx;
        let permissionsCxs = [];

        view.findAllComponents(BFormCheckbox).wrappers.forEach(checkbox => {
          if (checkbox.text().startsWith('settings.roles.roomLimit.default')) {
            roomLimitDefaultCx = checkbox;
          } else if (checkbox.text().startsWith('settings.roles.roomLimit.unlimited')) {
            roomLimitUnlimitedCx = checkbox;
          } else {
            permissionsCxs.push(checkbox);
          }
        });

        expect(roomLimitDefaultCx.text()).toContain('settings.roles.roomlimit.unlimited');
        expect(roomLimitDefaultCx.vm.isChecked).toBe(true);
        expect(roomLimitUnlimitedCx.vm.isChecked).toBe(false);
        permissionsCxs.forEach(checkbox => {
          expect(checkbox.text()).toBe(`app.permissions.tests.test${checkbox.props('value')}`);
        });
        expect(permissionsCxs[0].vm.isChecked).toBe(true);
        expect(permissionsCxs[9].vm.isChecked).toBe(true);

        roomLimitUnlimitedCx.get('input').trigger('click');

        view.vm.$nextTick().then(() => {
          expect(roomLimitDefaultCx.vm.isChecked).toBe(false);
          expect(roomLimitUnlimitedCx.vm.isChecked).toBe(true);
          expect(view.vm.model.room_limit).toBe(-1);

          roomLimitUnlimitedCx.get('input').trigger('click');

          view.vm.$nextTick().then(() => {
            expect(roomLimitDefaultCx.vm.isChecked).toBe(false);
            expect(roomLimitUnlimitedCx.vm.isChecked).toBe(false);
            expect(view.vm.model.room_limit).toBe(0);
            done();
          });
        });
      });
    });
  });

  it('error handler gets called if an error occurs during load of data', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    overrideStub('/api/v1/roles/1', {
      status: 500,
      response: {
        message: 'Test'
      }
    });
    overrideStub('/api/v1/permissions', {
      status: 500,
      response: {
        message: 'Test'
      }
    });

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key,
        $te: key => key === 'app.roles.admin' || key.startsWith('app.permissions.tests.test')
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      store
    });

    moxios.wait(function () {
      sinon.assert.calledTwice(Base.error);
      Base.error.restore();
      expect(view.vm.isBusy).toBe(false);
      expect(view.findComponent(BOverlay).props('show')).toBe(false);
      expect(view.html()).toContain('settings.roles.noOptions');
      done();
    });
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
