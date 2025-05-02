<template>
  <div class="grid grid-cols-12 gap-4">
    <div class="col-span-12 flex flex-col gap-2 lg:col-span-9">
      <div class="flex flex-col gap-2 lg:flex-row lg:items-start">
        <InputText
          v-if="!image && !imageDeleted && !readonly && !hideUrl"
          v-model="imageUrl"
          :disabled="disabled"
          type="text"
          :invalid="urlInvalid"
          :required="!showDelete"
          data-test="settings-image-url-input"
        />

        <FileInput
          v-if="!imageDeleted && !readonly"
          v-model="image"
          v-model:too-big="fileTooBig"
          v-model:invalid-extension="fileInvalidExtension"
          :disabled="disabled"
          :allowed-extensions="allowedExtensions"
          :max-file-size="maxFileSize"
          :invalid="fileInvalid"
        />

        <Button
          v-if="image"
          :disabled="disabled"
          severity="danger"
          class="flex-shrink-0"
          :label="$t('app.cancel')"
          icon="fa-solid fa-times"
          data-test="settings-image-cancel-button"
          @click="resetFileUpload"
        />

        <Button
          v-if="showDelete && !image && imageUrl && !imageDeleted && !readonly"
          :disabled="disabled"
          class="flex-shrink-0"
          severity="danger"
          :label="$t('app.delete')"
          icon="fa-solid fa-trash"
          data-test="settings-image-delete-button"
          @click="imageDeleted = true"
        />
        <Button
          v-if="imageDeleted"
          :disabled="disabled"
          severity="secondary"
          :label="$t('app.undo_delete')"
          icon="fa-solid fa-undo"
          data-test="settings-image-undo-delete-button"
          @click="imageDeleted = false"
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
        <FormError :errors="urlError" />
      </div>
    </div>
    <div
      class="col-span-12 flex justify-center border p-2 rounded-border lg:col-span-3"
      :class="previewBgClass"
    >
      <img
        v-if="newImageUrl || imageUrl"
        :src="newImageUrl ?? imageUrl"
        :width="previewWidth"
        :alt="previewAlt"
        data-test="settings-image-preview"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const image = defineModel("image", { type: File });
const imageUrl = defineModel("imageUrl", { type: String });
const imageDeleted = defineModel("imageDeleted", { type: Boolean });

const newImageUrl = ref(null);

const fileTooBig = ref(false);
const fileInvalidExtension = ref(false);

defineProps({
  showDelete: {
    type: Boolean,
    default: false,
  },
  previewAlt: {
    type: String,
    default: "Image",
  },
  previewWidth: {
    type: String,
    default: "100%",
  },
  previewBgClass: {
    type: String,
    default: "",
  },
  maxFileSize: {
    type: Number,
    required: true,
  },
  allowedExtensions: {
    type: Array,
    required: true,
  },
  urlInvalid: {
    type: Boolean,
    default: false,
  },
  fileInvalid: {
    type: Boolean,
    default: false,
  },
  urlError: {
    type: [Object, null],
    default: null,
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
  hideUrl: {
    type: Boolean,
    default: false,
  },
});

watch(
  () => image.value,
  (value) => {
    if (value) {
      newImageUrl.value = URL.createObjectURL(value);
    } else {
      newImageUrl.value = null;
    }
  },
);

function resetFileUpload() {
  image.value = null;
  newImageUrl.value = null;
}
</script>
