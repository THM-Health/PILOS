<template>
  <Button
    v-tooltip="$t('rooms.members.remove_user')"
    :disabled="isBusy"
    severity="danger"
    @click="showModal = true"
    icon="fa-solid fa-user-slash"
  />

  <!-- edit user role modal -->
  <Dialog
    v-model:visible="showModal"
    modal
    :header="$t('rooms.members.modals.remove.title')"
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
        <Button :label="$t('app.yes')" :loading="isLoadingAction" :disabled="isLoadingAction" @click="deleteMember" />
        </div>
    </template>

    <span>
      {{ $t('rooms.members.modals.remove.confirm',{firstname: firstname,lastname: lastname}) }}
    </span>
  </Dialog>
</template>
<script setup>
import env from '@/env';
import { useApi } from '../composables/useApi.js';
import { ref } from 'vue';

const props = defineProps([
  'roomId',
  'userId',
  'firstname',
  'lastname',
  'isBusy'
]);

const emit = defineEmits(['added']);

const api = useApi();

const showModal = ref(false);
const isLoadingAction = ref(false);

/*
 * Save new user role
 */
function deleteMember () {
  isLoadingAction.value = true;

  api.call('rooms/' + props.roomId + '/member/' + props.userId, {
    method: 'delete'
  }).then(response => {
    // operation successful, close modal and reload list
    showModal.value = false;
    emit('deleted');
  }).catch((error) => {
    // editing failed
    if (error.response) {
      // user not found
      if (error.response.status === env.HTTP_GONE) {
        emit('deleted');
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
