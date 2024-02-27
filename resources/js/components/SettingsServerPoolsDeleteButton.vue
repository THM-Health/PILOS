<template>
  <Button
    v-tooltip="$t('settings.server_pools.delete.item', { name: props.name })"
    :aria-label="$t('settings.server_pools.delete.item', { name: props.name })"
    :disabled="isBusy"
    icon="fa-solid fa-trash"
    severity="danger"
    @click="showDeleteModal"
  ></Button>

  <Dialog
    v-model:visible="showModal"
    :breakpoints="{ '575px': '90vw' }"
    :closeOnEscape="!isBusy"
    :closeable="!isBusy"
    :dismissableMask="!isBusy"
    :draggable=false
    :header="$t('settings.server_pools.delete.title')"
    :style="{ width: '500px' }"
    modal
  >
    <span>
      {{ $t('settings.server_pools.delete.confirm', {name: props.name}) }}
    </span>

    <div v-if="deleteFailedRoomTypes" class="mt-2">
      <InlineMessage
        severity="error"
        :pt="{
          icon:{class:'hidden'}
        }"
      >
        {{ $t('settings.server_pools.delete.failed') }}
        <ul>
          <li
            v-for="roomType in deleteFailedRoomTypes"
            :key="roomType.id"
          >
            {{ roomType.description }}
          </li>
        </ul>
      </InlineMessage>
    </div>

    <template v-if="deleteFailedRoomTypes==null" #footer>
      <Button :label="$t('app.no')" severity="secondary" @click="showModal = false"></Button>
      <Button :label="$t('app.yes')" :loading="isBusy" severity="danger" @click="deleteServerPool"></Button>
    </template>
  </Dialog>
</template>
<script setup>

import { useApi } from '../composables/useApi.js';
import { ref } from 'vue';
import env from '../env.js';

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
const deleteFailedRoomTypes = ref(null);

/**
 * Shows the delete modal
 *
 */
function showDeleteModal () {
  deleteFailedRoomTypes.value = null;
  showModal.value = true;
}

/**
 * Deletes the server pool
 */
function deleteServerPool () {
  isBusy.value = true;

  api.call(`serverPools/${props.id}`, {
    method: 'delete'
  }).then(() => {
    showModal.value = false;
    emit('deleted');
  }).catch(error => {
    if (error.response && error.response.status === env.HTTP_STALE_MODEL) {
      deleteFailedRoomTypes.value = error.response.data.room_types;
    } else {
      api.error(error);
    }
  }).finally(() => {
    isBusy.value = false;
  });
}

</script>
