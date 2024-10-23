<template>
  <Dialog
    v-model:visible="modalVisible"
    :header="$t('rooms.change_type.title')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :dismissable-mask="false"
    modal
    data-test="room-type-change-confirmation-dialog"
  >
    <div class="overflow-y-auto" style="max-height: 300px">
      {{ $t("rooms.change_type.changing_settings") }}

      <!-- Show all room setting grouped by category -->
      <div v-for="settingGroup in roomTypeSettings" :key="settingGroup.title">
        <h4 class="my-2 font-bold">{{ settingGroup.title }}</h4>

        <RoomTypeCompareSettingsField
          v-for="setting in settingGroup.settings"
          :key="setting.key"
          :data-test="'room-type-' + setting.key + '-comparison'"
          :current-value="getCurrentSettingValue(setting)"
          :current-enforced="
            currentSettings.room_type[setting.key + '_enforced']
          "
          :new-value="getResultingSetting(setting.key)"
          :new-enforced="newRoomType[setting.key + '_enforced']"
          :label="setting.label"
          :type="setting.type"
          :options="setting.options"
        />
      </div>
    </div>

    <Divider class="mt-0" />

    <div class="flex items-center gap-2">
      <ToggleSwitch v-model="resetToDefaults" input-id="reset-to-defaults" />
      <label for="reset-to-defaults">
        {{ $t("rooms.change_type.reset_to_default") }}</label
      >
    </div>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <Button
          :label="$t('app.cancel')"
          severity="secondary"
          data-test="confirmation-dialog-cancel-button"
          @click="handleCancel"
        />
        <Button
          :label="$t('app.save')"
          data-test="confirmation-dialog-save-button"
          @click="handleSave"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref } from "vue";
import { useRoomTypeSettings } from "../composables/useRoomTypeSettings.js";
import { ROOM_SETTINGS_DEFINITION } from "../constants/roomSettings.js";

const modalVisible = defineModel({ type: Boolean });
const roomTypeSettings = useRoomTypeSettings();

const emit = defineEmits(["confirmedRoomTypeChange"]);
const props = defineProps({
  currentSettings: {
    type: Object,
    required: true,
  },
  newRoomType: {
    type: Object,
    required: true,
  },
});

const resetToDefaults = ref(false);

/**
 * Get the setting that will be applied if the room type is changed to the new room type
 * @param settingName setting name of the setting
 * @returns {*|boolean} resulting setting value for the given setting name
 */
function getResultingSetting(settingName) {
  // Access code will always keep its value if not enforced
  if (settingName === "has_access_code") {
    if (props.newRoomType[settingName + "_enforced"]) {
      return props.newRoomType[settingName + "_default"];
    }

    return props.currentSettings.access_code !== null;
  }

  // Check if setting should be changed to default value (reset to defaults, enforced, expert setting but expert mode deactivated)
  if (
    resetToDefaults.value ||
    props.newRoomType[settingName + "_enforced"] ||
    (ROOM_SETTINGS_DEFINITION[settingName]?.expert_setting &&
      !props.currentSettings.expert_mode)
  ) {
    return props.newRoomType[settingName + "_default"];
  }
  // Return current setting value
  return props.currentSettings[settingName];
}

/**
 * Get the current setting value for the given setting
 * @param setting setting for which the current value should be returned
 * @returns {*|boolean} current setting value for the given setting
 */
function getCurrentSettingValue(setting) {
  if (setting.current_value_key === "access_code") {
    return props.currentSettings.access_code !== null;
  }

  // Return current setting value
  return props.currentSettings[
    setting.current_value_key ? setting.current_value_key : setting.key
  ];
}

function handleSave() {
  emit("confirmedRoomTypeChange", resetToDefaults.value);
  resetToDefaults.value = false;
}

function handleCancel() {
  modalVisible.value = false;
  resetToDefaults.value = false;
}
</script>
