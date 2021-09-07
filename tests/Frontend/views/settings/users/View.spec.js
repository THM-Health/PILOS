import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, {
  BButton,
  BForm,
  BFormCheckbox,
  BFormInput,
  BFormSelect,
  BFormSelectOption,
  BImg,
  BModal,
  IconsPlugin
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
      view.destroy();
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
      view.destroy();
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
      view.destroy();
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
      view.destroy();
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
      view.destroy();
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
      view.destroy();
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
        view.destroy();
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

          expect(request.config.data.get('firstname')).toBe('Max');
          expect(request.config.data.get('lastname')).toBe('Mustermann');
          expect(request.config.data.get('email')).toBe('max@mustermann.de');
          expect(request.config.data.has('password')).toBeFalsy();
          expect(request.config.data.has('password_confirmation')).toBeFalsy();
          expect(request.config.data.get('roles[0]')).toBe('3');
          expect(request.config.data.get('user_locale')).toBe('de');
          expect(request.config.data.get('generate_password')).toBe('1');
          view.destroy();
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
      view.destroy();
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
      expect(buttons.length).toEqual(5);
      expect(buttons.at(4).text()).toEqual('app.save');
      view.destroy();
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
      view.destroy();
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
              view.destroy();
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
      view.destroy();
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
      expect(store.state.session.logoutCount).toBe(1);
      sinon.assert.calledOnce(errorSpy);
      Base.error.restore();
      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, { name: 'home' });
      restoreUserResponse();
      view.destroy();
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
        view.destroy();
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

          expect(request.config.data.get('updated_at')).toBe(newModel.updated_at);
          expect(request.config.data.get('firstname')).toBe('Darth');
          expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);

          restoreUserResponse();
          view.destroy();
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

      moxios.wait(function () {
        const staleModelModal = view.findComponent({ ref: 'stale-user-modal' });
        expect(staleModelModal.vm.$data.isVisible).toBe(true);
        expect(view.findComponent(BFormInput).element.value).toBe('Darth');

        restoreUserResponse();

        staleModelModal.vm.$refs['cancel-button'].click();

        view.vm.$nextTick().then(() => {
          expect(view.findComponent(BFormInput).element.value).toBe('Test');
          expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
          view.destroy();
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
        view.destroy();
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
      store,
      router
    });

    moxios.wait(function () {
      sinon.assert.calledOnce(Base.error);
      sinon.assert.calledOnce(routerSpy);
      sinon.assert.calledWith(routerSpy, { name: 'settings.users' });
      Base.error.restore();
      restoreUserResponse();
      view.destroy();
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
      store
    });

    moxios.wait(function () {
      sinon.assert.calledOnce(Base.error);
      Base.error.restore();
      restoreUserResponse();
      view.destroy();
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
        view.destroy();
        done();
      });
    });
  });

  it('existing image save and delete', function (done) {
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
      store
    });

    moxios.wait(async () => {
      const image = view.findComponent(BImg);
      expect(image.exists()).toBeTruthy();
      expect(image.attributes('src')).toBe('http://domain.tld/storage/profile_images/abc.jpg');

      let buttons = view.findAllComponents(BButton);
      expect(buttons.length).toBe(5);
      expect(buttons.at(0).text()).toContain('settings.users.image.upload');

      const imageDeleteButton = buttons.at(1);
      expect(imageDeleteButton.text()).toContain('settings.users.image.delete');
      await imageDeleteButton.trigger('click');
      expect(image.attributes('src')).toBe('/images/default_profile.png');

      buttons = view.findAllComponents(BButton);
      expect(buttons.length).toBe(4);
      const undoButton = buttons.at(0);
      expect(undoButton.text()).toContain('settings.users.image.undo_delete');
      await undoButton.trigger('click');
      expect(image.attributes('src')).toBe('http://domain.tld/storage/profile_images/abc.jpg');

      view.findComponent(BForm).trigger('submit');

      moxios.wait(async () => {
        const request = moxios.requests.mostRecent();
        expect(request.config.data.has('image')).toBeFalsy();

        await request.respondWith({
          status: 200,
          response: ownUserResponse
        });
        await view.vm.$nextTick();

        let buttons = view.findAllComponents(BButton);
        expect(buttons.length).toBe(5);

        expect(buttons.at(0).text()).toContain('settings.users.image.upload');

        const imageDeleteButton = buttons.at(1);
        expect(imageDeleteButton.text()).toContain('settings.users.image.delete');
        await imageDeleteButton.trigger('click');
        expect(image.attributes('src')).toBe('/images/default_profile.png');

        buttons = view.findAllComponents(BButton);
        expect(buttons.length).toBe(4);

        view.findComponent(BForm).trigger('submit');

        const response = _.cloneDeep(ownUserResponse);
        response.data.image = null;
        const restoreUserResponse = overrideStub('/api/v1/users/1', {
          status: 200,
          response: response
        });

        moxios.wait(async () => {
          const request = moxios.requests.mostRecent();
          expect(request.config.data.get('image')).toBe('');
          await view.vm.$nextTick();

          const buttons = view.findAllComponents(BButton);
          expect(buttons.length).toBe(4);
          expect(buttons.at(0).text()).toContain('settings.users.image.upload');

          restoreUserResponse();
          view.destroy();
          done();
        });
      });
    });
  });

  it('select image', function (done) {
    /**
     * Fake cropper component due to limited canvas support for nodejs
     * @type {{template: string, methods: {getCroppedCanvas(): HTMLCanvasElement, replace(*)}, name: string}}
     */
    const cropperSpy = sinon.spy();
    const cropperComponent = {
      name: 'test-cropper',
      /* eslint-disable @intlify/vue-i18n/no-raw-text */
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
          ctx.font = '48px Arial';
          ctx.fillText('Hello world', 10, 50);
          return oc;
        }
      }
    };

    const flashMessageSpy = sinon.spy();
    const flashMessage = {
      error (param) {
        flashMessageSpy(param);
      }
    };

    const view = mount(View, {
      localVue,
      mocks: {
        $t: (key) => key,
        $te: () => false,
        flashMessage: flashMessage
      },
      propsData: {
        config: {
          id: 1,
          type: 'profile'
        },
        modalStatic: true
      },
      store,
      stubs: {
        VueCropper: cropperComponent
      }
    });

    moxios.wait(async () => {
      // Try to find profile image with image of the user
      const image = view.findComponent(BImg);
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
      expect(flashMessageSpy.calledOnce).toBeTruthy();
      expect(flashMessageSpy.getCall(0).args[0]).toEqual('settings.users.image.invalidMime');
      expect(modal.vm.$data.isVisible).toBeFalsy();

      const event = {
        target: {
          files: [
            { type: 'image/png' }
          ]
        }
      };

      const imageUpload = 'data:image/png;base64,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';
      global.FileReader = class {
        readAsDataURL () {
          this.onload({
            target: {
              result: imageUpload
            }
          });
        }
      };
      // check for valid image type, check modal for copper is open and cropper gets the image data
      view.vm.onFileSelect(event);
      await view.vm.$nextTick();
      expect(modal.vm.$data.isVisible).toBeTruthy();
      expect(modal.vm.$props.busy).toBeFalsy();
      expect(view.vm.$data.selectedFile).toBe(imageUpload);
      expect(cropperSpy.calledOnce).toBeTruthy();
      expect(cropperSpy.getCall(0).args[0]).toBe(imageUpload);

      // find modal button to confirm and click
      const modalButtons = modal.findAllComponents(BButton);
      expect(modalButtons.at(1).text()).toContain('settings.users.image.save');
      await modalButtons.at(1).trigger('click');

      // modal is open and busy while images are processed
      expect(modal.vm.$data.isVisible).toBeTruthy();
      expect(modal.vm.$props.busy).toBeTruthy();
      // wait for image to be processed
      setTimeout(() => {
        // check image as data url and blob
        const croppedImage = view.vm.$data.croppedImage;
        const croppedImageBlob = view.vm.$data.croppedImageBlob;
        const croppedExpectedImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCABkAGQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD2S+8TWOmeIE03ULm1tI3tfPWa4nWPcd+3aM4z61UtfG2nTWX2h98vmXNxDAllE9y0qRPtMgEYJ29CT0+YDPIrRl0ZZvEg1SURSRiz+ziN0yQd+7Ncze+AJJZI7iGSzeWOe7YRTo4jMc8gcfcZSGXaPY5PsQAabeMI5NTjgtIo57aV7QRzh/vLP5nOMdvLH51f07xTpOqXwtLWaUu4Zone3dI5wpwxjdgFcD/ZJ9enNY1n4IlsprVkuoSkJsyQsZQEw+ZuwMnGTJwMnGKn0bwvqFhPpMN1fW8tho0bR2SxwlZHBTYpkJJHypkcDknPHSgDXk8R6TFcx20l4FmkvPsKoUbJn2b9vT+7znpyOeRVO48a6Fbojm5mkjaMzM8VrK6xRhivmOQvyJlWwxwCASOATWV4h8D3Graxeajaagts8lujQAoT5d2roRMfX5YkXHpn1qa58IXtvHJbaJe21vbXGnRadMtxCXZEjDhXTDD5sO3B44B9cgFu98Y2MV6LOzWW5mS7htpmELiKMyOgx5m3aWAdW255BpF8Z2Nzr+n6XZpNL9qmlj85oZEjIjRixRyu18Mu04Peo4vCTwWslvFcIEOq298mQSQkYiG0+58vr71Dp3hbVLLUdHV7+0fTNJeUwIsLCV1dGVQzZxlQ2OBz146UAdfRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAH/2Q==';
        expect(croppedImage).toBe(croppedExpectedImage);
        expect(croppedImageBlob.type).toBe('image/jpeg');

        // check if image was replaced by cropped image
        const image = view.findComponent(BImg);
        expect(image.exists()).toBeTruthy();
        expect(image.attributes('src')).toBe(croppedExpectedImage);

        // check if modal is not busy anymore and closed
        expect(modal.vm.$props.busy).toBeFalsy();
        expect(modal.vm.$data.isVisible).toBeFalsy();

        // submit form to send cropped image to server
        view.findComponent(BForm).trigger('submit');
        moxios.wait(function () {
          const request = moxios.requests.mostRecent();
          // check if blob is sent to server
          expect(request.config.data.get('image') instanceof Blob).toBeTruthy();
          expect(request.config.data.get('image').type).toBe('image/jpeg');

          view.destroy();
          done();
        });
      }, 200);
    });
  });
});
