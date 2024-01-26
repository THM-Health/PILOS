<template>
  <Button
    v-tooltip="$t('rooms.members.bulk_remove_user',{numberOfSelectedUsers: props.userIds.length})"
    :disabled="isBusy"
    severity="danger"
    @click="showBulkDeleteMembersModal"
    icon="fa-solid fa-users-slash"
  />

  <!-- bulk edit user role modal -->
  <Dialog
    v-model:visible="showModal"
    modal
    :header="$t('rooms.members.modals.remove.title_bulk', {numberOfSelectedUsers: props.userIds.length})"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :closeOnEscape="!isLoadingAction"
    :dismissableMask="false"
    :closable="!isLoadingAction"
  >

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <Button :label="$t('app.no')" outlined @click="showModal = false" :disabled="isLoadingAction" />
        <Button :label="$t('app.yes')" :loading="isLoadingAction" :disabled="isLoadingAction" @click="deleteMembers" />
        </div>
    </template>

    {{ $t('rooms.members.modals.remove.confirm_bulk', {numberOfSelectedUsers: props.userIds.length}) }}
  </Dialog>
</template>
<script setup>
import env from '@/env';
import { useApi } from '../composables/useApi.js';
import { useFormErrors } from '../composables/useFormErrors.js';
import { ref } from 'vue';

const props = defineProps([
  'roomId',
  'userIds',
  'isBusy'
]);

const emit = defineEmits(['deleted']);

const api = useApi();
const formErrors = useFormErrors();

const showModal = ref(false);
const isLoadingAction = ref(false);

/**
 * show modal to bulk edit users role
 */
function showBulkDeleteMembersModal () {
  formErrors.clear();
  showModal.value = true;
}

/**
 * Save new user role
 */
function deleteMembers () {
  isLoadingAction.value = true;

  // reset previous error messages
  formErrors.clear();

  api.call('rooms/' + props.roomId + '/member/bulk', {
    method: 'delete',
    data: { users: props.userIds }
  }).then(response => {
    // operation successful, close modal and reload list
    showModal.value = false;
    emit('deleted');
  }).catch((error) => {
    // editing failed
    if (error.response) {
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
