<template>
  <!-- button -->
  <Button
    v-tooltip="$t('rooms.files.upload')"
    class="shrink-0"
    :aria-label="$t('rooms.files.upload')"
    :disabled="disabled"
    icon="fa-solid fa-upload"
    data-test="room-files-upload-button"
    @click="showModal"
  />

  <!-- modal -->
  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('rooms.files.upload')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isUploading"
    :dismissable-mask="false"
    :closable="!isUploading"
    data-test="room-files-upload-dialog"
    :pt="{
      pcCloseButton: {
        root: {
          'data-test': 'dialog-header-close-button',
        },
      },
    }"
  >
    <div class="flex flex-col gap-2">
      <label
        for="file"
        class="p-button p-component flex flex-row justify-center gap-2 rounded-border"
        :class="{ 'p-disabled': disabled || isUploading }"
        tabindex="0"
        data-test="upload-file-button"
        @keyup.enter="fileInputRef.click()"
        @keyup.space="fileInputRef.click()"
      >
        <i class="fa-solid fa-upload"></i> {{ $t("app.browse") }}
      </label>
      <input
        id="file"
        ref="fileInputRef"
        type="file"
        class="sr-only"
        :disabled="disabled || isUploading"
        :accept="
          '.' +
          String(settingsStore.getSetting('bbb.file_mimes'))
            .split(',')
            .join(',.')
        "
        @input="fileSelected"
      />
      <div
        ref="dropZoneRef"
        class="cursor-pointer items-center border border-surface-400 p-2 text-center rounded-border dark:border-surface-400"
        :class="dropZoneClasses"
        data-test="drop-zone"
        @keyup.enter="fileInputRef.click()"
        @keyup.space="fileInputRef.click()"
        @click="fileInputRef.click()"
      >
        <span v-if="!isUploading" class="text-center">
          {{ $t("rooms.files.select_or_drag") }}
        </span>
        <span v-else>
          {{ uploadingFile }}
        </span>
      </div>

      <ProgressBar
        v-if="isUploading"
        class="mt-1 w-full"
        style="height: 1rem"
        :value="uploadProgress"
        :show-value="false"
        data-test="progress-bar"
      />
      <small
        >{{
          $t("rooms.files.formats", {
            formats: settingsStore
              .getSetting("bbb.file_mimes")
              .replaceAll(",", ", "),
          })
        }}<br />{{
          $t("rooms.files.size", {
            size: settingsStore.getSetting("bbb.max_filesize"),
          })
        }}</small
      >

      <div v-if="uploadedFiles.length" class="mt-2 flex flex-col gap-2">
        <Message
          v-for="(file, index) in uploadedFiles"
          :key="index"
          severity="success"
          icon="fa-solid fa-check-circle"
          data-test="uploaded-file-message"
        >
          {{ $t("rooms.files.uploaded", { name: file.name }) }}
        </Message>
      </div>

      <FormError :errors="formErrors.fieldError('file')" />
    </div>
  </Dialog>
</template>
<script setup>
import { ref, computed } from "vue";
import { useEventListener } from "@vueuse/core";
import { useFormErrors } from "../composables/useFormErrors.js";
import { useApi } from "../composables/useApi.js";
import env from "../env.js";
import { useI18n } from "vue-i18n";
import { useSettingsStore } from "../stores/settings.js";

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["uploaded"]);

const dropZoneRef = ref();
const fileInputRef = ref();
const isOverDropZone = ref(false);
const isUploading = ref(false);
const uploadProgress = ref(0);
const uploadingFile = ref(null);

const uploadedFiles = ref([]);

const modalVisible = ref(false);

const api = useApi();
const settingsStore = useSettingsStore();
const { t } = useI18n();

const formErrors = useFormErrors();

useEventListener(dropZoneRef, "dragenter", (event) => {
  event.preventDefault();
  if (!isUploading.value) {
    isOverDropZone.value = true;
  }
});

useEventListener(dropZoneRef, "dragover", (event) => {
  event.preventDefault();
  if (!isUploading.value) {
    isOverDropZone.value = true;
  }
});

useEventListener(dropZoneRef, "dragleave", (event) => {
  event.preventDefault();
  if (!isUploading.value) {
    isOverDropZone.value = false;
  }
});

useEventListener(dropZoneRef, "drop", (event) => {
  event.preventDefault();
  if (!isUploading.value) {
    isOverDropZone.value = false;
    fileInputRef.value.files = event.dataTransfer.files;
    uploadFile(event.dataTransfer.files[0]);
  }
});

const dropZoneClasses = computed(() => {
  if (props.disabled || isUploading.value) {
    return [
      "cursor-wait",
      "bg-surface-50 dark:bg-surface-800",
      "border-surface-200 dark:border-surface-500",
    ];
  }

  if (isOverDropZone.value) {
    return [
      "bg-green-100 dark:bg-surface-600",
      "border-green-400 dark:border-surface-300",
    ];
  }
  return [
    "bg-surface-100 dark:bg-surface-700",
    "border-surface-400 dark:border-surface-400",
  ];
});

function showModal() {
  modalVisible.value = true;
  uploadedFiles.value = [];
  formErrors.clear();
}

function fileSelected(event) {
  uploadFile(event.target.files[0]);
}

function reset() {
  // Clear file field and busy status
  isUploading.value = false;
  uploadingFile.value = null;
  uploadProgress.value = 0;
  fileInputRef.value.value = null;
}

function uploadFile(file) {
  if (file == null) {
    return;
  }

  uploadingFile.value = file.name;

  // uploading status
  isUploading.value = true;
  // Reset errors
  formErrors.clear();

  // Build form data
  const formData = new FormData();
  formData.append("file", file);

  // Send new file to api
  api
    .call("rooms/" + props.roomId + "/files", {
      method: "post",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      data: formData,
      onUploadProgress: (progressEvent) => {
        uploadProgress.value = progressEvent.progress.toFixed(2) * 100;
      },
    })
    .then(() => {
      // Fetch successful
      uploadedFiles.value.push(file);
      emit("uploaded");
      reset();
    })
    .catch((error) => {
      reset();
      if (error.response) {
        if (error.response.status === env.HTTP_PAYLOAD_TOO_LARGE) {
          formErrors.set({ file: [t("app.validation.too_large")] });
          return;
        }
        if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          formErrors.set(error.response.data.errors);
          return;
        }
      }
      api.error(error, { noRedirectOnUnauthenticated: true });
    });
}
</script>
