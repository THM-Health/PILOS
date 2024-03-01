<template>
  <div class="grid">
    <div class="col-12 lg:col-9 flex gap-2 align-items-start">
    <FileUpload
      v-if="!imageDeleted"
      mode="basic"
      accept="image/*"
      customUpload
      auto
      @uploader="onFileSelect"
      :choose-label="$t('settings.users.image.upload')"
    >
      <template #chooseicon>
        <i class="fa-solid fa-upload" />
      </template>
    </FileUpload>

    <Button
      v-if="croppedImage"
      severity="danger"
      @click="resetFileUpload"
      :label="$t('app.cancel')"
      icon="fa-solid fa-times"
    />
    <Button
      v-if="!imageDeleted && !croppedImage && props.image"
      :disabled="isBusy"
      severity="danger"
      @click="emit('deleteImage', true)"
      :label="$t('settings.users.image.delete')"
      icon="fa-solid fa-trash"
    />
    <Button
      v-if="imageDeleted"
      severity="secondary"
      @click="emit('deleteImage', false)"
      :label="$t('app.undo_delete')"
      icon="fa-solid fa-undo"
    />
    </div>
    <div class="col-12 lg:col-3 text-left"  :class="{'lg:text-right': !viewOnly}">
    <UserAvatar
      v-if="(croppedImage!==null || image!==null) && !imageDeleted"
      :image="croppedImage ? croppedImage : image"
      :alt="$t('settings.users.image.title')"
      size="xlarge"
      shape="square"
    />
    <UserAvatar
      v-else
      :firstname="firstname"
      :lastname="lastname"
      :alt="$t('settings.users.image.title')"
      size="xlarge"
      shape="square"
    />
    </div>
  </div>
  <Dialog
    v-model:visible="showModal"
    modal
    :header="$t('settings.users.image.crop')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :closeOnEscape="false"
    :dismissableMask="false"
    :closable="false"
  >
    <template #footer>
      <div class="flex justify-content-end gap-2">
        <Button :label="$t('app.cancel')" outlined @click="showModal = false" :disabled="isLoadingAction" />
        <Button :label="$t('settings.users.image.save')" :loading="isLoadingAction" :disabled="isLoadingAction" @click="save" />
      </div>
    </template>

    <VueCropper
      v-show="selectedFile"
      ref="cropperRef"
      :auto-crop-area="1"
      :aspect-ratio="1"
      :view-mode="1"
      :src="selectedFile"
      :alt="$t('settings.users.image.title')"
    />

  </Dialog>

</template>

<script setup>
import { ref } from 'vue';
import VueCropper from 'vue-cropperjs';

const props = defineProps({
  image: {
    type: String
  },
  isBusy: {
    type: Boolean
  },
  viewOnly: {
    type: Boolean
  },
  firstname: {
    type: String
  },
  lastname: {
    type: String
  },
  imageDeleted: {
    type: Boolean
  }
});

const emit = defineEmits('newImage', 'deleteImage');

const showModal = ref(false);
const isLoadingAction = ref(false);
const selectedFile = ref(null);
const croppedImage = ref(null);
const cropperRef = ref();

/**
 * User cropped image and confirmed to continue
 * Convert image to data url to display and to blob to upload to server
 */
async function save () {
  isLoadingAction.value = true;
  const oc = cropperRef.value.getCroppedCanvas({ width: 100, height: 100, fillColor: '#ffff' });

  croppedImage.value = oc.toDataURL('image/jpeg');
  oc.toBlob((blob) => {
    emit('newImage', blob);
    isLoadingAction.value = false;
    showModal.value = false;
  }, 'image/jpeg');
}

/**
 * Reset other previously uploaded images
 */
function resetFileUpload () {
  croppedImage.value = null;
  emit('newImage', null);
  selectedFile.value = null;
}

async function onFileSelect (event) {
  showModal.value = true;
  isLoadingAction.value = true;
  const file = event.files[0];

  const reader = new FileReader();
  reader.onload = (event) => {
    selectedFile.value = event.target.result;
    cropperRef.value.replace(selectedFile.value);
    isLoadingAction.value = false;
  };
  reader.readAsDataURL(file);
}
</script>
