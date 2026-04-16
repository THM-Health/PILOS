<template>
  <div class="grid grid-cols-12 gap-4">
    <div
      v-if="!viewOnly"
      class="col-span-12 flex flex-col gap-2 md:flex-row md:items-start lg:col-span-9"
    >
      <FileUpload
        v-if="!imageDeleted"
        mode="basic"
        accept="image/png, image/jpeg"
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
        data-test="profile-image-preview"
      />
      <UserAvatar
        v-else
        data-test="default-profile-image-preview"
        :firstname="firstname"
        :lastname="lastname"
        :alt="$t('admin.users.image.title')"
        size="xlarge"
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
          @click="closeModal"
        />
        <Button
          :label="$t('admin.users.image.save')"
          :loading="isLoadingAction"
          data-test="dialog-save-button"
          @click="save"
        />
      </div>
    </template>

    <div v-if="selectedFile" class="cropper-container my-2">
      <img
        :src="selectedFile"
        width="100%"
        id="cropper"
        :alt="$t('admin.users.image.title')"
      />
    </div>
  </Dialog>
</template>

<script setup>
import { nextTick, ref, watch } from "vue";
import Cropper from "cropperjs";

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
const cropper = ref();

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
  const oc = cropper.value.getCroppedCanvas({
    width: 100,
    height: 100,
    fillColor: "#ffff",
  });

  croppedImage.value = oc.toDataURL("image/jpeg");
  oc.toBlob((blob) => {
    emit("newImage", blob);
    isLoadingAction.value = false;
    closeModal();
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

function closeModal() {
  if (cropper.value) {
    cropper.value.destroy();
    cropper.value = null;
  }
  modalVisible.value = false;
  selectedFile.value = null;
}

async function onFileSelect(event) {
  modalVisible.value = true;
  isLoadingAction.value = true;
  const file = event.files[0];

  const reader = new FileReader();
  reader.onload = async (event) => {
    selectedFile.value = event.target.result;

    await nextTick();

    cropper.value = new Cropper(document.getElementById("cropper"), {
      aspectRatio: 1,
      autoCropArea: 0.9,
      background: false,
      guides: false,
      center: false,
      rotatable: false,
      zoomable: false,
      movable: false,
      viewMode: 1,
      dragMode: "none",
      ready: async function () {
        isLoadingAction.value = false;

        await nextTick();

        document.querySelector('[data-test="dialog-cancel-button"]').focus();
      },
    });
  };
  reader.readAsDataURL(file);
}
</script>
