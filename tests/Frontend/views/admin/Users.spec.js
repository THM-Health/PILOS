import { createLocalVue, mount } from '@vue/test-utils';
import AdminUser from '../../../../resources/js/views/settings/Users';
import CrudModalComponent from '../../../../resources/js/components/Admin/users/CrudModalComponent';
import InviteModalComponent from '../../../../resources/js/components/Admin/users/InviteModalComponent';
import BootstrapVue, { BPagination, BTable } from 'bootstrap-vue';
import moxios from 'moxios';

const localVue = createLocalVue();
localVue.use(BootstrapVue);

describe('AdminUser', function () {
  let wrapper;

  beforeEach(function () {
    const div = document.createElement('div');
    document.body.appendChild(div);

    wrapper = mount(AdminUser, {
      localVue,
      mocks: {
        $t: (key) => key
      },
      attachTo: div
    });

    moxios.install();
  });

  afterEach(function () {
    moxios.uninstall();
  });

  it('contains an user data table component', function () {
    const userTable = wrapper.findComponent(BTable);
    expect(userTable.exists()).toBe(true);
  });

  it('contains a pagination component for the user table', function () {
    const pagination = wrapper.findComponent(BPagination);
    expect(pagination.exists()).toBe(true);
  });

  it('contains a searchbar component', function () {
    const searchBar = wrapper.find('#filterInput');
    expect(searchBar.exists()).toBe(true);
  });

  it('contains a crud user modal component', function () {
    const crudModal = wrapper.findComponent(CrudModalComponent);
    expect(crudModal.exists()).toBe(true);

    const crudModalElement = wrapper.find('#crud-modal');
    expect(crudModalElement.exists()).toBe(true);
  });

  it('contains a invite user modal component', function () {
    const inviteModal = wrapper.findComponent(InviteModalComponent);
    expect(inviteModal.exists()).toBe(true);

    const inviteModalElement = wrapper.find('#invite-modal');
    expect(inviteModalElement.exists()).toBe(true);
  });

  it('getUsers method should work properly', function (done) {
    // Users data array should be empty at the beginning
    expect(wrapper.vm.users.length).toBe(0);

    // Call axios method /api/v1/users with page query parameter page equals 2
    wrapper.vm.getUsers(2);

    moxios.wait(function () {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: {
          data: [
            {
              id: 1,
              authenticator: 'ldap',
              email: 'max.muster@local.com',
              firstname: 'Max',
              guid: '524e759a-6cdf-103a-92fc-5bc96496e6ce',
              lastname: 'Mustermann',
              locale: 'de',
              username: 'mstt',
              createdAt: '2020-08-07T09:54:37.000000Z',
              updatedAt: '2020-08-14T11:48:57.000000Z'
            }],
          links: {
            first: 'http://pilos.test/api/v1/users?page=1',
            last: 'http://pilos.test/api/v1/users?page=21',
            prev: 'http://pilos.test/api/v1/users?page=1',
            next: 'http://pilos.test/api/v1/users?page=3'
          },
          meta: {
            current_page: 2,
            from: 11,
            last_page: 21,
            path: 'http://pilos.test/api/v1/users',
            per_page: '10',
            to: 20,
            total: 203
          }
        }
      }).then(function () {
        expect(wrapper.vm.users.length).toBe(1);
        expect(wrapper.vm.currentPage).toBe(2);
        expect(wrapper.vm.firstPage).toBe(1);
        expect(wrapper.vm.nextPage).toBe(3);
        expect(wrapper.vm.lastPage).toBe(21);
        expect(wrapper.vm.prevPage).toBe(1);
        expect(wrapper.vm.totalRows).toBe(203);
        done();
      });
    });
  });
});
