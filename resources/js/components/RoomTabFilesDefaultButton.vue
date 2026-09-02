<template>
  <!-- button -->
  <Button
    v-tooltip="$t('rooms.files.default')"
    :aria-label="$t('rooms.files.default_aria', { filename: filename })"
    :disabled="disabled || isLoadingAction"
    :loading="isLoadingAction"
    :severity="
      props.default && !props.preferSystemDefault ? 'warn' : 'secondary'
    "
    icon="fa-solid fa-star"
    data-test="room-files-default-button"
    @click="setDefault"
  />

  <!-- modal -->
  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('rooms.files.default', { name: filename })"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="false"
    :closable="!isLoadingAction"
    data-test="room-files-default-dialog"
  >
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          :label="$t('app.cancel')"
          severity="secondary"
          :disabled="isLoadingAction"
          data-test="dialog-cancel-button"
          @click="modalVisible = false"
        />
        <Button
          :label="$t('app.yes')"
          severity="success"
          :loading="isLoadingAction"
          data-test="dialog-continue-button"
          @click="saveDefault"
        />
      </div>
    </template>

    <div style="overflow-wrap: break-word">
      {{ $t("rooms.files.confirm_default", { filename: filename }) }}
    </div>
    <div v-if="props.preferSystemDefault" style="overflow-wrap: break-word">
      This will override the system default file preference for this room.
    </div>
    <div v-if="!props.useInMeeting" style="overflow-wrap: break-word">
      This will cause the file to be available in the next meeting.
    </div>
  </Dialog>
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
  useInMeeting: {
    type: Boolean,
    default: false,
  },
  default: {
    type: Boolean,
    default: false,
  },
  preferSystemDefault: {
    type: Boolean,
    default: false,
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

const modalVisible = ref(false);
const isLoadingAction = ref(false);

function setDefault() {
  if (!props.useInMeeting || props.preferSystemDefault) {
    showModal();
  } else {
    saveDefault();
  }
}

/**
 * show modal
 */
function showModal() {
  modalVisible.value = true;
}

/**
 * Sends a request to the server to update the default file configuration for the specified room and file.
 */
function saveDefault() {
  isLoadingAction.value = true;

  api
    .call(`rooms/${props.roomId}/files/${props.fileId}/default`, {
      method: "post",
    })
    .then(() => {
      // operation successful, close modal and reload list
      modalVisible.value = false;
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
          modalVisible.value = false;
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
