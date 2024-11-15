<template>
  <Button
    v-tooltip="$t('rooms.recordings.edit_recording')"
    :disabled="disabled"
    severity="info"
    icon="fa-solid fa-edit"
    @click="showModal"
  />

  <!-- edit recording modal -->
  <Dialog
    v-model:visible="modalVisible"
    modal
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="false"
    :closable="!isLoadingAction"
  >
    <template #header>
      <div>
        <span class="p-dialog-title">
          {{ $t("rooms.recordings.modals.edit.title") }}
        </span>
        <br />
        <small
          >{{ $d(new Date(props.start), "datetimeShort") }}
          <raw-text>-</raw-text>
          {{ $d(new Date(props.end), "datetimeShort") }}</small
        >
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          :label="$t('app.cancel')"
          severity="secondary"
          :disabled="isLoadingAction"
          @click="modalVisible = false"
        />
        <Button
          :label="$t('app.save')"
          :loading="isLoadingAction"
          :disabled="isLoadingAction"
          @click="save"
        />
      </div>
    </template>

    <!-- description -->
    <div class="flex flex-col gap-2">
      <label for="description">{{ $t("rooms.recordings.description") }}</label>
      <Textarea
        id="description"
        v-model="newDescription"
        autofocus
        :disabled="isLoadingAction"
        :invalid="formErrors.fieldInvalid('description')"
        :maxlength="
          settingsStore.getSetting('recording.recording_description_limit')
        "
      />
      <FormError :errors="formErrors.fieldError('description')" />
      <small>
        {{ $t("app.char_counter", { chars: charactersLeftDescription }) }}
      </small>
    </div>

    <!-- available formats -->
    <div class="mt-6 flex flex-col gap-2">
      <label>{{ $t("rooms.recordings.available_formats") }}</label>
      <div
        v-for="format in newFormats"
        :key="format.id"
        class="flex items-center"
      >
        <ToggleSwitch
          v-model="format.disabled"
          :input-id="'format-' + format.id"
          :disabled="isLoadingAction"
          :true-value="false"
          :false-value="true"
        />
        <label :for="'format-' + format.id" class="ml-2">{{
          $t("rooms.recordings.format_types." + format.format)
        }}</label>
      </div>
      <FormError :errors="formErrors.fieldError('formats', true)" />
    </div>

    <!-- access -->
    <div class="mt-6 flex flex-col gap-2">
      <fieldset class="flex w-full flex-col gap-2">
        <label>{{ $t("rooms.recordings.access") }}</label>
        <div
          v-for="accessType in accessTypes"
          :key="accessType"
          class="flex items-center"
        >
          <RadioButton
            v-model="newAccess"
            :disabled="isLoadingAction"
            :input-id="'access-' + accessType"
            name="access"
            :value="accessType"
          />
          <label :for="'access-' + accessType" class="ml-2"
            ><RoomRecordingAccessBadge :access="accessType"
          /></label>
        </div>
        <FormError :errors="formErrors.fieldError('access')" />
      </fieldset>
    </div>
  </Dialog>
</template>
<script setup>
import env from "../env";
import { useApi } from "../composables/useApi.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import { computed, ref } from "vue";
import _ from "lodash";
import { useSettingsStore } from "../stores/settings.js";
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";

const props = defineProps({
  recordingId: {
    type: String,
    required: true,
  },
  roomId: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  start: {
    type: String,
    required: true,
  },
  end: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  formats: {
    type: Array,
    required: true,
  },
  access: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["edited", "notFound"]);

const api = useApi();
const formErrors = useFormErrors();
const settingsStore = useSettingsStore();
const toast = useToast();
const { t } = useI18n();

const modalVisible = ref(false);
const newDescription = ref(null);
const newFormats = ref([]);
const newAccess = ref(null);
const isLoadingAction = ref(false);
const accessTypes = ref([0, 1, 2, 3]);

/**
 * Count the chars of the description
 * @returns {string} amount of chars in comparison to the limit
 */
const charactersLeftDescription = computed(() => {
  return (
    newDescription.value.length +
    " / " +
    settingsStore.getSetting("recording.recording_description_limit")
  );
});

/**
 * show modal to edit recording
 */
function showModal() {
  newDescription.value = props.description;
  newFormats.value = _.cloneDeep(props.formats);
  newAccess.value = props.access;
  formErrors.clear();
  modalVisible.value = true;
}

/**
 * Save recording changes
 */
function save() {
  isLoadingAction.value = true;

  // reset previous error messages
  formErrors.clear();

  api
    .call("rooms/" + props.roomId + "/recordings/" + props.recordingId, {
      method: "put",
      data: {
        description: newDescription.value,
        access: newAccess.value,
        formats: newFormats.value,
      },
    })
    .then(() => {
      // operation successful, close modal and reload list
      modalVisible.value = false;
      emit("edited");
    })
    .catch((error) => {
      // editing failed
      if (error.response) {
        // recording not found
        if (error.response.status === env.HTTP_NOT_FOUND) {
          toast.error(t("rooms.flash.recording_gone"));
          modalVisible.value = false;
          emit("notFound");
          return;
        }
        // failed due to form validation errors
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
