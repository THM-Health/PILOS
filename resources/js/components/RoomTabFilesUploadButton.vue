<template>
  <!-- button -->
  <Button
    class="flex-shrink-0"
    v-tooltip="$t('rooms.files.upload')"
    :aria-label="$t('rooms.files.upload')"
    severity="success"
    :disabled="disabled"
    @click="openModal"
    icon="fa-solid fa-upload"
  />

  <!-- modal -->
  <Dialog
    v-model:visible="showModal"
    modal
    :header="$t('rooms.files.upload')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :closeOnEscape="!isUploading"
    :dismissableMask="false"
    :closable="!isUploading"
  >
    <div class="flex flex-column gap-2">
        <label
          for="file"
          class="flex flex-row justify-content-center gap-2 p-button p-component border-round"
          :class="{'p-disabled': disabled}"
          tabindex="0"
          @keyup.enter="fileInputRef.click()"
          @keyup.space="fileInputRef.click()"
        >
          <i class="fa-solid fa-upload"></i> {{ $t('app.browse') }}
        </label>
        <input
          type="file"
          ref="fileInputRef"
          id="file"
          class="p-sr-only"
          :disabled="disabled"
          @input="fileSelected"
          :accept="'.'+String(settingsStore.getSetting('bbb.file_mimes')).split(',').join(',.')"
        />
        <div
          class="border-1 border-round border-400 text-center cursor-pointer align-items-center p-2"
          :class="dropZoneClasses"
          ref="dropZoneRef"
          @keyup.enter="fileInputRef.click()"
          @keyup.space="fileInputRef.click()"
          @click="fileInputRef.click()"
        >
          <span v-if="!isUploading" class="text-center">
            {{ $t('rooms.files.select_or_drag') }}
          </span>
          <span v-else>
            {{ uploadingFile }}
          </span>
        </div>

      <ProgressBar class="w-full mt-1" style="height: 1rem" :value="uploadProgress" v-if="isUploading" :showValue="false" />
      <small>{{ $t('rooms.files.formats',{formats: settingsStore.getSetting('bbb.file_mimes').replaceAll(',',', ')}) }}<br>{{ $t('rooms.files.size',{size: settingsStore.getSetting('bbb.max_filesize')}) }}</small>
      <p class="p-error" v-html="formErrors.fieldError('file')" />

      <Message v-if="uploaded" severity="success" icon="fa-solid fa-check-circle">
        {{ $t('rooms.files.uploaded') }}
      </Message>
  </div>

  </Dialog>
</template>
<script setup>

import { ref, computed } from 'vue';
import { useEventListener } from '@vueuse/core';
import { useFormErrors } from '../composables/useFormErrors.js';
import { useApi } from '../composables/useApi.js';
import env from '../env.js';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '../stores/settings.js';

const props = defineProps({
  roomId: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['uploaded']);

const dropZoneRef = ref();
const fileInputRef = ref();
const isOverDropZone = ref(false);
const isUploading = ref(false);
const uploadProgress = ref(0);
const uploadingFile = ref(null);

const showModal = ref(false);
const uploaded = ref(false);

const api = useApi();
const settingsStore = useSettingsStore();
const { t } = useI18n();

const formErrors = useFormErrors();

useEventListener(dropZoneRef, 'dragenter', (event) => {
  event.preventDefault();
  if (!isUploading.value) {
    isOverDropZone.value = true;
  }
});

useEventListener(dropZoneRef, 'dragover', (event) => {
  event.preventDefault();
  if (!isUploading.value) {
    isOverDropZone.value = true;
  }
});

useEventListener(dropZoneRef, 'dragleave', (event) => {
  event.preventDefault();
  if (!isUploading.value) {
    isOverDropZone.value = false;
  }
});

useEventListener(dropZoneRef, 'drop', (event) => {
  event.preventDefault();
  if (!isUploading.value) {
    isOverDropZone.value = false;
    fileInputRef.value.files = event.dataTransfer.files;
    uploadFile(event.dataTransfer.files[0]);
  }
});

const dropZoneClasses = computed(() => {
  if (isOverDropZone.value) {
    return [
      'bg-green-100',
      'border-green-400'
    ];
  }
  return [
    'surface-100',
    'border-400'
  ];
});

function openModal () {
  showModal.value = true;
  uploaded.value = false;
  formErrors.clear();
}

function fileSelected (event) {
  uploadFile(event.target.files[0]);
}

function uploadFile (file) {
  uploaded.value = false;

  if (file == null) {
    return;
  }

  uploadingFile.value = file.name;

  // uploading status
  isUploading.value = true;
  // Reset errors
  formErrors.clear();

  // Build form data
  const formData = new FormData();
  formData.append('file', file);

  // Send new file to api
  api.call('rooms/' + props.roomId + '/files', {
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data: formData,
    onUploadProgress: (progressEvent) => {
      uploadProgress.value = progressEvent.progress.toFixed(2) * 100;
    }
  }).then(response => {
    // Fetch successful
    emit('uploaded');
    uploaded.value = true;
  }).catch((error) => {
    if (error.response) {
      if (error.response.status === env.HTTP_PAYLOAD_TOO_LARGE) {
        formErrors.set({ file: [t('app.validation.too_large')] });
        return;
      }
      if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
        formErrors.set(error.response.data.errors);
        return;
      }
    }
    api.error(error);
  }).finally(() => {
    // Clear file field and busy status
    isUploading.value = false;
    uploadingFile.value = null;
    uploadProgress.value = 0;
    fileInputRef.value.value = null;
  });
}

</script>
<style scoped>

</style>
