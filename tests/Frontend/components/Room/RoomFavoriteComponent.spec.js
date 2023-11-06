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
import Base from '../../../../resources/js/api/base';

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
    const view = mount(RoomFavoriteComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: 'abc-def-123',
        isFavorite: false
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
    expect(favoritesButton.attributes().class).toContain('secondary');

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
    expect(view.emitted().favorites_changed).toBeTruthy();

    view.setProps({ isFavorite: true });

    await view.vm.$nextTick();

    // check if button changed
    expect(favoritesButton.attributes().class).toContain('primary');

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
    expect(favoritesButton.attributes().class).toContain('secondary');

    view.destroy();
  });

  it('test add favorite error', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const view = mount(RoomFavoriteComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: 'abc-def-123',
        isFavorite: false
      },
      stubs: {
        transition: false
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    // find favorites button
    const favoritesButton = view.findComponent(BButton);

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
    expect(view.emitted().favorites_changed).toBeTruthy();

    view.destroy();
  });

  it('test delete favorite error', async () => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    const view = mount(RoomFavoriteComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: 'abc-def-123',
        isFavorite: true
      },
      stubs: {
        transition: false
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    // find favorites button
    const favoritesButton = view.findComponent(BButton);

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
    expect(view.emitted().favorites_changed).toBeTruthy();

    view.destroy();
  });
});
