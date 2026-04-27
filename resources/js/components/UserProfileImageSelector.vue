<template>
  <div class="grid grid-cols-12 gap-4">
    <div
      v-if="!viewOnly"
      class="col-span-12 flex flex-col gap-2 md:flex-row md:items-start lg:col-span-9"
    >
      <FileUpload
        v-if="!imageDeleted"
        mode="basic"
        accept=".jpg,.jpeg,.png"
        custom-upload
        auto
        :disabled="disabled"
        class="w-full"
        :invalid-file-size-message="$t('app.file.too_large')"
        :invalid-file-type-message="$t('app.file.invalid_type')"
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
        @click="deleteImage"
      />
      <Button
        v-if="imageDeleted"
        :disabled="disabled"
        severity="secondary"
        :label="$t('app.undo_delete')"
        icon="fa-solid fa-undo"
        data-test="undo-delete-button"
        @click="undoDeleteImage"
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
      <div class="mt-2 flex justify-end gap-2">
        <Button
          :label="$t('app.cancel')"
          severity="secondary"
          :disabled="isSavingAction"
          data-test="dialog-cancel-button"
          autofocus
          @click="closeModal"
        />
        <Button
          :label="$t('admin.users.image.save')"
          :loading="isLoadingAction || isSavingAction"
          data-test="dialog-save-button"
          @click="save"
        />
      </div>
    </template>

    <div v-if="selectedFile" class="cropper-container">
      <img
        ref="cropperImgRef"
        :src="selectedFile"
        width="100%"
        :alt="$t('admin.users.image.title')"
      />
    </div>
  </Dialog>
</template>

<script setup>
import { nextTick, ref, watch } from "vue";
import Cropper from "cropperjs";
import { useI18n } from "vue-i18n";

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

const { t } = useI18n();

const modalVisible = ref(false);
const isLoadingAction = ref(false);
const isSavingAction = ref(false);
const selectedFile = ref(null);
const croppedImage = ref(null);
const cropper = ref();
const cropperImgRef = ref(null);

const moveHandle = ref(null);
const topLeftHandle = ref(null);
const topRightHandle = ref(null);
const bottomLeftHandle = ref(null);
const bottomRightHandle = ref(null);
const scaleMove = ref(1);

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
  isSavingAction.value = true;
  const oc = cropper.value.getCroppedCanvas({
    width: 100,
    height: 100,
    fillColor: "#ffff",
  });

  croppedImage.value = oc.toDataURL("image/jpeg", 1);
  oc.toBlob(
    (blob) => {
      emit("newImage", blob);
      isSavingAction.value = false;
      closeModal();
    },
    "image/jpeg",
    1,
  );
}

/**
 * Reset other previously uploaded images
 */
async function resetFileUpload() {
  croppedImage.value = null;
  emit("newImage", null);
  selectedFile.value = null;

  await nextTick();

  document.querySelector("[data-test='upload-file-button']")?.focus();
}

function closeModal() {
  if (cropper.value) {
    clearKeyboardShortcuts();
    cropper.value.destroy();
    cropper.value = null;
  }
  modalVisible.value = false;
  selectedFile.value = null;
}

async function onFileSelect(event) {
  modalVisible.value = true;
  isLoadingAction.value = true;
  selectedFile.value = null;

  const file = event.files[0];

  const reader = new FileReader();
  reader.onload = async (event) => {
    selectedFile.value = event.target.result;

    await nextTick();

    // cancel if modal is already closed
    if (!cropperImgRef.value) {
      return;
    }
    cropper.value = new Cropper(cropperImgRef.value, {
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

        initKeyboardShortcuts();
      },
    });
  };
  reader.readAsDataURL(file);
}

async function deleteImage() {
  emit("deleteImage", true);
  await nextTick();
  document.querySelector("[data-test='undo-delete-button']")?.focus();
}

async function undoDeleteImage() {
  emit("deleteImage", false);
  await nextTick();
  document.querySelector("[data-test='delete-image-button']")?.focus();
}

function clearKeyboardShortcuts() {
  // Remove event listeners
  moveHandle.value?.removeEventListener("keydown", moveEventListener);
  topLeftHandle.value?.removeEventListener("keydown", topLeftEventListener);
  topRightHandle.value?.removeEventListener("keydown", topRightEventListener);
  bottomLeftHandle.value?.removeEventListener(
    "keydown",
    bottomLeftEventListener,
  );
  bottomRightHandle.value?.removeEventListener(
    "keydown",
    bottomRightEventListener,
  );
}

function initKeyboardShortcuts() {
  const dimensions = cropper.value.getData();
  scaleMove.value = Math.min(dimensions.width, dimensions.height) / 100;

  // Get all handles
  moveHandle.value = document.getElementsByClassName("cropper-move")[0];
  topLeftHandle.value = document.getElementsByClassName(
    "cropper-point point-nw",
  )[0];
  topRightHandle.value = document.getElementsByClassName(
    "cropper-point point-ne",
  )[0];
  bottomLeftHandle.value = document.getElementsByClassName(
    "cropper-point point-sw",
  )[0];
  bottomRightHandle.value = document.getElementsByClassName(
    "cropper-point point-se",
  )[0];

  // Add tabindex
  moveHandle.value.setAttribute("tabindex", 0);
  topLeftHandle.value.setAttribute("tabindex", 0);
  topRightHandle.value.setAttribute("tabindex", 0);
  bottomLeftHandle.value.setAttribute("tabindex", 0);
  bottomRightHandle.value.setAttribute("tabindex", 0);

  // Add aria-labels
  moveHandle.value.setAttribute(
    "aria-label",
    t("admin.users.image.aria_crop_selection.move"),
  );
  topLeftHandle.value.setAttribute(
    "aria-label",
    t("admin.users.image.aria_crop_selection.top_left"),
  );
  topRightHandle.value.setAttribute(
    "aria-label",
    t("admin.users.image.aria_crop_selection.top_right"),
  );
  bottomLeftHandle.value.setAttribute(
    "aria-label",
    t("admin.users.image.aria_crop_selection.bottom_left"),
  );
  bottomRightHandle.value.setAttribute(
    "aria-label",
    t("admin.users.image.aria_crop_selection.bottom_right"),
  );

  // Add event listeners
  moveHandle.value.addEventListener("keydown", moveEventListener);
  topLeftHandle.value.addEventListener("keydown", topLeftEventListener);
  topRightHandle.value.addEventListener("keydown", topRightEventListener);
  bottomLeftHandle.value.addEventListener("keydown", bottomLeftEventListener);
  bottomRightHandle.value.addEventListener("keydown", bottomRightEventListener);
}

function moveEventListener(e) {
  if (!shouldHandleArrowKey(e)) {
    return;
  }

  const cropDimensions = cropper.value.getCropBoxData();

  switch (e.key) {
    case "ArrowUp":
      cropDimensions.top -= scaleMove.value;
      break;
    case "ArrowDown":
      cropDimensions.top += scaleMove.value;
      break;
    case "ArrowLeft":
      cropDimensions.left -= scaleMove.value;
      break;
    case "ArrowRight":
      cropDimensions.left += scaleMove.value;
      break;
  }

  cropper.value.setCropBoxData(cropDimensions);
}

function topLeftEventListener(e) {
  if (!shouldHandleArrowKey(e)) {
    return;
  }

  const cropDimensions = cropper.value.getCropBoxData();

  switch (e.key) {
    case "ArrowUp":
    case "ArrowLeft":
      cropDimensions.top -= scaleMove.value;
      cropDimensions.height += scaleMove.value;
      cropDimensions.left -= scaleMove.value;
      cropDimensions.width += scaleMove.value;
      break;
    case "ArrowDown":
    case "ArrowRight":
      cropDimensions.top += scaleMove.value;
      cropDimensions.height -= scaleMove.value;
      cropDimensions.left += scaleMove.value;
      cropDimensions.width -= scaleMove.value;
      break;
  }

  cropper.value.setCropBoxData(cropDimensions);
}

function topRightEventListener(e) {
  if (!shouldHandleArrowKey(e)) {
    return;
  }

  const cropDimensions = cropper.value.getCropBoxData();

  switch (e.key) {
    case "ArrowUp":
    case "ArrowRight":
      cropDimensions.top -= scaleMove.value;
      cropDimensions.height += scaleMove.value;
      cropDimensions.width += scaleMove.value;
      break;
    case "ArrowDown":
    case "ArrowLeft":
      cropDimensions.top += scaleMove.value;
      cropDimensions.height -= scaleMove.value;
      cropDimensions.width -= scaleMove.value;
      break;
  }

  cropper.value.setCropBoxData(cropDimensions);
}

function bottomLeftEventListener(e) {
  if (!shouldHandleArrowKey(e)) {
    return;
  }

  const cropDimensions = cropper.value.getCropBoxData();

  switch (e.key) {
    case "ArrowDown":
    case "ArrowLeft":
      cropDimensions.height += scaleMove.value;
      cropDimensions.left -= scaleMove.value;
      cropDimensions.width += scaleMove.value;
      break;
    case "ArrowUp":
    case "ArrowRight":
      cropDimensions.height -= scaleMove.value;
      cropDimensions.left += scaleMove.value;
      cropDimensions.width -= scaleMove.value;
      break;
  }

  cropper.value.setCropBoxData(cropDimensions);
}

function bottomRightEventListener(e) {
  if (!shouldHandleArrowKey(e)) {
    return;
  }

  const cropDimensions = cropper.value.getCropBoxData();

  switch (e.key) {
    case "ArrowDown":
    case "ArrowRight":
      cropDimensions.height += scaleMove.value;
      cropDimensions.width += scaleMove.value;
      break;
    case "ArrowUp":
    case "ArrowLeft":
      cropDimensions.height -= scaleMove.value;
      cropDimensions.width -= scaleMove.value;
      break;
  }

  cropper.value.setCropBoxData(cropDimensions);
}

function shouldHandleArrowKey(e) {
  if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    return false;
  }

  e.preventDefault();
  e.stopPropagation();
  return true;
}
</script>
