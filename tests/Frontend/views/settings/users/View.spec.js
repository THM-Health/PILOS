import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, { IconsPlugin, BFormSelect, BFormSelectOption, BButton } from 'bootstrap-vue';
import moxios from 'moxios';
import View from '../../../../../resources/js/views/settings/users/View';
import PermissionService from '../../../../../resources/js/services/PermissionService';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(IconsPlugin);

let oldUser;
let rolesResponse1;

describe('UsersView', function () {
  beforeEach(function () {
    oldUser = PermissionService.currentUser;
    PermissionService.setCurrentUser({ id: 1, permissions: ['roles.view', 'roles.create', 'roles.update', 'settings.manage'] });
    moxios.install();

    rolesResponse1 = {
      data: Array.from(Array(5).keys()).map(item => {
        return {
          id: item + 1,
          name: 'Test ' + (item + 1),
          default: true,
          updated_at: '2020-01-01 01:00:00',
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
        updated_at: '2020-01-01 01:00:00',
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
        authenticator: 'ldap',
        email: 'darth@vader.com',
        username: 'dva',
        firstname: 'Darth',
        lastname: 'Vader',
        user_locale: 'en',
        model_name: 'User',
        room_limit: -1,
        updated_at: '2020-01-01 01:00:00',
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

    moxios.stubRequest('/api/v1/roles', {
      status: 200,
      response: rolesResponse1
    });
    moxios.stubRequest('/api/v1/users/1', {
      status: 200,
      response: ownUserResponse
    });
    moxios.stubRequest('/api/v1/users/2', {
      status: 200,
      response: userResponse
    });
  });

  afterEach(function () {
    PermissionService.setCurrentUser(oldUser);
    moxios.uninstall();
  });

  it('user name in title gets shown for detail view', function (done) {
    const view = mount(View, {
      localVue,
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

    moxios.wait(function () {
      expect(view.html()).toContain('settings.users.view John Doe');
      done();
    });
  });

  it('user name in title gets shown for update view', function (done) {
    const view = mount(View, {
      localVue,
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

    moxios.wait(function () {
      expect(view.html()).toContain('settings.users.edit John Doe');
      done();
    });
  });

  it('throws an error if the config property is not passed or contains wrong data', function () {

  });

  it('the configured locales should be selectable in the corresponding select', function (done) {
    View.__set__('LocaleMap', {
      de: 'German',
      en: 'English',
      ru: 'Russian'
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
        availableLocales: ['de', 'ru', 'en']
      }
    });

    moxios.wait(function () {
      const select = view.findComponent(BFormSelect);
      expect(select.vm.value).toEqual('en');
      expect(select.findAllComponents(BFormSelectOption).wrappers.length).toEqual(4);

      View.__ResetDependency__('LocaleMap');
      done();
    });
  });

  it('roles can not be modified for the own user', function () {

  });

  it('automatic assigned roles can not be deselected', function () {

  });

  it('input fields gets disabled when viewing the user in view only mode', function () {

  });

  it('all inputs fields shown and enabled on new page', function () {

  });

  it('specific fields gets disabled for not database users', function () {

  });

  it('back button is not shown on the profile page of an user', function (done) {
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
      }
    });

    moxios.wait(function () {
      const buttons = view.findAllComponents(BButton);
      expect(buttons.length).toEqual(3);
      expect(buttons.at(2).text()).toEqual('app.save');

      done();
    });
  });

  it('persisted data gets loaded and shown', function () {

  });

  it('error handler gets called if an error occurs during load of data', function () {

  });

  it('if the user model to load is the current user and is not found the user gets logged and redirected', function () {

  });

  it('request with the updates gets send during saving the user', function () {

  });

  it('current user get logged out if the user to update is the current user and not gets found during persistence', function () {

  });

  it('changes the application locale if the updated user is the current user and locale was modified', function () {

  });

  it('modal gets shown for stale errors and a overwrite can be forced', function () {

  });

  it('modal gets shown for stale errors and the new model can be applied to current form', function () {

  });
});
