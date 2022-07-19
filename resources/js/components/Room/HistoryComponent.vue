<template>
  <div>
    <b-overlay  :show="meetingsLoadingError" >
      <!-- Overlay on loading and errors -->
      <template #overlay>
        <div class="text-center my-2">
          <b-spinner v-if="meetingsLoading" ></b-spinner>
          <b-button
            v-else
            @click="$root.$emit('bv::refresh::table', 'meetings-table')"
          >
            <i class="fa-solid fa-sync"></i> {{ $t('app.reload') }}
          </b-button>
        </div>
      </template>

      <div class="row">
        <div class="col-12">
          <!-- Reload meetings list -->
          <b-button
            class="float-right"
            variant="dark"
            :disabled="meetingsLoading"
            @click="$root.$emit('bv::refresh::table', 'meetings-table')"
            :title="$t('app.reload')"
            v-b-tooltip.hover
          >
            <i class="fa-solid fa-sync"></i>
          </b-button>
        </div>
      </div>

      <!-- List of all meetings -->
      <div class="row pt-4">
        <div class="col-12">
          <b-table
            fixed
            hover
            stacked='lg'
            :show-empty="!meetingsLoadingError"
            :busy.sync='meetingsLoading'
            :fields='meetingsTableFields'
            :items='fetchMeetings'
            id='meetings-table'
            ref='meetings'
            :current-page='meetingsMeta.current_page'>

            <template v-slot:empty>
              <i>{{ $t('meetings.noHistoricalData') }}</i>
            </template>

            <template v-slot:table-busy>
              <div class="text-center my-2" v-if="!meetingsLoadingError">
                <b-spinner className="align-middle"></b-spinner>
              </div>
            </template>

            <template v-slot:cell(start)="data">
              {{ $d(new Date(data.item.start),'datetimeShort') }}
            </template>

            <template v-slot:cell(end)="data">
              {{ data.item.end == null ? $t('meetings.now') : $d(new Date(data.item.end),'datetimeShort') }}
            </template>

            <template v-slot:cell(actions)="data">
              <b-button
                v-b-tooltip.hover
                :title="$t('meetings.viewMeetingStats')"
                :disabled='meetingsLoading || statsLoading || attendanceLoading'
                v-if="data.item.statistical"
                variant='primary'
                @click="loadMeetingStats(data.item)"
              >
                <i class='fa-solid fa-chart-line'></i>
              </b-button>
              <b-button
                v-b-tooltip.hover
                :title="$t('meetings.viewMeetingAttendance')"
                :disabled='meetingsLoading || statsLoading || attendanceLoading'
                v-if="data.item.attendance && data.item.end != null"
                variant='primary'
                @click="loadMeetingAttendance(data.item)"
              >
                <i class="fa-solid fa-user-clock"></i>
              </b-button>
            </template>
          </b-table>
          <b-pagination
            v-model='meetingsMeta.current_page'
            :total-rows='meetingsMeta.total'
            :per-page='meetingsMeta.per_page'
            aria-controls='meetings-table'
            @input="$root.$emit('bv::refresh::table', 'meetings-table')"
            align='center'
            :disabled='meetingsLoading || meetingsLoadingError'
          ></b-pagination>

          <div v-if="settings('attendance.enabled') || settings('statistics.meetings.enabled')" id="retentionPeriodInfo">
            <hr>
            <b>{{ $t('meetings.retentionPeriod') }}</b><br>
            <span v-if="settings('statistics.meetings.enabled')">{{ $t('meetings.stats.retentionPeriod', {'days': settings('statistics.meetings.retention_period')}) }}</span><br>
            <span v-if="settings('attendance.enabled')">{{ $t('meetings.attendance.retentionPeriod', {'days': settings('attendance.retention_period')}) }}</span><br>
          </div>
        </div>
      </div>

      <!-- Statistics modal -->
      <b-modal :static="modalStatic" size="xl" hide-footer id="statsModal">
        <template #modal-title>
          <h5 v-if="statsMeeting">{{ $t('meetings.stats.modalTitle',{room: room.name }) }}
          <br><small>{{ $d(new Date(statsMeeting.start),'datetimeShort') }} <raw-text>-</raw-text> {{ statsMeeting.end == null ? $t('meetings.now') : $d(new Date(statsMeeting.end),'datetimeShort') }}</small>
          </h5>
        </template>
        <b-alert show variant="info"><i class="fa-solid fa-info-circle"></i> {{ $t('meetings.stats.noBreakoutSupport')}}</b-alert>

        <line-chart v-if="statsMeeting" :height="250" :chart-data="chartData" :chart-options="chartOptions"></line-chart>
      </b-modal>
      <!-- Attendance modal -->
      <b-modal :static="modalStatic" size="xl" hide-footer id="attendanceModal" title-tag="div" title-class="w-100">
        <template #modal-title >
          <div class="d-flex justify-content-between align-items-center">
            <h5 v-if="attendanceMeeting">{{ $t('meetings.attendance.modalTitle',{room: room.name}) }}
              <br><small>{{ $d(new Date(attendanceMeeting.start),'datetimeShort') }} <raw-text>-</raw-text> {{ $d(new Date(attendanceMeeting.end),'datetimeShort') }}</small>
            </h5>
            <div v-if="attendanceMeeting"><b-button target="_blank" :href="'/download/attendance/'+attendanceMeeting.id" ><i class="fa-solid fa-file-excel"></i> {{ $t('meetings.attendance.download') }}</b-button></div>
          </div>
        </template>
        <b-alert show variant="info"><i class="fa-solid fa-info-circle"></i> {{ $t('meetings.attendance.noBreakoutSupport')}}</b-alert>

        <b-table
          id='attendance-table'
          :current-page="attendanceCurrentPage"
          :per-page="settings('pagination_page_size')"
          :fields="attendanceTableFields"
          sort-by="name"
          v-if="attendance"
          :items="attendance"
          hover
          stacked="md"
          show-empty
        >
          <!-- Show message on empty attendance list -->
          <template v-slot:empty>
            <i>{{ $t('meetings.attendance.nodata') }}</i>
          </template>

          <template v-slot:cell(email)="data">
            {{ data.item.email || "---" }}
          </template>

          <template v-slot:cell(duration)="data">
            {{ $t('meetings.attendance.durationMinute',{duration: data.item.duration}) }}
          </template>

          <template v-slot:cell(sessions)="data">
            <p v-for="session in data.item.sessions" :key="session.id" >{{ $d(new Date(session.join),'datetimeShort') }} <raw-text>-</raw-text> {{ $d(new Date(session.leave),'datetimeShort') }} <raw-text>(</raw-text>{{ $t('meetings.attendance.durationMinute',{duration: session.duration})}}<raw-text>)</raw-text></p>
          </template>
        </b-table>
        <b-pagination
          v-if="attendance.length>settings('pagination_page_size')"
          v-model="attendanceCurrentPage"
          :total-rows="attendance.length"
          :per-page="settings('pagination_page_size')"
          aria-controls='attendance-table'
          align='center'
        ></b-pagination>
      </b-modal>

    </b-overlay>
  </div>
</template>

<script>
import Base from '../../api/base';
import LineChart from './../../charts/LineChart';
import { mapGetters } from 'vuex';
import RawText from '../RawText';

export default {
  components: { RawText, LineChart },
  props: {
    room: Object,
    modalStatic: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      // list of meetings
      meetingsLoading: false,
      meetingsLoadingError: false,
      meetingsMeta: {
        current_page: undefined,
        total: undefined,
        per_page: undefined
      },

      // statistics of meeting
      statsLoading: false,
      statsMeeting: null,
      chartDataRows: {
        participants: [],
        voices: [],
        videos: []
      },

      // attendance of meeting
      attendanceLoading: false,
      attendanceMeeting: null,
      attendance: [],
      attendanceCurrentPage: 1
    };
  },
  methods: {
    /**
     * Loads the current and previous meetings of a given room and calls on finish the callback function.
     *
     * @param ctx Context information e.g. the current the page.
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

      Base.call('rooms/' + this.room.id + '/meetings', config).then(response => {
        this.meetingsMeta = response.data.meta;
        data = response.data.data;
        this.meetingsLoadingError = false;
      }).catch(error => {
        this.meetingsLoadingError = true;
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        callback(data);
      });

      return null;
    },

    /**
     * Load statistics for given meeting
     * @param meeting
     */
    loadMeetingStats (meeting) {
      // enable loading indicator
      this.statsLoading = true;
      Base.call('meetings/' + meeting.id + '/stats')
        .then(response => {
          // set currentMeeting to the fetched meeting to show meeting start and end in modal
          this.statsMeeting = meeting;

          // parse statistical data to format that can be used by the computed property chartData
          this.chartDataRows = {
            participants: [],
            voices: [],
            videos: []
          };
          response.data.data.forEach(stat => {
            const datetime = stat.created_at;
            this.chartDataRows.participants.push({ x: datetime, y: stat.participant_count });
            this.chartDataRows.voices.push({ x: datetime, y: stat.voice_participant_count });
            this.chartDataRows.videos.push({ x: datetime, y: stat.video_count });
          });

          // show modal
          this.$bvModal.show('statsModal');
        }).catch((error) => {
          // error during stats loading
          Base.error(error, this.$root);
        }).finally(() => {
          // disable loading indicator
          this.statsLoading = false;
        });
    },

    /**
     * Load attendance for given meeting
     * @param meeting
     */
    loadMeetingAttendance (meeting) {
      this.attendanceLoading = true;
      Base.call('meetings/' + meeting.id + '/attendance')
        .then(response => {
          // set currentMeeting to the fetched meeting to show meeting start and end in modal
          this.attendanceMeeting = meeting;
          // set attendance data
          this.attendance = response.data.data;
          // show modal
          this.$bvModal.show('attendanceModal');
        }).catch((error) => {
          Base.error(error, this.$root);
        }).finally(() => {
          this.attendanceLoading = false;
        });
    }
  },
  computed: {

    ...mapGetters({
      settings: 'session/settings'
    }),

    // table fields of meetings table
    meetingsTableFields () {
      const table = [
        { key: 'start', label: this.$t('meetings.start'), sortable: false },
        { key: 'end', label: this.$t('meetings.end'), sortable: false }
      ];

      if (this.settings('attendance.enabled') || this.settings('statistics.meetings.enabled')) {
        table.push({ key: 'actions', label: this.$t('app.actions'), sortable: false, thClass: 'actionColumn' });
      }

      return table;
    },

    // table fields of attendance table
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
    },

    // chart options for chart.js display of meeting statistics
    chartOptions () {
      return {
        responsive: true,
        scales: {
          xAxes: [{
            type: 'time',
            time: {
              unit: 'minute'
            },
            display: true,
            scaleLabel: {
              display: true,
              labelString: this.$t('meetings.stats.time')
            },
            ticks: {
              major: {
                fontStyle: 'bold',
                fontColor: '#FF0000'
              },
              /**
               * Callback to set the ticks label of the x-axes
               * @param label the tick value in the internal data format of the associated scale
               * @param index the tick index in the ticks array
               * @param ticks the array containing all of the tick objects
               * @return {string} Localised human readable string with the timezone of the user
               */
              callback: (label, index, ticks) => {
                // get value of the current tick that is the unix timestamp chart-js parsed from the ISO 8601 datetime string
                return this.$d(ticks[index].value, 'time');
              }
            }
          }],
          yAxes: [{
            scaleLabel: {
              display: true,
              labelString: this.$t('meetings.stats.amount')
            }
          }]
        },
        tooltips: {
          callbacks: {
            /**
             * Callback to set the title of the tooltip (hover on datapoint)
             * @param data Array with charts x-y data of this datapoint
             * @return {string} Localised human readable string with the timezone of the user
             */
            title: (data) => {
              // get xLabel of the first dataset (all have the same xLabel) that is a ISO 8601 datetime string
              return this.$d(new Date(data[0].xLabel), 'datetimeShort');
            }
          }
        }
      };
    },

    // chart datasets for chart.js display of meeting statistics
    chartData () {
      return {
        datasets: [{
          label: this.$t('meetings.stats.participants'),
          backgroundColor: '#9C132E',
          borderColor: '#9C132E',
          fill: false,
          cubicInterpolationMode: 'monotone',
          data: this.chartDataRows.participants
        },
        {
          label: this.$t('meetings.stats.voices'),
          backgroundColor: '#00B8E4',
          borderColor: '#00B8E4',
          fill: false,
          cubicInterpolationMode: 'monotone',
          data: this.chartDataRows.voices
        },
        {
          label: this.$t('meetings.stats.videos'),
          backgroundColor: '#F4AA00',
          borderColor: '#F4AA00',
          fill: false,
          cubicInterpolationMode: 'monotone',
          data: this.chartDataRows.videos
        }]
      };
    }

  }
};
</script>
<style scoped></style>
