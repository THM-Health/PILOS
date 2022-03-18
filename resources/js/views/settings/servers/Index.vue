<template>
  <div>
    <b-row>
      <b-col>
        <h3>
          {{ $t('settings.servers.title') }}

          <can method='create' policy='ServerPolicy'>
            <b-button
              class='ml-2 float-right'
              v-b-tooltip.hover
              variant='success'
              ref="newServer"
              :title="$t('settings.servers.new')"
              :to="{ name: 'settings.servers.view', params: { id: 'new' } }"
            ><b-icon-plus></b-icon-plus></b-button>
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
            <b-input-group-text class='bg-success text-white'><b-icon icon='search'></b-icon></b-input-group-text>
          </b-input-group-append>
        </b-input-group>
      </b-col>
    </b-row>
    <hr>

    <b-table
      fixed
      hover
      stacked='lg'
      show-empty
      :busy.sync='isBusy'
      :fields='tableFields'
      :items='fetchServers'
      id='servers-table'
      ref='servers'
      :filter='filter'
      :current-page='currentPage'>

      <template v-slot:empty>
        <i>{{ $t('settings.servers.nodata') }}</i>
      </template>

      <template v-slot:emptyfiltered>
        <i>{{ $t('settings.servers.nodataFiltered') }}</i>
      </template>

      <template v-slot:table-busy>
        <div class="text-center my-2">
          <b-spinner class="align-middle"></b-spinner>
        </div>
      </template>

      <template #cell(name)="data">
        <text-truncate>
          {{ data.item.name }}
        </text-truncate>
      </template>

      <template v-slot:cell(status)="data">
        <b-badge v-b-tooltip.hover :title="$t('settings.servers.disabled')" v-if="data.item.status === -1" variant="secondary"  class="p-2 text-white"><i class='fas fa-pause'></i></b-badge>
        <b-badge v-b-tooltip.hover :title="$t('settings.servers.offline')" v-else-if="data.item.status === 0" variant="danger"  class="p-2 text-white"><i class='fas fa-stop'></i></b-badge>
        <b-badge v-b-tooltip.hover :title="$t('settings.servers.online')" v-else variant="success" class="p-2 text-white"><i class='fas fa-play'></i></b-badge>
      </template>

      <template v-slot:cell(participant_count)="data">
        <span v-if="data.item.participant_count !== null">{{ data.item.participant_count }}</span>
        <raw-text v-else>---</raw-text>
      </template>

      <template v-slot:cell(video_count)="data">
        <span v-if="data.item.video_count !== null">{{ data.item.video_count }}</span>
        <raw-text v-else>---</raw-text>
      </template>

      <template v-slot:cell(version)="data">
        <span v-if="data.item.version != null">{{ data.item.version }}</span>
        <raw-text v-else>---</raw-text>
      </template>

      <template v-slot:cell(meeting_count)="data">
        <span v-if="data.item.meeting_count !== null">{{ data.item.meeting_count }}</span>
        <raw-text v-else>---</raw-text>
      </template>

      <template v-slot:cell(actions)="data">
        <b-button-group>
          <can method='view' :policy='data.item'>
            <b-button
              v-b-tooltip.hover
              :title="$t('settings.servers.view', { name: data.item.name })"
              :disabled='isBusy'
              variant='primary'
              :to="{ name: 'settings.servers.view', params: { id: data.item.id }, query: { view: '1' } }"
            >
              <i class='fas fa-eye'></i>
            </b-button>
          </can>
          <can method='update' :policy='data.item'>
            <b-button
              v-b-tooltip.hover
              :title="$t('settings.servers.edit', { name: data.item.name })"
              :disabled='isBusy'
              variant='dark'
              :to="{ name: 'settings.servers.view', params: { id: data.item.id } }"
            >
              <i class='fas fa-edit'></i>
            </b-button>
          </can>
          <can method='delete' :policy='data.item'>
            <b-button
              v-if="data.item.status===-1"
              v-b-tooltip.hover
              :title="$t('settings.servers.delete.item', { name: data.item.name })"
              :disabled='isBusy'
              variant='danger'
              @click='showServerModal(data.item)'>
              <i class='fas fa-trash'></i>
            </b-button>
          </can>
        </b-button-group>
      </template>
    </b-table>

    <b-pagination
      v-model='currentPage'
      :total-rows='total'
      :per-page='perPage'
      aria-controls='servers-table'
      @input="$root.$emit('bv::refresh::table', 'servers-table')"
      align='center'
      :disabled='isBusy'
    ></b-pagination>

    <b-alert show>
      <i class="fas fa-info-circle"></i>
      {{ $t('settings.servers.usageInfo') }}
      <br><br>
      <b-button
        v-b-tooltip.hover
        size="sm"
        variant='primary'
        :disabled="isBusy"
        @click="updateUsage=true;$root.$emit('bv::refresh::table', 'servers-table')"
      ><b-icon-arrow-clockwise></b-icon-arrow-clockwise> {{ $t('settings.servers.reload') }}</b-button>
    </b-alert>

    <b-modal
      :busy='deleting'
      ok-variant='danger'
      cancel-variant='dark'
      :cancel-title="$t('app.no')"
      @ok='deleteServer($event)'
      @cancel='clearServerToDelete'
      @close='clearServerToDelete'
      ref='delete-server-modal'
      :static='modalStatic'
      :no-close-on-esc="deleting"
      :no-close-on-backdrop="deleting"
      :hide-header-close="deleting"
    >
      <template v-slot:modal-title>
        {{ $t('settings.servers.delete.title') }}
      </template>
      <template v-slot:modal-ok>
        <b-spinner small v-if="deleting"></b-spinner>  {{ $t('app.yes') }}
      </template>
      <span v-if="serverToDelete">
        {{ $t('settings.servers.delete.confirm', { name:serverToDelete.name }) }}
      </span>

    </b-modal>
  </div>
</template>

<script>
import Base from '../../../api/base';
import Can from '../../../components/Permissions/Can';
import ActionsColumn from '../../../mixins/ActionsColumn';
import RawText from '../../../components/RawText';
import TextTruncate from '../../../components/TextTruncate';

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

  computed: {
    tableFields () {
      const fields = [
        { key: 'id', label: this.$t('settings.servers.id'), sortable: true, thStyle: { width: '8%' } },
        { key: 'name', label: this.$t('settings.servers.name'), sortable: true, tdClass: 'td-max-width-0-lg' },
        { key: 'status', label: this.$t('settings.servers.status'), sortable: true, thStyle: { width: '10%' } },
        { key: 'version', label: this.$t('settings.servers.version'), sortable: true, thStyle: { width: '10%' } },
        { key: 'meeting_count', label: this.$t('settings.servers.meetingCount'), sortable: true, thStyle: { width: '15%' } },
        { key: 'participant_count', label: this.$t('settings.servers.participantCount'), sortable: true, thStyle: { width: '15%' } },
        { key: 'video_count', label: this.$t('settings.servers.videoCount'), sortable: true, thStyle: { width: '15%' } }
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
      serverToDelete: undefined,
      actionPermissions: ['servers.view', 'servers.update', 'servers.delete'],
      filter: undefined,
      updateUsage: false
    };
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
