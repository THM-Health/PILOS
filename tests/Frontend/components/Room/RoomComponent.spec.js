import { mount } from '@vue/test-utils';
import VueRouter from 'vue-router';
import _ from 'lodash';
import PermissionService from '../../../../resources/js/services/PermissionService';
import { mockAxios, createContainer, createLocalVue, waitModalShown, waitModalHidden, i18nDateMock } from '../../helper';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import RoomComponent from '../../../../resources/js/components/Room/RoomComponent.vue';
import { expect } from 'vitest';
import { BBadge, BButton, BCard } from 'bootstrap-vue';
import RoomFavoriteComponent from '../../../../resources/js/components/Room/RoomFavoriteComponent.vue';

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

  it('check display of last meeting', async () => {
    const view = mount(RoomComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        $d: i18nDateMock
      },
      propsData: {
        id: 'abc-def-123',
        name: 'Meeting One',
        shortDescription: null,
        isFavorite: false,
        owner: {
          id: 1,
          name: 'John Doe'
        },
        type: {
          id: 2,
          short: 'ME',
          description: 'Meeting',
          color: '#4a5c66',
          default: false
        },
        meeting: null
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    expect(view.get('h5').text()).toEqual('Meeting One');
    expect(view.get(BBadge).text()).toEqual('Meeting');
    expect(view.findAll('small').at(0).text()).toBe('John Doe');
    expect(view.findAll('small').at(1).text()).toBe('rooms.index.room_component.never_started');
    expect(view.getComponent(BCard).attributes().class).not.toContain('running');
    expect(view.findAllComponents(BButton).length).toBe(1);
    expect(view.findAllComponents(BButton).at(0).html()).toContain('fa-star');
    expect(view.findAllComponents(BButton).at(0).element.disabled).toBeFalsy();
    expect(view.findAllComponents(BButton).at(0).attributes().class).toContain('light');

    // running room
    await view.setProps({ meeting: { start: '2023-08-21 08:18:28:00', end: null } });
    await view.vm.$nextTick();

    expect(view.findAll('small').at(1).text()).toBe('rooms.index.room_component.running_since:{"date":"08/21/2023, 10:18"}');
    expect(view.getComponent(BCard).attributes().class).toContain('running');

    // ended room
    view.setProps({ meeting: { start: '2023-08-21 08:18:28:00', end: '2023-08-21 08:20:28:00' } });
    await view.vm.$nextTick();

    expect(view.findAll('small').at(1).text()).toBe('rooms.index.room_component.last_ran_till:{"date":"08/21/2023, 10:20"}');
    expect(view.getComponent(BCard).attributes().class).not.toContain('running');

    view.destroy();
  });

  it('click on room', async () => {
    const router = new VueRouter();
    const routerSpy = vi.spyOn(router, 'push').mockImplementation(() => Promise.resolve());

    const view = mount(RoomComponent, {
      localVue,
      router,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: 'abc-def-123',
        name: 'Meeting One',
        shortDescription: 'Own room',
        isFavorite: false,
        owner: {
          id: 1,
          name: 'John Doe'
        },
        type: {
          id: 2,
          short: 'ME',
          description: 'Meeting',
          color: '#4a5c66',
          default: false
        }
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    // try to open room
    await view.findComponent(BCard).trigger('click');

    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'rooms.view', params: { id: 'abc-def-123' } });

    view.destroy();
  });

  it('test short description', async () => {
    const router = new VueRouter();
    const routerSpy = vi.spyOn(router, 'push').mockImplementation(() => Promise.resolve());

    const view = mount(RoomComponent, {
      localVue,
      router,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: 'abc-def-123',
        name: 'Meeting One',
        shortDescription: 'short description for room',
        isFavorite: false,
        owner: {
          id: 1,
          name: 'John Doe'
        },
        type: {
          id: 2,
          short: 'ME',
          description: 'Meeting',
          color: '#4a5c66',
          default: false
        },
        meeting: null,
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
    expect(shortDescModal.findAll('h5').at(1).text()).toEqual('Meeting One');
    expect(shortDescModal.get(BBadge).text()).toEqual('Meeting');
    expect(shortDescModal.get('p').text()).toEqual('short description for room');
    expect(shortDescModal.findAllComponents(BButton).length).toBe(3);
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
    expect(routerSpy).toBeCalledWith({ name: 'rooms.view', params: { id: 'abc-def-123' } });

    view.destroy();
  });

  it('test favorites', async () => {
    const view = mount(RoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      propsData: {
        id: 'abc-def-123',
        name: 'Meeting One',
        shortDescription: 'Own room',
        isFavorite: false,
        owner: {
          id: 1,
          name: 'John Doe'
        },
        type: {
          id: 2,
          short: 'ME',
          description: 'Meeting',
          color: '#4a5c66',
          default: false
        },
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    // find room favorite component and fire event
    const roomFavoriteComponents = view.findAllComponents(RoomFavoriteComponent);
    expect(roomFavoriteComponents.length).toBe(2);
    roomFavoriteComponents.at(0).vm.$emit('favorites_changed');

    await mockAxios.wait();
    await view.vm.$nextTick();

    // check if favorites_changed gets emitted
    expect(view.emitted().favorites_changed).toBeTruthy();
    expect(view.emitted().favorites_changed.length).toBe(1);

    // fire event from second room favorite component
    roomFavoriteComponents.at(1).vm.$emit('favorites_changed');

    await mockAxios.wait();
    await view.vm.$nextTick();

    // check if favorites_changed gets emitted
    expect(view.emitted().favorites_changed).toBeTruthy();
    expect(view.emitted().favorites_changed.length).toBe(2);

    view.destroy();
  });
});
