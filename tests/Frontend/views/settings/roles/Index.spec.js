import Index from '../../../../../resources/js/views/settings/roles/Index';
import { createLocalVue, mount } from '@vue/test-utils';
import PermissionService from '../../../../../resources/js/services/PermissionService';
import moxios from 'moxios';
import BootstrapVue, { BTr, BTbody, BButton, BModal, BButtonClose } from 'bootstrap-vue';
import Base from '../../../../../resources/js/api/base';
import { waitMoxios } from '../../../helper';

const localVue = createLocalVue();
localVue.use(BootstrapVue);

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};

describe('RolesIndex', () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it('list of roles with pagination gets displayed', async () => {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['roles.viewAny', 'settings.manage'] });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key,
        $te: key => key === 'app.roles.admin'
      },
      attachTo: createContainer()
    });

    await waitMoxios(function () {
      expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: {
          data: [{
            id: '1',
            name: 'Test',
            default: false,
            model_name: 'Role'
          }],
          meta: {
            per_page: 1,
            current_page: 1,
            total: 1
          }
        }
      }).then(() => {
        return view.vm.$nextTick();
      }).then(async () => {
        let html = view.findComponent(BTbody).findComponent(BTr).html();
        expect(html).toContain('Test');
        expect(html).toContain('app.no');
        expect(html).toContain('1');

        view.vm.$root.$emit('bv::refresh::table', 'roles-table');

        await waitMoxios(function () {
          expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

          const request = moxios.requests.mostRecent();
          request.respondWith({
            status: 200,
            response: {
              data: [{
                id: '2',
                name: 'admin',
                default: true,
                model_name: 'Role'
              }],
              meta: {
                per_page: 1,
                current_page: 1,
                total: 1
              }
            }
          }).then(() => {
            html = view.findComponent(BTbody).findComponent(BTr).html();

            expect(html).toContain('app.roles.admin');
            expect(html).toContain('app.yes');
            expect(html).toContain('2');

            view.destroy();
            PermissionService.setCurrentUser(oldUser);
          });
        });
      });
    });
  });

  it('update and delete buttons only shown if user has the permission and the role is not system default',
    async () => {
      const oldUser = PermissionService.currentUser;

      PermissionService.setCurrentUser({ permissions: ['roles.viewAny', 'settings.manage'] });

      const response = {
        status: 200,
        response: {
          data: [{
            id: '1',
            name: 'Test',
            default: false,
            model_name: 'Role'
          }, {
            id: '2',
            name: 'admin',
            default: true,
            model_name: 'Role'
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
          $t: key => key,
          $te: key => key === 'app.roles.admin'
        },
        attachTo: createContainer()
      });

      await waitMoxios(function () {
        moxios.requests.mostRecent().respondWith(response).then(() => {
          return view.vm.$nextTick();
        }).then(() => {
          view.findComponent(BTbody).findAllComponents(BTr).wrappers.forEach((row) => {
            expect(row.findAllComponents(BButton).length).toEqual(0);
          });

          PermissionService.setCurrentUser({ permissions: ['roles.viewAny', 'settings.manage', 'roles.update', 'roles.view', 'roles.delete'] });

          return view.vm.$nextTick();
        }).then(() => {
          const rows = view.findComponent(BTbody).findAllComponents(BTr);
          expect(rows.at(0).findAllComponents(BButton).length).toEqual(3);
          expect(rows.at(1).findAllComponents(BButton).length).toEqual(1);
          expect(rows.at(1).findComponent(BButton).html()).toContain('settings.roles.view');

          view.destroy();
          PermissionService.setCurrentUser(oldUser);
        });
      });
    }
  );

  it('error handler gets called if an error occurs during loading of data',
    async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();

      const view = mount(Index, {
        localVue,
        mocks: {
          $t: key => key,
          $te: key => key === 'app.roles.admin'
        },
        attachTo: createContainer()
      });

      await waitMoxios(function () {
        const request = moxios.requests.mostRecent();
        request.respondWith({
          status: 500,
          response: {
            message: 'Test'
          }
        }).then(() => {
          return view.vm.$nextTick();
        }).then(() => {
          expect(spy).toBeCalledTimes(1);
          Base.error.restore();
          view.destroy();
        });
      });
    }
  );

  it('not system roles can be deleted', async () => {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['roles.viewAny', 'settings.manage', 'roles.delete'] });

    const response = {
      status: 200,
      response: {
        data: [{
          id: '1',
          name: 'Test',
          default: false,
          model_name: 'Role'
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
        $t: key => key,
        $te: key => key === 'app.roles.admin'
      },
      attachTo: createContainer(),
      propsData: {
        modalStatic: true
      }
    });

    await waitMoxios(function () {
      moxios.requests.mostRecent().respondWith(response).then(() => {
        return view.vm.$nextTick();
      }).then(() => {
        expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
        view.findComponent(BTbody).findComponent(BTr).findComponent(BButton).trigger('click');

        return view.vm.$nextTick();
      }).then(async () => {
        expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
        view.findComponent(BModal).vm.$refs['ok-button'].click();

        await waitMoxios(function () {
          moxios.requests.mostRecent().respondWith({ status: 204 }).then(() => {
            expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
            expect(view.vm.$data.roleToDelete).toBeUndefined();

            view.destroy();
            PermissionService.setCurrentUser(oldUser);
          });
        });
      });
    });
  });

  it('property gets cleared correctly if deletion gets aborted',
    async () => {
      const oldUser = PermissionService.currentUser;

      PermissionService.setCurrentUser({ permissions: ['roles.viewAny', 'settings.manage', 'roles.delete'] });

      const response = {
        status: 200,
        response: {
          data: [{
            id: '1',
            name: 'Test',
            default: false,
            model_name: 'Role'
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
          $t: key => key,
          $te: key => key === 'app.roles.admin'
        },
        attachTo: createContainer(),
        propsData: {
          modalStatic: true
        }
      });

      await waitMoxios(function () {
        moxios.requests.mostRecent().respondWith(response).then(() => {
          return view.vm.$nextTick();
        }).then(() => {
          expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
          expect(view.vm.$data.roleToDelete).toBeUndefined();
          view.findComponent(BTbody).findComponent(BTr).findComponent(BButton).trigger('click');

          return view.vm.$nextTick();
        }).then(() => {
          expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
          expect(view.vm.$data.roleToDelete.id).toEqual('1');
          view.findComponent(BModal).findComponent(BButtonClose).trigger('click');

          return view.vm.$nextTick();
        }).then(() => {
          expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
          expect(view.vm.$data.roleToDelete).toBeUndefined();

          view.destroy();
          PermissionService.setCurrentUser(oldUser);
        });
      });
    }
  );

  it('new role button is displayed if the user has the corresponding permissions',
    async () => {
      const oldUser = PermissionService.currentUser;

      PermissionService.setCurrentUser({ permissions: ['roles.viewAny', 'settings.manage', 'roles.create'] });

      const view = mount(Index, {
        localVue,
        mocks: {
          $t: key => key,
          $te: key => key === 'app.roles.admin'
        },
        attachTo: createContainer()
      });

      await waitMoxios(function () {
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
          expect(view.findComponent(BButton).html()).toContain('settings.roles.new');

          view.destroy();
          PermissionService.setCurrentUser(oldUser);
        });
      });
    }
  );
});
