import { mount } from '@vue/test-utils';
import VueRouter from 'vue-router';
import { mockAxios, createContainer, createLocalVue } from '../../helper';
import { expect } from 'vitest';
import { BDropdownItemButton } from 'bootstrap-vue';
import RoomFavoriteDropdownButton from '@/components/Room/RoomFavoriteDropdownButton.vue';
import Base from '@/api/base';

const localVue = createLocalVue();
localVue.use(VueRouter);

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

describe('Room Favorite Dropdown Button', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it('test toggle favorites', async () => {
    const view = mount(RoomFavoriteDropdownButton, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room
      },
      stubs: {
        transition: false
      },
      attachTo: createContainer()
    });

    // check if button is shown
    const favoritesButton = view.findComponent(BDropdownItemButton).find('button');
    expect(favoritesButton.text()).toContain('rooms.favorites.add');

    let favoritesRequest = mockAxios.request('api/v1/rooms/abc-def-123/favorites');

    // trigger favorites button
    await favoritesButton.trigger('click');
    await favoritesRequest.wait();
    expect(favoritesRequest.config.method).toEqual('post');

    await favoritesRequest.respondWith({
      status: 204
    });
    await mockAxios.wait();
    await view.vm.$nextTick();

    // check if favorites_changed gets emitted
    expect(view.emitted('favorites-changed')).toBeTruthy();

    const favoriteRoom = { ...room, is_favorite: true };
    await view.setProps({ room: favoriteRoom });

    await view.vm.$nextTick();

    // check if button changed
    expect(favoritesButton.text()).toContain('rooms.favorites.remove');

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
    expect(view.emitted('favorites-changed')).toBeTruthy();
    const notFavoriteRoom = { ...room, is_favorite: false };
    await view.setProps({ room: notFavoriteRoom });
    await view.vm.$nextTick();
    expect(favoritesButton.text()).toContain('rooms.favorites.add');

    view.destroy();
  });

  it('test add favorite error', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const view = mount(RoomFavoriteDropdownButton, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room
      },
      stubs: {
        transition: false
      },
      attachTo: createContainer()
    });

    // find favorites button
    const favoritesButton = view.findComponent(BDropdownItemButton).find('button');

    const favoritesRequest = mockAxios.request('api/v1/rooms/abc-def-123/favorites');

    // trigger favorites button
    await favoritesButton.trigger('click');
    await favoritesRequest.wait();
    expect(favoritesRequest.config.method).toEqual('post');

    await favoritesRequest.respondWith({
      status: 500
    });
    // check if favorites_changed gets emitted
    expect(spy).toBeCalledTimes(1);
    expect(view.emitted('favorites-changed')).toBeTruthy();

    view.destroy();
  });

  it('test delete favorite error', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const view = mount(RoomFavoriteDropdownButton, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        room: { ...room, is_favorite: true }
      },
      stubs: {
        transition: false
      },
      attachTo: createContainer()
    });

    // find favorites button
    const favoritesButton = view.findComponent(BDropdownItemButton).find('button');

    const favoritesRequest = mockAxios.request('api/v1/rooms/abc-def-123/favorites');

    // trigger favorites button
    await favoritesButton.trigger('click');
    await favoritesRequest.wait();
    expect(favoritesRequest.config.method).toEqual('delete');

    await favoritesRequest.respondWith({
      status: 500
    });
    // check if favorites_changed gets emitted
    expect(spy).toBeCalledTimes(1);
    expect(view.emitted('favorites-changed')).toBeTruthy();

    view.destroy();
  });
});
