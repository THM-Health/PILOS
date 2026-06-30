import { watch } from "vue";
import * as _ from "lodash-es";
import { ROOM_SETTINGS_DEFINITION } from "../constants/roomSettings.js";
import { useSettingsStore } from "../stores/settings.js";
import { useI18n } from "vue-i18n";

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

export function validateParticipantName(participantName) {
  const minLength = 2;
  const maxLength = 50;

  // Required
  if (
    typeof participantName !== "string" ||
    participantName.trim().length === 0
  ) {
    return {
      valid: false,
      reason: "required",
      invalidChars: "",
    };
  }

  const guestNameLength = Array.from(participantName).length;

  // Min length
  if (guestNameLength < minLength) {
    return {
      valid: false,
      reason: "min",
      invalidChars: "",
      min: minLength,
    };
  }

  // Max length
  if (guestNameLength > maxLength) {
    return {
      valid: false,
      reason: "max",
      invalidChars: "",
      max: maxLength,
    };
  }

  // Allowed characters
  const settingsStore = useSettingsStore();
  let allowedNameCharacters = settingsStore.getSetting(
    "bbb.allowed_name_characters",
  );

  if (
    typeof allowedNameCharacters !== "string" ||
    allowedNameCharacters === ""
  ) {
    return {
      valid: false,
      reason: "unsupportedPattern",
      invalidChars: "",
    };
  }

  // Convert allowed name characters to align frontend validation with backend validation
  allowedNameCharacters = allowedNameCharacters.replaceAll(
    "\\w",
    "\\p{L}\\p{M}\\p{N}\\p{Pc}",
  );

  let invalidChars;

  try {
    invalidChars = Array.from(
      new Set(
        participantName.replace(
          new RegExp(`[${allowedNameCharacters}]+`, "gu"),
          "",
        ),
      ),
    ).join("");
  } catch {
    return {
      valid: false,
      reason: "unsupportedPattern",
      invalidChars: "",
    };
  }

  return {
    valid: invalidChars.length === 0,
    reason: invalidChars.length === 0 ? null : "invalid_characters",
    invalidChars,
  };
}

export function getParticipantNameValidationErrorMessage(validation) {
  const { t } = useI18n();
  const attribute = t("rooms.first_and_lastname");

  if (validation.reason === "required") {
    return t("validation.required", {
      attribute,
    });
  }

  if (validation.reason === "min") {
    return t("validation.min.string", {
      attribute,
      min: validation.min,
    });
  }

  if (validation.reason === "max") {
    return t("validation.max.string", {
      attribute,
      max: validation.max,
    });
  }

  if (validation.reason === "invalid_characters") {
    return t("validation.validname", {
      attribute,
      chars: validation.invalidChars,
    });
  }

  return t("validation.validname_error", {
    attribute,
  });
}
