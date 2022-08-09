import View from '../../../../../resources/js/views/settings/roles/View';
import { createLocalVue, mount } from '@vue/test-utils';
import PermissionService from '../../../../../resources/js/services/PermissionService';
import moxios from 'moxios';
import BootstrapVue, {

  BFormInput,
  BFormCheckbox,
  BOverlay,
  BForm,
  BFormInvalidFeedback, BButton, BModal, BFormRadio
} from 'bootstrap-vue';
import Vuex from 'vuex';
import Base from '../../../../../resources/js/api/base';
import VueRouter from 'vue-router';
import env from '../../../../../resources/js/env';
import _ from 'lodash';
import { waitMoxios, overrideStub, createContainer } from '../../../helper';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
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

let oldUser;

describe('RolesView', () => {
  beforeEach(() => {
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
        updated_at: '2020-09-08T15:13:26.000000Z',
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

  afterEach(() => {
    PermissionService.setCurrentUser(oldUser);
    moxios.uninstall();
  });

  it('role name in title gets translated for detail view', async () => {
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

    await waitMoxios();
    expect(view.html()).toContain('settings.roles.view app.roles.admin');
    view.destroy();
  });

  it('role name in title gets translated for update view', async () => {
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

    await waitMoxios();
    expect(view.html()).toContain('settings.roles.edit app.roles.admin');
    view.destroy();
  });

  it('input fields are disabled if the role is displayed in view mode', async () => {
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

    await waitMoxios();
    expect(view.findAllComponents(BFormInput).wrappers.every(input => input.attributes('disabled'))).toBe(true);
    expect(view.findAllComponents(BFormCheckbox).wrappers.every(input => input.vm.isDisabled)).toBe(true);
    expect(view.findAllComponents(BFormRadio).wrappers.every(input => input.vm.isDisabled)).toBe(true);
    view.destroy();
  });

  it('data gets loaded for update view of a role', async () => {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => {
          if (key === 'settings.roles.edit') {
            return `${key} ${values.name}`;
          }
          if (key === 'settings.roles.roomLimit.default') {
            return `${key} ${values.value}`;
          }
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

    await view.vm.$nextTick();
    expect(view.vm.isBusy).toBe(true);
    expect(view.findComponent(BOverlay).props('show')).toBe(true);

    await waitMoxios();
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
      expect(checkbox.element.parentElement.parentElement.children[0].children[0].innerHTML).toBe(`app.permissions.tests.test${checkbox.props('value')}`);
    });
    expect(permissionsCxs[0].vm.isChecked).toBe(true);
    expect(permissionsCxs[9].vm.isChecked).toBe(true);

    roomLimitUnlimitedRadio.get('input').trigger('click');

    await view.vm.$nextTick();
    expect(roomLimitDefaultRadio.vm.isChecked).toBe(false);
    expect(roomLimitUnlimitedRadio.vm.isChecked).toBe(true);
    expect(roomLimitCustomRadio.vm.isChecked).toBe(false);
    expect(view.vm.model.room_limit).toBe(-1);

    roomLimitCustomRadio.get('input').trigger('click');

    await view.vm.$nextTick();
    expect(roomLimitDefaultRadio.vm.isChecked).toBe(false);
    expect(roomLimitUnlimitedRadio.vm.isChecked).toBe(false);
    expect(roomLimitCustomRadio.vm.isChecked).toBe(true);
    expect(view.vm.model.room_limit).toBe(0);
    view.destroy();
  });

  it('error handler gets called if an error occurs during load of data', async () => {
    const spy = jest.spyOn(Base, 'error').mockImplementation();

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

    await waitMoxios();
    expect(spy).toBeCalledTimes(2);
    expect(view.vm.isBusy).toBe(false);
    expect(view.findComponent(BOverlay).props('show')).toBe(true);
    expect(view.html()).toContain('app.reload');
    expect(view.html()).toContain('settings.roles.noOptions');
    const saveButton = view.findAllComponents(BButton).filter(button => button.text() === 'app.save' && button.attributes('disabled'));
    expect(saveButton.wrappers.length).toBe(1);

    restoreRoleResponse();
    restorePermissionsResponse();
    view.destroy();
  });

  it('back button causes a back navigation without persistence', async () => {
    const spy = jest.fn();

    const router = new VueRouter();
    router.push = spy;

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => {
          if (key === 'settings.roles.edit') {
            return `${key} ${values.name}`;
          }
          if (key === 'settings.roles.roomLimit.default') {
            return `${key} ${values.value}`;
          }
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

    await waitMoxios();
    const requestCount = moxios.requests.count();

    await view.findAllComponents(BButton).filter(button => button.text() === 'app.back').at(0).trigger('click');
    expect(moxios.requests.count()).toBe(requestCount);
    expect(spy).toBeCalledTimes(1);
    view.destroy();
  });

  it('request with updates get send during saving the role', async () => {
    const spy = jest.fn();

    const router = new VueRouter();
    router.push = spy;

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => {
          if (key === 'settings.roles.edit') {
            return `${key} ${values.name}`;
          }
          if (key === 'settings.roles.roomLimit.default') {
            return `${key} ${values.value}`;
          }
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

    await waitMoxios();
    const permissionsCxs = view.findAllComponents(BFormCheckbox).wrappers;
    let roomLimitCustomRadio;

    view.findAllComponents(BFormRadio).wrappers.forEach(radio => {
      if (radio.text().startsWith('settings.roles.roomLimit.custom')) {
        roomLimitCustomRadio = radio;
      }
    });
    roomLimitCustomRadio.get('input').trigger('click');
    permissionsCxs[0].get('input').trigger('click');
    await view.vm.$nextTick();
    permissionsCxs[1].get('input').trigger('click');
    await view.vm.$nextTick();

    const inputs = view.findAllComponents(BFormInput).wrappers;
    await inputs[0].setValue('Test');
    await inputs[1].setValue(10);

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

    await waitMoxios();
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

    await waitMoxios();
    expect(spy).toBeCalledTimes(1);
    restoreRoleResponse();
    view.destroy();
  });

  it('modal gets shown for stale errors and a overwrite can be forced', async () => {
    const spy = jest.fn();

    const router = new VueRouter();
    router.push = spy;

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => {
          if (key === 'settings.roles.edit') {
            return `${key} ${values.name}`;
          }
          if (key === 'settings.roles.roomLimit.default') {
            return `${key} ${values.value}`;
          }
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

    await waitMoxios();
    const newModel = _.cloneDeep(view.vm.model);
    newModel.updated_at = '2020-09-08T16:13:26.000000Z';

    let restoreRoleResponse = overrideStub('/api/v1/roles/1', {
      status: env.HTTP_STALE_MODEL,
      response: {
        error: env.HTTP_STALE_MODEL,
        message: 'test',
        new_model: newModel
      }
    });

    view.findComponent(BForm).trigger('submit');

    await waitMoxios();
    const staleModelModal = view.findComponent({ ref: 'stale-role-modal' });
    expect(staleModelModal.vm.$data.isVisible).toBe(true);

    restoreRoleResponse();
    restoreRoleResponse = overrideStub('/api/v1/roles/1', {
      status: 204
    });

    staleModelModal.vm.$refs['ok-button'].click();

    await waitMoxios();
    const request = moxios.requests.mostRecent();
    const data = JSON.parse(request.config.data);

    expect(data.updated_at).toBe(newModel.updated_at);
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    restoreRoleResponse();
    view.destroy();
  });

  it('modal gets shown for stale errors and the new model can be applied to current form', async () => {
    const spy = jest.fn();

    const router = new VueRouter();
    router.push = spy;

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => {
          if (key === 'settings.roles.edit') {
            return `${key} ${values.name}`;
          }
          if (key === 'settings.roles.roomLimit.default') {
            return `${key} ${values.value}`;
          }
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

    await waitMoxios();
    const newModel = _.cloneDeep(view.vm.model);
    newModel.updated_at = '2020-09-08T16:13:26.000000Z';
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

    await waitMoxios();
    const staleModelModal = view.findComponent({ ref: 'stale-role-modal' });
    expect(staleModelModal.vm.$data.isVisible).toBe(true);
    expect(view.findComponent(BFormInput).element.value).toBe('admin');

    restoreRoleResponse();

    staleModelModal.vm.$refs['cancel-button'].click();

    await view.vm.$nextTick();
    expect(view.findComponent(BFormInput).element.value).toBe('Test');
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    view.destroy();
  });

  it('reload overlay gets shown if an error occurs during load of permissions', async () => {
    const spy = jest.spyOn(Base, 'error').mockImplementation();

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

    await waitMoxios();
    expect(spy).toBeCalledTimes(1);
    expect(view.findComponent(BOverlay).props('show')).toBe(true);
    expect(view.html()).toContain('app.reload');
    expect(view.html()).toContain('settings.roles.noOptions');
    const saveButton = view.findAllComponents(BButton).filter(button => button.text() === 'app.save' && button.attributes('disabled'));
    expect(saveButton.wrappers.length).toBe(1);

    restorePermissionsResponse();
    view.destroy();
  });

  it('user gets redirected to index page if the role is not found', async () => {
    const spy = jest.spyOn(Base, 'error').mockImplementation();

    const routerSpy = jest.fn();

    const router = new VueRouter();
    router.push = routerSpy;

    const restoreRoleResponse = overrideStub('/api/v1/roles/1', {
      status: 404,
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
      router,
      attachTo: createContainer()
    });

    await waitMoxios();
    expect(spy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'settings.roles' });

    restoreRoleResponse();
    view.destroy();
  });

  it('reload overlay gets shown if another error than 404 occurs during load of the role', async () => {
    const spy = jest.spyOn(Base, 'error').mockImplementation();

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

    await waitMoxios();
    expect(spy).toBeCalledTimes(1);
    expect(view.findComponent(BOverlay).props('show')).toBe(true);
    expect(view.html()).toContain('app.reload');
    const saveButton = view.findAllComponents(BButton).filter(button => button.text() === 'app.save' && button.attributes('disabled'));
    expect(saveButton.wrappers.length).toBe(1);

    restoreRoleResponse();
    view.destroy();
  });

  it('user gets redirected to index page if the role is not found during save', async () => {
    const spy = jest.spyOn(Base, 'error').mockImplementation();

    const routerSpy = jest.fn();

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

    await waitMoxios();
    view.findComponent(BForm).trigger('submit');

    const restoreRoleResponse = overrideStub('/api/v1/roles/1', {
      status: 404,
      response: {
        message: 'Test'
      }
    });

    await waitMoxios();
    expect(spy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'settings.roles' });

    restoreRoleResponse();
    view.destroy();
  });

  it('included permissions get shown and updated', async () => {
    let restorePermissionsResponse = overrideStub('/api/v1/permissions', {
      status: 200,
      response: {
        data: [
          { id: 1, name: 'tests.test1', includedPermissions: [] },
          { id: 2, name: 'tests.test2', includedPermissions: [] },
          { id: 3, name: 'tests.test3', includedPermissions: [1, 2] },
          { id: 4, name: 'tests.test4', includedPermissions: [] },
          { id: 10, name: 'tests.test5', includedPermissions: [4] }
        ]
      }
    });

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => {
          if (key === 'settings.roles.edit') {
            return `${key} ${values.name}`;
          }
          if (key === 'settings.roles.roomLimit.default') {
            return `${key} ${values.value}`;
          }
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

    await waitMoxios();
    await view.vm.$nextTick();
    let permissionsCxs = view.findAllComponents(BFormCheckbox).wrappers;

    let perm1 = permissionsCxs[0];
    let perm2 = permissionsCxs[1];
    let perm3 = permissionsCxs[2];
    let perm4 = permissionsCxs[3];
    let perm10 = permissionsCxs[4];

    // test if permission include works on load
    expect(perm1.element.parentElement.parentElement.children[2].innerHTML).toContain('fa-solid fa-check-circle text-success');
    expect(perm2.element.parentElement.parentElement.children[2].innerHTML).toContain('fa-solid fa-minus-circle text-danger');
    expect(perm3.element.parentElement.parentElement.children[2].innerHTML).toContain('fa-solid fa-minus-circle text-danger');
    expect(perm4.element.parentElement.parentElement.children[2].innerHTML).toContain('fa-solid fa-check-circle text-success');
    expect(perm10.element.parentElement.parentElement.children[2].innerHTML).toContain('fa-solid fa-check-circle text-success');

    perm3.get('input').trigger('click');
    await view.vm.$nextTick();
    perm10.get('input').trigger('click');
    await view.vm.$nextTick();

    // test if permission include works after changes
    expect(perm1.element.parentElement.parentElement.children[2].innerHTML).toContain('fa-solid fa-check-circle text-success');
    expect(perm2.element.parentElement.parentElement.children[2].innerHTML).toContain('fa-solid fa-check-circle text-success');
    expect(perm3.element.parentElement.parentElement.children[2].innerHTML).toContain('fa-solid fa-check-circle text-success');
    expect(perm4.element.parentElement.parentElement.children[2].innerHTML).toContain('fa-solid fa-minus-circle text-danger');
    expect(perm10.element.parentElement.parentElement.children[2].innerHTML).toContain('fa-solid fa-minus-circle text-danger');

    restorePermissionsResponse();

    // test if permission include works after reload of include map
    restorePermissionsResponse = overrideStub('/api/v1/permissions', {
      status: 200,
      response: {
        data: [
          { id: 1, name: 'tests.test1', includedPermissions: [] },
          { id: 2, name: 'tests.test2', includedPermissions: [] },
          { id: 3, name: 'tests.test3', includedPermissions: [] },
          { id: 4, name: 'tests.test4', includedPermissions: [] },
          { id: 10, name: 'tests.test5', includedPermissions: [] }
        ]
      }
    });
    view.vm.loadPermissions();
    await waitMoxios();
    await view.vm.$nextTick();

    permissionsCxs = view.findAllComponents(BFormCheckbox).wrappers;
    perm1 = permissionsCxs[0];
    perm2 = permissionsCxs[1];
    perm3 = permissionsCxs[2];
    perm4 = permissionsCxs[3];
    perm10 = permissionsCxs[4];

    expect(perm1.element.parentElement.parentElement.children[2].innerHTML).toContain('fa-solid fa-check-circle text-success');
    expect(perm2.element.parentElement.parentElement.children[2].innerHTML).toContain('fa-solid fa-minus-circle text-danger');
    expect(perm3.element.parentElement.parentElement.children[2].innerHTML).toContain('fa-solid fa-check-circle text-success');
    expect(perm4.element.parentElement.parentElement.children[2].innerHTML).toContain('fa-solid fa-minus-circle text-danger');
    expect(perm10.element.parentElement.parentElement.children[2].innerHTML).toContain('fa-solid fa-minus-circle text-danger');

    restorePermissionsResponse();
    view.destroy();
  });
});
