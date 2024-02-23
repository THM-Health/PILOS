<template>
  <Button
    v-tooltip="$t('settings.roles.delete.item', { id: props.name })"
    :aria-label="$t('settings.roles.delete.item', { id: props.name })"
    :disabled="isBusy"
    severity="danger"
    @click="showDeleteModal"
    icon="fa-solid fa-trash"
  />

  <Dialog
    v-model:visible="showModal"
    modal
    :header="$t('settings.users.reset_password.title')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :closeOnEscape="!isBusy"
    :dismissableMask="!isBusy"
    :closeable="!isBusy"
    :draggable = false
  >
    <span>
      {{ $t('settings.roles.delete.confirm', { name: $te(`app.role_labels.${props.name}`) ? $t(`app.role_labels.${props.name}`) : props.name }) }}
    </span>
    <template #footer>
      <Button :label="$t('app.no')" severity="secondary" @click="showModal = false"></Button>
      <Button :label="$t('app.yes')" severity="danger" :loading="isBusy" @click="deleteRole"></Button>
    </template>
  </Dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useApi } from '../composables/useApi.js';

const api = useApi();

const props = defineProps({
  id: {
    type: String,
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
