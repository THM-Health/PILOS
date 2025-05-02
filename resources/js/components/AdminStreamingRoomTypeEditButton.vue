<template>
  <!-- button -->
  <Button
    v-tooltip="
      $t('admin.streaming.room_types.edit', { name: props.roomType.name })
    "
    :aria-label="
      $t('admin.streaming.room_types.edit', { name: props.roomType.name })
    "
    severity="info"
    icon="fa-solid fa-edit"
    data-test="streaming-room-type-settings-edit-button"
    @click="showModal"
  />

  <Dialog
    v-model:visible="modalVisible"
    data-test="streaming-room-type-settings-edit-dialog"
    modal
    :header="
      $t('admin.streaming.room_types.edit_dialog.title', {
        name: props.roomType.name,
      })
    "
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="false"
    :closable="!isLoadingAction"
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
          :label="$t('app.save')"
          :loading="isLoadingAction"
          :disabled="isLoadingAction || loadingError"
          data-test="dialog-save-button"
          @click="save"
        />
      </div>
    </template>

    <OverlayComponent
      :show="isLoadingAction || loadingError"
      style="min-height: 100px"
      class="mt-6"
    >
      <template #overlay>
        <LoadingRetryButton :error="loadingError" @reload="loadSettings()" />
      </template>

      <form v-if="settings != null" class="flex flex-col gap-4">
        <div
          class="col-span-12 flex flex-col gap-2 md:col-span-6 xl:col-span-3"
          data-test="streaming-enabled-field"
        >
          <label for="streaming-enabled" class="flex items-center">
            {{ $t("admin.streaming.enabled") }}
          </label>
          <ToggleSwitch
            v-model="settings.enabled"
            :disabled="disabled || isLoadingAction"
            :invalid="formErrors.fieldInvalid('enabled')"
            class="shrink-0"
            input-id="streaming-enabled"
          />
          <FormError :errors="formErrors.fieldError('enabled')" />
        </div>

        <fieldset
          class="grid-rows grid gap-2"
          data-test="streaming-default-pause-image-field"
        >
          <legend
            id="pause-image-label"
            class="col-span-12 md:col-span-4 md:mb-0"
          >
            {{ $t("admin.streaming.default_pause_image") }}
          </legend>
          <div class="col-span-12 md:col-span-8">
            <SettingsFileSelector
              v-model:file-url="settings.default_pause_image"
              v-model:file="defaultPauseImage"
              v-model:file-deleted="defaultPauseImageDeleted"
              :disabled="disabled || isLoadingAction"
              :max-file-size="5000000"
              :hide-url="true"
              show-delete
              :preview-alt="$t('rooms.streaming.config.pause_image_alt')"
              :allowed-extensions="['jpg', 'jpeg', 'png', 'gif', 'svg']"
              input-id="pause-image"
              :url-invalid="formErrors.fieldInvalid('default_pause_image')"
              :file-invalid="formErrors.fieldInvalid('default_pause_image')"
              :url-error="formErrors.fieldError('default_pause_image')"
              :file-error="formErrors.fieldError('default_pause_image')"
            />
            <small>{{ $t("rooms.streaming.config.pause_image_format") }}</small>
          </div>
        </fieldset>
      </form>
    </OverlayComponent>
  </Dialog>
</template>
<script setup>
import { ref } from "vue";
import { useApi } from "../composables/useApi.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import env from "../env.js";

const emit = defineEmits(["edited", "gone"]);

const api = useApi();
const formErrors = useFormErrors();

const modalVisible = ref(false);
const isLoadingAction = ref(false);
const loadingError = ref(false);

const defaultPauseImage = ref(null);
const defaultPauseImageDeleted = ref(false);

const props = defineProps({
  roomType: {
    type: Object,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const settings = ref(null);

function showModal() {
  formErrors.clear();
  loadingError.value = false;
  settings.value = null;
  loadSettings();
  modalVisible.value = true;
}

function loadSettings() {
  isLoadingAction.value = true;
  loadingError.value = false;
  api
    .call("roomTypes/" + props.roomType.id + "/streaming")
    .then((response) => {
      settings.value = response.data.data;
    })
    .catch((error) => {
      loadingError.value = true;
      api.error(error);
    })
    .finally(() => {
      isLoadingAction.value = false;
    });
}

function save() {
  isLoadingAction.value = true;
  formErrors.clear();

  // Build form data
  const formData = new FormData();

  if (defaultPauseImage.value !== null) {
    formData.append("default_pause_image", defaultPauseImage.value);
  } else if (defaultPauseImageDeleted.value) {
    formData.append("default_pause_image", "");
  }

  formData.append("enabled", settings.value.enabled ? "1" : "0");

  formData.append("_method", "PUT");

  api
    .call("roomTypes/" + props.roomType.id + "/streaming", {
      method: "post",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((response) => {
      defaultPauseImage.value = null;
      defaultPauseImageDeleted.value = false;

      // update form input
      settings.value = response.data.data;

      emit("edited");
      modalVisible.value = false;
    })
    .catch((error) => {
      if (
        error.response &&
        error.response.status === env.HTTP_UNPROCESSABLE_ENTITY
      ) {
        formErrors.set(error.response.data.errors);
      } else {
        api.error(error);
      }
    })
    .finally(() => {
      isLoadingAction.value = false;
    });
}
</script>
