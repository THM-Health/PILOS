<template>
  <div>
    <b-row>
      <b-col>
        <h3>
          {{ $t('settings.serverPools.title') }}

          <can method='create' policy='ServerPoolPolicy'>
            <b-button
              class='ml-2 float-right'
              v-b-tooltip.hover
              variant='success'
              ref="newServerPool"
              :title="$t('settings.serverPools.new')"
              :to="{ name: 'settings.server_pools.view', params: { id: 'new' } }"
            ><i class="fa-solid fa-plus"></i></b-button>
          </can>
        </h3>
      </b-col>
      <b-col sm='12' md='3'>
        <b-input-group>
          <b-form-input
            v-model='filter'
            :placeholder="$t('app.search')"
            :debounce='searchDebounce'
          ></b-form-input>
          <b-input-group-append>
            <b-input-group-text class='bg-success text-white'><i class="fa-solid fa-magnifying-glass"></i></b-input-group-text>
          </b-input-group-append>
        </b-input-group>
      </b-col>
    </b-row>
    <hr>

    <b-table
      :responsive="true"
      hover
      stacked='xl'
      show-empty
      :busy.sync='isBusy'
      :fields='tableFields'
      :items='fetchServerPools'
      id='server-pools-table'
      ref='serverPools'
      :filter='filter'
      :current-page='currentPage'>

      <template v-slot:empty>
        <i>{{ $t('settings.serverPools.nodata') }}</i>
      </template>

      <template v-slot:emptyfiltered>
        <i>{{ $t('settings.serverPools.nodataFiltered') }}</i>
      </template>

      <template v-slot:table-busy>
        <div class="text-center my-2">
          <b-spinner class="align-middle"></b-spinner>
        </div>
      </template>

      <template v-slot:cell(actions)="data">
        <b-button-group>
          <can method='view' :policy='data.item'>
            <b-button
              v-b-tooltip.hover
              :title="$t('settings.serverPools.view', { name: data.item.name })"
              :disabled='isBusy'
              variant='primary'
              :to="{ name: 'settings.server_pools.view', params: { id: data.item.id }, query: { view: '1' } }"
            >
              <i class='fa-solid fa-eye'></i>
            </b-button>
          </can>
          <can method='update' :policy='data.item'>
            <b-button
              v-b-tooltip.hover
              :title="$t('settings.serverPools.edit', { name: data.item.name })"
              :disabled='isBusy'
              variant='dark'
              :to="{ name: 'settings.server_pools.view', params: { id: data.item.id } }"
            >
              <i class='fa-solid fa-edit'></i>
            </b-button>
          </can>
          <can method='delete' :policy='data.item'>
            <b-button
              v-b-tooltip.hover
              :title="$t('settings.serverPools.delete.item', { name: data.item.name })"
              :disabled='isBusy'
              variant='danger'
              @click='showServerPoolModal(data.item)'>
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
      aria-controls='server-pools-table'
      @input="$root.$emit('bv::refresh::table', 'server-pools-table')"
      align='center'
      :disabled='isBusy'
    ></b-pagination>

    <b-modal
      :busy='deleting'
      :hide-footer="deleteFailedRoomTypes!=null"
      ok-variant='danger'
      cancel-variant='dark'
      :cancel-title="$t('app.no')"
      @ok='deleteServerPool($event)'
      @cancel='clearServerPoolToDelete'
      @close='clearServerPoolToDelete'
      ref='delete-server-pool-modal'
      :static='modalStatic'
      :no-close-on-esc="deleting"
      :no-close-on-backdrop="deleting"
      :hide-header-close="deleting"
    >
      <template v-slot:modal-title>
        {{ $t('settings.serverPools.delete.title') }}
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="deleting"></b-spinner>  {{ $t('app.yes') }}
      </template>
      <span v-if="serverPoolToDelete">
        {{ $t('settings.serverPools.delete.confirm', { name:serverPoolToDelete.name }) }}
      </span>

      <div v-if="deleteFailedRoomTypes">
        <b-alert :show="true" variant="danger">{{ $t('settings.serverPools.delete.failed') }}
          <ul>
            <li v-for="roomType in deleteFailedRoomTypes" :key="roomType.id">
              {{ roomType.description }}
            </li>
          </ul>
        </b-alert>
      </div>

    </b-modal>
  </div>
</template>

<script>
import Base from '../../../api/base';
import Can from '../../../components/Permissions/Can';
import ActionsColumn from '../../../mixins/ActionsColumn';
import env from '../../../env';

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

  computed: {
    tableFields () {
      const fields = [
        { key: 'id', label: this.$t('settings.serverPools.id'), sortable: true },
        { key: 'name', label: this.$t('settings.serverPools.name'), sortable: true },
        { key: 'servers_count', label: this.$t('settings.serverPools.serverCount'), sortable: true }
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
      serverPoolToDelete: undefined,
      actionPermissions: ['serverPools.view', 'serverPools.update', 'serverPools.delete'],
      filter: undefined,
      deleteFailedRoomTypes: null
    };
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
          this.deleteFailedRoomTypes = error.response.data.roomTypes;
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
