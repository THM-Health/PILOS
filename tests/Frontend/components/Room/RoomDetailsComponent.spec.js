import { mount } from '@vue/test-utils';
import { createContainer, createLocalVue, i18nDateMock } from '../../helper';
import RoomDetailsComponent from '@/components/Room/RoomDetailsComponent.vue';

const localVue = createLocalVue();

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

describe('RoomDetailsComponent', () => {
  it('show room details', async () => {
    const view = mount(RoomDetailsComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        $d: i18nDateMock
      },
      stubs: {
        'room-type-badge': true
      },
      propsData: {
        room
      },
      attachTo: createContainer()
    });

    expect(view.findAll('span').at(0).text()).toBe('John Doe');
    expect(view.findAll('span').at(1).text()).toBe('rooms.index.room_component.never_started');
    expect(view.find('.fa-users').exists()).toBe(false);

    // running room
    const runningRoom = { ...room, last_meeting: { start: '2023-08-21 08:18:28:00', end: null, usage: { participant_count: 5 } } };
    await view.setProps({ room: runningRoom });
    await view.vm.$nextTick();

    expect(view.findAll('span').at(1).text()).toBe('rooms.index.room_component.running_since:{"date":"08/21/2023, 10:18"}');

    expect(view.find('.fa-users').exists()).toBe(true);
    expect(view.findAll('span').at(2).text()).toBe('5 meetings.participant_count');

    // ended room
    const endedRoom = { ...room, last_meeting: { start: '2023-08-21 08:18:28:00', end: '2023-08-21 08:20:28:00' } };
    await view.setProps({ room: endedRoom });
    await view.vm.$nextTick();

    expect(view.findAll('span').at(1).text()).toBe('rooms.index.room_component.last_ran_till:{"date":"08/21/2023, 10:20"}');
    expect(view.find('.fa-users').exists()).toBe(false);

    view.destroy();
  });

  it('show room details with short description', async () => {
    const view = mount(RoomDetailsComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        $d: i18nDateMock
      },
      stubs: {
        'room-type-badge': true
      },
      propsData: {
        room,
        showDescription: true
      },
      attachTo: createContainer()
    });

    expect(view.findAll('span').at(0).text()).toBe('John Doe');
    expect(view.findAll('span').at(1).text()).toBe('room short description');
    expect(view.findAll('span').at(2).text()).toBe('rooms.index.room_component.never_started');

    view.destroy();
  });
});
