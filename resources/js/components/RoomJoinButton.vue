<template>
  <!-- If room is running, show join button -->
  <Button
    v-if="props.running"
    data-test="room-join-button"
    class="p-button-block"
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
    :header="action === 'join' ? $t('rooms.join_room') : $t('rooms.start_room')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="false"
    :closable="!isLoadingAction"
  >
    <Message
      v-if="formErrors.fieldInvalid('name')"
      class="mb-4"
      severity="error"
    >
      <div>{{ t("rooms.request_participant_name_change") }}</div>
      <div>{{ formErrors.fieldError("name")[0] }}</div>
    </Message>
    <Message v-if="showRunningMessage" class="mb-4" severity="warn">{{
      $t("app.errors.room_already_running")
    }}</Message>
    <Form
      id="startJoinForm"
      :disabled="isLoadingAction || loadingError"
      @submit="getJoinUrl"
    >
      <OverlayComponent :show="isLoadingAction || loadingError" :opacity="0">
        <template #overlay>
          <LoadingRetryButton
            :error="loadingError"
            @reload="loadStartJoinRequirements"
          />
        </template>

        <div
          v-if="!isLoadingAction && !loadingError"
          class="flex flex-col gap-2"
        >
          <div
            v-if="features.attendance_recording"
            class="flex flex-col gap-2 rounded-border bg-surface-200 p-4 dark:bg-surface-800"
          >
            <span class="font-semibold">{{
              $t("rooms.recording_attendance_info")
            }}</span>
            <div class="flex items-center gap-2">
              <Checkbox
                v-model="recordAttendanceAgreement"
                input-id="record-attendance-agreement"
                binary
                required
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
            v-if="features.recording"
            class="flex flex-col gap-2 rounded-border bg-surface-200 p-4 dark:bg-surface-800"
          >
            <span class="font-semibold">{{ $t("rooms.recording_info") }}</span>
            <i>{{ $t("rooms.recording_hint") }}</i>
            <div class="flex items-center gap-2">
              <Checkbox
                v-model="recordAgreement"
                input-id="record-agreement"
                binary
                required
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
            <FormError
              :errors="formErrors.fieldError('consent_record_video')"
            />
          </div>

          <div
            v-if="features.streaming"
            class="flex flex-col gap-2 rounded-border bg-surface-200 p-4 dark:bg-surface-800"
          >
            <span class="font-semibold">{{ $t("rooms.streaming_info") }}</span>
            <i>{{ $t("rooms.streaming_hint") }}</i>
            <div class="flex items-center gap-2">
              <Checkbox
                v-model="streamingAgreement"
                input-id="streaming-agreement"
                binary
                required
                :invalid="formErrors.fieldInvalid('consent_streaming')"
              />
              <label for="streaming-agreement">{{
                $t("rooms.streaming_accept")
              }}</label>
            </div>
            <FormError :errors="formErrors.fieldError('consent_streaming')" />
          </div>
        </div>
      </OverlayComponent>
    </Form>
    <template #footer>
      <div class="flex shrink-0 justify-end gap-2">
        <Button
          :label="$t('app.cancel')"
          data-test="dialog-cancel-button"
          :disabled="isLoadingAction"
          severity="secondary"
          @click="modalVisible = false"
        />
        <Button
          :label="$t('app.continue')"
          data-test="dialog-continue-button"
          :disabled="isLoadingAction || loadingError"
          type="submit"
          form="startJoinForm"
        />
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import { ref, computed, onUnmounted } from "vue";
import { useFormErrors } from "../composables/useFormErrors.js";
import { useApi } from "../composables/useApi.js";
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";
import { EVENT_FORBIDDEN } from "../constants/events.js";
import EventBus from "../services/EventBus.js";
import { useDark } from "@vueuse/core";
import {
  HTTP_ERROR_GUESTS_NOT_ALLOWED,
  HTTP_ERROR_ROOM_INVALID_AUTH_TOKEN,
  HTTP_ERROR_ROOM_REQUIRE_CODE,
} from "../constants/httpCustomErrorMessages.js";
import {
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_ROOM_ALREADY_RUNNING,
  HTTP_STATUS_ROOM_NOT_RUNNING,
  HTTP_STATUS_UNAUTHORIZED,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "../constants/httpStatusCodes.js";

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
  roomAuthToken: {
    type: Object,
    default: null,
  },
  participantName: {
    type: String,
    default: null,
  },
});

const emit = defineEmits([
  "invalidRoomAuthToken",
  "requireCode",
  "guestsNotAllowed",
  "changed",
]);

const isDark = useDark();

const modalVisible = ref(false);
const isLoadingAction = ref(false);
const loadingError = ref(false);
const recordAttendanceAgreement = ref(false);
const showRunningMessage = ref(false);
const recordAgreement = ref(false);
const recordVideoAgreement = ref(false);
const streamingAgreement = ref(false);
const action = ref("join");

const api = useApi();
const toast = useToast();
const { t } = useI18n();
const formErrors = useFormErrors();

const features = ref({});

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
  action.value = props.running ? "join" : "start";
  formErrors.clear();
  modalVisible.value = true;

  loadStartJoinRequirements().then((success) => {
    if (success && autoJoin.value) {
      getJoinUrl();
    }
  });
}

function loadStartJoinRequirements() {
  return new Promise((resolve) => {
    isLoadingAction.value = true;
    loadingError.value = false;

    // Build url, add room auth token if needed
    const url = "rooms/" + props.roomId + "/" + action.value;
    const config = {
      method: "options",
    };

    if (props.roomAuthToken) {
      config.params = {
        room_auth_token: props.roomAuthToken.id,
        room_auth_token_type: props.roomAuthToken.type,
      };
    }

    api
      .call(url, config)
      .then((response) => {
        features.value = response.data.data.features;
        isLoadingAction.value = false;

        resolve(true);
      })
      .catch((error) => {
        isLoadingAction.value = false;
        resolve(false);

        if (error.response) {
          // Handle general errors, if error was handled
          // return to prevent further processing
          if (handleError(error)) {
            return;
          }
        }

        // Other errors
        loadingError.value = true;
        api.error(error);
      });
  });
}

const autoJoin = computed(() => {
  if (features.value.attendance_recording) {
    return false;
  }

  if (features.value.recording) {
    return false;
  }

  if (features.value.streaming) {
    return false;
  }

  return true;
});

/**
 * Handle the page is restored from the back/forward cache after redirecting to BBB
 * The modal is still shown and loaded, close and reload the page
 */
async function pageShownAfterBBBHandler(event) {
  window.removeEventListener("pageshow", pageShownAfterBBBHandler);
  if (event.persisted) {
    // Disable loading indicator
    isLoadingAction.value = false;
    // Hide modal
    modalVisible.value = false;
    // Reload
    emit("changed");
  }
}

onUnmounted(() => {
  window.removeEventListener("pageshow", pageShownAfterBBBHandler);
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
      name: props.participantName ? props.participantName : null,
      consent_record_attendance: recordAttendanceAgreement.value,
      consent_record: recordAgreement.value,
      consent_record_video: recordVideoAgreement.value,
      consent_streaming: streamingAgreement.value,
      dark_mode: isDark.value,
    },
  };

  if (props.roomAuthToken) {
    config.params = {
      room_auth_token: props.roomAuthToken.id,
      room_auth_token_type: props.roomAuthToken.type,
    };
  }

  const url = "rooms/" + props.roomId + "/" + action.value;

  // Join meeting request
  api
    .call(url, config)
    .then((response) => {
      // Check if response has a join url, if yes redirect
      if (response.data.url !== undefined) {
        // Add listener for when user returns to this page
        // without a full page reload, state is restored from back/forward cache
        window.addEventListener("pageshow", pageShownAfterBBBHandler);
        window.location = response.data.url;
      }
    })
    .catch((error) => {
      // Disable loading indicator
      isLoadingAction.value = false;

      if (error.response) {
        // Handle general errors, if error was handled
        // return to prevent further processing
        if (handleError(error)) {
          return;
        }

        // Form validation error
        if (error.response.status === HTTP_STATUS_UNPROCESSABLE_ENTITY) {
          formErrors.set(error.response.data.errors);

          loadStartJoinRequirements();
          return;
        }

        // Room is not running, update running status
        if (error.response.status === HTTP_STATUS_ROOM_NOT_RUNNING) {
          toast.error(t("app.errors.not_running"));
          modalVisible.value = false;
          emit("changed");
          return;
        }

        // Room is running cannot be started a second time, update running status
        if (error.response.status === HTTP_STATUS_ROOM_ALREADY_RUNNING) {
          emit("changed");
          showRunningMessage.value = true;
          action.value = "join";
          loadStartJoinRequirements();
          return;
        }
      }

      api.error(error);
    });
}

/**
 * General error handler for room join/start
 * @param error
 * @return {boolean} true if error was handled, false otherwise
 */
function handleError(error) {
  // Access code is required
  if (
    error.response.status === HTTP_STATUS_FORBIDDEN &&
    error.response.data.message === HTTP_ERROR_ROOM_REQUIRE_CODE
  ) {
    emit("requireCode");
    modalVisible.value = false;
    return true;
  }

  // Room auth token is invalid
  if (
    error.response.status === HTTP_STATUS_UNAUTHORIZED &&
    error.response.data.message === HTTP_ERROR_ROOM_INVALID_AUTH_TOKEN
  ) {
    emit("invalidRoomAuthToken");
    modalVisible.value = false;
    return true;
  }

  // Forbidden, guests not allowed
  if (
    error.response.status === HTTP_STATUS_FORBIDDEN &&
    error.response.data.message === HTTP_ERROR_GUESTS_NOT_ALLOWED
  ) {
    emit("guestsNotAllowed");
    modalVisible.value = false;
    return true;
  }

  // Forbidden, use can't start the room
  if (error.response.status === HTTP_STATUS_FORBIDDEN) {
    // Show error message
    toast.error(t("rooms.flash.start_forbidden"));
    EventBus.emit(EVENT_FORBIDDEN);
    modalVisible.value = false;
    return true;
  }

  return false;
}
</script>
