<template>
  <div>
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

      <b-modal v-model="showStats" size="xl" hide-footer>
        <template #modal-title>
          {{ $t('meetings.stats.modalTitle',{room: room.name }) }}
          <br><small>{{ $date.utc(currentMeeting.start).local().format('DD.MM.YY HH:mm') }} - {{ currentMeeting.end == null ? $t('meetings.now') : $date.utc(currentMeeting.end).local().format('DD.MM.YY HH:mm') }}</small>
        </template>
        <meeting-stats-chart v-if="currentMeeting" :height="250" :chart-data="meeting_stats"></meeting-stats-chart>
      </b-modal>
      <b-modal v-model="showAttendance" size="xl" hide-footer>
        <template #modal-title >
          {{ $t('meetings.attendance.modalTitle',{room: room.name}) }}
          <br><small>{{ $date.utc(currentMeeting.start).local().format('DD.MM.YY HH:mm') }} - {{ $date.utc(currentMeeting.end).local().format('DD.MM.YY HH:mm') }}</small>
        </template>

        <!-- Display files -->
        <b-table
          :current-page="attendanceCurrentPage"
          :per-page="settings('pagination_page_size')"
          :fields="attendanceTableFields"
          sort-by="name"
          :sort-desc="true"
          v-if="attendance"
          :items="attendance"
          hover
          stacked="md"
          show-empty
        >
          <!-- Show message on empty file list -->
          <template v-slot:empty>
            <i>{{ $t('rooms.files.nodata') }}</i>
          </template>

          <!-- Show spinner while table is loading -->
          <template v-slot:table-busy>
            <div class="text-center my-2">
              <b-spinner class="align-middle"></b-spinner>
            </div>
          </template>

          <template v-slot:cell(email)="data">
            {{ data.item.email || "---" }}
          </template>

          <template v-slot:cell(duration)="data">
            {{ data.item.duration + " min" }}
          </template>

          <template v-slot:cell(sessions)="data">
            <p v-for="session in data.item.sessions" :key="session.id" >
              {{ $date.utc(session.join).local().format('DD.MM.YY HH:mm') }} - {{ $date.utc(session.leave).local().format('DD.MM.YY HH:mm') }} ({{ session.duration + " min"}})
            </p>
          </template>

        </b-table>
        <b-pagination
          v-if="attendance.length>settings('pagination_page_size')"
          v-model="attendanceCurrentPage"
          :total-rows="attendance.length"
          :per-page="settings('pagination_page_size')"
        ></b-pagination>

      </b-modal>

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
        :current-page='currentPage'>

        <template v-slot:empty>
          <i>{{ $t('meetings.nodata') }}</i>
        </template>

        <template v-slot:emptyfiltered>
          <i>{{ $t('meetings.nodataFiltered') }}</i>
        </template>

        <template v-slot:table-busy>
          <div class="text-center my-2" v-if="!loadingError">
            <b-spinner className="align-middle"></b-spinner>
          </div>
        </template>

        <template v-slot:cell(start)="data">
          {{ $date.utc(data.item.start).local().format('DD.MM.YY HH:mm') }}
        </template>

        <template v-slot:cell(end)="data">
          {{ data.item.end == null ? $t('meetings.now') : $date.utc(data.item.end).local().format('DD.MM.YY HH:mm') }}
        </template>

        <template v-slot:cell(actions)="data">
          <b-button
            v-b-tooltip.hover
            :title="$t('meetings.viewMeetingStats')"
            :disabled='isBusy'
            variant='primary'
            @click="loadMeetingStats(data.item)"
          >
            <i class='fas fa-chart-line'></i>
          </b-button>
          <b-button
            v-b-tooltip.hover
            :title="$t('meetings.viewMeetingAttendance')"
            :disabled='isBusy'
            variant='primary'
            @click="loadMeetingAttendance(data.item)"
          >
            <i class="fas fa-user-clock"></i>
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
  </div>
</template>

<script>
import Base from '../../api/base';
import MeetingStatsChart from './MeetingStatsChart';
import { mapGetters } from 'vuex';

export default {
  components: { MeetingStatsChart },
  props: {
    room: Object
  },

  data () {
    return {
      isBusy: false,
      loadingError: false,
      currentPage: undefined,
      total: undefined,
      perPage: undefined,
      showStats: false,
      showAttendance: false,
      statsLoadingError: false,
      loadingStats: false,
      meeting_stats: [],
      currentMeeting: undefined,
      attendance: [],
      attendanceCurrentPage: 0
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

      Base.call('rooms/' + this.room.id + '/meetings', config).then(response => {
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
    },

    loadMeetingStats (meeting) {
      this.loadingStats = true;
      Base.call('meetings/' + meeting.id + '/stats')
        .then(response => {
          // fetch successful

          this.currentMeeting = meeting;

          const data = {
            participants: [],
            voices: [],
            videos: []
          };
          response.data.data.forEach(stat => {
            data.participants.push({ x: stat.created_at, y: stat.participant_count });
            data.voices.push({ x: stat.created_at, y: stat.voice_participant_count });
            data.videos.push({ x: stat.created_at, y: stat.video_count });
          });

          this.meeting_stats = {
            datasets: [{
              label: 'Teilnehmer',
              backgroundColor: '#9C132E',
              borderColor: '#9C132E',
              fill: false,
              cubicInterpolationMode: 'monotone',
              data: data.participants
            },
            {
              label: 'Mikrofon',
              backgroundColor: '#00B8E4',
              borderColor: '#00B8E4',
              fill: false,
              cubicInterpolationMode: 'monotone',
              data: data.voices
            },
            {
              label: 'Webcam',
              backgroundColor: '#F4AA00',
              borderColor: '#F4AA00',
              fill: false,
              cubicInterpolationMode: 'monotone',
              data: data.videos
            }]
          };

          this.showStats = true;
        }).catch((error) => {
          this.statsLoadingError = true;
          Base.error(error, this.$root);
        }).finally(() => {
          this.loadingStats = false;
        });
    },

    loadMeetingAttendance (meeting) {
      this.loadingStats = true;
      Base.call('meetings/' + meeting.id + '/attendance')
        .then(response => {
          // fetch successful
          this.currentMeeting = meeting;
          this.attendance = response.data.data;
          this.showAttendance = true;
        }).catch((error) => {
          this.statsLoadingError = true;
          Base.error(error, this.$root);
        }).finally(() => {
          this.loadingStats = false;
        });
    }
  },
  computed: {

    ...mapGetters({
      settings: 'session/settings'
    }),

    tableFields () {
      return [
        { key: 'start', label: this.$t('meetings.start'), sortable: true },
        { key: 'end', label: this.$t('meetings.end'), sortable: true },
        { key: 'actions', label: this.$t('app.actions'), sortable: false, thClass: 'actionColumn' }
      ];
    },

    attendanceTableFields () {
      return [
        {
          key: 'name',
          label: this.$t('meetings.attendance.name'),
          sortable: true
        },
        {
          key: 'email',
          label: this.$t('meetings.attendance.email'),
          sortable: true
        },
        {
          key: 'duration',
          label: this.$t('meetings.attendance.duration'),
          sortable: true
        },
        {
          key: 'sessions',
          label: this.$t('meetings.attendance.sessions'),
          sortable: false
        }
      ];
    }
  }
};
</script>
<style scoped></style>
