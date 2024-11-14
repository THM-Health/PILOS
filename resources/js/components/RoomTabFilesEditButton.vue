<template>
  <!-- button -->
  <Button
    v-tooltip="$t('rooms.files.edit')"
    :aria-label="$t('rooms.files.edit')"
    :disabled="disabled"
    severity="info"
    icon="fa-solid fa-edit"
    data-test="room-files-edit-button"
    @click="showModal"
  />

  <!-- modal -->
  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('rooms.files.edit')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="false"
    :closable="!isLoadingAction"
    data-test="room-files-edit-dialog"
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
          :disabled="isLoadingAction"
          data-test="dialog-save-button"
          @click="save"
        />
      </div>
    </template>

    <div class="field grid grid-cols-12 gap-4" data-test="download-field">
      <label for="download" class="col-span-12 mb-2 md:col-span-6 md:mb-0">{{
        $t("rooms.files.downloadable")
      }}</label>
      <div class="col-span-12 md:col-span-6">
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

    <div class="field grid grid-cols-12 gap-4" data-test="use-in-meeting-field">
      <label
        for="use_in_meeting"
        class="col-span-12 mb-2 md:col-span-6 md:mb-0"
        >{{ $t("rooms.files.use_in_next_meeting") }}</label
      >
      <div class="col-span-12 md:col-span-6">
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

    <div class="field grid grid-cols-12 gap-4" data-test="default-field">
      <label for="default" class="col-span-12 mb-2 md:col-span-6 md:mb-0">{{
        $t("rooms.files.default")
      }}</label>
      <div class="col-span-12 md:col-span-6">
        <ToggleSwitch
          v-model="newDefault"
          input-id="default"
          required
          :disabled="isLoadingAction"
          :invalid="formErrors.fieldInvalid('default')"
        />
        <FormError :errors="formErrors.fieldError('default')" />
      </div>
    </div>
  </Dialog>
</template>
<script setup>
import env from "../env";
import { useApi } from "../composables/useApi.js";
import { ref, watch } from "vue";
import { useFormErrors } from "../composables/useFormErrors.js";
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";

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
  default: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["edited", "deleted"]);

const api = useApi();
const toast = useToast();
const { t } = useI18n();
const formErrors = useFormErrors();

const modalVisible = ref(false);
const newUseInMeeting = ref(null);
const newDownload = ref(null);
const newDefault = ref(null);
const isLoadingAction = ref(false);

/**
 * show modal
 */
function showModal() {
  newUseInMeeting.value = props.useInMeeting;
  newDownload.value = props.download;
  newDefault.value = props.default;
  formErrors.clear();
  modalVisible.value = true;
}

watch(newDefault, (value) => {
  if (value) {
    newUseInMeeting.value = true;
  }
});

watch(newUseInMeeting, (value) => {
  if (!value) {
    newDefault.value = false;
  }
});

/**
 * Sends a request to the server to create a new token or edit a existing.
 */
function save() {
  isLoadingAction.value = true;
  formErrors.clear();

  const config = {
    method: "put",
    data: {
      use_in_meeting: newUseInMeeting.value,
      download: newDownload.value,
      default: newDefault.value,
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
        if (error.response.status === env.HTTP_NOT_FOUND) {
          toast.error(t("rooms.flash.file_gone"));
          emit("deleted");
          modalVisible.value = false;
          return;
        }

        if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          formErrors.set(error.response.data.errors);
          return;
        }
      }
      api.error(error, { noRedirectOnUnauthenticated: true });
    })
    .finally(() => {
      isLoadingAction.value = false;
    });
}
</script>
