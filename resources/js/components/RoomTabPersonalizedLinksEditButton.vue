<template>
  <!-- button -->
  <Button
    v-tooltip="$t('rooms.personalized_links.edit')"
    severity="info"
    :disabled="disabled"
    icon="fa-solid fa-edit"
    :aria-label="
      $t('rooms.personalized_links.edit_aria', {
        description: props.description,
      })
    "
    data-test="room-personalized-links-edit-button"
    @click="showModal"
  />

  <!-- modal -->
  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('rooms.personalized_links.edit')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="false"
    :closable="!isLoadingAction"
    data-test="room-personalized-links-edit-dialog"
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
          form="room-personalized-links-edit-form"
          type="submit"
        />
      </div>
    </template>

    <Form
      id="room-personalized-links-edit-form"
      :disabled="isLoadingAction"
      @submit="save"
    >
      <!-- description -->
      <div class="field mt-6 flex flex-col gap-2" data-test="description-field">
        <label for="description">{{ $t("app.description") }}</label>
        <InputText
          id="description"
          v-model.trim="newDescription"
          autofocus
          :disabled="isLoadingAction"
          :invalid="formErrors.fieldInvalid('description')"
        />
        <FormError :errors="formErrors.fieldError('description')" />
      </div>

      <!-- enforced name -->
      <div
        class="field mt-6 flex flex-col gap-2"
        data-test="enforced-name-field"
      >
        <label for="enforced-name">{{
          $t("rooms.personalized_links.enforced_name")
        }}</label>
        <InputText
          id="enforced-name"
          v-model.trim="newEnforcedName"
          aria-describedby="enforced-name-hint"
          :disabled="isLoadingAction"
          :invalid="formErrors.fieldInvalid('enforced_name')"
        />
        <small id="enforced-name-hint">{{
          $t("rooms.personalized_links.enforced_name_hint")
        }}</small>
        <FormError :errors="formErrors.fieldError('enforced_name')" />
      </div>

      <!-- select role -->
      <div class="field mt-6 flex flex-col gap-2">
        <fieldset class="flex w-full flex-col gap-2">
          <legend>{{ $t("rooms.role") }}</legend>

          <div class="flex items-center" data-test="participant-role-group">
            <RadioButton
              v-model="newRole"
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
              v-model="newRole"
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
        </fieldset>

        <FormError :errors="formErrors.fieldError('role')" />
      </div>
    </Form>
  </Dialog>
</template>

<script setup>
import { useApi } from "../composables/useApi.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import { ref } from "vue";
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";
import { ROOM_PERSONALIZED_LINK } from "../constants/modelNames.js";
import {
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "../constants/httpStatusCodes.js";

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
  id: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  enforcedName: {
    type: [String, null],
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

const emit = defineEmits(["edited", "notFound"]);

const api = useApi();
const formErrors = useFormErrors();
const toast = useToast();
const { t } = useI18n();

const modalVisible = ref(false);
const newDescription = ref(null);
const newEnforcedName = ref(null);
const newRole = ref(null);
const isLoadingAction = ref(false);

/**
 * show modal
 */
function showModal() {
  newDescription.value = props.description;
  newEnforcedName.value = props.enforcedName;
  newRole.value = props.role;
  formErrors.clear();
  modalVisible.value = true;
}

/**
 * Sends a request to the server to edit a personalized link.
 */
function save() {
  isLoadingAction.value = true;
  formErrors.clear();

  const config = {
    method: "put",
    data: {
      description: newDescription.value,
      enforced_name: newEnforcedName.value,
      role: newRole.value,
    },
  };

  api
    .call(`rooms/${props.roomId}/personalizedLinks/${props.id}`, config)
    .then(() => {
      // operation successful, close modal and reload list
      modalVisible.value = false;
      emit("edited");
    })
    .catch((error) => {
      // editing failed
      if (error.response) {
        // token not found
        if (
          error.response.status === HTTP_STATUS_NOT_FOUND &&
          error.response.data?.model === ROOM_PERSONALIZED_LINK
        ) {
          toast.error(t("rooms.flash.personalized_link_gone"));
          modalVisible.value = false;
          emit("notFound");
          return;
        }
        // failed due to form validation errors
        if (error.response.status === HTTP_STATUS_UNPROCESSABLE_ENTITY) {
          formErrors.set(error.response.data.errors);
          return;
        }
        api.error(error, { redirectOnUnauthenticated: false });
      }
    })
    .finally(() => {
      isLoadingAction.value = false;
    });
}
</script>
