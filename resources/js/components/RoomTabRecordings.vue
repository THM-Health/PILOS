<template>
  <div>
    <div class="flex justify-between flex-col-reverse lg:flex-row gap-2 px-2">
      <div class="flex justify-between flex-col lg:flex-row grow gap-2">
        <div>
          <InputGroup>
            <InputText
              v-model="search"
              :disabled="isBusy"
              :placeholder="$t('app.search')"
              @keyup.enter="loadData(1)"
            />
            <Button
              :disabled="isBusy"
              @click="loadData(1)"
              v-tooltip="$t('app.search')"
              :aria-label="$t('app.search')"
              icon="fa-solid fa-magnifying-glass"
            />
          </InputGroup>
        </div>
        <div class="flex gap-2 flex-col lg:flex-row">
          <InputGroup v-if="userPermissions.can('manageSettings', props.room)">
            <InputGroupAddon>
              <i class="fa-solid fa-filter"></i>
            </InputGroupAddon>
            <Select :disabled="isBusy" v-model="filter" :options="filterOptions" @change="loadData(1)" option-label="name" option-value="value" />
          </InputGroup>

          <InputGroup>
            <InputGroupAddon>
              <i class="fa-solid fa-sort"></i>
            </InputGroupAddon>
            <Select :disabled="isBusy" v-model="sortField" :options="sortFields" @change="loadData(1)" option-label="name" option-value="value" />
            <InputGroupAddon class="p-0">
              <Button :disabled="isBusy" :icon="sortOrder === 1 ? 'fa-solid fa-arrow-up-short-wide' : 'fa-solid fa-arrow-down-wide-short'" @click="toggleSortOrder" severity="secondary" text class="rounded-l-none"  />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
      <div class="flex gap-2 justify-end">
        <!-- Reload list -->
        <Button
          class="shrink-0"
          v-tooltip="$t('app.reload')"
          severity="secondary"
          :disabled="isBusy"
          @click="loadData()"
          icon="fa-solid fa-sync"
        />
      </div>
    </div>

    <OverlayComponent :show="isBusy || loadingError" z-index="1">
      <template #overlay>
        <LoadingRetryButton :error="loadingError" @reload="loadData()" />
      </template>

      <!-- Display recordings -->
      <DataView
        :totalRecords="paginator.getTotalRecords()"
        :rows="paginator.getRows()"
        :first="paginator.getFirst()"
        :value="recordings"
        lazy
        dataKey="id"
        paginator
        :paginator-template="paginator.getTemplate()"
        :current-page-report-template="paginator.getCurrentPageReportTemplate()"
        :loading="isBusy"
        rowHover
        @page="onPage"
        class="mt-6"
      >

        <!-- Show message on empty recording list -->
        <template #empty>
          <div>
            <div class="px-2" v-if="!isBusy && !loadingError">
              <InlineNote v-if="paginator.isEmptyUnfiltered()">{{ $t('rooms.recordings.nodata') }}</InlineNote>
              <InlineNote v-else>{{ $t('app.filter_no_results') }}</InlineNote>
            </div>
          </div>
        </template>

        <template #list="slotProps">
          <div class="px-2">
            <div v-for="(item, index) in slotProps.items" :key="index">
              <div class="flex flex-col md:flex-row justify-between gap-4 py-4 border-t border-surface">
                <div class="flex flex-col gap-2">
                  <p class="text-lg font-semibold m-0">{{ item.description }}</p>
                  <div class="flex flex-col gap-2 items-start">
                    <div class="flex flex-row gap-2">
                      <i class="fa-solid fa-clock" />
                      <p class="text-sm m-0">{{ $d(new Date(item.start),'datetimeShort') }}</p>
                    </div>
                    <div class="flex flex-row gap-2">
                      <i class="fa-solid fa-hourglass" />
                      <p class="text-sm m-0" v-tooltip.bottom="$d(new Date(item.start),'datetimeShort')+' - '+(item.end == null ? $t('meetings.now') : $d(new Date(item.end),'datetimeShort'))">
                        {{ dateDiff.format(new Date(item.start), new Date(item.end)) }}
                      </p>
                    </div>
                    <div class="flex flex-row gap-2" v-if="userPermissions.can('manageSettings', props.room)">
                      <i class="fa-solid fa-lock"></i>
                      <RoomRecordingAccessBadge :access="item.access" />
                    </div>
                  </div>
                  <div class="flex flex-row flex-wrap gap-1" v-if="userPermissions.can('manageSettings', props.room)">
                    <Tag
                      v-for="format in item.formats"
                      :key="format.id"
                      :value="$t('rooms.recordings.format_types.'+format.format)"
                      :icon="format.disabled ? 'fa-solid fa-eye-slash' : ''"
                    />
                  </div>
                </div>
                <div class="shrink-0 flex flex-row gap-1 items-start justify-end" >

                  <RoomTabRecordingsViewButton
                    :roomId="props.room.id"
                    :recordingId="item.id"
                    :formats="item.formats"
                    :hide-disabled-formats="!userPermissions.can('manageSettings', room)"
                    :token="props.token"
                    :start="item.start"
                    :end="item.end"
                    :description="item.description"
                    :access-code="props.accessCode"
                    :disabled="isBusy"
                    @invalidCode="$emit('invalidCode')"
                    @invalidToken="$emit('invalidToken')"
                    @forbidden="loadData"
                    @notFound="loadData"
                  />

                  <RoomTabRecordingsDownloadButton
                    :recordingId="item.id"
                    :disabled="isBusy"
                    v-if="userPermissions.can('manageSettings', props.room)"
                  />

                  <!-- Edit button -->
                  <RoomTabRecordingsEditButton
                    v-if="userPermissions.can('manageSettings', props.room)"
                    :roomId="props.room.id"
                    :recordingId="item.id"
                    :description="item.description"
                    :start="item.start"
                    :end="item.end"
                    :formats="item.formats"
                    :access="item.access"
                    :disabled="isBusy"
                    @edited="loadData()"
                    @not-found="loadData()"
                  />

                  <!-- Delete file -->
                  <RoomTabRecordingsDeleteButton
                    v-if="userPermissions.can('manageSettings', props.room)"
                    :roomId="props.room.id"
                    :recordingId="item.id"
                    :disabled="isBusy"
                    @deleted="loadData()"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </DataView>
    </OverlayComponent>

    <Message class="mt-2" severity="secondary" id="retentionPeriodInfo" aria-live="off" role="presentation">
      <div class="leading-3 font-normal">
        <p class="text-xl font-semibold">{{ $t('rooms.recordings.retention_period.title') }}</p><br>
        <span v-if="settingsStore.getSetting('recording.recording_retention_period') !== -1">{{ $t('rooms.recordings.retention_period.days', {'days': settingsStore.getSetting('recording.recording_retention_period')}) }}</span><br>
        <span v-if="settingsStore.getSetting('recording.recording_retention_period') === -1">{{ $t('rooms.recordings.retention_period.unlimited') }}</span><br>
      </div>
    </Message>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue';
import { useApi } from '../composables/useApi.js';
import { useUserPermissions } from '../composables/useUserPermission.js';
import RoomTabRecordingsDownloadButton from './RoomTabRecordingsDownloadButton.vue';
import { useSettingsStore } from '../stores/settings.js';
import { usePaginator } from '../composables/usePaginator.js';
import { useDateDiff } from '../composables/useDateDiff.js';
import { useI18n } from 'vue-i18n';
import env from '../env.js';

const props = defineProps({
  room: {
    type: Object,
    required: true
  },
  accessCode: {
    type: Number,
    required: false
  },
  token: {
    type: String,
    required: false
  }
});

const emit = defineEmits(['invalidCode', 'invalidToken']);

const api = useApi();
const userPermissions = useUserPermissions();
const settingsStore = useSettingsStore();
const paginator = usePaginator();
const dateDiff = useDateDiff();
const { t } = useI18n();

const isBusy = ref(false);
const loadingError = ref(false);

const recordings = ref([]);
const sortField = ref('start');
const sortOrder = ref(0);

const search = ref('');
const filter = ref('all');

const sortFields = computed(() => [
  { name: t('rooms.recordings.sort.description'), value: 'description' },
  { name: t('rooms.recordings.sort.start'), value: 'start' }
]);

const filterOptions = computed(() => [
  { name: t('rooms.recordings.filter.all'), value: 'all' },
  { name: t('rooms.recordings.filter.everyone_access'), value: 'everyone_access' },
  { name: t('rooms.recordings.filter.participant_access'), value: 'participant_access' },
  { name: t('rooms.recordings.filter.moderator_access'), value: 'moderator_access' },
  { name: t('rooms.recordings.filter.owner_access'), value: 'owner_access' }
]);

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 1 ? 0 : 1;
  loadData(1);
};

/**
 * reload recordings list from api
 */
function loadData (page = null) {
  // enable data loading indicator
  isBusy.value = true;
  loadingError.value = false;

  // make request to load recordings
  const config = {
    params: {
      page: page || paginator.getCurrentPage(),
      sort_by: sortField.value,
      sort_direction: sortOrder.value === 1 ? 'asc' : 'desc',
      search: search.value === '' ? null : search.value,
      filter: filter.value === 'all' ? null : filter.value
    }
  };

  if (props.token) {
    config.headers = { Token: props.token };
  } else if (props.accessCode != null) {
    config.headers = { 'Access-Code': props.accessCode };
  }

  api.call('rooms/' + props.room.id + '/recordings', config)
    .then(response => {
      // fetching successful
      recordings.value = response.data.data;
      paginator.updateMeta(response.data.meta).then(() => {
        if (paginator.isOutOfRange()) {
          loadData(paginator.getLastPage());
        }
      });
    })
    .catch((error) => {
      if (error.response) {
        // Access code invalid
        if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_code') {
          return emit('invalidCode');
        }

        // Room token is invalid
        if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_token') {
          return emit('invalidToken');
        }

        // Forbidden, require access code
        if (error.response.status === env.HTTP_FORBIDDEN && error.response.data.message === 'require_code') {
          return emit('invalidCode');
        }
      }
      loadingError.value = true;
      api.error(error);
    })
    .finally(() => {
      isBusy.value = false;
    });
}

function onPage (event) {
  loadData(event.page + 1);
}

onMounted(() => {
  loadData();
});

</script>
