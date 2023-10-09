import { mount } from '@vue/test-utils';
import VueRouter from 'vue-router';
import _ from 'lodash';
import PermissionService from '../../../../resources/js/services/PermissionService';
import { mockAxios, createContainer, createLocalVue } from '../../helper';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import { expect } from 'vitest';
import { BButton } from 'bootstrap-vue';
import RoomFavoriteComponent from '../../../../resources/js/components/Room/RoomFavoriteComponent.vue';

const localVue = createLocalVue();
localVue.use(VueRouter);
localVue.use(PiniaVuePlugin);

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], model_name: 'User', room_limit: -1 };
const initialState = { auth: { currentUser: exampleUser } };

describe('Room Favorite Component', () => {
  beforeEach(() => {
    mockAxios.reset();
    PermissionService.currentUser = exampleUser;
  });

  it('test toggle favorites', async () => {
    const exampleRoomListEntry = {
      id: 'abc-def-123',
      name: 'Meeting One',
      owner: {
        id: 1,
        name: 'John Doe'
      },
      last_meeting: null,
      type: {
        id: 2,
        short: 'ME',
        description: 'Meeting',
        color: '#4a5c66',
        default: false
      },
      is_favorite: false,
      short_description: 'Own room'
    };
    const view = mount(RoomFavoriteComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: exampleRoomListEntry.id,
        isFavorite: exampleRoomListEntry.is_favorite
      },
      stubs: {
        transition: false
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    // check if button is shown
    const favoritesButton = view.findComponent(BButton);
    expect(favoritesButton.html()).toContain('fa-star');
    expect(favoritesButton.attributes().class).toContain('light');

    let favoritesRequest = mockAxios.request('api/v1/rooms/abc-def-123/favorites');

    // trigger favorites button
    await favoritesButton.trigger('click');
    await favoritesRequest.wait();
    expect(favoritesRequest.config.method).toEqual('put');

    await favoritesRequest.respondWith({
      status: 204
    });
    await mockAxios.wait();
    await view.vm.$nextTick();

    // check if favorites_changed gets emitted
    expect(view.emitted().favorites_changed).toBeTruthy();

    view.setProps({ isFavorite: true });

    await view.vm.$nextTick();

    // check if button changed
    expect(favoritesButton.attributes().class).toContain('dark');

    // trigger favorites button again
    favoritesRequest = mockAxios.request('api/v1/rooms/abc-def-123/favorites');
    await favoritesButton.trigger('click');
    await favoritesRequest.wait();
    expect(favoritesRequest.config.method).toEqual('delete');

    await favoritesRequest.respondWith({
      status: 204
    });
    await mockAxios.wait();
    await view.vm.$nextTick();

    // check if favorites_changed gets emitted
    expect(view.emitted().favorites_changed).toBeTruthy();
    view.setProps({ isFavorite: false });
    await view.vm.$nextTick();
    expect(favoritesButton.attributes().class).toContain('light');

    view.destroy();
  });

  it('test size', async () => {
    const view = mount(RoomFavoriteComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: 'abc-def-123',
        isFavorite: false,
        size: 'sm'
      },
      stubs: {
        transition: false
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });
    await view.vm.$nextTick();
    // find favorites button
    const favoritesButton = view.findComponent(BButton);

    // check if class 'room-card-button' is set
    expect(favoritesButton.attributes().class).toContain('room-card-button');
    expect(favoritesButton.attributes().class).toContain('p-0');

    view.setProps({ size: 'md' });
    await view.vm.$nextTick();

    // check if class 'room-card-button' is missing
    expect(favoritesButton.attributes().class).not.toContain('room-card-button');
    expect(favoritesButton.attributes().class).not.toContain('p-0');
  });
});
