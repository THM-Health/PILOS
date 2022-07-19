import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, { BButton, BFormFile, BFormRadio, BTbody, BTr } from 'bootstrap-vue';
import moxios from 'moxios';
import MembersComponent from '../../../../resources/js/components/Room/MembersComponent.vue';
import Clipboard from 'v-clipboard';
import Vuex from 'vuex';
import sinon from 'sinon';
import Base from '../../../../resources/js/api/base';
import PermissionService from '../../../../resources/js/services/PermissionService';
import _ from 'lodash';

const localVue = createLocalVue();

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};

localVue.use(BootstrapVue);
localVue.use(Clipboard);
localVue.use(Vuex);

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], modelName: 'User', room_limit: -1 };
const ownerRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: false, running: false };
const coOwnerRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 2, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: true, isCoOwner: true, isModerator: false, canStart: false, running: false };
const exampleRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: false, isModerator: false, canStart: false, running: false };

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
        isAuthenticated: () => true,
        settings: () => (setting) => null
      }
    }
  },
  state: {
    loadingCounter: 0
  }
});

describe('RoomMembers', function () {
  beforeEach(function () {
    moxios.install();
  });
  afterEach(function () {
    moxios.uninstall();
  });

  it('load members', function (done) {
    const view = mount(MembersComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
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
      expect(request.url).toEqual('/api/v1/rooms/123-456-789/member');
      request.respondWith({
        status: 200,
        response: {
          data: [
            { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 1, image: null },
            { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 2, image: null },
            { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 3, image: 'http://domain.tld/storage/profile_images/1234abc.jpg' }
          ]
        }
      })
        .then(function () {
          expect(view.vm.$data.members).toHaveLength(3);

          const members = view.findComponent(BTbody);
          const rows = members.findAllComponents(BTr);
          expect(rows.length).toBe(3);

          // first member
          let img = rows.at(0).findAll('td').at(0).find('img');
          expect(img.exists()).toBeTruthy();
          expect(img.attributes('src')).toBe('/images/default_profile.png');
          expect(rows.at(0).findAll('td').at(1).text()).toBe('Laura');
          expect(rows.at(0).findAll('td').at(2).text()).toBe('Rivera');
          expect(rows.at(0).findAll('td').at(3).text()).toBe('LauraWRivera@domain.tld');
          expect(rows.at(0).findAll('td').at(4).text()).toBe('rooms.members.roles.participant');

          // second member
          expect(rows.at(1).findAll('td').at(1).text()).toBe('Juan');
          expect(rows.at(1).findAll('td').at(2).text()).toBe('Walter');
          expect(rows.at(1).findAll('td').at(3).text()).toBe('JuanMWalter@domain.tld');
          expect(rows.at(1).findAll('td').at(4).text()).toBe('rooms.members.roles.moderator');

          // third member
          img = rows.at(2).findAll('td').at(0).find('img');
          expect(img.exists()).toBeTruthy();
          expect(img.attributes('src')).toBe('http://domain.tld/storage/profile_images/1234abc.jpg');
          expect(rows.at(2).findAll('td').at(1).text()).toBe('Tammy');
          expect(rows.at(2).findAll('td').at(2).text()).toBe('Law');
          expect(rows.at(2).findAll('td').at(3).text()).toBe('TammyGLaw@domain.tld');
          expect(rows.at(2).findAll('td').at(4).text()).toBe('rooms.members.roles.co_owner');

          view.destroy();
          done();
        });
    });
  });

  it('show owner add and edit buttons', function (done) {
    PermissionService.setCurrentUser(exampleUser);
    const view = mount(MembersComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: ownerRoom
      },
      store,
      attachTo: createContainer()
    });
    view.vm.$nextTick().then(() => {
      expect(view.findComponent({ ref: 'add-member' }).exists()).toBeTruthy();

      const fields = view.vm.tableFields.map(a => a.key);
      expect(fields).toContain('firstname');
      expect(fields).toContain('lastname');
      expect(fields).toContain('email');
      expect(fields).toContain('role');
      expect(fields).toContain('actions');
      view.destroy();
      done();
    });
  });

  it('show co-owner add and edit buttons', function (done) {
    PermissionService.setCurrentUser(exampleUser);
    const view = mount(MembersComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: coOwnerRoom
      },
      store,
      attachTo: createContainer()
    });
    view.vm.$nextTick().then(() => {
      expect(view.findComponent({ ref: 'add-member' }).exists()).toBeTruthy();

      const fields = view.vm.tableFields.map(a => a.key);
      expect(fields).toContain('firstname');
      expect(fields).toContain('lastname');
      expect(fields).toContain('email');
      expect(fields).toContain('role');
      expect(fields).toContain('actions');

      view.destroy();
      done();
    });
  });

  it('hide add and edit buttons on room.viewAll permission', function (done) {
    const oldUser = PermissionService.currentUser;

    const newUser = _.clone(exampleUser);
    newUser.permissions = ['rooms.viewAll'];
    PermissionService.setCurrentUser(newUser);

    const view = mount(MembersComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: exampleRoom
      },
      store,
      attachTo: createContainer()
    });
    view.vm.$nextTick().then(() => {
      expect(view.findComponent(BFormFile).exists()).toBeFalsy();

      expect(view.findComponent({ ref: 'add-member' }).exists()).toBeFalsy();

      const fields = view.vm.tableFields.map(a => a.key);
      expect(fields).toContain('firstname');
      expect(fields).toContain('lastname');
      expect(fields).toContain('email');
      expect(fields).toContain('role');
      expect(fields).not.toContain('actions');

      PermissionService.setCurrentUser(oldUser);
      view.destroy();
      done();
    });
  });

  it('add and edit buttons on room.manage permission', function (done) {
    const oldUser = PermissionService.currentUser;

    const newUser = _.clone(exampleUser);
    newUser.permissions = ['rooms.manage'];
    PermissionService.setCurrentUser(newUser);

    const view = mount(MembersComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: exampleRoom
      },
      store,
      attachTo: createContainer()
    });
    view.vm.$nextTick().then(() => {
      expect(view.findComponent({ ref: 'add-member' }).exists()).toBeTruthy();

      const fields = view.vm.tableFields.map(a => a.key);
      expect(fields).toContain('firstname');
      expect(fields).toContain('lastname');
      expect(fields).toContain('email');
      expect(fields).toContain('role');
      expect(fields).toContain('actions');

      PermissionService.setCurrentUser(oldUser);
      view.destroy();
      done();
    });
  });

  it('error emitted on members load', function (done) {
    const spy = sinon.spy();
    sinon.stub(Base, 'error').callsFake(spy);

    const view = mount(MembersComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
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
      expect(request.url).toEqual('/api/v1/rooms/123-456-789/member');
      request.respondWith({
        status: 500,
        response: {
          message: 'Test'
        }
      })
        .then(function () {
          sinon.assert.calledOnce(Base.error);
          Base.error.restore();

          view.destroy();
          done();
        });
    });
  });

  it('add new member', function (done) {
    PermissionService.setCurrentUser(exampleUser);
    const view = mount(MembersComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        room: ownerRoom,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      store,
      attachTo: createContainer()
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();
      // load current member list
      const request = moxios.requests.mostRecent();
      expect(request.url).toEqual('/api/v1/rooms/123-456-789/member');
      await request.respondWith({
        status: 200,
        response: {
          data: [
            { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 1, image: null },
            { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 2, image: null },
            { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 3, image: null }
          ]
        }
      });

      // find modal
      const modal = view.findComponent({ ref: 'add-member-modal' });
      expect(modal.exists()).toBeTruthy();
      view.vm.$nextTick()
        .then(() => {
          const addButton = view.findComponent({ ref: 'add-member' });
          expect(addButton.exists()).toBeTruthy();
          // check if modal is closed and try to open it
          expect(modal.find('.modal').element.style.display).toEqual('none');
          addButton.trigger('click');
          return new Promise((resolve, reject) => {
            view.vm.$root.$once('bv::modal::shown', () => resolve());
          });
        })
        .then(() => {
          // check if modal is open
          expect(modal.find('.modal').element.style.display).toEqual('block');

          // find user search and enter query
          const searchField = modal.find('input');
          searchField.setValue('Laura').then(() => {
            moxios.wait(async () => {
              await view.vm.$nextTick();
              // check user search query request and respond with found users
              const request = moxios.requests.mostRecent();
              expect(request.url).toEqual('/api/v1/users/search?query=Laura');
              await request.respondWith({
                status: 200,
                response: {
                  data: [
                    { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', image: null },
                    { id: 10, firstname: 'Laura', lastname: 'Walter', email: 'LauraMWalter@domain.tld', image: null }
                  ]
                }
              });

              // check user options shown
              const userOptions = modal.findAll('li');
              // amount of users + no result and no options items
              expect(userOptions.length).toBe(4);
              expect(userOptions.at(0).text()).toBe('Laura RiveraLauraWRivera@domain.tld');
              expect(userOptions.at(1).text()).toBe('Laura WalterLauraMWalter@domain.tld');
              expect(userOptions.at(2).text()).toBe('rooms.members.modals.add.noResult');
              expect(userOptions.at(3).text()).toBe('rooms.members.modals.add.noOptions');

              expect(userOptions.at(0).find('span').classes()).toContain('multiselect__option--disabled');
              expect(userOptions.at(1).find('span').classes()).not.toContain('multiselect__option--disabled');

              // select new user
              await userOptions.at(1).find('span').trigger('click');
              expect(view.vm.$data.newMember.id).toBe(10);

              // check role selector, labels and values
              const roleSelector = modal.findAllComponents(BFormRadio);
              expect(roleSelector.length).toBe(3);
              expect(roleSelector.at(0).text()).toBe('rooms.members.roles.participant');
              expect(roleSelector.at(1).text()).toBe('rooms.members.roles.moderator');
              expect(roleSelector.at(2).text()).toBe('rooms.members.roles.co_owner');

              expect(roleSelector.at(0).find('input').attributes('value')).toBe('1');
              expect(roleSelector.at(1).find('input').attributes('value')).toBe('2');
              expect(roleSelector.at(2).find('input').attributes('value')).toBe('3');

              // select role moderator
              await roleSelector.at(1).find('input').setChecked();
              expect(view.vm.$data.newMember.role).toBe(2);

              // check modal action buttons
              const footerButtons = modal.find('footer').findAll('button');
              expect(footerButtons.length).toBe(2);
              expect(footerButtons.at(0).text()).toBe('rooms.members.modals.add.cancel');
              expect(footerButtons.at(1).text()).toBe('rooms.members.modals.add.add');

              // confirm add of new user
              await footerButtons.at(1).trigger('click');

              // check for request and respond
              moxios.wait(async () => {
                await view.vm.$nextTick();
                const request = moxios.requests.mostRecent();
                expect(request.config.method).toEqual('post');
                expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member');
                expect(JSON.parse(request.config.data)).toMatchObject({ user: 10, role: 2 });
                await request.respondWith({
                  status: 204
                });
              });

              // check is modal was closed after adding user successfully
              view.vm.$root.$once('bv::modal::hidden', () => {
                expect(modal.find('.modal').element.style.display).toEqual('none');

                // reload user list
                moxios.wait(async () => {
                  await view.vm.$nextTick();
                  const request = moxios.requests.mostRecent();
                  expect(request.config.method).toEqual('get');
                  expect(request.url).toEqual('/api/v1/rooms/123-456-789/member');
                  await request.respondWith({
                    status: 200,
                    response: {
                      data: [
                        { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 1, image: null },
                        { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 2, image: null },
                        { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 3, image: null },
                        { id: 10, firstname: 'Laura', lastname: 'Walter', email: 'LauraMWalter@domain.tld', role: 2, image: null }
                      ]
                    }
                  });

                  // check if user list was updated
                  expect(view.vm.$data.members).toHaveLength(4);

                  const members = view.findComponent(BTbody);
                  const rows = members.findAllComponents(BTr);
                  expect(rows.length).toBe(4);

                  // new member
                  expect(rows.at(3).findAll('td').at(1).text()).toBe('Laura');
                  expect(rows.at(3).findAll('td').at(2).text()).toBe('Walter');
                  expect(rows.at(3).findAll('td').at(3).text()).toBe('LauraMWalter@domain.tld');
                  expect(rows.at(3).findAll('td').at(4).text()).toBe('rooms.members.roles.moderator');

                  view.destroy();
                  done();
                });
              });
            });
          });
        });
    });
  });

  it('add new member errors', function (done) {
    PermissionService.setCurrentUser(exampleUser);
    const baseError = sinon.stub(Base, 'error');
    const view = mount(MembersComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        room: ownerRoom,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      store,
      attachTo: createContainer()
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();
      // load current member list
      const request = moxios.requests.mostRecent();
      expect(request.url).toEqual('/api/v1/rooms/123-456-789/member');
      await request.respondWith({
        status: 200,
        response: {
          data: []
        }
      });

      // find modal
      const modal = view.findComponent({ ref: 'add-member-modal' });
      expect(modal.exists()).toBeTruthy();
      view.vm.$nextTick()
        .then(() => {
          // check if modal is closed and try to open it
          expect(modal.find('.modal').element.style.display).toEqual('none');
          view.findComponent({ ref: 'add-member' }).trigger('click');
          return new Promise((resolve, reject) => {
            view.vm.$root.$once('bv::modal::shown', () => resolve());
          });
        })
        .then(async () => {
          // check if modal is open
          expect(modal.find('.modal').element.style.display).toEqual('block');

          await view.setData({ newMember: { id: 10, role: 2 } });

          expect(view.vm.$data.newMember.id).toBe(10);

          expect(view.vm.$data.newMember.role).toBe(2);

          // confirm add of new user
          await modal.find('footer').findAll('button').at(1).trigger('click');

          // check for request and respond
          moxios.wait(async () => {
            await view.vm.$nextTick();
            const request = moxios.requests.mostRecent();
            expect(request.config.method).toEqual('post');
            expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member');
            expect(JSON.parse(request.config.data)).toMatchObject({ user: 10, role: 2 });
            await request.respondWith({
              status: 422,
              response: {
                message: 'The given data was invalid.',
                errors: {
                  user: ['The user is already member of the room.']
                }
              }
            });

            expect(modal.html()).toContain('The user is already member of the room.');

            expect(modal.find('.modal').element.style.display).toEqual('block');

            // confirm add of new user
            await modal.find('footer').findAll('button').at(1).trigger('click');

            // check for request and respond
            moxios.wait(async () => {
              const request = moxios.requests.mostRecent();
              expect(request.config.method).toEqual('post');
              expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member');
              expect(JSON.parse(request.config.data)).toMatchObject({ user: 10, role: 2 });
              request.respondWith({
                status: 500,
                response: {
                  message: 'Test'
                }
              });

              // check if modal was closed after error
              view.vm.$root.$once('bv::modal::hidden', () => {
                expect(modal.find('.modal').element.style.display).toEqual('none');

                expect(baseError.calledOnce).toBeTruthy();
                expect(baseError.getCall(0).args[0].response.status).toEqual(500);
                Base.error.restore();

                view.destroy();
                done();
              });
            });
          });
        });
    });
  });

  it('edit member', function (done) {
    PermissionService.setCurrentUser(exampleUser);
    const view = mount(MembersComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        room: ownerRoom,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      store,
      attachTo: createContainer()
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();
      // load current member list
      const request = moxios.requests.mostRecent();
      expect(request.url).toEqual('/api/v1/rooms/123-456-789/member');
      await request.respondWith({
        status: 200,
        response: {
          data: [
            { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 1, image: null },
            { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 1, image: null },
            { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 1, image: null }
          ]
        }
      });

      // find modal
      const modal = view.findComponent({ ref: 'edit-member-modal' });
      expect(modal.exists()).toBeTruthy();
      view.vm.$nextTick()
        .then(() => {
          // check if modal is closed and try to open it
          expect(modal.find('.modal').element.style.display).toEqual('none');

          const members = view.findComponent(BTbody);
          const rows = members.findAllComponents(BTr);
          expect(rows.length).toBe(3);

          expect(rows.at(0).findAll('td').at(4).text()).toBe('rooms.members.roles.participant');

          // first member
          const editButton = rows.at(0).findAllComponents(BButton).at(0);
          expect(editButton.html()).toContain('fa-user-edit');
          editButton.trigger('click');

          return new Promise((resolve, reject) => {
            view.vm.$root.$once('bv::modal::shown', () => resolve());
          });
        })
        .then(async () => {
          // check if modal is open
          expect(modal.find('.modal').element.style.display).toEqual('block');

          // check if editMember is set
          expect(view.vm.$data.editMember).toMatchObject({ id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 1 });

          expect(modal.find('h5').text()).toBe('rooms.members.modals.edit.title:{"firstname":"Laura","lastname":"Rivera"}');

          // check role selector, labels and values
          const roleSelector = modal.findAllComponents(BFormRadio);
          expect(roleSelector.length).toBe(3);
          expect(roleSelector.at(0).text()).toBe('rooms.members.roles.participant');
          expect(roleSelector.at(1).text()).toBe('rooms.members.roles.moderator');
          expect(roleSelector.at(2).text()).toBe('rooms.members.roles.co_owner');

          expect(roleSelector.at(0).find('input').attributes('value')).toBe('1');
          expect(roleSelector.at(1).find('input').attributes('value')).toBe('2');
          expect(roleSelector.at(2).find('input').attributes('value')).toBe('3');

          // select role moderator
          await roleSelector.at(1).find('input').setChecked();
          expect(view.vm.$data.editMember.role).toBe(2);

          // check modal action buttons
          const footerButtons = modal.find('footer').findAll('button');
          expect(footerButtons.length).toBe(2);
          expect(footerButtons.at(0).text()).toBe('rooms.members.modals.edit.cancel');
          expect(footerButtons.at(1).text()).toBe('rooms.members.modals.edit.save');

          // confirm changes
          await footerButtons.at(1).trigger('click');

          // check for request and respond
          moxios.wait(async () => {
            await view.vm.$nextTick();
            const request = moxios.requests.mostRecent();
            expect(request.config.method).toEqual('put');
            expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member/5');
            expect(JSON.parse(request.config.data)).toMatchObject({ role: 2 });
            await request.respondWith({
              status: 204
            });
          });

          // check is modal was closed after changes applied successfully
          view.vm.$root.$once('bv::modal::hidden', async () => {
            expect(modal.find('.modal').element.style.display).toEqual('none');

            await view.vm.$nextTick();

            // check if user list was updated
            const members = view.findComponent(BTbody);
            const rows = members.findAllComponents(BTr);
            expect(rows.length).toBe(3);

            expect(rows.at(0).findAll('td').at(4).text()).toBe('rooms.members.roles.moderator');

            view.destroy();
            done();
          });
        });
    });
  });

  it('edit member error gone', function (done) {
    PermissionService.setCurrentUser(exampleUser);
    const baseError = sinon.stub(Base, 'error');
    const view = mount(MembersComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        room: ownerRoom,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      store,
      attachTo: createContainer()
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();
      // load current member list
      const request = moxios.requests.mostRecent();
      expect(request.url).toEqual('/api/v1/rooms/123-456-789/member');
      await request.respondWith({
        status: 200,
        response: {
          data: [
            { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 1, image: null },
            { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 1, image: null },
            { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 1, image: null }
          ]
        }
      });

      // find modal
      const modal = view.findComponent({ ref: 'edit-member-modal' });
      expect(modal.exists()).toBeTruthy();
      view.vm.$nextTick()
        .then(() => {
          // check if modal is closed and try to open it
          expect(modal.find('.modal').element.style.display).toEqual('none');

          const members = view.findComponent(BTbody);
          const rows = members.findAllComponents(BTr);
          expect(rows.length).toBe(3);

          expect(rows.at(0).findAll('td').at(4).text()).toBe('rooms.members.roles.participant');

          // first member
          const editButton = rows.at(0).findAllComponents(BButton).at(0);
          expect(editButton.html()).toContain('fa-user-edit');
          editButton.trigger('click');

          return new Promise((resolve, reject) => {
            view.vm.$root.$once('bv::modal::shown', () => resolve());
          });
        })
        .then(async () => {
          // check if modal is open
          expect(modal.find('.modal').element.style.display).toEqual('block');

          // check if editMember is set
          expect(view.vm.$data.editMember).toMatchObject({ id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 1 });

          // check modal action buttons
          const footerButtons = modal.find('footer').findAll('button');

          // confirm changes
          await footerButtons.at(1).trigger('click');

          // check for request and respond
          moxios.wait(async () => {
            await view.vm.$nextTick();
            const request = moxios.requests.mostRecent();
            expect(request.config.method).toEqual('put');
            expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member/5');
            expect(JSON.parse(request.config.data)).toMatchObject({ role: 1 });
            await request.respondWith({
              status: 410,
              response: {
                message: 'The person is not a member of this room (anymore).'
              }
            });
          });

          // check is modal was closed after changes applied successfully
          view.vm.$root.$once('bv::modal::hidden', async () => {
            expect(modal.find('.modal').element.style.display).toEqual('none');

            await view.vm.$nextTick();

            // check if user list was updated
            const members = view.findComponent(BTbody);
            const rows = members.findAllComponents(BTr);
            expect(rows.length).toBe(2);

            expect(baseError.calledOnce).toBeTruthy();
            expect(baseError.getCall(0).args[0].response.status).toEqual(410);
            expect(baseError.getCall(0).args[0].response.data.message).toEqual('The person is not a member of this room (anymore).');
            Base.error.restore();

            view.destroy();
            done();
          });
        });
    });
  });

  it('delete members', function (done) {
    PermissionService.setCurrentUser(exampleUser);
    const view = mount(MembersComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        room: ownerRoom,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      store,
      attachTo: createContainer()
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();
      // load current member list
      const request = moxios.requests.mostRecent();
      expect(request.url).toEqual('/api/v1/rooms/123-456-789/member');
      await request.respondWith({
        status: 200,
        response: {
          data: [
            { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 1, image: null },
            { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 2, image: null },
            { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 3, image: null }
          ]
        }
      });

      // find modal
      const modal = view.findComponent({ ref: 'remove-member-modal' });
      expect(modal.exists()).toBeTruthy();
      view.vm.$nextTick()
        .then(() => {
          // check if modal is closed and try to open it
          expect(modal.find('.modal').element.style.display).toEqual('none');

          const members = view.findComponent(BTbody);
          const rows = members.findAllComponents(BTr);
          expect(rows.length).toBe(3);

          // first member
          const deleteButton = rows.at(0).findAllComponents(BButton).at(1);
          expect(deleteButton.html()).toContain('fa-solid fa-trash');
          deleteButton.trigger('click');

          return new Promise((resolve, reject) => {
            view.vm.$root.$once('bv::modal::shown', () => resolve());
          });
        })
        .then(async () => {
          // check if modal is open
          expect(modal.find('.modal').element.style.display).toEqual('block');

          expect(view.vm.$data.deleteMember.id).toBe(5);

          // confirm delete of user
          await modal.find('footer').findAll('button').at(1).trigger('click');

          // check for request and respond
          moxios.wait(() => {
            const request = moxios.requests.mostRecent();
            expect(request.config.method).toEqual('delete');
            expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member/5');
            request.respondWith({
              status: 204
            });

            // check if modal was closed
            view.vm.$root.$once('bv::modal::hidden', async () => {
              await view.vm.$nextTick();
              expect(modal.find('.modal').element.style.display).toEqual('none');

              // check is member was removed
              const members = view.findComponent(BTbody);
              const rows = members.findAllComponents(BTr);
              expect(rows.length).toBe(2);

              view.destroy();
              done();
            });
          });
        });
    });
  });

  it('delete members, already gone', function (done) {
    PermissionService.setCurrentUser(exampleUser);
    const baseError = sinon.stub(Base, 'error');
    const view = mount(MembersComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        room: ownerRoom,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      store,
      attachTo: createContainer()
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();
      // load current member list
      const request = moxios.requests.mostRecent();
      expect(request.url).toEqual('/api/v1/rooms/123-456-789/member');
      await request.respondWith({
        status: 200,
        response: {
          data: [
            { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 1, image: null },
            { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 2, image: null },
            { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 3, image: null }
          ]
        }
      });

      // find modal
      const modal = view.findComponent({ ref: 'remove-member-modal' });
      expect(modal.exists()).toBeTruthy();
      view.vm.$nextTick()
        .then(() => {
          // check if modal is closed and try to open it
          expect(modal.find('.modal').element.style.display).toEqual('none');

          const members = view.findComponent(BTbody);
          const rows = members.findAllComponents(BTr);
          expect(rows.length).toBe(3);

          // first member
          const deleteButton = rows.at(0).findAllComponents(BButton).at(1);
          expect(deleteButton.html()).toContain('fa-solid fa-trash');
          deleteButton.trigger('click');

          return new Promise((resolve, reject) => {
            view.vm.$root.$once('bv::modal::shown', () => resolve());
          });
        })
        .then(async () => {
          // check if modal is open
          expect(modal.find('.modal').element.style.display).toEqual('block');

          expect(view.vm.$data.deleteMember.id).toBe(5);

          // confirm delete of user
          await modal.find('footer').findAll('button').at(1).trigger('click');

          // check for request and respond
          moxios.wait(() => {
            const request = moxios.requests.mostRecent();
            expect(request.config.method).toEqual('delete');
            expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member/5');
            request.respondWith({
              status: 410,
              response: {
                message: 'The person is not a member of this room (anymore).'
              }
            });

            // check if modal was closed after error
            view.vm.$root.$once('bv::modal::hidden', async () => {
              await view.vm.$nextTick();
              expect(modal.find('.modal').element.style.display).toEqual('none');

              expect(baseError.calledOnce).toBeTruthy();
              expect(baseError.getCall(0).args[0].response.status).toEqual(410);
              expect(baseError.getCall(0).args[0].response.data.message).toEqual('The person is not a member of this room (anymore).');
              Base.error.restore();

              // check is member was removed
              const members = view.findComponent(BTbody);
              const rows = members.findAllComponents(BTr);
              expect(rows.length).toBe(2);

              view.destroy();
              done();
            });
          });
        });
    });
  });

  it('delete members error', function (done) {
    PermissionService.setCurrentUser(exampleUser);
    const baseError = sinon.stub(Base, 'error');
    const view = mount(MembersComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        room: ownerRoom,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      store,
      attachTo: createContainer()
    });

    moxios.wait(async () => {
      await view.vm.$nextTick();
      // load current member list
      const request = moxios.requests.mostRecent();
      expect(request.url).toEqual('/api/v1/rooms/123-456-789/member');
      await request.respondWith({
        status: 200,
        response: {
          data: [
            { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 1, image: null },
            { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 2, image: null },
            { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 3, image: null }
          ]
        }
      });

      // find modal
      const modal = view.findComponent({ ref: 'remove-member-modal' });
      expect(modal.exists()).toBeTruthy();
      view.vm.$nextTick()
        .then(() => {
          // check if modal is closed and try to open it
          expect(modal.find('.modal').element.style.display).toEqual('none');

          const members = view.findComponent(BTbody);
          const rows = members.findAllComponents(BTr);
          expect(rows.length).toBe(3);

          // first member
          const deleteButton = rows.at(0).findAllComponents(BButton).at(1);
          expect(deleteButton.html()).toContain('fa-solid fa-trash');
          deleteButton.trigger('click');

          return new Promise((resolve, reject) => {
            view.vm.$root.$once('bv::modal::shown', () => resolve());
          });
        })
        .then(async () => {
          // check if modal is open
          expect(modal.find('.modal').element.style.display).toEqual('block');

          expect(view.vm.$data.deleteMember.id).toBe(5);

          // confirm delete of user
          await modal.find('footer').findAll('button').at(1).trigger('click');

          // check for request and respond
          moxios.wait(() => {
            const request = moxios.requests.mostRecent();
            expect(request.config.method).toEqual('delete');
            expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member/5');
            request.respondWith({
              status: 500
            });

            // check if modal was closed after error
            view.vm.$root.$once('bv::modal::hidden', async () => {
              await view.vm.$nextTick();
              expect(modal.find('.modal').element.style.display).toEqual('none');

              expect(baseError.calledOnce).toBeTruthy();
              expect(baseError.getCall(0).args[0].response.status).toEqual(500);
              Base.error.restore();

              // check is member was not removed
              const members = view.findComponent(BTbody);
              const rows = members.findAllComponents(BTr);
              expect(rows.length).toBe(3);

              view.destroy();
              done();
            });
          });
        });
    });
  });
});
