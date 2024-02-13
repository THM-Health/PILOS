<template>
  <div>
      <div class="grid">
        <div class="col">
          <h2>
            {{ $t('app.roles') }}
          </h2>
        </div>
        <div class="col flex justify-content-end align-items-center">
          <Can
            method="create"
            policy="RolePolicy"
          >
            <RouterLink
              class="float-right p-button p-button-success"
              v-tooltip="$t('settings.roles.new')"
              :to="{ name: 'settings.roles.view', params: { id: 'new' } }"
            >
              <i class="fa-solid fa-plus" />
            </RouterLink>
          </can>
        </div>
      </div>
    <hr>

<!--    ToDo-->
    <DataTable
      ref="roles"
      fixed
      row-hover
      stacked="lg"
      show-empty
      paginator
      :loading="isBusy"
      :fields="tableFields"
      :items="fetchRoles"
      :current-page="currentPage"
    >
      <Column field="id" :header="$t('app.id')" sortable></Column>
      <Column field="name" :header="$t('app.model_name')" sortable></Column>
      <Column field="default" :header="$t('settings.roles.default')" sortable></Column>
      <Column :header="$t('app.actions')" class="action-column"></Column>

      <template #empty>
        <i>{{ $t('settings.roles.nodata') }}</i>
      </template>

      <template #cell(name)="data">
        <text-truncate>
          {{ $te(`app.role_labels.${data.item.name}`) ? $t(`app.role_labels.${data.item.name}`) : data.item.name }}
        </text-truncate>
      </template>

      <template #cell(default)="data">
        {{ $t(`app.${data.item.default ? 'yes' : 'no'}`) }}
      </template>

      <template #cell(actions)="data">
        <b-button-group>
          <Can
            method="view"
            :policy="data.item"
          >
            <b-button
              v-b-tooltip.hover
              :title="$t('settings.roles.view', { name: data.item.id })"
              :disabled="isBusy"
              variant="info"
              :to="{ name: 'settings.roles.view', params: { id: data.item.id }, query: { view: '1' } }"
            >
              <i class="fa-solid fa-eye" />
            </b-button>
          </can>
          <Can
            method="update"
            :policy="data.item"
          >
            <b-button
              v-b-tooltip.hover
              :title="$t('settings.roles.edit', { name: data.item.id })"
              :disabled="isBusy"
              variant="secondary"
              :to="{ name: 'settings.roles.view', params: { id: data.item.id } }"
            >
              <i class="fa-solid fa-edit" />
            </b-button>
          </can>
          <Can
            method="delete"
            :policy="data.item"
          >
            <b-button
              v-b-tooltip.hover
              :title="$t('settings.roles.delete.item', { id: data.item.id })"
              :disabled="isBusy"
              variant="danger"
              @click="showDeleteModal(data.item)"
            >
              <i class="fa-solid fa-trash" />
            </b-button>
          </can>
        </b-button-group>
      </template>
    </DataTable>

<!--    ToDo-->
    <b-modal
      ref="delete-role-modal"
      :busy="deleting"
      ok-variant="danger"
      cancel-variant="secondary"
      :cancel-title="$t('app.no')"
      :static="modalStatic"
      :no-close-on-esc="deleting"
      :no-close-on-backdrop="deleting"
      :hide-header-close="deleting"
      @ok="deleteRole($event)"
      @cancel="clearRoleToDelete"
      @close="clearRoleToDelete"
    >
      <template #modal-title>
        {{ $t('settings.roles.delete.title') }}
      </template>
      <template #modal-ok>
        <b-spinner
          v-if="deleting"
          small
        />  {{ $t('app.yes') }}
      </template>
      <span v-if="roleToDelete">
        {{ $t('settings.roles.delete.confirm', { name: $te(`app.role_labels.${roleToDelete.name}`) ? $t(`app.role_labels.${roleToDelete.name}`) : roleToDelete.name }) }}
      </span>
    </b-modal>
  </div>
</template>

<!--ToDo switch to script setup-->
<script>
import Base from '@/api/base';
import ActionsColumn from '@/mixins/ActionsColumn';
import TextTruncate from '@/components/TextTruncate.vue';

export default {
  components: { TextTruncate },
  mixins: [ActionsColumn],

  props: {
    modalStatic: {
      type: Boolean,
      default: false
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

  computed: {
    tableFields () {
      const fields = [
        { key: 'id', label: this.$t('app.id'), sortable: true, thStyle: { width: '8%' } },
        { key: 'name', label: this.$t('app.model_name'), sortable: true, tdClass: 'td-max-width-0-lg' },
        { key: 'default', label: this.$t('settings.roles.default'), sortable: true, thStyle: { width: '15%' } }
      ];

      if (this.actionColumnVisible) {
        fields.push(this.actionColumnDefinition);
      }

      return fields;
    }
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
