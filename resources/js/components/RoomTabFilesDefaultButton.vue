<template>
  <!-- button -->
  <Button
    v-tooltip="$t('rooms.files.set_default')"
    :aria-label="$t('rooms.files.set_default_aria', { filename: filename })"
    :disabled="disabled || isLoadingAction"
    :loading="isLoadingAction"
    severity="warn"
    data-test="room-files-default-button"
    @click="setDefault"
  >
    <template #icon="{ class: iconClass }">
      <CircleNumberIcon
        :class="iconClass"
        :number="1"
        data-test="room-file-default-button-priority"
      />
    </template>
  </Button>
</template>
<script setup>
import { useApi } from "../composables/useApi.js";
import { ref } from "vue";
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";
import { ROOM_FILE } from "../constants/modelNames.js";
import { HTTP_STATUS_NOT_FOUND } from "../constants/httpStatusCodes.js";

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
  fileId: {
    type: Number,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["edited", "notFound"]);

const api = useApi();
const toast = useToast();
const { t } = useI18n();

const isLoadingAction = ref(false);

/**
 * Sends a request to the server to update the default file configuration for the specified room and file.
 */
function setDefault() {
  isLoadingAction.value = true;

  api
    .call(`rooms/${props.roomId}/files/${props.fileId}/default`, {
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
      }
      api.error(error, { redirectOnUnauthenticated: false });
    })
    .finally(() => {
      isLoadingAction.value = false;
    });
}
</script>
