<template>
  <!-- button -->
  <Button
    :disabled="disabled"
    @click="showAddModal"
    icon="fa-solid fa-plus"
    :aria-label="$t('rooms.tokens.add')"
    v-tooltip="$t('rooms.tokens.add')"
  />

  <!-- modal -->
  <Dialog
    v-model:visible="showModal"
    modal
    :header="$t('rooms.tokens.add')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :closeOnEscape="!isLoadingAction"
    :dismissableMask="false"
    :closable="!isLoadingAction"
  >

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button :label="$t('app.cancel')" severity="secondary" @click="showModal = false" :disabled="isLoadingAction" />
        <Button :label="$t('app.save')" :loading="isLoadingAction" :disabled="isLoadingAction" @click="save" />
      </div>
    </template>

    <!-- first name -->
    <div class="flex flex-col gap-2 mt-6">
      <label for="firstname">{{ $t('app.firstname') }}</label>
      <InputText
        id="firstname"
        v-model.trim="firstname"
        :invalid="formErrors.fieldInvalid('firstname')"
      />
      <p class="p-error" v-html="formErrors.fieldError('firstname')" />
    </div>

    <!-- last name -->
    <div class="flex flex-col gap-2 mt-6">
      <label for="lastname">{{ $t('app.lastname') }}</label>
      <InputText
        id="lastname"
        v-model.trim="lastname"
        :invalid="formErrors.fieldInvalid('lastname')"
      />
      <p class="p-error" v-html="formErrors.fieldError('lastname')" />
    </div>

    <!-- select role -->
    <div class="flex flex-col gap-2 mt-6">
      <label for="role">{{ $t('rooms.role') }}</label>

      <div class="flex items-center">
        <RadioButton v-model="role" inputId="participant-role" name="role" :value="1" />
        <label for="participant-role" class="ml-2"><RoomRoleBadge :role="1" /></label>
      </div>

      <div class="flex items-center">
        <RadioButton v-model="role" inputId="participant-moderator" name="role" :value="2" />
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

const props = defineProps({
  roomId: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['added']);

const api = useApi();
const formErrors = useFormErrors();

const showModal = ref(false);
const firstname = ref(null);
const lastname = ref(null);
const role = ref(null);
const isLoadingAction = ref(false);

/**
 * show modal
 */
function showAddModal () {
  firstname.value = null;
  lastname.value = null;
  role.value = null;
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
    method: 'post',
    data: {
      firstname: firstname.value,
      lastname: lastname.value,
      role: role.value
    }
  };

  api.call(`rooms/${props.roomId}/tokens/`, config).then(response => {
    // operation successful, close modal and reload list
    showModal.value = false;
    emit('added');
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
