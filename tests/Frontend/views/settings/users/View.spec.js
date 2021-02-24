import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, {
  IconsPlugin,
  BFormSelect,
  BFormSelectOption,
  BButton,
  BForm,
  BModal,
  BFormInput,
  BInputGroupAppend, BFormCheckbox
} from 'bootstrap-vue';
import moxios from 'moxios';
import View from '../../../../../resources/js/views/settings/users/View';
import PermissionService from '../../../../../resources/js/services/PermissionService';
import sinon from 'sinon';
import VueRouter from 'vue-router';
import _ from 'lodash';
import env from '../../../../../resources/js/env';
import Vuex from 'vuex';
import Multiselect from 'vue-multiselect';
import Base from '../../../../../resources/js/api/base';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(IconsPlugin);
localVue.use(Vuex);
localVue.use(VueRouter);

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

let store;
let oldUser;
let rolesResponse1;

describe('UsersView', function () {
  beforeEach(function () {
    oldUser = PermissionService.currentUser;
    PermissionService.setCurrentUser({ id: 1, permissions: ['users.view', 'users.create', 'users.update', 'users.updateOwnAttributes', 'settings.manage'] });
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
        authenticator: 'users',
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
      response: ownUserResponse
    });
    moxios.stubRequest('/api/v1/users/2', {
      status: 200,
      response: userResponse
    });
    moxios.stubRequest('/api/v1/users/3', {
      status: 200,
      response: ldapUserResponse
    });

    let res;
    const promise = new Promise((resolve) => {
      res = resolve;
    });

    store = new Vuex.Store({
      modules: {
        session: {
          namespaced: true,
          mutations: {
            setCurrentLocale (state, currentLocale) {
              state.currentLocale = currentLocale;
              res();
            },
            increaseCallCount (state, name) {
              state[name] += 1;
            }
          },
          getters: {
            settings: () => (setting) => null
          },
          state: () => ({
            currentLocale: 'en',
            logoutCount: 0,
            getCurrentUserCount: 0,
            runningPromise: promise
          }),
          actions: {
            async getCurrentUser ({ commit }) {
              await Promise.resolve();
              commit('increaseCallCount', 'getCurrentUserCount');
            },
            async logout ({ commit }) {
              await Promise.resolve();
              commit('increaseCallCount', 'logoutCount');
            }
          }
        }
      }
    });
  });

  afterEach(function () {
    PermissionService.setCurrentUser(oldUser);
    moxios.uninstall();
  });

  it('user name in title gets shown for detail view', function (done) {
    const view = mount(View, {
      localVue,
      store,
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
      store,
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
    expect(View.props.config.validator({})).toBe(false);
    expect(View.props.config.validator({ id: '1' })).toBe(false);
    expect(View.props.config.validator({ type: '1' })).toBe(false);
    expect(View.props.config.validator({ type: 'edit' })).toBe(false);
    expect(View.props.config.validator({ id: 1, type: 'edit' })).toBe(true);
    expect(View.props.config.validator({ id: 1, type: 'profile' })).toBe(true);
    expect(View.props.config.validator({ id: 2, type: 'profile' })).toBe(false);
    PermissionService.setCurrentUser(null);
    expect(View.props.config.validator({ id: 1, type: 'profile' })).toBe(false);
  });

  it('the configured locales should be selectable in the corresponding select', function (done) {
    View.__set__('LocaleMap', {
      de: 'German',
      en: 'English',
      ru: 'Russian'
    });

    const view = mount(View, {
      localVue,
      store,
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

  it('roles can not be modified for the own user', function (done) {
    const view = mount(View, {
      localVue,
      store,
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

    moxios.wait(function () {
      expect(view.findComponent(Multiselect).vm.disabled).toBe(true);
      done();
    });
  });

  it('automatic assigned roles can not be deselected', function (done) {
    const view = mount(View, {
      localVue,
      store,
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

    moxios.wait(function () {
      const multiselect = view.findComponent(Multiselect);

      expect(multiselect.vm.value[0].$isDisabled).toBe(true);
      expect(multiselect.vm.value[1].$isDisabled).toBe(false);
      done();
    });
  });

  it('input fields gets disabled when viewing the user in view only mode', function (done) {
    const view = mount(View, {
      localVue,
      store,
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

    moxios.wait(function () {
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
      done();
    });
  });

  it('all inputs fields shown and enabled on new page', function (done) {
    const view = mount(View, {
      localVue,
      store,
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

    moxios.wait(function () {
      view.vm.$nextTick().then(() => {
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
        done();
      });
    });
  });

  it('if generate_password is true the password fields does not get sent with the create request', function (done) {
    const spy = sinon.spy();

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
      store,
      router
    });

    moxios.wait(function () {
      const inputs = view.findAllComponents(BFormInput);
      inputs.at(0).setValue('Max').then(() => {
        return inputs.at(1).setValue('Mustermann');
      }).then(() => {
        return inputs.at(2).setValue('max@mustermann.de');
      }).then(() => {
        const selects = view.findAllComponents(BFormSelect);
        return selects.at(0).setValue('de');
      }).then(() => {
        view.vm.model.roles.push(rolesResponse1.data[2]);
        return view.vm.$nextTick();
      }).then(() => {
        const checkboxes = view.findAllComponents(BFormCheckbox);
        return checkboxes.at(0).get('input').trigger('click');
      }).then(() => {
        view.findComponent(BForm).trigger('submit');

        moxios.wait(function () {
          const request = moxios.requests.mostRecent();
          const data = JSON.parse(request.config.data);

          expect(data.firstname).toBe('Max');
          expect(data.lastname).toBe('Mustermann');
          expect(data.email).toBe('max@mustermann.de');
          expect(data.password).toBe(undefined);
          expect(data.password_confirmation).toBe(undefined);
          expect(data.roles).toStrictEqual([3]);
          expect(data.user_locale).toBe('de');
          expect(data.generate_password).toBe(true);

          done();
        });
      });
    });
  });

  it('specific fields gets disabled for not database users', function (done) {
    const view = mount(View, {
      localVue,
      store,
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

    moxios.wait(function () {
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
      done();
    });
  });

  it('back button is not shown on the profile page of an user', function (done) {
    const view = mount(View, {
      localVue,
      store,
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

  it('persisted data gets loaded and shown', function (done) {
    const view = mount(View, {
      localVue,
      store,
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

    moxios.wait(function () {
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
      done();
    });
  });

  it('request with the updates gets send during saving the user', function (done) {
    const spy = sinon.spy();

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
      store,
      router
    });

    moxios.wait(function () {
      const inputs = view.findAllComponents(BFormInput);
      inputs.at(0).setValue('Max').then(() => {
        return inputs.at(1).setValue('Mustermann');
      }).then(() => {
        return inputs.at(2).setValue('max@mustermann.de');
      }).then(() => {
        return inputs.at(3).setValue('Test_123');
      }).then(() => {
        return inputs.at(4).setValue('Test_123');
      }).then(() => {
        const selects = view.findAllComponents(BFormSelect);
        return selects.at(0).setValue('de');
      }).then(() => {
        view.vm.model.roles.push(rolesResponse1.data[2]);
        return view.vm.$nextTick();
      }).then(() => {
        view.findComponent(BForm).trigger('submit');

        moxios.wait(function () {
          const request = moxios.requests.mostRecent();
          const data = JSON.parse(request.config.data);

          expect(data.firstname).toBe('Max');
          expect(data.lastname).toBe('Mustermann');
          expect(data.email).toBe('max@mustermann.de');
          expect(data.password).toBe('Test_123');
          expect(data.password_confirmation).toBe('Test_123');
          expect(data.roles).toStrictEqual([1, 2, 3]);
          expect(data.user_locale).toBe('de');
          expect(data.generate_password).toBe(undefined);

          const restoreUserResponse = overrideStub('/api/v1/users/2', {
            status: 204
          });

          moxios.wait(function () {
            store.state.session.runningPromise.then(() => {
              // check that the application locale gets changed
              expect(store.state.session.currentLocale).toBe('de');
              sinon.assert.calledOnce(spy);
              sinon.assert.calledWith(spy, { name: 'settings.users' });
              restoreUserResponse();
              done();
            });
          });
        });
      });
    });
  });

  it('error handler gets called if an error occurs during load of data', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

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
      store
    });

    moxios.wait(function () {
      sinon.assert.calledTwice(Base.error);
      expect(view.html()).toContain('settings.roles.nodata');
      Base.error.restore();
      restoreRolesResponse();
      restoreUserResponse();
      done();
    });
  });

  it('if the user model to load is the current user and is not found the user gets logged and redirected', function (done) {
    const errorSpy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(errorSpy);

    const spy = sinon.spy();
    const router = new VueRouter();
    router.push = spy;

    const restoreUserResponse = overrideStub('/api/v1/users/1', {
      status: env.HTTP_NOT_FOUND,
      response: {
        message: 'Test'
      }
    });

    mount(View, {
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
      store,
      router
    });

    moxios.wait(function () {
      expect(store.state.session.logoutCount).toBe(1);
      sinon.assert.calledOnce(errorSpy);
      Base.error.restore();
      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, { name: 'home' });
      restoreUserResponse();
      done();
    });
  });

  it('current user get logged out if the user to update is the current user and not gets found during persistence', function (done) {
    const errorSpy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(errorSpy);

    const spy = sinon.spy();
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
      store,
      router
    });

    moxios.wait(function () {
      const restoreUserResponse = overrideStub('/api/v1/users/1', {
        status: env.HTTP_NOT_FOUND,
        response: {
          message: 'Test'
        }
      });

      view.findComponent(BForm).trigger('submit');

      moxios.wait(function () {
        expect(store.state.session.logoutCount).toBe(1);
        sinon.assert.calledOnce(errorSpy);
        Base.error.restore();
        sinon.assert.calledOnce(spy);
        sinon.assert.calledWith(spy, { name: 'home' });
        restoreUserResponse();
        done();
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
      store,
      router
    });

    moxios.wait(function () {
      const newModel = _.cloneDeep(view.vm.model);
      newModel.updated_at = '2020-09-08 16:13:26';
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

      moxios.wait(function () {
        const staleModelModal = view.findComponent({ ref: 'stale-user-modal' });
        expect(staleModelModal.vm.$data.isVisible).toBe(true);

        restoreUserResponse();
        restoreUserResponse = overrideStub('/api/v1/users/1', {
          status: 204,
          response: {
            data: newModel
          }
        });

        staleModelModal.vm.$refs['ok-button'].click();

        moxios.wait(function () {
          const request = moxios.requests.mostRecent();
          const data = JSON.parse(request.config.data);

          expect(data.updated_at).toBe(newModel.updated_at);
          expect(data.firstname).toBe('Darth');
          expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);

          restoreUserResponse();
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
      store,
      router
    });

    moxios.wait(function () {
      const newModel = _.cloneDeep(view.vm.model);
      newModel.updated_at = '2020-09-08 16:13:26';
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

      moxios.wait(function () {
        const staleModelModal = view.findComponent({ ref: 'stale-user-modal' });
        expect(staleModelModal.vm.$data.isVisible).toBe(true);
        expect(view.findComponent(BFormInput).element.value).toBe('Darth');

        restoreUserResponse();

        staleModelModal.vm.$refs['cancel-button'].click();

        view.vm.$nextTick().then(() => {
          expect(view.findComponent(BFormInput).element.value).toBe('Test');
          expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
          done();
        });
      });
    });
  });

  it('reload button exists next to the roles multiselect and on error it can be used to reload the roles', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

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
      store
    });

    moxios.wait(function () {
      const button = view.findComponent({ ref: 'reloadRolesButton' });
      expect(button.exists()).toBe(true);
      sinon.assert.calledOnce(Base.error);
      restoreRolesResponse();
      spy.resetHistory();
      button.trigger('click');

      moxios.wait(function () {
        const button = view.findComponent({ ref: 'reloadRolesButton' });
        expect(button.exists()).toBe(false);
        expect(spy.notCalled).toBe(true);
        Base.error.restore();
        done();
      });
    });
  });

  it('user gets redirected to index page if the other user is not found', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const routerSpy = sinon.spy();

    const router = new VueRouter();
    router.push = routerSpy;

    const restoreUserResponse = overrideStub('/api/v1/users/2', {
      status: env.HTTP_NOT_FOUND,
      response: {
        message: 'Test'
      }
    });

    mount(View, {
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
      store,
      router
    });

    moxios.wait(function () {
      sinon.assert.calledOnce(Base.error);
      sinon.assert.calledOnce(routerSpy);
      sinon.assert.calledWith(routerSpy, { name: 'settings.users' });
      Base.error.restore();
      restoreUserResponse();
      done();
    });
  });

  it('reload overlay gets shown if another error than 404 occurs during load of the user', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const restoreUserResponse = overrideStub('/api/v1/users/2', {
      status: 500,
      response: {
        message: 'Test'
      }
    });

    mount(View, {
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
      store
    });

    moxios.wait(function () {
      sinon.assert.calledOnce(Base.error);
      Base.error.restore();
      restoreUserResponse();
      done();
    });
  });

  it('user gets redirected to index page if the other edited user is not found during save', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const routerSpy = sinon.spy();

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
      store,
      router
    });

    moxios.wait(function () {
      view.findComponent(BForm).trigger('submit');

      const restoreUserResponse = overrideStub('/api/v1/users/2', {
        status: env.HTTP_NOT_FOUND,
        response: {
          message: 'Test'
        }
      });

      moxios.wait(function () {
        sinon.assert.calledOnce(Base.error);
        sinon.assert.calledOnce(routerSpy);
        sinon.assert.calledWith(routerSpy, { name: 'settings.users' });
        Base.error.restore();
        restoreUserResponse();
        done();
      });
    });
  });
});
