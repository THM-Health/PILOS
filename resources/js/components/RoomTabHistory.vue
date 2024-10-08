<template>
  <div>

    <div class="flex justify-between flex-col lg:flex-row items-start gap-2 px-2">
      <div>
        <!-- Search field, currently not implemented -->
      </div>
      <div class="w-full lg:w-auto grow lg:grow-0 flex justify-between flex-wrap items-start gap-2">
        <div class="flex gap-2">
          <InputGroup class="w-auto">
            <InputGroupAddon>
              <i class="fa-solid fa-sort"></i>
            </InputGroupAddon>
            <Select :disabled="isBusy" v-model="sortField" :options="sortFields" @change="loadData(1)" option-label="name" option-value="value" />
            <InputGroupAddon class="p-0">
              <Button :disabled="isBusy" :icon="sortOrder === 1 ? 'fa-solid fa-arrow-up-short-wide' : 'fa-solid fa-arrow-down-wide-short'" @click="toggleSortOrder" severity="secondary" text class="rounded-l-none"  />
            </InputGroupAddon>
          </InputGroup>
        </div>
        <!-- Reload -->
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

    <!-- List of all meetings -->
    <OverlayComponent :show="isBusy || loadingError" z-index="1">
      <template #overlay>
        <LoadingRetryButton :error="loadingError" @reload="loadData()" />
      </template>
      <DataView
        :totalRecords="paginator.getTotalRecords()"
        :rows="paginator.getRows()"
        :first="paginator.getFirst()"
        @update:first="paginator.setFirst($event)"
        :value="meetings"
        lazy
        dataKey="id"
        paginator
        :paginator-template="paginator.getTemplate()"
        :current-page-report-template="paginator.getCurrentPageReportTemplate()"
        rowHover
        @page="onPage"
        class="mt-6"
      >
        <!-- Show message on empty list -->
        <template #empty>
          <div class="px-2">
            <InlineNote v-if="!isBusy && !loadingError">{{ $t('meetings.no_historical_data') }}</InlineNote>
          </div>
        </template>

        <template #list="slotProps">
          <div class="px-2">
            <div v-for="(item) in slotProps.items" :key="item.id">
              <div class="flex flex-col md:flex-row justify-between gap-4 py-4 border-t border-surface">
                <div class="flex flex-col gap-2">
                  <p class="text-lg font-semibold m-0">{{ $d(new Date(item.start),'datetimeShort') }}</p>
                  <div class="flex flex-col gap-2 items-start">
                    <div class="flex flex-row gap-2">
                      <i class="fa-solid fa-hourglass" />
                      <p class="text-sm m-0" v-tooltip.bottom="$d(new Date(item.start),'datetimeShort')+' - '+(item.end == null ? $t('meetings.now') : $d(new Date(item.end),'datetimeShort'))">
                        {{ dateDiff.format(new Date(item.start), item.end == null ? new Date() : new Date(item.end)) }}
                      </p>
                    </div>
                  </div>
                </div>
                <div class="shrink-0 flex flex-row gap-1 items-start justify-end" >
                  <RoomTabHistoryStatisticButton
                    v-if="item.statistical"
                    :room-id="props.room.id"
                    :meeting-id="item.id"
                    :start="item.start"
                    :end="item.end"
                    :room-name="props.room.name"
                  />
                  <RoomTabHistoryAttendanceButton
                    v-if="item.attendance && item.end != null"
                    :room-id="props.room.id"
                    :meeting-id="item.id"
                    :start="item.start"
                    :end="item.end"
                    :room-name="props.room.name"
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
        <p class="text-xl font-semibold">{{ $t('meetings.retention_period') }}</p><br>
        <span v-if="settingsStore.getSetting('recording.meeting_usage_enabled') && settingsStore.getSetting('recording.meeting_usage_retention_period') !== -1">{{ $t('meetings.stats.retention_period', {'days': settingsStore.getSetting('recording.meeting_usage_retention_period')}) }}</span><br>
        <span v-if="settingsStore.getSetting('recording.meeting_usage_enabled') && settingsStore.getSetting('recording.meeting_usage_retention_period') === -1">{{ $t('meetings.stats.retention_period_unlimited') }}</span><br>

        <span v-if="settingsStore.getSetting('recording.attendance_retention_period') !== -1">{{ $t('meetings.attendance.retention_period', {'days': settingsStore.getSetting('recording.attendance_retention_period')}) }}</span><br>
        <span v-if="settingsStore.getSetting('recording.attendance_retention_period') === -1">{{ $t('meetings.attendance.retention_period_unlimited') }}</span><br>
      </div>
    </Message>
  </div>
</template>

<script setup>
import { useSettingsStore } from '../stores/settings';
import { useApi } from '../composables/useApi.js';
import { computed, onMounted, ref } from 'vue';
import { useDateDiff } from '../composables/useDateDiff.js';
import { useI18n } from 'vue-i18n';
import { usePaginator } from '../composables/usePaginator.js';

const props = defineProps({
  room: Object
});

const api = useApi();
const settingsStore = useSettingsStore();
const dateDiff = useDateDiff();
const { t } = useI18n();
const paginator = usePaginator();

const meetings = ref([]);
const isBusy = ref(false);
const loadingError = ref(false);
const sortField = ref('start');
const sortOrder = ref(0);

const sortFields = computed(() => [
  { name: t('meetings.start'), value: 'start' }
]);

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 1 ? 0 : 1;
  loadData(1);
};

/**
 * Loads the current and previous meetings of a given room
 */
function loadData (page = null) {
  isBusy.value = true;
  loadingError.value = false;

  const config = {
    params: {
      page: page || paginator.getCurrentPage(),
      sort_by: sortField.value,
      sort_direction: sortOrder.value === 1 ? 'asc' : 'desc'
    }
  };

  api.call('rooms/' + props.room.id + '/meetings', config).then(response => {
    meetings.value = response.data.data;
    paginator.updateMeta(response.data.meta).then(() => {
      if (paginator.isOutOfRange()) {
        loadData(paginator.getLastPage());
      }
    });
  }).catch(error => {
    paginator.revertFirst();
    api.error(error, { noRedirectOnUnauthenticated: true });
    loadingError.value = true;
  }).finally(() => {
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
<style scoped></style>
