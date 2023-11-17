import { mount } from '@vue/test-utils';
import VueRouter from 'vue-router';
import { mockAxios, createContainer, createLocalVue, waitModalShown, waitModalHidden } from '../../helper';
import RoomCardComponent from '@/components/Room/RoomCardComponent.vue';
import { expect } from 'vitest';
import { BButton, BCard, BModal } from 'bootstrap-vue';

const localVue = createLocalVue();
localVue.use(VueRouter);

const RoomView = {
  /* eslint-disable @intlify/vue-i18n/no-raw-text */
  template: '<div>Room view</div>'
};

const routerMock = new VueRouter({
  mode: 'abstract',
  routes: [{
    path: '/rooms/:id/:token?',
    name: 'rooms.view',
    component: RoomView
  }]
});

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

describe('RoomCardComponent', () => {
  it('pass attributes to components', async () => {
    const view = mount(RoomCardComponent, {
      localVue,
      router: routerMock,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      stubs: {
        'room-favorite-button': true,
        'room-details-component': true,
        'room-type-badge': true
      },
      propsData: {
        room
      },
      attachTo: createContainer()
    });

    const roomDetails = view.getComponent({ name: 'RoomDetailsComponent' });
    expect(roomDetails.exists()).toBeTruthy();
    expect(roomDetails.props('room').id).toEqual('abc-def-123');

    const badge = view.getComponent({ name: 'RoomTypeBadge' });
    expect(badge.exists()).toBeTruthy();
    expect(badge.props('roomType').id).toEqual(2);

    const favoriteButton = view.getComponent({ name: 'RoomFavoriteButton' });
    expect(favoriteButton.exists()).toBeTruthy();
    expect(favoriteButton.props('room').id).toEqual('abc-def-123');

    expect(view.get('h5').text()).toEqual('Meeting One');

    view.destroy();
  });

  it('click on room', async () => {
    const routerSpy = vi.spyOn(routerMock, 'push').mockImplementation(() => Promise.resolve());

    const view = mount(RoomCardComponent, {
      localVue,
      router: routerMock,
      mocks: {
        $t: (key) => key
      },
      stubs: {
        'room-favorite-button': true,
        'room-details-component': true,
        'room-type-badge': true
      },
      propsData: {
        room
      },
      attachTo: createContainer()
    });

    // try to open room
    await view.findComponent(BCard).trigger('click');

    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith('/rooms/abc-def-123');

    view.destroy();
  });

  it('test details modal', async () => {
    const routerSpy = vi.spyOn(routerMock, 'push').mockImplementation(() => Promise.resolve());

    const view = mount(RoomCardComponent, {
      localVue,
      router: routerMock,
      mocks: {
        $t: (key) => key
      },
      stubs: {
        transition: false,
        'room-favorite-button': true,
        'room-details-component': true,
        'room-type-badge': true
      },
      propsData: {
        room,
        modalStatic: true
      },
      attachTo: createContainer()
    });

    // check if button is shown
    expect(view.findAllComponents(BButton).length).toBe(3);
    const shortDescButton = view.findAllComponents(BButton).at(0);
    expect(shortDescButton.html()).toContain('fa-info');

    // check if modal exists and is closed
    const detailsModal = view.findComponent(BModal);
    expect(detailsModal.exists()).toBeTruthy();
    expect(detailsModal.find('.modal').element.style.display).toEqual('none');

    // try to open modal
    await waitModalShown(view, async () => {
      shortDescButton.trigger('click');
    });

    // check if modal is open
    expect(detailsModal.find('.modal').element.style.display).toEqual('block');

    // check if modal shows correct
    expect(detailsModal.findAll('h5').at(0).text()).toEqual('rooms.index.room_component.details');
    expect(detailsModal.findAll('h5').at(1).text()).toEqual('Meeting One');

    const details = detailsModal.getComponent({ name: 'RoomDetailsComponent' });
    expect(details.exists()).toBeTruthy();
    expect(details.props('room').id).toEqual('abc-def-123');

    const badge = detailsModal.getComponent({ name: 'RoomTypeBadge' });
    expect(badge.exists()).toBeTruthy();
    expect(badge.props('roomType').id).toEqual(2);

    const favoriteButton = detailsModal.getComponent({ name: 'RoomFavoriteButton' });
    expect(favoriteButton.exists()).toBeTruthy();
    expect(favoriteButton.props('room').id).toEqual('abc-def-123');

    expect(detailsModal.findAllComponents(BButton).length).toBe(2);
    expect(detailsModal.findAllComponents(BButton).at(0).text()).toEqual('app.close');
    expect(detailsModal.findAllComponents(BButton).at(1).text()).toEqual('rooms.index.room_component.open');

    // check if modal closes when the button is clicked
    await waitModalHidden(view, async () => {
      detailsModal.findAllComponents(BButton).at(0).trigger('click');
    });
    expect(detailsModal.find('.modal').element.style.display).toEqual('none');

    // try to open modal again
    await waitModalShown(view, async () => {
      shortDescButton.trigger('click');
    });
    expect(detailsModal.find('.modal').element.style.display).toEqual('block');

    // try to open room
    await detailsModal.findAllComponents(BButton).at(1).trigger('click');

    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith('/rooms/abc-def-123');

    view.destroy();
  });

  it('test favorites', async () => {
    const view = mount(RoomCardComponent, {
      localVue,
      router: routerMock,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room,
        modalStatic: true
      },
      stubs: {
        transition: false,
        'room-favorite-button': true,
        'room-details-component': true,
        'room-type-badge': true
      },
      attachTo: createContainer()
    });

    // find room favorite component and fire event
    const roomFavoriteComponents = view.findAllComponents({ name: 'RoomFavoriteButton' });
    expect(roomFavoriteComponents.length).toBe(2);
    roomFavoriteComponents.at(0).vm.$emit('favorites-changed');

    await mockAxios.wait();
    await view.vm.$nextTick();

    // check if favorites_changed gets emitted
    expect(view.emitted('favorites-changed')).toBeTruthy();
    expect(view.emitted('favorites-changed').length).toBe(1);

    // fire event from second room favorite component
    roomFavoriteComponents.at(1).vm.$emit('favorites-changed');

    await mockAxios.wait();
    await view.vm.$nextTick();

    // check if favorites_changed gets emitted
    expect(view.emitted('favorites-changed')).toBeTruthy();
    expect(view.emitted('favorites-changed').length).toBe(2);

    view.destroy();
  });
});
