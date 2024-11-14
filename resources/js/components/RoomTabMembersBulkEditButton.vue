<template>
  <Button
    v-tooltip="
      $t('rooms.members.bulk_edit_user', {
        numberOfSelectedUsers: props.userIds.length,
      })
    "
    data-test="room-members-bulk-edit-button"
    :aria-label="
      $t('rooms.members.bulk_edit_user', {
        numberOfSelectedUsers: props.userIds.length,
      })
    "
    :disabled="disabled"
    severity="info"
    icon="fa-solid fa-users-cog"
    @click="showModal"
  />

  <!-- bulk edit user role modal -->
  <Dialog
    v-model:visible="modalVisible"
    data-test="room-members-bulk-edit-dialog"
    modal
    :header="
      $t('rooms.members.modals.edit.title_bulk', {
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
          :label="$t('app.cancel')"
          severity="secondary"
          :disabled="isLoadingAction"
          data-test="dialog-cancel-button"
          @click="modalVisible = false"
        />
        <Button
          :label="$t('app.save')"
          :loading="isLoadingAction"
          :disabled="isLoadingAction"
          data-test="dialog-save-button"
          @click="save"
        />
      </div>
    </template>

    <!-- select role -->
    <div class="mt-6 flex flex-col gap-2">
      <fieldset class="flex w-full flex-col gap-2">
        <legend>{{ $t("rooms.role") }}</legend>

        <div class="flex items-center" data-test="participant-role-group">
          <RadioButton
            v-model="newRole"
            :disabled="isLoadingAction"
            input-id="participant-role"
            name="role"
            :value="1"
          />
          <label for="participant-role" class="ml-2"
            ><RoomRoleBadge :role="1"
          /></label>
        </div>

        <div class="flex items-center" data-test="moderator-role-group">
          <RadioButton
            v-model="newRole"
            :disabled="isLoadingAction"
            input-id="moderator-role"
            name="role"
            :value="2"
          />
          <label for="moderator-role" class="ml-2"
            ><RoomRoleBadge :role="2"
          /></label>
        </div>

        <div class="flex items-center" data-test="co-owner-role-group">
          <RadioButton
            v-model="newRole"
            :disabled="isLoadingAction"
            input-id="co_owner-role"
            name="role"
            :value="3"
          />
          <label for="co_owner-role" class="ml-2"
            ><RoomRoleBadge :role="3"
          /></label>
        </div>

        <FormError :errors="formErrors.fieldError('role')" />
      </fieldset>
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

const emit = defineEmits(["edited"]);

const api = useApi();
const formErrors = useFormErrors();

const modalVisible = ref(false);
const newRole = ref(null);
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
function save() {
  isLoadingAction.value = true;

  // reset previous error messages
  formErrors.clear();

  api
    .call("rooms/" + props.roomId + "/member/bulk", {
      method: "put",
      data: { role: newRole.value, users: props.userIds },
    })
    .then(() => {
      // operation successful, close modal and reload list
      modalVisible.value = false;
      emit("edited");
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
      api.error(error, { noRedirectOnUnauthenticated: true });
    })
    .finally(() => {
      isLoadingAction.value = false;
    });
}
</script>
