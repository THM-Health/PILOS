<template>
  <div class="grid grid-cols-12 gap-4">
    <div class="col-span-12 lg:col-span-9 flex flex-col gap-2">
      <div class="flex flex-col lg:flex-row gap-2 lg:items-start">
        <InputText
          v-if="!image && !imageDeleted && !readonly"
          :disabled="disabled"
          v-model="imageUrl"
          type="text"
          :invalid="urlInvalid"
          :required="!showDelete"
        />

        <FileInput
          v-if="!imageDeleted && !readonly"
          :disabled="disabled"
          :allowed-extensions="allowedExtensions"
          :max-file-size="maxFileSize"
          :invalid="fileInvalid"
          v-model="image"
          v-model:too-big="fileTooBig"
          v-model:invalid-extension="fileInvalidExtension"
        />

        <Button
          v-if="image"
          severity="danger"
          @click="resetFileUpload"
          :label="$t('app.cancel')"
          icon="fa-solid fa-times"
        />

        <Button
          v-if="showDelete && !image && imageUrl && !imageDeleted && !readonly"
          :disabled="disabled"
          severity="danger"
          @click="imageDeleted = true"
          :label="$t('app.delete')"
          icon="fa-solid fa-trash"
        />
        <Button
          v-if="imageDeleted"
          severity="secondary"
          @click="imageDeleted = false"
          :label="$t('app.undo_delete')"
          icon="fa-solid fa-undo"
        />
      </div>
      <div>
        <p class="text-red-500" role="alert" v-if="fileTooBig">
          {{ $t('app.validation.too_large') }}
        </p>
        <p class="text-red-500" role="alert" v-if="fileInvalidExtension">
          {{ $t('app.validation.invalid_type') }}
        </p>
        <FormError :errors="fileError"/>
        <FormError :errors="urlError"/>
      </div>
    </div>
    <div class="col-span-12 lg:col-span-3 flex justify-center rounded-border border p-2" :class="previewBgClass">
      <img
        v-if="newImageUrl || imageUrl"
        :src="newImageUrl ?? imageUrl"
        :width="previewWidth"
        :alt="previewAlt"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const image = defineModel('image');
const imageUrl = defineModel('imageUrl');
const imageDeleted = defineModel('imageDeleted');

const newImageUrl = ref(null);

const fileTooBig = ref(false);
const fileInvalidExtension = ref(false);

defineProps({
  showDelete: {
    type: Boolean,
    default: false
  },
  previewAlt: {
    type: String,
    default: 'Image'
  },
  previewWidth: {
    type: String,
    default: '100%'
  },
  previewBgClass: {
    type: String
  },
  maxFileSize: {
    type: Number
  },
  allowedExtensions: {
    type: Array
  },
  urlInvalid: {
    type: Boolean
  },
  fileInvalid: {
    type: Boolean
  },
  urlError: {
    type: String
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

watch(() => image.value, (value) => {
  if (value) {
    newImageUrl.value = URL.createObjectURL(value);
  } else {
    newImageUrl.value = null;
  }
});

function resetFileUpload () {
  image.value = null;
  newImageUrl.value = null;
}

</script>
