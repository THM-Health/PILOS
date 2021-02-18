<template>
  <b-container class="mt-3 mb-5">
    <b-row class="mb-3">
      <b-col>
        <h2>
          {{ $t('meetings.currentlyRunning') }}
        </h2>
      </b-col>
      <b-col sm='12' md='3'>
        <b-input-group>
          <b-form-input
            v-model='filter'
            :disabled="loadingError"
            :placeholder="$t('app.search')"
            :debounce='200'
          ></b-form-input>
          <b-input-group-append>
            <b-input-group-text class='bg-success text-white'><b-icon icon='search'></b-icon></b-input-group-text>
          </b-input-group-append>
        </b-input-group>
      </b-col>
    </b-row>
    <hr>

    <b-overlay  :show="loadingError" >

      <template #overlay>
        <div class="text-center my-2">
          <b-spinner v-if="isBusy" ></b-spinner>
          <b-button
            v-else
            @click="$root.$emit('bv::refresh::table', 'meetings-table')"
          >
            <b-icon-arrow-clockwise></b-icon-arrow-clockwise> {{ $t('app.reload') }}
          </b-button>
        </div>
      </template>

      <b-table
      fixed
      hover
      stacked='lg'
      show-empty
      :busy.sync='isBusy'
      :fields='tableFields'
      :items='fetchMeetings'
      id='meetings-table'
      ref='meetings'
      :filter='filter'
      :current-page='currentPage'>

      <template v-slot:empty>
        <i>{{ $t('meetings.nodata') }}</i>
      </template>

      <template v-slot:emptyfiltered>
        <i>{{ $t('meetings.nodataFiltered') }}</i>
      </template>

      <template v-slot:table-busy>
        <div class="text-center my-2">
          <b-spinner className="align-middle"></b-spinner>
        </div>
      </template>

      <!-- A custom formatted header cell for field 'name' -->
      <template #head(room.listener_count)>
        <i v-b-tooltip.hover
           :title="$t('meetings.listenerCount')"
           class="fas fa-headphones"></i>
      </template>
      <template #head(room.voice_participant_count)>
        <i v-b-tooltip.hover
           :title="$t('meetings.voiceParticipantCount')"
           class="fas fa-microphone"></i>
      </template>
      <template #head(room.video_count)>
        <i v-b-tooltip.hover
           :title="$t('meetings.videoCount')"
           class="fas fa-video"></i>
      </template>
      <template #head(room.participant_count)>
        <i v-b-tooltip.hover
           :title="$t('meetings.participantCount')"
           class="fas fa-users"></i>
      </template>

      <template v-slot:cell(start)="data">
       {{ $date(data.item.start).format('DD.MM.YY HH:mm') }}
      </template>

      <template v-slot:cell(room.name)="data">
        <text-truncate>
          {{ data.item.room.name }}
        </text-truncate>
      </template>

      <template v-slot:cell(room.owner)="data">
        <text-truncate>
          {{ data.item.room.owner }}
        </text-truncate>
      </template>

      <template v-slot:cell(server.name)="data">
        <text-truncate>
          {{ data.item.server.name }}
        </text-truncate>
      </template>

      <template v-slot:cell(room.listener_count)="data">
        <span v-if="data.item.room.listener_count !== null">{{ data.item.room.listener_count }}</span>
        <raw-text v-else>---</raw-text>
      </template>
      <template v-slot:cell(room.voice_participant_count)="data">
        <span v-if="data.item.room.voice_participant_count !== null">{{ data.item.room.voice_participant_count }}</span>
        <raw-text v-else>---</raw-text>
      </template>
      <template v-slot:cell(room.video_count)="data">
        <span v-if="data.item.room.video_count !== null">{{ data.item.room.video_count }}</span>
        <raw-text v-else>---</raw-text>
      </template>
      <template v-slot:cell(room.participant_count)="data">
        <span v-if="data.item.room.participant_count !== null">{{ data.item.room.participant_count }}</span>
        <raw-text v-else>---</raw-text>
      </template>

      <template v-slot:cell(actions)="data">
        <b-button
          v-b-tooltip.hover
          :title="$t('meetings.viewRoom', { name: data.item.room.name })"
          :disabled='isBusy'
          variant='primary'
          :to="{ name: 'rooms.view', params: { id: data.item.room.id } }"
        >
          <i class='fas fa-eye'></i>
        </b-button>
      </template>
    </b-table>

      <b-pagination
        v-model='currentPage'
        :total-rows='total'
        :per-page='perPage'
        aria-controls='meetings-table'
        @input="$root.$emit('bv::refresh::table', 'meetings-table')"
        align='center'
        :disabled='isBusy || loadingError'
      ></b-pagination>
    </b-overlay>
  </b-container>
</template>

<script>
import Base from '../../api/base';
import RawText from '../../components/RawText';
import TextTruncate from '../../components/TextTruncate';

export default {
  components: { TextTruncate, RawText },

  computed: {
    tableFields () {
      return [
        { key: 'start', label: this.$t('meetings.start'), sortable: true, thStyle: { width: '120px' } },
        { key: 'room.name', label: this.$t('meetings.name'), sortable: false, tdClass: 'td-max-width-0-lg' },
        { key: 'room.owner', label: this.$t('meetings.owner'), sortable: false, tdClass: 'td-max-width-0-lg' },
        { key: 'server.name', label: this.$t('meetings.server'), sortable: false, tdClass: 'td-max-width-0-lg' },
        { key: 'room.participant_count', label: this.$t('meetings.participantCount'), sortable: true, thStyle: { width: '64px' } },
        { key: 'room.listener_count', label: this.$t('meetings.listenerCount'), sortable: true, thStyle: { width: '64px' } },
        { key: 'room.voice_participant_count', label: this.$t('meetings.voiceParticipantCount'), sortable: true, thStyle: { width: '64px' } },
        { key: 'room.video_count', label: this.$t('meetings.videoCount'), sortable: true, thStyle: { width: '64px' } },
        { key: 'actions', label: this.$t('app.actions'), sortable: false, thStyle: { width: '100px' } }
      ];
    }
  },

  data () {
    return {
      isBusy: false,
      loadingError: false,
      currentPage: undefined,
      total: undefined,
      perPage: undefined,
      actionPermissions: [],
      filter: undefined
    };
  },

  methods: {
    /**
     * Loads the running meetings from the backend and calls on finish the callback function.
     *
     * @param ctx Context information e.g. the sort field and direction and the page.
     * @param callback
     * @return {null}
     */
    fetchMeetings (ctx, callback) {
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
        config.params.search = ctx.filter;
      }

      Base.call('meetings', config).then(response => {
        this.perPage = response.data.meta.per_page;
        this.currentPage = response.data.meta.current_page;
        this.total = response.data.meta.total;
        data = response.data.data;
        this.loadingError = false;
      }).catch(error => {
        this.loadingError = true;
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        callback(data);
      });

      return null;
    }
  }
};
</script>

<style scoped>

</style>
