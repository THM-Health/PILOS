<template>
  <div>
    <form
      :aria-hidden="loadingError"
      @submit="save"
    >
      <OverlayComponent :show="isBusy || loadingError ">
        <template #overlay>
          <LoadingRetryButton :error="loadingError" @reload="load"/>
        </template>

        <div class="grid">

          <!-- General settings (always shown) -->
          <div class="col-12">
            <h4 class="text-lg font-semibold m-0">{{ $t('rooms.settings.general.title') }}</h4>
          </div>

          <!-- Room type setting -->
          <div class="col-12 md:col-3 flex flex-column">
            <label for="room-type" class="mb-2">{{ $t('rooms.settings.general.type') }}</label>

            <RoomTypeChangeButton
              input-id="room-type"
              v-model="settings.room_type"
              :disabled="disabled"
              :invalid="formErrors.fieldInvalid('room_type')"
              :room-id="room.id"
              :current-settings="settings"
              @room-type-changed="(resetToDefaults) => resetToRoomTypeSettings(resetToDefaults)"
            />
            <p class="p-error" v-html="formErrors.fieldError('room_type')"/>
          </div>

          <!-- Room name -->
          <div class="col-12 md:col-3 flex flex-column">
            <label for="room-name" class="mb-2">{{ $t('rooms.name') }}</label>
            <InputText
              class="w-full"
              id="room-name"
              v-model="settings.name"
              :disabled="disabled"
              :invalid="formErrors.fieldInvalid('name')"
            />
            <p class="p-error" v-html="formErrors.fieldError('name')"/>
          </div>

          <!-- Access code -->
          <div class="col-12 md:col-3 flex flex-column">
            <label for="access-code" class="mb-2">{{ $t('rooms.access_code') }}</label>

            <InputGroup>
              <!-- Generate random access code -->
              <Button
                v-if="!(!settings.room_type.has_access_code_default && settings.room_type.has_access_code_enforced)"
                v-tooltip="$t('rooms.settings.general.generate_access_code')"
                :aria-label="$t('rooms.settings.general.generate_access_code')"
                :disabled="disabled"
                icon="fa-solid fa-dice"
                @click="createAccessCode"
              />
              <!-- Access code -->
              <InputText
                id="access-code"
                v-model.number="settings.access_code"
                :disabled="disabled"
                :invalid="formErrors.fieldInvalid('access_code')"
                :placeholder="$t('rooms.settings.general.unprotected_placeholder')"
                readonly="readonly"
                type="number"
              />
              <!-- Clear access code -->
              <Button
                v-if="settings.access_code && !(settings.room_type.has_access_code_default && settings.room_type.has_access_code_enforced)"
                v-tooltip="$t('rooms.settings.general.delete_access_code')"
                :disabled="disabled"
                icon="fa-solid fa-trash"
                @click="settings.access_code = null"
              />
            </InputGroup>
            <small>
              {{ $t('rooms.settings.general.access_code_note') }}
            </small>
            <p class="p-error" v-html="formErrors.fieldError('access_code')"/>
          </div>

          <!-- Checkbox allow guests to access the room -->
          <div class="col-12 md:col-3 flex flex-column gap-2">
            <label for="allow-guests" class="flex align-items-center gap-2">
              <RoomSettingEnforcedIcon v-if="settings.room_type.allow_guests_enforced"/>
              {{$t('rooms.settings.general.access_by_guests')}}
            </label>

            <div class="flex align-items-center gap-2">
              <InputSwitch
                v-model="settings.allow_guests"
                :disabled="disabled || settings.room_type.allow_guests_enforced"
                :invalid="formErrors.fieldInvalid('allow_guests')"
                class="flex-shrink-0"
                input-id="allow-guests"
              />
              <label for="allow-guests">{{ $t('rooms.settings.general.allow') }}</label>
            </div>
            <p class="p-error" v-html="formErrors.fieldError('allow_guests')"/>
          </div>

          <!-- Short description-->
          <div class="col-12 flex flex-column gap-2">
            <label for="short-description">{{ $t('rooms.settings.general.short_description') }}</label>

            <Textarea
              id="short-description"
              class="w-full"
              v-model="settings.short_description"
              :disabled="disabled"
              :invalid="formErrors.fieldInvalid('short_description')"
              :placeholder="$t('rooms.settings.none_placeholder')"
              rows="3"
            />
            <small>
              {{ $t('rooms.settings.general.chars', {chars: charactersLeftShortDescription}) }}
            </small>
            <p class="p-error" v-html="formErrors.fieldError('short_description')"/>
          </div>
        </div>

        <!-- Expert settings (only shown when expert mode is activated) -->
        <div class="grid" v-if="settings.expert_mode">
          <Divider />

          <!-- Video conference settings -->
          <div class="col-12">
            <h4 class="text-lg font-semibold m-0">{{ $t('rooms.settings.video_conference.title') }}</h4>
          </div>

          <!-- Everyone can start a new meeting, not only the moderator -->
          <div class="col-12 md:col-3 flex flex-column gap-2">
            <label for="everyone-can-start" class="align-items-center gap-2">
              <RoomSettingEnforcedIcon v-if="settings.room_type.everyone_can_start_enforced"/>
              {{$t('rooms.settings.video_conference.allow_starting')}}
            </label>

            <div class="flex align-items-center gap-2">
              <InputSwitch
                v-model="settings.everyone_can_start"
                :disabled="disabled || settings.room_type.everyone_can_start_enforced"
                :invalid="formErrors.fieldInvalid('everyone_can_start')"
                class="flex-shrink-0"
                input-id="everyone-can-start"
              />
              <label for="everyone-can-start">{{ $t('rooms.settings.general.allow_everyone') }}</label>
            </div>
            <p class="p-error" v-html="formErrors.fieldError('everyone_can_start')"/>
          </div>

          <!-- Mute everyone's microphone on meeting join -->
          <div class="col-12 md:col-3 flex flex-column gap-2">
            <label for="mute-on-start" class="flex align-items-center gap-2">
              <RoomSettingEnforcedIcon v-if="settings.room_type.mute_on_start_enforced"/>
              {{$t('rooms.settings.video_conference.microphone')}}
            </label>

            <div class="flex align-items-center gap-2">
              <InputSwitch
                v-model="settings.mute_on_start"
                :disabled="disabled || settings.room_type.mute_on_start_enforced"
                :invalid="formErrors.fieldInvalid('mute_on_start')"
                class="flex-shrink-0"
                input-id="mute-on-start"
              />
              <label for="mute-on-start">{{ $t('rooms.settings.video_conference.mute_on_start') }}</label>
            </div>
            <p class="p-error" v-html="formErrors.fieldError('mute_on_start')"/>
          </div>

          <!-- Radio usage of the waiting room/guest lobby -->
          <div class="col-12 md:col-3">
            <fieldset class="flex flex-column gap-2">
              <legend class="flex align-items-center gap-2">
                <RoomSettingEnforcedIcon v-if="settings.room_type.lobby_enforced"/>
                {{ $t('rooms.settings.video_conference.lobby.title') }}
              </legend>

              <div class="flex align-items-center gap-2">
                <RadioButton
                  v-model.number="settings.lobby"
                  :disabled="disabled || settings.room_type.lobby_enforced"
                  :value="0"
                  name="lobby"
                  input-id="lobby-disabled"
                />
                <label for="lobby-disabled">{{ $t('app.disabled') }}</label>
              </div>
              <div class="flex align-items-center gap-2">
                <RadioButton
                  v-model.number="settings.lobby"
                  :disabled="disabled || settings.room_type.lobby_enforced"
                  :value="1"
                  input-id="lobby-enabled"
                  name="lobby"
                />
                <label for="lobby-enabled">{{ $t('app.enabled') }}</label>
              </div>
              <div class="flex align-items-center gap-2">
                <RadioButton
                  v-model.number="settings.lobby"
                  :disabled="disabled || settings.room_type.lobby_enforced"
                  :value="2"
                  input-id="lobby-only-for-guests"
                  name="lobby"
                />
                <label for="lobby-only-for-guests">{{ $t('rooms.settings.video_conference.lobby.only_for_guests_enabled') }}</label>
              </div>
              <p class="p-error" v-html="formErrors.fieldError('lobby')"/>
            </fieldset>

            <!-- Alert shown when default role is moderator and waiting room is active -->
            <InlineNote
              v-if="showLobbyAlert"
              severity="warn"
            >
              {{ $t('rooms.settings.video_conference.lobby.alert') }}
            </InlineNote>
          </div>

          <!-- Checkbox record attendance of users and guests -->
          <div class="col-12 md:col-3 flex flex-column gap-2">
            <label for="record-attendance" class="flex align-items-center gap-2">
              <RoomSettingEnforcedIcon v-if="settings.room_type.record_attendance_enforced"/>
              {{$t('rooms.settings.video_conference.attendance')}}
            </label>

            <div class="flex align-items-center gap-2">
              <InputSwitch
                v-model="settings.record_attendance"
                :disabled="disabled || settings.room_type.record_attendance_enforced"
                :invalid="formErrors.fieldInvalid('record_attendance')"
                class="flex-shrink-0"
                input-id="record-attendance"
              />
              <label for="record-attendance">{{ $t('rooms.settings.video_conference.record_attendance') }}</label>
            </div>
            <p class="p-error" v-html="formErrors.fieldError('record_attendance')"/>
          </div>

          <!-- Welcome message -->
          <div class="col-12 flex flex-column">
            <label for="welcome-message" class="mb-2">{{ $t('rooms.settings.video_conference.welcome_message') }}</label>
            <Textarea
              class="w-full"
              id="welcome-message"
              v-model="settings.welcome"
              :disabled="disabled"
              :invalid="formErrors.fieldInvalid('welcome')"
              :placeholder="$t('rooms.settings.none_placeholder')"
              rows="3"
            />
            <small>
              {{ $t('rooms.settings.general.chars', {chars: charactersLeftWelcomeMessage}) }}
            </small>
            <p class="p-error" v-html="formErrors.fieldError('welcome')"/>
          </div>

          <Divider/>

          <!-- Restriction settings -->
          <div class="col-12">
            <h4 class="text-lg font-semibold text-color m-0">{{ $t('rooms.settings.restrictions.title') }}</h4>
          </div>

          <!-- Disable the ability to use the webcam for non moderator-uses, can be changed during the meeting -->
          <div class="col-12 md:col-3">
            <div class="flex align-items-center gap-2 h-full">
              <InputSwitch
                v-model="settings.lock_settings_disable_cam"
                :disabled="disabled ||settings.room_type.lock_settings_disable_cam_enforced"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_cam')"
                class="flex-shrink-0"
                input-id="disable-cam"
              />
              <label for="disable-cam" class="flex align-items-center gap-2">
                <RoomSettingEnforcedIcon v-if="settings.room_type.lock_settings_disable_cam_enforced"/>
                {{ $t('rooms.settings.restrictions.lock_settings_disable_cam') }}
              </label>
            </div>
            <p class="p-error" v-html="formErrors.fieldError('lock_settings_disable_cam')"/>
          </div>

          <!--
          Disable the ability to see the webcam of non moderator-uses, moderators can see all webcams,
          can be changed during the meeting
          -->
          <div class="col-12 md:col-3">
            <div class="flex align-items-center gap-2 h-full">
              <InputSwitch
                v-model="settings.webcams_only_for_moderator"
                :disabled="disabled || settings.room_type.webcams_only_for_moderator_enforced"
                :invalid="formErrors.fieldInvalid('webcams_only_for_moderator')"
                class="flex-shrink-0"
                input-id="webcams-only-for-moderator"
              />
              <label for="webcams-only-for-moderator" class="flex align-items-center gap-2">
                <RoomSettingEnforcedIcon v-if="settings.room_type.webcams_only_for_moderator_enforced"/>
                {{ $t('rooms.settings.restrictions.webcams_only_for_moderator') }}
              </label>
            </div>
            <p class="p-error" v-html="formErrors.fieldError('webcams_only_for_moderator')"/>
          </div>

          <!-- Disable the ability to use the microphone for non moderator-uses, can be changed during the meeting -->
          <div class="col-12 md:col-3">
            <div class="flex align-items-center gap-2 h-full">
              <InputSwitch
                v-model="settings.lock_settings_disable_mic"
                :disabled="disabled || settings.room_type.lock_settings_disable_mic_enforced"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_mic')"
                class="flex-shrink-0"
                input-id="disable-mic"
              />
              <label for="disable-mic" class="flex align-items-center gap-2">
                <RoomSettingEnforcedIcon v-if="settings.room_type.lock_settings_disable_mic_enforced"/>
                {{ $t('rooms.settings.restrictions.lock_settings_disable_mic') }}
              </label>
            </div>
            <p class="p-error" v-html="formErrors.fieldError('lock_settings_disable_mic')"/>
          </div>

          <!-- Disable the ability to send messages via the public chat for non moderator-uses, can be changed during the meeting -->
          <div class="col-12 md:col-3">
            <div class="flex align-items-center gap-2 h-full">
              <InputSwitch
                v-model="settings.lock_settings_disable_public_chat"
                :disabled="disabled || settings.room_type.lock_settings_disable_public_chat_enforced"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_public_chat')"
                class="flex-shrink-0"
                input-id="disable-public-chat"
              />
              <label for="disable-public-chat" class="flex align-items-center gap-2">
                <RoomSettingEnforcedIcon v-if="settings.room_type.lock_settings_disable_public_chat_enforced"/>
                {{ $t('rooms.settings.restrictions.lock_settings_disable_public_chat') }}
              </label>
            </div>
            <p class="p-error" v-html="formErrors.fieldError('lock_settings_disable_public_chat')"/>
          </div>

          <!--
          Disable the ability to send messages via the private chat for non moderator-uses,
          private chats with the moderators is still possible
          can be changed during the meeting
          -->
          <div class="col-12 md:col-3">
            <div class="flex align-items-center gap-2 h-full">
              <InputSwitch
                v-model="settings.lock_settings_disable_private_chat"
                :disabled="disabled || settings.room_type.lock_settings_disable_private_chat_enforced"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_private_chat')"
                class="flex-shrink-0"
                input-id="disable-private-chat"
              />
              <label for="disable-private-chat" class="flex align-items-center gap-2">
                <RoomSettingEnforcedIcon v-if="settings.room_type.lock_settings_disable_private_chat_enforced"/>
                {{ $t('rooms.settings.restrictions.lock_settings_disable_private_chat') }}
              </label>
            </div>
            <p class="p-error" v-html="formErrors.fieldError('lock_settings_disable_private_chat')"/>
          </div>

          <!-- Disable the ability to edit the notes for non moderator-uses, can be changed during the meeting -->
          <div class="col-12 md:col-3">
            <div class="flex align-items-center gap-2 h-full">
              <InputSwitch
                v-model="settings.lock_settings_disable_note"
                :disabled="disabled || settings.room_type.lock_settings_disable_note_enforced"
                :invalid="formErrors.fieldInvalid('lock_settings_disable_note')"
                class="flex-shrink-0"
                input-id="disable-note"
              />
              <label for="disable-note" class="flex align-items-center gap-2">
                <RoomSettingEnforcedIcon v-if="settings.room_type.lock_settings_disable_note_enforced"/>
                {{ $t('rooms.settings.restrictions.lock_settings_disable_note') }}
              </label>
            </div>
            <p class="p-error" v-html="formErrors.fieldError('lock_settings_disable_note')"/>
          </div>

          <!-- Disable the ability to see a list of all participants for non moderator-uses, can be changed during the meeting -->
          <div class="col-12 md:col-3">
            <div class="flex align-items-center gap-2 h-full">
              <InputSwitch
                v-model="settings.lock_settings_hide_user_list"
                :disabled="disabled || settings.room_type.lock_settings_hide_user_list_enforced"
                :invalid="formErrors.fieldInvalid('lock_settings_hide_user_list')"
                class="flex-shrink-0"
                input-id="hide-user-list"
              />
              <label for="hide-user-list" class="flex align-items-center gap-2">
                <RoomSettingEnforcedIcon v-if="settings.room_type.lock_settings_hide_user_list_enforced"/>
                {{ $t('rooms.settings.restrictions.lock_settings_hide_user_list') }}
              </label>
            </div>
            <p class="p-error" v-html="formErrors.fieldError('lock_settings_hide_user_list')"/>
          </div>

          <Divider/>

          <!-- Participants settings -->
          <div class="col-12">
            <h4 class="text-lg font-semibold text-color m-0">{{ $t('rooms.settings.participants.title') }}</h4>
          </div>

          <!-- Checkbox allow users to become room members -->
          <div class="col-12 md:col-3">
            <div class="flex align-items-center gap-2">
              <InputSwitch
                v-model="settings.allow_membership"
                :disabled="disabled ||settings.room_type.allow_membership_enforced"
                :invalid="formErrors.fieldInvalid('allow_membership')"
                class="flex-shrink-0"
                input-id="allow-membership"
              />
              <label for="allow-membership" class="flex align-items-center gap-2">
                <RoomSettingEnforcedIcon v-if="settings.room_type.allow_membership_enforced"/>
                {{ $t('rooms.settings.participants.allow_membership') }}
              </label>
            </div>
            <p class="p-error" v-html="formErrors.fieldError('allow_membership')"/>
          </div>

          <!-- Default user role for logged in users only -->
          <div class="col-12 md:col-3 flex flex-column">
            <label id="default-role-label" class="flex align-items-center gap-2">
              <RoomSettingEnforcedIcon v-if="settings.room_type.default_role_enforced"/>
              {{ $t('rooms.settings.participants.default_role.title') }}
            </label>
            <small>
              {{ $t('rooms.settings.participants.default_role.only_logged_in') }}
            </small>

            <div class="flex">
              <SelectButton
                v-model="settings.default_role"
                :allowEmpty="false"
                :disabled="disabled || settings.room_type.default_role_enforced"
                :invalid="formErrors.fieldInvalid('default_role')"
                :options="[
                  { role: 1, label: $t('rooms.roles.participant')},
                  { role: 2, label: $t('rooms.roles.moderator')}
                ]"
                class="flex-shrink-0"
                dataKey="role"
                aria-labelledby="" y="default-role-label"
                optionLabel="label"
                optionValue="role"
              />
            </div>
            <p class="p-error" v-html="formErrors.fieldError('default_role')"/>
          </div>
          <Divider/>

          <!-- Advanced settings -->
          <div class="col-12">
            <h4 class="text-lg font-semibold text-color m-0">{{ $t('rooms.settings.advanced.title')}}</h4>
          </div>

          <!-- Room visibility setting -->
          <div class="col-12 md:col-3 flex flex-column gap-2">
            <label id="visibility-label" class="flex align-items-center gap-2">
              <RoomSettingEnforcedIcon v-if="settings.room_type.visibility_enforced"/>
              {{ $t('rooms.settings.advanced.visibility.title') }}
            </label>

            <div class="flex">
              <SelectButton
                v-model="settings.room_type.visibility_default"
                :allowEmpty="false"
                :disabled="disabled || settings.room_type.visibility_enforced"
                :invalid="formErrors.fieldInvalid('visibility_default')"
                :options="[
                  { visibility: 0, label:  $t('rooms.settings.advanced.visibility.private') },
                  { visibility: 1, label: $t('rooms.settings.advanced.visibility.public')}
                ]"
                class="flex-shrink-0"
                dataKey="visibility"
                aria-labelledby="visibility-label"
                optionLabel="label"
                optionValue="visibility"
              />
            </div>
            <p class="p-error" v-html="formErrors.fieldError('visibility')"/>
          </div>
        </div>

      </OverlayComponent>
      <Divider/>
      <div class="flex flex-wrap flex-column-reverse md:flex-row md:justify-content-between gap-2 align-items-start ">
        <div class="flex flex-shrink-0 flex-column md:flex-row align-items-start gap-2">
          <RoomDeleteButton
            :disabled="disabled"
            :room="room"
            @room-deleted="$router.push({ name: 'rooms.index' })"
          />
          <RoomTransferOwnershipButton
            :disabled="disabled"
            :room="room"
            @transferredOwnership="emit('settingsChanged');"
          />
          <RoomTabSettingsExpertModeButton
            :disabled="disabled"
            :expert-mode="settings.expert_mode"
            @toggle-expert-mode="toggleExpertMode"
          />
        </div>
        <div class="flex">
          <Button
            :disabled="disabled"
            :label="$t('app.save')"
            :loading="isBusy"
            icon="fa-solid fa-save"
            severity="success"
            type="submit"
          />
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import env from '../env.js';
import _ from 'lodash';
import { useSettingsStore } from '../stores/settings';
import { useApi } from '../composables/useApi.js';
import { useFormErrors } from '../composables/useFormErrors.js';
import { onMounted, ref, computed, watch } from 'vue';
import { useUserPermissions } from '../composables/useUserPermission.js';
import { ROOM_SETTINGS_DEFINITION } from '../constants/roomSettings.js';
import RoomSettingEnforcedIcon from './RoomSettingEnforcedIcon.vue';

const props = defineProps({
  room: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['settingsChanged']);

const settings = ref({
  expert_mode: false,
  room_type: {}
});
const isBusy = ref(false);
const loadingError = ref(false);

const api = useApi();
const formErrors = useFormErrors();
const settingsStore = useSettingsStore();
const userPermissions = useUserPermissions();

/**
 * Save room settings
 *
 *  @param event
 */
function save (event) {
  // Prevent default form submit
  event.preventDefault();

  // Set busy indicator
  isBusy.value = true;

  const newSettings = _.clone(settings.value);
  newSettings.room_type = newSettings.room_type ? newSettings.room_type.id : null;

  formErrors.clear();

  // Send new settings to the server
  api.call('rooms/' + props.room.id, {
    method: 'put',
    data: newSettings
  }).then(response => {
    // Settings successfully saved
    // update the settings to the response from the server, feedback the changed were applied correctly
    settings.value = response.data.data;
    // inform parent component about changed settings
    emit('settingsChanged');
  }).catch((error) => {
    // Settings couldn't be saved
    if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
      formErrors.set(error.response.data.errors);
      return;
    }
    api.error(error);
  }).finally(() => {
    // Disable busy indicator
    isBusy.value = false;
  });
}

/**
 * Load the room settings
 */
function load () {
  // Set busy indicator
  isBusy.value = true;
  loadingError.value = false;

  // Load all room settings
  api.call('rooms/' + props.room.id + '/settings')
    .then(response => {
      // fetch successful
      settings.value = response.data.data;
    }).catch((error) => {
      api.error(error);
      loadingError.value = true;
    }).finally(() => {
      //Disable busy indicator
      isBusy.value = false;
    });
}

/**
 * Create a new access code for the room
 */
function createAccessCode () {
  settings.value.access_code = (Math.floor(Math.random() * (999999999 - 111111112)) + 111111111);
}

/**
 * Toggle the expert mode for this room and reset expert settings when opening expert mode
 */
function toggleExpertMode () {
  settings.value.expert_mode = !settings.value.expert_mode;

  if (settings.value.expert_mode) {
    resetExpertSettings();
  }
}

/**
 * Reset the room settings to the values defined in the room type
 * @param resetToDefaults indicates if the settings should be reset to the default values of the room type
 */
function resetToRoomTypeSettings (resetToDefaults = false) {
  // Reset the value of the access code setting
  if (resetToDefaults || settings.value.room_type.has_access_code_enforced) {
    // Create new access code if the room should have an access code but does not have one
    if (settings.value.room_type.has_access_code_default && settings.value.access_code === null) {
      createAccessCode();
    }
    // Delete access code if the room should not have an access code but has one
    else if (!settings.value.room_type.has_access_code_default) {
      settings.value.access_code = null;
    }
  }
  // Reset the value of all other settings
  for (const setting in ROOM_SETTINGS_DEFINITION) {
    resetSetting(setting, resetToDefaults);
  }
}

/**
 *  Reset all expert settings back to the default values defined in the room type.
 *  Clear the settings that don't have a default setting in the room type.
 */
function resetExpertSettings () {
  // Reset settings that have a default setting in the room type
  for (const setting in ROOM_SETTINGS_DEFINITION) {
    if (ROOM_SETTINGS_DEFINITION[setting].expert_setting) {
      resetSetting(setting);
    }
  }
  // Reset settings that don't gave a default setting in the room type
  settings.value.welcome = '';
}

/**
 * Reset the value of a single setting
 * (must exist in the room and have an enforced and default setting in the room type)
 * @param settingName setting name of the setting that should be reset
 * @param resetToDefaults indicates if setting should be reset to the default value of the room type
 */
function resetSetting (settingName, resetToDefaults = true) {
  // Reset value of the setting in the room back to the default setting of the room type
  // if the setting is enforced or resetToDefaults is true
  if (resetToDefaults || settings.value.room_type[settingName + '_enforced']) {
    settings.value[settingName] = settings.value.room_type[settingName + '_default'];
  }
}

/**
 * Input fields are disabled: due to limited permissions, loading of settings or errors
 */
const disabled = computed(() => {
  return !userPermissions.can('manageSettings', props.room) || isBusy.value || loadingError.value;
});

/**
 * Count the chars of the welcome message
 * @returns {string} amount of chars in comparison to the limit
 */
const charactersLeftWelcomeMessage = computed(() => {
  const char = settings.value.welcome
    ? settings.value.welcome.length
    : 0;
  return char + ' / ' + settingsStore.getSetting('bbb.welcome_message_limit');
});

/**
 * Count the chars of the short description
 * @returns {string} amount of chars in comparison to the limit
 */
const charactersLeftShortDescription = computed(() => {
  const char = settings.value.short_description
    ? settings.value.short_description.length
    : 0;
  return char + ' / ' + 300;
});

/**
 * Show alert if simultaneously default role is moderator and waiting room is active
 */
const showLobbyAlert = computed(() => {
  return settings.value.default_role === 2 && settings.value.lobby === 1;
});

function applyRoomRestrictions (roomType) {
  if (!roomType) { return; }

  if ((roomType.has_access_code_default && roomType.has_access_code_enforced) && !settings.value.access_code) {
    createAccessCode();
  }
}

watch(settings, () => {
  if (!settings.value) { return; }

  applyRoomRestrictions(settings.value.room_type);
}, { deep: true });

onMounted(() => {
  // Load all room settings
  load();
});
</script>
