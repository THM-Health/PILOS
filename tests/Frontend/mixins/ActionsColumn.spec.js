import ActionsColumn from '../../../resources/js/mixins/ActionsColumn';
import { mount } from '@vue/test-utils';
import PermissionService from '../../../resources/js/services/PermissionService';
import Vue from 'vue';

describe('ActionsColumn', () => {
  it('show and hides the actions column depending on the users `actionsPermissions`', async () => {
    const oldUser = PermissionService.currentUser;

    const Test = {
      mixins: [ActionsColumn],
      render () {},
      computed: {
        tableFields () {
          if (this.actionColumnVisible) {
            return [this.actionColumnDefinition];
          }

          return [];
        }
      },
      data () {
        return {
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

    expect(view.vm.tableFields).toEqual([{ key: 'actions', label: 'app.actions', sortable: false, thClass: 'actionColumn', thStyle: '', tdClass: 'actionButton' }]);
    PermissionService.setCurrentUser({ permissions: ['users.delete'] });
    await Vue.nextTick();

    expect(view.vm.tableFields).toEqual([{ key: 'actions', label: 'app.actions', sortable: false, thClass: 'actionColumn', thStyle: '', tdClass: 'actionButton' }]);
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
  }
  );

  it('changes class and style based on data', async () => {
    const oldUser = PermissionService.currentUser;

    const Test = {
      mixins: [ActionsColumn],
      render () {},
      computed: {
        tableFields () {
          if (this.actionColumnVisible) {
            return [this.actionColumnDefinition];
          }

          return [];
        }
      },
      data () {
        return {
          actionColumnThClass: 'testClass',
          actionColumnThStyle: 'testStyle',
          actionColumnTdClass: 'testClass2',
          actionPermissions: ['test.perm']
        };
      }
    };

    const view = mount(Test, {
      mocks: {
        $t: key => key
      }
    });

    expect(view.vm.tableFields).toEqual([]);

    PermissionService.setCurrentUser({ permissions: ['test.perm'] });
    await Vue.nextTick();

    expect(view.vm.tableFields).toEqual([{ key: 'actions', label: 'app.actions', sortable: false, thClass: 'testClass', thStyle: 'testStyle', tdClass: 'testClass2' }]);
    await Vue.nextTick();
    PermissionService.setCurrentUser(oldUser);

    view.destroy();
  });
});
