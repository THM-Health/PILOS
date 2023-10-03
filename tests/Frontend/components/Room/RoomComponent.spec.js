import { mount } from '@vue/test-utils';
import VueRouter from 'vue-router';
import _ from 'lodash';
import PermissionService from '../../../../resources/js/services/PermissionService';
import { mockAxios, createContainer, createLocalVue, waitModalShown, waitModalHidden } from '../../helper';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import RoomComponent from '../../../../resources/js/components/Room/RoomComponent.vue';
import { expect } from 'vitest';
import { BBadge, BButton, BCard } from 'bootstrap-vue';

const localVue = createLocalVue();
localVue.use(VueRouter);
localVue.use(PiniaVuePlugin);

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], model_name: 'User', room_limit: -1 };
const initialState = { auth: { currentUser: exampleUser } };

describe('Room Component', () => {
  beforeEach(() => {
    mockAxios.reset();
    PermissionService.currentUser = exampleUser;
  });


  it('click on room in list', async () => {
    const router = new VueRouter();
    const routerSpy = vi.spyOn(router, 'push').mockImplementation(() => Promise.resolve());
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
    const view = mount(RoomComponent, {
      localVue,
      router,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: exampleRoomListEntry.id,
        name: exampleRoomListEntry.name,
        shortDescription: exampleRoomListEntry.short_description,
        isFavorite: exampleRoomListEntry.is_favorite,
        owner: exampleRoomListEntry.owner,
        type: exampleRoomListEntry.type
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    // try to open room
    await view.findComponent(BCard).trigger('click');

    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'rooms.view', params: { id: exampleRoomListEntry.id } });

    // ToDo? check if opening another is prohibited while the other room is opening
    view.destroy();
  });

  it('test short description', async () => {
    const router = new VueRouter();
    const routerSpy = vi.spyOn(router, 'push').mockImplementation(() => Promise.resolve());
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
      short_description: 'short description for room'
    };
    const view = mount(RoomComponent, {
      localVue,
      router,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: exampleRoomListEntry.id,
        name: exampleRoomListEntry.name,
        shortDescription: exampleRoomListEntry.short_description,
        isFavorite: exampleRoomListEntry.is_favorite,
        owner: exampleRoomListEntry.owner,
        type: exampleRoomListEntry.type,
        meeting: exampleRoomListEntry.last_meeting,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    // check if button is shown
    expect(view.findAllComponents(BButton).length).toBe(5);
    const shortDescButton = view.findAllComponents(BButton).at(0);
    expect(shortDescButton.html()).toContain('fa-info');

    // check if modal exists and is closed
    const shortDescModal = view.findComponent({ ref: 'short-description-modal' });
    expect(shortDescModal.exists()).toBeTruthy();
    expect(shortDescModal.find('.modal').element.style.display).toEqual('none');

    // try to open modal
    await waitModalShown(view, async () => {
      shortDescButton.trigger('click');
    });

    // check if modal is open
    expect(shortDescModal.find('.modal').element.style.display).toEqual('block');

    // check if modal shows correct
    expect(shortDescModal.findAll('h5').at(0).text()).toEqual('rooms.index.room_component.details');
    expect(shortDescModal.findAll('h5').at(1).text()).toEqual(exampleRoomListEntry.name);
    expect(shortDescModal.get(BBadge).text()).toEqual(exampleRoomListEntry.type.description);
    expect(shortDescModal.get('p').text()).toEqual(exampleRoomListEntry.short_description);
    expect(shortDescModal.findAllComponents(BButton).length).toBe(3);
    expect(shortDescModal.findAllComponents(BButton).at(0).html()).toContain('fa-star');
    expect(shortDescModal.findAllComponents(BButton).at(0).attributes().class).toContain('light');
    expect(shortDescModal.findAllComponents(BButton).at(1).text()).toEqual('app.close');
    expect(shortDescModal.findAllComponents(BButton).at(2).text()).toEqual('rooms.index.room_component.open');

    // check if modal closes when the button is clicked
    await waitModalHidden(view, async () => {
      shortDescModal.findAllComponents(BButton).at(1).trigger('click');
    });
    expect(shortDescModal.find('.modal').element.style.display).toEqual('none');

    // try to open modal again
    await waitModalShown(view, async () => {
      shortDescButton.trigger('click');
    });
    expect(shortDescModal.find('.modal').element.style.display).toEqual('block');

    // try to open room
    await shortDescModal.findAllComponents(BButton).at(2).trigger('click');

    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'rooms.view', params: { id: exampleRoomListEntry.id } });

    view.destroy();
  });

  it('test favorites', async () => {
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
    const view = mount(RoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: exampleRoomListEntry.id,
        name: exampleRoomListEntry.name,
        shortDescription: exampleRoomListEntry.short_description,
        isFavorite: exampleRoomListEntry.is_favorite,
        owner: exampleRoomListEntry.owner,
        type: exampleRoomListEntry.type,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    // check if button is shown
    expect(view.findAllComponents(BButton).length).toBe(5);
    let favoritesButton = view.findAllComponents(BButton).at(1);
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

    view.setProps({isFavorite: true});

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
    view.setProps({isFavorite: false});
    await view.vm.$nextTick();

    // check if button to open short description modal is shown
    const shortDescButton = view.findAllComponents(BButton).at(0);
    expect(shortDescButton.html()).toContain('fa-info');

    // check if short description modal exists and is closed
    const shortDescModal = view.findComponent({ ref: 'short-description-modal' });
    expect(shortDescModal.exists()).toBeTruthy();
    expect(shortDescModal.find('.modal').element.style.display).toEqual('none');

    // try to open short description modal
    await waitModalShown(view, async () => {
      shortDescButton.trigger('click');
    });

    // check if short description modal is open
    expect(shortDescModal.find('.modal').element.style.display).toEqual('block');

    // find favorites button and if it is shown correct
    favoritesButton = shortDescModal.findAllComponents(BButton).at(0);
    expect(favoritesButton.html()).toContain('fa-star');
    expect(favoritesButton.attributes().class).toContain('light');

    // trigger favorites button
    favoritesRequest = mockAxios.request('api/v1/rooms/abc-def-123/favorites');
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

    view.setProps({isFavorite: true});

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

    view.destroy();
  });
});
