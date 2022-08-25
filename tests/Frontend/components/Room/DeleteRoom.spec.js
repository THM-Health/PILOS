import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue from 'bootstrap-vue';
import moxios from 'moxios';
import Clipboard from 'v-clipboard';
import Vuex from 'vuex';
import DeleteRoomComponent from '../../../../resources/js/components/Room/DeleteRoomComponent';
import Base from '../../../../resources/js/api/base';
import { waitMoxios, createContainer } from '../../helper';

const localVue = createLocalVue();

localVue.use(BootstrapVue);
localVue.use(Clipboard);
localVue.use(Vuex);

const exampleRoom = { id: 'gs4-6fb-kk8', name: 'Meeting One', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, authenticated: true, allow_membership: false, is_member: false, is_co_owner: false, is_guest: false, is_moderator: false, can_start: true, running: false, access_code: 123456789, files: [] };

describe('Delete room', () => {
  beforeEach(() => {
    moxios.install();
  });
  afterEach(() => {
    moxios.uninstall();
  });

  it('default render', () => {
    const component = mount(DeleteRoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: exampleRoom,
        buttonClass: 'demoClass'
      },
      attachTo: createContainer()
    });

    const deleteButton = component.findComponent({ ref: 'deleteButton' });
    expect(deleteButton.exists()).toBe(true);
    expect(deleteButton.attributes('disabled')).not.toBe('disabled');
    expect(deleteButton.classes()).toContain('demoClass');
  });

  it('disable button', () => {
    const component = mount(DeleteRoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: exampleRoom,
        disabled: true
      },
      attachTo: createContainer()
    });

    const deleteButton = component.findComponent({ ref: 'deleteButton' });
    expect(deleteButton.exists()).toBe(true);
    expect(deleteButton.attributes('disabled')).toBe('disabled');
  });

  it('successfull delete', async () => {
    const component = mount(DeleteRoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: exampleRoom,
        disabled: true
      },
      attachTo: createContainer()
    });

    const bvModalEvt = {
      preventDefault: jest.fn()
    };

    component.vm.deleteRoom(bvModalEvt);

    await waitMoxios();

    const request = moxios.requests.mostRecent();
    expect(request.config.method).toMatch('delete');
    expect(request.config.url).toContain(exampleRoom.id);
    await request.respondWith({
      status: 204
    });

    await component.vm.$nextTick();
    expect(component.emitted().roomDeleted).toBeTruthy();
  });

  it('failed delete room not found', async () => {
    const flashMessageSpy = jest.spyOn(Base, 'error').mockImplementation();

    const component = mount(DeleteRoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: exampleRoom,
        disabled: true
      },
      attachTo: createContainer(),
      Base
    });

    const bvModalEvt = {
      preventDefault: jest.fn()
    };

    component.vm.deleteRoom(bvModalEvt);
    await waitMoxios();
    const request = moxios.requests.mostRecent();
    expect(request.config.method).toMatch('delete');
    expect(request.config.url).toContain(exampleRoom.id);
    await request.respondWith({
      status: 404
    });

    await component.vm.$nextTick();
    expect(flashMessageSpy).toBeCalledTimes(1);
    expect(flashMessageSpy.mock.calls[0][0].response.status).toBe(404);
  });
});
