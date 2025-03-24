<template>
  <!-- If room is running, show join button -->
  <Button
    v-if="props.running"
    data-test="room-join-button"
    class="p-button-block"
    :disabled="isLoadingAction || disabled"
    :loading="isLoadingAction"
    icon="fa-solid fa-door-open"
    :label="$t('rooms.join')"
    @click="showModal"
  />

  <!-- If room is not running -->
  <Button
    v-else-if="canStart"
    data-test="room-start-button"
    class="p-button-block"
    :disabled="isLoadingAction || disabled"
    :loading="isLoadingAction"
    icon="fa-solid fa-door-open"
    :label="$t('rooms.start')"
    @click="showModal"
  />

  <!-- If user isn't allowed to start a new meeting, show message that meeting isn't running yet -->
  <Message v-else severity="info">{{ $t("rooms.not_running") }}</Message>

  <Dialog
    v-model:visible="modalVisible"
    data-test="room-join-dialog"
    modal
    :header="running ? $t('rooms.join_room') : $t('rooms.start_room')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="false"
    :closable="!isLoadingAction"
  >
    <Message v-if="showRunningMessage" severity="warn">{{
      $t("app.errors.room_already_running")
    }}</Message>

    <OverlayComponent :show="isLoadingAction" :opacity="0">
      <div v-if="!isLoadingAction">
        <!-- Ask guests for their first and lastname -->
        <div
          v-if="!authStore.isAuthenticated && !token"
          class="mb-4 flex flex-col gap-2"
        >
          <label for="guest-name">{{ $t("rooms.first_and_lastname") }}</label>
          <InputText
            id="guest-name"
            v-model="name"
            autofocus
            :placeholder="$t('rooms.placeholder_name')"
            :invalid="formErrors.fieldInvalid('name')"
          />
          <FormError :errors="formErrors.fieldError('name')" />
        </div>

        <div
          v-if="recordAttendance"
          class="mb-4 flex flex-col gap-2 bg-surface-200 p-4 rounded-border dark:bg-surface-600"
        >
          <span class="font-semibold">{{
            $t("rooms.recording_attendance_info")
          }}</span>
          <div class="flex items-center gap-2">
            <Checkbox
              v-model="recordAttendanceAgreement"
              input-id="record-attendance-agreement"
              binary
              :invalid="formErrors.fieldInvalid('consent_record_attendance')"
            />
            <label for="record-attendance-agreement">{{
              $t("rooms.recording_attendance_accept")
            }}</label>
          </div>
          <FormError
            :errors="formErrors.fieldError('consent_record_attendance')"
          />
        </div>

        <div
          v-if="record"
          class="mb-4 flex flex-col gap-2 bg-surface-200 p-4 rounded-border dark:bg-surface-600"
        >
          <span class="font-semibold">{{ $t("rooms.recording_info") }}</span>
          <i>{{ $t("rooms.recording_hint") }}</i>
          <div class="flex items-center gap-2">
            <Checkbox
              v-model="recordAgreement"
              input-id="record-agreement"
              binary
              :class="{
                'p-invalid': formErrors.fieldInvalid('consent_record'),
              }"
            />
            <label for="record-agreement" class="required">{{
              $t("rooms.recording_accept")
            }}</label>
          </div>
          <FormError :errors="formErrors.fieldError('consent_record')" />
          <div class="flex items-center gap-2">
            <Checkbox
              v-model="recordVideoAgreement"
              input-id="record-video-agreement"
              binary
              :class="{
                'p-invalid': formErrors.fieldInvalid('consent_record_video'),
              }"
            />
            <label for="record-video-agreement">{{
              $t("rooms.recording_video_accept")
            }}</label>
          </div>
          <FormError :errors="formErrors.fieldError('consent_record_video')" />
        </div>
      </div>
    </OverlayComponent>

    <div class="mt-6 flex items-center justify-end gap-2">
      <Button
        :label="$t('app.cancel')"
        data-test="dialog-cancel-button"
        :disabled="isLoadingAction"
        severity="secondary"
        size="small"
        @click="modalVisible = false"
      />
      <Button
        :label="$t('app.continue')"
        data-test="dialog-continue-button"
        :disabled="isLoadingAction"
        size="small"
        @click="getJoinUrl"
      />
    </div>
  </Dialog>
</template>
<script setup>
import { ref, computed } from "vue";
import { useAuthStore } from "../stores/auth.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import { useApi } from "../composables/useApi.js";
import env from "../env.js";
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";
import { EVENT_FORBIDDEN } from "../constants/events.js";
import EventBus from "../services/EventBus.js";

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
  canStart: {
    type: Boolean,
  },
  running: {
    type: Boolean,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  token: {
    type: String,
    default: null,
  },
  accessCode: {
    type: Number,
    default: null,
  },
  recordAttendance: {
    type: Boolean,
  },
  record: {
    type: Boolean,
  },
});

const emit = defineEmits([
  "invalidCode",
  "invalidToken",
  "guestsNotAllowed",
  "changed",
]);

const authStore = useAuthStore();

const modalVisible = ref(false);
const isLoadingAction = ref(false);
const recordAttendanceAgreement = ref(false);
const showRunningMessage = ref(false);
const recordAgreement = ref(false);
const recordVideoAgreement = ref(false);
const name = ref(""); // Name of guest

const api = useApi();
const toast = useToast();
const { t } = useI18n();
const formErrors = useFormErrors();

/**
 * Show the modal for joining / starting a room
 *
 * if autoJoin is enabled, user will automatically join/start the room
 * and a spinner will be shown during the request
 *
 * else a form is shown where additional information can be entered
 * like the name of the guest, agreements, etc.
 */
async function showModal() {
  showRunningMessage.value = false;

  formErrors.clear();
  modalVisible.value = true;

  if (autoJoin.value) {
    getJoinUrl();
  }
}

const autoJoin = computed(() => {
  if (!authStore.isAuthenticated && !props.token) {
    return false;
  }

  if (props.recordAttendance) {
    return false;
  }

  if (props.record) {
    return false;
  }

  return true;
});

/**
 * Join/start
 */
function getJoinUrl() {
  // Enable start/join meeting indicator/spinner
  isLoadingAction.value = true;

  // Hide running message
  showRunningMessage.value = false;

  // Reset errors
  formErrors.clear();

  // Build url, add accessCode and token if needed
  const config = {
    method: "post",
    data: {
      name: props.token ? null : name.value,
      consent_record_attendance: recordAttendanceAgreement.value,
      consent_record: recordAgreement.value,
      consent_record_video: recordVideoAgreement.value,
    },
  };

  if (props.token) {
    config.headers = { Token: props.token };
  } else if (props.accessCode != null) {
    config.headers = { "Access-Code": props.accessCode };
  }

  const url =
    "rooms/" + props.roomId + "/" + (props.running ? "join" : "start");

  // Join meeting request
  api
    .call(url, config)
    .then((response) => {
      // Check if response has a join url, if yes redirect
      if (response.data.url !== undefined) {
        modalVisible.value = false;
        window.location = response.data.url;
      }
    })
    .catch((error) => {
      // Disable loading indicator
      isLoadingAction.value = false;

      if (error.response) {
        // Access code invalid
        if (
          error.response.status === env.HTTP_UNAUTHORIZED &&
          error.response.data.message === "invalid_code"
        ) {
          emit("invalidCode");
          modalVisible.value = false;
          return;
        }

        // Access code is required
        if (
          error.response.status === env.HTTP_FORBIDDEN &&
          error.response.data.message === "require_code"
        ) {
          emit("invalidCode");
          modalVisible.value = false;
          return;
        }

        // Room token is invalid
        if (
          error.response.status === env.HTTP_UNAUTHORIZED &&
          error.response.data.message === "invalid_token"
        ) {
          emit("invalidToken");
          modalVisible.value = false;
          return;
        }

        // Forbidden, guests not allowed
        if (
          error.response.status === env.HTTP_FORBIDDEN &&
          error.response.data.message === "guests_not_allowed"
        ) {
          emit("guestsNotAllowed");
          modalVisible.value = false;
          return;
        }

        // Forbidden, use can't start the room
        if (error.response.status === env.HTTP_FORBIDDEN) {
          // Show error message
          toast.error(t("rooms.flash.start_forbidden"));
          EventBus.emit(EVENT_FORBIDDEN);
          modalVisible.value = false;
          return;
        }

        // Form validation error
        if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          formErrors.set(error.response.data.errors);
          emit("changed");
          return;
        }

        // Room is not running, update running status
        if (error.response.status === env.HTTP_ROOM_NOT_RUNNING) {
          toast.error(t("app.errors.not_running"));
          modalVisible.value = false;
          emit("changed");
          return;
        }

        // Room is running cannot be started a second time, update running status
        if (error.response.status === env.HTTP_ROOM_ALREADY_RUNNING) {
          emit("changed");
          showRunningMessage.value = true;
          return;
        }
      }

      api.error(error);
    });
}
</script>
