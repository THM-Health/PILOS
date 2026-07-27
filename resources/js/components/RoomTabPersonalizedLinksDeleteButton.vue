<template>
  <!-- button -->
  <Button
    v-tooltip="$t('rooms.personalized_links.delete')"
    severity="danger"
    :disabled="disabled"
    icon="fa-solid fa-trash"
    :aria-label="$t('rooms.personalized_links.delete')"
    data-test="room-personalized-links-delete-button"
    @click="showModal"
  />

  <!-- modal -->
  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('rooms.personalized_links.delete')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="false"
    :closable="!isLoadingAction"
    data-test="room-personalized-links-delete-dialog"
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
          data-test="dialog-continue-button"
          @click="deleteLink"
        />
      </div>
    </template>

    <span>
      {{
        $t("rooms.personalized_links.confirm_delete", {
          firstname: props.firstname,
          lastname: props.lastname,
        })
      }}
    </span>
  </Dialog>
</template>

<script setup>
import { useApi } from "../composables/useApi.js";
import { ref } from "vue";
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";
import { ROOM_PERSONALIZED_LINK } from "../constants/modelNames.js";
import { HTTP_STATUS_NOT_FOUND } from "../constants/httpStatusCodes.js";

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
  id: {
    type: Number,
    required: true,
  },
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["deleted", "notFound"]);

const api = useApi();
const toast = useToast();
const { t } = useI18n();

const modalVisible = ref(false);
const isLoadingAction = ref(false);

/**
 * show modal
 */
function showModal() {
  modalVisible.value = true;
}

/**
 * Sends a request to the server to delete the personalized link.
 */
function deleteLink() {
  isLoadingAction.value = true;

  const config = {
    method: "delete",
  };

  api
    .call(`rooms/${props.roomId}/personalizedLinks/${props.id}`, config)
    .then(() => {
      // operation successful, close modal and reload list
      modalVisible.value = false;
      emit("deleted");
    })
    .catch((error) => {
      // deleting failed
      if (error.response) {
        // personalized link not found
        if (
          error.response.status === HTTP_STATUS_NOT_FOUND &&
          error.response.data?.model === ROOM_PERSONALIZED_LINK
        ) {
          toast.error(t("rooms.flash.personalized_link_gone"));
          modalVisible.value = false;
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
