import ActionsColumn from '../../../resources/js/mixins/ActionsColumn';
import { mount } from '@vue/test-utils';
import PermissionService from '../../../resources/js/services/PermissionService';
import Vue from 'vue';

describe('ActionsColumn', function () {
  it('show and hides the actions column depending on the users `actionsPermissions`', async function () {
    const oldUser = PermissionService.currentUser;

    const Test = {
      mixins: [ActionsColumn],
      render () {},
      data () {
        return {
          tableFields: [],
          actionPermissions: ['users.delete', 'users.update']
        };
      }
    };

    const view = mount(Test, {
      mocks: {
        $t: key => key
      }
    });

    expect(view.vm.tableFields).toEqual([]);

    PermissionService.setCurrentUser({ permissions: ['users.delete'] });
    await Vue.nextTick();

    expect(view.vm.tableFields).toEqual([{ key: 'actions', label: 'app.actions' }]);
    PermissionService.setCurrentUser({ permissions: ['users.delete'] });
    await Vue.nextTick();

    expect(view.vm.tableFields).toEqual([{ key: 'actions', label: 'app.actions' }]);
    PermissionService.setCurrentUser({ permissions: [] });
    await Vue.nextTick();

    expect(view.vm.tableFields).toEqual([]);
    PermissionService.setCurrentUser({ permissions: [] });
    await Vue.nextTick();

    expect(view.vm.tableFields).toEqual([]);
    view.destroy();
    await Vue.nextTick();

    PermissionService.setCurrentUser({ permissions: ['users.delete'] });
    await Vue.nextTick();

    expect(view.vm.tableFields).toEqual([]);
    PermissionService.setCurrentUser(oldUser);
  });
});
