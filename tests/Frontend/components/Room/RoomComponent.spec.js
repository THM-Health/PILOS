import { mount } from '@vue/test-utils';
import VueRouter from 'vue-router';
import _ from 'lodash';
import PermissionService from '../../../../resources/js/services/PermissionService';
import { mockAxios, createContainer, createLocalVue } from '../../helper';
import { PiniaVuePlugin } from 'pinia';
import { createTestingPinia } from '@pinia/testing';
import RoomComponent from "../../../../resources/js/components/Room/RoomComponent.vue";
import {expect} from "vitest";
import {BBadge, BButton, BCard} from "bootstrap-vue";

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
      pinia: createTestingPinia({initialState: _.cloneDeep(initialState)}),
      attachTo: createContainer()
    });

    //try to open room
    await view.findComponent(BCard).trigger('click');

    expect(routerSpy).toBeCalledTimes(1);
    expect(routerSpy).toBeCalledWith({name: 'rooms.view', params: {id: exampleRoomListEntry.id}});

    //ToDo? check if opening another is prohibited while the other room is opening
    view.destroy();
  });

});
