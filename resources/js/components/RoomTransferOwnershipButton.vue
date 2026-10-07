<template>
  <Button
    v-if="userPermissions.can('transfer', room)"
    data-test="room-transfer-ownership-button"
    severity="secondary"
    icon="fa-solid fa-user-gear"
    :label="$t('rooms.modals.transfer_ownership.title')"
    :disabled="disabled"
    @click="showModal"
  />

  <!--transfer ownership modal-->
  <Dialog
    v-model:visible="modalVisible"
    data-test="room-transfer-ownership-dialog"
    modal
    :header="$t('rooms.modals.transfer_ownership.title')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="false"
    :closable="!isLoadingAction"
  >
    <Form
      id="room-transfer-ownership-form"
      :disabled="isLoadingAction"
      @submit="transferOwnership"
    >
      <!--select new owner-->
      <div class="field relative mt-2 flex flex-col gap-2 overflow-visible">
        <label id="user-label">{{ $t("app.user") }}</label>
        <UserSearch
          v-model="newOwner"
          :disabled="isLoadingAction"
          :disabled-users="[room.owner.id]"
          :invalid="formErrors.fieldInvalid('user')"
          aria-labelledby="user-label"
          data-test="new-owner-dropdown"
        />
        <FormError :errors="formErrors.fieldError('user')" />
      </div>

      <!--select new role with which the current owner should be added as a member of the room -->
      <div class="field mt-6 flex flex-col gap-2">
        <fieldset class="flex w-full flex-col gap-2">
          <legend>{{ $t("rooms.modals.transfer_ownership.new_role") }}</legend>

          <div class="flex items-center" data-test="participant-role-group">
            <RadioButton
              v-model="newRoleInRoom"
              :disabled="isLoadingAction"
              pt:input:required
              input-id="participant-role"
              :invalid="formErrors.fieldInvalid('role')"
              name="role"
              :value="1"
            />
            <label for="participant-role" class="ml-2"
              ><RoomRoleBadge :role="1"
            /></label>
          </div>

          <div class="flex items-center" data-test="moderator-role-group">
            <RadioButton
              v-model="newRoleInRoom"
              :disabled="isLoadingAction"
              pt:input:required
              input-id="moderator-role"
              :invalid="formErrors.fieldInvalid('role')"
              name="role"
              :value="2"
            />
            <label for="moderator-role" class="ml-2"
              ><RoomRoleBadge :role="2"
            /></label>
          </div>

          <div class="flex items-center" data-test="co-owner-role-group">
            <RadioButton
              v-model="newRoleInRoom"
              :disabled="isLoadingAction"
              pt:input:required
              input-id="co-owner-role"
              :invalid="formErrors.fieldInvalid('role')"
              name="role"
              :value="3"
            />
            <label for="co-owner-role" class="ml-2"
              ><RoomRoleBadge :role="3"
            /></label>
          </div>

          <Divider />
          <!--option to not add the current user as a member of the room-->
          <div data-test="no-role-group">
            <div class="flex items-center">
              <RadioButton
                v-model="newRoleInRoom"
                pt:input:required
                :disabled="isLoadingAction"
                input-id="no-role"
                :invalid="formErrors.fieldInvalid('role')"
                name="role"
                :value="-1"
                :pt="{
                  input: {
                    'aria-describedby': 'no-role-warning',
                  },
                }"
              />
              <label for="no-role" class="ml-2"><RoomRoleBadge /></label>
            </div>
            <small id="no-role-warning">{{
              $t("rooms.modals.transfer_ownership.warning")
            }}</small>
          </div>

          <FormError :errors="formErrors.fieldError('role')" />
        </fieldset>
      </div>
    </Form>

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
          :label="$t('rooms.modals.transfer_ownership.transfer')"
          severity="danger"
          :loading="isLoadingAction"
          data-test="dialog-continue-button"
          form="room-transfer-ownership-form"
          type="submit"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { useFormErrors } from "../composables/useFormErrors.js";
import { useApi } from "../composables/useApi.js";
import { ref } from "vue";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { HTTP_STATUS_UNPROCESSABLE_ENTITY } from "../constants/httpStatusCodes.js";

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["transferredOwnership"]);

const isLoadingAction = ref(false);
const modalVisible = ref(false);
const newOwner = ref(null);
const newRoleInRoom = ref(3);

const formErrors = useFormErrors();
const api = useApi();
const userPermissions = useUserPermissions();

/**
 * transfer the room ownership to another user
 */
function transferOwnership() {
  isLoadingAction.value = true;

  // reset errors
  formErrors.clear();

  const data = {
    user: newOwner.value?.id,
  };
  if (newRoleInRoom.value !== -1) {
    data.role = newRoleInRoom.value;
  }

  // transfer room ownership to the selected user
  api
    .call("rooms/" + props.room.id + "/transfer", {
      method: "post",
      data,
    })
    .then(() => {
      // operation successful, emit "transferred-ownership" to reload room view and close modal
      emit("transferredOwnership");
      modalVisible.value = false;
    })
    .catch((error) => {
      // transferring failed
      if (error.response) {
        // failed due to validation errors
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

/**
 * reset and show modal to transfer the room ownership
 */
function showModal() {
  newOwner.value = null;
  newRoleInRoom.value = 3;
  formErrors.clear();
  modalVisible.value = true;
}
</script>
