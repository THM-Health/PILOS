<template>
  <b-container class="mt-3 mb-5">
    <b-row class="mb-3">
      <b-col>
        <h2>
          {{ $t('meetings.currently_running') }}
        </h2>
      </b-col>
      <b-col
        sm="12"
        md="3"
      >
        <b-input-group>
          <b-form-input
            ref="search"
            v-model="filter"
            :disabled="isBusy || loadingError"
            :placeholder="$t('app.search')"
            lazy
          />
          <b-input-group-append>
            <b-button
              :disabled="isBusy || loadingError"
              variant="primary"
              @click="$root.$emit('bv::refresh::table', 'meetings-table')"
            >
              <i class="fa-solid fa-magnifying-glass" />
            </b-button>
          </b-input-group-append>
        </b-input-group>
      </b-col>
    </b-row>
    <hr>

    <b-overlay :show="loadingError">
      <template #overlay>
        <div class="text-center my-2">
          <b-spinner v-if="isBusy" />
          <b-button
            v-else
            @click="$root.$emit('bv::refresh::table', 'meetings-table')"
          >
            <i class="fa-solid fa-sync" /> {{ $t('app.reload') }}
          </b-button>
        </div>
      </template>

      <b-table
        id="meetings-table"
        ref="meetings"
        fixed
        hover
        stacked="lg"
        show-empty
        :busy.sync="isBusy"
        :fields="tableFields"
        :items="fetchMeetings"
        :filter="filter"
        :current-page="currentPage"
      >
        <template #empty>
          <i>{{ $t('meetings.no_data') }}</i>
        </template>

        <template #emptyfiltered>
          <i>{{ $t('meetings.no_data_filtered') }}</i>
        </template>

        <template #table-busy>
          <div
            v-if="!loadingError"
            class="text-center my-2"
          >
            <b-spinner class-name="align-middle" />
          </div>
        </template>

        <!-- A custom formatted header cell for field 'name' -->
        <template #head(room.listener_count)>
          <i
            v-b-tooltip.hover
            :title="$t('meetings.listener_count')"
            class="fa-solid fa-headphones"
          />
        </template>
        <template #head(room.voice_participant_count)>
          <i
            v-b-tooltip.hover
            :title="$t('meetings.voice_participant_count')"
            class="fa-solid fa-microphone"
          />
        </template>
        <template #head(room.video_count)>
          <i
            v-b-tooltip.hover
            :title="$t('meetings.video_count')"
            class="fa-solid fa-video"
          />
        </template>
        <template #head(room.participant_count)>
          <i
            v-b-tooltip.hover
            :title="$t('meetings.participant_count')"
            class="fa-solid fa-users"
          />
        </template>

        <template #cell(start)="data">
          {{ $d(new Date(data.item.start),'datetimeShort') }}
        </template>

        <template #cell(room.name)="data">
          <text-truncate>
            {{ data.item.room.name }}
          </text-truncate>
        </template>

        <template #cell(room.owner)="data">
          <text-truncate>
            {{ data.item.room.owner }}
          </text-truncate>
        </template>

        <template #cell(server.name)="data">
          <text-truncate>
            {{ data.item.server.name }}
          </text-truncate>
        </template>

        <template #cell(room.listener_count)="data">
          <span v-if="data.item.room.listener_count !== null">{{ data.item.room.listener_count }}</span>
          <raw-text v-else>
            ---
          </raw-text>
        </template>
        <template #cell(room.voice_participant_count)="data">
          <span v-if="data.item.room.voice_participant_count !== null">{{ data.item.room.voice_participant_count }}</span>
          <raw-text v-else>
            ---
          </raw-text>
        </template>
        <template #cell(room.video_count)="data">
          <span v-if="data.item.room.video_count !== null">{{ data.item.room.video_count }}</span>
          <raw-text v-else>
            ---
          </raw-text>
        </template>
        <template #cell(room.participant_count)="data">
          <span v-if="data.item.room.participant_count !== null">{{ data.item.room.participant_count }}</span>
          <raw-text v-else>
            ---
          </raw-text>
        </template>

        <template #cell(actions)="data">
          <b-button
            v-b-tooltip.hover
            v-tooltip-hide-click
            :title="$t('meetings.view_room', { name: data.item.room.name })"
            :disabled="isBusy"
            variant="info"
            :to="{ name: 'rooms.view', params: { id: data.item.room.id } }"
          >
            <i class="fa-solid fa-eye" />
          </b-button>
        </template>
      </b-table>

      <b-pagination
        v-model="currentPage"
        :total-rows="total"
        :per-page="perPage"
        aria-controls="meetings-table"
        align="center"
        :disabled="isBusy || loadingError"
        @input="$root.$emit('bv::refresh::table', 'meetings-table')"
      />
    </b-overlay>
  </b-container>
</template>

<script>
import Base from '@/api/base';
import RawText from '@/components/RawText.vue';
import TextTruncate from '@/components/TextTruncate.vue';

export default {
  components: { TextTruncate, RawText },

  data () {
    return {
      isBusy: false,
      loadingError: false,
      currentPage: undefined,
      total: undefined,
      perPage: undefined,
      filter: undefined
    };
  },

  computed: {

    tableFields () {
      return [
        { key: 'start', label: this.$t('meetings.start'), sortable: true, thStyle: { width: '120px' } },
        { key: 'room.name', label: this.$t('rooms.name'), sortable: false, tdClass: 'td-max-width-0-lg' },
        { key: 'room.owner', label: this.$t('meetings.owner'), sortable: false, tdClass: 'td-max-width-0-lg' },
        { key: 'server.name', label: this.$t('app.server'), sortable: false, tdClass: 'td-max-width-0-lg' },
        { key: 'room.participant_count', label: this.$t('meetings.participant_count'), sortable: true, thStyle: { width: '64px' } },
        { key: 'room.listener_count', label: this.$t('meetings.listener_count'), sortable: true, thStyle: { width: '64px' } },
        { key: 'room.voice_participant_count', label: this.$t('meetings.voice_participant_count'), sortable: true, thStyle: { width: '64px' } },
        { key: 'room.video_count', label: this.$t('meetings.video_count'), sortable: true, thStyle: { width: '64px' } },
        { key: 'actions', label: this.$t('app.actions'), sortable: false, thStyle: { width: '100px' } }
      ];
    }
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
