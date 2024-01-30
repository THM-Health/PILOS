<template>
  <!-- button -->
  <Button
    severity="danger"
    :disabled="disabled"
    @click="showDeleteModal"
    icon="fa-solid fa-trash"
    v-tooltip="$t('rooms.tokens.delete')"
  />

  <!-- modal -->
  <Dialog
    v-model:visible="showModal"
    modal
    :header="$t('rooms.tokens.delete')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :closeOnEscape="!isLoadingAction"
    :dismissableMask="false"
    :closable="!isLoadingAction"
  >

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <Button :label="$t('app.no')" severity="secondary" outlined @click="showModal = false" :disabled="isLoadingAction" />
        <Button :label="$t('app.yes')" severity="danger" :loading="isLoadingAction" :disabled="isLoadingAction" @click="deleteToken" />
      </div>
    </template>

    <span>
      {{ $t('rooms.tokens.confirm_delete', { firstname: props.firstname, lastname: props.lastname }) }}
    </span>
  </Dialog>
</template>

<script setup>

import { useApi } from '../composables/useApi.js';
import { ref } from 'vue';

const props = defineProps([
  'roomId',
  'token',
  'firstname',
  'lastname',
  'disabled'
]);

const emit = defineEmits(['added']);

const api = useApi();

const showModal = ref(false);
const isLoadingAction = ref(false);

/**
 * show modal
 */
function showDeleteModal () {
  showModal.value = true;
}

/**
 * Sends a request to the server to create a new token or edit a existing.
 */
function deleteToken () {
  isLoadingAction.value = true;

  const config = {
    method: 'delete'
  };

  api.call(`rooms/${props.roomId}/tokens/${props.token}`, config).then(response => {
    // operation successful, close modal and reload list
    showModal.value = false;
    emit('deleted');
  }).catch(error => {
    api.error(error);
  }).finally(() => {
    isLoadingAction.value = false;
  });
}

</script>
