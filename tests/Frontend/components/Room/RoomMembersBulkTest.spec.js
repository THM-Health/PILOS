import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, {
  BFormInvalidFeedback,
  BFormRadio,
  BTbody,
  BThead,
  BTr
} from 'bootstrap-vue';
import moxios from 'moxios';
import MembersComponent from '../../../../resources/js/components/Room/MembersComponent.vue';
import Clipboard from 'v-clipboard';
import Vuex from 'vuex';
import Base from '../../../../resources/js/api/base';
import PermissionService from '../../../../resources/js/services/PermissionService';
import { waitModalHidden, waitModalShown, waitMoxios, createContainer } from '../../helper';

const localVue = createLocalVue();

localVue.use(BootstrapVue);
localVue.use(Clipboard);
localVue.use(Vuex);

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], model_name: 'User', room_limit: -1 };
const ownerRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: false, is_co_owner: false, is_moderator: false, can_start: false, running: false };
const coOwnerRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 2, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: true, is_co_owner: true, is_moderator: false, can_start: false, running: false };

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

describe('RoomMembersBulk', () => {
  beforeEach(() => {
    moxios.install();
  });
  afterEach(() => {
    moxios.uninstall();
  });

  it('visibility of bulk edit/remove buttons', async () => {
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

    await waitMoxios();
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

    // check if button not exists if no user is selected
    let bulkEditButton = view.findComponent({ ref: 'bulk-edit-members-button' });
    let bulkRemoveButton = view.findComponent({ ref: 'bulk-remove-members-button' });
    expect(bulkEditButton.exists()).toBeFalsy();
    expect(bulkRemoveButton.exists()).toBeFalsy();

    const members = view.findComponent(BTbody);
    const rows = members.findAllComponents(BTr);
    expect(rows.length).toBe(3);

    // check if checkbox is selected
    expect(rows.at(0).find('input').element.checked).toBeFalsy();

    // select first row
    expect(view.vm.$data.selectedMembers.length).toBe(0);
    await rows.at(0).find('input').setChecked();
    expect(rows.at(0).find('input').element.checked).toBeTruthy();
    expect(view.vm.$data.selectedMembers.length).toBe(1);

    // check if buttons exits and show correct title
    bulkEditButton = view.findComponent({ ref: 'bulk-edit-members-button' });
    bulkRemoveButton = view.findComponent({ ref: 'bulk-remove-members-button' });
    expect(bulkEditButton.exists()).toBeTruthy();
    expect(bulkRemoveButton.exists()).toBeTruthy();
    expect(bulkEditButton.attributes('title')).toBe('rooms.members.bulkEditUser:{"numberOfSelectedUsers":1}');
    expect(bulkRemoveButton.attributes('title')).toBe('rooms.members.bulkRemoveUser:{"numberOfSelectedUsers":1}');

    view.destroy();
  });

  it('multiple checkboxes selected functionality', async () => {
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

    await waitMoxios();
    await view.vm.$nextTick();
    // load current member list
    const request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/member');
    await request.respondWith({
      status: 200,
      response: {
        data: [
          { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 3, image: null },
          { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 1, image: null },
          { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 1, image: null }
        ]
      }
    });

    const members = view.findComponent(BTbody);
    const rows = members.findAllComponents(BTr);
    const header = view.findComponent(BThead);
    expect(rows.length).toBe(3);

    // check select all
    expect(header.find('input').element.checked).toBeFalsy();
    await header.find('input').setChecked();
    expect(header.find('input').element.checked).toBeTruthy();
    expect(view.vm.$data.selectedMembers.length).toBe(3);

    // check unselect all
    await header.find('input').setChecked(false);
    expect(view.vm.$data.selectedMembers.length).toBe(0);

    // check select all if other rows were selected first, then deselect all rows
    await rows.at(0).find('input').setChecked();
    expect(rows.at(0).find('input').element.checked).toBeTruthy();
    await rows.at(1).find('input').setChecked();
    expect(rows.at(1).find('input').element.checked).toBeTruthy();
    expect(view.vm.$data.selectedMembers.length).toBe(2);
    expect(header.find('input').element.checked).toBeFalsy();
    await header.find('input').setChecked();
    expect(header.find('input').element.checked).toBeTruthy();
    expect(view.vm.$data.selectedMembers.length).toBe(3);
    await header.find('input').setChecked(false);
    expect(view.vm.$data.selectedMembers.length).toBe(0);

    // check if select all button is checked if all entries are selected manually
    await rows.at(0).find('input').setChecked();
    await rows.at(1).find('input').setChecked();
    await rows.at(2).find('input').setChecked();
    expect(header.find('input').element.checked).toBeTruthy();

    view.destroy();
  });

  it('self select as co-owner', async () => {
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

    await waitMoxios();
    await view.vm.$nextTick();
    // load current member list
    const request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/member');
    await request.respondWith({
      status: 200,
      response: {
        data: [
          { id: 1, firstname: 'John', lastname: 'Doe', email: 'JohnDoe@domain.tld', role: 3, image: null },
          { id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 1, image: null },
          { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 1, image: null },
          { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 1, image: null }
        ]
      }
    });

    const members = view.findComponent(BTbody);
    const rows = members.findAllComponents(BTr);
    const header = view.findComponent(BThead);
    expect(rows.length).toBe(4);

    // check if co-owner can select himself when using select all
    expect(view.vm.$data.members.length).toBe(4);
    await header.find('input').setChecked();
    expect(view.vm.$data.selectedMembers.length).toBe(3);

    // check select all by reseting and manually selecting all other users
    await header.find('input').setChecked(false);
    await rows.at(1).find('input').setChecked();
    await rows.at(2).find('input').setChecked();
    await rows.at(3).find('input').setChecked();
    expect(header.find('input').element.checked).toBeTruthy();

    view.destroy();
  });

  it('bulk edit member', async () => {
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
    const modal = view.findComponent({ ref: 'bulk-edit-members-modal' });
    expect(modal.exists()).toBeTruthy();
    await view.vm.$nextTick();
    // check if modal is closed and try to open it
    expect(modal.find('.modal').element.style.display).toEqual('none');

    let members = view.findComponent(BTbody);
    let rows = members.findAllComponents(BTr);
    expect(rows.length).toBe(3);

    // check if checkbox is selected
    expect(rows.at(0).find('input').element.checked).toBeFalsy();

    // select first row
    expect(view.vm.$data.selectedMembers.length).toBe(0);
    await rows.at(0).find('input').setChecked();
    expect(rows.at(0).find('input').element.checked).toBeTruthy();
    expect(view.vm.$data.selectedMembers.length).toBe(1);

    expect(rows.at(0).findAll('td').at(5).text()).toBe('rooms.members.roles.participant');

    // check if button shows correct title
    const bulkEditButton = view.findComponent({ ref: 'bulk-edit-members-button' });
    expect(bulkEditButton.attributes('title')).toBe('rooms.members.bulkEditUser:{"numberOfSelectedUsers":1}');

    await waitModalShown(view, () => {
      bulkEditButton.trigger('click');
    });

    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    // check if selectedMembers is set
    expect(view.vm.$data.selectedMembers).toMatchObject([{ id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 1 }]);

    // check if modal displays correct number of selected users
    expect(modal.find('h5').text()).toBe('rooms.members.modals.edit.titleBulk:{"numberOfSelectedUsers":1}');

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
    expect(view.vm.$data.bulkEditRole).toBe(2);

    // check modal action buttons
    const footerButtons = modal.find('footer').findAll('button');
    expect(footerButtons.length).toBe(2);
    expect(footerButtons.at(0).text()).toBe('rooms.members.modals.edit.cancel');
    expect(footerButtons.at(1).text()).toBe('rooms.members.modals.edit.save');

    // confirm changes
    await footerButtons.at(1).trigger('click');

    // check for request and respond
    await waitMoxios();
    await view.vm.$nextTick();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('put');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member');
    expect(JSON.parse(request.config.data)).toMatchObject({ role: 2 });
    await waitModalHidden(view, async () => {
      await request.respondWith({
        status: 204
      });
    });

    // check if modal was closed after changes applied successfully

    expect(modal.find('.modal').element.style.display).toEqual('none');

    await view.vm.$nextTick();

    // check if user list was updated
    members = view.findComponent(BTbody);
    rows = members.findAllComponents(BTr);
    expect(rows.length).toBe(3);

    expect(rows.at(0).findAll('td').at(5).text()).toBe('rooms.members.roles.moderator');

    // test if two users can be edited

    // check if modal is closed and try to open it
    expect(modal.find('.modal').element.style.display).toEqual('none');

    // select two rows
    expect(view.vm.$data.selectedMembers.length).toBe(1);
    await rows.at(1).find('input').setChecked();
    expect(rows.at(0).find('input').element.checked).toBeTruthy();
    expect(rows.at(1).find('input').element.checked).toBeTruthy();
    expect(view.vm.$data.selectedMembers.length).toBe(2);

    // check if button shows correct title
    expect(bulkEditButton.attributes('title')).toBe('rooms.members.bulkEditUser:{"numberOfSelectedUsers":2}');

    await waitModalShown(view, () => {
      bulkEditButton.trigger('click');
    });

    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    // check if selectedMembers is set
    expect(view.vm.$data.selectedMembers).toMatchObject(
      [{ id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 2 }, { id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 1 }]);

    // check if modal displays correct number of selected users
    expect(modal.find('h5').text()).toBe('rooms.members.modals.edit.titleBulk:{"numberOfSelectedUsers":2}');

    // select role co-owner
    await roleSelector.at(2).find('input').setChecked();
    expect(view.vm.$data.bulkEditRole).toBe(3);

    // confirm changes
    await footerButtons.at(1).trigger('click');

    // check for request and respond
    await waitMoxios();
    await view.vm.$nextTick();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('put');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member');
    expect(JSON.parse(request.config.data)).toMatchObject({ role: 3 });
    await waitModalHidden(view, async () => {
      await request.respondWith({
        status: 204
      });
    });

    // check if modal was closed after changes applied successfully

    expect(modal.find('.modal').element.style.display).toEqual('none');

    await view.vm.$nextTick();

    // check if user list was updated
    members = view.findComponent(BTbody);
    rows = members.findAllComponents(BTr);
    expect(rows.length).toBe(3);

    expect(rows.at(0).findAll('td').at(5).text()).toBe('rooms.members.roles.co_owner');
    expect(rows.at(1).findAll('td').at(5).text()).toBe('rooms.members.roles.co_owner');

    view.destroy();
  });

  it('bulk remove members', async () => {
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
    const modal = view.findComponent({ ref: 'bulk-remove-members-modal' });
    expect(modal.exists()).toBeTruthy();
    await view.vm.$nextTick();
    // check if modal is closed and try to open it
    expect(modal.find('.modal').element.style.display).toEqual('none');

    let members = view.findComponent(BTbody);
    let rows = members.findAllComponents(BTr);
    expect(rows.length).toBe(3);

    // first member
    // check if checkbox is selected
    expect(rows.at(0).find('input').element.checked).toBeFalsy();

    // select first row
    expect(view.vm.$data.selectedMembers.length).toBe(0);
    await rows.at(0).find('input').setChecked();
    expect(rows.at(0).find('input').element.checked).toBeTruthy();
    expect(view.vm.$data.selectedMembers.length).toBe(1);

    // button check
    const bulkRemoveButton = view.findComponent({ ref: 'bulk-remove-members-button' });
    expect(bulkRemoveButton.attributes('title')).toBe('rooms.members.bulkRemoveUser');

    await waitModalShown(view, () => {
      bulkRemoveButton.trigger('click');
    });

    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    // check if selectedMembers is set
    expect(view.vm.$data.selectedMembers).toMatchObject([{ id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 1 }]);

    // check if modal displays correct number of selected users
    expect(modal.find('h5').text()).toBe('rooms.members.modals.remove.titleBulk');

    // confirm removal of user
    await modal.find('footer').findAll('button').at(1).trigger('click');

    // check for request and respond
    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('delete');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member');

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

    // select and remove two members

    // select rows
    expect(view.vm.$data.selectedMembers.length).toBe(0);
    await rows.at(0).find('input').setChecked();
    expect(rows.at(0).find('input').element.checked).toBeTruthy();
    await rows.at(1).find('input').setChecked();
    expect(rows.at(1).find('input').element.checked).toBeTruthy();
    expect(view.vm.$data.selectedMembers.length).toBe(2);

    // button check
    expect(bulkRemoveButton.attributes('title')).toBe('rooms.members.bulkRemoveUser');

    await waitModalShown(view, () => {
      bulkRemoveButton.trigger('click');
    });

    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    // check if selectedMembers is set correctly
    expect(view.vm.$data.selectedMembers).toMatchObject([{ id: 6, firstname: 'Juan', lastname: 'Walter', email: 'JuanMWalter@domain.tld', role: 2 },
      { id: 7, firstname: 'Tammy', lastname: 'Law', email: 'TammyGLaw@domain.tld', role: 3 }]);

    // check if modal displays correct number of selected users
    expect(modal.find('h5').text()).toBe('rooms.members.modals.remove.titleBulk');

    // confirm removal of user
    await modal.find('footer').findAll('button').at(1).trigger('click');

    // check for request and respond
    await waitMoxios();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('delete');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member');

    await waitModalHidden(view, async () => {
      await request.respondWith({
        status: 204
      });
    });

    // check if modal was closed
    await view.vm.$nextTick();
    expect(modal.find('.modal').element.style.display).toEqual('none');

    // check if members were removed
    expect(view.vm.$data.members.length).toBe(0);

    view.destroy();
  });

  it('bulk edit with errors', async () => {
    PermissionService.setCurrentUser(exampleUser);
    const baseError = jest.spyOn(Base, 'error').mockImplementation();
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
    const modal = view.findComponent({ ref: 'bulk-edit-members-modal' });
    expect(modal.exists()).toBeTruthy();
    await view.vm.$nextTick();
    // check if modal is closed and try to open it
    expect(modal.find('.modal').element.style.display).toEqual('none');

    const members = view.findComponent(BTbody);
    const rows = members.findAllComponents(BTr);
    expect(rows.length).toBe(3);

    // check if checkbox is selected
    expect(rows.at(0).find('input').element.checked).toBeFalsy();

    // select first row
    expect(view.vm.$data.selectedMembers.length).toBe(0);
    await rows.at(0).find('input').setChecked();
    expect(rows.at(0).find('input').element.checked).toBeTruthy();
    expect(view.vm.$data.selectedMembers.length).toBe(1);

    expect(rows.at(0).findAll('td').at(5).text()).toBe('rooms.members.roles.participant');

    // check if button shows correct title
    const bulkEditButton = view.findComponent({ ref: 'bulk-edit-members-button' });
    expect(bulkEditButton.attributes('title')).toBe('rooms.members.bulkEditUser:{"numberOfSelectedUsers":1}');

    await waitModalShown(view, () => {
      bulkEditButton.trigger('click');
    });

    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    // check if selectedMembers is set
    expect(view.vm.$data.selectedMembers).toMatchObject([{ id: 5, firstname: 'Laura', lastname: 'Rivera', email: 'LauraWRivera@domain.tld', role: 1 }]);

    // check if modal displays correct number of selected users
    expect(modal.find('h5').text()).toBe('rooms.members.modals.edit.titleBulk:{"numberOfSelectedUsers":1}');

    // check modal action buttons
    const footerButtons = modal.find('footer').findAll('button');

    // confirm changes, not selected any role
    await footerButtons.at(1).trigger('click');

    // check for request and respond
    await waitMoxios();
    await view.vm.$nextTick();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('put');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member');
    expect(JSON.parse(request.config.data)).toEqual({ role: null, users: [5] });
    await request.respondWith({
      status: 422,
      response: {
        message: 'The Role field is required.',
        errors: {
          role: ['The Role field is required.']
        }
      }
    });

    // check if modal was NOT closed after error
    await view.vm.$nextTick();
    expect(modal.find('.modal').element.style.display).toEqual('block');

    // check if error is shown due to missing role
    const feedback = modal.findAllComponents(BFormInvalidFeedback);
    expect(feedback.length).toBe(2);
    expect(feedback.at(0).text()).toBe('The Role field is required.');

    // select role moderator
    const roleSelector = modal.findAllComponents(BFormRadio);
    await roleSelector.at(1).find('input').setChecked();
    expect(view.vm.$data.bulkEditRole).toBe(2);

    // confirm changes
    await footerButtons.at(1).trigger('click');

    // check for request and respond with user that is not member of the room anymore
    await waitMoxios();
    await view.vm.$nextTick();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('put');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member');
    expect(JSON.parse(request.config.data)).toEqual({ role: 2, users: [5] });
    await request.respondWith({
      status: 422,
      response: {
        message: 'The user \'Laura Rivera\' isn\'t a member.',
        errors: {
          'users.0': ['The user \'Laura Rivera\' isn\'t a member.']
        }
      }
    });

    // check if modal was NOT closed after error
    await view.vm.$nextTick();
    expect(modal.find('.modal').element.style.display).toEqual('block');

    // check if error is shown due to user not being member of the room
    // role error should not be shown anymore
    expect(feedback.length).toBe(2);
    expect(feedback.at(0).text()).toBe('');
    expect(feedback.at(1).text()).toBe('The user \'Laura Rivera\' isn\'t a member.');

    // confirm changes
    await footerButtons.at(1).trigger('click');

    // check for request and respond with user that is not member of the room anymore
    await waitMoxios();
    await view.vm.$nextTick();
    request = moxios.requests.mostRecent();
    expect(request.config.method).toEqual('put');
    expect(request.config.url).toEqual('/api/v1/rooms/123-456-789/member');
    expect(JSON.parse(request.config.data)).toEqual({ role: 2, users: [5] });
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
});
