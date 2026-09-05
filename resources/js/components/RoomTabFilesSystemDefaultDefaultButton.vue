<template>
  <!-- button -->
  <Button
    v-tooltip="$t('rooms.files.default')"
    :aria-label="$t('rooms.files.default_aria', { filename: 'System default' })"
    :disabled="disabled || isLoadingAction || preferAsDefault"
    :loading="isLoadingAction"
    :severity="preferAsDefault ? 'warn' : 'secondary'"
    data-test="room-files-default-button"
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

  <!-- modal -->
  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('rooms.files.default', { name: 'System default' })"
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
      {{ $t("rooms.files.confirm_default", { filename: "System default" }) }}
    </div>
    <div v-if="!useInMeeting" style="overflow-wrap: break-word">
      This will cause the file to be available in future meetings.
    </div>
    <div v-if="defaultFile !== null" style="overflow-wrap: break-word">
      The system-wide presentation will be shown first. "{{
        defaultFile.filename
      }}" will remain the room default and will be used when no system-wide
      presentation is available.
    </div>
  </Dialog>
</template>
<script setup>
import { useApi } from "../composables/useApi.js";
import { ref } from "vue";

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
  useInMeeting: {
    type: Boolean,
    default: false,
  },
  preferAsDefault: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  defaultFile: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["edited"]);

const api = useApi();

const modalVisible = ref(false);
const isLoadingAction = ref(false);

function setDefault() {
  if (
    !props.useInMeeting ||
    (props.defaultFile !== null && !props.preferAsDefault)
  ) {
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
    .call(`rooms/${props.roomId}/files/system_default/default`, {
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
        // ToDo Stale error
      }
      api.error(error, { redirectOnUnauthenticated: false });
    })
    .finally(() => {
      isLoadingAction.value = false;
    });
}
</script>
