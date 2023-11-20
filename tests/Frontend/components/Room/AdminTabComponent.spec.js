import { mount } from '@vue/test-utils';
import { createContainer, createLocalVue } from '../../helper';
import { BootstrapVue } from 'bootstrap-vue';
import AdminTabsComponent from '@/components/Room/AdminTabsComponent.vue';
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
  authenticated: true,
  allow_membership: false,
  is_member: true,
  is_co_owner: false,
  is_moderator: false,
  can_start: true,
  running: false
};

const stubs = {
  'settings-component': true,
  'members-component': true,
  'file-component': true,
  'history-component': true,
  'tokens-component': true,
  'room-description-component': true
};

describe('Admin Tabs Component', () => {
  it('Pass attributes to components', async () => {
    const view = mount(AdminTabsComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer(),
      stubs,
      propsData: {
        room
      }
    });

    const fileComponent = view.findComponent({ name: 'FileComponent' });
    expect(fileComponent.props('room')).toBe(room);

    const membersComponent = view.findComponent({ name: 'MembersComponent' });
    expect(membersComponent.props('room')).toBe(room);

    const historyComponent = view.findComponent({ name: 'HistoryComponent' });
    expect(historyComponent.props('room')).toBe(room);

    const tokensComponent = view.findComponent({ name: 'TokensComponent' });
    expect(tokensComponent.props('room')).toBe(room);

    const roomDescriptionComponent = view.findComponent({ name: 'RoomDescriptionComponent' });
    expect(roomDescriptionComponent.props('room')).toBe(room);

    const settingsComponent = view.findComponent({ name: 'SettingsComponent' });
    expect(settingsComponent.props('room')).toBe(room);
  });

  it('Emit events of components', async () => {
    const view = mount(AdminTabsComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      attachTo: createContainer(),
      stubs,
      propsData: {
        room
      }
    });

    const roomDescriptionComponent = view.findComponent({ name: 'RoomDescriptionComponent' });
    roomDescriptionComponent.vm.$emit('settings-changed');
    expect(view.emitted('settings-changed').length).toBe(1);

    const settingsComponent = view.findComponent({ name: 'SettingsComponent' });
    settingsComponent.vm.$emit('settings-changed');
    expect(view.emitted('settings-changed').length).toBe(2);
  });
});
