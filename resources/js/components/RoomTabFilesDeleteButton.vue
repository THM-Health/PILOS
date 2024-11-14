<template>
  <!-- button -->
  <Button
    v-tooltip="$t('rooms.files.delete')"
    :aria-label="$t('rooms.files.delete')"
    :disabled="disabled"
    severity="danger"
    icon="fa-solid fa-trash"
    data-test="room-files-delete-button"
    @click="modalVisible = true"
  />

  <!-- modal -->
  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('rooms.files.delete')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="false"
    :closable="!isLoadingAction"
    data-test="room-files-delete-dialog"
  >
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          :label="$t('app.no')"
          severity="secondary"
          :disabled="isLoadingAction"
          data-test="dialog-cancel-button"
          @click="modalVisible = false"
        />
        <Button
          :label="$t('app.yes')"
          severity="danger"
          :loading="isLoadingAction"
          :disabled="isLoadingAction"
          data-test="dialog-continue-button"
          @click="deleteFile"
        />
      </div>
    </template>

    <span style="overflow-wrap: break-word">
      {{ $t("rooms.files.confirm_delete", { filename: filename }) }}
    </span>
  </Dialog>
</template>
<script setup>
import env from "../env";
import { useApi } from "../composables/useApi.js";
import { ref } from "vue";
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";

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

const emit = defineEmits(["deleted"]);

const api = useApi();
const toast = useToast();
const { t } = useI18n();

const modalVisible = ref(false);
const isLoadingAction = ref(false);

/*
 * Delete file
 */
function deleteFile() {
  isLoadingAction.value = true;

  api
    .call("rooms/" + props.roomId + "/files/" + props.fileId, {
      method: "delete",
    })
    .then(() => {
      // operation successful, close modal and reload list
      modalVisible.value = false;
      emit("deleted");
    })
    .catch((error) => {
      // deleting failed
      if (error.response) {
        // file not found
        if (error.response.status === env.HTTP_NOT_FOUND) {
          toast.error(t("rooms.flash.file_gone"));
          emit("deleted");
          modalVisible.value = false;
          return;
        }
      }
      api.error(error, { noRedirectOnUnauthenticated: true });
    })
    .finally(() => {
      isLoadingAction.value = false;
    });
}
</script>
