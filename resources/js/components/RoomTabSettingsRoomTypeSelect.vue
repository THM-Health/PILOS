<template>
  <div
    :data-test="'room-setting-' + setting"
    :class="
      fullWidth
        ? 'col-span-12 row-span-2 grid grid-rows-subgrid gap-0'
        : 'col-span-12 row-span-2 grid grid-rows-subgrid gap-0 md:col-span-6 xl:col-span-3'
    "
  >
    <div class="mb-2 flex flex-col justify-end">
      <label :for="'room-setting-' + setting">{{ label }}</label>
    </div>
    <div class="flex flex-col gap-2">
      <InputGroup v-if="model.room_type">
        <InputText
          :id="'room-setting-' + setting"
          :value="model.room_type.name"
          readonly
          :disabled="disabled"
          :invalid="invalid"
        />
        <Button
          v-if="!disabled"
          icon="fa-solid fa-edit"
          :aria-label="$t('rooms.change_type.title')"
          data-test="room-type-change-button"
          @click="showModal"
        />
      </InputGroup>
      <FormError :errors="errors" />
      <InlineNote v-if="warningMessage" severity="warn">
        {{ warningMessage }}
      </InlineNote>

      <Dialog
        v-model:visible="modalVisible"
        data-test="room-type-change-dialog"
        modal
        :header="$t('rooms.change_type.title')"
        :style="{ width: '900px' }"
        :breakpoints="{ '975px': '90vw' }"
        :close-on-escape="!roomTypeSelectBusy"
        :closable="!roomTypeSelectBusy"
        :draggable="false"
        :dismissable-mask="false"
      >
        <div class="flex flex-col gap-2">
          <label id="room-type-label">{{
            $t("rooms.settings.general.type")
          }}</label>
          <RoomTypeSelect
            ref="roomTypeSelect"
            v-model="newRoomType"
            aria-labelledby="room-type-label"
            :redirect-on-unauthenticated="false"
            @loading-error="(value) => (roomTypeSelectLoadingError = value)"
            @busy="(value) => (roomTypeSelectBusy = value)"
          />
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <Button
              :label="$t('app.cancel')"
              severity="secondary"
              data-test="dialog-cancel-button"
              :disabled="roomTypeSelectBusy"
              @click="modalVisible = false"
            />
            <Button
              :label="$t('app.save')"
              :disabled="
                roomTypeSelectLoadingError || !newRoomType || roomTypeSelectBusy
              "
              data-test="dialog-save-button"
              @click="handleOk"
            />
          </div>
        </template>
      </Dialog>

      <RoomTypeChangeConfirmationModal
        v-model="confirmationModalVisible"
        :current-settings="model"
        :new-room-type="newRoomType"
        @confirmed-room-type-change="
          (resetToDefaults) => changeRoomType(resetToDefaults)
        "
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import _ from "lodash";
import { ROOM_SETTINGS_DEFINITION } from "../constants/roomSettings.js";
import { resetSetting } from "../composables/useRoomHelpers.js";
const model = defineModel({ type: Object });

defineProps({
  setting: {
    type: String,
    required: true,
  },
  fullWidth: {
    type: Boolean,
    required: false,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  invalid: {
    type: Boolean,
    required: false,
  },
  errors: {
    type: Object,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  warningMessage: {
    type: [String, null],
    required: false,
    default: null,
  },
});

const modalVisible = ref(false);
const roomTypeSelectBusy = ref(false);
const roomTypeSelectLoadingError = ref(false);
const confirmationModalVisible = ref(false);

const newRoomType = ref({});

function showModal() {
  roomTypeSelectBusy.value = false;
  roomTypeSelectLoadingError.value = false;
  newRoomType.value = _.cloneDeep(model.value.room_type);
  modalVisible.value = true;
}

function handleOk() {
  // Show room type confirmation modal if the settings change
  if (roomSettingsChanged()) {
    confirmationModalVisible.value = true;
  } else {
    changeRoomType();
  }
}

/**
 * Checks if the default value or the enforced value of a single setting change with the new room type
 * @param settingName setting name of the setting that should be checked for changes
 * @returns {boolean} boolean that indicates if the setting is changed
 */
function roomSettingChanged(settingName) {
  // Ignore setting with no room type default
  if (ROOM_SETTINGS_DEFINITION[settingName].has_no_room_type_default === true) {
    return false;
  }

  // Check if default value of the setting changed / is different to the current setting
  if (
    model.value[settingName] !== newRoomType.value[settingName + "_default"]
  ) {
    return true;
  }

  // Check if the enforced status of the setting changed
  if (
    model.value.room_type[settingName + "_enforced"] !==
    newRoomType.value[settingName + "_enforced"]
  ) {
    return true;
  }

  // Setting did not change
  return false;
}

/**
 * Checks if any of the current settings change with the new room type
 * @returns {boolean}
 */
function roomSettingsChanged() {
  // Check access code setting for changes
  if (
    model.value.room_type.has_access_code_enforced !==
    newRoomType.value.has_access_code_enforced
  ) {
    return true;
  }

  // Check all other settings for changes
  for (const setting in ROOM_SETTINGS_DEFINITION) {
    if (roomSettingChanged(setting)) return true;
  }

  // There are no change for the settings that the user can modify
  return false;
}

/**
 * Change the room type
 * @param resetToDefaults indicates if the settings should be reset to the default values of the room type
 */
function changeRoomType(resetToDefaults = false) {
  model.value.room_type = _.cloneDeep(newRoomType.value);
  modalVisible.value = false;
  confirmationModalVisible.value = false;

  // Reset the value of all other settings
  for (const setting in ROOM_SETTINGS_DEFINITION) {
    resetSetting(model, setting, resetToDefaults);
  }
}
</script>
