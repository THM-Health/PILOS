<template>
  <!-- button -->
  <Button
    v-tooltip="$t('rooms.files.delete')"
    :disabled="disabled"
    severity="danger"
    @click="showModal = true"
    icon="fa-solid fa-trash"
  />

  <!-- modal -->
  <Dialog
    v-model:visible="showModal"
    modal
    :header="$t('rooms.files.delete')"
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
        <Button :label="$t('app.yes')" severity="danger" :loading="isLoadingAction" :disabled="isLoadingAction" @click="deleteFile" />
        </div>
    </template>

    <span style="overflow-wrap: break-word;">
      {{ $t('rooms.files.confirm_delete', { filename: filename }) }}
    </span>
  </Dialog>
</template>
<script setup>
import env from '@/env';
import { useApi } from '../composables/useApi.js';
import { ref } from 'vue';
import { useToast } from '../composables/useToast.js';
import { useI18n } from 'vue-i18n';

const props = defineProps([
  'roomId',
  'fileId',
  'filename',
  'disabled'
]);

const emit = defineEmits(['deleted']);

const api = useApi();
const toast = useToast();
const { t } = useI18n();

const showModal = ref(false);
const isLoadingAction = ref(false);

/*
 * Delete file
 */
function deleteFile () {
  isLoadingAction.value = true;

  api.call('rooms/' + props.roomId + '/files/' + props.fileId, {
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
        toast.errror(t('rooms.flash.file_gone'));
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
