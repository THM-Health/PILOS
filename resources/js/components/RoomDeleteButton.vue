<template>
  <!-- Remove room -->
  <Button
    v-if="userPermissions.can('delete', room)"
    ref="deleteButton"
    :disabled="disabled"
    severity="danger"
    icon="fa-solid fa-trash"
    :label="$t('rooms.modals.delete.title')"
    data-test="room-delete-button"
    @click="modalVisible = true"
  />

  <!-- Remove room modal -->
  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('rooms.modals.delete.title')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="false"
    :closable="!isLoadingAction"
    data-test="room-delete-dialog"
  >
    {{ $t("rooms.modals.delete.confirm", { name: room.name }) }}

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
          @click="deleteRoom"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { useApi } from "../composables/useApi.js";
import { ref } from "vue";
import { useUserPermissions } from "../composables/useUserPermission.js";

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
    required: false,
  },
});

const emit = defineEmits(["roomDeleted"]);

const isLoadingAction = ref(false);
const modalVisible = ref(false);

const api = useApi();
const userPermissions = useUserPermissions();

/**
 * Handle deleting of the current room
 */
function deleteRoom() {
  // Change modal state to busy
  isLoadingAction.value = true;
  // Remove room
  api
    .call("rooms/" + props.room.id, {
      method: "delete",
    })
    .then(() => {
      // delete successful
      emit("roomDeleted");
      modalVisible.value = false;
    })
    .catch((error) => {
      isLoadingAction.value = false;
      api.error(error, { noRedirectOnUnauthenticated: true });
    });
}
</script>
