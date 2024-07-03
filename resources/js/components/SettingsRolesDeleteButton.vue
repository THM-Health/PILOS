<template>
  <Button
    v-tooltip="$t('admin.roles.delete.item', { id: props.name })"
    :aria-label="$t('admin.roles.delete.item', { id: props.name })"
    :disabled="isBusy"
    severity="danger"
    @click="showDeleteModal"
    icon="fa-solid fa-trash"
  />

  <Dialog
    v-model:visible="showModal"
    modal
    :header="$t('admin.roles.delete.title')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :closeOnEscape="!isBusy"
    :dismissableMask="!isBusy"
    :closeable="!isBusy"
    :draggable = false
  >
    <span>
      {{ $t('admin.roles.delete.confirm', { name: props.name })}}
    </span>
    <template #footer>
      <Button :label="$t('app.no')" severity="secondary" @click="showModal = false"/>
      <Button :label="$t('app.yes')" severity="danger" :loading="isBusy" @click="deleteRole"/>
    </template>
  </Dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useApi } from '../composables/useApi.js';

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
 * Deletes the role
 *
 */
function deleteRole () {
  isBusy.value = true;
  api.call(`roles/${props.id}`, {
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
