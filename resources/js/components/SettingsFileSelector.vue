<template>
  <div class="grid">
    <div class="col-12 flex flex-column gap-2">
      <div class="flex gap-2 align-items-start">
        <FileInput
          v-if="!fileDeleted && !readonly"
          :disabled="disabled"
          :allowed-extensions="allowedExtensions"
          :max-file-size="maxFileSize"
          :invalid="fileInvalid"
          v-model="file"
          v-model:too-big="fileTooBig"
          v-model:invalid-extension="fileInvalidExtension"
        />

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
          :label="$t('app.undo_delete')"
        />

        <a v-if="fileUrl && !file && !fileDeleted" :href="fileUrl" target="_blank" class="p-button p-button-secondary">
          <span class="p-button-icon p-button-icon-left fa-solid fa-eye" />
          <span class="p-button-label">{{ $t('app.view') }}</span>
        </a>
      </div>
      <div>
        <p class="p-error" v-if="fileTooBig">
          {{ $t('app.validation.too_large') }}
        </p>
        <p class="p-error" v-if="fileInvalidExtension">
          {{ $t('app.validation.invalid_type') }}
        </p>
        <p class="p-error" v-html="fileError"/>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const file = defineModel('file');
const fileUrl = defineModel('fileUrl');
const fileDeleted = defineModel('fileDeleted');

const fileTooBig = ref(false);
const fileInvalidExtension = ref(false);

defineProps({
  showDelete: {
    type: Boolean,
    default: false
  },
  maxFileSize: {
    type: Number
  },
  allowedExtensions: {
    type: Array
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

function resetFileUpload () {
  file.value = null;
}
</script>
