<template>
  <Button
    v-tooltip="$t('settings.users.delete.item', { firstname: props.firstname, lastname: props.lastname })"
    :aria-label="$t('settings.users.delete.item', { firstname: props.firstname, lastname: props.lastname })"
    :disabled="isBusy"
    severity="danger"
    @click="showDeleteModal"
    icon="fa-solid fa-trash"
  ></Button>
  <Dialog
    v-model:visible="showModal"
    modal
    :header="$t('settings.users.delete.title')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :closeOnEscape="!isBusy"
    :dismissableMask="!isBusy"
    :closeable="!isBusy"
    :draggable = false
  >
    <span>
      {{ $t('settings.users.delete.confirm', { firstname: props.firstname, lastname: props.lastname }) }}
    </span>
    <template #footer>
      <Button :label="$t('app.no')" severity="secondary" @click="showModal = false"></Button>
      <Button :label="$t('app.yes')" severity="danger" :loading="isBusy" @click="deleteUser"></Button>
    </template>

  </Dialog>
</template>

<script setup>

import { ref } from 'vue';
import { useApi } from '../composables/useApi.js';

const api = useApi();

const props = defineProps({
  id:{
    type: String,
    required: true
  },
  firstname:{
    type: String,
    required: true
  },
  lastname:{
    type:String,
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
function showDeleteModal(){
  showModal.value=true;
}

/**
 * Deletes the user
 *
 */
function deleteUser (){
  isBusy.value = true;
  api.call(`users/${props.id}`, {
    method: 'delete'
  }).then(()=>{
    showModal.value = false;
    emit('deleted');
  }).catch(error => {
    api.error(error);
  }).finally(() => {
    isBusy.value = false;
  });
}
</script>
