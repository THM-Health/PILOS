<template>
  <!-- button -->
  <Button
    :disabled="disabled || isLoadingAction"
    :loading="isLoadingAction"
    severity="secondary"
    data-test="room-files-default-button"
    icon="fa-solid fa-crown"
    :label="$t('rooms.files.set_default')"
    @click="setDefault"
  />
</template>
<script setup>
import { useApi } from "../composables/useApi.js";
import { ref } from "vue";
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";
import { ROOM_FILE } from "../constants/modelNames.js";
import { HTTP_STATUS_NOT_FOUND } from "../constants/httpStatusCodes.js";
import { HTTP_ERROR_ROOM_FILES_SYSTEM_DEFAULT_PRESENTATION_NOT_SET } from "../constants/httpCustomErrorMessages.js";

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
  fileId: {
    type: [Number, null],
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "edited",
  "notFound",
  "systemDefaultPresentationNotSet",
]);

const api = useApi();
const toast = useToast();
const { t } = useI18n();

const isLoadingAction = ref(false);

/**
 * Sends a request to the server to update the default file configuration for the specified room and file.
 */
function setDefault() {
  isLoadingAction.value = true;

  const url =
    props.fileId === null
      ? `rooms/${props.roomId}/files/system_default/default`
      : `rooms/${props.roomId}/files/${props.fileId}/default`;

  api
    .call(url, {
      method: "post",
    })
    .then(() => {
      emit("edited");
    })
    .catch((error) => {
      // setting default failed
      if (error.response) {
        // file not found
        if (
          error.response.status === HTTP_STATUS_NOT_FOUND &&
          error.response.data?.model === ROOM_FILE
        ) {
          toast.error(t("rooms.flash.file_gone"));
          emit("notFound");
          return;
        }

        // System default presentation not set
        if (
          error.response.status === HTTP_STATUS_NOT_FOUND &&
          error.response.data?.message ===
            HTTP_ERROR_ROOM_FILES_SYSTEM_DEFAULT_PRESENTATION_NOT_SET
        ) {
          toast.error(t("rooms.flash.default_presentation_not_set"));
          emit("systemDefaultPresentationNotSet");
          return;
        }
      }
      api.error(error, { redirectOnUnauthenticated: false });
    })
    .finally(() => {
      isLoadingAction.value = false;
    });
}
</script>
