<template>
  <div>
    <form :aria-hidden="loadingError" @submit="save">
      <OverlayComponent :show="isBusy || loadingError">
        <template #overlay>
          <LoadingRetryButton :error="loadingError" @reload="load" />
        </template>

        <div v-for="section in form" class="grid grid-cols-12 gap-4">
          <div class="col-span-12">
            <h4 class="m-0 text-lg font-semibold">
              {{ section.title }}
            </h4>
          </div>

          <component
            v-for="item in section.items"
            :is="item.component"
            v-model="settings"
            :formErrors="formErrors"
            v-bind="item"
          />

          <Divider class="col-span-12" />
        </div>

        <div v-if="settingsDirty" class="sticky bottom-0 px-px py-4">
          <div class="rounded-lg dark:bg-surface-900/80">
            <Message
              severity="warn"
              :pt="{
                text: 'w-full',
                content: {
                  'data-test': 'room-unsaved-changes-message',
                },
              }"
            >
              <div
                class="flex flex-col items-center justify-between gap-4 md:flex-row"
              >
                <span class="text-center md:text-left"
                  ><i class="fas fa-warning mr-2" />
                  {{ $t("rooms.settings.unsaved_changes") }}</span
                >

                <Button
                  v-if="!saveButtonIsVisible"
                  class="w-full shrink-0 md:w-auto"
                  severity="contrast"
                  :disabled="disabled"
                  :label="$t('app.save')"
                  :loading="isBusy"
                  icon="fa-solid fa-save"
                  type="submit"
                  data-test="room-unsaved-changes-save-button"
                />
              </div>
            </Message>
          </div>
        </div>
      </OverlayComponent>
      <Divider v-if="userPermissions.can('manageSettings', props.room)" />
      <div
        v-if="userPermissions.can('manageSettings', props.room)"
        class="flex flex-col-reverse flex-wrap gap-2 md:flex-row md:items-start md:justify-between"
      >
        <div class="flex shrink-0 flex-col gap-2 md:flex-row md:items-start">
          <RoomDeleteButton
            :disabled="disabled"
            :room="room"
            @room-deleted="$router.push({ name: 'rooms.index' })"
          />
          <RoomTransferOwnershipButton
            :disabled="disabled"
            :room="room"
            @transferred-ownership="emit('settingsChanged')"
          />
          <RoomTabSettingsExpertModeButton
            :disabled="disabled"
            :expert-mode="settings.expert_mode"
            @toggle-expert-mode="toggleExpertMode"
          />
        </div>
        <Button
          ref="saveButton"
          data-test="room-settings-save-button"
          :disabled="disabled"
          :label="$t('app.save')"
          :loading="isBusy"
          icon="fa-solid fa-save"
          type="submit"
        />
      </div>
    </form>
  </div>
</template>

<script setup>
import env from "../env.js";
import _ from "lodash";
import { useSettingsStore } from "../stores/settings";
import { useApi } from "../composables/useApi.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import { onMounted, ref, computed } from "vue";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { ROOM_SETTINGS_DEFINITION } from "../constants/roomSettings.js";
import RoomSettingEnforcedIcon from "./RoomSettingEnforcedIcon.vue";
import { sha256 } from "@noble/hashes/sha2";
import { useElementVisibility } from "@vueuse/core";
import RoomTabSettingsTextInput from "./RoomTabSettingsTextInput.vue";
import { useI18n } from "vue-i18n";
import RoomTabSettingsTextArea from "./RoomTabSettingsTextArea.vue";
import RoomTabSettingsToggleSwitch from "./RoomTabSettingsToggleSwitch.vue";
import RoomTabSettingsRadioGroup from "./RoomTabSettingsRadioGroup.vue";
import RoomTabSettingsSelectButton from "./RoomTabSettingsSelectButton.vue";
import RoomTabSettingsRoomTypeSelect from "./RoomTabSettingsRoomTypeSelect.vue";
import RoomTabSettingsAccessCodeInput from "./RoomTabSettingsAccessCodeInput.vue";

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["settingsChanged"]);

const settings = ref({
  expert_mode: false,
  room_type: {},
});

const loaded = ref(false);
const settingsHash = ref(null);

const isBusy = ref(false);
const loadingError = ref(false);

const api = useApi();
const formErrors = useFormErrors();
const settingsStore = useSettingsStore();
const userPermissions = useUserPermissions();
const { t } = useI18n();
const saveButton = ref(null);
const saveButtonIsVisible = useElementVisibility(saveButton);

const form = computed(() => {
  const sections = [
    {
      title: t("rooms.settings.general.title"),
      items: [
        {
          setting: "room_type",
          label: t("rooms.settings.general.type"),
          component: RoomTabSettingsRoomTypeSelect,
          expert: false,
        },
        {
          setting: "name",
          label: t("rooms.name"),
          component: RoomTabSettingsTextInput,
          expert: false,
        },
        {
          setting: "access_code",
          label: t("rooms.access_code"),
          component: RoomTabSettingsAccessCodeInput,
          placeholder: t("rooms.settings.general.unprotected_placeholder"),
          expert: false,
        },
        {
          setting: "allow_guests",
          label: t("rooms.settings.general.access_by_guests"),
          component: RoomTabSettingsToggleSwitch,
          expert: false,
        },
        {
          setting: "short_description",
          label: t("rooms.settings.general.short_description"),
          component: RoomTabSettingsTextArea,
          placeholder: t("rooms.settings.none_placeholder"),
          full_width: true,
          max: 300,
          row: 3,
          expert: true,
        },
      ],
    },
    {
      title: t("rooms.settings.video_conference.title"),
      items: [
        {
          setting: "everyone_can_start",
          label: t("rooms.settings.video_conference.everyone_can_start"),
          component: RoomTabSettingsToggleSwitch,
          expert: true,
        },
        {
          setting: "mute_on_start",
          label: t("rooms.settings.video_conference.mute_on_start"),
          component: RoomTabSettingsToggleSwitch,
          expert: true,
        },
        {
          setting: "lobby",
          label: t("rooms.settings.video_conference.lobby.title"),
          options: [
            { value: 0, label: t("app.disabled") },
            { value: 1, label: t("app.enabled") },
            {
              value: 2,
              label: t(
                "rooms.settings.video_conference.lobby.only_for_guests_enabled",
              ),
            },
          ],
          component: RoomTabSettingsRadioGroup,
          expert: true,
        },
        {
          setting: "welcome",
          label: t("rooms.settings.video_conference.welcome_message"),
          component: RoomTabSettingsTextArea,
          placeholder: t("rooms.settings.none_placeholder"),
          full_width: true,
          max: 500,
          row: 3,
          expert: true,
        },
      ],
    },
    {
      title: t("rooms.settings.recordings.title"),
      items: [
        {
          setting: "record_attendance",
          label: t("rooms.settings.recordings.record_attendance"),
          component: RoomTabSettingsToggleSwitch,
          expert: true,
        },
        {
          setting: "record",
          label: t("rooms.settings.recordings.record_video_conference"),
          component: RoomTabSettingsToggleSwitch,
          expert: true,
        },
        {
          setting: "auto_start_recording",
          label: t("rooms.settings.recordings.auto_start_recording"),
          component: RoomTabSettingsToggleSwitch,
          expert: true,
        },
      ],
    },
    {
      title: t("rooms.settings.restrictions.title"),
      items: [
        {
          setting: "lock_settings_disable_cam",
          label: t("rooms.settings.restrictions.lock_settings_disable_cam"),
          component: RoomTabSettingsToggleSwitch,
          expert: true,
        },
        {
          setting: "webcams_only_for_moderator",
          label: t("rooms.settings.restrictions.webcams_only_for_moderator"),
          component: RoomTabSettingsToggleSwitch,
          expert: true,
        },
        {
          setting: "lock_settings_disable_mic",
          label: t("rooms.settings.restrictions.lock_settings_disable_mic"),
          component: RoomTabSettingsToggleSwitch,
          expert: true,
        },
        {
          setting: "lock_settings_disable_public_chat",
          label: t(
            "rooms.settings.restrictions.lock_settings_disable_public_chat",
          ),
          component: RoomTabSettingsToggleSwitch,
          expert: true,
        },
        {
          setting: "lock_settings_disable_private_chat",
          label: t(
            "rooms.settings.restrictions.lock_settings_disable_private_chat",
          ),
          component: RoomTabSettingsToggleSwitch,
          expert: true,
        },
        {
          setting: "lock_settings_disable_note",
          label: t("rooms.settings.restrictions.lock_settings_disable_note"),
          component: RoomTabSettingsToggleSwitch,
          expert: true,
        },
        {
          setting: "lock_settings_hide_user_list",
          label: t("rooms.settings.restrictions.lock_settings_hide_user_list"),
          component: RoomTabSettingsToggleSwitch,
          expert: true,
        },
      ],
    },
    {
      title: t("rooms.settings.participants.title"),
      items: [
        {
          setting: "allow_membership",
          label: t("rooms.settings.participants.allow_membership"),
          component: RoomTabSettingsToggleSwitch,
          expert: true,
        },
        {
          setting: "default_role",
          label: t("rooms.settings.participants.default_role.title"),
          component: RoomTabSettingsSelectButton,
          options: [
            { value: 1, label: t("rooms.roles.participant") },
            { value: 2, label: t("rooms.roles.moderator") },
          ],
          expert: true,
        },
      ],
    },
    {
      title: t("rooms.settings.advanced.title"),
      items: [
        {
          setting: "visibility",
          label: t("rooms.settings.advanced.visibility.title"),
          component: RoomTabSettingsSelectButton,
          options: [
            {
              value: 0,
              label: t("rooms.settings.advanced.visibility.private"),
            },
            { value: 1, label: t("rooms.settings.advanced.visibility.public") },
          ],
          expert: true,
        },
      ],
    },
  ];

  if (settings.value.expert_mode) {
    return sections;
  }

  // Filter sections based on the expert mode
  // remove section if expert mode is disabled and all items are expert items
  return sections.filter((section) => {
    return section.items.some((item) => !item.expert);
  });
});

/**
 * Save room settings
 *
 *  @param event
 */
function save(event) {
  // Prevent default form submit
  event.preventDefault();

  // Set busy indicator
  isBusy.value = true;

  const newSettings = _.clone(settings.value);
  newSettings.room_type = newSettings.room_type
    ? newSettings.room_type.id
    : null;

  formErrors.clear();

  // Send new settings to the server
  api
    .call("rooms/" + props.room.id, {
      method: "put",
      data: newSettings,
    })
    .then((response) => {
      // Settings successfully saved
      // update the settings to the response from the server, feedback the changed were applied correctly
      settings.value = response.data.data;
      // inform parent component about changed settings
      emit("settingsChanged");
      settingsHash.value = getSettingsHash(settings.value);
    })
    .catch((error) => {
      // Settings couldn't be saved
      if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
        formErrors.set(error.response.data.errors);
        return;
      }
      api.error(error, { redirectOnUnauthenticated: false });
    })
    .finally(() => {
      // Disable busy indicator
      isBusy.value = false;
    });
}

function getSettingsHash(settingsData) {
  const data = _.clone(settingsData);
  data.room_type = data.room_type?.id;

  return btoa(sha256(JSON.stringify(data)));
}

const settingsDirty = computed(() => {
  return loaded.value && getSettingsHash(settings.value) !== settingsHash.value;
});

/**
 * Load the room settings
 */
function load() {
  // Set busy indicator
  isBusy.value = true;
  loadingError.value = false;

  // Load all room settings
  api
    .call("rooms/" + props.room.id + "/settings")
    .then((response) => {
      // fetch successful
      settings.value = response.data.data;
      settingsHash.value = getSettingsHash(settings.value);
      loaded.value = true;
    })
    .catch((error) => {
      api.error(error, { redirectOnUnauthenticated: false });
      loadingError.value = true;
    })
    .finally(() => {
      // Disable busy indicator
      isBusy.value = false;
    });
}

/**
 * Create a new access code for the room
 */
function createAccessCode() {
  settings.value.access_code =
    Math.floor(Math.random() * (999999999 - 111111112)) + 111111111;
}

/**
 * Toggle the expert mode for this room and reset expert settings when opening expert mode
 */
function toggleExpertMode() {
  settings.value.expert_mode = !settings.value.expert_mode;

  if (!settings.value.expert_mode) {
    resetExpertSettings();
  }
}

/**
 * Reset the room settings to the values defined in the room type
 * @param resetToDefaults indicates if the settings should be reset to the default values of the room type
 */
function resetToRoomTypeSettings(resetToDefaults = false) {
  // Reset the value of all other settings
  for (const setting in ROOM_SETTINGS_DEFINITION) {
    resetSetting(setting, resetToDefaults);
  }
}

/**
 *  Reset all expert settings back to the default values defined in the room type.
 *  Clear the settings that don't have a default setting in the room type.
 */
function resetExpertSettings() {
  // Reset settings that have a default setting in the room type
  for (const setting in ROOM_SETTINGS_DEFINITION) {
    if (ROOM_SETTINGS_DEFINITION[setting].expert_setting) {
      resetSetting(setting);
    }
  }
  // Reset settings that don't have a default setting in the room type
  settings.value.welcome = "";
}

/**
 * Reset the value of a single setting
 * (must exist in the room and have an enforced and default setting in the room type)
 * @param settingName setting name of the setting that should be reset
 * @param resetToDefaults indicates if setting should be reset to the default value of the room type
 */
function resetSetting(settingName, resetToDefaults = true) {
  // Reset value of the setting in the room back to the default setting of the room type
  // if the setting is enforced or resetToDefaults is true
  // or the expert mode is not active and the setting is an expert setting
  if (
    resetToDefaults ||
    settings.value.room_type[settingName + "_enforced"] ||
    (ROOM_SETTINGS_DEFINITION[settingName]?.expert_setting &&
      !settings.value.expert_mode)
  ) {
    settings.value[settingName] =
      settings.value.room_type[settingName + "_default"];
  }
}

/**
 * Input fields are disabled: due to limited permissions, loading of settings or errors
 */
const disabled = computed(() => {
  return (
    !userPermissions.can("manageSettings", props.room) ||
    isBusy.value ||
    loadingError.value
  );
});

/**
 * Count the chars of the welcome message
 * @returns {string} amount of chars in comparison to the limit
 */
const charactersLeftWelcomeMessage = computed(() => {
  const char = settings.value.welcome ? settings.value.welcome.length : 0;
  return char + " / " + settingsStore.getSetting("bbb.welcome_message_limit");
});

/**
 * Count the chars of the short description
 * @returns {string} amount of chars in comparison to the limit
 */
const charactersLeftShortDescription = computed(() => {
  const char = settings.value.short_description
    ? settings.value.short_description.length
    : 0;
  return char + " / " + 300;
});

/**
 * Show alert if simultaneously default role is moderator and waiting room is active
 */
const showLobbyAlert = computed(() => {
  return settings.value.default_role === 2 && settings.value.lobby === 1;
});

onMounted(() => {
  // Load all room settings
  load();
});
</script>
