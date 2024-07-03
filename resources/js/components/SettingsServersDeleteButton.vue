<template>
  <Button
    severity="danger"
    icon="fa-solid fa-trash"
    :disabled="isBusy"
    v-tooltip="$t('admin.servers.delete.item', { name: props.name })"
    :aria-label="$t('admin.servers.delete.item', { name: props.name })"
    @click="showDeleteModal()"
  />
    <Dialog
      v-model:visible="showModal"
      :header="$t('admin.servers.delete.title')"
      :style="{ width: '500px' }"
      :breakpoints="{ '575px': '90vw' }"
      modal
      :closeOnEscape="!isBusy"
      :closeable="!isBusy"
      :dismissableMask="!isBusy"
      :draggable=false
    >
      <span>{{ $t('admin.servers.delete.confirm', {name: props.name}) }}</span>

      <template #footer>
        <Button :label="$t('app.no')" severity="secondary" @click="showModal = false"/>
        <Button :label="$t('app.yes')" :loading="isBusy" severity="danger" @click="deleteServer"/>
      </template>
    </Dialog>
</template>

<script setup>

import { useApi } from '../composables/useApi.js';
import { ref } from 'vue';

const api = useApi();

const props = defineProps({
  id: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['deleted']);
const showModal = ref(false);
const isBusy = ref(false);

/**
 * Shows the delete modal
 *
 */
function showDeleteModal () {
  showModal.value = true;
}

/**
 * Deletes the server that is set in the property `serverToDelete`.
 */
function deleteServer () {
  isBusy.value = true;

  api.call(`servers/${props.id}`, {
    method: 'delete'
  }).then(() => {
    showModal.value = false;
    emit('deleted');
  }).catch(error => {
    api.error(error);
  }).finally(() => {
    isBusy.value = false;
  });
}
</script>
