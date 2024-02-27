<template>
  <!-- button -->
  <Button
    severity="secondary"
    :disabled="disabled"
    @click="showEditModal"
    icon="fa-solid fa-edit"
    v-tooltip="$t('rooms.tokens.edit')"
  />

  <!-- modal -->
  <Dialog
    v-model:visible="showModal"
    modal
    :header="$t('rooms.tokens.edit')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :closeOnEscape="!isLoadingAction"
    :dismissableMask="false"
    :closable="!isLoadingAction"
  >

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <Button :label="$t('app.cancel')" severity="secondary" @click="showModal = false" :disabled="isLoadingAction" />
        <Button :label="$t('app.save')" severity="success" :loading="isLoadingAction" :disabled="isLoadingAction" @click="save" />
      </div>
    </template>

    <!-- first name -->
    <div class="flex flex-column gap-2 mt-4">
      <label for="firstname">{{ $t('app.firstname') }}</label>
      <InputText
        id="firstname"
        v-model.trim="newFirstname"
        :invalid="formErrors.fieldInvalid('firstname')"
      />
      <p class="p-error" v-html="formErrors.fieldError('firstname')" />
    </div>

    <!-- last name -->
    <div class="flex flex-column gap-2 mt-4">
      <label for="lastname">{{ $t('app.lastname') }}</label>
      <InputText
        id="lastname"
        v-model.trim="newLastname"
        :invalid="formErrors.fieldInvalid('lastname')"
      />
      <p class="p-error" v-html="formErrors.fieldError('lastname')" />
    </div>

    <!-- select role -->
    <div class="flex flex-column gap-2 mt-4">
      <label for="role">{{ $t('rooms.role') }}</label>

      <div class="flex align-items-center">
        <RadioButton v-model="newRole" inputId="participant-role" name="role" :value="1" />
        <label for="participant-role" class="ml-2"><RoomRoleBadge :role="1" /></label>
      </div>

      <div class="flex align-items-center">
        <RadioButton v-model="newRole" inputId="participant-moderator" name="role" :value="2" />
        <label for="participant-moderator" class="ml-2"><RoomRoleBadge :role="2" /></label>
      </div>

      <p class="p-error" v-html="formErrors.fieldError('role')" />
    </div>
  </Dialog>
</template>

<script setup>

import { useApi } from '../composables/useApi.js';
import { useFormErrors } from '../composables/useFormErrors.js';
import { ref } from 'vue';
import env from '../env.js';

const props = defineProps([
  'roomId',
  'token',
  'firstname',
  'lastname',
  'role',
  'disabled'
]);

const emit = defineEmits(['added']);

const api = useApi();
const formErrors = useFormErrors();

const showModal = ref(false);
const newFirstname = ref(null);
const newLastname = ref(null);
const newRole = ref(null);
const isLoadingAction = ref(false);

/**
 * show modal
 */
function showEditModal () {
  newFirstname.value = props.firstname;
  newLastname.value = props.lastname;
  newRole.value = props.role;
  formErrors.clear();
  showModal.value = true;
}

/**
 * Sends a request to the server to create a new token or edit a existing.
 */
function save () {
  isLoadingAction.value = true;
  formErrors.clear();

  const config = {
    method: 'put',
    data: {
      firstname: newFirstname.value,
      lastname: newLastname.value,
      role: newRole.value
    }
  };

  api.call(`rooms/${props.roomId}/tokens/${props.token}`, config).then(response => {
    // operation successful, close modal and reload list
    showModal.value = false;
    emit('edited');
  }).catch(error => {
    if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
      formErrors.set(error.response.data.errors);
    } else {
      api.error(error);
    }
  }).finally(() => {
    isLoadingAction.value = false;
  });
}

</script>
