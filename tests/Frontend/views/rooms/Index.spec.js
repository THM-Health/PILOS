import { mount } from '@vue/test-utils';
import RoomList from '../../../../resources/js/views/rooms/Index.vue';
import {
  BBadge,
  BButton,
  BCard,
  BCol,
  BDropdown,
  BDropdownItem,
  BFormCheckbox,
  BFormGroup,
  BFormInput,
  BFormSelect,
  BFormSelectOption,
  BInputGroupAppend,
  BListGroupItem,
  BOverlay,
  BPagination,
  BSpinner
} from 'bootstrap-vue';

import VueRouter from 'vue-router';
import _ from 'lodash';
import PermissionService from '../../../../resources/js/services/PermissionService';
import Base from '../../../../resources/js/api/base';
import { mockAxios, createContainer, createLocalVue } from '../../helper';
import RoomStatusComponent from '../../../../resources/js/components/Room/RoomStatusComponent.vue';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import RoomComponent from "../../../../resources/js/components/Room/RoomComponent.vue";
import {useAuthStore} from "../../../../resources/js/stores/auth";
import NewRoomComponent from "../../../../resources/js/components/Room/NewRoomComponent.vue";
import {expect} from "vitest";

const localVue = createLocalVue();
localVue.use(VueRouter);
localVue.use(PiniaVuePlugin);

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], model_name: 'User', room_limit: -1 };
const initialState = { auth: { currentUser: exampleUser } };

describe('Room Index', () => {
  beforeEach(() => {
    mockAxios.reset();
    PermissionService.currentUser = exampleUser;
  });

  const exampleRoomResponse = {
    data: [
      {
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
        is_favorite:false,
        short_description: 'Own room'
      },
      {
        id: 'def-abc-123',
        name: 'Meeting Two',
        owner: {
          id: 1,
          name: 'John Doe'
        },
        last_meeting:{
          start:'2023-08-21 08:18:28:00',
          end:null
        },
        type: {
          id: 2,
          short: 'ME',
          description: 'Meeting',
          color: '#4a5c66',
          default: false
        },
        is_favorite:false,
        short_description: null
      },
      {
        id: 'def-abc-456',
        name: 'Meeting Three',
        owner: {
          id: 1,
          name: 'John Doe'
        },
        last_meeting: {
          start:'2023-08-21 08:18:28:00',
          end:'2023-08-21 08:20:28:00'
        },
        type: {
          id: 2,
          short: 'ME',
          description: 'Meeting',
          color: '#4a5c66',
          default: false
        },
        is_favorite:false,
        short_description: null
      }
    ],
    meta: {
      current_page: 1,
      from: 1,
      last_page: 1,
      per_page: 10,
      to: 5,
      total: 3,
      total_no_filter: 3,
      total_own: 1
    }
  };

  const exampleRoomTypeResponse = {
    data: [
      { id: 1, short: 'VL', description: 'Vorlesung', color: '#80BA27', default: false },
      { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: true },
      { id: 3, short: 'PR', description: 'Pr\u00fcfung', color: '#9C132E', default: false },
      { id: 4, short: '\u00dcB', description: '\u00dcbung', color: '#00B8E4', default: false }
    ]
  };

  it ('check list of rooms and attribute bindings', async () =>{
    const roomRequest = mockAxios.request('/api/v1/rooms', {filter_own:1, filter_shared: 1, filter_public: 0, filter_all:0, only_favorites: 0, sort_by:'last_started'});
    const roomTypeRequest = mockAxios.request('/api/v1/roomTypes');

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    await roomRequest.wait();

    //check if overlay is active and buttons disabled during loading
    expect(view.vm.$data.loadingRooms).toBeTruthy();
    expect(view.vm.$data.roomTypesBusy).toBeTruthy();
    expect(view.getComponent(BOverlay).attributes('aria-busy')).toBeTruthy();
    expect(view.getComponent({ref:'search'}).element.disabled).toBeTruthy();
    expect(view.getComponent(BInputGroupAppend).getComponent(BButton).element.disabled).toBeTruthy();
    expect(view.getComponent(BDropdown).getComponent(BButton).element.disabled).toBeTruthy();
    expect(view.findAllComponents(BButton).at(3).element.disabled).toBeTruthy();
    expect(view.findAllComponents(BButton).at(4).element.disabled).toBeTruthy();
    expect(view.findComponent(BFormGroup).exists()).toBeFalsy();
    expect(view.findComponent(BFormSelect).exists()).toBeFalsy();

    //respond with example data to room and roomType request
    await roomRequest.respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    await roomTypeRequest.respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });
    await roomTypeRequest.wait();

    // check if overlay is disabled and buttons active
    expect(view.vm.$data.loadingRooms).toBeFalsy();
    expect(view.vm.$data.roomTypesBusy).toBeFalsy();
    expect(view.getComponent(BOverlay).attributes('aria-busy')).toBeUndefined();
    expect(view.getComponent({ref:'search'}).element.disabled).toBeFalsy();
    expect(view.getComponent(BInputGroupAppend).getComponent(BButton).element.disabled).toBeFalsy();
    expect(view.getComponent(BDropdown).getComponent(BButton).element.disabled).toBeFalsy();
    expect(view.findAllComponents(BButton).at(3).element.disabled).toBeFalsy();
    expect(view.findAllComponents(BButton).at(4).element.disabled).toBeFalsy();
    await view.findAllComponents(BButton).at(4).trigger('click');
    expect(view.findComponent(BFormGroup).exists()).toBeTruthy();
    expect(view.findComponent(BFormSelect).exists()).toBeTruthy();
    //ToDo check if filter components get disabled

    await mockAxios.wait();
    await view.vm.$nextTick();

    //Check attribute bindings
    expect(view.vm.rooms).toEqual(exampleRoomResponse);
    const rooms = view.findAllComponents(RoomComponent);
    expect(rooms.length).toEqual(3);
    expect(rooms.at(0).vm.id).toBe('abc-def-123');
    expect(rooms.at(0).vm.name).toBe('Meeting One');
    expect(rooms.at(0).vm.isFavorite).toBe(false);
    expect(rooms.at(0).vm.shortDescription).toBe('Own room');
    expect(rooms.at(0).vm.type).toEqual({ id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false });
    expect(rooms.at(0).vm.owner).toEqual({ id: 1, name: 'John Doe' });

    expect(rooms.at(1).vm.id).toBe('def-abc-123');
    expect(rooms.at(1).vm.name).toBe('Meeting Two');
    expect(rooms.at(1).vm.isFavorite).toBe(false);
    expect(rooms.at(1).vm.shortDescription).toBe(null);
    expect(rooms.at(1).vm.type).toEqual({ id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false });
    expect(rooms.at(1).vm.owner).toEqual({ id: 1, name: 'John Doe' });

    expect(rooms.at(2).vm.id).toBe('def-abc-456');
    expect(rooms.at(2).vm.name).toBe('Meeting Three');
    expect(rooms.at(2).vm.isFavorite).toBe(false);
    expect(rooms.at(2).vm.shortDescription).toBe(null);
    expect(rooms.at(2).vm.type).toEqual({ id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false });
    expect(rooms.at(2).vm.owner).toEqual({ id: 1, name: 'John Doe' });

    //check rooms appear in the list ToDo why does only one room show
    expect(rooms.at(0).get('h5').text()).toEqual('Meeting One');
    expect(rooms.at(0).get(BBadge).text()).toEqual('Meeting');
    expect(rooms.at(0).findAll('small').at(0).text()).toBe('John Doe');
    expect(rooms.at(0).findAll('small').at(1).text()).toBe('rooms.index.room_component.never_started');

    // expect(rooms.at(1).get('h5').text()).toEqual('Meeting Two');
    // expect(rooms.at(1).get(BBadge).text()).toEqual('Meeting');
    // expect(rooms.at(1).findAll('small').at(0).text()).toBe('John Doe');
    // expect(rooms.at(1).findAll('small').at(1).text()).toBe('rooms.index.room_component.running_since 2023-08-21 08:18:28:00');
    //
    // expect(rooms.at(2).get('h5').text()).toEqual('Meeting Three');
    // expect(rooms.at(2).get(BBadge).text()).toEqual('Meeting');
    // expect(rooms.at(2).findAll('small').at(0).text()).toBe('John Doe');
    // expect(rooms.at(2).findAll('small').at(1).text()).toBe('rooms.index.room_component.last_ran_till 2023-08-21 08:20:28:00');


    // //ToDo why error?
    view.destroy();
  });

  it('click on room in list', async ()=>{
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
      is_favorite:false,
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
        owner:exampleRoomListEntry.owner,
        type: exampleRoomListEntry.type
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    //try to open room
    await view.findComponent(BCard).trigger('click');

    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({ name: 'rooms.view', params: { id: exampleRoomListEntry.id } });

    //ToDo? check if opening another is prohibited while the other room is opening
    view.destroy();
  });

  it('test reload function and room limit event', async () => {
    mockAxios.request('/api/v1/rooms', {filter_own:1, filter_shared: 1, filter_public: 0, filter_all:0, only_favorites: 0, sort_by:'last_started', page:1 }).respondWith({
      status:200,
      data: exampleRoomResponse
    });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    const authStore = useAuthStore();
    authStore.currentUser.room_limit = 2;

    await mockAxios.wait();
    await view.vm.$nextTick();

    //find current amount of rooms
    let rooms = view.findAllComponents(RoomComponent);
    expect(rooms.length).toBe(3);

    //change response and fire event
    mockAxios.request('/api/v1/rooms', {filter_own:1, filter_shared: 1, filter_public: 0, filter_all:0, only_favorites: 0, sort_by:'last_started', page:1 }).respondWith({
      status: 200,
      data: {
        data: [
          {
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
          },
          {
            id: 'abc-def-345',
            name: 'Meeting Two',
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
            short_description: 'Own room 2'
          },
          {
            id: 'def-abc-123',
            name: 'Meeting Two',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: {
              start: '2023-08-21 08:18:28:00',
              end: null
            },
            type: {
              id: 2,
              short: 'ME',
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: false,
            short_description: null
          },
          {
            id: 'def-abc-456',
            name: 'Meeting Three',
            owner: {
              id: 1,
              name: 'John Doe'
            },
            last_meeting: {
              start: '2023-08-21 08:18:28:00',
              end: '2023-08-21 08:20:28:00'
            },
            type: {
              id: 2,
              short: 'ME',
              description: 'Meeting',
              color: '#4a5c66',
              default: false
            },
            is_favorite: false,
            short_description: null
          }
        ],
      meta: {
        current_page: 1,
        from: 1,
        last_page: 1,
        per_page: 10,
        to: 5,
        total: 4,
        total_no_filter: 3,
        total_own: 2
      }
    }
    });

    //find new room component and fire event
    let newRoomComponent = view.findComponent(NewRoomComponent);
    expect(newRoomComponent.exists()).toBeTruthy();
    newRoomComponent.vm.$emit('limitReached');

    await mockAxios.wait();
    await view.vm.$nextTick();

    // check if now four rooms are displayed
    rooms = view.findAllComponents(RoomComponent);
    expect(rooms.length).toBe(4);

    // try to find new room component, should be disabled as the limit is reached
    newRoomComponent = view.findComponent(NewRoomComponent);
    expect(newRoomComponent.exists()).toBeTruthy();
    expect(newRoomComponent.findComponent(BButton).element.disabled).toBeTruthy();

    //ToDo why error?
    view.destroy();

  });

  //ToDo Test with response with a room and check if the shown rooms are changed
  it('test search', async () => {
    mockAxios.request('/api/v1/rooms', {filter_own:1, filter_shared: 1, filter_public: 0, filter_all:0, only_favorites: 0, sort_by:'last_started'}).respondWith({
      status:200,
      data: exampleRoomResponse
    });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    //Find search field
    let searchField = view.findComponent({ ref: 'search' });
    expect(searchField.exists()).toBeTruthy();

    // Enter search query
    await searchField.setValue('test');

    let roomRequest = mockAxios.request('/api/v1/rooms', {filter_own:1, filter_shared: 1, filter_public: 0, filter_all:0, only_favorites: 0, sort_by:'last_started'});
    searchField.trigger('change');

    //Check for room pagination reset
    expect(view.vm.$data.rooms.meta.current_page).toBe(1);

    await roomRequest.wait();

    //Check if request uses the search string
    expect(roomRequest.config.params.search).toBe('test');

    //respond (no rooms found for this search query)
    await roomRequest.respondWith({
      status:200,
      data:{
        data:[],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 10,
          to: null,
          total: 0,
          total_no_filter: 1,
          total_own:1
        }
      }
    });

    //check if message shows user that the user has rooms, but none that match the search query
    expect(view.find('em').text()).toBe('rooms.no_rooms_available_search');

    //check empty list message for user rooms
    searchField = view.findComponent({ ref: 'search' });
    //enter another search query
    await searchField.setValue('test2');

    roomRequest = mockAxios.request('/api/v1/rooms');
    searchField.trigger('change');
    await roomRequest.wait();

    expect(roomRequest.config.params.search).toBe('test2');
    //respond (no rooms available)
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 10,
          to: null,
          total: 0,
          total_no_filter: 0,
          total_own:0
        }
      }
    });

    //check if message shows user that there are no rooms available
    expect(view.find('em').text()).toBe('rooms.no_rooms_available');

    view.destroy();
  });

  it('test sorting', async() => {
    mockAxios.request('/api/v1/rooms', {filter_own:1, filter_shared: 1, filter_public: 0, filter_all:0, only_favorites: 0, sort_by:'last_started', page:1 }).respondWith({
      status:200,
      data: exampleRoomResponse
    });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    //find dropdown to change sorting and check if the options show
    let sortingDropdown = view.findComponent(BDropdown);
    expect(sortingDropdown.getComponent(BButton).text()).toBe('rooms.index.sorting.last_started');

    // //Try to click on Dropdown to show options ToDo?
    // sortingDropdown.trigger('click');

    let sortingDropdownOptions = sortingDropdown.findAllComponents(BDropdownItem);
    expect(sortingDropdownOptions.length).toBe(4);
    expect(sortingDropdownOptions.at(0).text()).toBe('rooms.index.sorting.select_sorting');
    expect(sortingDropdownOptions.at(0).props().disabled).toBeTruthy();
    expect(sortingDropdownOptions.at(1).text()).toBe('rooms.index.sorting.last_started');
    expect(sortingDropdownOptions.at(2).text()).toBe('rooms.index.sorting.alpha');
    expect(sortingDropdownOptions.at(3).text()).toBe('rooms.index.sorting.room_type');

    //Click on Dropdown Item to change the sorting to alpha
    let roomRequest = mockAxios.request('/api/v1/rooms');
    sortingDropdownOptions.at(2).get('a').trigger('click');

    await roomRequest.wait();
    expect(roomRequest.config.params.sort_by).toBe('alpha');
    expect(sortingDropdown.getComponent(BButton).text()).toBe('rooms.index.sorting.alpha');

    //Click on Dropdown Item to change the sorting to room type
    roomRequest = mockAxios.request('/api/v1/rooms');
    sortingDropdownOptions.at(3).get('a').trigger('click');

    await roomRequest.wait();
    expect(roomRequest.config.params.sort_by).toBe('room_type');
    expect(sortingDropdown.getComponent(BButton).text()).toBe('rooms.index.sorting.room_type');

    //ToDo why error?
    view.destroy();
  });

  //ToDo rooms.viewAll permission (filter_all checkbox)
  it ('test filter', async() => {
    mockAxios.request('/api/v1/rooms', {filter_own:1, filter_shared: 1, filter_public: 0, filter_all:0, only_favorites: 0, sort_by:'last_started', page:1 }).respondWith({
      status:200,
      data: exampleRoomResponse
    });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    //Find filter button and check if it is shown correct
    let filterButton = view.findAllComponents(BButton).at(4);
    expect(filterButton.text()).toContain('rooms.index.filter');
    expect(filterButton.html()).toContain('fa-chevron-down');
    expect(filterButton.attributes().class).toContain('btn-secondary');

    //make sure that the favorites button is not disabled
    expect(view.findAllComponents(BButton).at(3).element.disabled).toBeFalsy();

    //Make sure that filter options are hidden
    expect(view.findAllComponents(BFormCheckbox).length).toBe(0);
    expect(view.findAllComponents(BFormSelect).length).toBe(0);

    //Trigger button and check if it is shown correct
    await filterButton.trigger('click');
    expect(filterButton.html()).toContain('fa-chevron-up');
    expect(filterButton.attributes().class).toContain('btn-primary');

    //make sure that the favorites button is disabled
    expect(view.findAllComponents(BButton).at(3).element.disabled).toBeTruthy();

    //Make sure that filter options are shown
    let checkboxes = view.findAllComponents(BFormCheckbox)
    expect(checkboxes.length).toBe(3);
    //Make sure that checkboxes are shown correct
    expect(checkboxes.at(0).props('checked')).toBeTruthy();
    expect(checkboxes.at(0).text()).toBe('rooms.index.show_own');
    expect(checkboxes.at(1).props('checked')).toBeTruthy();
    expect(checkboxes.at(1).text()).toBe('rooms.index.show_shared');
    expect(checkboxes.at(2).props('checked')).toBeFalsy();
    expect(checkboxes.at(2).text()).toBe('rooms.index.show_public');

    let select = view.findComponent(BFormSelect);
    expect(select.element.value).toBe('');
    let selectOptions = select.findAllComponents(BFormSelectOption);
    expect(selectOptions.length).toBe(6);
    //Make sure select options are shown correct
    expect(selectOptions.at(0).element.value).toBe('-1');
    expect(selectOptions.at(0).text()).toBe('rooms.room_types.select_type');
    expect(selectOptions.at(0).attributes().disabled).toBeTruthy();
    expect(selectOptions.at(1).element.value).toBe('');
    expect(selectOptions.at(1).text()).toBe('rooms.room_types.all');
    expect(selectOptions.at(2).element.value).toBe('1');
    expect(selectOptions.at(2).text()).toBe('Vorlesung');
    expect(selectOptions.at(3).element.value).toBe('2');
    expect(selectOptions.at(3).text()).toBe('Meeting');
    expect(selectOptions.at(4).element.value).toBe('3');
    expect(selectOptions.at(4).text()).toBe('Pr\u00fcfung');
    expect(selectOptions.at(5).element.value).toBe('4');
    expect(selectOptions.at(5).text()).toBe('\u00dcbung');

    //Trigger checkbox
    let roomRequest = mockAxios.request('/api/v1/rooms');
    checkboxes.at(2).get('input').trigger('click');
    await roomRequest.wait();
    expect(roomRequest.config.params.filter_own).toBeTruthy();
    expect(roomRequest.config.params.filter_shared).toBeTruthy();
    expect(roomRequest.config.params.filter_public).toBeTruthy();
    expect(checkboxes.at(2).props('checked')).toBeTruthy();
    await roomRequest.respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    //Trigger another checkbox
    roomRequest = mockAxios.request('/api/v1/rooms');
    checkboxes.at(1).get('input').trigger('click');
    await roomRequest.wait();
    expect(roomRequest.config.params.filter_own).toBeTruthy();
    expect(roomRequest.config.params.filter_shared).toBeFalsy();
    expect(roomRequest.config.params.filter_public).toBeTruthy();
    expect(checkboxes.at(1).props('checked')).toBeFalsy();
    await roomRequest.respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    //Change select option
    roomRequest = mockAxios.request('/api/v1/rooms');
    await select.setValue('2');
    await roomRequest.wait;

    expect(roomRequest.config.params.room_type).toBe(2);
    expect(select.element.value).toBe('2');
    await roomRequest.respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    //Trigger button and check if it is shown correct
    await filterButton.trigger('click');

    expect(filterButton.text()).toContain('rooms.index.filter');
    expect(filterButton.html()).toContain('fa-chevron-down');
    expect(filterButton.attributes().class).toContain('btn-secondary');

    //Make sure that filter options are hidden
    expect(view.findAllComponents(BFormCheckbox).length).toBe(0);
    expect(view.findAllComponents(BFormSelect).length).toBe(0);

    //make sure that the favorites button is not disabled
    expect(view.findAllComponents(BButton).at(3).element.disabled).toBeFalsy();

    //ToDo why error?
    view.destroy();
  });

  it ('test favorites', async ()=>{
    mockAxios.request('/api/v1/rooms', {filter_own:1, filter_shared: 1, filter_public: 0, filter_all:0, only_favorites: 0, sort_by:'last_started', page:1 }).respondWith({
      status:200,
      data: exampleRoomResponse
    });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    //Find favorites button and check if it is shown correct
    let favoritesButton = view.findAllComponents(BButton).at(3);
    expect(favoritesButton.html()).toContain('fa-star');
    expect(favoritesButton.element.disabled).toBeFalsy();
    //Check if filter button is not disabled
    expect(view.findAllComponents(BButton).at(4).element.disabled).toBeFalsy();

    //Trigger favorites button
    let roomRequest = mockAxios.request('/api/v1/rooms');
    favoritesButton.trigger('click');
    await roomRequest.wait();

    expect(roomRequest.config.params.only_favorites).toBeTruthy();
    //Check if filter button is disabled
    expect(view.findAllComponents(BButton).at(4).element.disabled).toBeTruthy();
    await roomRequest.respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    //Trigger favorites button again
    roomRequest = mockAxios.request('/api/v1/rooms');
    console.log(favoritesButton.html());
    favoritesButton.trigger('click');
    await roomRequest.wait();

    expect(roomRequest.config.params.only_favorites).toBeFalsy();
    await roomRequest.respondWith({
      status: 200,
      data: exampleRoomResponse
    });

    //Check if filter button is disabled
    expect(view.findAllComponents(BButton).at(4).element.disabled).toBeFalsy();

    //ToDo why error?
    view.destroy();

  });

  it ('test room limit', async () =>{
    mockAxios.request('/api/v1/rooms', {filter_own:1, filter_shared: 1, filter_public: 0, filter_all:0, only_favorites: 0, sort_by:'last_started', page:1 }).respondWith({
      status:200,
      data: exampleRoomResponse
    });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : '')
      },
      pinia: createTestingPinia({ initialState: _.cloneDeep(initialState) }),
      attachTo: createContainer()
    });

    const authStore = useAuthStore();

    await mockAxios.wait();
    await view.vm.$nextTick();

    //Hide room count for users without limit
    expect(view.findComponent({ref:'room-limit'}).exists()).toBeFalsy();

    //Show room count for users with limit
    authStore.currentUser.room_limit = 2;

    await view.vm.$nextTick();
    //check if room limit is shown correct
    expect(view.findComponent({ref:'room-limit'}).exists()).toBeTruthy();
    expect(view.findComponent({ref:'room-limit'}).text()).toBe('rooms.room_limit:{"has":1,"max":2}');

    //Enter search query
    const searchField = view.findComponent({ref:'search'});
    await searchField.setValue('test');

    const roomRequest = mockAxios.request('/api/v1/rooms', {filter_own:1, filter_shared: 1, filter_public: 0, filter_all:0, only_favorites: 0, sort_by:'last_started'});
    searchField.trigger('change');
    await roomRequest.wait();
    await roomRequest.respondWith({
      status: 200,
      data: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 10,
          to: null,
          total: 0,
          total_no_filter: 1,
          total_own:1
        }
      }
    });

    //Check if room count is not based on items on the current page or the total results,
    //but all rooms of the user, independent of the search query
    expect(view.findComponent({ref:'room-limit'}).exists()).toBeTruthy();
    expect(view.findComponent({ref:'room-limit'}).text()).toBe('rooms.room_limit:{"has":1,"max":2}');

    view.destroy();

  });

  //ToDo
  it ('error loading rooms', async() => {
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    // respond with server error for room load
    mockAxios.request('/api/v1/rooms', {filter_own:1, filter_shared: 1, filter_public: 0, filter_all:0, only_favorites: 0, sort_by:'last_started', page:1 }).respondWith({
      status:500,
      data: {
        message:'Test'
      }
    });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 200,
      data: exampleRoomTypeResponse
    });

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // check if error message is shown
    expect(spy).toBeCalledTimes(1);
    view.destroy();

  });

  //ToDo
  it ('error loading room types', async () =>{
    const spy = vi.spyOn(Base, 'error').mockImplementation(() => {});

    // respond with server error for room type load
    mockAxios.request('/api/v1/rooms', {filter_own:1, filter_shared: 1, filter_public: 0, filter_all:0, only_favorites: 0, sort_by:'last_started', page:1 }).respondWith({
      status:200,
      data: exampleRoomResponse
    });

    mockAxios.request('/api/v1/roomTypes').respondWith({
      status: 500,
      data: {
        message: 'Test'
      }
    });

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      pinia: createTestingPinia(),
      attachTo: createContainer()
    });

    await mockAxios.wait();
    await view.vm.$nextTick();

    // check if error message is shown
    expect(spy).toBeCalledTimes(1);

    view.destroy();

  });

  it('sends request to list all rooms if user has rooms.viewAll permission', async () => {

  });

  it('sends request to list all rooms if user has not rooms.viewAll permission', async () => {

  });

});
