import { watch } from "vue";
import _ from "lodash";
import { ROOM_SETTINGS_DEFINITION } from "../constants/roomSettings.js";
export function onRoomHasChanged(room, callback) {
  watch(room, (newRoom, oldRoom) => {
    if (newRoom?.owner?.id !== oldRoom?.owner?.id) {
      return callback();
    }

    if (newRoom?.authenticated !== oldRoom?.authenticated) {
      return callback();
    }

    if (newRoom?.is_member !== oldRoom?.is_member) {
      return callback();
    }

    if (newRoom?.is_moderator !== oldRoom?.is_moderator) {
      return callback();
    }

    if (newRoom?.is_co_owner !== oldRoom?.is_co_owner) {
      return callback();
    }

    if (!_.isEqual(newRoom?.current_user, oldRoom?.current_user)) {
      return callback();
    }
  });
}

/**
 * Reset the value of a single setting
 * (must exist in the room and have an enforced and default setting in the room type)
 * @param roomSettings
 * @param settingName setting name of the setting that should be reset
 * @param resetToDefaults indicates if setting should be reset to the default value of the room type
 * @returns {object} roomSettings
 */
export function resetSetting(
  roomSettings,
  settingName,
  resetToDefaults = true,
) {
  // Ignore setting with no room type default
  if (ROOM_SETTINGS_DEFINITION[settingName].has_no_room_type_default === true) {
    return;
  }

  // Reset value of the setting in the room back to the default setting of the room type
  // if the setting is enforced or resetToDefaults is true
  // or the expert mode is not active and the setting is an expert setting
  if (
    resetToDefaults ||
    roomSettings.value.room_type[settingName + "_enforced"] ||
    (ROOM_SETTINGS_DEFINITION[settingName]?.expert_setting &&
      !roomSettings.value.expert_mode)
  ) {
    roomSettings.value[settingName] =
      roomSettings.value.room_type[settingName + "_default"];
  }
}
