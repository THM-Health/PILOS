<template>
  <Button
    v-tooltip="$t('rooms.files.configure_system_default')"
    :aria-label="$t('rooms.files.configure_system_default')"
    severity="info"
    icon="fa-solid fa-edit"
    data-test="room-files-configure-system-default-button"
    @click="showModal"
  />

  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('rooms.files.configure_system_default')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="false"
    :closable="!isLoadingAction"
    data-test="room-files-configure-system-default-dialog"
  >
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          :label="$t('app.cancel')"
          severity="secondary"
          :disabled="isLoadingAction"
          data-test="dialog-cancel-button"
          autofocus
          @click="modalVisible = false"
        />
        <Button
          :label="$t('app.save')"
          severity="success"
          :loading="isLoadingAction"
          data-test="dialog-save-button"
          @click="save"
        />
      </div>
    </template>

    <InlineNote severity="info" class="mt-1 mb-4">
      <div class="flex flex-row items-center gap-4">
        <i class="fa-solid fa-circle-info"></i>
        <p>{{ $t("rooms.files.system_default_description") }}</p>
      </div>
    </InlineNote>

    <div
      class="field mt-2 grid grid-cols-12 gap-4"
      data-test="use-in-meeting-field"
    >
      <label
        for="use_in_meeting"
        class="col-span-12 mb-2 md:col-span-8 md:mb-0"
        >{{ $t("rooms.files.always_available_in_meeting") }}</label
      >
      <div class="col-span-12 md:col-span-4">
        <ToggleSwitch
          v-model="newUseInMeeting"
          :disabled="isLoadingAction"
          input-id="use_in_meeting"
          required
          :invalid="formErrors.fieldInvalid('use_in_meeting')"
        />
        <FormError :errors="formErrors.fieldError('use_in_meeting')" />
      </div>
    </div>
  </Dialog>
</template>
<script setup>
import { useApi } from "../composables/useApi.js";
import { ref } from "vue";
import { useFormErrors } from "../composables/useFormErrors.js";
import {
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "../constants/httpStatusCodes.js";
import { HTTP_ERROR_ROOM_FILES_SYSTEM_DEFAULT_PRESENTATION_NOT_SET } from "../constants/httpCustomErrorMessages.js";
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
  useInMeeting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["edited", "systemDefaultPresentationNotSet"]);

const api = useApi();
const formErrors = useFormErrors();
const toast = useToast();
const { t } = useI18n();

const modalVisible = ref(false);
const newUseInMeeting = ref(null);
const isLoadingAction = ref(false);

/**
 * show modal
 */
function showModal() {
  newUseInMeeting.value = props.useInMeeting;
  formErrors.clear();
  modalVisible.value = true;
}

/**
 * Sends a request to the server to update the system-wide default presentation configuration.
 */
function save() {
  isLoadingAction.value = true;
  formErrors.clear();

  const config = {
    method: "put",
    data: {
      use_in_meeting: newUseInMeeting.value,
    },
  };

  api
    .call(`rooms/${props.roomId}/files/system_default`, config)
    .then(() => {
      // operation successful, close modal and reload list
      modalVisible.value = false;
      emit("edited");
    })
    .catch((error) => {
      // editing failed
      if (error.response) {
        if (error.response.status === HTTP_STATUS_UNPROCESSABLE_ENTITY) {
          formErrors.set(error.response.data.errors);
          return;
        }
        if (
          error.response.status === HTTP_STATUS_NOT_FOUND &&
          error.response.data?.message ===
            HTTP_ERROR_ROOM_FILES_SYSTEM_DEFAULT_PRESENTATION_NOT_SET
        ) {
          toast.error(t("rooms.flash.default_presentation_not_set"));
          emit("systemDefaultPresentationNotSet");
          modalVisible.value = false;
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
