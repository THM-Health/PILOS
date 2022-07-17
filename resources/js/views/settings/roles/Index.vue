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
        ><i class="fa-solid fa-plus"></i></b-button>
      </can>
    </h3>
    <hr>

    <b-table
      fixed
      hover
      stacked='lg'
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
        <text-truncate>
          {{ $te(`app.roles.${data.item.name}`) ? $t(`app.roles.${data.item.name}`) : data.item.name }}
        </text-truncate>
      </template>

      <template v-slot:cell(default)="data">
        {{ $t(`app.${data.item.default ? 'yes' : 'no'}`) }}
      </template>

      <template v-slot:cell(actions)="data">
        <b-button-group>
          <can method='view' :policy='data.item'>
            <b-button
              v-b-tooltip.hover
              :title="$t('settings.roles.view', { name: data.item.id })"
              :disabled='isBusy'
              variant='info'
              :to="{ name: 'settings.roles.view', params: { id: data.item.id }, query: { view: '1' } }"
            >
              <i class='fa-solid fa-eye'></i>
            </b-button>
          </can>
          <can method='update' :policy='data.item'>
            <b-button
              v-b-tooltip.hover
              :title="$t('settings.roles.edit', { name: data.item.id })"
              :disabled='isBusy'
              variant='secondary'
              :to="{ name: 'settings.roles.view', params: { id: data.item.id } }"
            >
              <i class='fa-solid fa-edit'></i>
            </b-button>
          </can>
          <can method='delete' :policy='data.item'>
            <b-button
              v-b-tooltip.hover
              :title="$t('settings.roles.delete.item', { id: data.item.id })"
              :disabled='isBusy'
              variant='danger'
              @click='showDeleteModal(data.item)'>
              <i class='fa-solid fa-trash'></i>
            </b-button>
          </can>
        </b-button-group>
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
      cancel-variant='secondary'
      :cancel-title="$t('app.no')"
      @ok='deleteRole($event)'
      @cancel='clearRoleToDelete'
      @close='clearRoleToDelete'
      ref='delete-role-modal'
      :static='modalStatic'
      :no-close-on-esc="deleting"
      :no-close-on-backdrop="deleting"
      :hide-header-close="deleting"
    >
      <template v-slot:modal-title>
        {{ $t('settings.roles.delete.title') }}
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="deleting"></b-spinner>  {{ $t('app.yes') }}
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
import TextTruncate from '../../../components/TextTruncate';

export default {
  components: { TextTruncate, Can },
  mixins: [ActionsColumn],

  props: {
    modalStatic: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    tableFields () {
      const fields = [
        { key: 'id', label: this.$t('settings.roles.id'), sortable: true, thStyle: { width: '8%' } },
        { key: 'name', label: this.$t('settings.roles.name'), sortable: true, tdClass: 'td-max-width-0-lg' },
        { key: 'default', label: this.$t('settings.roles.default'), sortable: true, thStyle: { width: '15%' } }
      ];

      if (this.actionColumnVisible) {
        fields.push(this.actionColumnDefinition);
      }

      return fields;
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
    deleteRole (evt) {
      evt.preventDefault();
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
