<template>
  <div class="grid grid-cols-12 gap-4">
    <div
      v-if="!viewOnly"
      class="col-span-12 flex flex-col gap-2 md:flex-row md:items-start lg:col-span-9"
    >
      <FileUpload
        v-if="!imageDeleted"
        mode="basic"
        accept="image/*"
        custom-upload
        auto
        :disabled="disabled"
        class="w-full"
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
        @uploader="onFileSelect"
      >
        <template #uploadicon>
          <i class="fa-solid fa-upload" />
        </template>
      </FileUpload>

      <Button
        v-if="croppedImage"
        severity="danger"
        :disabled="disabled"
        :label="$t('app.cancel')"
        icon="fa-solid fa-times"
        data-test="reset-file-upload-button"
        @click="resetFileUpload"
      />
      <Button
        v-if="!imageDeleted && !croppedImage && props.image"
        :disabled="disabled"
        severity="danger"
        :label="$t('admin.users.image.delete')"
        icon="fa-solid fa-trash"
        data-test="delete-image-button"
        @click="emit('deleteImage', true)"
      />
      <Button
        v-if="imageDeleted"
        :disabled="disabled"
        severity="secondary"
        :label="$t('app.undo_delete')"
        icon="fa-solid fa-undo"
        data-test="undo-delete-button"
        @click="emit('deleteImage', false)"
      />
    </div>
    <div
      class="col-span-12 text-left lg:col-span-3"
      :class="{ 'lg:text-right': !viewOnly }"
    >
      <UserAvatar
        v-if="(croppedImage !== null || image !== null) && !imageDeleted"
        :image="croppedImage ? croppedImage : image"
        :alt="$t('admin.users.image.title')"
        size="xlarge"
        class="overflow-hidden rounded-border"
        shape="square"
        data-test="profile-image-preview"
      />
      <UserAvatar
        v-else
        data-test="default-profile-image-preview"
        :firstname="firstname"
        :lastname="lastname"
        :alt="$t('admin.users.image.title')"
        size="xlarge"
        shape="square"
      />
    </div>
  </div>
  <Dialog
    v-model:visible="modalVisible"
    data-test="crop-image-dialog"
    modal
    :header="$t('admin.users.image.crop')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="false"
    :dismissable-mask="false"
    :closable="false"
  >
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          :label="$t('app.cancel')"
          severity="secondary"
          :disabled="isLoadingAction"
          data-test="dialog-cancel-button"
          @click="modalVisible = false"
        />
        <Button
          :label="$t('admin.users.image.save')"
          :loading="isLoadingAction"
          :disabled="isLoadingAction"
          data-test="dialog-save-button"
          @click="save"
        />
      </div>
    </template>

    <VueCropper
      v-show="selectedFile"
      ref="cropperRef"
      class="my-2"
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

const modalVisible = ref(false);
const isLoadingAction = ref(false);
const selectedFile = ref(null);
const croppedImage = ref(null);
const cropperRef = ref();

watch(
  () => props.image,
  () => {
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
    modalVisible.value = false;
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
  modalVisible.value = true;
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
