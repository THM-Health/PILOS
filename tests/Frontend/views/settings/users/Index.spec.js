import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, { BButton, BButtonClose, BModal, BTbody, BTr, IconsPlugin } from 'bootstrap-vue';
import moxios from 'moxios';
import PermissionService from '../../../../../resources/js/services/PermissionService';
import Index from '../../../../../resources/js/views/settings/users/Index';
import sinon from 'sinon';
import Base from '../../../../../resources/js/api/base';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(IconsPlugin);

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};

describe('UsersIndex', function () {
  beforeEach(function () {
    moxios.install();
  });

  afterEach(function () {
    moxios.uninstall();
  });

  it('list of users with pagination gets displayed', function (done) {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['users.viewAny', 'settings.manage'] });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    moxios.wait(function () {
      expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: {
          data: [{
            id: 1,
            authenticator: 'users',
            email: 'john@doe.com',
            username: 'jdo',
            firstname: 'John',
            lastname: 'Doe',
            user_locale: 'en',
            model_name: 'User',
            room_limit: 0,
            updated_at: '2020-01-01 01:00:00'
          }],
          meta: {
            per_page: 1,
            current_page: 1,
            total: 1
          }
        }
      }).then(() => {
        return view.vm.$nextTick();
      }).then(() => {
        let html = view.findComponent(BTbody).findComponent(BTr).html();
        expect(html).toContain('1');
        expect(html).toContain('John');
        expect(html).toContain('Doe');
        expect(html).toContain('john@doe.com');
        expect(html).toContain('settings.users.authenticator.users');

        view.vm.$root.$emit('bv::refresh::table', 'users-table');

        moxios.wait(function () {
          expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

          const request = moxios.requests.mostRecent();
          request.respondWith({
            status: 200,
            response: {
              data: [{
                id: 2,
                authenticator: 'ldap',
                email: 'darth@vader.com',
                username: 'dvr',
                firstname: 'Darth',
                lastname: 'Vader',
                user_locale: 'de',
                model_name: 'User',
                room_limit: 0,
                updated_at: '2020-01-01 01:00:00'
              }],
              meta: {
                per_page: 1,
                current_page: 1,
                total: 1
              }
            }
          }).then(() => {
            html = view.findComponent(BTbody).findComponent(BTr).html();
            expect(html).toContain('2');
            expect(html).toContain('Darth');
            expect(html).toContain('Vader');
            expect(html).toContain('darth@vader.com');
            expect(html).toContain('settings.users.authenticator.ldap');

            view.destroy();
            PermissionService.setCurrentUser(oldUser);
            done();
          });
        });
      });
    });
  });

  it('reset password button only shown if the user has the permission and it works as expected', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);
    const flashMessageSpy = sinon.spy();
    const flashMessage = {
      success (param) {
        flashMessageSpy(param);
      }
    };

    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ id: 4, permissions: ['users.viewAny', 'settings.manage'] });

    const response = {
      status: 200,
      response: {
        data: [{
          id: 1,
          authenticator: 'users',
          email: 'john@doe.com',
          username: 'jdo',
          firstname: 'John',
          lastname: 'Doe',
          user_locale: 'en',
          model_name: 'User',
          room_limit: 0,
          updated_at: '2020-01-01 01:00:00'
        }, {
          id: 2,
          authenticator: 'users',
          email: 'john1@doe.com',
          username: 'jdo',
          firstname: 'John',
          lastname: 'Doe',
          user_locale: 'en',
          model_name: 'User',
          room_limit: 0,
          updated_at: '2020-01-01 01:00:00',
          initial_password_set: true
        }, {
          id: 3,
          authenticator: 'ldap',
          email: 'darth@vader.com',
          username: 'dvr',
          firstname: 'Darth',
          lastname: 'Vader',
          user_locale: 'de',
          model_name: 'User',
          room_limit: 0,
          updated_at: '2020-01-01 01:00:00'
        }],
        meta: {
          per_page: 3,
          current_page: 1,
          total: 3
        }
      }
    };

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key,
        flashMessage
      },
      attachTo: createContainer()
    });

    moxios.wait(function () {
      moxios.requests.mostRecent().respondWith(response).then(() => {
        return view.vm.$nextTick();
      }).then(() => {
        view.findComponent(BTbody).findAllComponents(BTr).wrappers.forEach((row) => {
          expect(row.findAllComponents(BButton).length).toEqual(0);
        });

        PermissionService.setCurrentUser({
          id: 4,
          permissions: ['users.viewAny', 'settings.manage', 'users.update']
        });

        return view.vm.$nextTick();
      }).then(() => {
        const rows = view.findComponent(BTbody).findAllComponents(BTr);
        expect(rows.at(0).findAllComponents(BButton).length).toEqual(2);
        expect(rows.at(1).findAllComponents(BButton).length).toEqual(1);
        expect(rows.at(2).findAllComponents(BButton).length).toEqual(1);

        rows.at(0).findAllComponents(BButton).filter(button => {
          return button.attributes('id') === 'resetPassword1'
        }).at(0).trigger('click');

        return view.vm.$nextTick();
      }).then(() => {
        moxios.wait(function () {
          const request = moxios.requests.mostRecent();

          expect(request.url).toBe('/api/v1/users/1/resetPassword');

          request.respondWith({
            status: 500,
            response: {
              message: 'Test'
            }
          }).then(() => {
            return view.vm.$nextTick();
          }).then(() => {
            sinon.assert.calledOnce(Base.error);
            Base.error.restore();
            view.findComponent(BTbody).findComponent(BTr).findAllComponents(BButton).filter(button => {
              return button.attributes('id') === 'resetPassword1'
            }).at(0).trigger('click');

            moxios.wait(function () {
              const request = moxios.requests.mostRecent();

              expect(request.url).toBe('/api/v1/users/1/resetPassword');

              request.respondWith({
                status: 200
              }).then(() => {
                expect(flashMessageSpy.calledOnce).toBeTruthy();
                expect(flashMessageSpy.getCall(0).args[0].title).toBe('settings.users.passwordResetSuccess');
                view.destroy();
                PermissionService.setCurrentUser(oldUser);
                done();
              });
            });
          });
        });
      });
    });
  });

  it('update and delete buttons only shown if user has the permission', function (done) {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ id: 1, permissions: ['users.viewAny', 'settings.manage'] });

    const response = {
      status: 200,
      response: {
        data: [{
          id: 1,
          authenticator: 'users',
          email: 'john@doe.com',
          username: 'jdo',
          firstname: 'John',
          lastname: 'Doe',
          user_locale: 'en',
          model_name: 'User',
          room_limit: 0,
          updated_at: '2020-01-01 01:00:00'
        }, {
          id: 2,
          authenticator: 'ldap',
          email: 'darth@vader.com',
          username: 'dvr',
          firstname: 'Darth',
          lastname: 'Vader',
          user_locale: 'de',
          model_name: 'User',
          room_limit: 0,
          updated_at: '2020-01-01 01:00:00'
        }],
        meta: {
          per_page: 2,
          current_page: 1,
          total: 2
        }
      }
    };

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    moxios.wait(function () {
      moxios.requests.mostRecent().respondWith(response).then(() => {
        return view.vm.$nextTick();
      }).then(() => {
        view.findComponent(BTbody).findAllComponents(BTr).wrappers.forEach((row) => {
          expect(row.findAllComponents(BButton).length).toEqual(0);
        });

        PermissionService.setCurrentUser({ id: 1, permissions: ['users.viewAny', 'settings.manage', 'users.update', 'users.view', 'users.delete'] });

        return view.vm.$nextTick();
      }).then(() => {
        const rows = view.findComponent(BTbody).findAllComponents(BTr);
        expect(rows.at(0).findAllComponents(BButton).length).toEqual(2);
        expect(rows.at(1).findAllComponents(BButton).length).toEqual(3);

        view.destroy();
        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });
  });

  it('error handler gets called if an error occurs during loading of data', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 500,
        response: {
          message: 'Test'
        }
      }).then(() => {
        return view.vm.$nextTick();
      }).then(() => {
        sinon.assert.calledOnce(Base.error);
        Base.error.restore();
        view.destroy();
        done();
      });
    });
  });

  it('not own users can be deleted', function (done) {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ id: 1, permissions: ['users.viewAny', 'settings.manage', 'users.delete'] });

    const response = {
      status: 200,
      response: {
        data: [{
          id: 2,
          authenticator: 'ldap',
          email: 'darth@vader.com',
          username: 'dvr',
          firstname: 'Darth',
          lastname: 'Vader',
          user_locale: 'de',
          model_name: 'User',
          room_limit: 0,
          updated_at: '2020-01-01 01:00:00'
        }],
        meta: {
          per_page: 2,
          current_page: 1,
          total: 1
        }
      }
    };

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      }
    });

    moxios.wait(function () {
      moxios.requests.mostRecent().respondWith(response).then(() => {
        return view.vm.$nextTick();
      }).then(() => {
        expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
        view.findComponent(BTbody).findComponent(BTr).findComponent(BButton).trigger('click');

        return view.vm.$nextTick();
      }).then(() => {
        expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
        view.findComponent(BModal).vm.$refs['ok-button'].click();

        moxios.wait(function () {
          moxios.requests.mostRecent().respondWith({ status: 204 }).then(() => {
            expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
            expect(view.vm.$data.roleToDelete).toBeUndefined();

            view.destroy();
            PermissionService.setCurrentUser(oldUser);
            done();
          });
        });
      });
    });
  });

  it('property gets cleared correctly if deletion gets aborted', function (done) {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['users.viewAny', 'settings.manage', 'users.delete'] });

    const response = {
      status: 200,
      response: {
        data: [{
          id: 2,
          authenticator: 'ldap',
          email: 'darth@vader.com',
          username: 'dvr',
          firstname: 'Darth',
          lastname: 'Vader',
          user_locale: 'de',
          model_name: 'User',
          room_limit: 0,
          updated_at: '2020-01-01 01:00:00'
        }],
        meta: {
          per_page: 2,
          current_page: 1,
          total: 1
        }
      }
    };

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      }
    });

    moxios.wait(function () {
      moxios.requests.mostRecent().respondWith(response).then(() => {
        return view.vm.$nextTick();
      }).then(() => {
        expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
        expect(view.vm.$data.userToDelete).toBeUndefined();
        view.findComponent(BTbody).findComponent(BTr).findComponent(BButton).trigger('click');

        return view.vm.$nextTick();
      }).then(() => {
        expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
        expect(view.vm.$data.userToDelete.id).toEqual(2);
        view.findComponent(BModal).findComponent(BButtonClose).trigger('click');

        return view.vm.$nextTick();
      }).then(() => {
        expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
        expect(view.vm.$data.userToDelete).toBeUndefined();

        view.destroy();
        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });
  });

  it('new user button is displayed if the user has the corresponding permissions', function (done) {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['users.viewAny', 'settings.manage', 'users.create'] });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer()
    });

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: {
          data: [],
          meta: {
            per_page: 2,
            current_page: 1,
            total: 0
          }
        }
      }).then(() => {
        return view.vm.$nextTick();
      }).then(() => {
        expect(view.findComponent(BButton).html()).toContain('settings.users.new');

        view.destroy();
        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });
  });
});
