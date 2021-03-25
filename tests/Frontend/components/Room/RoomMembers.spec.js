import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, { BFormFile, BFormRadio, BTbody, BTr } from 'bootstrap-vue';
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
const coOwnerRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 2, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allowMembership: false, isMember: false, isCoOwner: true, isModerator: false, canStart: false, running: false };
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
            { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 1 },
            { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 2 },
            { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 3 }
          ]
        }
      })
        .then(function () {
          expect(view.vm.$data.members).toHaveLength(3);

          const members = view.findComponent(BTbody);
          const rows = members.findAllComponents(BTr);
          expect(rows.length).toBe(3);

          // first member
          expect(rows.at(0).findAll('td').at(0).text()).toBe('Laura');
          expect(rows.at(0).findAll('td').at(1).text()).toBe('Rivera');
          expect(rows.at(0).findAll('td').at(2).text()).toBe('LauraWRivera@domain.tld');
          expect(rows.at(0).findAll('td').at(3).text()).toBe('rooms.members.roles.participant');

          // second member
          expect(rows.at(1).findAll('td').at(0).text()).toBe('Juan');
          expect(rows.at(1).findAll('td').at(1).text()).toBe('Walter');
          expect(rows.at(1).findAll('td').at(2).text()).toBe('JuanMWalter@domain.tld');
          expect(rows.at(1).findAll('td').at(3).text()).toBe('rooms.members.roles.moderator');

          // third member
          expect(rows.at(2).findAll('td').at(0).text()).toBe('Tammy');
          expect(rows.at(2).findAll('td').at(1).text()).toBe('Law');
          expect(rows.at(2).findAll('td').at(2).text()).toBe('TammyGLaw@domain.tld');
          expect(rows.at(2).findAll('td').at(3).text()).toBe('rooms.members.roles.co_owner');

          console.log(members.html());

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

      const fields = view.vm.tablefields.map(a => a.key);
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

      const fields = view.vm.tablefields.map(a => a.key);
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

      const fields = view.vm.tablefields.map(a => a.key);
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

      const fields = view.vm.tablefields.map(a => a.key);
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
            { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 1 },
            { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 2 },
            { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 3 }
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
                    { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld' },
                    { id: 10, firstname: 'Laura', lastname: 'Walter', email: 'LauraMWalter@domain.tld' }
                  ]
                }
              });

              // check user options shown
              const userOptions = modal.findAll('li');
              // amount of users + no result and no options items
              expect(userOptions.length).toBe(4);
              expect(userOptions.at(0).text()).toBe('Laura Rivera');
              expect(userOptions.at(1).text()).toBe('Laura Walter');
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
                        { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 1 },
                        { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 2 },
                        { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 3 },
                        { id: 10, firstname: 'Laura', lastname: 'Walter', email: 'LauraMWalter@domain.tld', role: 2 }
                      ]
                    }
                  });

                  // check if user list was updated
                  expect(view.vm.$data.members).toHaveLength(4);

                  const members = view.findComponent(BTbody);
                  const rows = members.findAllComponents(BTr);
                  expect(rows.length).toBe(4);

                  // new member
                  expect(rows.at(3).findAll('td').at(0).text()).toBe('Laura');
                  expect(rows.at(3).findAll('td').at(1).text()).toBe('Walter');
                  expect(rows.at(3).findAll('td').at(2).text()).toBe('LauraMWalter@domain.tld');
                  expect(rows.at(3).findAll('td').at(3).text()).toBe('rooms.members.roles.moderator');

                  view.destroy();
                  done();
                });
              });
            });
          });
        });
    });
  });
});
