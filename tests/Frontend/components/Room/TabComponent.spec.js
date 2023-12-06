import { mount } from '@vue/test-utils';
import { createContainer, createLocalVue } from '../../helper';
import { BootstrapVue } from 'bootstrap-vue';
import TabComponent from '@/components/Room/TabsComponent.vue';
import RoomDescriptionComponent from '@/components/Room/RoomDescriptionComponent.vue';
import FileComponent from '@/components/Room/FileComponent.vue';
import { expect, it } from 'vitest';

const localVue = createLocalVue();
localVue.use(BootstrapVue);

const room = {
  id: 'gs4-6fb-kk8',
  name: 'Meeting One',
  description: null,
  owner: { id: 2, name: 'John Doe' },
  type: { id: 2, description: 'Meeting', color: '#4a5c66', default: false },
  model_name: 'Room',
  authenticated: false,
  allow_membership: false,
  is_member: true,
  is_co_owner: false,
  is_moderator: false,
  can_start: true,
  running: false
};

describe('TabsComponent', () => {
  it('Hide description tab if description is empty', async () => {
    const view = mount(TabComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer(),
      stubs: {
        'file-component': true,
        'room-description-component': true
      },
      propsData: {
        room,
        accessCode: null,
        token: null
      }
    });

    const descriptionTab = view.findComponent(RoomDescriptionComponent);
    expect(descriptionTab.exists()).toBe(false);
  });

  it('Show description tab if description is not empty', async () => {
    const roomWithDescription = { ...room, description: 'This is a description' };
    const view = mount(TabComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer(),
      stubs: {
        'file-component': true,
        'room-description-component': true
      },
      propsData: {
        room: roomWithDescription,
        accessCode: null,
        token: null
      }
    });

    const descriptionTab = view.findComponent(RoomDescriptionComponent);
    expect(descriptionTab.exists()).toBe(true);
  });

  it('Pass attributes to file component', async () => {
    const view = mount(TabComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer(),
      stubs: {
        'file-component': true,
        'room-description-component': true
      },
      propsData: {
        room,
        accessCode: 905992606,
        token: 'xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR'
      }
    });

    const fileComponent = view.findComponent(FileComponent);
    expect(fileComponent.exists()).toBe(true);

    expect(fileComponent.props('room')).toBe(room);
    expect(fileComponent.props('accessCode')).toBe(905992606);
    expect(fileComponent.props('token')).toBe('xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR');
  });

  it('Pass error from components to parent', async () => {
    const view = mount(TabComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer(),
      stubs: {
        'file-component': true,
        'room-description-component': true
      },
      propsData: {
        room,
        accessCode: 905992606,
        token: 'xWDCevVTcMys1ftzt3nFPgU56Wf32fopFWgAEBtklSkFU22z1ntA4fBHsHeMygMiOa9szJbNEfBAgEWSLNWg2gcF65PwPZ2ylPQR'
      }
    });

    view.findComponent({ name: 'FileComponent' }).vm.$emit('invalid-code');
    expect(view.emitted('invalid-code').length).toBe(1);

    view.findComponent({ name: 'FileComponent' }).vm.$emit('invalid-token');
    expect(view.emitted('invalid-token')).toBeTruthy();

    view.findComponent({ name: 'FileComponent' }).vm.$emit('guests-not-allowed');
    expect(view.emitted('guests-not-allowed')).toBeTruthy();
  });
});
