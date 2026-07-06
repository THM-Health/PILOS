<!--
SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <Button
    v-tooltip="$t('rooms.members.edit_user')"
    data-test="room-members-edit-button"
    :aria-label="$t('rooms.members.edit_user')"
    :disabled="disabled"
    severity="info"
    icon="fa-solid fa-edit"
    @click="showModal"
  />

  <!-- edit user role modal -->
  <Dialog
    v-model:visible="modalVisible"
    data-test="room-members-edit-dialog"
    modal
    :header="
      $t('rooms.members.modals.edit.title', {
        firstname: props.firstname,
        lastname: props.lastname,
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
          data-test="dialog-save-button"
          form="room-members-edit-form"
          type="submit"
        />
      </div>
    </template>

    <Form
      id="room-members-edit-form"
      :disabled="isLoadingAction"
      @submit="save"
    >
      <!-- select role -->
      <div class="field mt-6 flex flex-col gap-2">
        <fieldset class="flex w-full flex-col gap-2">
          <legend>{{ $t("rooms.role") }}</legend>

          <div class="flex items-center" data-test="participant-role-group">
            <RadioButton
              v-model="newRole"
              :disabled="isLoadingAction"
              input-id="participant-role"
              pt:input:required
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
              v-model="newRole"
              :disabled="isLoadingAction"
              input-id="moderator-role"
              pt:input:required
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
              v-model="newRole"
              :disabled="isLoadingAction"
              input-id="co_owner-role"
              pt:input:required
              :invalid="formErrors.fieldInvalid('role')"
              name="role"
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
import { USER } from "../constants/modelNames.js";
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";
import {
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "../constants/httpStatusCodes.js";

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
  userId: {
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
  role: {
    type: Number,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["edited", "gone"]);

const api = useApi();
const formErrors = useFormErrors();
const toast = useToast();
const { t } = useI18n();

const modalVisible = ref(false);
const newRole = ref(null);
const isLoadingAction = ref(false);

/**
 * show modal to edit user role
 */
function showModal() {
  newRole.value = props.role;
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
    .call("rooms/" + props.roomId + "/member/" + props.userId, {
      method: "put",
      data: { role: newRole.value },
    })
    .then(() => {
      // operation successful, close modal and reload list
      modalVisible.value = false;
      emit("edited");
    })
    .catch((error) => {
      // editing failed
      if (error.response) {
        // user not found
        if (
          error.response.status === HTTP_STATUS_NOT_FOUND &&
          error.response.data?.model === USER
        ) {
          toast.error(t("app.errors.not_member_of_room"));
          emit("gone");
          modalVisible.value = false;
          return;
        }
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
