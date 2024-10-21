<template>
  <div class="grid grid-cols-12 gap-4">
    <div
      class="col-span-12 lg:col-span-9 flex md:flex-row flex-col gap-2 md:items-start"
      v-if="!viewOnly"
    >
      <FileUpload
        v-if="!imageDeleted"
        mode="basic"
        accept="image/*"
        customUpload
        auto
        :disabled="disabled"
        class="w-full"
        @uploader="onFileSelect"
        :choose-label="$t('admin.users.image.upload')"
        :pt="{
          pcChooseButton: {
            root: {
              'data-test': 'upload-file-button',
            },
          },
          input: {
            'data-test': 'upload-file-input',
          },
        }"
      >
        <template #uploadicon>
          <i class="fa-solid fa-upload" />
        </template>
      </FileUpload>

      <Button
        v-if="croppedImage"
        severity="danger"
        @click="resetFileUpload"
        :disabled="disabled"
        :label="$t('app.cancel')"
        icon="fa-solid fa-times"
        data-test="reset-file-upload-button"
      />
      <Button
        v-if="!imageDeleted && !croppedImage && props.image"
        :disabled="disabled"
        severity="danger"
        @click="emit('deleteImage', true)"
        :label="$t('admin.users.image.delete')"
        icon="fa-solid fa-trash"
        data-test="delete-image-button"
      />
      <Button
        v-if="imageDeleted"
        :disabled="disabled"
        severity="secondary"
        @click="emit('deleteImage', false)"
        :label="$t('app.undo_delete')"
        icon="fa-solid fa-undo"
        data-test="undo-delete-button"
      />
    </div>
    <div
      class="col-span-12 lg:col-span-3 text-left"
      :class="{ 'lg:text-right': !viewOnly }"
    >
      <UserAvatar
        v-if="(croppedImage !== null || image !== null) && !imageDeleted"
        :image="croppedImage ? croppedImage : image"
        :alt="$t('admin.users.image.title')"
        size="xlarge"
        class="rounded-border overflow-hidden"
        shape="square"
        data-test="profile-image-preview"
      />
      <UserAvatar
        data-test="default-profile-image-preview"
        v-else
        :firstname="firstname"
        :lastname="lastname"
        :alt="$t('admin.users.image.title')"
        size="xlarge"
        shape="square"
      />
    </div>
  </div>
  <Dialog
    data-test="crop-image-dialog"
    v-model:visible="showModal"
    modal
    :header="$t('admin.users.image.crop')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :closeOnEscape="false"
    :dismissableMask="false"
    :closable="false"
  >
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          :label="$t('app.cancel')"
          severity="secondary"
          @click="showModal = false"
          :disabled="isLoadingAction"
          data-test="dialog-cancel-button"
        />
        <Button
          :label="$t('admin.users.image.save')"
          :loading="isLoadingAction"
          :disabled="isLoadingAction"
          @click="save"
          data-test="dialog-save-button"
        />
      </div>
    </template>

    <VueCropper
      class="my-2"
      v-show="selectedFile"
      ref="cropperRef"
      :auto-crop-area="1"
      :aspect-ratio="1"
      :view-mode="1"
      :src="selectedFile"
      :alt="$t('admin.users.image.title')"
    />
  </Dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import VueCropper from "vue-cropperjs";

const props = defineProps({
  image: {
    type: [String, null],
    default: null,
  },
  disabled: {
    type: Boolean,
  },
  viewOnly: {
    type: Boolean,
  },
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  imageDeleted: {
    type: Boolean,
  },
});

const emit = defineEmits(["newImage", "deleteImage"]);

const showModal = ref(false);
const isLoadingAction = ref(false);
const selectedFile = ref(null);
const croppedImage = ref(null);
const cropperRef = ref();

watch(
  () => props.image,
  (value) => {
    croppedImage.value = null;
    selectedFile.value = null;
  },
);

/**
 * User cropped image and confirmed to continue
 * Convert image to data url to display and to blob to upload to server
 */
async function save() {
  isLoadingAction.value = true;
  const oc = cropperRef.value.getCroppedCanvas({
    width: 100,
    height: 100,
    fillColor: "#ffff",
  });

  croppedImage.value = oc.toDataURL("image/jpeg");
  oc.toBlob((blob) => {
    emit("newImage", blob);
    isLoadingAction.value = false;
    showModal.value = false;
  }, "image/jpeg");
}

/**
 * Reset other previously uploaded images
 */
function resetFileUpload() {
  croppedImage.value = null;
  emit("newImage", null);
  selectedFile.value = null;
}

async function onFileSelect(event) {
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
