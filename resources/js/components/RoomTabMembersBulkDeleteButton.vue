<template>
  <Button
    v-tooltip="
      $t('rooms.members.bulk_remove_user', {
        numberOfSelectedUsers: props.userIds.length,
      })
    "
    data-test="room-members-bulk-delete-button"
    :aria-label="
      $t('rooms.members.bulk_remove_user', {
        numberOfSelectedUsers: props.userIds.length,
      })
    "
    :disabled="disabled"
    severity="danger"
    icon="fa-solid fa-users-slash"
    @click="showModal"
  />

  <!-- bulk edit user role modal -->
  <Dialog
    v-model:visible="modalVisible"
    data-test="room-members-bulk-delete-dialog"
    modal
    :header="
      $t('rooms.members.modals.remove.title_bulk', {
        numberOfSelectedUsers: props.userIds.length,
      })
    "
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="false"
    :closable="!isLoadingAction"
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
          @click="deleteMembers"
        />
      </div>
    </template>

    <div class="flex flex-col gap-2">
      <span>
        {{
          $t("rooms.members.modals.remove.confirm_bulk", {
            numberOfSelectedUsers: props.userIds.length,
          })
        }}
      </span>
      <FormError :errors="formErrors.fieldError('users', true)" />
    </div>
  </Dialog>
</template>
<script setup>
import env from "../env";
import { useApi } from "../composables/useApi.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import { ref } from "vue";

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
  userIds: {
    type: Array,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["deleted"]);

const api = useApi();
const formErrors = useFormErrors();

const modalVisible = ref(false);
const isLoadingAction = ref(false);

/**
 * show modal to bulk edit users role
 */
function showModal() {
  formErrors.clear();
  modalVisible.value = true;
}

/**
 * Save new user role
 */
function deleteMembers() {
  isLoadingAction.value = true;

  // reset previous error messages
  formErrors.clear();

  api
    .call("rooms/" + props.roomId + "/member/bulk", {
      method: "delete",
      data: { users: props.userIds },
    })
    .then(() => {
      // operation successful, close modal and reload list
      modalVisible.value = false;
      emit("deleted");
    })
    .catch((error) => {
      // editing failed
      if (error.response) {
        // failed due to form validation errors
        if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          formErrors.set(error.response.data.errors);
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
