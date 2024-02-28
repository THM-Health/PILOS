<template>
  <div class="grid">
    <div class="col-12 flex flex-column gap-2">
      <div class="flex gap-2 align-items-start">
        <FileUpload
          v-if="!fileDeleted && !readonly"
          :disabled="disabled"
          mode="basic"
          :accept="acceptMimeType"
          :maxFileSize="maxFileSize"
          customUpload
          auto
          @uploader="onFileSelect"
          :choose-label="fileName ?? $t('app.browse')"
          :aria-labelledby="ariaLabelledby"
          :class="{'p-invalid': fileInvalid}"
        >
          <template #chooseicon>
            <i class="fa-solid fa-upload" />
          </template>
        </FileUpload>

        <Button
          v-if="file"
          severity="danger"
          @click="resetFileUpload"
          :label="$t('app.cancel')"
          icon="fa-solid fa-times"
        />

        <Button
          v-if="!file && showDelete && fileUrl && !fileDeleted && !readonly"
          :disabled="disabled"
          severity="danger"
          @click="fileDeleted = true"
          :label="$t('app.delete')"
          icon="fa-solid fa-trash"
        />
        <Button
          v-if="fileDeleted"
          severity="secondary"
          @click="fileDeleted = false"
          icon="fa-solid fa-undo"
          :label="$t('app.undo')"
        />

        <a v-if="fileUrl && !file && !fileDeleted" :href="fileUrl" target="_blank" class="p-button p-button-secondary">
          <span class="p-button-icon p-button-icon-left fa-solid fa-eye" />
          <span class="p-button-label">{{ $t('app.view') }}</span>
        </a>
      </div>
      <div>
        <p class="p-error" v-html="fileError"/>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const file = defineModel('file');
const fileUrl = defineModel('fileUrl');
const fileDeleted = defineModel('fileDeleted');

const fileName = ref(null);

defineProps({
  showDelete: {
    type: Boolean,
    default: false
  },
  maxFileSize: {
    type: Number
  },
  acceptMimeType: {
    type: String
  },
  ariaLabelledby: {
    type: String
  },
  inputId: {
    type: String
  },
  fileInvalid: {
    type: Boolean
  },
  fileError: {
    type: String
  },
  disabled: {
    type: Boolean
  },
  readonly: {
    type: Boolean
  }
});

watch(() => file.value, (value) => {
  if (value) {
    fileName.value = value.name;
  } else {
    fileName.value = null;
  }
});

function resetFileUpload () {
  file.value = null;
  fileName.value = null;
}

function onFileSelect (event) {
  const newFile = event.files[0];

  fileName.value = newFile.name;
  file.value = newFile;
}
</script>
