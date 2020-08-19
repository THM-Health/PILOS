import { createLocalVue, mount } from '@vue/test-utils';
import RoomList from '../../../resources/js/views/rooms/Index';
import BootstrapVue, { BCard } from 'bootstrap-vue';
import store from '../../../resources/js/store';
import moxios from 'moxios';
import RoomComponent from '../../../resources/js/components/Room/RoomComponent';
import sinon from 'sinon';
import VueRouter from 'vue-router';

const localVue = createLocalVue();

localVue.use(BootstrapVue);

describe('RoomList', function () {
  beforeEach(function () {
    moxios.install();
  });

  afterEach(function () {
    moxios.uninstall();
  });

  const exampleRoomListResponse = {
    myRooms: [
      {
        id: 'abc-def-123',
        name: 'Meeting One',
        owner: 'John Doe',
        type: {
          id: 2,
          short: 'ME',
          description: 'Meeting',
          color: '#4a5c66',
          default: false
        }
      }
    ],
    sharedRooms: [
      {
        id: 'def-abc-123',
        name: 'Meeting Two',
        owner: 'John Doe',
        type: {
          id: 2,
          short: 'ME',
          description: 'Meeting',
          color: '#4a5c66',
          default: false
        }
      },
      {
        id: 'def-abc-456',
        name: 'Meeting Three',
        owner: 'John Doe',
        type: {
          id: 2,
          short: 'ME',
          description: 'Meeting',
          color: '#4a5c66',
          default: false
        }
      }
    ]
  };

  it('check list of rooms', function (done) {
    moxios.stubRequest('/api/v1/rooms', {
      status: 200,
      response: { data: exampleRoomListResponse }
    });

    const view = mount(RoomList, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      store
    });

    RoomList.beforeRouteEnter.call(view.vm, undefined, undefined, async next => {
      next(view.vm);
      await view.vm.$nextTick();

      expect(view.vm.rooms).toEqual(exampleRoomListResponse);
      const rooms = view.findAllComponents(RoomComponent);
      expect(rooms.length).toBe(3);

      expect(rooms.filter(room => room.vm.shared === false).length).toBe(1);
      expect(rooms.filter(room => room.vm.shared === true).length).toBe(2);
      done();
    });
  });

  it('click on room in list', function (done) {
    const spy = sinon.spy();

    const $router = new VueRouter();
    $router.push = spy;

    const exampleRoomListEntry = {
      id: 'abc-def-123',
      name: 'Meeting One',
      owner: 'John Doe',
      type: {
        id: 2,
        short: 'ME',
        description: 'Meeting',
        color: '#4a5c66',
        default: false
      }
    };

    const view = mount(RoomComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $router
      },
      propsData: {
        id: exampleRoomListEntry.id,
        name: exampleRoomListEntry.name,
        type: exampleRoomListEntry.type
      },
      store
    });

    view.findComponent(BCard).trigger('click');

    moxios.wait(() => {
      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, { name: 'rooms.view', params: { id: exampleRoomListEntry.id } });
      done();
    });
  });
});
