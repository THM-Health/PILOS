import Index from '../../../../resources/js/views/meetings/Index';
import { createLocalVue, mount } from '@vue/test-utils';
import moxios from 'moxios';
import BootstrapVue, {
  IconsPlugin,
  BTr,
  BTbody
} from 'bootstrap-vue';
import sinon from 'sinon';
import PermissionService from "../../../../resources/js/services/PermissionService";
import VueRouter from "vue-router";
import Vuex from 'vuex';

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(IconsPlugin);
localVue.use(Vuex);
localVue.use(VueRouter);

const defaultResponse = {
  data:[
    {
        id:"34d0b4eb-0de9-4bd4-b158-a8edc0f71674",
        start:"2021-02-12 18:09:29",
        end:null,
        room:{
          id:"abc-def-123",
          owner:"John Doe",
          name:"Meeting One",
          participant_count:10,
          listener_count:5,
          voice_participant_count:5,
          video_count:3
        },
        server:{
          id:1,
          name:"Server 01"
        }
    },
    {
      id:"5866d99e-ea44-4221-afa8-54f397ab07c8",
      start:"2021-02-12 18:10:20",
      end:null,
      room:{
        id:"abc-def-345",
        owner:"Max Doe",
        name:"Meeting Two",
        participant_count:50,
        listener_count:30,
        voice_participant_count:20,
        video_count:10
      },
      server:{
        id:1,
        name:"Server 01"
      }
    }],
  meta:{
    current_page:1,
    from:1,
    last_page:1,
    per_page:10,
    to:2,
    total:2
  }

};

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};

const store = new Vuex.Store({
  modules: {
    session: {
      namespaced: true,
      getters: {
        settings: () => (setting) => setting === 'pagination_page_size' ? 15 : null
      }
    }
  }
});

let oldUser;

describe('MeetingsIndex', function () {
  beforeEach(function () {
    moxios.install();
    oldUser = PermissionService.currentUser;
  });

  afterEach(function () {
    moxios.uninstall();
    PermissionService.setCurrentUser(oldUser);
  });

  it('list of meetings with pagination gets displayed', function (done) {

    const routes = [{ path: '/rooms/:id', name: 'rooms.view'}];
    const router = new VueRouter({
      mode: 'abstract',
      routes
    });

    const view = mount(Index, {
      localVue,
      mocks: {
        $t: key => key,
        $date: date => {
          return { format: () => date}
        }
      },
      store,
      router,
      attachTo: createContainer()
    });

    moxios.wait(function () {
      expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');
      expect(view.vm.$data.isBusy).toBeTruthy();

      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: defaultResponse
      }).then( async () => {
        await view.vm.$nextTick();

        expect(view.vm.$data.isBusy).toBeFalsy();

        const rows = view.findComponent(BTbody).findAllComponents(BTr);
        const firstRowColumns = rows.at(0).findAll('td');
        expect(firstRowColumns.at(0).text()).toContain('2021-02-12 18:09:29');
        expect(firstRowColumns.at(1).text()).toContain('Meeting One');
        expect(firstRowColumns.at(2).text()).toContain('John Doe');
        expect(firstRowColumns.at(3).text()).toContain('Server 01');
        expect(firstRowColumns.at(4).text()).toContain(10);
        expect(firstRowColumns.at(5).text()).toContain(5);
        expect(firstRowColumns.at(6).text()).toContain(5);
        expect(firstRowColumns.at(7).text()).toContain(3);
        expect(firstRowColumns.at(8).find('a').exists()).toBeTruthy();

        console.log(firstRowColumns.at(8).find('a').html());

        expect(firstRowColumns.at(8).find('a').attributes('href')).toEqual("/rooms/abc-def-123");

        view.destroy();
        done();
      });
    });
  });
});
