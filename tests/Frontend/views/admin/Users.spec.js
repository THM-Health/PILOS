import { createLocalVue, mount } from '@vue/test-utils';
import AdminUser from '../../../../resources/js/views/admin/Users';
import CrudModalComponent from '../../../../resources/js/components/Admin/users/CrudModalComponent';
import InviteModalComponent from '../../../../resources/js/components/Admin/users/InviteModalComponent';
import BootstrapVue, { BPagination, BTable } from 'bootstrap-vue';

const localVue = createLocalVue();
localVue.use(BootstrapVue);

describe('AdminUser', function () {
  let wrapper;

  beforeEach(function () {
    wrapper = mount(AdminUser, {
      localVue,
      attachToDocument: true,
      mocks: {
        $t: (key) => key
      }
    });
  });

  it('contains an user data table component', function () {
    const userTable = wrapper.findComponent(BTable);
    expect(userTable.exists()).toBe(true);
  });

  it('contains a pagination component for the user table', function () {
    const pagination = wrapper.findComponent(BPagination);
    expect(pagination.exists()).toBe(true);
  });

  it('contains a crud user modal component', function () {
    const crudModal = wrapper.findComponent(CrudModalComponent);
    expect(crudModal.exists()).toBe(true);
  });

  it('contains a invite user modal component', function () {
    const inviteModal = wrapper.findComponent(InviteModalComponent);
    expect(inviteModal.exists()).toBe(true);
  });
});
