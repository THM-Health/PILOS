import { mount } from '@vue/test-utils';
import BootstrapVue, { BButton, BFormFile, BFormRadio, BTbody, BTr } from 'bootstrap-vue';
import moxios from 'moxios';
import MembersComponent from '../../../../resources/js/components/Room/MembersComponent.vue';
import VueClipboard from 'vue-clipboard2';
import Base from '../../../../resources/js/api/base';
import PermissionService from '../../../../resources/js/services/PermissionService';
import _ from 'lodash';
import { waitModalHidden, waitModalShown, waitMoxios, createContainer, createLocalVue } from '../../helper';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

const localVue = createLocalVue();

localVue.use(BootstrapVue);
localVue.use(VueClipboard);
localVue.use(PiniaVuePlugin);

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], model_name: 'User', room_limit: -1 };
const ownerRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: false, is_co_owner: false, is_moderator: false, can_start: false, running: false };
const coOwnerRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 2, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: true, is_co_owner: true, is_moderator: false, can_start: false, running: false };
const exampleRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: false, is_co_owner: false, is_moderator: false, can_start: false, running: false };

const initialState = { auth: { currentUser: exampleUser } };

describe('RoomMembers', () => {
  beforeEach(() => {
    moxios.install();
  });
  afterEach(() => {
    moxios.uninstall();
  });

  it('load members', async () => {
    const view = mount(MembersComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        room: exampleRoom
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    const request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/member');
    await request.respondWith({
      status: 200,
      response: {
        data: [
          { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 1, image: null },
          { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 2, image: null },
          { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 3, image: 'http://domain.tld/storage/profile_images/1234abc.jpg' }
        ]
      }
    });

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
    expect(rows.at(0).findAll('td').at(4).text()).toBe('rooms.roles.participant');

    // second member
    expect(rows.at(1).findAll('td').at(1).text()).toBe('Juan');
    expect(rows.at(1).findAll('td').at(2).text()).toBe('Walter');
    expect(rows.at(1).findAll('td').at(3).text()).toBe('JuanMWalter@domain.tld');
    expect(rows.at(1).findAll('td').at(4).text()).toBe('rooms.roles.moderator');

    // third member
    img = rows.at(2).findAll('td').at(0).find('img');
    expect(img.exists()).toBeTruthy();
    expect(img.attributes('src')).toBe('http://domain.tld/storage/profile_images/1234abc.jpg');
    expect(rows.at(2).findAll('td').at(1).text()).toBe('Tammy');
    expect(rows.at(2).findAll('td').at(2).text()).toBe('Law');
    expect(rows.at(2).findAll('td').at(3).text()).toBe('TammyGLaw@domain.tld');
    expect(rows.at(2).findAll('td').at(4).text()).toBe('rooms.roles.co_owner');

    view.destroy();
  });

  it('show owner add, import and edit buttons', async () => {
    PermissionService.setCurrentUser(exampleUser);
    const view = mount(MembersComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: ownerRoom
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'add-member' }).exists()).toBeTruthy();
    expect(view.findComponent({ ref: 'import-members' }).exists()).toBeTruthy();

    const fields = view.vm.tableFields.map(a => a.key);
    expect(fields).toContain('firstname');
    expect(fields).toContain('lastname');
    expect(fields).toContain('email');
    expect(fields).toContain('role');
    expect(fields).toContain('actions');
    view.destroy();
  });

  it('show co-owner add, import and edit buttons', async () => {
    PermissionService.setCurrentUser(exampleUser);
    const view = mount(MembersComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: coOwnerRoom
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'add-member' }).exists()).toBeTruthy();
    expect(view.findComponent({ ref: 'import-members' }).exists()).toBeTruthy();

    const fields = view.vm.tableFields.map(a => a.key);
    expect(fields).toContain('firstname');
    expect(fields).toContain('lastname');
    expect(fields).toContain('email');
    expect(fields).toContain('role');
    expect(fields).toContain('actions');

    view.destroy();
  });

  it('hide add, import and edit buttons on room.viewAll permission', async () => {
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
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });
    await view.vm.$nextTick();
    expect(view.findComponent(BFormFile).exists()).toBeFalsy();

    expect(view.findComponent({ ref: 'add-member' }).exists()).toBeFalsy();
    expect(view.findComponent({ ref: 'import-members' }).exists()).toBeFalsy();

    const fields = view.vm.tableFields.map(a => a.key);
    expect(fields).toContain('firstname');
    expect(fields).toContain('lastname');
    expect(fields).toContain('email');
    expect(fields).toContain('role');
    expect(fields).not.toContain('actions');

    PermissionService.setCurrentUser(oldUser);
    view.destroy();
  });

  it('Show add, import and edit buttons on room.manage permission', async () => {
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
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });
    await view.vm.$nextTick();
    expect(view.findComponent({ ref: 'add-member' }).exists()).toBeTruthy();
    expect(view.findComponent({ ref: 'import-members' }).exists()).toBeTruthy();

    const fields = view.vm.tableFields.map(a => a.key);
    expect(fields).toContain('firstname');
    expect(fields).toContain('lastname');
    expect(fields).toContain('email');
    expect(fields).toContain('role');
    expect(fields).toContain('actions');

    PermissionService.setCurrentUser(oldUser);
    view.destroy();
  });

  it('error emitted on members load', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const view = mount(MembersComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: (date, format) => date.toDateString()
      },
      propsData: {
        room: exampleRoom
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    const request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/member');
    await request.respondWith({
      status: 500,
      response: {
        message: 'Test'
      }
    });
    expect(spy).toBeCalledTimes(1);

    view.destroy();
  });

  it('add new member', async () => {
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
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    // load current member list
    let request = moxios.requests.mostRecent();
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
    await waitMoxios();
    const addButton = view.findComponent({ ref: 'add-member' });
    expect(addButton.exists()).toBeTruthy();
    // check if modal is closed and try to open it
    expect(modal.find('.modal').element.style.display).toEqual('none');

    await waitModalShown(view, () => {
      addButton.trigger('click');
    });

    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    // find user search and enter query
    const searchField = modal.find('input');
    await searchField.setValue('Laura');
    await waitMoxios();
    await view.vm.$nextTick();
    // check user search query request and respond with found users
    request = moxios.requests.mostRecent();
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
    expect(userOptions.at(2).text()).toBe('rooms.members.modals.add.no_result');
    expect(userOptions.at(3).text()).toBe('rooms.members.modals.add.no_options');

    expect(userOptions.at(0).find('span').classes()).toContain('multiselect__option--disabled');
    expect(userOptions.at(1).find('span').classes()).not.toContain('multiselect__option--disabled');

    // select new user
    await userOptions.at(1).find('span').trigger('click');
    expect(view.vm.$data.newMember.id).toBe(10);

    // check role selector, labels and values
    const roleSelector = modal.findAllComponents(BFormRadio);
    expect(roleSelector.length).toBe(3);
    expect(roleSelector.at(0).text()).toBe('rooms.roles.participant');
    expect(roleSelector.at(1).text()).toBe('rooms.roles.moderator');
    expect(roleSelector.at(2).text()).toBe('rooms.roles.co_owner');

    expect(roleSelector.at(0).find('input').attributes('value')).toBe('1');
    expect(roleSelector.at(1).find('input').attributes('value')).toBe('2');
    expect(roleSelector.at(2).find('input').attributes('value')).toBe('3');

    // select role moderator
    await roleSelector.at(1).find('input').setChecked();
    expect(view.vm.$data.newMember.role).toBe(2);

    // check modal action buttons
    const footerButtons = modal.find('footer').findAll('button');
    expect(footerButtons.length).toBe(2);
    expect(footerButtons.at(0).text()).toBe('app.cancel');
    expect(footerButtons.at(1).text()).toBe('rooms.members.modals.add.add');

    // confirm add of new user
    await footerButtons.at(1).trigger('click');

    // check for request and respond
    await waitMoxios();
    await view.vm.$nextTick();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('post');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member');
    expect(JSON.parse(request.config.data)).toMatchObject({ user: 10, role: 2 });

    await waitModalHidden(view, async () => {
      await request.respondWith({
        status: 204
      });
    });

    // check is modal was closed after adding user successfully

    expect(modal.find('.modal').element.style.display).toEqual('none');

    // reload user list
    await waitMoxios();
    await view.vm.$nextTick();
    request = moxios.requests.mostRecent();
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
    expect(rows.at(3).findAll('td').at(2).text()).toBe('Laura');
    expect(rows.at(3).findAll('td').at(3).text()).toBe('Walter');
    expect(rows.at(3).findAll('td').at(4).text()).toBe('LauraMWalter@domain.tld');
    expect(rows.at(3).findAll('td').at(5).text()).toBe('rooms.roles.moderator');

    view.destroy();
  });

  it('add new member errors', async () => {
    PermissionService.setCurrentUser(exampleUser);
    const baseError = vi.spyOn(Base, 'error').mockImplementation(() => {});
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
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    // load current member list
    let request = moxios.requests.mostRecent();
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
    await view.vm.$nextTick();
    // check if modal is closed and try to open it
    expect(modal.find('.modal').element.style.display).toEqual('none');

    await waitModalShown(view, () => {
      view.findComponent({ ref: 'add-member' }).trigger('click');
    });

    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    await view.setData({ newMember: { id: 10, role: 2 } });

    expect(view.vm.$data.newMember.id).toBe(10);

    expect(view.vm.$data.newMember.role).toBe(2);

    // confirm add of new user
    await modal.find('footer').findAll('button').at(1).trigger('click');

    // check for request and respond
    await waitMoxios();
    await view.vm.$nextTick();
    request = moxios.requests.mostRecent();
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
    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('post');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member');
    expect(JSON.parse(request.config.data)).toMatchObject({ user: 10, role: 2 });

    await waitModalHidden(view, async () => {
      await request.respondWith({
        status: 500,
        response: {
          message: 'Test'
        }
      });
    });

    // check if modal was closed after error

    expect(modal.find('.modal').element.style.display).toEqual('none');

    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(500);

    view.destroy();
  });

  it('edit member', async () => {
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
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    // load current member list
    let request = moxios.requests.mostRecent();
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
    await view.vm.$nextTick();
    // check if modal is closed and try to open it
    expect(modal.find('.modal').element.style.display).toEqual('none');

    let members = view.findComponent(BTbody);
    let rows = members.findAllComponents(BTr);
    expect(rows.length).toBe(3);

    expect(rows.at(0).findAll('td').at(5).text()).toBe('rooms.roles.participant');

    // first member
    const editButton = rows.at(0).findAllComponents(BButton).at(0);
    expect(editButton.html()).toContain('fa-user-edit');

    await waitModalShown(view, () => {
      editButton.trigger('click');
    });

    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    // check if editMember is set
    expect(view.vm.$data.editMember).toMatchObject({ id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 1 });

    expect(modal.find('h5').text()).toBe('rooms.members.modals.edit.title:{"firstname":"Laura","lastname":"Rivera"}');

    // check role selector, labels and values
    const roleSelector = modal.findAllComponents(BFormRadio);
    expect(roleSelector.length).toBe(3);
    expect(roleSelector.at(0).text()).toBe('rooms.roles.participant');
    expect(roleSelector.at(1).text()).toBe('rooms.roles.moderator');
    expect(roleSelector.at(2).text()).toBe('rooms.roles.co_owner');

    expect(roleSelector.at(0).find('input').attributes('value')).toBe('1');
    expect(roleSelector.at(1).find('input').attributes('value')).toBe('2');
    expect(roleSelector.at(2).find('input').attributes('value')).toBe('3');

    // select role moderator
    await roleSelector.at(1).find('input').setChecked();
    expect(view.vm.$data.editMember.role).toBe(2);

    // check modal action buttons
    const footerButtons = modal.find('footer').findAll('button');
    expect(footerButtons.length).toBe(2);
    expect(footerButtons.at(0).text()).toBe('app.cancel');
    expect(footerButtons.at(1).text()).toBe('app.save');

    // confirm changes
    await footerButtons.at(1).trigger('click');

    // check for request and respond
    await waitMoxios();
    await view.vm.$nextTick();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('put');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member/5');
    expect(JSON.parse(request.config.data)).toMatchObject({ role: 2 });
    await waitModalHidden(view, async () => {
      await request.respondWith({
        status: 204
      });
    });

    // check is modal was closed after changes applied successfully

    expect(modal.find('.modal').element.style.display).toEqual('none');

    await view.vm.$nextTick();

    // check if user list was updated
    members = view.findComponent(BTbody);
    rows = members.findAllComponents(BTr);
    expect(rows.length).toBe(3);

    expect(rows.at(0).findAll('td').at(5).text()).toBe('rooms.roles.moderator');

    view.destroy();
  });

  it('edit member error gone', async () => {
    PermissionService.setCurrentUser(exampleUser);
    const baseError = vi.spyOn(Base, 'error').mockImplementation(() => {});
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
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    // load current member list
    let request = moxios.requests.mostRecent();
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
    await view.vm.$nextTick();
    // check if modal is closed and try to open it
    expect(modal.find('.modal').element.style.display).toEqual('none');

    let members = view.findComponent(BTbody);
    let rows = members.findAllComponents(BTr);
    expect(rows.length).toBe(3);

    expect(rows.at(0).findAll('td').at(5).text()).toBe('rooms.roles.participant');

    // first member
    const editButton = rows.at(0).findAllComponents(BButton).at(0);
    expect(editButton.html()).toContain('fa-user-edit');
    await waitModalShown(view, () => {
      editButton.trigger('click');
    });
    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    // check if editMember is set
    expect(view.vm.$data.editMember).toMatchObject({ id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 1 });

    // check modal action buttons
    const footerButtons = modal.find('footer').findAll('button');

    // confirm changes
    await footerButtons.at(1).trigger('click');

    // check for request and respond
    await waitMoxios();
    await view.vm.$nextTick();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('put');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member/5');
    expect(JSON.parse(request.config.data)).toMatchObject({ role: 1 });
    await waitModalHidden(view, async () => {
      await request.respondWith({
        status: 410,
        response: {
          message: 'The person is not a member of this room (anymore).'
        }
      });
    });

    // check is modal was closed after changes applied successfully

    expect(modal.find('.modal').element.style.display).toEqual('none');

    await view.vm.$nextTick();

    // check if user list was updated
    members = view.findComponent(BTbody);
    rows = members.findAllComponents(BTr);
    expect(rows.length).toBe(2);

    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(410);
    expect(baseError.mock.calls[0][0].response.data.message).toEqual('The person is not a member of this room (anymore).');

    view.destroy();
  });

  it('delete members', async () => {
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
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    // load current member list
    let request = moxios.requests.mostRecent();
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
    await view.vm.$nextTick();
    // check if modal is closed and try to open it
    expect(modal.find('.modal').element.style.display).toEqual('none');

    let members = view.findComponent(BTbody);
    let rows = members.findAllComponents(BTr);
    expect(rows.length).toBe(3);

    // first member
    const deleteButton = rows.at(0).findAllComponents(BButton).at(1);
    expect(deleteButton.html()).toContain('fa-solid fa-trash');

    await waitModalShown(view, () => {
      deleteButton.trigger('click');
    });
    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    expect(view.vm.$data.removeMember.id).toBe(5);

    // confirm delete of user
    await modal.find('footer').findAll('button').at(1).trigger('click');

    // check for request and respond
    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('delete');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member/5');

    await waitModalHidden(view, async () => {
      await request.respondWith({
        status: 204
      });
    });

    // check if modal was closed
    await view.vm.$nextTick();
    expect(modal.find('.modal').element.style.display).toEqual('none');

    // check is member was removed
    members = view.findComponent(BTbody);
    rows = members.findAllComponents(BTr);
    expect(rows.length).toBe(2);

    view.destroy();
  });

  it('delete members, already gone', async () => {
    PermissionService.setCurrentUser(exampleUser);
    const baseError = vi.spyOn(Base, 'error').mockImplementation(() => {});
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
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    // load current member list
    let request = moxios.requests.mostRecent();
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
    await view.vm.$nextTick();

    // check if modal is closed and try to open it
    expect(modal.find('.modal').element.style.display).toEqual('none');

    let members = view.findComponent(BTbody);
    let rows = members.findAllComponents(BTr);
    expect(rows.length).toBe(3);

    // first member
    const deleteButton = rows.at(0).findAllComponents(BButton).at(1);
    expect(deleteButton.html()).toContain('fa-solid fa-trash');

    await waitModalShown(view, () => {
      deleteButton.trigger('click');
    });
    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    expect(view.vm.$data.removeMember.id).toBe(5);

    // confirm delete of user
    await modal.find('footer').findAll('button').at(1).trigger('click');

    // check for request and respond
    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('delete');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member/5');

    await waitModalHidden(view, async () => {
      await request.respondWith({
        status: 410,
        response: {
          message: 'The person is not a member of this room (anymore).'
        }
      });
    });

    // check if modal was closed after error
    await view.vm.$nextTick();
    expect(modal.find('.modal').element.style.display).toEqual('none');

    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(410);
    expect(baseError.mock.calls[0][0].response.data.message).toEqual('The person is not a member of this room (anymore).');

    // check is member was removed
    members = view.findComponent(BTbody);
    rows = members.findAllComponents(BTr);
    expect(rows.length).toBe(2);

    view.destroy();
  });

  it('delete members error', async () => {
    PermissionService.setCurrentUser(exampleUser);
    const baseError = vi.spyOn(Base, 'error').mockImplementation(() => {});
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
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    // load current member list
    let request = moxios.requests.mostRecent();
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
    await view.vm.$nextTick();
    // check if modal is closed and try to open it
    expect(modal.find('.modal').element.style.display).toEqual('none');

    let members = view.findComponent(BTbody);
    let rows = members.findAllComponents(BTr);
    expect(rows.length).toBe(3);

    // first member
    const deleteButton = rows.at(0).findAllComponents(BButton).at(1);
    expect(deleteButton.html()).toContain('fa-solid fa-trash');
    await waitModalShown(view, () => {
      deleteButton.trigger('click');
    });
    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    expect(view.vm.$data.removeMember.id).toBe(5);

    // confirm delete of user
    await modal.find('footer').findAll('button').at(1).trigger('click');

    // check for request and respond
    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('delete');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member/5');

    await waitModalHidden(view, async () => {
      await request.respondWith({
        status: 500
      });
    });

    // check if modal was closed after error
    await view.vm.$nextTick();
    expect(modal.find('.modal').element.style.display).toEqual('none');

    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(500);

    // check is member was not removed
    members = view.findComponent(BTbody);
    rows = members.findAllComponents(BTr);
    expect(rows.length).toBe(3);

    view.destroy();
  });
});
