<template>
  <div>
    <h3>
      {{ $t('settings.roles.title') }}
      <can method='create' policy='RolePolicy'>
        <b-button
          class='float-right'
          v-b-tooltip.hover
          variant='success'
          :title="$t('settings.roles.new')"
          :to="{ name: 'settings.roles.view', params: { id: 'new' } }"
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
      ref='roles'
      :current-page='currentPage'>

      <template v-slot:empty>
        <i>{{ $t('settings.roles.nodata') }}</i>
      </template>

      <template v-slot:table-busy>
        <div class="text-center my-2">
          <b-spinner class="align-middle"></b-spinner>
        </div>
      </template>

      <template v-slot:cell(name)="data">
        {{ $te(`app.roles.${data.item.name}`) ? $t(`app.roles.${data.item.name}`) : data.item.name }}
      </template>

      <template v-slot:cell(default)="data">
        {{ $t(`app.${data.item.default}`) }}
      </template>

      <template v-slot:cell(actions)="data">
        <can method='view' :policy='data.item'>
          <b-button
            v-b-tooltip.hover
            :title="$t('settings.roles.view', { name: data.item.id })"
            :disabled='isBusy'
            variant='primary'
            :to="{ name: 'settings.roles.view', params: { id: data.item.id }, query: { view: '1' } }"
          >
            <i class='fas fa-eye'></i>
          </b-button>
        </can>
        <can method='update' :policy='data.item'>
          <b-button
            v-b-tooltip.hover
            :title="$t('settings.roles.edit', { name: data.item.id })"
            :disabled='isBusy'
            variant='dark'
            :to="{ name: 'settings.roles.view', params: { id: data.item.id } }"
          >
            <i class='fas fa-edit'></i>
          </b-button>
        </can>
        <can method='delete' :policy='data.item'>
          <b-button
            v-b-tooltip.hover
            :title="$t('settings.roles.delete.item', { id: data.item.id })"
            :disabled='isBusy'
            variant='danger'
            @click='showDeleteModal(data.item)'>
            <i class='fas fa-trash'></i>
          </b-button>
        </can>
      </template>
    </b-table>

    <b-pagination
      v-model='currentPage'
      :total-rows='total'
      :per-page='perPage'
      aria-controls='roles-table'
      @input="$root.$emit('bv::refresh::table', 'roles-table')"
      align='center'
      :disabled='isBusy'
    ></b-pagination>

    <b-modal
      :busy='deleting'
      ok-variant='danger'
      cancel-variant='dark'
      :cancel-title="$t('app.false')"
      @ok='deleteRole'
      @cancel='clearRoleToDelete'
      @close='clearRoleToDelete'
      ref='delete-role-modal'
      :static='modalStatic'>
      <template v-slot:modal-title>
        {{ $t('settings.roles.delete.title') }}
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="deleting"></b-spinner>  {{ $t('app.true') }}
      </template>
      <span v-if="roleToDelete">
        {{ $t('settings.roles.delete.confirm', { name: $te(`app.roles.${roleToDelete.name}`) ? $t(`app.roles.${roleToDelete.name}`) : roleToDelete.name }) }}
      </span>

    </b-modal>
  </div>
</template>

<script>
import Base from '../../../api/base';
import Can from '../../../components/Permissions/Can';
import ActionsColumn from '../../../mixins/ActionsColumn';

export default {
  components: { Can },
  mixins: [ActionsColumn],

  props: {
    modalStatic: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    tableFields () {
      return [
        { key: 'id', label: this.$t('settings.roles.id'), sortable: true },
        { key: 'name', label: this.$t('settings.roles.name'), sortable: true },
        { key: 'default', label: this.$t('settings.roles.default'), sortable: true }
      ];
    }
  },

  data () {
    return {
      isBusy: false,
      deleting: false,
      currentPage: undefined,
      total: undefined,
      perPage: undefined,
      roleToDelete: undefined,
      actionPermissions: ['roles.view', 'roles.update', 'roles.delete']
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

      Base.call('roles', config).then(response => {
        this.perPage = response.data.meta.per_page;
        this.currentPage = response.data.meta.current_page;
        this.total = response.data.meta.total;

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
      this.deleting = true;

      Base.call(`roles/${this.roleToDelete.id}`, {
        method: 'delete'
      }).catch(error => {
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.currentPage = 1;
        this.$refs.roles.refresh();
        this.clearRoleToDelete();
        this.$refs['delete-role-modal'].hide();
        this.deleting = false;
      });
    },

    /**
     * Clears the temporary property `roleToDelete` on canceling or
     * after success delete when the modal gets hidden.
     */
    clearRoleToDelete () {
      this.roleToDelete = undefined;
    }
  }
};
</script>

<style scoped>

</style>
