<template>
  <div class="grid">
    <div class="col-12 lg:col-9 flex flex-column gap-2">
      <div class="flex gap-2 align-items-start">
        <InputText
          v-if="!image && !imageDeleted && !readonly"
          :disabled="disabled"
          v-model="imageUrl"
          type="text"
          :id="inputId"
          :invalid="urlInvalid"
          :required="!showDelete"
        />

        <FileUpload
          v-if="!imageDeleted && !readonly"
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
          :label="$t('app.undo')"
          icon="fa-solid fa-undo"
        />
      </div>
      <div>
        <p class="p-error" v-html="fileError"/>
        <p class="p-error" v-html="urlError"/>
      </div>
    </div>
    <div class="col-12 lg:col-3 text-left"  :class="{'lg:text-right': !viewOnly}">
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

const fileName = ref(null);
const newImageUrl = ref(null);

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
    fileName.value = value.name;
    newImageUrl.value = URL.createObjectURL(value);
  } else {
    fileName.value = null;
    newImageUrl.value = null;
  }
});

function resetFileUpload () {
  image.value = null;
  fileName.value = null;
  newImageUrl.value = null;
}

function onFileSelect (event) {
  const file = event.files[0];

  fileName.value = file.name;
  image.value = file;
}
</script>
