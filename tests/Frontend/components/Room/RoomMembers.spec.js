import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, { BFormFile, BTbody, BTr } from 'bootstrap-vue';
import moxios from 'moxios';
import MembersComponent from '../../../../resources/js/components/Room/MembersComponent.vue';
import Clipboard from 'v-clipboard';
import Vuex from 'vuex';
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
        room: exampleRoom,
        showTitle: true
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
        room: ownerRoom,
        showTitle: true
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
        room: coOwnerRoom,
        showTitle: true
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
        room: exampleRoom,
        showTitle: true
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
        room: exampleRoom,
        showTitle: true
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
});
