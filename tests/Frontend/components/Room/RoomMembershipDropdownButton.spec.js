import { mount } from '@vue/test-utils';
import BootstrapVue, { BButton, BDropdownItemButton, BModal } from 'bootstrap-vue';
import RoomMembershipDropdownButton from '@/components/Room/RoomMembershipDropdownButton.vue';
import PermissionService from '@/services/PermissionService';
import Base from '@/api/base';
import { waitModalHidden, waitModalShown, mockAxios, createLocalVue, createContainer } from '../../helper';

const localVue = createLocalVue();

localVue.use(BootstrapVue);

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], model_name: 'User', room_limit: -1 };

const room = {
  id: 'abc-def-456',
  name: 'Meeting One',
  owner: { id: 2, name: 'Max Doe' },
  last_meeting: null,
  type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
  model_name: 'Room',
  authenticated: true,
  allow_membership: true,
  is_member: false,
  is_owner: false,
  is_guest: false,
  is_moderator: false,
  can_start: false,
  current_user: exampleUser
};

describe('Room Membership Dropdown Button', () => {
  beforeEach(() => {
    PermissionService.setCurrentUser(exampleUser);
    mockAxios.reset();
  });

  it('join membership', async () => {
    const view = mount(RoomMembershipDropdownButton, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: { ...room, is_member: false }
      },
      stubs: {
        transition: false
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // find join membership button
    const dropdownButton = view.findComponent(BDropdownItemButton).find('button');
    expect(dropdownButton.exists()).toBeTruthy();
    expect(dropdownButton.text()).toContain('rooms.become_member');

    // trigger join membership button
    const joinMembershipRequest = mockAxios.request('/api/v1/rooms/abc-def-456/membership');

    await dropdownButton.trigger('click');
    await joinMembershipRequest.wait();
    expect(joinMembershipRequest.config.method).toEqual('post');

    // respond to join membership request
    await joinMembershipRequest.respondWith({
      status: 204,
      data: {}
    });

    // check if membership event was emitted
    expect(view.emitted('added')).toBeTruthy();

    view.destroy();
  });

  it('join membership error', async () => {
    const baseError = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const view = mount(RoomMembershipDropdownButton, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: { ...room, is_member: false }
      },
      stubs: {
        transition: false
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    await mockAxios.wait();
    await view.vm.$nextTick();

    const dropdownButton = view.findComponent(BDropdownItemButton).find('button');

    // trigger join membership button
    mockAxios.request('/api/v1/rooms/abc-def-456/membership').respondWith({
      status: 401,
      data: {
        message: 'invalid_code'
      }
    });

    await dropdownButton.trigger('click');
    await mockAxios.wait();

    // check error was emitted
    expect(view.emitted('invalid-code').length).toBe(1);

    // trigger join membership button
    mockAxios.request('/api/v1/rooms/abc-def-456/membership').respondWith({
      status: 403,
      data: {
        message: 'Membership failed! Membership for this room is currently not available.'
      }
    });

    await dropdownButton.trigger('click');
    await mockAxios.wait();

    // check error was emitted and global error was called
    expect(view.emitted('membership-disabled').length).toBe(1);
    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(403);

    // trigger join membership button
    mockAxios.request('/api/v1/rooms/abc-def-456/membership').respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    await dropdownButton.trigger('click');
    await mockAxios.wait();

    // check if global error was called
    expect(baseError).toBeCalledTimes(2);
    expect(baseError.mock.calls[1][0].response.status).toEqual(500);

    view.destroy();
  });

  it('end membership', async () => {
    const view = mount(RoomMembershipDropdownButton, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: { ...room, is_member: true },
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // Find confirm modal and check if it is hidden
    const leaveMembershipModal = view.findComponent(BModal);
    expect(leaveMembershipModal.vm.$data.isVisible).toBe(false);

    // Click button to leave membership
    const dropdownButton = view.findComponent(BDropdownItemButton).find('button');
    await waitModalShown(view, () => {
      dropdownButton.trigger('click');
    });

    // wait until modal is open
    await view.vm.$nextTick();

    // confirm modal is shown
    expect(leaveMembershipModal.vm.$data.isVisible).toBe(true);

    // find the confirm button and click it
    const leaveConfirmButton = leaveMembershipModal.findAllComponents(BButton).at(1);
    expect(leaveConfirmButton.text()).toBe('rooms.end_membership.yes');

    const leaveRequest = mockAxios.request('/api/v1/rooms/abc-def-456/membership');

    await waitModalHidden(view, () => {
      leaveConfirmButton.trigger('click');
    });
    // check if modal is closed
    await view.vm.$nextTick();

    // check if the modal is hidden
    expect(leaveMembershipModal.vm.$data.isVisible).toBe(false);

    // check leave membership request
    await leaveRequest.wait();
    expect(leaveRequest.config.method).toEqual('delete');

    // respond to leave membership request
    await leaveRequest.respondWith({
      status: 204,
      data: {}
    });

    // check if membership event was emitted
    expect(view.emitted('removed')).toBeTruthy();

    view.destroy();
  });

  it('end membership error', async () => {
    const baseError = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const view = mount(RoomMembershipDropdownButton, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: { ...room, is_member: true },
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // Find confirm modal and check if it is hidden
    const leaveMembershipModal = view.findComponent(BModal);
    expect(leaveMembershipModal.vm.$data.isVisible).toBe(false);

    // Click button to leave membership
    const dropdownButton = view.findComponent(BDropdownItemButton).find('button');
    await waitModalShown(view, () => {
      dropdownButton.trigger('click');
    });

    // wait until modal is open
    await view.vm.$nextTick();

    // confirm modal is shown
    expect(leaveMembershipModal.vm.$data.isVisible).toBe(true);

    // find the confirm button and click it
    const leaveConfirmButton = leaveMembershipModal.findAllComponents(BButton).at(1);
    expect(leaveConfirmButton.text()).toBe('rooms.end_membership.yes');

    const leaveRequest = mockAxios.request('/api/v1/rooms/abc-def-456/membership');

    await waitModalHidden(view, () => {
      leaveConfirmButton.trigger('click');
    });
    // check if modal is closed
    await view.vm.$nextTick();

    // check if the modal is hidden
    expect(leaveMembershipModal.vm.$data.isVisible).toBe(false);

    // check leave membership request
    await leaveRequest.wait();
    expect(leaveRequest.config.method).toEqual('delete');

    // respond to leave membership test with error
    await leaveRequest.respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    // check if global error was called
    expect(baseError).toBeCalledTimes(1);
    expect(baseError.mock.calls[0][0].response.status).toEqual(500);

    view.destroy();
  });
});
