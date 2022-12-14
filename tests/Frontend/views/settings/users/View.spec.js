import { mount } from '@vue/test-utils';
import BootstrapVue, {
  BButton,
  BForm,
  BFormCheckbox,
  BFormInput,
  BFormSelect,
  BFormSelectOption,
  BImg,
  BModal
} from 'bootstrap-vue';
import moxios from 'moxios';
import View from '../../../../../resources/js/views/settings/users/View.vue';
import PermissionService from '../../../../../resources/js/services/PermissionService.js';
import VueRouter from 'vue-router';
import _ from 'lodash';
import env from '../../../../../resources/js/env.js';
import { Multiselect } from 'vue-multiselect';
import Base from '../../../../../resources/js/api/base';
import { waitMoxios, overrideStub, createLocalVue } from '../../../helper';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { useLocaleStore } from '../../../../../resources/js/stores/locale';
import { useAuthStore } from '../../../../../resources/js/stores/auth';
import { createCanvas, Image } from 'canvas';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(PiniaVuePlugin);
localVue.use(VueRouter);

let oldUser;
let rolesResponse1;

const userResponse = {
  data: {
    id: 2,
    authenticator: 'users',
    email: 'john@doe.com',
    username: 'jdo',
    firstname: 'John',
    lastname: 'Doe',
    user_locale: 'en',
    model_name: 'User',
    room_limit: -1,
    image: 'http://domain.tld/storage/profile_images/123.jpg',
    updated_at: '2020-01-01T01:00:00.000000Z',
    roles: [{
      id: 1,
      name: 'Test 1',
      automatic: true
    }, {
      id: 2,
      name: 'Test 2',
      automatic: false
    }]
  }
};

const ldapUserResponse = {
  data: {
    id: 3,
    authenticator: 'ldap',
    email: 'max@mustermann.de',
    username: 'mx',
    firstname: 'Max',
    lastname: 'Mustermann',
    user_locale: 'en',
    model_name: 'User',
    room_limit: -1,
    image: null,
    updated_at: '2020-01-01T01:00:00.000000Z',
    roles: [{
      id: 1,
      name: 'Test 1',
      automatic: true
    }, {
      id: 2,
      name: 'Test 2',
      automatic: false
    }]
  }
};

const ownUserResponse = {
  data: {
    id: 1,
    authenticator: 'users',
    email: 'darth@vader.com',
    username: 'dva',
    firstname: 'Darth',
    lastname: 'Vader',
    user_locale: 'en',
    model_name: 'User',
    room_limit: -1,
    image: 'http://domain.tld/storage/profile_images/abc.jpg',
    updated_at: '2020-01-01T01:00:00.000000Z',
    permissions: [],
    roles: [{
      id: 1,
      name: 'Test 1',
      automatic: true
    }, {
      id: 2,
      name: 'Test 2',
      automatic: false
    }]
  }
};

const initialState = { locale: { currentLocale: 'en' } };

describe('UsersView', () => {
  beforeEach(() => {
    oldUser = PermissionService.currentUser;
    PermissionService.setCurrentUser({ id: 1, permissions: ['users.view', 'users.create', 'users.update', 'users.updateOwnAttributes', 'settings.manage'] });
    moxios.install();

    rolesResponse1 = {
      data: Array.from(Array(5).keys()).map(item => {
        return {
          id: item + 1,
          name: 'Test ' + (item + 1),
          default: true,
          updated_at: '2020-01-01T01:00:00.000000Z',
          model_name: 'Role',
          room_limit: null
        };
      }),
      meta: {
        per_page: 5,
        current_page: 1,
        total: 10,
        last_page: 2
      }
    };

    moxios.stubRequest('/api/v1/getTimezones', {
      status: 200,
      response: {
        timezones: ['UTC']
      }
    });
    moxios.stubRequest('/api/v1/roles?page=1', {
      status: 200,
      response: rolesResponse1
    });
    moxios.stubRequest('/api/v1/users/1', {
      status: 200,
      response: _.cloneDeep(ownUserResponse)
    });
    moxios.stubRequest('/api/v1/users/2', {
      status: 200,
      response: _.cloneDeep(userResponse)
    });
    moxios.stubRequest('/api/v1/users/3', {
      status: 200,
      response: _.cloneDeep(ldapUserResponse)
    });
  });

  afterEach(() => {
    PermissionService.setCurrentUser(oldUser);
    moxios.uninstall();
  });

  it('user name in title gets shown for detail view', async () => {
    const view = mount(View, {
      localVue,
      pinia: createTestingPinia({ initialState, stubActions: false }),
      mocks: {
        $t: (key, values) => ['settings.users.view', 'settings.users.edit'].includes(key) ? `${key} ${values.firstname} ${values.lastname}` : key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 2,
          type: 'view'
        }
      }
    });

    await waitMoxios();
    expect(view.html()).toContain('settings.users.view John Doe');
    view.destroy();
  });

  it('user name in title gets shown for update view', async () => {
    const view = mount(View, {
      localVue,
      pinia: createTestingPinia({ initialState, stubActions: false }),
      mocks: {
        $t: (key, values) => ['settings.users.view', 'settings.users.edit'].includes(key) ? `${key} ${values.firstname} ${values.lastname}` : key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 2,
          type: 'edit'
        }
      }
    });

    await waitMoxios();
    expect(view.html()).toContain('settings.users.edit John Doe');
    view.destroy();
  });

  it('throws an error if the config property is not passed or contains wrong data', () => {
    expect(View.props.config.validator({})).toBe(false);
    expect(View.props.config.validator({ id: '1' })).toBe(false);
    expect(View.props.config.validator({ type: '1' })).toBe(false);
    expect(View.props.config.validator({ type: 'edit' })).toBe(false);
    expect(View.props.config.validator({ id: 1, type: 'edit' })).toBe(true);
  });

  it('the configured locales should be selectable in the corresponding select', async () => {
    vi.mock('@/lang/LocaleMap', () => {
      return {
        default: {
          de: 'German',
          en: 'English',
          ru: 'Russian'
        }
      };
    });

    const view = mount(View, {
      localVue,
      pinia: createTestingPinia({ initialState, stubActions: false }),
      mocks: {
        $t: (key) => key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 2,
          type: 'edit'
        },
        availableLocales: ['de', 'ru', 'en']
      }
    });

    await waitMoxios();
    const select = view.findComponent(BFormSelect);
    expect(select.vm.value).toEqual('en');
    expect(select.findAllComponents(BFormSelectOption).wrappers.length).toEqual(4);

    view.destroy();
  });

  it('roles can not be modified for the own user', async () => {
    const view = mount(View, {
      localVue,
      pinia: createTestingPinia({ initialState, stubActions: false }),
      mocks: {
        $t: (key) => key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 1,
          type: 'edit'
        }
      }
    });

    await waitMoxios();
    expect(view.findComponent(Multiselect).vm.disabled).toBe(true);
    view.destroy();
  });

  it('automatic assigned roles can not be deselected', async () => {
    const view = mount(View, {
      localVue,
      pinia: createTestingPinia({ initialState, stubActions: false }),
      mocks: {
        $t: (key) => key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 2,
          type: 'edit'
        }
      }
    });

    await waitMoxios();
    const multiselect = view.findComponent(Multiselect);

    expect(multiselect.vm.value[0].$isDisabled).toBe(true);
    expect(multiselect.vm.value[1].$isDisabled).toBe(false);
    view.destroy();
  });

  it('input fields gets disabled when viewing the user in view only mode', async () => {
    const view = mount(View, {
      localVue,
      pinia: createTestingPinia({ initialState, stubActions: false }),
      mocks: {
        $t: (key) => key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 2,
          type: 'view'
        }
      }
    });

    await waitMoxios();
    const inputs = view.findAllComponents(BFormInput);
    expect(inputs.length).toBe(3);
    inputs.wrappers.forEach((input) => {
      expect(input.vm.disabled).toBe(true);
    });
    const selects = view.findAllComponents(BFormSelect);
    expect(selects.length).toBe(2);
    selects.wrappers.forEach((select) => {
      expect(select.vm.disabled).toBe(true);
    });
    const multiSelects = view.findAllComponents(Multiselect);
    expect(multiSelects.length).toBe(1);
    multiSelects.wrappers.forEach((select) => {
      expect(select.vm.disabled).toBe(true);
    });
    view.destroy();
  });

  it('all inputs fields shown and enabled on new page', async () => {
    const view = mount(View, {
      localVue,
      pinia: createTestingPinia({ initialState, stubActions: false }),
      mocks: {
        $t: (key) => key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 'new',
          type: 'edit'
        }
      }
    });

    await waitMoxios();
    await view.vm.$nextTick();
    const inputs = view.findAllComponents(BFormInput);
    expect(inputs.length).toBe(5);
    inputs.wrappers.forEach((input) => {
      expect(input.vm.disabled).toBe(false);
    });
    const selects = view.findAllComponents(BFormSelect);
    expect(selects.length).toBe(2);
    selects.wrappers.forEach((select) => {
      expect(select.vm.disabled).toBe(false);
    });
    const multiSelects = view.findAllComponents(Multiselect);
    expect(multiSelects.length).toBe(1);
    multiSelects.wrappers.forEach((select) => {
      expect(select.vm.disabled).toBe(false);
    });
    view.destroy();
  });

  it('if generate_password is true the password fields does not get sent with the create request', async () => {
    const spy = vi.fn();

    const router = new VueRouter();
    router.push = spy;

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 'new',
          type: 'edit'
        }
      },
      pinia: createTestingPinia({ initialState, stubActions: false }),
      router
    });

    await waitMoxios();
    const inputs = view.findAllComponents(BFormInput);
    await inputs.at(0).setValue('Max');
    await inputs.at(1).setValue('Mustermann');
    await inputs.at(2).setValue('max@mustermann.de');
    const selects = view.findAllComponents(BFormSelect);
    await selects.at(0).setValue('de');
    view.vm.model.roles.push(rolesResponse1.data[2]);
    await view.vm.$nextTick();
    const checkboxes = view.findAllComponents(BFormCheckbox);
    await checkboxes.at(0).get('input').setChecked();
    await view.vm.$nextTick();
    await view.findComponent(BForm).trigger('submit');

    await waitMoxios();
    const request = moxios.requests.mostRecent();

    expect(request.config.data.get('firstname')).toBe('Max');
    expect(request.config.data.get('lastname')).toBe('Mustermann');
    expect(request.config.data.get('email')).toBe('max@mustermann.de');
    expect(request.config.data.has('password')).toBeFalsy();
    expect(request.config.data.has('password_confirmation')).toBeFalsy();
    expect(request.config.data.get('roles[0]')).toBe('3');
    expect(request.config.data.get('user_locale')).toBe('de');
    expect(request.config.data.get('generate_password')).toBe('1');
    view.destroy();
  });

  it('specific fields gets disabled for not database users', async () => {
    const view = mount(View, {
      localVue,
      pinia: createTestingPinia({ initialState, stubActions: false }),
      mocks: {
        $t: (key) => key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 3,
          type: 'edit'
        }
      }
    });

    await waitMoxios();
    const inputs = view.findAllComponents(BFormInput);
    expect(inputs.length).toBe(4);
    inputs.wrappers.forEach((input) => {
      expect(input.vm.disabled).toBe(true);
    });
    const selects = view.findAllComponents(BFormSelect);
    expect(selects.length).toBe(2);
    selects.wrappers.forEach((select) => {
      expect(select.vm.disabled).toBe(false);
    });
    const multiSelects = view.findAllComponents(Multiselect);
    expect(multiSelects.length).toBe(1);
    multiSelects.wrappers.forEach((select) => {
      expect(select.vm.disabled).toBe(false);
    });
    view.destroy();
  });

  it('back button is not shown on the profile page of an user', async () => {
    const view = mount(View, {
      localVue,
      pinia: createTestingPinia({ initialState, stubActions: false }),
      mocks: {
        $t: (key) => key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 1,
          type: 'profile'
        }
      }
    });

    await waitMoxios();
    const buttons = view.findAllComponents(BButton);
    expect(buttons.length).toEqual(5);
    expect(buttons.at(4).text()).toEqual('app.save');
    view.destroy();
  });

  it('persisted data gets loaded and shown', async () => {
    const view = mount(View, {
      localVue,
      pinia: createTestingPinia({ initialState, stubActions: false }),
      mocks: {
        $t: (key) => key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 2,
          type: 'edit'
        }
      }
    });

    await waitMoxios();
    const inputs = view.findAllComponents(BFormInput);
    expect(inputs.length).toBe(5);
    expect(inputs.at(0).element.value).toBe('John');
    expect(inputs.at(1).element.value).toBe('Doe');
    expect(inputs.at(2).element.value).toBe('john@doe.com');
    expect(inputs.at(3).element.value).toBe('');
    expect(inputs.at(4).element.value).toBe('');

    const selects = view.findAllComponents(BFormSelect);
    expect(selects.length).toBe(2);
    expect(selects.at(0).element.value).toBe('en');

    const multiSelects = view.findAllComponents(Multiselect);
    expect(multiSelects.length).toBe(1);
    expect(multiSelects.at(0).vm.value.map(val => val.id)).toStrictEqual([1, 2]);
    view.destroy();
  });

  it('request with the updates gets send during saving the user', async () => {
    const spy = vi.fn();

    const router = new VueRouter();
    router.push = spy;

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 1,
          type: 'edit'
        }
      },
      pinia: createTestingPinia({ initialState, stubActions: false }),
      router
    });

    const localeStore = useLocaleStore();

    await waitMoxios();
    const inputs = view.findAllComponents(BFormInput);
    await inputs.at(0).setValue('Max');
    await inputs.at(1).setValue('Mustermann');
    await inputs.at(2).setValue('max@mustermann.de');
    await inputs.at(3).setValue('Test_123');
    await inputs.at(4).setValue('Test_123');
    const selects = view.findAllComponents(BFormSelect);
    await selects.at(0).setValue('de');
    view.vm.model.roles.push(rolesResponse1.data[2]);
    await view.vm.$nextTick();

    moxios.uninstall();
    moxios.install();
    view.findComponent(BForm).trigger('submit');

    await waitMoxios();
    let request = moxios.requests.mostRecent();
    expect(request.config.url).toBe('/api/v1/users/1');
    expect(request.config.method).toBe('post');
    expect(request.config.data.get('_method')).toBe('PUT');
    expect(request.config.data.get('firstname')).toBe('Max');
    expect(request.config.data.get('lastname')).toBe('Mustermann');
    expect(request.config.data.get('email')).toBe('max@mustermann.de');
    expect(request.config.data.get('password')).toBe('Test_123');
    expect(request.config.data.get('password_confirmation')).toBe('Test_123');
    expect(request.config.data.get('roles[0]')).toStrictEqual('1');
    expect(request.config.data.get('roles[1]')).toStrictEqual('2');
    expect(request.config.data.get('roles[2]')).toStrictEqual('3');
    expect(request.config.data.get('user_locale')).toBe('de');
    expect(request.config.data.has('generate_password')).toBeFalsy();

    await request.respondWith({
      status: 204
    });

    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.url).toBe('/api/v1/currentUser');
    await request.respondWith({
      status: 200,
      response: {
        data: {
          id: 1,
          authenticator: 'users',
          email: 'max@mustermann.de',
          username: 'dva',
          firstname: 'Max',
          lastname: 'Mustermann',
          user_locale: 'de',
          model_name: 'User',
          room_limit: -1,
          image: 'http://domain.tld/storage/profile_images/abc.jpg',
          updated_at: '2020-01-01T01:00:00.000000Z',
          roles: [{
            id: 1,
            name: 'Test 1',
            automatic: true
          }, {
            id: 2,
            name: 'Test 2',
            automatic: false
          }, {
            id: 3,
            name: 'Test 3',
            automatic: false
          }],
          permissions: []
        }
      }
    });

    // check that the application locale gets changed
    expect(localeStore.currentLocale).toBe('de');
    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith({ name: 'settings.users' });
    view.destroy();
  });

  it('error handler gets called if an error occurs during load of data', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const restoreRolesResponse = overrideStub('/api/v1/roles?page=1', {
      status: 500,
      response: {
        message: 'Test'
      }
    });
    const restoreUserResponse = overrideStub('/api/v1/users/2', {
      status: 500,
      response: {
        message: 'Test'
      }
    });

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 2,
          type: 'edit'
        }
      },
      pinia: createTestingPinia({ initialState, stubActions: false })
    });

    await waitMoxios();
    expect(spy).toBeCalledTimes(2);
    expect(view.html()).toContain('settings.roles.nodata');

    restoreRolesResponse();
    restoreUserResponse();
    view.destroy();
  });

  it('if the user model to load is the current user and is not found the user gets logged and redirected', async () => {
    const errorSpy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const spy = vi.fn();
    const router = new VueRouter();
    router.push = spy;

    const restoreUserResponse = overrideStub('/api/v1/users/1', {
      status: env.HTTP_NOT_FOUND,
      response: {
        message: 'Test'
      }
    });

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 1,
          type: 'edit'
        }
      },
      pinia: createTestingPinia({ initialState, stubActions: false }),
      router
    });

    await waitMoxios();
    const request = moxios.requests.mostRecent();
    expect(request.config.url).toBe('/api/v1/logout');
    await request.respondWith({
      status: 204
    });

    expect(errorSpy).toBeCalledTimes(1);

    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith({ name: 'home' });
    restoreUserResponse();
    view.destroy();
  });

  it('current user get logged out if the user to update is the current user and not gets found during persistence', async () => {
    const errorSpy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const spy = vi.fn();
    const router = new VueRouter();
    router.push = spy;

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 1,
          type: 'edit'
        }
      },
      pinia: createTestingPinia({ initialState, stubActions: false }),
      router
    });
    useAuthStore();
    await waitMoxios();
    const restoreUserResponse = overrideStub('/api/v1/users/1', {
      status: env.HTTP_NOT_FOUND,
      response: {
        message: 'Test'
      }
    });

    view.findComponent(BForm).trigger('submit');

    await waitMoxios();
    const request = moxios.requests.mostRecent();
    expect(request.config.url).toBe('/api/v1/logout');
    await request.respondWith({
      status: 204
    });

    expect(errorSpy).toBeCalledTimes(1);

    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith({ name: 'home' });
    restoreUserResponse();
    view.destroy();
  });

  it('modal gets shown for stale errors and a overwrite can be forced', async () => {
    const spy = vi.fn();

    const router = new VueRouter();
    router.push = spy;

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 1,
          type: 'profile'
        },
        modalStatic: true
      },
      pinia: createTestingPinia({ initialState, stubActions: false }),
      router
    });

    await waitMoxios();
    const newModel = _.cloneDeep(view.vm.model);
    newModel.updated_at = '2020-09-08T16:13:26.000000Z';
    newModel.firstname = 'Tester';

    let restoreUserResponse = overrideStub('/api/v1/users/1', {
      status: env.HTTP_STALE_MODEL,
      response: {
        error: env.HTTP_STALE_MODEL,
        message: 'test',
        new_model: newModel
      }
    });

    view.findComponent(BForm).trigger('submit');

    await waitMoxios();
    const staleModelModal = view.findComponent({ ref: 'stale-user-modal' });
    expect(staleModelModal.vm.$data.isVisible).toBe(true);
    restoreUserResponse();
    restoreUserResponse = overrideStub('/api/v1/users/1', {
      status: 204,
      response: {
        data: newModel
      }
    });

    moxios.requests.reset();
    staleModelModal.vm.$refs['ok-button'].click();

    await waitMoxios();
    const request = moxios.requests.at(0);

    expect(request.config.data.get('updated_at')).toBe(newModel.updated_at);
    expect(request.config.data.get('firstname')).toBe('Darth');
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);

    restoreUserResponse();
    view.destroy();
  });

  it('modal gets shown for stale errors and the new model can be applied to current form', async () => {
    const spy = vi.fn();

    const router = new VueRouter();
    router.push = spy;

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 1,
          type: 'profile'
        },
        modalStatic: true
      },
      pinia: createTestingPinia({ initialState, stubActions: false }),
      router
    });

    await waitMoxios();
    const newModel = _.cloneDeep(view.vm.model);
    newModel.updated_at = '2020-09-08T16:13:26.000000Z';
    newModel.firstname = 'Test';

    const restoreUserResponse = overrideStub('/api/v1/users/1', {
      status: env.HTTP_STALE_MODEL,
      response: {
        error: env.HTTP_STALE_MODEL,
        message: 'test',
        new_model: newModel
      }
    });

    view.findComponent(BForm).trigger('submit');

    await waitMoxios();
    const staleModelModal = view.findComponent({ ref: 'stale-user-modal' });
    expect(staleModelModal.vm.$data.isVisible).toBe(true);
    expect(view.findComponent(BFormInput).element.value).toBe('Darth');

    restoreUserResponse();

    staleModelModal.vm.$refs['cancel-button'].click();

    await view.vm.$nextTick();
    expect(view.findComponent(BFormInput).element.value).toBe('Test');
    expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
    view.destroy();
  });

  it('reload button exists next to the roles multiselect and on error it can be used to reload the roles', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const restoreRolesResponse = overrideStub('/api/v1/roles?page=1', {
      status: 500,
      response: {
        message: 'Test'
      }
    });

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 2,
          type: 'edit'
        },
        modalStatic: true
      },
      pinia: createTestingPinia({ initialState, stubActions: false })
    });

    await waitMoxios();
    let button = view.findComponent({ ref: 'reloadRolesButton' });
    expect(button.exists()).toBe(true);
    expect(spy).toBeCalledTimes(1);
    restoreRolesResponse();

    button.trigger('click');

    await waitMoxios();
    button = view.findComponent({ ref: 'reloadRolesButton' });
    expect(button.exists()).toBe(false);
    expect(spy).toBeCalledTimes(1);

    view.destroy();
  });

  it('user gets redirected to index page if the other user is not found', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const routerSpy = vi.fn();

    const router = new VueRouter();
    router.push = routerSpy;

    const restoreUserResponse = overrideStub('/api/v1/users/2', {
      status: env.HTTP_NOT_FOUND,
      response: {
        message: 'Test'
      }
    });

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 2,
          type: 'view'
        },
        modalStatic: true
      },
      pinia: createTestingPinia({ initialState, stubActions: false }),
      router
    });

    await waitMoxios();
    expect(spy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'settings.users' });

    restoreUserResponse();
    view.destroy();
  });

  it('reload overlay gets shown if another error than 404 occurs during load of the user', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const restoreUserResponse = overrideStub('/api/v1/users/2', {
      status: 500,
      response: {
        message: 'Test'
      }
    });

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 2,
          type: 'view'
        },
        modalStatic: true
      },
      pinia: createTestingPinia({ initialState, stubActions: false })
    });

    await waitMoxios();
    expect(spy).toBeCalledTimes(1);

    restoreUserResponse();
    view.destroy();
  });

  it('user gets redirected to index page if the other edited user is not found during save', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const routerSpy = vi.fn();

    const router = new VueRouter();
    router.push = routerSpy;

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 2,
          type: 'edit'
        },
        modalStatic: true
      },
      pinia: createTestingPinia({ initialState, stubActions: false }),
      router
    });

    await waitMoxios();
    view.findComponent(BForm).trigger('submit');

    const restoreUserResponse = overrideStub('/api/v1/users/2', {
      status: env.HTTP_NOT_FOUND,
      response: {
        message: 'Test'
      }
    });

    await waitMoxios();
    expect(spy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'settings.users' });

    restoreUserResponse();
    view.destroy();
  });

  it('existing image save and delete', async () => {
    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 1,
          type: 'profile'
        }
      },
      pinia: createTestingPinia({ initialState, stubActions: false })
    });

    await waitMoxios();
    const image = view.findComponent(BImg);
    expect(image.exists()).toBeTruthy();
    expect(image.attributes('src')).toBe('http://domain.tld/storage/profile_images/abc.jpg');

    let buttons = view.findAllComponents(BButton);
    expect(buttons.length).toBe(5);
    expect(buttons.at(0).text()).toContain('settings.users.image.upload');

    let imageDeleteButton = buttons.at(1);
    expect(imageDeleteButton.text()).toContain('settings.users.image.delete');
    await imageDeleteButton.trigger('click');
    expect(image.attributes('src')).toBe('/images/default_profile.png');

    buttons = view.findAllComponents(BButton);
    expect(buttons.length).toBe(4);
    const undoButton = buttons.at(0);
    expect(undoButton.text()).toContain('settings.users.image.undo_delete');
    await undoButton.trigger('click');
    expect(image.attributes('src')).toBe('http://domain.tld/storage/profile_images/abc.jpg');

    moxios.requests.reset();
    view.findComponent(BForm).trigger('submit');

    await waitMoxios();
    let request = moxios.requests.at(0);
    expect(request.url).toBe('/api/v1/users/1');
    expect(request.config.data.has('image')).toBeFalsy();
    await request.respondWith({
      status: 200,
      response: ownUserResponse
    });

    request = moxios.requests.at(1);
    expect(request.url).toBe('/api/v1/currentUser');
    await request.respondWith({
      status: 200,
      response: ownUserResponse
    });

    await view.vm.$nextTick();

    buttons = view.findAllComponents(BButton);
    expect(buttons.length).toBe(5);

    expect(buttons.at(0).text()).toContain('settings.users.image.upload');

    imageDeleteButton = buttons.at(1);
    expect(imageDeleteButton.text()).toContain('settings.users.image.delete');
    await imageDeleteButton.trigger('click');
    expect(image.attributes('src')).toBe('/images/default_profile.png');

    buttons = view.findAllComponents(BButton);
    expect(buttons.length).toBe(4);

    moxios.requests.reset();
    view.findComponent(BForm).trigger('submit');

    const response = _.cloneDeep(ownUserResponse);
    response.data.image = null;
    const restoreUserResponse = overrideStub('/api/v1/users/1', {
      status: 200,
      response: response
    });

    await waitMoxios();
    request = moxios.requests.at(0);
    expect(request.config.data.get('image')).toBe('');

    request = moxios.requests.at(1);
    expect(request.url).toBe('/api/v1/currentUser');
    await request.respondWith({
      status: 200,
      response: ownUserResponse
    });

    await view.vm.$nextTick();

    buttons = view.findAllComponents(BButton);
    expect(buttons.length).toBe(4);
    expect(buttons.at(0).text()).toContain('settings.users.image.upload');

    restoreUserResponse();
    view.destroy();
  });

  it('select image', async () => {
    /**
     * Mock canvas toBlob function
     */
    HTMLCanvasElement.prototype.toBlob = vi.fn(function (callback, type) {
      // Create new node-canvas instance from the properties of the HTMLCanvasElement
      const canvas = createCanvas(this.width, this.height);
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        // Draw the image to the canvas
        ctx.drawImage(img, 0, 0, this.width, this.height);
        // Convert the canvas to a buffer (non-standard API by node-canvas, alternative to toBlob)
        const buffer = canvas.toBuffer(type);
        // Create a new Blob from the buffer
        const blob = new Blob(buffer, { type });
        callback(blob);
      };
      img.onerror = err => { throw err; };
      // Copy the image contents of the HTMLCanvasElement to the node-canvas instance
      img.src = this.toDataURL();
    });

    const cropperSpy = vi.fn();
    const cropperComponent = {
      name: 'test-cropper',
      template: '<p>test</p>',
      methods: {
        replace (imageData) {
          cropperSpy(imageData);
        },
        getCroppedCanvas () {
          const oc = document.createElement('canvas');
          oc.width = 400;
          oc.height = 400;
          const ctx = oc.getContext('2d');
          ctx.lineWidth = 20;
          ctx.strokeStyle = 'black';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(400, 400);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(400, 0);
          ctx.lineTo(0, 400);
          ctx.stroke();

          return oc;
        }
      }
    };

    const toastErrorSpy = vi.fn();

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key,
        $te: () => false,
        toastError: toastErrorSpy
      },
      propsData: {
        config: {
          id: 1,
          type: 'profile'
        },
        modalStatic: true
      },
      pinia: createTestingPinia({ initialState, stubActions: false }),
      stubs: {
        VueCropper: cropperComponent
      }
    });

    await waitMoxios();
    // Try to find profile image with image of the user
    let image = view.findComponent(BImg);
    expect(image.exists()).toBeTruthy();
    expect(image.attributes('src')).toBe('http://domain.tld/storage/profile_images/abc.jpg');

    // check crop modal is closed
    const modal = view.findComponent({ ref: 'modal-image-upload' });
    expect(modal.vm.$data.isVisible).toBeFalsy();

    const eventError = {
      target: {
        files: [
          { type: 'image/gif' }
        ]
      }
    };

    // check if error is shown on invalid image type and modal is not shown
    view.vm.onFileSelect(eventError);
    await view.vm.$nextTick();
    expect(toastErrorSpy).toBeCalledTimes(1);
    expect(toastErrorSpy.mock.calls[0][0]).toEqual('settings.users.image.invalid_mime');
    expect(modal.vm.$data.isVisible).toBeFalsy();

    const event = {
      target: {
        files: [
          { type: 'image/png' }
        ]
      }
    };

    const imageUpload = 'data:image/png;base64,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';

    vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function () {
      this.onload({
        target: {
          result: imageUpload
        }
      });
    });

    // check for valid image type, check modal for copper is open and cropper gets the image data

    view.vm.onFileSelect(event);
    await view.vm.$nextTick();
    expect(modal.vm.$data.isVisible).toBeTruthy();
    expect(modal.vm.$props.busy).toBeFalsy();
    expect(view.vm.$data.selectedFile).toBe(imageUpload);
    expect(cropperSpy).toBeCalledTimes(1);
    expect(cropperSpy.mock.calls[0][0]).toBe(imageUpload);

    // find modal button to confirm and click
    const modalButtons = modal.findAllComponents(BButton);
    expect(modalButtons.at(1).text()).toContain('settings.users.image.save');
    await modalButtons.at(1).trigger('click');

    // modal is open and busy while images are processed
    expect(modal.vm.$data.isVisible).toBeTruthy();
    expect(modal.vm.$props.busy).toBeTruthy();
    // wait for image to be processed

    await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 200);
    });

    // check image as data url and blob
    const croppedImage = view.vm.$data.croppedImage;
    const croppedImageBlob = view.vm.$data.croppedImageBlob;
    const croppedExpectedImage = 'data:image/jpeg;base64,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';
    expect(croppedImage).toBe(croppedExpectedImage);
    expect(croppedImageBlob.type).toBe('image/jpeg');

    // check if image was replaced by cropped image
    image = view.findComponent(BImg);
    expect(image.exists()).toBeTruthy();
    expect(image.attributes('src')).toBe(croppedExpectedImage);

    // check if modal is not busy anymore and closed
    expect(modal.vm.$props.busy).toBeFalsy();
    expect(modal.vm.$data.isVisible).toBeFalsy();

    // submit form to send cropped image to server
    moxios.requests.reset();
    view.findComponent(BForm).trigger('submit');
    await waitMoxios();
    const request = moxios.requests.at(0);
    // check if blob is sent to server
    expect(request.config.data.get('image') instanceof Blob).toBeTruthy();
    expect(request.config.data.get('image').type).toBe('image/jpeg');

    view.destroy();
  });

  it('default image shown on new page', async () => {
    const view = mount(View, {
      localVue,
      pinia: createTestingPinia({ initialState, stubActions: false }),
      mocks: {
        $t: (key) => key,
        $te: () => false
      },
      propsData: {
        config: {
          id: 'new',
          type: 'edit'
        }
      }
    });

    await waitMoxios();
    await view.vm.$nextTick();

    const image = view.findComponent(BImg);
    expect(image.exists()).toBeTruthy();
    expect(image.attributes('src')).toBe('/images/default_profile.png');

    view.destroy();
  });
});
