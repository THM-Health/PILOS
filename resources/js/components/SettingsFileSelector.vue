<template>
  <div class="grid grid-cols-12 gap-4">
    <div class="col-span-12 flex flex-col gap-2">
      <div class="flex flex-col gap-2 lg:flex-row lg:items-start">
        <FileInput
          v-if="!fileDeleted && !readonly"
          v-model="file"
          v-model:too-big="fileTooBig"
          v-model:invalid-extension="fileInvalidExtension"
          :disabled="disabled"
          :allowed-extensions="allowedExtensions"
          :max-file-size="maxFileSize"
          :invalid="fileInvalid"
        />

        <Button
          v-if="file"
          severity="danger"
          :label="$t('app.cancel')"
          icon="fa-solid fa-times"
          data-test="settings-file-cancel-button"
          @click="resetFileUpload"
        />

        <Button
          v-if="!file && showDelete && fileUrl && !fileDeleted && !readonly"
          :disabled="disabled"
          severity="danger"
          :label="$t('app.delete')"
          icon="fa-solid fa-trash"
          data-test="settings-file-delete-button"
          @click="fileDeleted = true"
        />
        <Button
          v-if="fileDeleted"
          severity="secondary"
          icon="fa-solid fa-undo"
          :label="$t('app.undo_delete')"
          data-test="settings-file-undo-delete-button"
          @click="fileDeleted = false"
        />

        <Button
          v-if="fileUrl && !file && !fileDeleted"
          as="a"
          severity="secondary"
          :href="fileUrl"
          target="_blank"
          :label="$t('app.view')"
          data-test="settings-file-view-button"
          icon="fa-solid fa-eye"
        />
      </div>
      <div>
        <p v-if="fileTooBig" class="text-red-500" role="alert">
          {{ $t("app.validation.too_large") }}
        </p>
        <p v-if="fileInvalidExtension" class="text-red-500" role="alert">
          {{ $t("app.validation.invalid_type") }}
        </p>
        <FormError :errors="fileError" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const file = defineModel("file", { type: File });
const fileUrl = defineModel("fileUrl", { type: String });
const fileDeleted = defineModel("fileDeleted", { type: Boolean });

const fileTooBig = ref(false);
const fileInvalidExtension = ref(false);

defineProps({
  showDelete: {
    type: Boolean,
    default: false,
  },
  maxFileSize: {
    type: Number,
    required: true,
  },
  allowedExtensions: {
    type: Array,
    required: true,
  },
  fileInvalid: {
    type: Boolean,
    default: false,
  },
  fileError: {
    type: [Object, null],
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
});

function resetFileUpload() {
  file.value = null;
}
</script>
