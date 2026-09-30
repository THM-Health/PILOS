<template>
  <!-- button -->
  <Button
    v-tooltip="$t('rooms.files.configure')"
    :aria-label="$t('rooms.files.configure_aria', { filename: filename })"
    :disabled="disabled"
    severity="info"
    icon="fa-solid fa-edit"
    data-test="room-files-configure-button"
    @click="showModal"
  />

  <!-- modal -->
  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('rooms.files.configure_dialog_title', { name: filename })"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="false"
    :closable="!isLoadingAction"
    data-test="room-files-configure-dialog"
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
          severity="success"
          :loading="isLoadingAction"
          data-test="dialog-save-button"
          form="room-files-configure-form"
          type="submit"
        />
      </div>
    </template>

    <Form
      id="room-files-configure-form"
      :disabled="isLoadingAction"
      @submit="save"
    >
      <div
        class="field mt-2 grid grid-cols-12 gap-4"
        data-test="use-in-meeting-field"
      >
        <label
          for="use_in_meeting"
          class="col-span-12 mb-2 md:col-span-8 md:mb-0"
          >{{ $t("rooms.files.available_in_next_meeting") }}</label
        >
        <div class="col-span-12 md:col-span-4">
          <ToggleSwitch
            v-model="newUseInMeeting"
            input-id="use_in_meeting"
            required
            :disabled="isLoadingAction"
            :invalid="formErrors.fieldInvalid('use_in_meeting')"
          />
          <FormError :errors="formErrors.fieldError('use_in_meeting')" />
        </div>
      </div>

      <div
        class="field mt-2 grid grid-cols-12 gap-4"
        data-test="download-field"
      >
        <label for="download" class="col-span-12 mb-2 md:col-span-8 md:mb-0">{{
          $t("rooms.files.downloadable")
        }}</label>
        <div class="col-span-12 md:col-span-4">
          <ToggleSwitch
            v-model="newDownload"
            input-id="download"
            required
            :disabled="isLoadingAction"
            :invalid="formErrors.fieldInvalid('download')"
          />
          <FormError :errors="formErrors.fieldError('download')" />
        </div>
      </div>
    </Form>
  </Dialog>
</template>
<script setup>
import { useApi } from "../composables/useApi.js";
import { ref } from "vue";
import { useFormErrors } from "../composables/useFormErrors.js";
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";
import { ROOM_FILE } from "../constants/modelNames.js";
import {
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "../constants/httpStatusCodes.js";

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
  fileId: {
    type: Number,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  useInMeeting: {
    type: Boolean,
    default: false,
  },
  download: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["edited", "notFound"]);

const api = useApi();
const toast = useToast();
const { t } = useI18n();
const formErrors = useFormErrors();

const modalVisible = ref(false);
const newUseInMeeting = ref(null);
const newDownload = ref(null);
const isLoadingAction = ref(false);

/**
 * show modal
 */
function showModal() {
  newUseInMeeting.value = props.useInMeeting;
  newDownload.value = props.download;
  formErrors.clear();
  modalVisible.value = true;
}

/**
 * Sends a request to the server to update the file configuration.
 */
function save() {
  isLoadingAction.value = true;
  formErrors.clear();

  const config = {
    method: "put",
    data: {
      use_in_meeting: newUseInMeeting.value,
      download: newDownload.value,
    },
  };

  api
    .call(`rooms/${props.roomId}/files/${props.fileId}`, config)
    .then(() => {
      // operation successful, close modal and reload list
      modalVisible.value = false;
      emit("edited");
    })
    .catch((error) => {
      // editing failed
      if (error.response) {
        // file not found
        if (
          error.response.status === HTTP_STATUS_NOT_FOUND &&
          error.response.data?.model === ROOM_FILE
        ) {
          toast.error(t("rooms.flash.file_gone"));
          emit("notFound");
          modalVisible.value = false;
          return;
        }

        if (error.response.status === HTTP_STATUS_UNPROCESSABLE_ENTITY) {
          formErrors.set(error.response.data.errors);
          return;
        }
      }
      api.error(error, { redirectOnUnauthenticated: false });
    })
    .finally(() => {
      isLoadingAction.value = false;
    });
}
</script>
