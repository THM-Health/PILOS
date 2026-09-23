<template>
  <!-- button -->
  <Button
    v-tooltip="$t('rooms.files.set_default')"
    :aria-label="$t('rooms.files.set_system_default_default_aria')"
    :disabled="disabled || isLoadingAction"
    :loading="isLoadingAction"
    severity="warn"
    data-test="room-files-system-default-default-button"
    @click="setDefault"
  >
    <template #icon="{ class: iconClass }">
      <CircleNumberIcon
        :class="iconClass"
        :number="1"
        data-test="room-file-system-default-button-priority"
      />
    </template>
  </Button>
</template>
<script setup>
import { useApi } from "../composables/useApi.js";
import { ref } from "vue";
import { HTTP_STATUS_NOT_FOUND } from "../constants/httpStatusCodes.js";
import { HTTP_ERROR_ROOM_FILES_SYSTEM_DEFAULT_PRESENTATION_NOT_SET } from "../constants/httpCustomErrorMessages.js";
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["edited", "systemDefaultPresentationNotSet"]);

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
    .call(`rooms/${props.roomId}/files/system_default/default`, {
      method: "post",
    })
    .then(() => {
      emit("edited");
    })
    .catch((error) => {
      // setting default failed
      if (error.response) {
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
