<template>
  <Button
    v-tooltip="$t('meetings.attendance.view')"
    :disabled="disabled"
    severity="secondary"
    @click="showAttendanceModal"
    icon="fa-solid fa-user-clock"
  />

  <!-- edit user role modal -->
  <Dialog
    v-model:visible="showModal"
    modal
    :header="$t('meetings.stats.modal_title',{room: props.roomName })"
    :style="{ width: '1200px' }"
    :breakpoints="{ '1270px': '90vw' }"
    :draggable="false"
    :closeOnEscape="!isLoadingAction"
    :dismissableMask="!isLoadingAction"
    :closable="!isLoadingAction"
  >
    <template #header>
      <div>
      <span class="p-dialog-title">
        {{ $t('meetings.stats.modal_title',{room: props.roomName }) }}
      </span>
        <br/>
      <small>{{ $d(new Date(props.start),'datetimeShort') }} <raw-text>-</raw-text> {{ props.end == null ? $t('meetings.now') : $d(new Date(props.end),'datetimeShort') }}</small>
      </div>
    </template>

    <InlineMessage severity="info" class="w-full">
      {{ $t('meetings.stats.no_breakout_support') }}
    </InlineMessage>

    <!-- List of all meetings -->
    <DataTable
      scrollable
      scrollHeight="400px"
      :value="attendance"
      dataKey="id"
      :loading="isLoadingAction"
      rowHover
      v-model:filters="filters"
      :globalFilterFields="['name']"
    >
      <template #header>
        <div class="flex justify-content-between gap-2">
          <span class="p-input-icon-left">
              <i class="fa-solid fa-search" />
              <InputText v-model="filters['global'].value" :placeholder="$t('app.search')" />
          </span>

          <a
            target="_blank"
            :href="'/download/attendance/'+meetingId"
          >
            <Button
              icon="fa-solid fa-file-excel"
              :label="$t('meetings.attendance.download')"
            />
          </a>
        </div>
      </template>

      <template #empty>
        <i>{{ $t('meetings.no_historical_data') }}</i>
      </template>

      <Column field="name" sortable :header="$t('app.user_name')">
        <template #body="slotProps">
          {{ slotProps.data.name }}
        </template>
      </Column>

      <Column field="email" :header="$t('app.email')">
        <template #body="slotProps">
          {{ slotProps.data.email || "---" }}
        </template>
      </Column>

      <Column field="duration" sortable :header="$t('meetings.attendance.duration')">
        <template #body="slotProps">
          {{ $t('meetings.attendance.duration_minute',{duration: slotProps.data.duration}) }}
        </template>
      </Column>

      <Column field="sessions" :header="$t('meetings.attendance.sessions')">
        <template #body="slotProps">
          <p
            v-for="session in slotProps.data.sessions"
            :key="session.id"
          >
            {{ $d(new Date(session.join),'datetimeShort') }} <raw-text>-</raw-text> {{ $d(new Date(session.leave),'datetimeShort') }} <raw-text>(</raw-text>{{ $t('meetings.attendance.duration_minute',{duration: session.duration}) }}<raw-text>)</raw-text>
          </p>
        </template>
      </Column>
    </DataTable>
  </Dialog>
</template>
<script setup>

import { ref } from 'vue';
import { useApi } from '../composables/useApi.js';
import 'chartjs-adapter-date-fns';
import { FilterMatchMode } from 'primevue/api';

const props = defineProps([
  'roomId',
  'meetingId',
  'start',
  'end',
  'roomName',
  'disabled'
]);

const showModal = ref(false);
const isLoadingAction = ref(false);
const attendance = ref([]);
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const api = useApi();

function showAttendanceModal () {
  showModal.value = true;
  loadData();
}

function loadData () {
  isLoadingAction.value = true;

  api.call('meetings/' + props.meetingId + '/attendance')
    .then(response => {
      attendance.value = response.data.data;
    }).catch((error) => {
      // error during stats loading
      api.error(error);
    }).finally(() => {
      // disable loading indicator
      isLoadingAction.value = false;
    });
}
</script>
