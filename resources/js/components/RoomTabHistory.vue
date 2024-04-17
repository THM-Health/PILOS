<template>
  <div>

    <div class="flex flex-wrap gap-2 justify-content-end flex-row">
      <!-- Reload list -->
      <div class="flex justify-content-end">
        <Button
          v-tooltip="$t('app.reload')"
          severity="secondary"
          :disabled="isBusy"
          @click="loadData"
          icon="fa-solid fa-sync"
        />
      </div>
    </div>

    <!-- List of all meetings -->
    <DataTable
      :totalRecords="meta.total"
      :rows="meta.per_page"
      :value="meetings"
      dataKey="id"
      paginator
      :paginator-template="paginatorDefaults.getTemplate()"
      :current-page-report-template="paginatorDefaults.getCurrentPageReportTemplate()"
      :loading="isBusy || loadingError"
      rowHover
      stripedRows
      scrollable
      lazy
      @page="onPage"
      class="mt-4 table-auto md:table-fixed"
    >
      <template #loading>
        <LoadingRetryButton :error="loadingError" @reload="loadData" />
      </template>

      <template #empty>
        <InlineNote v-if="!isBusy && !loadingError">{{ $t('meetings.no_historical_data') }}</InlineNote>
      </template>

      <Column field="start" :header="$t('meetings.start')">
        <template #body="slotProps">
          {{ $d(new Date(slotProps.data.start),'datetimeShort') }}
        </template>
      </Column>

      <Column field="end" :header="$t('meetings.end')">
        <template #body="slotProps">
          {{ slotProps.data.end == null ? $t('meetings.now') : $d(new Date(slotProps.data.end),'datetimeShort') }}
        </template>
      </Column>
      <Column
        :header="$t('app.actions')"
        class="action-column action-column-2"
      >
        <template #body="slotProps">
          <div>
            <RoomTabHistoryStatisticButton
              v-if="slotProps.data.statistical"
              :room-id="props.room.id"
              :meeting-id="slotProps.data.id"
              :start="slotProps.data.start"
              :end="slotProps.data.end"
              :room-name="props.room.name"
            />
            <RoomTabHistoryAttendanceButton
              v-if="slotProps.data.attendance && slotProps.data.end != null"
              :room-id="props.room.id"
              :meeting-id="slotProps.data.id"
              :start="slotProps.data.start"
              :end="slotProps.data.end"
              :room-name="props.room.name"
            />
          </div>
        </template>
      </Column>
    </DataTable>
    <div
      id="retentionPeriodInfo"
    >
      <Divider/>
      <b>{{ $t('meetings.retention_period') }}</b><br>
      <span v-if="settingsStore.getSetting('statistics.meetings.enabled') && settingsStore.getSetting('statistics.meetings.retention_period') !== -1">{{ $t('meetings.stats.retention_period', {'days': settingsStore.getSetting('statistics.meetings.retention_period')}) }}</span><br>
      <span v-if="settingsStore.getSetting('statistics.meetings.enabled') && settingsStore.getSetting('statistics.meetings.retention_period') === -1">{{ $t('meetings.stats.retention_period_unlimited') }}</span><br>

      <span v-if="settingsStore.getSetting('attendance.retention_period') !== -1">{{ $t('meetings.attendance.retention_period', {'days': settingsStore.getSetting('attendance.retention_period')}) }}</span><br>
      <span v-if="settingsStore.getSetting('attendance.retention_period') === -1">{{ $t('meetings.attendance.retention_period_unlimited') }}</span><br>
    </div>
  </div>
</template>

<script setup>
import { useSettingsStore } from '../stores/settings';
import { useApi } from '../composables/useApi.js';
import { onMounted, ref } from 'vue';
import { usePaginatorDefaults } from '../composables/usePaginatorDefaults.js';

const props = defineProps({
  room: Object
});

const api = useApi();
const settingsStore = useSettingsStore();
const paginatorDefaults = usePaginatorDefaults();

const meetings = ref([]);
const isBusy = ref(false);
const loadingError = ref(false);
const currentPage = ref(1);
const meta = ref({
  current_page: 0,
  from: 0,
  last_page: 0,
  per_page: 0,
  to: 0,
  total: 0
});

/**
 * Loads the current and previous meetings of a given room
 */
function loadData () {
  isBusy.value = true;
  loadingError.value = false;

  const config = {
    params: {
      page: currentPage.value
    }
  };

  api.call('rooms/' + props.room.id + '/meetings', config).then(response => {
    meetings.value = response.data.data;
    meta.value = response.data.meta;
  }).catch(error => {
    api.error(error);
    loadingError.value = true;
  }).finally(() => {
    isBusy.value = false;
  });
}

function onPage (event) {
  currentPage.value = event.page + 1;
  loadData();
}

onMounted(() => {
  loadData();
});
</script>
<style scoped></style>
