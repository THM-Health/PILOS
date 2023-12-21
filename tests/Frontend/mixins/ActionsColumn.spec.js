import ActionsColumn from '@/mixins/ActionsColumn';
import { mount } from '@vue/test-utils';
import PermissionService from '@/services/PermissionService';

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
    await view.vm.$nextTick();

    expect(view.vm.tableFields).toEqual([{ key: 'actions', label: 'app.actions', sortable: false, thClass: 'action-column', thStyle: '', tdClass: 'action-button' }]);
    PermissionService.setCurrentUser({ permissions: ['users.delete'] });
    await view.vm.$nextTick();

    expect(view.vm.tableFields).toEqual([{ key: 'actions', label: 'app.actions', sortable: false, thClass: 'action-column', thStyle: '', tdClass: 'action-button' }]);
    PermissionService.setCurrentUser({ permissions: [] });
    await view.vm.$nextTick();

    expect(view.vm.tableFields).toEqual([]);
    PermissionService.setCurrentUser({ permissions: [] });
    await view.vm.$nextTick();

    expect(view.vm.tableFields).toEqual([]);
    view.destroy();
    await view.vm.$nextTick();

    PermissionService.setCurrentUser({ permissions: ['users.delete'] });
    await view.vm.$nextTick();

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
    await view.vm.$nextTick();

    expect(view.vm.tableFields).toEqual([{ key: 'actions', label: 'app.actions', sortable: false, thClass: 'testClass', thStyle: 'testStyle', tdClass: 'testClass2' }]);
    await view.vm.$nextTick();
    PermissionService.setCurrentUser(oldUser);

    view.destroy();
  });
});
