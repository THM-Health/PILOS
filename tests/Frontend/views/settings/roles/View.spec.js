import View from '@/views/settings/roles/View.vue';
import { mount } from '@vue/test-utils';
import PermissionService from '@/services/PermissionService';

import BootstrapVue, {

  BFormInput,
  BFormCheckbox,
  BOverlay,
  BForm,
  BFormInvalidFeedback, BButton, BModal, BFormRadio
} from 'bootstrap-vue';
import Base from '@/api/base';
import VueRouter from 'vue-router';
import env from '@/env';
import _ from 'lodash';
import { mockAxios, createContainer, createLocalVue } from '../../../helper';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(PiniaVuePlugin);
localVue.use(VueRouter);

const initialState = { settings: { settings: { room_limit: -1 } } };

describe('RolesView', () => {
  beforeEach(() => {
    PermissionService.setCurrentUser({ permissions: ['roles.view', 'roles.create', 'roles.update', 'settings.manage'] });
    mockAxios.reset();

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
            name: 'tests.testA'
          },
          {
            id: 10,
            name: 'tests.testJ'
          }
        ]
      }
    };

    mockAxios.request('/api/v1/permissions').respondWith({
      status: 200,
      data: permissionsResponse
    });
    mockAxios.request('/api/v1/roles/1').respondWith({
      status: 200,
      data: roleResponse
    });
  });

  afterEach(() => {

  });

  it('role name in title gets translated for detail view', async () => {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key === 'settings.roles.view' ? `${key} ${values.name}` : key,
        $te: key => key === 'app.role_labels.admin' || key.startsWith('app.permissions.tests.test')
      },
      propsData: {
        viewOnly: true,
        id: '1'
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    expect(view.html()).toContain('settings.roles.view app.role_labels.admin');
    view.destroy();
  });

  it('role name in title gets translated for update view', async () => {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key === 'settings.roles.edit' ? `${key} ${values.name}` : key,
        $te: key => key === 'app.role_labels.admin' || key.startsWith('app.permissions.tests.test')
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    expect(view.html()).toContain('settings.roles.edit app.role_labels.admin');
    view.destroy();
  });

  it('input fields are disabled if the role is displayed in view mode', async () => {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => key === 'settings.roles.view' ? `${key} ${values.name}` : key,
        $te: key => key === 'app.role_labels.admin' || key.startsWith('app.permissions.tests.test')
      },
      propsData: {
        viewOnly: true,
        id: '1'
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
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
          if (key === 'settings.roles.room_limit.default') {
            return `${key} ${values.value}`;
          }
          return key;
        },
        $te: key => key === 'app.role_labels.admin' || key.startsWith('app.permissions.tests.test')
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await view.vm.$nextTick();
    expect(view.vm.isBusy).toBe(true);
    expect(view.findComponent(BOverlay).props('show')).toBe(true);

    await mockAxios.wait();
    expect(view.vm.isBusy).toBe(false);
    expect(view.findComponent(BOverlay).props('show')).toBe(false);

    let roomLimitDefaultRadio;
    let roomLimitUnlimitedRadio;
    let roomLimitCustomRadio;
    const permissionsCxs = view.findAllComponents(BFormCheckbox).wrappers;

    view.findAllComponents(BFormRadio).wrappers.forEach(radio => {
      if (radio.text().startsWith('settings.roles.room_limit.default')) {
        roomLimitDefaultRadio = radio;
      } else if (radio.text().startsWith('settings.roles.room_limit.unlimited')) {
        roomLimitUnlimitedRadio = radio;
      } else {
        roomLimitCustomRadio = radio;
      }
    });

    expect(roomLimitDefaultRadio.text()).toContain('settings.roles.room_limit.unlimited');
    expect(roomLimitDefaultRadio.vm.isChecked).toBe(true);
    expect(roomLimitUnlimitedRadio.vm.isChecked).toBe(false);
    expect(roomLimitCustomRadio.vm.isChecked).toBe(false);
    permissionsCxs.forEach(checkbox => {
      expect(checkbox.element.parentElement.parentElement.children[0].children[0].innerHTML).toBe(`app.permissions.tests.test_${checkbox.props('value')}`);
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
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    mockAxios.reset();
    mockAxios.request('/api/v1/roles/1').respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });
    mockAxios.request('/api/v1/permissions').respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key,
        $te: key => key === 'app.role_labels.admin' || key.startsWith('app.permissions.tests.test')
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    expect(spy).toBeCalledTimes(2);
    expect(view.vm.isBusy).toBe(false);
    expect(view.findComponent(BOverlay).props('show')).toBe(true);
    expect(view.html()).toContain('app.reload');
    expect(view.html()).toContain('settings.roles.no_options');
    const saveButton = view.findAllComponents(BButton).filter(button => button.text() === 'app.save' && button.attributes('disabled'));
    expect(saveButton.wrappers.length).toBe(1);

    view.destroy();
  });

  it('back button causes a back navigation without persistence', async () => {
    const spy = vi.fn();

    const router = new VueRouter();
    router.push = spy;

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => {
          if (key === 'settings.roles.edit') {
            return `${key} ${values.name}`;
          }
          if (key === 'settings.roles.room_limit.default') {
            return `${key} ${values.value}`;
          }
          return key;
        },
        $te: key => key === 'app.role_labels.admin' || key.startsWith('app.permissions.tests.test')
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      pinia: createTestingPinia({ initialState }),
      router,
      attachTo: createContainer()
    });

    await mockAxios.wait();

    await view.findAllComponents(BButton).filter(button => button.text() === 'app.back').at(0).trigger('click');
    expect(spy).toBeCalledTimes(1);
    view.destroy();
  });

  it('request with updates get send during saving the role', async () => {
    const spy = vi.fn();

    const router = new VueRouter();
    router.push = spy;

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => {
          if (key === 'settings.roles.edit') {
            return `${key} ${values.name}`;
          }
          if (key === 'settings.roles.room_limit.default') {
            return `${key} ${values.value}`;
          }
          return key;
        },
        $te: key => key === 'app.role_labels.admin' || key.startsWith('app.permissions.tests.test')
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      pinia: createTestingPinia({ initialState }),
      router,
      attachTo: createContainer()
    });

    await mockAxios.wait();
    const permissionsCxs = view.findAllComponents(BFormCheckbox).wrappers;
    let roomLimitCustomRadio;

    view.findAllComponents(BFormRadio).wrappers.forEach(radio => {
      if (radio.text().startsWith('settings.roles.room_limit.custom')) {
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

    const request = mockAxios.request('/api/v1/roles/1');

    view.findComponent(BForm).trigger('submit');

    await request.wait();
    const data = JSON.parse(request.config.data);

    expect(data.name).toBe('Test');
    expect(data.room_limit).toBe('10');
    expect(data.permissions).toEqual([10, 2]);

    await request.respondWith({
      status: env.HTTP_UNPROCESSABLE_ENTITY,
      data: {
        message: 'The given data was invalid.',
        errors: {
          name: ['Test name'],
          room_limit: ['Test room limit'],
          permissions: ['Test permissions'],
          'permissions.0': ['Test permissions 0']
        }
      }
    });

    const feedback = view.findAllComponents(BFormInvalidFeedback).wrappers;
    expect(feedback[0].html()).toContain('Test name');
    expect(feedback[1].html()).toContain('Test room limit');
    expect(feedback[2].html()).toContain('Test permissions');
    expect(feedback[2].html()).toContain('Test permissions 0');

    mockAxios.request('/api/v1/roles/1').respondWith({
      status: 204
    });

    view.findComponent(BForm).trigger('submit');

    await mockAxios.wait();
    expect(spy).toBeCalledTimes(1);
    view.destroy();
  });

  it('modal gets shown for stale errors and a overwrite can be forced', async () => {
    const spy = vi.fn();

    const router = new VueRouter();
    router.push = spy;

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => {
          if (key === 'settings.roles.edit') {
            return `${key} ${values.name}`;
          }
          if (key === 'settings.roles.room_limit.default') {
            return `${key} ${values.value}`;
          }
          return key;
        },
        $te: key => key === 'app.role_labels.admin' || key.startsWith('app.permissions.tests.test')
      },
      propsData: {
        viewOnly: false,
        id: '1',
        modalStatic: true
      },
      pinia: createTestingPinia({ initialState }),
      router,
      attachTo: createContainer()
    });

    await mockAxios.wait();
    const newModel = _.cloneDeep(view.vm.model);
    newModel.updated_at = '2020-09-08T16:13:26.000000Z';

    mockAxios.request('/api/v1/roles/1').respondWith({
      status: env.HTTP_STALE_MODEL,
      data: {
        error: env.HTTP_STALE_MODEL,
        message: 'test',
        new_model: newModel
      }
    });

    view.findComponent(BForm).trigger('submit');

    await mockAxios.wait();
    const staleModelModal = view.findComponent({ ref: 'stale-role-modal' });
    expect(staleModelModal.vm.$data.isVisible).toBe(true);

    const request = mockAxios.request('/api/v1/roles/1');

    staleModelModal.vm.$refs['ok-button'].click();

    await request.wait();
    const data = JSON.parse(request.config.data);

    expect(data.updated_at).toBe(newModel.updated_at);

    await request.respondWith({
      status: 204
    });

    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    view.destroy();
  });

  it('modal gets shown for stale errors and the new model can be applied to current form', async () => {
    const spy = vi.fn();

    const router = new VueRouter();
    router.push = spy;

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => {
          if (key === 'settings.roles.edit') {
            return `${key} ${values.name}`;
          }
          if (key === 'settings.roles.room_limit.default') {
            return `${key} ${values.value}`;
          }
          return key;
        },
        $te: key => key === 'app.role_labels.admin' || key.startsWith('app.permissions.tests.test')
      },
      propsData: {
        viewOnly: false,
        id: '1',
        modalStatic: true
      },
      pinia: createTestingPinia({ initialState }),
      router,
      attachTo: createContainer()
    });

    await mockAxios.wait();
    const newModel = _.cloneDeep(view.vm.model);
    newModel.updated_at = '2020-09-08T16:13:26.000000Z';
    newModel.name = 'Test';

    mockAxios.request('/api/v1/roles/1').respondWith({
      status: env.HTTP_STALE_MODEL,
      data: {
        error: env.HTTP_STALE_MODEL,
        message: 'test',
        new_model: newModel
      }
    });

    view.findComponent(BForm).trigger('submit');

    await mockAxios.wait();
    const staleModelModal = view.findComponent({ ref: 'stale-role-modal' });
    expect(staleModelModal.vm.$data.isVisible).toBe(true);
    expect(view.findComponent(BFormInput).element.value).toBe('admin');

    staleModelModal.vm.$refs['cancel-button'].click();

    await view.vm.$nextTick();
    expect(view.findComponent(BFormInput).element.value).toBe('Test');
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    view.destroy();
  });

  it('reload overlay gets shown if an error occurs during load of permissions', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    mockAxios.reset();

    mockAxios.request('/api/v1/roles/1').respondWith({
      status: 200,
      data: {
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
              name: 'tests.testA'
            },
            {
              id: 10,
              name: 'tests.testJ'
            }
          ]
        }
      }
    });

    mockAxios.request('/api/v1/permissions').respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key,
        $te: key => key === 'app.role_labels.admin' || key.startsWith('app.permissions.tests.test')
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await mockAxios.wait();

    expect(spy).toBeCalledTimes(1);
    expect(view.findComponent(BOverlay).props('show')).toBe(true);
    expect(view.html()).toContain('app.reload');
    expect(view.html()).toContain('settings.roles.no_options');
    const saveButton = view.findAllComponents(BButton).filter(button => button.text() === 'app.save' && button.attributes('disabled'));
    expect(saveButton.wrappers.length).toBe(1);

    view.destroy();
  });

  it('user gets redirected to index page if the role is not found', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const routerSpy = vi.fn();

    const router = new VueRouter();
    router.push = routerSpy;

    mockAxios.reset();
    mockAxios.request('/api/v1/roles/1').respondWith({
      status: 404,
      data: {
        message: 'Test'
      }
    });

    const permissionsResponse = {
      data: Array.from(Array(10).keys()).map(item => { return { id: item + 1, name: `tests.test${item + 1}` }; })
    };

    mockAxios.request('/api/v1/permissions').respondWith({
      status: 200,
      data: permissionsResponse
    });

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key,
        $te: key => key === 'app.role_labels.admin' || key.startsWith('app.permissions.tests.test')
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      pinia: createTestingPinia({ initialState }),
      router,
      attachTo: createContainer()
    });

    await mockAxios.wait();
    expect(spy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'settings.roles' });

    view.destroy();
  });

  it('reload overlay gets shown if another error than 404 occurs during load of the role', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    mockAxios.reset();
    mockAxios.request('/api/v1/roles/1').respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    const permissionsResponse = {
      data: Array.from(Array(10).keys()).map(item => { return { id: item + 1, name: `tests.test${item + 1}` }; })
    };

    mockAxios.request('/api/v1/permissions').respondWith({
      status: 200,
      data: permissionsResponse
    });

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key,
        $te: key => key === 'app.role_labels.admin' || key.startsWith('app.permissions.tests.test')
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    expect(spy).toBeCalledTimes(1);
    expect(view.findComponent(BOverlay).props('show')).toBe(true);
    expect(view.html()).toContain('app.reload');
    const saveButton = view.findAllComponents(BButton).filter(button => button.text() === 'app.save' && button.attributes('disabled'));
    expect(saveButton.wrappers.length).toBe(1);

    view.destroy();
  });

  it('user gets redirected to index page if the role is not found during save', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const routerSpy = vi.fn();

    const router = new VueRouter();
    router.push = routerSpy;

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key,
        $te: key => key === 'app.role_labels.admin' || key.startsWith('app.permissions.tests.test')
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      pinia: createTestingPinia({ initialState }),
      router,
      attachTo: createContainer()
    });

    await mockAxios.wait();
    view.findComponent(BForm).trigger('submit');

    mockAxios.request('/api/v1/roles/1').respondWith({
      status: 404,
      data: {
        message: 'Test'
      }
    });

    await mockAxios.wait();
    expect(spy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'settings.roles' });

    view.destroy();
  });

  it('included permissions get shown and updated', async () => {
    mockAxios.reset();
    mockAxios.request('/api/v1/permissions').respondWith({
      status: 200,
      data: {
        data: [
          { id: 1, name: 'tests.test1', included_permissions: [] },
          { id: 2, name: 'tests.test2', included_permissions: [] },
          { id: 3, name: 'tests.test3', included_permissions: [1, 2] },
          { id: 4, name: 'tests.test4', included_permissions: [] },
          { id: 10, name: 'tests.test5', included_permissions: [4] }
        ]
      }
    });
    mockAxios.request('/api/v1/roles/1').respondWith({
      status: 200,
      data: {
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
              name: 'tests.testA'
            },
            {
              id: 10,
              name: 'tests.testJ'
            }
          ]
        }
      }
    });

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key, values) => {
          if (key === 'settings.roles.edit') {
            return `${key} ${values.name}`;
          }
          if (key === 'settings.roles.room_limit.default') {
            return `${key} ${values.value}`;
          }
          return key;
        },
        $te: key => key === 'app.role_labels.admin' || key.startsWith('app.permissions.tests.test')
      },
      propsData: {
        viewOnly: false,
        id: '1'
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
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

    // test if permission include works after reload of include map
    mockAxios.request('/api/v1/permissions').respondWith({
      status: 200,
      data: {
        data: [
          { id: 1, name: 'tests.test1', included_permissions: [] },
          { id: 2, name: 'tests.test2', included_permissions: [] },
          { id: 3, name: 'tests.test3', included_permissions: [] },
          { id: 4, name: 'tests.test4', included_permissions: [] },
          { id: 10, name: 'tests.test5', included_permissions: [] }
        ]
      }
    });
    view.vm.loadPermissions();
    await mockAxios.wait();
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

    view.destroy();
  });
});
