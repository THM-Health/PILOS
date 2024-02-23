<template>
  <Button
    v-tooltip="$t('rooms.members.edit_user')"
    :disabled="disabled"
    severity="secondary"
    @click="showEditMemberModal"
    icon="fa-solid fa-edit"
  />

  <!-- edit user role modal -->
  <Dialog
    v-model:visible="showModal"
    modal
    :header="$t('rooms.members.modals.edit.title',{firstname: props.firstname,lastname: props.lastname})"
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

      <div class="flex align-items-center">
        <RadioButton v-model="newRole" inputId="participant-co_owner" name="role" :value="3" />
        <label for="participant-co_owner" class="ml-2"><RoomRoleBadge :role="3" /></label>
      </div>

      <p class="p-error" v-html="formErrors.fieldError('role')" />
    </div>
  </Dialog>
</template>
<script setup>
import env from '../env';
import { useApi } from '../composables/useApi.js';
import { useFormErrors } from '../composables/useFormErrors.js';
import { ref } from 'vue';

const props = defineProps([
  'roomId',
  'userId',
  'firstname',
  'lastname',
  'role',
  'disabled'
]);

const emit = defineEmits(['edited']);

const api = useApi();
const formErrors = useFormErrors();

const showModal = ref(false);
const newRole = ref(null);
const isLoadingAction = ref(false);

/**
 * show modal to edit user role
 */
function showEditMemberModal () {
  newRole.value = props.role;
  formErrors.clear();
  showModal.value = true;
}

/**
 * Save new user role
 */
function save () {
  isLoadingAction.value = true;

  // reset previous error messages
  formErrors.clear();

  api.call('rooms/' + props.roomId + '/member/' + props.userId, {
    method: 'put',
    data: { role: newRole.value }
  }).then(response => {
    // operation successful, close modal and reload list
    showModal.value = false;
    emit('edited');
  }).catch((error) => {
    // editing failed
    if (error.response) {
      // user not found
      if (error.response.status === env.HTTP_GONE) {
        showModal.value = false;
        emit('edited');
        return;
      }
      // failed due to form validation errors
      if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
        formErrors.set(error.response.data.errors);
        return;
      }
    }
    showModal.value = false;
    api.error(error);
  }).finally(() => {
    isLoadingAction.value = false;
  });
}
</script>
