<template>
  <!-- Remove room -->
  <Button
    v-if="userPermissions.can('delete', room)"
    ref="deleteButton"
    :disabled="disabled"
    @click="showModal = true"
    severity="danger"
    icon="fa-solid fa-trash"
    :label="$t('rooms.modals.delete.title')"
  />

  <!-- Remove room modal -->
  <Dialog
    v-model:visible="showModal"
    modal
    :header="$t('rooms.modals.delete.title')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :closeOnEscape="!isLoadingAction"
    :dismissableMask="false"
    :closable="!isLoadingAction"
  >
    {{ $t('rooms.modals.delete.confirm',{name: room.name}) }}

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <Button :label="$t('app.no')" severity="secondary" @click="showModal = false" :disabled="isLoadingAction" />
        <Button :label="$t('app.yes')" severity="danger" :loading="isLoadingAction" :disabled="isLoadingAction" @click="deleteRoom" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>

import { useApi } from '../composables/useApi.js';
import { ref } from 'vue';
import { useUserPermissions } from '../composables/useUserPermission.js';

const props = defineProps({
  room: {
    type: Object,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false,
    required: false
  }
});

const emit = defineEmits(['roomDeleted']);

const isLoadingAction = ref(false);
const showModal = ref(false);

const api = useApi();
const userPermissions = useUserPermissions();

/**
 * Handle deleting of the current room
 */
function deleteRoom () {
  // Change modal state to busy
  isLoadingAction.value = true;
  // Remove room
  api.call('rooms/' + props.room.id, {
    method: 'delete'
  }).then(response => {
    // delete successful
    emit('roomDeleted');
    showModal.value = false;
  }).catch((error) => {
    isLoadingAction.value = false;
    api.error(error);
  });
}
</script>
