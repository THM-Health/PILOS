<template>
  <div>

    <div class="flex justify-content-between flex-column lg:flex-row align-items-start gap-2 px-2">
      <div>
        <!-- Search field, currently not implemented -->
      </div>
      <div class="w-full lg:w-auto flex-grow-1 lg:flex-grow-0 flex justify-content-between flex-wrap align-items-start gap-2">
        <div class="flex gap-2">
          <InputGroup class="w-auto">
            <InputGroupAddon>
              <i class="fa-solid fa-sort"></i>
            </InputGroupAddon>
            <Dropdown v-model="sortField" :options="sortFields" @change="loadData(1)" option-label="name" option-value="value" />
            <InputGroupAddon class="p-0">
              <Button :icon="sortOrder === 1 ? 'fa-solid fa-arrow-up-short-wide' : 'fa-solid fa-arrow-down-wide-short'" @click="toggleSortOrder" severity="secondary" text class="border-noround-left"  />
            </InputGroupAddon>
          </InputGroup>
        </div>
        <!-- Reload -->
        <Button
          class="flex-shrink-0"
          v-tooltip="$t('app.reload')"
          severity="secondary"
          :disabled="isBusy"
          @click="loadData()"
          icon="fa-solid fa-sync"
        />
      </div>
    </div>

    <!-- List of all meetings -->
    <OverlayComponent :show="isBusy" style="min-height: 4rem;">
      <DataView
        :totalRecords="meta.total"
        :rows="meta.per_page"
        :first="meta.from"
        :value="meetings"
        lazy
        dataKey="id"
        paginator
        rowHover
        @page="onPage"
        class="mt-4"
      >
        <!-- Show message on empty recording list -->
        <template #empty>
          <div class="px-2">
            <InlineNote v-if="!isBusy && !loadingError">{{ $t('meetings.no_historical_data') }}</InlineNote>
          </div>
        </template>

        <template #list="slotProps">
          <div class="px-2 border-top-1 border-bottom-1 surface-border">
            <div v-for="(item, index) in slotProps.items" :key="index">
              <div class="flex flex-column md:flex-row justify-content-between gap-3 py-3" :class="{ 'border-top-1 surface-border': index !== 0 }">
                <div class="flex flex-column gap-2">
                  <p class="text-lg font-semibold m-0">{{ $d(new Date(item.start),'datetimeShort') }}</p>
                  <div class="flex flex-column gap-2 align-items-start">
                    <div class="flex flex-row gap-2">
                      <i class="fa-solid fa-hourglass" />
                      <p class="text-sm m-0" v-tooltip.bottom="$d(new Date(item.start),'datetimeShort')+' - '+(item.end == null ? $t('meetings.now') : $d(new Date(item.end),'datetimeShort'))">
                        {{ dateDiff.format(new Date(item.start), item.end == null ? new Date() : new Date(item.end)) }}
                      </p>
                    </div>
                  </div>
                </div>
                <div class="flex-shrink-0 flex flex-row gap-1 align-items-start justify-content-end" >
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

    <div id="retentionPeriodInfo">
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
import { computed, onMounted, ref } from 'vue';
import { useDateDiff } from '../composables/useDateDiff.js';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  room: Object
});

const api = useApi();
const settingsStore = useSettingsStore();
const dateDiff = useDateDiff();
const { t } = useI18n();

const meetings = ref([]);
const isBusy = ref(false);
const loadingError = ref(false);
const sortField = ref('start');
const sortOrder = ref(0);

const meta = ref({
  current_page: 1,
  from: 0,
  last_page: 0,
  per_page: 0,
  to: 0,
  total: 0
});

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
      page: page || meta.value.current_page,
      sort_by: sortField.value,
      sort_direction: sortOrder.value === 1 ? 'asc' : 'desc'
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
  loadData(event.page + 1);
}

onMounted(() => {
  loadData();
});
</script>
<style scoped></style>
