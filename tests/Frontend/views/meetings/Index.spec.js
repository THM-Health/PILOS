import Index from '../../../../resources/js/views/meetings/Index';
import { createLocalVue, mount } from '@vue/test-utils';
import moxios from 'moxios';
import BootstrapVue, {

  BTr,
  BTbody, BButton, BPagination, BFormInput, BOverlay, BThead, BTh
} from 'bootstrap-vue';
import PermissionService from '../../../../resources/js/services/PermissionService';
import VueRouter from 'vue-router';
import Vuex from 'vuex';
import Base from '../../../../resources/js/api/base';
import {waitMoxios} from "../../helper";

const localVue = createLocalVue();
localVue.use(BootstrapVue);
localVue.use(Vuex);
localVue.use(VueRouter);

const defaultResponse = {
  data: [
    {
      id: '34d0b4eb-0de9-4bd4-b158-a8edc0f71674',
      start: '2021-02-12T18:09:29.000000Z',
      end: null,
      room: {
        id: 'abc-def-123',
        owner: 'John Doe',
        name: 'Meeting One',
        participant_count: 10,
        listener_count: 5,
        voice_participant_count: 5,
        video_count: 3
      },
      server: {
        id: 1,
        name: 'Server 01'
      }
    },
    {
      id: '5866d99e-ea44-4221-afa8-54f397ab07c8',
      start: '2021-02-12T18:10:20.000000Z',
      end: null,
      room: {
        id: 'abc-def-345',
        owner: 'Max Doe',
        name: 'Meeting Two',
        participant_count: 50,
        listener_count: 30,
        voice_participant_count: 20,
        video_count: 10
      },
      server: {
        id: 1,
        name: 'Server 01'
      }
    }],
  meta: {
    current_page: 1,
    from: 1,
    last_page: 2,
    per_page: 2,
    to: 2,
    total: 4
  }

};

const createContainer = (tag = 'div') => {
  const container = document.createElement(tag);
  document.body.appendChild(container);
  return container;
};

function overrideStub (url, response) {
  const l = moxios.stubs.count();
  for (let i = 0; i < l; i++) {
    const stub = moxios.stubs.at(i);
    if (stub.url === url) {
      const oldResponse = stub.response;
      const restoreFunc = () => { stub.response = oldResponse; };

      stub.response = response;
      return restoreFunc;
    }
  }
}

const i18nDateMock = (date, format) => {
  return new Date(date).toLocaleString('en-US', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
};

const currentUser = {
  firstname: 'Darth',
  lastname: 'Vader',
  permissions: []
};

const store = new Vuex.Store({
  modules: {
    session: {
      namespaced: true,
      state: {
        currentUser
      },
      getters: {
        isAuthenticated: () => true,
        settings: () => (setting) => null
      }
    }
  },
  state: {
    loadingCounter: 0
  }
});

let oldUser;

describe('MeetingsIndex', () => {
  beforeEach(() => {
    moxios.install();
    oldUser = PermissionService.currentUser;
  });

  afterEach(() => {
    moxios.uninstall();
    PermissionService.setCurrentUser(oldUser);
  });

  it('list of meetings with pagination gets displayed', async () => {
    const view = mount(Index, {
      localVue,
      store,
      mocks: {
        $t: key => key,
        $d: i18nDateMock
      },
      attachTo: createContainer()
    });

    await waitMoxios(async () => {
      // test if table is busy, pagination disabled and search disabled during loading
      expect(view.findComponent(BTbody).findComponent(BTr).html()).toContain('b-table-busy-slot');
      expect(view.vm.$data.isBusy).toBeTruthy();
      const pagination = view.findComponent(BPagination);
      expect(pagination.exists()).toBeTruthy();
      expect(pagination.props('disabled')).toBeTruthy();
      expect(view.findComponent(BButton).attributes('disabled')).toBe('disabled');

      const request = moxios.requests.mostRecent();
      await request.respondWith({
        status: 200,
        response: defaultResponse
      });

      await view.vm.$nextTick();

      // test correct display of meeting info
      const rows = view.findComponent(BTbody).findAllComponents(BTr);
      const firstRowColumns = rows.at(0).findAll('td');
      expect(firstRowColumns.at(0).text()).toBe('02/12/2021, 19:09');
      expect(firstRowColumns.at(1).text()).toContain('Meeting One');
      expect(firstRowColumns.at(2).text()).toContain('John Doe');
      expect(firstRowColumns.at(3).text()).toContain('Server 01');
      expect(firstRowColumns.at(4).text()).toContain('10');
      expect(firstRowColumns.at(5).text()).toContain('5');
      expect(firstRowColumns.at(6).text()).toContain('5');
      expect(firstRowColumns.at(7).text()).toContain('3');
      expect(firstRowColumns.at(8).find('a').exists()).toBeTruthy();
      expect(rows.at(0).findComponent(BButton).exists()).toBeTruthy();
      expect(rows.at(0).findComponent(BButton).props('to')).toEqual({name: 'rooms.view', params: {id: 'abc-def-123'}});

      // check search active
      expect(view.findComponent(BButton).attributes('disabled')).toBeUndefined();

      // check is pagination is active after load finished
      expect(view.vm.$data.isBusy).toBeFalsy();
      expect(pagination.props('disabled')).toBeFalsy();
      const paginationButtons = pagination.findAll('li');
      expect(paginationButtons.at(0).find('button').exists()).toBeFalsy();
      expect(paginationButtons.at(1).find('button').exists()).toBeFalsy();
      expect(paginationButtons.at(2).find('button').exists()).toBeTruthy();
      expect(paginationButtons.at(3).find('button').exists()).toBeTruthy();
      expect(paginationButtons.at(4).find('button').exists()).toBeTruthy();
      expect(paginationButtons.at(5).find('button').exists()).toBeTruthy();

      // test pagination navigation
      await paginationButtons.at(3).find('button').trigger('click');

      await waitMoxios(async () => {
        expect(pagination.props('disabled')).toBeTruthy();

        const request = moxios.requests.mostRecent();
        expect(request.url).toEqual('/api/v1/meetings?page=2');
        await request.respondWith({
          status: 200,
          response: {
            data: [
              {
                id: '64b0f3b5-7409-4682-9d15-2cafb34eb283',
                start: '2021-02-12T18:12:05.000000Z',
                end: null,
                room: {
                  id: 'abc-def-456',
                  owner: 'John Doe',
                  name: 'Meeting Three',
                  participant_count: 30,
                  listener_count: 7,
                  voice_participant_count: 23,
                  video_count: 5
                },
                server: {
                  id: 1,
                  name: 'Server 01'
                }
              },
              {
                id: '520671dc-cde5-40d0-86c8-341446051a43',
                start: '2021-02-12T18:14:48.000000Z',
                end: null,
                room: {
                  id: 'abc-def-678',
                  owner: 'Max Doe',
                  name: 'Meeting Four',
                  participant_count: 55,
                  listener_count: 33,
                  voice_participant_count: 22,
                  video_count: 12
                },
                server: {
                  id: 1,
                  name: 'Server 01'
                }
              }],
            meta: {
              current_page: 2,
              from: 3,
              last_page: 2,
              per_page: 2,
              to: 4,
              total: 4
            }
          }
        });

        await view.vm.$nextTick();

        // show if pagination enabled the correct buttons for this new page
        expect(pagination.props('disabled')).toBeFalsy();
        const paginationButtons = pagination.findAll('li');
        expect(paginationButtons.at(0).find('button').exists()).toBeTruthy();
        expect(paginationButtons.at(1).find('button').exists()).toBeTruthy();
        expect(paginationButtons.at(2).find('button').exists()).toBeTruthy();
        expect(paginationButtons.at(3).find('button').exists()).toBeTruthy();
        expect(paginationButtons.at(4).find('button').exists()).toBeFalsy();
        expect(paginationButtons.at(5).find('button').exists()).toBeFalsy();

        // check if table content was updated
        const rows = view.findComponent(BTbody).findAllComponents(BTr);
        const firstRowColumns = rows.at(0).findAll('td');
        expect(firstRowColumns.at(0).text()).toContain('02/12/2021, 19:12');
        expect(firstRowColumns.at(1).text()).toContain('Meeting Three');
        expect(firstRowColumns.at(2).text()).toContain('John Doe');
        expect(firstRowColumns.at(3).text()).toContain('Server 01');
        expect(firstRowColumns.at(4).text()).toContain('30');
        expect(firstRowColumns.at(5).text()).toContain('7');
        expect(firstRowColumns.at(6).text()).toContain('23');
        expect(firstRowColumns.at(7).text()).toContain('5');
        expect(firstRowColumns.at(8).find('a').exists()).toBeTruthy();
        expect(rows.at(0).findComponent(BButton).exists()).toBeTruthy();
        expect(rows.at(0).findComponent(BButton).props('to')).toEqual({
          name: 'rooms.view',
          params: {id: 'abc-def-456'}
        });

        view.destroy();
      });
    });
  });

  it('errors during load', async () => {
    const spy = jest.spyOn(Base, 'error').mockImplementation();

    // respond with server error for meetings load
    moxios.stubRequest('/api/v1/meetings?page=1', {
      status: 500,
      response: {
        message: 'Test'
      }
    });

    const view = mount(Index, {
      localVue,
      store,
      mocks: {
        $t: key => key,
        $d: i18nDateMock
      },
      attachTo: createContainer()
    });

    await waitMoxios(async () => {
      await view.vm.$nextTick();

      // check buttons and input fields are disabled after an error occurred
      expect(view.findComponent(BFormInput).props('disabled')).toBeTruthy();
      expect(view.findComponent(BPagination).props('disabled')).toBeTruthy();
      expect(view.findComponent(BButton).attributes('disabled')).toBe('disabled');

      // check if error message is shown
      expect(spy).toBeCalledTimes(1);
      Base.error.restore();

      // restore valid response
      const restoreMeetingsResponse = overrideStub('/api/v1/meetings?page=1', {
        status: 200,
        response: defaultResponse
      });

      // check if reload button is shown and if a click reloads the resource
      const reloadButton = view.findComponent(BOverlay).findComponent(BButton);
      expect(reloadButton.text()).toEqual('app.reload');
      await reloadButton.trigger('click');

      await waitMoxios(async () => {
        expect(moxios.requests.mostRecent().config.url).toEqual('/api/v1/meetings');

        // check if buttons/input fields are active
        expect(view.findComponent(BFormInput).props('disabled')).toBeFalsy();
        expect(view.findComponent(BPagination).props('disabled')).toBeFalsy();
        expect(view.findComponent(BButton).attributes('disabled')).toBeUndefined();

        restoreMeetingsResponse();
        PermissionService.setCurrentUser(oldUser);
        view.destroy();
      });
    });
  });

  it('search', async () => {
    const view = mount(Index, {
      localVue,
      store,
      mocks: {
        $t: key => key,
        $d: i18nDateMock
      },
      attachTo: createContainer()
    });

    await waitMoxios(async () => {
      const request = moxios.requests.mostRecent();
      await request.respondWith({
        status: 200,
        response: defaultResponse
      });

      await view.vm.$nextTick();

      // enter new search string and click search button
      await view.findComponent(BFormInput).setValue('Meeting One');
      await view.findComponent(BFormInput).trigger('change');

      // check if new request with the search query is send
      await waitMoxios(async () => {
        expect(moxios.requests.mostRecent().config.url).toEqual('/api/v1/meetings');
        expect(moxios.requests.mostRecent().config.params).toEqual({page: 1, search: 'Meeting One'});
        await moxios.requests.mostRecent().respondWith({
          status: 200,
          response: {
            data: [
              {
                id: '34d0b4eb-0de9-4bd4-b158-a8edc0f71674',
                start: '2021-02-12T18:09:29.000000Z',
                end: null,
                room: {
                  id: 'abc-def-123',
                  owner: 'John Doe',
                  name: 'Meeting One',
                  participant_count: 10,
                  listener_count: 5,
                  voice_participant_count: 5,
                  video_count: 3
                },
                server: {
                  id: 1,
                  name: 'Server 01'
                }
              }],
            meta: {
              current_page: 1,
              from: 1,
              last_page: 1,
              per_page: 2,
              to: 1,
              total: 1
            }
          }
        });

        // check if table was updated
        const rows = view.findComponent(BTbody).findAllComponents(BTr);
        expect(rows.length).toBe(1);

        view.destroy();
      });
    });
  });

  it('sort', async () => {
    const view = mount(Index, {
      localVue,
      store,
      mocks: {
        $t: key => key,
        $d: i18nDateMock
      },
      attachTo: createContainer()
    });

    await waitMoxios(async () => {
      const request = moxios.requests.mostRecent();
      await request.respondWith({
        status: 200,
        response: defaultResponse
      });

      await view.vm.$nextTick();

      // select first table column and sort by clicking
      const heading = view.findComponent(BThead).findAllComponents(BTh);
      await heading.at(0).trigger('click');
      await view.vm.$nextTick();
      await waitMoxios(async () => {
        // check if request includes sort column and direction
        expect(moxios.requests.mostRecent().config.url).toEqual('/api/v1/meetings');
        expect(moxios.requests.mostRecent().config.params).toEqual({ page: 1, sort_by: 'start', sort_direction: 'asc' });
        await moxios.requests.mostRecent().respondWith({
          status: 200,
          response: {
            data: [
              {
                id: '5866d99e-ea44-4221-afa8-54f397ab07c8',
                start: '2021-02-12T18:10:20.000000Z',
                end: null,
                room: {
                  id: 'abc-def-345',
                  owner: 'Max Doe',
                  name: 'Meeting Two',
                  participant_count: 50,
                  listener_count: 30,
                  voice_participant_count: 20,
                  video_count: 10
                },
                server: {
                  id: 1,
                  name: 'Server 01'
                }
              },
              {
                id: '34d0b4eb-0de9-4bd4-b158-a8edc0f71674',
                start: '2021-02-12T18:09:29.000000Z',
                end: null,
                room: {
                  id: 'abc-def-123',
                  owner: 'John Doe',
                  name: 'Meeting One',
                  participant_count: 10,
                  listener_count: 5,
                  voice_participant_count: 5,
                  video_count: 3
                },
                server: {
                  id: 1,
                  name: 'Server 01'
                }
              }
            ],
            meta: {
              current_page: 1,
              from: 1,
              last_page: 2,
              per_page: 2,
              to: 2,
              total: 4
            }
          }
        });

        await view.vm.$nextTick();

        // check if table was updated
        const rows = view.findComponent(BTbody).findAllComponents(BTr);
        const firstRowColumns = rows.at(0).findAll('td');
        expect(firstRowColumns.at(0).text()).toContain('02/12/2021, 19:10');
        expect(firstRowColumns.at(1).text()).toContain('Meeting Two');
        expect(firstRowColumns.at(2).text()).toContain('Max Doe');
        expect(firstRowColumns.at(3).text()).toContain('Server 01');
        expect(firstRowColumns.at(4).text()).toContain('50');
        expect(firstRowColumns.at(5).text()).toContain('30');
        expect(firstRowColumns.at(6).text()).toContain('20');
        expect(firstRowColumns.at(7).text()).toContain('10');
        expect(firstRowColumns.at(8).find('a').exists()).toBeTruthy();
        expect(rows.at(0).findComponent(BButton).exists()).toBeTruthy();
        expect(rows.at(0).findComponent(BButton).props('to')).toEqual({ name: 'rooms.view', params: { id: 'abc-def-345' } });

        view.destroy();
      });
    });
  });
});
