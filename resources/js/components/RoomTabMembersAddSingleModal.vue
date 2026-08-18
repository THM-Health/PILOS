<template>
  <!-- add new user modal -->
  <Dialog
    v-model:visible="modalVisible"
    data-test="room-members-add-single-dialog"
    modal
    :header="$t('rooms.members.add_single_user')"
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
          :label="$t('rooms.members.modals.add.add')"
          :loading="isLoadingAction"
          data-test="dialog-save-button"
          form="room-members-add-single-form"
          type="submit"
        />
      </div>
    </template>

    <Form
      id="room-members-add-single-form"
      :disabled="isLoadingAction"
      @submit="save"
    >
      <!-- select user -->
      <div class="field relative mt-2 flex flex-col gap-2 overflow-visible">
        <label id="user-label">{{ $t("app.user") }}</label>
        <UserSearch
          v-model="user"
          :disabled="isLoadingAction"
          :invalid="formErrors.fieldInvalid('user')"
          aria-labelledby="user-label"
          data-test="select-user-dropdown"
        />
        <FormError :errors="formErrors.fieldError('user')" />
      </div>

      <!-- select role -->
      <div class="field mt-6 flex flex-col gap-2">
        <fieldset class="flex w-full flex-col gap-2">
          <legend>{{ $t("rooms.role") }}</legend>

          <div class="flex items-center" data-test="participant-role-group">
            <RadioButton
              v-model="role"
              :disabled="isLoadingAction"
              input-id="participant-role"
              name="role"
              pt:input:required
              :invalid="formErrors.fieldInvalid('role')"
              :value="1"
            />
            <label for="participant-role" class="ml-2"
              ><RoomRoleBadge :role="1"
            /></label>
          </div>

          <div class="flex items-center" data-test="moderator-role-group">
            <RadioButton
              v-model="role"
              :disabled="isLoadingAction"
              input-id="moderator-role"
              name="role"
              pt:input:required
              :invalid="formErrors.fieldInvalid('role')"
              :value="2"
            />
            <label for="moderator-role" class="ml-2"
              ><RoomRoleBadge :role="2"
            /></label>
          </div>

          <div class="flex items-center" data-test="co-owner-role-group">
            <RadioButton
              v-model="role"
              :disabled="isLoadingAction"
              input-id="co_owner-role"
              name="role"
              pt:input:required
              :invalid="formErrors.fieldInvalid('role')"
              :value="3"
            />
            <label for="co_owner-role" class="ml-2"
              ><RoomRoleBadge :role="3"
            /></label>
          </div>

          <FormError :errors="formErrors.fieldError('role')" />
        </fieldset>
      </div>
    </Form>
  </Dialog>
</template>
<script setup>
import { useApi } from "../composables/useApi.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import { ref } from "vue";
import { HTTP_STATUS_UNPROCESSABLE_ENTITY } from "../constants/httpStatusCodes.js";

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

const emit = defineEmits(["added"]);
const api = useApi();
const formErrors = useFormErrors();

const modalVisible = ref(false);
const user = ref(null);
const role = ref(null);
const isLoadingAction = ref(false);

defineExpose({
  showModal,
});
/**
 * show modal to add a new user as member
 */
function showModal() {
  user.value = null;
  role.value = null;
  formErrors.clear();
  modalVisible.value = true;
}

/**
 * Add a user as a room member
 */
function save() {
  isLoadingAction.value = true;

  // reset previous error messages
  formErrors.clear();

  // post new user as room members
  api
    .call("rooms/" + props.roomId + "/member", {
      method: "post",
      data: { user: user.value?.id, role: role.value },
    })
    .then(() => {
      // operation successful, close modal and reload list
      modalVisible.value = false;
      emit("added");
    })
    .catch((error) => {
      // adding failed
      if (error.response) {
        // failed due to form validation errors
        if (error.response.status === HTTP_STATUS_UNPROCESSABLE_ENTITY) {
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
