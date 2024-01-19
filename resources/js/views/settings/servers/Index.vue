<template>
  <div>
    <b-row>
      <b-col>
        <h3>
          {{ $t('app.servers') }}

          <can
            method="create"
            policy="ServerPolicy"
          >
            <b-button
              ref="newServer"
              v-b-tooltip.hover
              class="ml-2 float-right"
              variant="success"
              :title="$t('settings.servers.new')"
              :to="{ name: 'settings.servers.view', params: { id: 'new' } }"
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
      id="servers-table"
      ref="servers"
      fixed
      hover
      stacked="lg"
      show-empty
      v-model:busy="isBusy"
      :fields="tableFields"
      :items="fetchServers"
      :filter="filter"
      :current-page="currentPage"
    >
      <template #empty>
        <i>{{ $t('settings.servers.no_data') }}</i>
      </template>

      <template #emptyfiltered>
        <i>{{ $t('settings.servers.no_data_filtered') }}</i>
      </template>

      <template #table-busy>
        <div class="text-center my-2">
          <b-spinner class="align-middle" />
        </div>
      </template>

      <template #cell(name)="data">
        <text-truncate>
          {{ data.item.name }}
        </text-truncate>
      </template>

      <template #cell(status)="data">
        <b-badge
          v-if="data.item.status === -1"
          v-b-tooltip.hover
          :title="$t('settings.servers.disabled')"
          variant="secondary"
          class="p-2"
        >
          <i class="fa-solid fa-pause" />
        </b-badge>
        <b-badge
          v-else-if="data.item.status === 0"
          v-b-tooltip.hover
          :title="$t('settings.servers.offline')"
          variant="danger"
          class="p-2"
        >
          <i class="fa-solid fa-stop" />
        </b-badge>
        <b-badge
          v-else
          v-b-tooltip.hover
          :title="$t('settings.servers.online')"
          variant="success"
          class="p-2"
        >
          <i class="fa-solid fa-play" />
        </b-badge>
      </template>

      <template #cell(participant_count)="data">
        <span v-if="data.item.participant_count !== null">{{ data.item.participant_count }}</span>
        <raw-text v-else>
          ---
        </raw-text>
      </template>

      <template #cell(video_count)="data">
        <span v-if="data.item.video_count !== null">{{ data.item.video_count }}</span>
        <raw-text v-else>
          ---
        </raw-text>
      </template>

      <template #cell(version)="data">
        <span v-if="data.item.version != null">{{ data.item.version }}</span>
        <raw-text v-else>
          ---
        </raw-text>
      </template>

      <template #cell(meeting_count)="data">
        <span v-if="data.item.meeting_count !== null">{{ data.item.meeting_count }}</span>
        <raw-text v-else>
          ---
        </raw-text>
      </template>

      <template #cell(actions)="data">
        <b-button-group>
          <can
            method="view"
            :policy="data.item"
          >
            <b-button
              v-b-tooltip.hover
              :title="$t('settings.servers.view', { name: data.item.name })"
              :disabled="isBusy"
              variant="info"
              :to="{ name: 'settings.servers.view', params: { id: data.item.id }, query: { view: '1' } }"
            >
              <i class="fa-solid fa-eye" />
            </b-button>
          </can>
          <can
            method="update"
            :policy="data.item"
          >
            <b-button
              v-b-tooltip.hover
              :title="$t('settings.servers.edit', { name: data.item.name })"
              :disabled="isBusy"
              variant="secondary"
              :to="{ name: 'settings.servers.view', params: { id: data.item.id } }"
            >
              <i class="fa-solid fa-edit" />
            </b-button>
          </can>
          <can
            method="delete"
            :policy="data.item"
          >
            <b-button
              v-if="data.item.status===-1"
              v-b-tooltip.hover
              :title="$t('settings.servers.delete.item', { name: data.item.name })"
              :disabled="isBusy"
              variant="danger"
              @click="showServerModal(data.item)"
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
      aria-controls="servers-table"
      align="center"
      :disabled="isBusy"
      @input="$root.$emit('bv::refresh::table', 'servers-table')"
    />

    <b-alert show>
      <i class="fa-solid fa-info-circle" />
      {{ $t('settings.servers.usage_info') }}
      <br><br>
      <b-button
        v-b-tooltip.hover
        size="sm"
        variant="info"
        :disabled="isBusy"
        @click="updateUsage=true;$root.$emit('bv::refresh::table', 'servers-table')"
      >
        <i class="fa-solid fa-sync" /> {{ $t('settings.servers.reload') }}
      </b-button>
    </b-alert>

    <b-modal
      ref="delete-server-modal"
      :busy="deleting"
      ok-variant="danger"
      cancel-variant="secondary"
      :cancel-title="$t('app.no')"
      :static="modalStatic"
      :no-close-on-esc="deleting"
      :no-close-on-backdrop="deleting"
      :hide-header-close="deleting"
      @ok="deleteServer($event)"
      @cancel="clearServerToDelete"
      @close="clearServerToDelete"
    >
      <template #modal-title>
        {{ $t('settings.servers.delete.title') }}
      </template>
      <template #modal-ok>
        <b-spinner
          v-if="deleting"
          small
        />  {{ $t('app.yes') }}
      </template>
      <span v-if="serverToDelete">
        {{ $t('settings.servers.delete.confirm', { name:serverToDelete.name }) }}
      </span>
    </b-modal>
  </div>
</template>

<script>
import Base from '@/api/base';
import Can from '@/components/Permissions/Can.vue';
import ActionsColumn from '@/mixins/ActionsColumn';
import RawText from '@/components/RawText.vue';
import TextTruncate from '@/components/TextTruncate.vue';

export default {
  components: { TextTruncate, Can, RawText },
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
      serverToDelete: undefined,
      actionPermissions: ['servers.view', 'servers.update', 'servers.delete'],
      filter: undefined,
      updateUsage: false
    };
  },

  computed: {
    tableFields () {
      const fields = [
        { key: 'id', label: this.$t('app.id'), sortable: true, thStyle: { width: '8%' } },
        { key: 'name', label: this.$t('app.model_name'), sortable: true, tdClass: 'td-max-width-0-lg' },
        { key: 'status', label: this.$t('settings.servers.status'), sortable: true, thStyle: { width: '10%' } },
        { key: 'version', label: this.$t('settings.servers.version'), sortable: true, thStyle: { width: '10%' } },
        { key: 'meeting_count', label: this.$t('settings.servers.meeting_count'), sortable: true, thStyle: { width: '15%' } },
        { key: 'participant_count', label: this.$t('settings.servers.participant_count'), sortable: true, thStyle: { width: '15%' } },
        { key: 'video_count', label: this.$t('settings.servers.video_count'), sortable: true, thStyle: { width: '15%' } }
      ];

      if (this.actionColumnVisible) {
        fields.push(this.actionColumnDefinition);
      }

      return fields;
    }
  },

  methods: {
    /**
     * Loads the servers from the backend and calls on finish the callback function.
     *
     * @param ctx Context information e.g. the sort field and direction and the page.
     * @param callback
     * @return {null}
     */
    fetchServers (ctx, callback) {
      let data = [];

      const config = {
        params: {
          page: ctx.currentPage,
          update_usage: this.updateUsage
        }
      };

      if (ctx.sortBy) {
        config.params.sort_by = ctx.sortBy;
        config.params.sort_direction = ctx.sortDesc ? 'desc' : 'asc';
      }

      if (ctx.filter) {
        config.params.name = ctx.filter;
      }

      Base.call('servers', config).then(response => {
        this.perPage = response.data.meta.per_page;
        this.currentPage = response.data.meta.current_page;
        this.total = response.data.meta.total;

        data = response.data.data;
      }).catch(error => {
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        callback(data);
        this.updateUsage = false;
      });

      return null;
    },

    /**
     * Shows the delete modal with the passed server.
     *
     * @param server Server that should be deleted.
     */
    showServerModal (server) {
      this.serverToDelete = server;
      this.$refs['delete-server-modal'].show();
    },

    /**
     * Deletes the server that is set in the property `serverToDelete`.
     */
    deleteServer (evt) {
      evt.preventDefault();
      this.deleting = true;

      Base.call(`servers/${this.serverToDelete.id}`, {
        method: 'delete'
      }).catch(error => {
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.currentPage = 1;
        this.$refs.servers.refresh();
        this.clearServerToDelete();
        this.$refs['delete-server-modal'].hide();
        this.deleting = false;
      });
    },

    /**
     * Clears the temporary property `serverToDelete` on canceling or
     * after success delete when the modal gets hidden.
     */
    clearServerToDelete () {
      this.serverToDelete = undefined;
    }
  }
};
</script>

<style scoped>

</style>
