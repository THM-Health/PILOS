import { mount } from '@vue/test-utils';
import VueRouter from 'vue-router';
import { mockAxios, createContainer, createLocalVue, waitModalShown, waitModalHidden } from '../../helper';
import { expect } from 'vitest';
import TransferOwnershipDropdownButton from '@/components/Room/TransferOwnershipDropdownButton.vue';
import { createTestingPinia } from '@pinia/testing';
import { BDropdownItemButton, BFormRadio } from 'bootstrap-vue';
import Base from '@/api/base';

const localVue = createLocalVue();
localVue.use(VueRouter);

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], model_name: 'User', room_limit: -1 };

const initialState = { auth: { currentUser: exampleUser } };
const room = {
  id: 'abc-def-123',
  name: 'Meeting One',
  short_description: 'room short description',
  is_favorite: false,
  owner: {
    id: 1,
    name: 'John Doe'
  },
  type: {
    id: 2,
    description: 'Meeting',
    color: '#4a5c66',
    default: false
  },
  last_meeting: null
};

describe('Room Transfer Dropdown Button', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it('test transfer ownership with role', async () => {
    const view = mount(TransferOwnershipDropdownButton, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    // find modal
    const modal = view.findComponent({ ref: 'transfer-ownership-modal' });
    expect(modal.exists()).toBeTruthy();

    // check if modal is closed
    expect(modal.find('.modal').element.style.display).toEqual('none');

    // check if button to open the modal exists and shows the correct title
    const transferButton = view.findComponent(BDropdownItemButton).find('button');
    expect(transferButton.exists()).toBeTruthy();
    expect(transferButton.text()).toBe('rooms.modals.transfer_ownership.title');

    // try to open modal
    await waitModalShown(view, async () => {
      transferButton.trigger('click');
    });

    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    // find user search and enter query
    const searchField = modal.find('input');

    const searchRequest = mockAxios.request('/api/v1/users/search');

    await searchField.setValue('John');
    await searchRequest.wait();
    // check user search query request and respond with found users
    expect(searchRequest.config.params.query).toEqual('John');
    await searchRequest.respondWith({
      status: 200,
      data: {
        data: [
          { id: 1, firstname: 'John', lastname: 'Doe', email: 'JohnWDoe@domain.tld', image: null },
          { id: 10, firstname: 'John', lastname: 'Walter', email: 'JohnMWalter@domain.tld', image: null }
        ]
      }
    });

    // check user options shown
    const userOptions = modal.findAll('li');
    // amount of users + no result and no options items
    expect(userOptions.length).toBe(4);
    expect(userOptions.at(0).text()).toBe('John DoeJohnWDoe@domain.tld');
    expect(userOptions.at(1).text()).toBe('John WalterJohnMWalter@domain.tld');
    expect(userOptions.at(2).text()).toBe('rooms.members.modals.add.no_result');
    expect(userOptions.at(3).text()).toBe('rooms.members.modals.add.no_options');

    // check which user options are shown to the user
    expect(userOptions.at(0).element.style.display).toEqual('');
    expect(userOptions.at(1).element.style.display).toEqual('');
    expect(userOptions.at(2).element.style.display).toEqual('none');
    expect(userOptions.at(3).element.style.display).toEqual('none');

    expect(userOptions.at(0).find('span').classes()).toContain('multiselect__option--disabled');
    expect(userOptions.at(1).find('span').classes()).not.toContain('multiselect__option--disabled');

    // select new owner
    await userOptions.at(1).find('span').trigger('click');
    expect(view.vm.$data.newOwner.id).toBe(10);

    // check role selector, labels and values
    const roleSelector = modal.findAllComponents(BFormRadio);
    expect(roleSelector.length).toBe(4);
    expect(roleSelector.at(0).text()).toBe('rooms.roles.participant');
    expect(roleSelector.at(1).text()).toBe('rooms.roles.moderator');
    expect(roleSelector.at(2).text()).toBe('rooms.roles.co_owner');
    expect(roleSelector.at(3).text()).toContain('rooms.modals.transfer_ownership.no_role');
    expect(roleSelector.at(3).text()).toContain('rooms.modals.transfer_ownership.warning');

    expect(roleSelector.at(0).find('input').attributes('value')).toBe('1');
    expect(roleSelector.at(1).find('input').attributes('value')).toBe('2');
    expect(roleSelector.at(2).find('input').attributes('value')).toBe('3');
    expect(roleSelector.at(3).find('input').attributes('value')).toBe('');

    expect(roleSelector.at(0).props('checked')).toBe(3);
    expect(view.vm.$data.newRoleInRoom).toBe(3);

    // select role participant
    await roleSelector.at(0).find('input').setChecked();
    expect(view.vm.$data.newRoleInRoom).toBe(1);

    // check modal action buttons
    const footerButtons = modal.find('footer').findAll('button');
    expect(footerButtons.length).toBe(2);
    expect(footerButtons.at(0).text()).toBe('app.cancel');
    expect(footerButtons.at(1).text()).toBe('rooms.modals.transfer_ownership.transfer');

    const transferOwnershipRequest = mockAxios.request('/api/v1/rooms/abc-def-123/transfer');

    // confirm transfer of room ownership
    await footerButtons.at(1).trigger('click');

    // check for request and respond
    await transferOwnershipRequest.wait();
    expect(transferOwnershipRequest.config.method).toEqual('post');
    expect(JSON.parse(transferOwnershipRequest.config.data)).toMatchObject({ user: 10, role: 1 });

    await waitModalHidden(view, async () => {
      await transferOwnershipRequest.respondWith({
        status: 204
      });
    });

    // check is modal was closed after adding user successfully
    expect(modal.find('.modal').element.style.display).toEqual('none');
    // check if favorites_changed gets emitted
    expect(view.emitted('transferred-ownership')).toBeTruthy();

    view.destroy();
  });

  it('test transfer ownership without role', async () => {
    const view = mount(TransferOwnershipDropdownButton, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    // find modal
    const modal = view.findComponent({ ref: 'transfer-ownership-modal' });
    expect(modal.exists()).toBeTruthy();

    // check if modal is closed
    expect(modal.find('.modal').element.style.display).toEqual('none');

    // check if button to open the modal exists
    const transferButton = view.findComponent(BDropdownItemButton).find('button');
    expect(transferButton.exists()).toBeTruthy();

    // try to open modal
    await waitModalShown(view, async () => {
      transferButton.trigger('click');
    });

    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    // find user search and enter query
    const searchField = modal.find('input');

    const searchRequest = mockAxios.request('/api/v1/users/search');

    await searchField.setValue('John');
    await searchRequest.wait();
    // check user search query request and respond with found users
    expect(searchRequest.config.params.query).toEqual('John');
    await searchRequest.respondWith({
      status: 200,
      data: {
        data: [
          { id: 1, firstname: 'John', lastname: 'Doe', email: 'JohnWDoe@domain.tld', image: null },
          { id: 10, firstname: 'John', lastname: 'Walter', email: 'JohnMWalter@domain.tld', image: null }
        ]
      }
    });

    // check user options shown
    const userOptions = modal.findAll('li');
    // amount of users + no result and no options items
    expect(userOptions.length).toBe(4);
    expect(userOptions.at(0).text()).toBe('John DoeJohnWDoe@domain.tld');
    expect(userOptions.at(1).text()).toBe('John WalterJohnMWalter@domain.tld');
    expect(userOptions.at(2).text()).toBe('rooms.members.modals.add.no_result');
    expect(userOptions.at(3).text()).toBe('rooms.members.modals.add.no_options');

    expect(userOptions.at(0).find('span').classes()).toContain('multiselect__option--disabled');
    expect(userOptions.at(1).find('span').classes()).not.toContain('multiselect__option--disabled');

    // select new owner
    await userOptions.at(1).find('span').trigger('click');
    expect(view.vm.$data.newOwner.id).toBe(10);

    // check role selector, labels and values
    const roleSelector = modal.findAllComponents(BFormRadio);
    expect(roleSelector.length).toBe(4);
    expect(roleSelector.at(0).text()).toBe('rooms.roles.participant');
    expect(roleSelector.at(1).text()).toBe('rooms.roles.moderator');
    expect(roleSelector.at(2).text()).toBe('rooms.roles.co_owner');
    expect(roleSelector.at(3).text()).toContain('rooms.modals.transfer_ownership.no_role');
    expect(roleSelector.at(3).text()).toContain('rooms.modals.transfer_ownership.warning');

    // select role to no role
    await roleSelector.at(3).find('input').setChecked();
    expect(view.vm.$data.newRoleInRoom).toBe(null);

    // find modal action buttons
    const footerButtons = modal.find('footer').findAll('button');
    expect(footerButtons.length).toBe(2);

    const transferOwnershipRequest = mockAxios.request('/api/v1/rooms/abc-def-123/transfer');

    // confirm transfer of room ownership
    await footerButtons.at(1).trigger('click');

    // check for request and respond
    await transferOwnershipRequest.wait();
    expect(transferOwnershipRequest.config.method).toEqual('post');
    expect(JSON.parse(transferOwnershipRequest.config.data)).toMatchObject({ user: 10 });

    await waitModalHidden(view, async () => {
      await transferOwnershipRequest.respondWith({
        status: 204
      });
    });

    // check is modal was closed after adding user successfully
    expect(modal.find('.modal').element.style.display).toEqual('none');
    // check if favorites_changed gets emitted
    expect(view.emitted('transferred-ownership')).toBeTruthy();

    view.destroy();
  });

  it('test transfer ownership with error search users', async () => {
    const baseError = vi.spyOn(Base, 'error').mockImplementation(() => {});
    const view = mount(TransferOwnershipDropdownButton, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    // find modal
    const modal = view.findComponent({ ref: 'transfer-ownership-modal' });
    expect(modal.exists()).toBeTruthy();

    // check if modal is closed
    expect(modal.find('.modal').element.style.display).toEqual('none');

    // check if button to open the modal exists
    const transferButton = view.findComponent(BDropdownItemButton).find('button');
    expect(transferButton.exists()).toBeTruthy();

    // try to open modal
    await waitModalShown(view, async () => {
      transferButton.trigger('click');
    });

    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    // find user search and enter query
    const searchField = modal.find('input');

    const searchRequest = mockAxios.request('/api/v1/users/search');

    await searchField.setValue('J');
    await searchRequest.wait();
    // check user search query request
    expect(searchRequest.config.params.query).toEqual('J');

    // respond with error
    await searchRequest.respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    // check if modal shows correctly
    expect(modal.find('.modal').element.style.display).toEqual('block');
    expect(modal.find('footer').findAll('button').at(1).element.disabled).toBeTruthy();
    const userOptions = modal.findAll('li');
    expect(userOptions.at(0).text()).toBe('rooms.members.modals.add.no_result');
    expect(userOptions.at(1).text()).toBe('rooms.members.modals.add.no_options');

    // check which user options are shown to the user
    expect(userOptions.at(0).element.style.display).toEqual('');
    expect(userOptions.at(1).element.style.display).toEqual('none');

    // check if baseError was called
    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(500);

    view.destroy();
  });

  it('test transfer ownership with errors', async () => {
    const baseError = vi.spyOn(Base, 'error').mockImplementation(() => {});
    const view = mount(TransferOwnershipDropdownButton, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      pinia: createTestingPinia({ initialState }),
      attachTo: createContainer()
    });

    // find modal
    const modal = view.findComponent({ ref: 'transfer-ownership-modal' });
    expect(modal.exists()).toBeTruthy();

    // check if modal is closed
    expect(modal.find('.modal').element.style.display).toEqual('none');

    // check if button to open the modal exists
    const transferButton = view.findComponent(BDropdownItemButton).find('button');
    expect(transferButton.exists()).toBeTruthy();

    // try to open modal
    await waitModalShown(view, async () => {
      transferButton.trigger('click');
    });

    // check if modal is open
    expect(modal.find('.modal').element.style.display).toEqual('block');

    // find user search and enter query
    const searchField = modal.find('input');

    const searchRequest = mockAxios.request('/api/v1/users/search');

    await searchField.setValue('John');
    await searchRequest.wait();
    // check user search query request and respond with found users
    expect(searchRequest.config.params.query).toEqual('John');
    await searchRequest.respondWith({
      status: 200,
      data: {
        data: [
          { id: 1, firstname: 'John', lastname: 'Doe', email: 'JohnWDoe@domain.tld', image: null },
          { id: 10, firstname: 'John', lastname: 'Walter', email: 'JohnMWalter@domain.tld', image: null }
        ]
      }
    });

    // select new owner
    await modal.findAll('li').at(1).find('span').trigger('click');
    expect(view.vm.$data.newOwner.id).toBe(10);
    expect(view.vm.$data.newRoleInRoom).toBe(3);

    // find modal action buttons
    const footerButtons = modal.find('footer').findAll('button');
    expect(footerButtons.length).toBe(2);

    let transferOwnershipRequest = mockAxios.request('/api/v1/rooms/abc-def-123/transfer');

    // confirm transfer of room ownership
    await footerButtons.at(1).trigger('click');

    // check for request and respond
    await transferOwnershipRequest.wait();
    expect(transferOwnershipRequest.config.method).toEqual('post');
    expect(JSON.parse(transferOwnershipRequest.config.data)).toMatchObject({ user: 10, role: 3 });

    // respond with error (user is the owner)
    await transferOwnershipRequest.respondWith({
      status: 422,
      data: {
        errors: {
          user: ['The selected user is the owner of the room.']
        }
      }
    });

    // check if the modal shows correctly
    expect(footerButtons.at(1).element.disabled).toBeFalsy();
    expect(modal.html()).toContain('The selected user is the owner of the room.');

    // confirm transfer of room ownership
    transferOwnershipRequest = mockAxios.request('/api/v1/rooms/abc-def-123/transfer');
    await footerButtons.at(1).trigger('click');

    // check for request and respond
    await transferOwnershipRequest.wait();
    expect(transferOwnershipRequest.config.method).toEqual('post');

    // respond with error (user can not own rooms)
    await transferOwnershipRequest.respondWith({
      status: 422,
      data: {
        errors: {
          user: ['The selected user can not own rooms.']
        }
      }
    });

    // check if the modal shows correctly
    expect(footerButtons.at(1).element.disabled).toBeFalsy();
    expect(modal.html()).toContain('The selected user can not own rooms.');

    // confirm transfer of room ownership
    transferOwnershipRequest = mockAxios.request('/api/v1/rooms/abc-def-123/transfer');
    await footerButtons.at(1).trigger('click');

    // check for request and respond
    await transferOwnershipRequest.wait();
    expect(transferOwnershipRequest.config.method).toEqual('post');

    // respond with error (user reached max. amount of rooms and can not own rooms with the room type)
    await transferOwnershipRequest.respondWith({
      status: 422,
      data: {
        errors: {
          user: ['The selected user has reached the max. amount of rooms.', 'The selected user can not own rooms with the room type of this room.']
        }
      }
    });

    // check if the modal shows correctly
    expect(footerButtons.at(1).element.disabled).toBeFalsy();
    expect(modal.html()).toContain('The selected user has reached the max. amount of rooms.');
    expect(modal.html()).toContain('The selected user can not own rooms with the room type of this room.');

    // confirm transfer of room ownership
    transferOwnershipRequest = mockAxios.request('/api/v1/rooms/abc-def-123/transfer');
    await footerButtons.at(1).trigger('click');

    // check for request and respond
    await transferOwnershipRequest.wait();
    expect(transferOwnershipRequest.config.method).toEqual('post');

    // respond with error (invalid role)
    await transferOwnershipRequest.respondWith({
      status: 422,
      data: {
        errors: {
          role: ['The selected role is invalid']
        }
      }
    });

    // check if the modal shows correctly
    expect(footerButtons.at(1).element.disabled).toBeFalsy();
    expect(modal.html()).toContain('The selected role is invalid');

    // confirm transfer of room ownership
    transferOwnershipRequest = mockAxios.request('/api/v1/rooms/abc-def-123/transfer');
    await footerButtons.at(1).trigger('click');

    // check for request and respond
    await transferOwnershipRequest.wait();
    expect(transferOwnershipRequest.config.method).toEqual('post');

    // respond with error
    await transferOwnershipRequest.respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    // check if the modal shows correctly
    expect(modal.find('.modal').element.style.display).toEqual('block');
    expect(footerButtons.at(1).element.disabled).toBeFalsy();

    // check if baseError was called
    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(500);
    view.destroy();
  });
});
