import View from '../../../../../resources/js/views/settings/roles/View';
import { createLocalVue, mount } from '@vue/test-utils';
import PermissionService from '../../../../../resources/js/services/PermissionService';
import moxios from 'moxios';
import BootstrapVue, {
  IconsPlugin,
  BFormInput,
  BFormCheckbox,
  BOverlay,
  BForm,
  BFormInvalidFeedback, BButton, BModal, BFormRadio
} from 'bootstrap-vue';
import Vuex from 'vuex';
import sinon from 'sinon';
import Base from '../../../../../resources/js/api/base';
import VueRouter from 'vue-router';
import env from '../../../../../resources/js/env';
import _ from 'lodash';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(IconsPlugin);
localVue.use(Vuex);
localVue.use(VueRouter);

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

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};

let oldUser;

describe('RolesView', function () {
  beforeEach(function () {
    oldUser = PermissionService.currentUser;
    PermissionService.setCurrentUser({ permissions: ['roles.view', 'roles.create', 'roles.update', 'settings.manage'] });
    moxios.install();

    const permissionsResponse = {
      data: Array.from(Array(10).keys()).map(item => { return { id: item + 1, name: `tests.test${item + 1}` }; })
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
      store,
      attachTo: createContainer(),
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
      store,
      attachTo: createContainer()
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
      store,
      attachTo: createContainer()
    });

    moxios.wait(function () {
      expect(view.findAllComponents(BFormInput).wrappers.every(input => input.attributes('disabled'))).toBe(true);
      expect(view.findAllComponents(BFormCheckbox).wrappers.every(input => input.vm.isDisabled)).toBe(true);
      expect(view.findAllComponents(BFormRadio).wrappers.every(input => input.vm.isDisabled)).toBe(true);
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
      store,
      attachTo: createContainer()
    });

    view.vm.$nextTick().then(() => {
      expect(view.vm.isBusy).toBe(true);
      expect(view.findComponent(BOverlay).props('show')).toBe(true);

      moxios.wait(function () {
        expect(view.vm.isBusy).toBe(false);
        expect(view.findComponent(BOverlay).props('show')).toBe(false);

        let roomLimitDefaultRadio;
        let roomLimitUnlimitedRadio;
        let roomLimitCustomRadio;
        const permissionsCxs = view.findAllComponents(BFormCheckbox).wrappers;

        view.findAllComponents(BFormRadio).wrappers.forEach(radio => {
          if (radio.text().startsWith('settings.roles.roomLimit.default')) {
            roomLimitDefaultRadio = radio;
          } else if (radio.text().startsWith('settings.roles.roomLimit.unlimited')) {
            roomLimitUnlimitedRadio = radio;
          } else {
            roomLimitCustomRadio = radio;
          }
        });

        expect(roomLimitDefaultRadio.text()).toContain('settings.roles.roomlimit.unlimited');
        expect(roomLimitDefaultRadio.vm.isChecked).toBe(true);
        expect(roomLimitUnlimitedRadio.vm.isChecked).toBe(false);
        expect(roomLimitCustomRadio.vm.isChecked).toBe(false);
        permissionsCxs.forEach(checkbox => {
          expect(checkbox.text()).toBe(`app.permissions.tests.test${checkbox.props('value')}`);
        });
        expect(permissionsCxs[0].vm.isChecked).toBe(true);
        expect(permissionsCxs[9].vm.isChecked).toBe(true);

        roomLimitUnlimitedRadio.get('input').trigger('click');

        view.vm.$nextTick().then(() => {
          expect(roomLimitDefaultRadio.vm.isChecked).toBe(false);
          expect(roomLimitUnlimitedRadio.vm.isChecked).toBe(true);
          expect(roomLimitCustomRadio.vm.isChecked).toBe(false);
          expect(view.vm.model.room_limit).toBe(-1);

          roomLimitCustomRadio.get('input').trigger('click');

          view.vm.$nextTick().then(() => {
            expect(roomLimitDefaultRadio.vm.isChecked).toBe(false);
            expect(roomLimitUnlimitedRadio.vm.isChecked).toBe(false);
            expect(roomLimitCustomRadio.vm.isChecked).toBe(true);
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

    const restoreRoleResponse = overrideStub('/api/v1/roles/1', {
      status: 500,
      response: {
        message: 'Test'
      }
    });
    const restorePermissionsResponse = overrideStub('/api/v1/permissions', {
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
      store,
      attachTo: createContainer()
    });

    moxios.wait(function () {
      sinon.assert.calledTwice(Base.error);
      expect(view.vm.isBusy).toBe(false);
      expect(view.findComponent(BOverlay).props('show')).toBe(true);
      expect(view.html()).toContain('app.reload');
      expect(view.html()).toContain('settings.roles.noOptions');
      const saveButton = view.findAllComponents(BButton).filter(button => button.text() === 'app.save' && button.attributes('disabled'));
      expect(saveButton.wrappers.length).toBe(1);
      Base.error.restore();
      restoreRoleResponse();
      restorePermissionsResponse();
      done();
    });
  });

  it('back button causes a back navigation without persistence', function (done) {
    const spy = sinon.spy();

    const router = new VueRouter();
    router.push = spy;

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
      store,
      router,
      attachTo: createContainer()
    });

    const requestCount = moxios.requests.count();

    view.findAllComponents(BButton).filter(button => button.text() === 'app.back').at(0).trigger('click').then(() => {
      expect(moxios.requests.count()).toBe(requestCount);
      sinon.assert.calledOnce(spy);
      done();
    });
  });

  it('request with updates get send during saving the role', function (done) {
    const spy = sinon.spy();

    const router = new VueRouter();
    router.push = spy;

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
      store,
      router,
      attachTo: createContainer()
    });

    moxios.wait(function () {
      const permissionsCxs = view.findAllComponents(BFormCheckbox).wrappers;
      let roomLimitCustomRadio;

      view.findAllComponents(BFormRadio).wrappers.forEach(radio => {
        if (radio.text().startsWith('settings.roles.roomLimit.custom')) {
          roomLimitCustomRadio = radio;
        }
      });

      roomLimitCustomRadio.get('input').trigger('click');
      permissionsCxs[0].get('input').trigger('click');
      permissionsCxs[1].get('input').trigger('click');

      view.vm.$nextTick().then(() => {
        const inputs = view.findAllComponents(BFormInput).wrappers;

        return inputs[0].setValue('Test').then(() => {
          return inputs[1].setValue(10);
        });
      }).then(() => {
        view.findComponent(BForm).trigger('submit');

        let restoreRoleResponse = overrideStub('/api/v1/roles/1', {
          status: env.HTTP_UNPROCESSABLE_ENTITY,
          response: {
            message: 'The given data was invalid.',
            errors: {
              name: ['Test name'],
              room_limit: ['Test room limit'],
              permissions: ['Test permissions'],
              'permissions.0': ['Test permissions 0']
            }
          }
        });

        moxios.wait(function () {
          const request = moxios.requests.mostRecent();
          const data = JSON.parse(request.config.data);

          expect(data.name).toBe('Test');
          expect(data.room_limit).toBe('10');
          expect(data.permissions).toEqual([10, 2]);

          const feedback = view.findAllComponents(BFormInvalidFeedback).wrappers;
          expect(feedback[0].html()).toContain('Test name');
          expect(feedback[1].html()).toContain('Test room limit');
          expect(feedback[2].html()).toContain('Test permissions');
          expect(feedback[2].html()).toContain('Test permissions 0');

          restoreRoleResponse();
          restoreRoleResponse = overrideStub('/api/v1/roles/1', {
            status: 204
          });

          view.findComponent(BForm).trigger('submit');

          moxios.wait(function () {
            sinon.assert.calledOnce(spy);
            restoreRoleResponse();
            done();
          });
        });
      });
    });
  });

  it('modal gets shown for stale errors and a overwrite can be forced', function (done) {
    const spy = sinon.spy();

    const router = new VueRouter();
    router.push = spy;

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
        id: '1',
        modalStatic: true
      },
      store,
      router,
      attachTo: createContainer()
    });

    moxios.wait(function () {
      const newModel = _.cloneDeep(view.vm.model);
      newModel.updated_at = '2020-09-08 16:13:26';

      let restoreRoleResponse = overrideStub('/api/v1/roles/1', {
        status: env.HTTP_STALE_MODEL,
        response: {
          error: env.HTTP_STALE_MODEL,
          message: 'test',
          new_model: newModel
        }
      });

      view.findComponent(BForm).trigger('submit');

      moxios.wait(function () {
        const staleModelModal = view.findComponent({ ref: 'stale-role-modal' });
        expect(staleModelModal.vm.$data.isVisible).toBe(true);

        restoreRoleResponse();
        restoreRoleResponse = overrideStub('/api/v1/roles/1', {
          status: 204
        });

        staleModelModal.vm.$refs['ok-button'].click();

        moxios.wait(function () {
          const request = moxios.requests.mostRecent();
          const data = JSON.parse(request.config.data);

          expect(data.updated_at).toBe(newModel.updated_at);
          expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);

          done();
        });
      });
    });
  });

  it('modal gets shown for stale errors and the new model can be applied to current form', function (done) {
    const spy = sinon.spy();

    const router = new VueRouter();
    router.push = spy;

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
        id: '1',
        modalStatic: true
      },
      store,
      router,
      attachTo: createContainer()
    });

    moxios.wait(function () {
      const newModel = _.cloneDeep(view.vm.model);
      newModel.updated_at = '2020-09-08 16:13:26';
      newModel.name = 'Test';

      const restoreRoleResponse = overrideStub('/api/v1/roles/1', {
        status: env.HTTP_STALE_MODEL,
        response: {
          error: env.HTTP_STALE_MODEL,
          message: 'test',
          new_model: newModel
        }
      });

      view.findComponent(BForm).trigger('submit');

      moxios.wait(function () {
        const staleModelModal = view.findComponent({ ref: 'stale-role-modal' });
        expect(staleModelModal.vm.$data.isVisible).toBe(true);
        expect(view.findComponent(BFormInput).element.value).toBe('admin');

        restoreRoleResponse();

        staleModelModal.vm.$refs['cancel-button'].click();

        view.vm.$nextTick().then(() => {
          expect(view.findComponent(BFormInput).element.value).toBe('Test');
          expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
          done();
        });
      });
    });
  });

  it('reload overlay gets shown if an error occurs during load of permissions', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const restorePermissionsResponse = overrideStub('/api/v1/permissions', {
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
      store,
      attachTo: createContainer()
    });

    moxios.wait(function () {
      sinon.assert.calledOnce(Base.error);
      expect(view.findComponent(BOverlay).props('show')).toBe(true);
      expect(view.html()).toContain('app.reload');
      expect(view.html()).toContain('settings.roles.noOptions');
      const saveButton = view.findAllComponents(BButton).filter(button => button.text() === 'app.save' && button.attributes('disabled'));
      expect(saveButton.wrappers.length).toBe(1);
      Base.error.restore();
      restorePermissionsResponse();
      done();
    });
  });

  it('user gets redirected to index page if the role is not found', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const routerSpy = sinon.spy();

    const router = new VueRouter();
    router.push = routerSpy;

    const restoreRoleResponse = overrideStub('/api/v1/roles/1', {
      status: 404,
      response: {
        message: 'Test'
      }
    });

    mount(View, {
      localVue,
      mocks: {
        $t: (key) => key,
        $te: key => key === 'app.roles.admin' || key.startsWith('app.permissions.tests.test')
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      store,
      router,
      attachTo: createContainer()
    });

    moxios.wait(function () {
      sinon.assert.calledOnce(Base.error);
      sinon.assert.calledOnce(routerSpy);
      sinon.assert.calledWith(routerSpy, { name: 'settings.roles' });
      Base.error.restore();
      restoreRoleResponse();
      done();
    });
  });

  it('reload overlay gets shown if another error than 404 occurs during load of the role', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const restoreRoleResponse = overrideStub('/api/v1/roles/1', {
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
      store,
      attachTo: createContainer()
    });

    moxios.wait(function () {
      sinon.assert.calledOnce(Base.error);
      expect(view.findComponent(BOverlay).props('show')).toBe(true);
      expect(view.html()).toContain('app.reload');
      const saveButton = view.findAllComponents(BButton).filter(button => button.text() === 'app.save' && button.attributes('disabled'));
      expect(saveButton.wrappers.length).toBe(1);
      Base.error.restore();
      restoreRoleResponse();
      done();
    });
  });

  it('user gets redirected to index page if the role is not found during save', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const routerSpy = sinon.spy();

    const router = new VueRouter();
    router.push = routerSpy;

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
      store,
      router,
      attachTo: createContainer()
    });

    moxios.wait(function () {
      view.findComponent(BForm).trigger('submit');

      const restoreRoleResponse = overrideStub('/api/v1/roles/1', {
        status: 404,
        response: {
          message: 'Test'
        }
      });

      moxios.wait(function () {
        sinon.assert.calledOnce(Base.error);
        sinon.assert.calledOnce(routerSpy);
        sinon.assert.calledWith(routerSpy, { name: 'settings.roles' });
        Base.error.restore();
        restoreRoleResponse();
        done();
      });
    });
  });
});
