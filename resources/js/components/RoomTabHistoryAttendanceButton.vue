<template>
  <Button
    v-tooltip="$t('meetings.attendance.view')"
    :aria-label="$t('meetings.attendance.view')"
    :disabled="disabled"
    icon="fa-solid fa-user-clock"
    data-test="room-history-attendance-button"
    @click="showModal"
  />

  <!-- edit user role modal -->
  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('meetings.stats.modal_title', { room: props.roomName })"
    :style="{ width: '1200px' }"
    :breakpoints="{ '1270px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="!isLoadingAction"
    :closable="!isLoadingAction"
    data-test="room-history-attendance-dialog"
    :pt="{
      pcCloseButton: {
        root: {
          'data-test': 'dialog-header-close-button',
        },
      },
    }"
  >
    <template #header>
      <div>
        <span class="p-dialog-title">
          {{ $t("meetings.stats.modal_title", { room: props.roomName }) }}
        </span>
        <br />
        <small
          >{{ $d(new Date(props.start), "datetimeShort") }}
          <raw-text>-</raw-text>
          {{
            props.end == null
              ? $t("meetings.now")
              : $d(new Date(props.end), "datetimeShort")
          }}</small
        >
      </div>
    </template>

    <InlineNote class="w-full">
      {{ $t("meetings.stats.no_breakout_support") }}
    </InlineNote>

    <!-- List of all meetings -->
    <DataTable
      v-model:filters="filters"
      scrollable
      scroll-height="400px"
      :value="attendance"
      data-key="id"
      :loading="isLoadingAction || loadingError"
      row-hover
      :global-filter-fields="['name']"
      :pt="{
        bodyRow: {
          'data-test': 'room-history-attendance-item',
        },
        mask: {
          'data-test': 'overlay',
        },
        column: {
          bodyCell: {
            'data-test': 'room-history-attendance-item-cell',
          },
        },
      }"
    >
      <template #header>
        <div class="flex justify-between gap-2">
          <IconField icon-position="left">
            <InputIcon class="fa-solid fa-search"> </InputIcon>
            <InputText
              v-model="filters['global'].value"
              autofocus
              :placeholder="$t('app.search')"
              data-test="room-history-attendance-search"
            />
          </IconField>

          <Button
            v-tooltip:top="$t('meetings.attendance.download')"
            as="a"
            target="_blank"
            :href="downloadUrl"
            icon="fa-solid fa-file-excel"
            severity="secondary"
            :aria-label="$t('meetings.attendance.download')"
            data-test="room-history-attendance-download-button"
          />
        </div>
      </template>
      <template #loading>
        <LoadingRetryButton :error="loadingError" @reload="loadData()" />
      </template>

      <template #empty>
        <div v-if="!isLoadingAction && !loadingError">
          <InlineNote v-if="attendance.length == 0">{{
            $t("meetings.attendance.no_data")
          }}</InlineNote>
          <InlineNote v-else>{{
            $t("meetings.attendance.no_data_filtered")
          }}</InlineNote>
        </div>
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

      <Column
        field="duration"
        sortable
        :header="$t('meetings.attendance.duration')"
      >
        <template #body="slotProps">
          {{
            $t("meetings.attendance.duration_minute", {
              duration: slotProps.data.duration,
            })
          }}
        </template>
      </Column>

      <Column field="sessions" :header="$t('meetings.attendance.sessions')">
        <template #body="slotProps">
          <p v-for="session in slotProps.data.sessions" :key="session.id">
            {{ $d(new Date(session.join), "datetimeShort") }}
            <raw-text>-</raw-text>
            {{ $d(new Date(session.leave), "datetimeShort") }}
            <raw-text>(</raw-text
            >{{
              $t("meetings.attendance.duration_minute", {
                duration: session.duration,
              })
            }}<raw-text>)</raw-text>
          </p>
        </template>
      </Column>
    </DataTable>
  </Dialog>
</template>
<script setup>
import { computed, ref } from "vue";
import { useApi } from "../composables/useApi.js";
import "chartjs-adapter-date-fns";
import { useSettingsStore } from "../stores/settings.js";
import env from "../env.js";

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
  meetingId: {
    type: String,
    required: true,
  },
  start: {
    type: String,
    required: true,
  },
  end: {
    type: String,
    required: true,
  },
  roomName: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["notFound", "notEnded", "attendanceDisabled"]);

const modalVisible = ref(false);
const isLoadingAction = ref(false);
const loadingError = ref(false);
const attendance = ref([]);
const filters = ref({
  global: { value: null, matchMode: "contains" },
});

const api = useApi();
const settingsStore = useSettingsStore();

function showModal() {
  attendance.value = [];
  modalVisible.value = true;
  loadData();
}

function loadData() {
  isLoadingAction.value = true;
  loadingError.value = false;

  api
    .call("meetings/" + props.meetingId + "/attendance")
    .then((response) => {
      attendance.value = response.data.data;
    })
    .catch((error) => {
      loadingError.value = true;

      if (error.response) {
        // meeting is still running, therefore attendance is not yet available
        if (error.response.status === env.HTTP_MEETING_ATTENDANCE_NOT_ENDED) {
          emit("notEnded");
          modalVisible.value = false;
        }

        // attendance was not enabled for this meeting
        if (error.response.status === env.HTTP_MEETING_ATTENDANCE_DISABLED) {
          emit("attendanceDisabled");
          modalVisible.value = false;
        }

        // meeting not found
        if (error.response.status === env.HTTP_NOT_FOUND) {
          emit("notFound");
          modalVisible.value = false;
        }
      }

      // error during stats loading
      api.error(error, { redirectOnUnauthenticated: false });
    })
    .finally(() => {
      // disable loading indicator
      isLoadingAction.value = false;
    });
}

const downloadUrl = computed(() => {
  return (
    settingsStore.getSetting("general.base_url") +
    "/download/attendance/" +
    props.meetingId
  );
});
</script>
