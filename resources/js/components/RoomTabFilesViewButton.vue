<template>
  <!-- View file -->
  <Button
    v-tooltip="$t('rooms.files.view')"
    :aria-label="$t('rooms.files.view')"
    :disabled="disabled"
    target="_blank"
    :icon="loading ? 'pi pi-spin pi-spinner' : 'fa-solid fa-eye'"
    data-test="room-files-view-button"
    @click="downloadFile"
  />

  <Popover ref="op" class="max-w-96" data-test="terms-of-use-required-info">
    <InlineNote severity="info">{{
      $t("rooms.files.terms_of_use.required")
    }}</InlineNote>
  </Popover>
</template>
<script setup>
import env from "../env.js";
import { ref } from "vue";
import { useApi } from "../composables/useApi.js";
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";
import EventBus from "../services/EventBus.js";
import { EVENT_FORBIDDEN } from "../constants/events.js";

const props = defineProps({
  requireTermsOfUseAcceptance: {
    type: Boolean,
    required: false,
  },
  accessCode: {
    type: Number,
    default: null,
  },
  token: {
    type: String,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
    required: false,
  },
  fileId: {
    type: Number,
    required: true,
  },
  roomId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["invalidCode", "invalidToken", "fileNotFound"]);

const api = useApi();
const toast = useToast();
const { t } = useI18n();

const loading = ref(false);
const op = ref();

/**
 * Request file download url
 * @return string url
 * @param event
 */
function downloadFile(event) {
  if (props.requireTermsOfUseAcceptance) {
    op.value.toggle(event);
    return;
  }

  loading.value = true;
  // Update value for the setting and the effected file
  const config = {};

  if (props.token) {
    config.headers = { Token: props.token };
  } else if (props.accessCode != null) {
    config.headers = { "Access-Code": props.accessCode };
  }

  const url = "rooms/" + props.roomId + "/files/" + props.fileId;

  // Load data
  api
    .call(url, config)
    .then((response) => {
      if (response.data.url !== undefined) {
        const downloadWindow = window.open(response.data.url, "_blank");
        if (!downloadWindow) {
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

        // Forbidden, not allowed to download this file
        if (error.response.status === env.HTTP_FORBIDDEN) {
          // Show error message
          toast.error(t("rooms.flash.file_forbidden"));
          EventBus.emit(EVENT_FORBIDDEN);
          return;
        }

        // File gone
        if (error.response.status === env.HTTP_NOT_FOUND) {
          // Show error message
          toast.error(t("rooms.flash.file_gone"));
          // Remove file from list
          emit("fileNotFound");
          return;
        }
      }
      api.error(error, { redirectOnUnauthenticated: false });
    })
    .finally(() => {
      loading.value = null;
    });
}
</script>
