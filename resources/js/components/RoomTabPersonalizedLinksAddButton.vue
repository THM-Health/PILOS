<template>
  <!-- button -->
  <Button
    v-tooltip="$t('rooms.tokens.add')"
    :disabled="disabled"
    icon="fa-solid fa-plus"
    :aria-label="$t('rooms.tokens.add')"
    data-test="room-personalized-links-add-button"
    @click="showModal"
  />

  <!-- modal -->
  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('rooms.tokens.add')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="false"
    :closable="!isLoadingAction"
    data-test="room-personalized-links-add-dialog"
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
        v-model.trim="firstname"
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
        v-model.trim="lastname"
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
            v-model="role"
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
            v-model="role"
            :disabled="isLoadingAction"
            input-id="moderator-role"
            name="role"
            :value="2"
          />
          <label for="moderator-role" class="ml-2"
            ><RoomRoleBadge :role="2"
          /></label>
        </div>

        <FormError :errors="formErrors.fieldError('role')" />
      </fieldset>
    </div>
  </Dialog>
</template>

<script setup>
import { useApi } from "../composables/useApi.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import { ref } from "vue";
import env from "../env.js";

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
const firstname = ref(null);
const lastname = ref(null);
const role = ref(null);
const isLoadingAction = ref(false);

/**
 * show modal
 */
function showModal() {
  firstname.value = null;
  lastname.value = null;
  role.value = null;
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
    method: "post",
    data: {
      firstname: firstname.value,
      lastname: lastname.value,
      role: role.value,
    },
  };

  api
    .call(`rooms/${props.roomId}/tokens/`, config)
    .then(() => {
      // operation successful, close modal and reload list
      modalVisible.value = false;
      emit("added");
    })
    .catch((error) => {
      if (
        error.response &&
        error.response.status === env.HTTP_UNPROCESSABLE_ENTITY
      ) {
        formErrors.set(error.response.data.errors);
      } else {
        api.error(error, { redirectOnUnauthenticated: false });
      }
    })
    .finally(() => {
      isLoadingAction.value = false;
    });
}
</script>
