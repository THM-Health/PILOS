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
          :disabled="isLoadingAction || isLoadingCropper"
          data-test="dialog-cancel-button"
          @click="closeModal"
        />
        <LoadingButton
          autofocus
          :label="$t('admin.users.image.save')"
          :loading="isLoadingAction || isLoadingCropper"
          data-test="dialog-save-button"
          @click="save"
        />
      </div>
    </template>

    <div v-if="selectedFile" class="flex flex-col gap-4 py-4">
      <ProfileImageCropper
        ref="cropperRef"
        v-model:zoom="cropperZoom"
        :min-zoom="MIN_ZOOM / 100"
        :max-zoom="MAX_ZOOM / 100"
        :zoom-step="ZOOM_STEP / 100"
        :output-size="100"
        mime-type="image/jpeg"
        :quality="1"
        :image="selectedFile"
        :aria-label="t('admin.users.image.aria_instructions')"
        root-class="w-full"
        viewport-class="aspect-square h-70 bg-surface-200 dark:bg-surface-900 w-full"
        mask-class="shadow-[0_0_0_9999px_rgb(0_0_0_/_0.4)]"
        ring-class="border-2 border-white"
        @position="position = $event"
        @loading="(loading) => (isLoadingCropper = loading)"
      />
      <span
        v-if="!isLoadingCropper"
        aria-live="polite"
        aria-atomic="true"
        class="sr-only"
        >{{ ariaPosition }}</span
      >

      <div class="flex items-center gap-2">
        <label id="zoom-label"> {{ $t("admin.users.image.zoom") }}</label>
        <Button
          variant="text"
          :disabled="zoom == MIN_ZOOM || isLoadingAction || isLoadingCropper"
          severity="secondary"
          rounded
          class="shrink-0"
          icon="fa-solid fa-minus"
          @click="zoom -= ZOOM_STEP"
        />
        <Slider
          v-model="zoom"
          data-test="image-zoom"
          :disabled="isLoadingAction || isLoadingCropper"
          aria-labelledby="zoom-label"
          :min="MIN_ZOOM"
          :max="MAX_ZOOM"
          :step="ZOOM_STEP"
          class="w-full"
        />
        <Button
          variant="text"
          severity="secondary"
          :disabled="zoom == MAX_ZOOM || isLoadingAction || isLoadingCropper"
          rounded
          class="shrink-0"
          icon="fa-solid fa-plus"
          @click="zoom += ZOOM_STEP"
        />
        <Badge
          data-test="image-zoom-display"
          severity="secondary"
          class="shrink-0"
          >{{ zoom }}<raw-text>%</raw-text></Badge
        >
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { nextTick, ref, watch, computed } from "vue";
import { ProfileImageCropper } from "@thm-health/vue-profile-image-cropper";
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
const isLoadingCropper = ref(false);
const selectedFile = ref(null);
const croppedImage = ref(null);

const MIN_ZOOM = 100;
const MAX_ZOOM = 300;
const ZOOM_STEP = 10;
const cropperRef = ref(null);
const zoom = ref(MIN_ZOOM);
const cropperZoom = computed({
  get: () => zoom.value / 100,
  set: (value) => {
    zoom.value = Math.round(value * 100);
  },
});
const position = ref({ x: 0, y: 0 });

const ariaPosition = computed(function () {
  const x =
    position.value.x != null
      ? t("admin.users.image.position_horizontal", {
          x: Math.round(position.value.x),
        })
      : t("admin.users.image.position_horizontal_full");
  const y =
    position.value.y != null
      ? t("admin.users.image.position_vertical", {
          y: Math.round(position.value.y),
        })
      : t("admin.users.image.position_vertical_full");

  return t("admin.users.image.crop_area", {
    pos_string_x: x,
    pos_string_y: y,
    zoom: zoom.value,
  });
});

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
  const result = await cropperRef.value.cropImage();

  croppedImage.value = URL.createObjectURL(result.blob);
  emit("newImage", result.blob);

  isLoadingAction.value = false;
  closeModal();
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
  modalVisible.value = false;
  selectedFile.value = null;
}

async function onFileSelect(event) {
  modalVisible.value = true;
  isLoadingCropper.value = true;
  selectedFile.value = null;

  selectedFile.value = event.files[0];
  zoom.value = MIN_ZOOM;
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
</script>
