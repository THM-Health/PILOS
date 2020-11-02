<template>
  <div>
    <h3>
      {{ $t('settings.roomTypes.title') }}
      <can method='create' policy='RoomTypePolicy'>
        <b-button
          class='float-right'
          v-b-tooltip.hover
          variant='success'
          :title="$t('settings.roomTypes.new')"
          :to="{ name: 'settings.room_types.view', params: { id: 'new' } }"
        ><b-icon-plus></b-icon-plus></b-button>
      </can>
    </h3>
    <hr>

    <b-table
      hover
      stacked='md'
      show-empty
      :busy.sync='isBusy'
      :fields='tableFields'
      :items='fetchRoles'
      id='roles-table'
    >

      <template v-slot:empty>
        <i>{{ $t('settings.roomTypes.nodata') }}</i>
      </template>

      <template v-slot:table-busy>
        <div class="text-center my-2">
          <b-spinner class="align-middle"></b-spinner>
        </div>
      </template>

      <template v-slot:cell(short)="data">
        <div class="roomicon" :style="{ 'background-color': data.item.color}">{{ data.item.short }}</div>
      </template>

      <template v-slot:cell(actions)="data">
        <can method='view' :policy='data.item'>
          <b-button
            v-b-tooltip.hover
            :title="$t('settings.roomTypes.view', { name: data.item.id })"
            :disabled='isBusy'
            variant='primary'
            :to="{ name: 'settings.room_types.view', params: { id: data.item.id }, query: { view: '1' } }"
          >
            <i class='fas fa-eye'></i>
          </b-button>
        </can>
        <can method='update' :policy='data.item'>
          <b-button
            v-b-tooltip.hover
            :title="$t('settings.roomTypes.edit', { name: data.item.id })"
            :disabled='isBusy'
            variant='dark'
            :to="{ name: 'settings.room_types.view', params: { id: data.item.id } }"
          >
            <i class='fas fa-edit'></i>
          </b-button>
        </can>
        <can method='delete' :policy='data.item'>
          <b-button
            v-b-tooltip.hover
            :title="$t('settings.roomTypes.delete.item', { id: data.item.id })"
            :disabled='isBusy'
            variant='danger'
            @click='showDeleteModal(data.item)'>
            <i class='fas fa-trash'></i>
          </b-button>
        </can>
      </template>
    </b-table>

    <b-modal
      :busy='isBusy'
      ok-variant='danger'
      cancel-variant='dark'
      :cancel-title="$t('app.false')"
      @ok='deleteRole'
      @cancel='clearRoleToDelete'
      @close='clearRoleToDelete'
      ref='delete-role-modal'
      :static='modalStatic'>
      <template v-slot:modal-title>
        {{ $t('settings.roomTypes.delete.title') }}
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="isBusy"></b-spinner>  {{ $t('app.true') }}
      </template>
      <span v-if="roleToDelete">
        {{ $t('settings.roomTypes.delete.confirm', { name: $te(`app.roles.${roleToDelete.name}`) ? $t(`app.roles.${roleToDelete.name}`) : roleToDelete.name }) }}
      </span>

    </b-modal>
  </div>
</template>

<script>
import Base from '../../../api/base';
import Can from '../../../components/Permissions/Can';
import PermissionService from '../../../services/PermissionService';
import EventBus from '../../../services/EventBus';

export default {
  components: { Can },

  props: {
    modalStatic: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      isBusy: false,
      roleToDelete: undefined,
      tableFields: [
        { key: 'id', label: this.$t('settings.roomTypes.id'), sortable: true },
        { key: 'short', label: this.$t('settings.roomTypes.icon'), sortable: true },
        { key: 'description', label: this.$t('settings.roomTypes.description'), sortable: true }
      ]
    };
  },

  methods: {
    /**
     * Loads the roles from the backend and calls on finish the callback function.
     *
     * @param ctx Context information e.g. the sort field and direction and the page.
     * @param callback
     * @return {null}
     */
    fetchRoles (ctx, callback) {
      let data = [];

      const config = {
        params: {
          page: ctx.currentPage
        }
      };

      if (ctx.sortBy) {
        config.params.sort_by = ctx.sortBy;
        config.params.sort_direction = ctx.sortDesc ? 'desc' : 'asc';
      }

      Base.call('room_types', config).then(response => {
        data = response.data.data;
      }).catch(error => {
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        callback(data);
      });

      return null;
    },

    /**
     * Shows the delete modal with the passed role.
     *
     * @param role Role that should be deleted.
     */
    showDeleteModal (role) {
      this.roleToDelete = role;
      this.$refs['delete-role-modal'].show();
    },

    /**
     * Deletes the role that is set in the property `roleToDelete`.
     */
    deleteRole () {
      this.isBusy = true;

      Base.call(`roles/${this.roleToDelete.id}`, {
        method: 'delete'
      }).then(() => {
        this.$root.$emit('bv::refresh::table', 'roles-table');
      }).catch(error => {
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.clearRoleToDelete();
        this.$refs['delete-role-modal'].hide();
        this.isBusy = false;
      });
    },

    /**
     * Clears the temporary property `roleToDelete` on canceling or
     * after success delete when the modal gets hidden.
     */
    clearRoleToDelete () {
      this.roleToDelete = undefined;
    },

    /**
     * Adds or removes the actions column to the field depending on the users permissions.
     */
    toggleActionsColumn () {
      if (PermissionService.currentUser && (['room_types.view', 'room_types.update', 'room_types.delete'].some(permission => PermissionService.currentUser.permissions.includes(permission)))) {
        if (this.tableFields[this.tableFields.length - 1].key !== 'actions') {
          this.tableFields.push({ key: 'actions', label: this.$t('settings.roles.actions') });
        }
      } else if (this.tableFields[this.tableFields.length - 1].key === 'actions') {
        this.tableFields.pop();
      }
    }
  },

  /**
   * Sets the event listener for current user change to re-evaluate whether the
   * action column should be shown or not.
   *
   * @method mounted
   * @return undefined
   */
  mounted () {
    EventBus.$on('currentUserChangedEvent', this.toggleActionsColumn);
    this.toggleActionsColumn();
  },

  /**
   * Removes the listener for current user change on destroy of this component.
   *
   * @method beforeDestroy
   * @return undefined
   */
  beforeDestroy () {
    EventBus.$off('currentUserChangedEvent', this.toggleActionsColumn);
  }
};
</script>
