<template>
  <div
    data-test="room-file-system-default"
    class="flex flex-col justify-between gap-4 rounded p-4 shadow outline-3 outline-surface-200 md:flex-row dark:outline-surface-700"
  >
    <div class="flex flex-col gap-2">
      <div class="flex flex-col gap-2 md:flex-row md:items-center">
        <p class="text-word-break m-0 text-lg font-semibold">
          {{ $t("rooms.files.system_default") }}
        </p>
        <div>
          <Tag
            v-if="preferAsDefault"
            severity="warn"
            :value="$t('rooms.files.default')"
          >
            <template #icon>
              <CircleNumberIcon
                :number="1"
                data-test="room-file-system-default-priority"
              />
            </template>
          </Tag>
          <Tag
            v-else-if="defaultFile === null"
            severity="info"
            value="Default presentation (Automatic)"
          >
            <template #icon>
              <CircleNumberIcon
                :number="1"
                data-test="room-file-system-default-priority"
              />
            </template>
          </Tag>
        </div>
      </div>
      <div
        v-if="defaultFile === null && !preferAsDefault"
        class="flex flex-row items-center gap-2"
      >
        <i class="fa-solid fa-circle-info"></i>
        <p class="m-0 text-sm">
          {{ $t("rooms.files.system_default_description") }}
        </p>
      </div>

      <div class="flex flex-col items-start gap-2">
        <div class="flex flex-row items-center gap-2">
          <i class="fa-solid fa-chalkboard-user"></i>
          <p class="m-0 flex flex-col gap-2 text-sm">
            <Tag
              v-if="useInMeeting"
              severity="success"
              :value="$t('rooms.files.always_available_in_meeting')"
            />
            <Tag
              v-else-if="defaultFile === null"
              severity="info"
              :value="
                $t('rooms.files.available_in_next_meeting') + ' (Automatic)'
              "
            />
            <Tag
              v-else
              severity="secondary"
              :value="$t('rooms.files.not_available_in_next_meeting')"
            />
          </p>
        </div>
      </div>
    </div>

    <div class="flex shrink-0 flex-row items-start justify-end gap-1">
      <!-- default -->
      <RoomTabFilesSystemDefaultDefaultButton
        :room-id="roomId"
        :use-in-meeting="useInMeeting"
        :prefer-as-default="preferAsDefault"
        :default-file="defaultFile"
        @edited="$emit('edited')"
      />

      <!-- view -->
      <Button
        v-tooltip="$t('rooms.files.view')"
        :aria-label="$t('rooms.files.view')"
        target="_blank"
        icon="fa-solid fa-eye"
        data-test="room-files-view-system-default-button"
        as="a"
        :href="file"
      />

      <!-- edit -->
      <Button
        v-tooltip="$t('rooms.files.configure_system_default')"
        :aria-label="$t('rooms.files.configure_system_default')"
        severity="info"
        icon="fa-solid fa-edit"
        data-test="room-files-configure-system-default-button"
        @click="showModal"
      />
    </div>
  </div>

  <Divider />

  <!-- modal -->
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
import { HTTP_STATUS_UNPROCESSABLE_ENTITY } from "../constants/httpStatusCodes.js";

const props = defineProps({
  file: {
    type: String,
    default: null,
  },
  roomId: {
    type: String,
    required: true,
  },
  useInMeeting: {
    type: Boolean,
    default: false,
  },
  preferAsDefault: {
    type: Boolean,
    default: false,
  },
  defaultFile: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["edited"]);

const api = useApi();
const formErrors = useFormErrors();

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
      // ToDo Stale error

      // editing failed
      if (error.response) {
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
