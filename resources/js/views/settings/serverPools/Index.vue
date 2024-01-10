<template>
  <div>
    <b-row>
      <b-col>
        <h3>
          {{ $t('app.server_pools') }}

          <can
            method="create"
            policy="ServerPoolPolicy"
          >
            <b-button
              ref="newServerPool"
              v-b-tooltip.hover
              v-tooltip-hide-click
              class="ml-2 float-right"
              variant="success"
              :title="$t('settings.server_pools.new')"
              :to="{ name: 'settings.server_pools.view', params: { id: 'new' } }"
            >
              <i class="fa-solid fa-plus" />
            </b-button>
          </can>
        </h3>
      </b-col>
      <b-col
        sm="12"
        md="3"
      >
        <b-input-group>
          <b-form-input
            v-model="filter"
            :placeholder="$t('app.search')"
            :debounce="searchDebounce"
          />
          <b-input-group-append>
            <b-input-group-text class="bg-primary">
              <i class="fa-solid fa-magnifying-glass" />
            </b-input-group-text>
          </b-input-group-append>
        </b-input-group>
      </b-col>
    </b-row>
    <hr>

    <b-table
      id="server-pools-table"
      ref="serverPools"
      :responsive="true"
      hover
      stacked="xl"
      show-empty
      v-model:busy="isBusy"
      :fields="tableFields"
      :items="fetchServerPools"
      :filter="filter"
      :current-page="currentPage"
    >
      <template #empty>
        <i>{{ $t('settings.server_pools.no_data') }}</i>
      </template>

      <template #emptyfiltered>
        <i>{{ $t('settings.server_pools.no_data_filtered') }}</i>
      </template>

      <template #table-busy>
        <div class="text-center my-2">
          <b-spinner class="align-middle" />
        </div>
      </template>

      <template #cell(actions)="data">
        <b-button-group>
          <can
            method="view"
            :policy="data.item"
          >
            <b-button
              v-b-tooltip.hover.bottom
              v-tooltip-hide-click
              :title="$t('settings.server_pools.view', { name: data.item.name })"
              :disabled="isBusy"
              variant="info"
              :to="{ name: 'settings.server_pools.view', params: { id: data.item.id }, query: { view: '1' } }"
            >
              <i class="fa-solid fa-eye" />
            </b-button>
          </can>
          <can
            method="update"
            :policy="data.item"
          >
            <b-button
              v-b-tooltip.hover.bottom
              v-tooltip-hide-click
              :title="$t('settings.server_pools.edit', { name: data.item.name })"
              :disabled="isBusy"
              variant="secondary"
              :to="{ name: 'settings.server_pools.view', params: { id: data.item.id } }"
            >
              <i class="fa-solid fa-edit" />
            </b-button>
          </can>
          <can
            method="delete"
            :policy="data.item"
          >
            <b-button
              v-b-tooltip.hover.bottom
              v-tooltip-hide-click
              :title="$t('settings.server_pools.delete.item', { name: data.item.name })"
              :disabled="isBusy"
              variant="danger"
              @click="showServerPoolModal(data.item)"
            >
              <i class="fa-solid fa-trash" />
            </b-button>
          </can>
        </b-button-group>
      </template>
    </b-table>

    <b-pagination
      v-model="currentPage"
      :total-rows="total"
      :per-page="perPage"
      aria-controls="server-pools-table"
      align="center"
      :disabled="isBusy"
      @input="$root.$emit('bv::refresh::table', 'server-pools-table')"
    />

    <b-modal
      ref="delete-server-pool-modal"
      :busy="deleting"
      :hide-footer="deleteFailedRoomTypes!=null"
      ok-variant="danger"
      cancel-variant="dark"
      :cancel-title="$t('app.no')"
      :static="modalStatic"
      :no-close-on-esc="deleting"
      :no-close-on-backdrop="deleting"
      :hide-header-close="deleting"
      @ok="deleteServerPool($event)"
      @cancel="clearServerPoolToDelete"
      @close="clearServerPoolToDelete"
    >
      <template #modal-title>
        {{ $t('settings.server_pools.delete.title') }}
      </template>
      <template #modal-ok>
        <b-spinner
          v-if="deleting"
          small
        />  {{ $t('app.yes') }}
      </template>
      <span v-if="serverPoolToDelete">
        {{ $t('settings.server_pools.delete.confirm', { name:serverPoolToDelete.name }) }}
      </span>

      <div v-if="deleteFailedRoomTypes">
        <b-alert
          :show="true"
          variant="danger"
        >
          {{ $t('settings.server_pools.delete.failed') }}
          <ul>
            <li
              v-for="roomType in deleteFailedRoomTypes"
              :key="roomType.id"
            >
              {{ roomType.description }}
            </li>
          </ul>
        </b-alert>
      </div>
    </b-modal>
  </div>
</template>

<script>
import Base from '@/api/base';
import Can from '@/components/Permissions/Can.vue';
import ActionsColumn from '@/mixins/ActionsColumn';
import env from '@/env';

export default {
  components: { Can },
  mixins: [ActionsColumn],

  props: {
    searchDebounce: {
      type: Number,
      default: 200,
      required: false
    },
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
      serverPoolToDelete: undefined,
      actionPermissions: ['serverPools.view', 'serverPools.update', 'serverPools.delete'],
      filter: undefined,
      deleteFailedRoomTypes: null
    };
  },

  computed: {
    tableFields () {
      const fields = [
        { key: 'id', label: this.$t('app.id'), sortable: true },
        { key: 'name', label: this.$t('app.model_name'), sortable: true },
        { key: 'servers_count', label: this.$t('settings.server_pools.server_count'), sortable: true }
      ];

      if (this.actionColumnVisible) {
        fields.push(this.actionColumnDefinition);
      }

      return fields;
    }
  },

  methods: {
    /**
     * Loads the server pools from the backend and calls on finish the callback function.
     *
     * @param ctx Context information e.g. the sort field and direction and the page.
     * @param callback
     * @return {null}
     */
    fetchServerPools (ctx, callback) {
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

      if (ctx.filter) {
        config.params.name = ctx.filter;
      }

      Base.call('serverPools', config).then(response => {
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
     * Shows the delete modal with the passed server.
     *
     * @param server Server that should be deleted.
     */
    showServerPoolModal (server) {
      this.deleteFailedRoomTypes = null;
      this.serverPoolToDelete = server;
      this.$refs['delete-server-pool-modal'].show();
    },

    /**
     * Deletes the server that is set in the property `serverPoolToDelete`.
     */
    deleteServerPool (evt) {
      evt.preventDefault();
      this.deleting = true;

      Base.call(`serverPools/${this.serverPoolToDelete.id}`, {
        method: 'delete'
      }).then(() => {
        this.clearServerPoolToDelete();
        this.$refs['delete-server-pool-modal'].hide();
        this.currentPage = 1;
        this.$refs.serverPools.refresh();
      }).catch(error => {
        if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
          this.deleteFailedRoomTypes = error.response.data.room_types;
        } else {
          Base.error(error, this.$root, error.message);
          this.clearServerPoolToDelete();
          this.$refs['delete-server-pool-modal'].hide();
          this.currentPage = 1;
          this.$refs.serverPools.refresh();
        }
      }).finally(() => {
        this.deleting = false;
      });
    },

    /**
     * Clears the temporary property `serverPoolToDelete` on canceling or
     * after success delete when the modal gets hidden.
     */
    clearServerPoolToDelete () {
      this.serverPoolToDelete = undefined;
      this.deleteFailedRoomTypes = null;
    }
  }
};
</script>

<style scoped>

</style>
