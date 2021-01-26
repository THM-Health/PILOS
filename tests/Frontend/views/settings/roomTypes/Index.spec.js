import Index from '../../../../../resources/js/views/settings/roomTypes/Index';
import { createLocalVue, mount } from '@vue/test-utils';
import PermissionService from '../../../../../resources/js/services/PermissionService';
import moxios from 'moxios';
import BootstrapVue, {
  IconsPlugin,
  BTr,
  BTbody,
  BButton,
  BModal,
  BButtonClose,
  BFormSelect
} from 'bootstrap-vue';
import sinon from 'sinon';
import Base from '../../../../../resources/js/api/base';
import Vuex from 'vuex';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(IconsPlugin);

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};

const store = new Vuex.Store({
  modules: {
    session: {
      namespaced: true,
      getters: {
        settings: () => (setting) => setting === 'pagination_page_size' ? 5 : null
      }
    }
  }
});

describe('RoomTypesIndex', function () {
  beforeEach(function () {
    moxios.install();
  });

  afterEach(function () {
    moxios.uninstall();
  });

  it('list of room types with pagination gets displayed', function (done) {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['settings.manage'] });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      store,
      attachTo: createContainer()
    });

    moxios.wait(function () {
      expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');

      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: {
          data: [{
            id: '1',
            short: 'ME',
            color: '#333333',
            description: 'Meeting',
            model_name: 'RoomType'
          }]
        }
      }).then(() => {
        return view.vm.$nextTick();
      }).then(() => {
        const html = view.findComponent(BTbody).findComponent(BTr).html();
        expect(html).toContain('Meeting');
        expect(html).toContain('ME');

        view.destroy();
        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });
  });

  it('update and delete buttons only shown if user has the permission', function (done) {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['settings.manage'] });

    const response = {
      status: 200,
      response: {
        data: [{
          id: '1',
          short: 'ME',
          color: '#333333',
          description: 'Meeting',
          model_name: 'RoomType'
        }]
      }
    };

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      store
    });

    moxios.wait(function () {
      moxios.requests.mostRecent().respondWith(response).then(() => {
        return view.vm.$nextTick();
      }).then(() => {
        view.findComponent(BTbody).findAllComponents(BTr).wrappers.forEach((row) => {
          expect(row.findAllComponents(BButton).length).toEqual(0);
        });

        PermissionService.setCurrentUser({ permissions: ['settings.manage', 'roomTypes.update', 'roomTypes.view', 'roomTypes.delete'] });

        return view.vm.$nextTick();
      }).then(() => {
        const rows = view.findComponent(BTbody).findAllComponents(BTr);
        expect(rows.at(0).findAllComponents(BButton).length).toEqual(3);

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
      attachTo: createContainer(),
      store
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

  it('property gets cleared correctly if deletion gets aborted', function (done) {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'roomTypes.delete'] });

    const response = {
      status: 200,
      response: {
        data: [{
          id: '1',
          short: 'ME',
          color: '#333333',
          description: 'Meeting',
          model_name: 'RoomType'
        }]
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
      },
      store
    });

    moxios.wait(function () {
      moxios.requests.mostRecent().respondWith(response).then(() => {
        return view.vm.$nextTick();
      }).then(() => {
        expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
        expect(view.vm.$data.roomTypeToDelete).toBeUndefined();
        view.findComponent(BTbody).findComponent(BTr).findComponent(BButton).trigger('click');

        return view.vm.$nextTick();
      }).then(() => {
        expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
        expect(view.vm.$data.roomTypeToDelete.id).toEqual('1');
        view.findComponent(BModal).findComponent(BButtonClose).trigger('click');

        return view.vm.$nextTick();
      }).then(() => {
        expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
        expect(view.vm.$data.roomTypeToDelete).toBeUndefined();

        view.destroy();
        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });
  });

  it('room types delete', function (done) {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'roomTypes.delete'] });

    const response = {
      status: 200,
      response: {
        data: [
          {
            id: '1',
            short: 'ME',
            color: '#333333',
            description: 'Meeting',
            model_name: 'RoomType'
          },
          {
            id: '2',
            short: 'TE',
            color: '#333333',
            description: 'Test',
            model_name: 'RoomType'
          }
        ]
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
      },
      store
    });

    moxios.wait(async () => {
      await moxios.requests.mostRecent().respondWith(response);
      await view.vm.$nextTick();

      expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
      expect(view.vm.$data.roomTypeToDelete).toBeUndefined();

      // check if two room types visible
      expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(2);

      // open delete modal for first room type
      view.findComponent(BTbody).findAllComponents(BTr).at(0).findComponent(BButton).trigger('click');
      await view.vm.$nextTick();

      expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
      expect(view.vm.$data.roomTypeToDelete.id).toEqual('1');
      view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
      await view.vm.$nextTick();

      moxios.wait(async () => {
        // delete without replacement
        const request = moxios.requests.mostRecent();
        expect(request.config.url).toBe('/api/v1/roomTypes/1');
        expect(request.config.method).toBe('delete');
        expect(request.config.data).toBe('{"replacement_room_type":null}');
        expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
        // error replacement required
        await request.respondWith({
          status: 422,
          response: {
            message: 'The given data was invalid.',
            errors: {
              replacement_room_type: ['test']
            }
          }
        });

        await view.vm.$nextTick();
        expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);

        // select replacement and delete again
        await view.findComponent(BModal).findComponent(BFormSelect).setValue(2);
        view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
        await view.vm.$nextTick();

        moxios.wait(async () => {
          // delete data with replacement
          const request = moxios.requests.mostRecent();
          expect(request.config.url).toBe('/api/v1/roomTypes/1');
          expect(request.config.method).toBe('delete');
          expect(request.config.data).toBe('{"replacement_room_type":2}');
          expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
          await request.respondWith({
            status: 204
          });

          moxios.wait(async () => {
            // reload data for roomTypes
            const request = moxios.requests.mostRecent();
            expect(request.config.url).toBe('/api/v1/roomTypes');
            expect(request.config.method).toBe('get');
            await request.respondWith({
              status: 200,
              response: {
                data: [
                  {
                    id: '2',
                    short: 'TE',
                    color: '#333333',
                    description: 'Test',
                    model_name: 'RoomType'
                  }
                ]
              }
            });

            await view.vm.$nextTick();
            // entry removed, modal closes and data reset
            expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(1);
            expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
            expect(view.vm.$data.roomTypeToDelete).toBeUndefined();

            view.destroy();
            PermissionService.setCurrentUser(oldUser);
            done();
          });
        });
      });
    });
  });

  it('room types delete 404 handling', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'roomTypes.delete'] });

    const response = {
      status: 200,
      response: {
        data: [
          {
            id: '1',
            short: 'ME',
            color: '#333333',
            description: 'Meeting',
            model_name: 'RoomType'
          },
          {
            id: '2',
            short: 'TE',
            color: '#333333',
            description: 'Test',
            model_name: 'RoomType'
          }
        ]
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
      },
      store
    });

    moxios.wait(async () => {
      await moxios.requests.mostRecent().respondWith(response);
      await view.vm.$nextTick();

      expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
      expect(view.vm.$data.roomTypeToDelete).toBeUndefined();

      // check if two room types visible
      expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(2);

      // open delete modal for first room type
      view.findComponent(BTbody).findAllComponents(BTr).at(0).findComponent(BButton).trigger('click');
      await view.vm.$nextTick();

      expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
      expect(view.vm.$data.roomTypeToDelete.id).toEqual('1');
      view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
      await view.vm.$nextTick();

      moxios.wait(async () => {
        // delete without replacement
        const request = moxios.requests.mostRecent();
        await request.respondWith({
          status: 404,
          response: {
            message: 'Test'
          }
        });
        moxios.wait(async () => {
          // reload data for roomTypes
          const request = moxios.requests.mostRecent();
          expect(request.config.url).toBe('/api/v1/roomTypes');
          expect(request.config.method).toBe('get');
          await request.respondWith({
            status: 200,
            response: {
              data: [
                {
                  id: '2',
                  short: 'TE',
                  color: '#333333',
                  description: 'Test',
                  model_name: 'RoomType'
                }
              ]
            }
          });

          await view.vm.$nextTick();
          // entry removed, modal closes and data reset
          expect(view.findComponent(BTbody).findAllComponents(BTr).length).toBe(1);
          expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
          expect(view.vm.$data.roomTypeToDelete).toBeUndefined();

          sinon.assert.calledOnce(Base.error);
          Base.error.restore();

          view.destroy();
          PermissionService.setCurrentUser(oldUser);
          done();
        });
      });
    });
  });

  it('room types delete error handler called', function (done) {
    const oldUser = PermissionService.currentUser;
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);
    PermissionService.setCurrentUser({ permissions: ['settings.manage', 'roomTypes.delete'] });

    const response = {
      status: 200,
      response: {
        data: [
          {
            id: '1',
            short: 'ME',
            color: '#333333',
            description: 'Meeting',
            model_name: 'RoomType'
          }
        ]
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
      },
      store
    });

    moxios.wait(async () => {
      await moxios.requests.mostRecent().respondWith(response);
      await view.vm.$nextTick();

      expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
      expect(view.vm.$data.roomTypeToDelete).toBeUndefined();

      // open delete modal for first room type
      view.findComponent(BTbody).findComponent(BTr).findComponent(BButton).trigger('click');
      await view.vm.$nextTick();

      expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
      expect(view.vm.$data.roomTypeToDelete.id).toEqual('1');
      view.findComponent(BModal).findAllComponents(BButton).at(1).trigger('click');
      await view.vm.$nextTick();

      moxios.wait(async () => {
        // delete
        const request = moxios.requests.mostRecent();
        expect(request.config.url).toBe('/api/v1/roomTypes/1');
        expect(request.config.method).toBe('delete');
        expect(request.config.data).toBe('{"replacement_room_type":null}');
        expect(view.findComponent(BModal).vm.$data.isVisible).toBe(true);
        // error replacement required
        await request.respondWith({
          status: 500
        });

        await view.vm.$nextTick();

        sinon.assert.calledOnce(Base.error);
        Base.error.restore();
        expect(view.findComponent(BModal).vm.$data.isVisible).toBe(false);
        expect(view.vm.$data.roomTypeToDelete).toBeUndefined();

        view.destroy();
        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });
  });

  it('new room type button is displayed if the user has the corresponding permissions', function (done) {
    const oldUser = PermissionService.currentUser;

    PermissionService.setCurrentUser({ permissions: ['settings.manage'] });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key
      },
      attachTo: createContainer(),
      store
    });

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: {
          data: []
        }
      }).then(() => {
        return view.vm.$nextTick();
      }).then(() => {
        expect(view.findComponent(BButton).exists()).toBeFalsy();
        PermissionService.setCurrentUser({ permissions: ['settings.manage', 'roomTypes.create'] });
        return view.vm.$nextTick();
      }).then(() => {
        expect(view.findComponent(BButton).html()).toContain('settings.roomTypes.new');
        view.destroy();
        PermissionService.setCurrentUser(oldUser);
        done();
      });
    });
  });
});
