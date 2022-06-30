import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, {
  BButton, BFormInput, BFormRadio,
  BTbody
} from 'bootstrap-vue';
import moxios from 'moxios';
import TokensComponent from '../../../../resources/js/components/Room/TokensComponent';
import Clipboard from 'v-clipboard';
import Vuex from 'vuex';
import sinon from 'sinon';
import PermissionService from '../../../../resources/js/services/PermissionService';
import VueRouter from 'vue-router';
import RoomView from '../../../../resources/js/views/rooms/View';
import _ from 'lodash';
import Base from '../../../../resources/js/api/base';

const routerMock = new VueRouter({
  mode: 'abstract',
  routes: [{
    path: '/rooms/:id/:token?',
    name: 'rooms.view',
    component: RoomView
  }]
});

const localVue = createLocalVue();

const i18nDateMock = (date, format) => {
  return new Date(date).toLocaleString('en-US', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
};

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};

localVue.use(BootstrapVue);
localVue.use(Clipboard);
localVue.use(Vuex);
localVue.use(VueRouter);

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], modelName: 'User', room_limit: -1 };
const exampleRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 1, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: false, running: false };

const store = new Vuex.Store({
  modules: {
    session: {
      namespaced: true,
      actions: {
        getCurrentUser () {}
      },
      state: {
        currentUser: exampleUser
      },
      getters: {
        isAuthenticated: (state) => !$.isEmptyObject(state.currentUser),
        settings: () => (setting) => null
      },
      mutations: {
        setCurrentUser (state, { currentUser, emit = true }) {
          state.currentUser = currentUser;
          PermissionService.setCurrentUser(state.currentUser, emit);
        }
      }
    }
  },
  state: {
    loadingCounter: 0
  }
});

describe('Room Token', () => {
  beforeEach(() => {
    moxios.install();
    store.commit('session/setCurrentUser', { currentUser: exampleUser });
  });
  afterEach(() => {
    moxios.uninstall();
  });

  it('load tokens', done => {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const view = mount(TokensComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: i18nDateMock
      },
      propsData: {
        room: exampleRoom
      },
      store,
      attachTo: createContainer()
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();
      const request = moxios.requests.mostRecent();
      expect(request.url).toEqual('/api/v1/rooms/123-456-789/tokens');
      await request.respondWith({
        status: 200,
        response: {
          data: [
            { token: '1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R', firstname: 'John', lastname: 'Doe', role: 1, expires: '2021-10-17T12:21:19.000000Z', last_usage: '2021-09-17T14:36:11.000000Z' },
            { token: 'hexlwS0qlin6aFiWe7aFVTWM4RhsUEAZRklH12tBMiGLHMfArzOE7UZMbLFu5rQu4NwEBg7EfDH1hDxUm1NuQ05gAB4VO6aB4Tus', firstname: 'Max', lastname: 'Mustermann', role: 2, expires: '2021-10-20T09:17:02.000000Z', last_usage: '2021-10-03T17:24:10.000000Z' }
          ]
        }
      });

      await view.vm.$nextTick();
      const table = view.findComponent(BTbody);
      const rows = table.findAll('tr').wrappers.map(row => row.findAll('td'));
      expect(rows[0].at(0).text()).toBe('John');
      expect(rows[0].at(1).text()).toBe('Doe');
      expect(rows[0].at(2).text()).toBe('rooms.tokens.roles.participant');
      expect(rows[0].at(3).text()).toBe('09/17/2021, 16:36');
      expect(rows[0].at(4).text()).toBe('10/17/2021, 14:21');

      const buttonsRow0 = rows[0].at(5).findAll('button');
      expect(buttonsRow0.length).toBe(3);

      expect(buttonsRow0.at(0).html()).toContain('fa-solid fa-link');
      expect(buttonsRow0.at(1).html()).toContain('fa-solid fa-pen-square');
      expect(buttonsRow0.at(2).html()).toContain('fa-solid fa-trash');
      expect(buttonsRow0.length).toBe(3);

      expect(rows.length).toBe(2);

      // reload with empty response
      const reloadButton = view.findAllComponents(BButton).at(1);
      expect(reloadButton.html()).toContain('fa-solid fa-sync');
      await reloadButton.trigger('click');

      moxios.wait(async () => {
        await view.vm.$nextTick();
        const request = moxios.requests.mostRecent();
        expect(request.url).toEqual('/api/v1/rooms/123-456-789/tokens');
        await request.respondWith({
          status: 200,
          response: {
            data: []
          }
        });

        await view.vm.$nextTick();
        const table = view.findComponent(BTbody);
        const rows = table.findAll('tr');
        expect(rows.length).toBe(1);
        expect(rows.at(0).text()).toContain('rooms.tokens.nodata');

        // reload without owner permissions to check edit buttons missing
        await reloadButton.trigger('click');
        moxios.wait(async () => {
          await view.vm.$nextTick();
          const request = moxios.requests.mostRecent();
          expect(request.url).toEqual('/api/v1/rooms/123-456-789/tokens');
          await request.respondWith({
            status: 200,
            response: {
              data: [
                { token: '1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R', firstname: 'John', lastname: 'Doe', role: 1, expires: '2021-10-17T12:21:19.000000Z', last_usage: '2021-09-17T14:36:11.000000Z' },
                { token: 'hexlwS0qlin6aFiWe7aFVTWM4RhsUEAZRklH12tBMiGLHMfArzOE7UZMbLFu5rQu4NwEBg7EfDH1hDxUm1NuQ05gAB4VO6aB4Tus', firstname: 'Max', lastname: 'Mustermann', role: 2, expires: '2021-10-20T09:17:02.000000Z', last_usage: '2021-10-03T17:24:10.000000Z' }
              ]
            }
          });

          await view.vm.$nextTick();

          // change owner
          const newRoom = _.cloneDeep(view.vm.room);
          newRoom.owner.id = 2;
          await view.setProps({ room: newRoom });
          await view.vm.$nextTick();

          // check if reload buttons position changed due to missing add button
          expect(view.findAllComponents(BButton).at(0).html()).toContain('fa-solid fa-sync');

          // check if the edit and delete buttons are missing
          const table = view.findComponent(BTbody);
          const rows = table.findAll('tr').wrappers.map(row => row.findAll('td'));
          const buttonsRow0 = rows[0].at(5).findAll('button');
          expect(buttonsRow0.length).toBe(1);
          expect(buttonsRow0.at(0).html()).toContain('fa-solid fa-link');

          // reload without owner permissions to check edit buttons missing
          await reloadButton.trigger('click');
          moxios.wait(async () => {
            await view.vm.$nextTick();
            const request = moxios.requests.mostRecent();
            expect(request.url).toEqual('/api/v1/rooms/123-456-789/tokens');
            await request.respondWith({
              status: 500,
              response: {
                message: 'Internal server error'
              }
            });

            sinon.assert.calledOnce(Base.error);
            Base.error.restore();

            view.destroy();
            done();
          });
        });
      });
    });
  });

  it('copy to clipboard', done => {
    const clipboardSpy = sinon.spy();

    const flashMessageSpy = sinon.spy();
    const flashMessage = {
      info (param) {
        flashMessageSpy(param);
      }
    };

    const view = mount(TokensComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        $d: i18nDateMock,
        $clipboard: clipboardSpy,
        flashMessage: flashMessage
      },
      propsData: {
        room: exampleRoom
      },
      router: routerMock,
      store,
      attachTo: createContainer()
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();
      const request = moxios.requests.mostRecent();
      expect(request.url).toEqual('/api/v1/rooms/123-456-789/tokens');
      await request.respondWith({
        status: 200,
        response: {
          data: [
            { token: '1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R', firstname: 'John', lastname: 'Doe', role: 1, expires: '2021-10-17T12:21:19.000000Z', last_usage: '2021-09-17T14:36:11.000000Z' },
            { token: 'hexlwS0qlin6aFiWe7aFVTWM4RhsUEAZRklH12tBMiGLHMfArzOE7UZMbLFu5rQu4NwEBg7EfDH1hDxUm1NuQ05gAB4VO6aB4Tus', firstname: 'Max', lastname: 'Mustermann', role: 2, expires: '2021-10-20T09:17:02.000000Z', last_usage: '2021-10-03T17:24:10.000000Z' }
          ]
        }
      });

      await view.vm.$nextTick();
      const table = view.findComponent(BTbody);
      const buttonsRow0 = table.findAll('tr').at(0).findAll('td').at(5).findAll('button');
      expect(buttonsRow0.at(0).html()).toContain('fa-solid fa-link');
      await buttonsRow0.at(0).trigger('click');

      sinon.assert.calledOnce(clipboardSpy);
      sinon.assert.calledWith(clipboardSpy, process.env.MIX_FRONTEND_BASE_URL + '/rooms/123-456-789/1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R');

      sinon.assert.calledOnce(flashMessageSpy);
      sinon.assert.calledWith(flashMessageSpy, { message: 'rooms.tokens.roomLinkCopied:{"firstname":"John","lastname":"Doe"}' });

      view.destroy();
      done();
    });
  });

  it('delete token', done => {
    const view = mount(TokensComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        $d: i18nDateMock
      },
      propsData: {
        room: exampleRoom,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      router: routerMock,
      store,
      attachTo: createContainer()
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();
      const request = moxios.requests.mostRecent();
      expect(request.url).toEqual('/api/v1/rooms/123-456-789/tokens');
      await request.respondWith({
        status: 200,
        response: {
          data: [
            { token: '1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R', firstname: 'John', lastname: 'Doe', role: 1, expires: '2021-10-17T12:21:19.000000Z', last_usage: '2021-09-17T14:36:11.000000Z' },
            { token: 'hexlwS0qlin6aFiWe7aFVTWM4RhsUEAZRklH12tBMiGLHMfArzOE7UZMbLFu5rQu4NwEBg7EfDH1hDxUm1NuQ05gAB4VO6aB4Tus', firstname: 'Max', lastname: 'Mustermann', role: 2, expires: '2021-10-20T09:17:02.000000Z', last_usage: '2021-10-03T17:24:10.000000Z' }
          ]
        }
      });

      await view.vm.$nextTick();

      expect(view.findComponent({ ref: 'delete-token-modal' }).find('.modal').element.style.display).toEqual('none');
      const table = view.findComponent(BTbody);
      const buttonsRow0 = table.findAll('tr').at(0).findAll('td').at(5).findAll('button');
      expect(buttonsRow0.at(2).html()).toContain('fa-solid fa-trash');
      await buttonsRow0.at(2).trigger('click');

      view.vm.$root.$once('bv::modal::shown', async () => {
        await view.vm.$nextTick();

        const modal = view.findComponent({ ref: 'delete-token-modal' });
        expect(modal.find('.modal').element.style.display).toEqual('block');
        expect(modal.find('.modal-body').text()).toContain('rooms.tokens.modals.delete.confirm:{"firstname":"John","lastname":"Doe"}');

        const confirmButton = modal.findAllComponents(BButton).at(1);
        expect(confirmButton.text()).toBe('app.yes');
        await confirmButton.trigger('click');

        moxios.wait(async () => {
          await view.vm.$nextTick();
          const request = moxios.requests.mostRecent();
          expect(request.config.method).toEqual('delete');
          expect(request.url).toEqual('/api/v1/rooms/123-456-789/tokens/1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R');

          view.vm.$root.$once('bv::modal::hidden', async () => {
            await view.vm.$nextTick();
            expect(modal.find('.modal').element.style.display).toEqual('none');

            moxios.wait(async () => {
              await view.vm.$nextTick();
              const request = moxios.requests.mostRecent();
              expect(request.config.method).toEqual('get');
              expect(request.url).toEqual('/api/v1/rooms/123-456-789/tokens');

              await request.respondWith({
                status: 200,
                response: {
                  data: [
                    { token: 'hexlwS0qlin6aFiWe7aFVTWM4RhsUEAZRklH12tBMiGLHMfArzOE7UZMbLFu5rQu4NwEBg7EfDH1hDxUm1NuQ05gAB4VO6aB4Tus', firstname: 'Max', lastname: 'Mustermann', role: 2, expires: '2021-10-20T09:17:02.000000Z', last_usage: '2021-10-03T17:24:10.000000Z' }
                  ]
                }
              });

              await view.vm.$nextTick();

              const table = view.findComponent(BTbody);
              const rows = table.findAll('tr').wrappers.map(row => row.findAll('td'));
              expect(rows[0].at(0).text()).toBe('Max');
              expect(rows[0].at(1).text()).toBe('Mustermann');
              expect(rows[0].at(2).text()).toBe('rooms.tokens.roles.moderator');
              expect(rows[0].at(3).text()).toBe('10/03/2021, 19:24');
              expect(rows[0].at(4).text()).toBe('10/20/2021, 11:17');
              expect(rows.length).toBe(1);

              view.destroy();
              done();
            });
          });

          await request.respondWith({
            status: 204
          });
        });
      });
    });
  });

  it('delete token error', done => {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const view = mount(TokensComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        $d: i18nDateMock
      },
      propsData: {
        room: exampleRoom,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      router: routerMock,
      store,
      attachTo: createContainer()
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();
      const request = moxios.requests.mostRecent();
      expect(request.url).toEqual('/api/v1/rooms/123-456-789/tokens');
      await request.respondWith({
        status: 200,
        response: {
          data: [
            { token: '1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R', firstname: 'John', lastname: 'Doe', role: 1, expires: '2021-10-17T12:21:19.000000Z', last_usage: '2021-09-17T14:36:11.000000Z' },
            { token: 'hexlwS0qlin6aFiWe7aFVTWM4RhsUEAZRklH12tBMiGLHMfArzOE7UZMbLFu5rQu4NwEBg7EfDH1hDxUm1NuQ05gAB4VO6aB4Tus', firstname: 'Max', lastname: 'Mustermann', role: 2, expires: '2021-10-20T09:17:02.000000Z', last_usage: '2021-10-03T17:24:10.000000Z' }
          ]
        }
      });

      await view.vm.$nextTick();

      expect(view.findComponent({ ref: 'delete-token-modal' }).find('.modal').element.style.display).toEqual('none');
      const table = view.findComponent(BTbody);
      const buttonsRow0 = table.findAll('tr').at(0).findAll('td').at(5).findAll('button');
      expect(buttonsRow0.at(2).html()).toContain('fa-solid fa-trash');
      await buttonsRow0.at(2).trigger('click');

      view.vm.$root.$once('bv::modal::shown', async () => {
        await view.vm.$nextTick();

        const modal = view.findComponent({ ref: 'delete-token-modal' });
        expect(modal.find('.modal').element.style.display).toEqual('block');
        expect(modal.find('.modal-body').text()).toContain('rooms.tokens.modals.delete.confirm:{"firstname":"John","lastname":"Doe"}');

        const confirmButton = modal.findAllComponents(BButton).at(1);
        expect(confirmButton.text()).toBe('app.yes');
        await confirmButton.trigger('click');

        moxios.wait(async () => {
          await view.vm.$nextTick();
          const request = moxios.requests.mostRecent();
          expect(request.config.method).toEqual('delete');
          expect(request.url).toEqual('/api/v1/rooms/123-456-789/tokens/1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R');

          view.vm.$root.$once('bv::modal::hidden', async () => {
            await view.vm.$nextTick();
            expect(modal.find('.modal').element.style.display).toEqual('none');

            sinon.assert.calledOnce(Base.error);
            Base.error.restore();

            moxios.wait(async () => {
              await view.vm.$nextTick();
              const request = moxios.requests.mostRecent();
              expect(request.config.method).toEqual('get');
              expect(request.url).toEqual('/api/v1/rooms/123-456-789/tokens');

              await request.respondWith({
                status: 200,
                response: {
                  data: [
                    { token: '1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R', firstname: 'John', lastname: 'Doe', role: 1, expires: '2021-10-17T12:21:19.000000Z', last_usage: '2021-09-17T14:36:11.000000Z' },
                    { token: 'hexlwS0qlin6aFiWe7aFVTWM4RhsUEAZRklH12tBMiGLHMfArzOE7UZMbLFu5rQu4NwEBg7EfDH1hDxUm1NuQ05gAB4VO6aB4Tus', firstname: 'Max', lastname: 'Mustermann', role: 2, expires: '2021-10-20T09:17:02.000000Z', last_usage: '2021-10-03T17:24:10.000000Z' }
                  ]
                }
              });

              await view.vm.$nextTick();

              const table = view.findComponent(BTbody);
              const rows = table.findAll('tr').wrappers.map(row => row.findAll('td'));
              expect(rows[0].at(0).text()).toBe('John');
              expect(rows[0].at(1).text()).toBe('Doe');
              expect(rows[0].at(2).text()).toBe('rooms.tokens.roles.participant');
              expect(rows[0].at(3).text()).toBe('09/17/2021, 16:36');
              expect(rows[0].at(4).text()).toBe('10/17/2021, 14:21');
              expect(rows.length).toBe(2);

              view.destroy();
              done();
            });
          });

          await request.respondWith({
            status: 500,
            response: {
              message: 'Internal server error'
            }
          });
        });
      });
    });
  });

  it('edit token', done => {
    const view = mount(TokensComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        $d: i18nDateMock
      },
      propsData: {
        room: exampleRoom,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      router: routerMock,
      store,
      attachTo: createContainer()
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();
      const request = moxios.requests.mostRecent();
      expect(request.url).toEqual('/api/v1/rooms/123-456-789/tokens');
      await request.respondWith({
        status: 200,
        response: {
          data: [
            { token: '1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R', firstname: 'John', lastname: 'Doe', role: 1, expires: '2021-10-17T12:21:19.000000Z', last_usage: '2021-09-17T14:36:11.000000Z' },
            { token: 'hexlwS0qlin6aFiWe7aFVTWM4RhsUEAZRklH12tBMiGLHMfArzOE7UZMbLFu5rQu4NwEBg7EfDH1hDxUm1NuQ05gAB4VO6aB4Tus', firstname: 'Max', lastname: 'Mustermann', role: 2, expires: '2021-10-20T09:17:02.000000Z', last_usage: '2021-10-03T17:24:10.000000Z' }
          ]
        }
      });

      await view.vm.$nextTick();

      expect(view.findComponent({ ref: 'add-edit-token-modal' }).find('.modal').element.style.display).toEqual('none');
      const table = view.findComponent(BTbody);
      const buttonsRow0 = table.findAll('tr').at(0).findAll('td').at(5).findAll('button');
      expect(buttonsRow0.at(1).html()).toContain('fa-solid fa-pen-square');
      await buttonsRow0.at(1).trigger('click');

      view.vm.$root.$once('bv::modal::shown', async () => {
        await view.vm.$nextTick();

        const modal = view.findComponent({ ref: 'add-edit-token-modal' });

        expect(modal.find('.modal').element.style.display).toEqual('block');
        expect(modal.find('.modal-header').text()).toContain('rooms.tokens.edit');

        expect(modal.findAllComponents(BFormInput).at(0).element.value).toBe('John');
        expect(modal.findAllComponents(BFormInput).at(1).element.value).toBe('Doe');

        await modal.findAllComponents(BFormInput).at(0).setValue('Richard2');
        await modal.findAllComponents(BFormInput).at(1).setValue('Roe');

        expect(modal.findAllComponents(BFormRadio).at(0).find('input').element.checked).toBeTruthy();
        expect(modal.findAllComponents(BFormRadio).at(1).find('input').element.checked).toBeFalsy();

        await modal.findAllComponents(BFormRadio).at(1).find('input').setChecked();

        const confirmButton = modal.findAllComponents(BButton).at(1);
        expect(confirmButton.text()).toBe('app.save');
        await confirmButton.trigger('click');

        moxios.wait(async () => {
          await view.vm.$nextTick();
          const request = moxios.requests.mostRecent();
          expect(request.url).toEqual('/api/v1/rooms/123-456-789/tokens/1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R');
          expect(request.config.method).toEqual('put');

          const data = JSON.parse(request.config.data);

          expect(data.firstname).toEqual('Richard2');
          expect(data.lastname).toEqual('Roe');
          expect(data.role).toEqual(2);

          await request.respondWith({
            status: 422,
            response: {
              errors: {
                firstname: ['Firstname contains the following non-permitted characters: 2']
              }
            }
          });

          expect(modal.find('.modal').element.style.display).toEqual('block');
          expect(modal.findAllComponents(BFormInput).at(0).element.parentElement.innerHTML).toContain('Firstname contains the following non-permitted characters: 2');
          await modal.findAllComponents(BFormInput).at(0).setValue('Richard');

          await confirmButton.trigger('click');

          moxios.wait(async () => {
            await view.vm.$nextTick();
            const request = moxios.requests.mostRecent();
            expect(request.url).toEqual('/api/v1/rooms/123-456-789/tokens/1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R');
            expect(request.config.method).toEqual('put');

            const data = JSON.parse(request.config.data);

            expect(data.firstname).toEqual('Richard');
            expect(data.lastname).toEqual('Roe');
            expect(data.role).toEqual(2);

            view.vm.$root.$once('bv::modal::hidden', async () => {
              await view.vm.$nextTick();
              expect(modal.find('.modal').element.style.display).toEqual('none');

              moxios.wait(async () => {
                await view.vm.$nextTick();
                const request = moxios.requests.mostRecent();
                expect(request.url).toEqual('/api/v1/rooms/123-456-789/tokens');
                expect(request.config.method).toEqual('get');

                await request.respondWith({
                  status: 200,
                  response: {
                    data: [
                      { token: '1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R', firstname: 'Richard', lastname: 'Roe', role: 2, expires: '2021-10-17T12:21:19.000000Z', last_usage: '2021-09-17T14:36:11.000000Z' },
                      { token: 'hexlwS0qlin6aFiWe7aFVTWM4RhsUEAZRklH12tBMiGLHMfArzOE7UZMbLFu5rQu4NwEBg7EfDH1hDxUm1NuQ05gAB4VO6aB4Tus', firstname: 'Max', lastname: 'Mustermann', role: 2, expires: '2021-10-20T09:17:02.000000Z', last_usage: '2021-10-03T17:24:10.000000Z' }
                    ]
                  }
                });

                await view.vm.$nextTick();

                const table = view.findComponent(BTbody);
                const rows = table.findAll('tr').wrappers.map(row => row.findAll('td'));
                expect(rows[0].at(0).text()).toBe('Richard');
                expect(rows[0].at(1).text()).toBe('Roe');
                expect(rows[0].at(2).text()).toBe('rooms.tokens.roles.moderator');
                expect(rows[0].at(3).text()).toBe('09/17/2021, 16:36');
                expect(rows[0].at(4).text()).toBe('10/17/2021, 14:21');
                expect(rows.length).toBe(2);

                view.destroy();
                done();
              });
            });

            await request.respondWith({
              status: 200,
              response: {
                data: { token: '1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R', firstname: 'Richard', lastname: 'Roe', role: 2, expires: '2021-10-17T12:21:19.000000Z', last_usage: '2021-09-17T14:36:11.000000Z' }
              }
            });
          });
        });
      });
    });
  });

  it('add token', done => {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const view = mount(TokensComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        $d: i18nDateMock
      },
      propsData: {
        room: exampleRoom,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      router: routerMock,
      store,
      attachTo: createContainer()
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();
      const request = moxios.requests.mostRecent();
      expect(request.url).toEqual('/api/v1/rooms/123-456-789/tokens');
      await request.respondWith({
        status: 200,
        response: {
          data: [

          ]
        }
      });

      await view.vm.$nextTick();
      expect(view.findComponent({ ref: 'add-edit-token-modal' }).find('.modal').element.style.display).toEqual('none');

      const addButton = view.findComponent(BButton);
      expect(addButton.text()).toContain('rooms.tokens.add');
      await addButton.trigger('click');

      view.vm.$root.$once('bv::modal::shown', async () => {
        await view.vm.$nextTick();

        const modal = view.findComponent({ ref: 'add-edit-token-modal' });

        expect(modal.find('.modal').element.style.display).toEqual('block');
        expect(modal.find('.modal-header').text()).toContain('rooms.tokens.add');

        expect(modal.findAllComponents(BFormInput).at(0).element.value).toBe('');
        expect(modal.findAllComponents(BFormInput).at(1).element.value).toBe('');

        await modal.findAllComponents(BFormInput).at(0).setValue('Richard');
        await modal.findAllComponents(BFormInput).at(1).setValue('Roe');

        expect(modal.findAllComponents(BFormRadio).at(0).find('input').element.checked).toBeFalsy();
        expect(modal.findAllComponents(BFormRadio).at(1).find('input').element.checked).toBeFalsy();

        await modal.findAllComponents(BFormRadio).at(1).find('input').setChecked();

        const confirmButton = modal.findAllComponents(BButton).at(1);
        expect(confirmButton.text()).toBe('app.save');
        await confirmButton.trigger('click');

        moxios.wait(async () => {
          await view.vm.$nextTick();
          const request = moxios.requests.mostRecent();
          expect(request.config.method).toEqual('post');
          expect(request.url).toEqual('/api/v1/rooms/123-456-789/tokens');

          const data = JSON.parse(request.config.data);

          expect(data.firstname).toEqual('Richard');
          expect(data.lastname).toEqual('Roe');
          expect(data.role).toEqual(2);

          await request.respondWith({
            status: 500,
            response: {
              message: 'Internal server error'
            }
          });

          expect(modal.find('.modal').element.style.display).toEqual('block');

          sinon.assert.calledOnce(Base.error);
          Base.error.restore();

          await confirmButton.trigger('click');

          moxios.wait(async () => {
            await view.vm.$nextTick();
            const request = moxios.requests.mostRecent();
            expect(request.config.method).toEqual('post');
            expect(request.url).toEqual('/api/v1/rooms/123-456-789/tokens');

            const data = JSON.parse(request.config.data);

            expect(data.firstname).toEqual('Richard');
            expect(data.lastname).toEqual('Roe');
            expect(data.role).toEqual(2);

            view.vm.$root.$once('bv::modal::hidden', async () => {
              await view.vm.$nextTick();
              expect(modal.find('.modal').element.style.display).toEqual('none');

              moxios.wait(async () => {
                await view.vm.$nextTick();
                const request = moxios.requests.mostRecent();
                expect(request.config.method).toEqual('get');
                expect(request.url).toEqual('/api/v1/rooms/123-456-789/tokens');

                await request.respondWith({
                  status: 200,
                  response: {
                    data: [
                      { token: '1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R', firstname: 'Richard', lastname: 'Roe', role: 2, expires: '2021-10-17T12:21:19.000000Z', last_usage: '2021-09-17T14:36:11.000000Z' }
                    ]
                  }
                });

                await view.vm.$nextTick();

                const table = view.findComponent(BTbody);
                const rows = table.findAll('tr').wrappers.map(row => row.findAll('td'));
                expect(rows[0].at(0).text()).toBe('Richard');
                expect(rows[0].at(1).text()).toBe('Roe');
                expect(rows[0].at(2).text()).toBe('rooms.tokens.roles.moderator');
                expect(rows[0].at(3).text()).toBe('09/17/2021, 16:36');
                expect(rows[0].at(4).text()).toBe('10/17/2021, 14:21');
                expect(rows.length).toBe(1);

                view.destroy();
                done();
              });
            });

            await request.respondWith({
              status: 200,
              response: {
                data: { token: '1ZKctHSaGd7qLDpFa0emXSjoVTkJHkiTm0xajVOXhHU9BA9CCZquf6sDZtAAEGgdO40neF5dXITbH0CxhKM5940eW988WiIKxC8R', firstname: 'Richard', lastname: 'Roe', role: 2, expires: '2021-10-17T12:21:19.000000Z', last_usage: '2021-09-17T14:36:11.000000Z' }
              }
            });
          });
        });
      });
    });
  });
});
