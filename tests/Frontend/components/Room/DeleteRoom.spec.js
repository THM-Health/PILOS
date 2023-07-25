import { mount } from '@vue/test-utils';
import BootstrapVue from 'bootstrap-vue';
import VueClipboard from 'vue-clipboard2';
import DeleteRoomComponent from '../../../../resources/js/components/Room/DeleteRoomComponent.vue';
import Base from '../../../../resources/js/api/base';
import { mockAxios, createContainer, createLocalVue } from '../../helper';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(VueClipboard);

const exampleRoom = { id: 'gs4-6fb-kk8', name: 'Meeting One', owner: { id: 1, name: 'John Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, authenticated: true, allow_membership: false, is_member: false, is_co_owner: false, is_guest: false, is_moderator: false, can_start: true, running: false, access_code: 123456789, files: [] };

describe('Delete room', () => {
  beforeEach(() => {
    mockAxios.reset();
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
      preventDefault: vi.fn()
    };

    const request = mockAxios.request('/api/v1/rooms/gs4-6fb-kk8');

    component.vm.deleteRoom(bvModalEvt);

    await request.wait();

    expect(request.config.method).toMatch('delete');

    await request.respondWith({
      status: 204
    });

    await component.vm.$nextTick();
    expect(component.emitted().roomDeleted).toBeTruthy();
  });

  it('failed delete room not found', async () => {
    const baseErrorSpy = vi.spyOn(Base, 'error').mockImplementation(() => {});

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
      preventDefault: vi.fn()
    };

    const request = mockAxios.request('/api/v1/rooms/gs4-6fb-kk8');

    component.vm.deleteRoom(bvModalEvt);

    await request.wait();

    expect(request.config.method).toMatch('delete');

    await request.respondWith({
      status: 404
    });

    await component.vm.$nextTick();
    expect(baseErrorSpy).toBeCalledTimes(1);
    expect(baseErrorSpy.mock.calls[0][0].response.status).toBe(404);
  });
});
