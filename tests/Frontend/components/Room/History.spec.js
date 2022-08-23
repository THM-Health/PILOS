import { createLocalVue, mount } from '@vue/test-utils';
import BootstrapVue, {
  BButton,
  BTbody
} from 'bootstrap-vue';
import moxios from 'moxios';
import HistoryComponent from '../../../../resources/js/components/Room/HistoryComponent.vue';
import Clipboard from 'v-clipboard';
import Vuex from 'vuex';
import Base from '../../../../resources/js/api/base';
import { waitModalShown, waitMoxios, createContainer } from '../../helper';

const localVue = createLocalVue();

const i18nDateMock = (date, format) => {
  return new Date(date).toLocaleString('en-US', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
};

localVue.use(BootstrapVue);
localVue.use(Clipboard);
localVue.use(Vuex);

const exampleUser = { id: 1, firstname: 'John', lastname: 'Doe', locale: 'de', permissions: ['rooms.create'], model_name: 'User', room_limit: -1 };
const exampleRoom = { id: '123-456-789', name: 'Meeting One', owner: { id: 2, name: 'Max Doe' }, type: { id: 2, short: 'ME', description: 'Meeting', color: '#4a5c66', default: false }, model_name: 'Room', authenticated: true, allow_membership: false, is_member: false, is_co_owner: false, is_moderator: false, can_start: false, running: false };

const store = new Vuex.Store({
  modules: {
    session: {
      namespaced: true,
      actions: {
        getCurrentUser () {}
      },
      state: {
        currentUser: exampleUser
      },
      getters: {
        isAuthenticated: () => true,
        settings: () => (setting) => setting === 'attendance.enabled' ? true : setting === 'statistics.meetings.enabled' ? true : null
      }
    }
  },
  state: {
    loadingCounter: 0
  }
});

describe('History', () => {
  beforeEach(() => {
    moxios.install();
  });
  afterEach(() => {
    moxios.uninstall();
  });

  it('load meetings', async () => {
    const store = new Vuex.Store({
      modules: {
        session: {
          namespaced: true,
          actions: {
            getCurrentUser () {}
          },
          state: {
            currentUser: exampleUser
          },
          getters: {
            isAuthenticated: () => true,
            settings: () => (setting) => setting === 'attendance.enabled' ? false : setting === 'statistics.meetings.enabled' ? false : null
          }
        }
      },
      state: {
        loadingCounter: 0
      }
    });

    const view = mount(HistoryComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: i18nDateMock
      },
      propsData: {
        room: exampleRoom
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    let request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/meetings?page=1');
    await request.respondWith({
      status: 200,
      response: {
        data: [
          { id: '6091532e-57c7-4a88-9b00-2bebfb969002', start: '2021-06-22T11:05:39.000000Z', end: null, attendance: true, statistical: false },
          { id: '2ba7ba60-91d7-49f5-b1bb-5353b9415406', start: '2021-06-22T10:04:50.000000Z', end: '2021-06-22T10:06:16.000000Z', attendance: false, statistical: false },
          { id: 'bb861dda-225c-4243-a04a-d446f4497139', start: '2021-06-22T09:45:21.000000Z', end: '2021-06-22T09:46:47.000000Z', attendance: true, statistical: false },
          { id: '10b23d8a-9dc1-4377-a26f-bdc990cd2f36', start: '2021-06-22T08:51:10.000000Z', end: '2021-06-22T08:51:20.000000Z', attendance: false, statistical: true }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          per_page: 10,
          to: 4,
          total: 4
        }
      }
    });
    await view.vm.$nextTick();

    let table = view.findComponent(BTbody);
    let rows = table.findAll('tr').wrappers.map(row => row.findAll('td'));

    expect(rows[0].at(0).text()).toBe('06/22/2021, 13:05');
    expect(rows[0].at(1).text()).toBe('meetings.now');
    expect(rows[0].length).toBe(2);

    expect(rows[1].at(0).text()).toBe('06/22/2021, 12:04');
    expect(rows[1].at(1).text()).toBe('06/22/2021, 12:06');
    expect(rows[1].length).toBe(2);

    expect(rows[2].at(0).text()).toBe('06/22/2021, 11:45');
    expect(rows[2].at(1).text()).toBe('06/22/2021, 11:46');
    expect(rows[2].length).toBe(2);

    expect(rows[3].at(0).text()).toBe('06/22/2021, 10:51');
    expect(rows[3].at(1).text()).toBe('06/22/2021, 10:51');
    expect(rows[3].length).toBe(2);

    expect(view.find('#retentionPeriodInfo').exists()).toBeFalsy();

    const reloadButton = view.findComponent(BButton);
    expect(reloadButton.html()).toContain('fa-solid fa-sync');
    await reloadButton.trigger('click');

    await waitMoxios();
    await view.vm.$nextTick();
    request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/meetings?page=1');
    await request.respondWith({
      status: 200,
      response: {
        data: [],
        meta: {
          current_page: 1,
          from: null,
          last_page: 1,
          per_page: 10,
          to: null,
          total: 0
        }
      }
    });

    await view.vm.$nextTick();

    table = view.findComponent(BTbody);
    rows = table.findAll('tr');
    expect(rows.length).toBe(1);
    expect(rows.at(0).text()).toContain('meetings.noHistoricalData');

    view.destroy();
  });

  it('meetings table with action buttons', async () => {
    const view = mount(HistoryComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: i18nDateMock
      },
      propsData: {
        room: exampleRoom
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    const request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/meetings?page=1');
    await request.respondWith({
      status: 200,
      response: {
        data: [
          { id: '6091532e-57c7-4a88-9b00-2bebfb969002', start: '2021-06-22T11:05:39.000000Z', end: null, attendance: true, statistical: false },
          { id: '2ba7ba60-91d7-49f5-b1bb-5353b9415406', start: '2021-06-22T10:04:50.000000Z', end: '2021-06-22T10:06:16.000000Z', attendance: false, statistical: false },
          { id: 'bb861dda-225c-4243-a04a-d446f4497139', start: '2021-06-22T09:45:21.000000Z', end: '2021-06-22T09:46:47.000000Z', attendance: true, statistical: false },
          { id: '10b23d8a-9dc1-4377-a26f-bdc990cd2f36', start: '2021-06-22T08:51:10.000000Z', end: '2021-06-22T08:51:20.000000Z', attendance: false, statistical: true },
          { id: '10b23d8a-9dc1-4377-a26f-bdc990cd2f36', start: '2021-06-22T08:49:10.000000Z', end: '2021-06-22T08:50:20.000000Z', attendance: true, statistical: true }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          per_page: 10,
          to: 4,
          total: 4
        }
      }
    });

    await view.vm.$nextTick();

    const table = view.findComponent(BTbody);

    const rows = table.findAll('tr').wrappers.map(row => row.findAll('td'));

    expect(rows[0].at(0).text()).toBe('06/22/2021, 13:05');
    expect(rows[0].at(1).text()).toBe('meetings.now');
    const buttonsRow0 = rows[0].at(2).findAll('button');
    expect(buttonsRow0.length).toBe(0);
    expect(rows[0].length).toBe(3);

    expect(rows[1].at(0).text()).toBe('06/22/2021, 12:04');
    expect(rows[1].at(1).text()).toBe('06/22/2021, 12:06');
    const buttonsRow1 = rows[1].at(2).findAll('button');
    expect(buttonsRow1.length).toBe(0);
    expect(rows[1].length).toBe(3);

    expect(rows[2].at(0).text()).toBe('06/22/2021, 11:45');
    expect(rows[2].at(1).text()).toBe('06/22/2021, 11:46');
    const buttonsRow2 = rows[2].at(2).findAll('button');
    expect(buttonsRow2.length).toBe(1);
    expect(buttonsRow2.at(0).html()).toContain('fa-solid fa-user-clock');
    expect(rows[2].length).toBe(3);

    expect(rows[3].at(0).text()).toBe('06/22/2021, 10:51');
    expect(rows[3].at(1).text()).toBe('06/22/2021, 10:51');
    const buttonsRow3 = rows[3].at(2).findAll('button');
    expect(buttonsRow3.length).toBe(1);
    expect(buttonsRow3.at(0).html()).toContain('fa-solid fa-chart-line');
    expect(rows[3].length).toBe(3);

    expect(rows[4].at(0).text()).toBe('06/22/2021, 10:49');
    expect(rows[4].at(1).text()).toBe('06/22/2021, 10:50');
    const buttonsRow4 = rows[4].at(2).findAll('button');
    expect(buttonsRow4.length).toBe(2);
    expect(buttonsRow4.at(0).html()).toContain('fa-solid fa-chart-line');
    expect(buttonsRow4.at(1).html()).toContain('fa-solid fa-user-clock');
    expect(rows[4].length).toBe(3);

    const retentionPeriodInfo = view.find('#retentionPeriodInfo');
    expect(retentionPeriodInfo.exists()).toBeTruthy();
    expect(retentionPeriodInfo.text()).toContain('meetings.stats.retentionPeriod');
    expect(retentionPeriodInfo.text()).toContain('meetings.attendance.retentionPeriod');

    view.destroy();
  });

  it('meetings table loading error', async () => {
    const spy = jest.spyOn(Base, 'error').mockImplementation();

    const view = mount(HistoryComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: i18nDateMock
      },
      propsData: {
        room: exampleRoom
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    let request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/meetings?page=1');
    await request.respondWith({
      status: 500,
      response: {
        message: 'Internal server error'
      }
    });

    await view.vm.$nextTick();
    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0][0].response.status).toEqual(500);

    expect(view.findComponent(BTbody).findAll('tr').length).toBe(0);

    const reloadButton = view.findAllComponents(BButton).at(1);
    expect(reloadButton.text()).toBe('app.reload');
    await reloadButton.trigger('click');

    await waitMoxios();
    await view.vm.$nextTick();
    request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/meetings?page=1');
    await request.respondWith({
      status: 200,
      response: {
        data: [
          { id: '6091532e-57c7-4a88-9b00-2bebfb969002', start: '2021-06-22T11:05:39.000000Z', end: null, attendance: true, statistical: false },
          { id: '2ba7ba60-91d7-49f5-b1bb-5353b9415406', start: '2021-06-22T10:04:50.000000Z', end: '2021-06-22T10:06:16.000000Z', attendance: false, statistical: false },
          { id: 'bb861dda-225c-4243-a04a-d446f4497139', start: '2021-06-22T09:45:21.000000Z', end: '2021-06-22T09:46:47.000000Z', attendance: true, statistical: false },
          { id: '10b23d8a-9dc1-4377-a26f-bdc990cd2f36', start: '2021-06-22T08:51:10.000000Z', end: '2021-06-22T08:51:20.000000Z', attendance: false, statistical: true }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          per_page: 10,
          to: 4,
          total: 4
        }
      }
    });

    await view.vm.$nextTick();

    expect(view.findComponent(BTbody).findAll('tr').length).toBe(4);

    view.destroy();
  });

  it('loading stats', async () => {
    const view = mount(HistoryComponent, {
      localVue,
      mocks: {
        $t: (key) => key,
        $d: i18nDateMock
      },
      propsData: {
        room: exampleRoom,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    let request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/meetings?page=1');
    await request.respondWith({
      status: 200,
      response: {
        data: [
          { id: '10b23d8a-9dc1-4377-a26f-bdc990cd2f36', start: '2021-06-22T08:49:10.000000Z', end: '2021-06-22T08:50:20.000000Z', attendance: true, statistical: true }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          per_page: 10,
          to: 1,
          total: 1
        }
      }
    });

    await view.vm.$nextTick();

    const table = view.findComponent(BTbody);

    const rows = table.findAll('tr').wrappers.map(row => row.findAll('td'));

    expect(rows[0].at(0).text()).toBe('06/22/2021, 10:49');
    expect(rows[0].at(1).text()).toBe('06/22/2021, 10:50');
    const buttonsRow = rows[0].at(2).findAll('button');
    expect(buttonsRow.length).toBe(2);
    expect(buttonsRow.at(0).html()).toContain('fa-solid fa-chart-line');

    expect(view.find('#statsModal').find('.modal').element.style.display).toEqual('none');

    await buttonsRow.at(0).trigger('click');

    await waitMoxios();

    request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/meetings/10b23d8a-9dc1-4377-a26f-bdc990cd2f36/stats');

    await waitModalShown(view, async () => {
      await request.respondWith({
        status: 200,
        response: {
          data: [
            {
              id: 8,
              participant_count: 5,
              listener_count: 3,
              voice_participant_count: 4,
              video_count: 1,
              created_at: '2021-06-18T07:13:49.000000Z'
            },
            {
              id: 9,
              participant_count: 6,
              listener_count: 4,
              voice_participant_count: 5,
              video_count: 2,
              created_at: '2021-06-18T07:14:51.000000Z'
            }
          ]
        }
      });
    });
    await view.vm.$nextTick();

    expect(view.vm.$data.chartDataRows).toMatchObject({
      participants: [{ x: '2021-06-18T07:13:49.000000Z', y: 5 }, { x: '2021-06-18T07:14:51.000000Z', y: 6 }],
      voices: [{ x: '2021-06-18T07:13:49.000000Z', y: 4 }, { x: '2021-06-18T07:14:51.000000Z', y: 5 }],
      videos: [{ x: '2021-06-18T07:13:49.000000Z', y: 1 }, { x: '2021-06-18T07:14:51.000000Z', y: 2 }]
    });

    const chartOptions = view.vm.chartOptions;

    const ticksCallback = chartOptions.scales.xAxes[0].ticks.callback('10:35 am', 0, [{ value: 1623746102000, major: false }]);
    const tooltipTitleCallback = chartOptions.tooltips.callbacks.title([{ xLabel: '2021-06-15T08:35:02.000000Z', yLabel: 0, label: '2021-06-15T08:35:02.000000Z', value: '0', index: 1, datasetIndex: 1, x: 1103, y: 638.44 }, { xLabel: '2021-06-15T08:35:02.000000Z', yLabel: 0, label: '2021-06-15T08:35:02.000000Z', value: '0', index: 1, datasetIndex: 2, x: 1103, y: 638.44 }]);

    expect(ticksCallback).toBe('06/15/2021, 10:35');
    expect(tooltipTitleCallback).toBe('06/15/2021, 10:35');

    view.destroy();
  });

  it('loading attendance', async () => {
    const view = mount(HistoryComponent, {
      localVue,
      mocks: {
        $t: (key, values) => key + (values !== undefined ? ':' + JSON.stringify(values) : ''),
        $d: i18nDateMock
      },
      propsData: {
        room: exampleRoom,
        modalStatic: true
      },
      stubs: {
        transition: false
      },
      store,
      attachTo: createContainer()
    });

    await waitMoxios();
    await view.vm.$nextTick();
    let request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/rooms/123-456-789/meetings?page=1');
    await request.respondWith({
      status: 200,
      response: {
        data: [
          { id: '10b23d8a-9dc1-4377-a26f-bdc990cd2f36', start: '2021-06-22T08:49:10.000000Z', end: '2021-06-22T08:50:20.000000Z', attendance: true, statistical: true }
        ],
        meta: {
          current_page: 1,
          from: 1,
          last_page: 1,
          per_page: 10,
          to: 1,
          total: 1
        }
      }
    });
    await view.vm.$nextTick();
    let table = view.findComponent(BTbody);

    let rows = table.findAll('tr').wrappers.map(row => row.findAll('td'));

    expect(rows[0].at(0).text()).toBe('06/22/2021, 10:49');
    expect(rows[0].at(1).text()).toBe('06/22/2021, 10:50');
    const buttonsRow = rows[0].at(2).findAll('button');
    expect(buttonsRow.length).toBe(2);
    expect(buttonsRow.at(1).html()).toContain('fa-solid fa-user-clock');

    expect(view.find('#attendanceModal').find('.modal').element.style.display).toEqual('none');

    await buttonsRow.at(1).trigger('click');

    await waitMoxios();

    request = moxios.requests.mostRecent();
    expect(request.url).toEqual('/api/v1/meetings/10b23d8a-9dc1-4377-a26f-bdc990cd2f36/attendance');

    await waitModalShown(view, async () => {
      await request.respondWith({
        status: 200,
        response: {
          data: [
            {
              name: 'John Doe',
              email: null,
              duration: 4,
              sessions: [
                { id: 7, join: '2021-06-18T07:41:03.000000Z', leave: '2021-06-18T07:45:32.000000Z', duration: 4 }]
            },
            {
              name: 'Claus Doe',
              email: 'claus.doe@demo.tld',
              duration: 33,
              sessions: [
                { id: 4, join: '2021-06-18T07:13:49.000000Z', leave: '2021-06-18T07:42:08.000000Z', duration: 28 },
                { id: 5, join: '2021-06-18T07:44:12.000000Z', leave: '2021-06-18T07:49:54.000000Z', duration: 5 }]
            }]
        }
      });
    });
    await view.vm.$nextTick();

    table = view.find('#attendance-table');
    const tbody = table.find('tbody');
    rows = tbody.findAll('tr').wrappers.map((row) => row.findAll('td'));

    expect(rows[0].at(0).text()).toBe('Claus Doe');
    expect(rows[0].at(1).text()).toBe('claus.doe@demo.tld');
    expect(rows[0].at(2).text()).toBe('meetings.attendance.durationMinute:{"duration":33}');
    expect(rows[0].at(3).text()).toContain('06/18/2021, 09:13 - 06/18/2021, 09:42 (meetings.attendance.durationMinute:{"duration":28})');
    expect(rows[0].at(3).text()).toContain('06/18/2021, 09:44 - 06/18/2021, 09:49 (meetings.attendance.durationMinute:{"duration":5})');

    expect(rows[1].at(0).text()).toBe('John Doe');
    expect(rows[1].at(1).text()).toBe('---');
    expect(rows[1].at(2).text()).toBe('meetings.attendance.durationMinute:{"duration":4}');
    expect(rows[1].at(3).text()).toContain('06/18/2021, 09:41 - 06/18/2021, 09:45 (meetings.attendance.durationMinute:{"duration":4})');

    const downloadButton = view.find('#attendanceModal').find('a');
    expect(downloadButton.text()).toBe('meetings.attendance.download');
    expect(downloadButton.attributes('href')).toBe('/download/attendance/10b23d8a-9dc1-4377-a26f-bdc990cd2f36');
    expect(downloadButton.attributes('target')).toBe('_blank');

    view.destroy();
  });
});
