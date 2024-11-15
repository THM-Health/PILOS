<template>
  <Button
    v-tooltip="$t('rooms.recordings.view_recording')"
    :aria-label="$t('rooms.recordings.view_recording')"
    icon="fa-solid fa-eye"
    :disabled="props.disabled"
    @click="modalVisible = true"
  />

  <!-- view recording modal -->
  <Dialog
    v-model:visible="modalVisible"
    modal
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="false"
    :closable="!isLoadingAction"
  >
    <template #header>
      <div>
        <span class="p-dialog-title">
          {{ props.description }}
        </span>
        <br />
        <small
          >{{ $d(new Date(props.start), "datetimeShort") }}
          <raw-text>-</raw-text>
          {{ $d(new Date(props.end), "datetimeShort") }}</small
        >
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          :label="$t('app.close')"
          severity="secondary"
          icon="fa-solid fa-times"
          :disabled="isLoadingAction"
          @click="modalVisible = false"
        />
      </div>
    </template>

    <OverlayComponent :show="isLoadingAction">
      <div class="flex flex-col gap-2">
        <!-- Hide disabled formats if disabled formats should be hidden -->
        <Button
          v-for="format in formats.filter(
            (format) => !(format.disabled && hideDisabledFormats),
          )"
          :key="format.format"
          icon="fa-solid fa-play"
          :disabled="isLoadingAction"
          :label="$t('rooms.recordings.format_types.' + format.format)"
          @click="downloadFormat(format)"
        />
      </div>
    </OverlayComponent>
  </Dialog>
</template>
<script setup>
import { ref } from "vue";
import { useApi } from "../composables/useApi.js";
import env from "../env.js";
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";
import EventBus from "../services/EventBus.js";
import { EVENT_FORBIDDEN } from "../constants/events.js";

const props = defineProps({
  accessCode: {
    type: Number,
    default: null,
  },
  token: {
    type: String,
    default: null,
  },
  roomId: {
    type: String,
    required: true,
  },
  recordingId: {
    type: String,
    required: true,
  },
  hideDisabledFormats: {
    type: Boolean,
    default: false,
  },
  description: {
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
  formats: {
    type: Array,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["invalidCode", "invalidToken", "notFound"]);

const isLoadingAction = ref(false);
const modalVisible = ref(false);

const api = useApi();
const toast = useToast();
const { t } = useI18n();

function downloadFormat(format) {
  isLoadingAction.value = true;

  // Update value for the setting and the effected file
  const config = {};

  if (props.token) {
    config.headers = { Token: props.token };
  } else if (props.accessCode != null) {
    config.headers = { "Access-Code": props.accessCode };
  }

  const url =
    "rooms/" +
    props.roomId +
    "/recordings/" +
    props.recordingId +
    "/formats/" +
    format.id;

  // Load data
  api
    .call(url, config)
    .then((response) => {
      if (response.data.url !== undefined) {
        const viewWindow = window.open(response.data.url, "_blank");
        if (!viewWindow) {
          toast.error(t("app.flash.popup_blocked"));
        }
      }
    })
    .catch((error) => {
      if (error.response) {
        // Access code invalid
        if (
          error.response.status === env.HTTP_UNAUTHORIZED &&
          error.response.data.message === "invalid_code"
        ) {
          return emit("invalidCode");
        }

        // Room token is invalid
        if (
          error.response.status === env.HTTP_UNAUTHORIZED &&
          error.response.data.message === "invalid_token"
        ) {
          return emit("invalidToken");
        }

        // Forbidden, require access code
        if (
          error.response.status === env.HTTP_FORBIDDEN &&
          error.response.data.message === "require_code"
        ) {
          return emit("invalidCode");
        }

        // Forbidden, not allowed to view recording format
        if (error.response.status === env.HTTP_FORBIDDEN) {
          // Show error message
          toast.error(t("rooms.flash.recording_forbidden"));
          EventBus.emit(EVENT_FORBIDDEN);
          return;
        }

        // Recording gone
        if (error.response.status === env.HTTP_NOT_FOUND) {
          // Show error message
          toast.error(t("rooms.flash.recording_gone"));
          return emit("notFound");
        }
      }
      api.error(error, { noRedirectOnUnauthenticated: true });
    })
    .finally(() => {
      isLoadingAction.value = false;
    });
}
</script>
