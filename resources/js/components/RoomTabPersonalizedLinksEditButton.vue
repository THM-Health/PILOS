<template>
  <!-- button -->
  <Button
    v-tooltip="$t('rooms.tokens.edit')"
    severity="info"
    :disabled="disabled"
    icon="fa-solid fa-edit"
    :aria-label="$t('rooms.tokens.edit')"
    data-test="room-personalized-links-edit-button"
    @click="showModal"
  />

  <!-- modal -->
  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('rooms.tokens.edit')"
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
          :disabled="isLoadingAction"
          data-test="dialog-save-button"
          @click="save"
        />
      </div>
    </template>

    <!-- first name -->
    <div class="mt-6 flex flex-col gap-2" data-test="firstname-field">
      <label for="firstname">{{ $t("app.firstname") }}</label>
      <InputText
        id="firstname"
        v-model.trim="newFirstname"
        autofocus
        :disabled="isLoadingAction"
        :invalid="formErrors.fieldInvalid('firstname')"
      />
      <FormError :errors="formErrors.fieldError('firstname')" />
    </div>

    <!-- last name -->
    <div class="mt-6 flex flex-col gap-2" data-test="lastname-field">
      <label for="lastname">{{ $t("app.lastname") }}</label>
      <InputText
        id="lastname"
        v-model.trim="newLastname"
        :disabled="isLoadingAction"
        :invalid="formErrors.fieldInvalid('lastname')"
      />
      <FormError :errors="formErrors.fieldError('lastname')" />
    </div>

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
      </fieldset>

      <FormError :errors="formErrors.fieldError('role')" />
    </div>
  </Dialog>
</template>

<script setup>
import { useApi } from "../composables/useApi.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import { ref } from "vue";
import env from "../env.js";
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
  token: {
    type: String,
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

const emit = defineEmits(["edited", "notFound"]);

const api = useApi();
const formErrors = useFormErrors();
const toast = useToast();
const { t } = useI18n();

const modalVisible = ref(false);
const newFirstname = ref(null);
const newLastname = ref(null);
const newRole = ref(null);
const isLoadingAction = ref(false);

/**
 * show modal
 */
function showModal() {
  newFirstname.value = props.firstname;
  newLastname.value = props.lastname;
  newRole.value = props.role;
  formErrors.clear();
  modalVisible.value = true;
}

/**
 * Sends a request to the server to create a new token or edit a existing.
 */
function save() {
  isLoadingAction.value = true;
  formErrors.clear();

  const config = {
    method: "put",
    data: {
      firstname: newFirstname.value,
      lastname: newLastname.value,
      role: newRole.value,
    },
  };

  api
    .call(`rooms/${props.roomId}/tokens/${props.token}`, config)
    .then(() => {
      // operation successful, close modal and reload list
      modalVisible.value = false;
      emit("edited");
    })
    .catch((error) => {
      // editing failed
      if (error.response) {
        // token not found
        if (error.response.status === env.HTTP_NOT_FOUND) {
          toast.error(t("rooms.flash.token_gone"));
          showModal.value = false;
          emit("notFound");
          return;
        }
        // failed due to form validation errors
        if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
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
