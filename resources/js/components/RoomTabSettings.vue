<template>
  <div>
    <form
        :aria-hidden="loadingError"
        @submit="save"
      >
      <OverlayComponent :show="isBusy || loadingError ">
        <template #overlay>
          <LoadingRetryButton :error="loadingError" @reload="load" />
        </template>
        <div class="grid">
          <!-- General settings tab -->
          <div class="col-12 md:col-6 lg:col-3 flex flex-column gap-2">
            <p class="text-lg font-semibold text-color m-0">{{ $t('rooms.settings.general.title') }}</p>
            <div class="flex flex-column gap-2">
              <label for="room-type">{{ $t('rooms.settings.general.type') }}</label>
              <RoomTypeChangeButton
                v-model="settings.room_type"
                :disabled="disabled"
                :room-id="room.id"
                :invalid="formErrors.fieldInvalid('room_type')"
                @loading-error="(value) => roomTypeSelectLoadingError = value"
                @busy="(value) => roomTypeSelectBusy = value"
              />
              <p class="p-error" v-html="formErrors.fieldError('room_type')" />
            </div>

            <!-- Room name -->
            <div class="flex flex-column gap-2">
              <label for="room-name">{{ $t('rooms.name') }}</label>
              <InputText
                id="room-name"
                v-model="settings.name"
                :disabled="disabled"
                :invalid="formErrors.fieldInvalid('name')"
              />
              <p class="p-error" v-html="formErrors.fieldError('name')" />
            </div>

            <!-- Welcome message -->
            <div class="flex flex-column gap-2">
              <label for="welcome-message">{{ $t('rooms.settings.general.welcome_message') }}</label>
              <Textarea
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
              <p class="p-error" v-html="formErrors.fieldError('welcome')" />
            </div>

            <!-- Short description-->
            <div class="flex flex-column gap-2">
              <label for="short-description">{{ $t('rooms.settings.general.short_description') }}</label>
              <Textarea
                id="short-description"
                v-model="settings.short_description"
                :disabled="disabled"
                :placeholder="$t('rooms.settings.none_placeholder')"
                rows="3"
                :invalid="formErrors.fieldInvalid('short_description')"
              />
              <small>
                {{ $t('rooms.settings.general.chars', {chars: charactersLeftShortDescription}) }}
              </small>
              <p class="p-error" v-html="formErrors.fieldError('short_description')" />
            </div>
          </div>

          <!-- Security settings tab -->
          <div class="col-12 md:col-6 lg:col-3 flex flex-column gap-2">
            <p class="text-lg font-semibold text-color m-0">{{ $t('app.security') }}</p>
            <!-- Access code -->
            <div class="flex flex-column gap-2">
              <label for="access-code">{{ $t('rooms.access_code') }}</label>
              <InputGroup>
                <!-- Generate random access code -->
                <Button
                  v-tooltip="$t('rooms.settings.security.generate_access_code')"
                  :disabled="disabled"
                  @click="createAccessCode"
                  icon="fa-solid fa-dice"
                />
                <InputText
                  id="access-code"
                  v-model.number="settings.access_code"
                  :placeholder="$t('rooms.settings.security.unprotected_placeholder')"
                  readonly="readonly"
                  :disabled="disabled"
                  :invalid="formErrors.fieldInvalid('access_code')"
                  type="number"
                  />
                <!-- Clear access code -->
                <Button
                  v-if="settings.room_type && !settings.room_type.require_access_code"
                  v-tooltip="$t('rooms.settings.security.delete_access_code')"
                  :disabled="disabled"
                  @click="settings.access_code = null"
                  icon="fa-solid fa-trash"
                />
              </InputGroup>
              <small>
                {{ $t('rooms.settings.security.access_code_note') }}
              </small>
              <p class="p-error" v-html="formErrors.fieldError('access_code')" />
            </div>

            <!-- Checkbox allow guests to access the room -->
            <div class="flex flex-column gap-2">
              <div class="flex align-items-center gap-2">
                <InputSwitch
                  input-id="allow-guests"
                  v-model="settings.allow_guests"
                  :disabled="disabled"
                  class="flex-shrink-0"
                  :invalid="formErrors.fieldInvalid('allow_guests')"
                />
                <label for="allow-guests">{{ $t('rooms.settings.security.allow_guests') }}</label>
              </div>
              <p class="p-error" v-html="formErrors.fieldError('allow_guests')" />
            </div>

            <!-- Checkbox allow users to become room members -->
            <div class="flex flex-column gap-2">
              <div class="flex align-items-center gap-2">
                <InputSwitch
                  input-id="allow-membership"
                  v-model="settings.allow_membership"
                  :disabled="disabled"
                  class="flex-shrink-0"
                  :invalid="formErrors.fieldInvalid('allow_membership')"
                />
                <label for="allow-membership">{{ $t('rooms.settings.security.allow_new_members') }}</label>
              </div>
              <p class="p-error" v-html="formErrors.fieldError('allow_membership')" />
            </div>

            <!-- Checkbox publicly list this room -->
            <div class="flex flex-column gap-2">
              <div class="flex align-items-center gap-2">
                <InputSwitch
                  input-id="listed"
                  v-model="settings.listed"
                  :disabled="disabled || (settings.room_type && !settings.room_type.allow_listing && settings.access_code)"
                  class="flex-shrink-0"
                  :invalid="formErrors.fieldInvalid('listed')"
                />
                <label for="listed">{{ $t('rooms.settings.security.listed') }}</label>
              </div>
              <p class="p-error" v-html="formErrors.fieldError('listed')" />
            </div>

            <Divider class="my-0"/>
            <p class="text-lg font-semibold m-0">{{ $t('rooms.settings.recordings.title') }}</p>

            <!-- Checkbox record attendance of users and guests -->
            <div class="flex flex-column gap-2">
              <div class="flex align-items-center gap-2">
                <InputSwitch
                  input-id="record-attendance"
                  v-model="settings.record_attendance"
                  :disabled="disabled || !settingsStore.getSetting('attendance.enabled')"
                  class="flex-shrink-0"
                  :invalid="formErrors.fieldInvalid('default_role')"
                />
                <label for="record-attendance">{{ $t('rooms.settings.recordings.record_attendance') }}</label>
              </div>
              <p class="p-error" v-html="formErrors.fieldError('record_attendance')" />
            </div>

            <!-- Checkbox record video conference -->
            <div class="flex flex-column gap-2">
              <div class="flex align-items-center gap-2">
                <InputSwitch
                  input-id="record-video-conference"
                  v-model="settings.record"
                  :disabled="disabled"
                  class="flex-shrink-0"
                  :invalid="formErrors.fieldInvalid('record')"
                />
                <label for="video-conference">{{ $t('rooms.settings.recordings.record_video_conference') }}</label>
              </div>
              <p class="p-error" v-html="formErrors.fieldError('record')" />
            </div>

          </div>

          <!-- Participants settings tab -->
          <div class="col-12 md:col-6 lg:col-3 flex flex-column gap-2">
            <p class="text-lg font-semibold text-color m-0">{{ $t('rooms.settings.participants.title') }}</p>

            <!-- Radio default user role for logged in users only -->
            <div class="flex flex-column gap-2">
              <label for="default-role">{{ $t('rooms.settings.participants.default_role.title') }}</label>
              <small>
                {{ $t('rooms.settings.participants.default_role.only_logged_in') }}
              </small>
              <SelectButton
                input-id="default-role"
                v-model="settings.default_role"
                optionLabel="label"
                dataKey="role"
                optionValue="role"
                :allowEmpty="false"
                :options="[
                  { role: 1, label: $t('rooms.roles.participant')},
                  { role: 2, label: $t('rooms.roles.moderator')}
                ]"
                :disabled="disabled"
                class="flex-shrink-0"
                :invalid="formErrors.fieldInvalid('default_role')"
              />

              <p class="p-error" v-html="formErrors.fieldError('default_role')" />
            </div>

            <!-- Radio usage of the waiting room/guest lobby -->
            <div class="flex flex-column gap-2">
              <label>{{ $t('rooms.settings.participants.waiting_room.title') }}</label>
              <div class="flex align-items-center gap-2">
                <RadioButton
                  v-model.number="settings.lobby"
                  :disabled="disabled"
                  name="lobby"
                  :value="0"
                />
                <label>{{ $t('app.disabled') }}</label>
              </div>
              <div class="flex align-items-center gap-2">
                <RadioButton
                  v-model.number="settings.lobby"
                  :disabled="disabled"
                  name="lobby"
                  :value="1"
                />
                <label>{{ $t('app.enabled') }}</label>
              </div>
              <div class="flex align-items-center gap-2">
                <RadioButton
                  v-model.number="settings.lobby"
                  :disabled="disabled"
                  name="lobby"
                  :value="2"
                />
                <label>{{ $t('rooms.settings.participants.waiting_room.only_for_guests_enabled') }}</label>
              </div>
              <p class="p-error" v-html="formErrors.fieldError('lobby')" />
            </div>

            <!-- Alert shown when default role is moderator and waiting room is active -->
            <InlineMessage
              v-if="showLobbyAlert"
              severity="warn"
            >
              {{ $t('rooms.settings.participants.waiting_room_alert') }}
            </InlineMessage>
          </div>

          <!-- Permissions & Restrictions tab -->
          <div class="col-12 md:col-6 lg:col-3 flex flex-column gap-2">
            <p class="text-lg font-semibold text-color m-0">{{ $t('rooms.settings.permissions.title') }}</p>
            <!-- Everyone can start a new meeting, not only the moderator -->
            <div class="flex flex-column gap-2">
              <div class="flex align-items-center gap-2">
                <InputSwitch
                  input-id="everyone-can-start"
                  v-model="settings.everyone_can_start"
                  :disabled="disabled"
                  class="flex-shrink-0"
                  :invalid="formErrors.fieldInvalid('everyone_can_start')"
                />
                <label for="everyone-can-start">{{ $t('rooms.settings.permissions.everyone_start') }}</label>
              </div>
              <p class="p-error" v-html="formErrors.fieldError('everyone_can_start')" />
            </div>

            <!-- Mute everyone's microphone on meeting join -->
            <div class="flex flex-column gap-2">
              <div class="flex align-items-center gap-2">
                <InputSwitch
                  input-id="mute-on-start"
                  v-model="settings.mute_on_start"
                  :disabled="disabled"
                  class="flex-shrink-0"
                  :invalid="formErrors.fieldInvalid('mute_on_start')"
                />
                <label for="mute-on-start">{{ $t('rooms.settings.permissions.mute_mic') }}</label>
              </div>
              <p class="p-error" v-html="formErrors.fieldError('mute_on_start')" />
            </div>
            <Divider class="my-0"/>
            <p class="text-lg font-semibold text-color m-0">{{ $t('rooms.settings.restrictions.title') }}</p>

            <!-- Disable the ability to use the webcam for non moderator-uses, can be changed during the meeting -->
            <div class="flex flex-column gap-2">
              <div class="flex align-items-center gap-2">
                <InputSwitch
                  input-id="mute-on-start"
                  v-model="settings.lock_settings_disable_cam"
                  :disabled="disabled"
                  class="flex-shrink-0"
                  :invalid="formErrors.fieldInvalid('lock_settings_disable_cam')"
                />
                <label for="mute-on-start">{{ $t('rooms.settings.restrictions.disable_cam') }}</label>
              </div>
              <p class="p-error" v-html="formErrors.fieldError('lock_settings_disable_cam')" />
            </div>

            <!--
            Disable the ability to see the webcam of non moderator-uses,
            moderators can see all webcams,
            can be changed during the meeting
            -->
            <div class="flex flex-column gap-2">
              <div class="flex align-items-center gap-2">
                <InputSwitch
                  input-id="webcams-only-for-moderator"
                  v-model="settings.webcams_only_for_moderator"
                  :disabled="disabled"
                  class="flex-shrink-0"
                  :invalid="formErrors.fieldInvalid('webcams_only_for_moderator')"
                />
                <label for="webcams-only-for-moderator">{{ $t('rooms.settings.restrictions.only_mod_see_cam') }}</label>
              </div>
              <p class="p-error" v-html="formErrors.fieldError('webcams_only_for_moderator')" />
            </div>
            <!-- Disable the ability to use the microphone for non moderator-uses, can be changed during the meeting -->
            <div class="flex flex-column gap-2">
              <div class="flex align-items-center gap-2">
                <InputSwitch
                  input-id="disable-mic"
                  v-model="settings.lock_settings_disable_mic"
                  :disabled="disabled"
                  class="flex-shrink-0"
                  :invalid="formErrors.fieldInvalid('lock_settings_disable_mic')"
                />
                <label for="disable-mic">{{ $t('rooms.settings.restrictions.disable_mic') }}</label>
              </div>
              <p class="p-error" v-html="formErrors.fieldError('lock_settings_disable_mic')" />
            </div>

            <!-- Disable the ability to send messages via the public chat for non moderator-uses, can be changed during the meeting -->
            <div class="flex flex-column gap-2">
              <div class="flex align-items-center gap-2">
                <InputSwitch
                  input-id="disable-public-chat"
                  v-model="settings.lock_settings_disable_public_chat"
                  :disabled="disabled"
                  class="flex-shrink-0"
                  :invalid="formErrors.fieldInvalid('lock_settings_disable_public_chat')"
                />
                <label for="disable-public-chat">{{ $t('rooms.settings.restrictions.disable_public_chat') }}</label>
              </div>
              <p class="p-error" v-html="formErrors.fieldError('lock_settings_disable_public_chat')" />
            </div>

            <!--
            Disable the ability to send messages via the private chat for non moderator-uses,
            private chats with the moderators is still possible
            can be changed during the meeting
            -->
            <div class="flex flex-column gap-2">
              <div class="flex align-items-center gap-2">
                <InputSwitch
                  input-id="disable-private-chat"
                  v-model="settings.lock_settings_disable_private_chat"
                  :disabled="disabled"
                  class="flex-shrink-0"
                  :invalid="formErrors.fieldInvalid('lock_settings_disable_private_chat')"
                />
                <label for="disable-private-chat">{{ $t('rooms.settings.restrictions.disable_private_chat') }}</label>
              </div>
              <p class="p-error" v-html="formErrors.fieldError('lock_settings_disable_private_chat')" />
            </div>

            <!-- Disable the ability to edit the notes for non moderator-uses, can be changed during the meeting -->
            <div class="flex flex-column gap-2">
              <div class="flex align-items-center gap-2">
                <InputSwitch
                  input-id="disable-note-edit"
                  v-model="settings.lock_settings_disable_note"
                  :disabled="disabled"
                  class="flex-shrink-0"
                  :invalid="formErrors.fieldInvalid('lock_settings_disable_note')"
                />
                <label for="disable-note-edit">{{ $t('rooms.settings.restrictions.disable_note_edit') }}</label>
              </div>
              <p class="p-error" v-html="formErrors.fieldError('lock_settings_disable_note')" />
            </div>

            <!-- Disable the ability to see a list of all participants for non moderator-uses, can be changed during the meeting -->
            <div class="flex flex-column gap-2">
              <div class="flex align-items-center gap-2">
                <InputSwitch
                  input-id="disable-user-list"
                  v-model="settings.lock_settings_hide_user_list"
                  :disabled="disabled"
                  class="flex-shrink-0"
                  :invalid="formErrors.fieldInvalid('lock_settings_hide_user_list')"
                />
                <label for="disable-user-list">{{ $t('rooms.settings.restrictions.hide_participants_list') }}</label>
              </div>
              <p class="p-error" v-html="formErrors.fieldError('lock_settings_hide_user_list')" />
            </div>
          </div>
        </div>
      </OverlayComponent>
        <Divider/>
        <div class="flex flex-column-reverse md:flex-row md:justify-content-between gap-2 align-items-start ">
          <div class="flex flex-shrink-0 flex-column md:flex-row align-items-start gap-2">
            <RoomDeleteButton
              :room="room"
              :disabled="disabled"
              @room-deleted="$router.push({ name: 'rooms.index' })"
            />
            <RoomTransferOwnershipButton
              :room="room"
              :disabled="disabled"
              @transferredOwnership="emit('settingsChanged');"
            />
          </div>
          <div class="flex">
            <Button
              :disabled="disabled || roomTypeSelectBusy || roomTypeSelectLoadingError"
              severity="success"
              type="submit"
              icon="fa-solid fa-save"
              :label="$t('app.save')"
              :loading="isBusy"
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

const props = defineProps({
  room: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['settingsChanged']);

const settings = ref({});
const isBusy = ref(false);
const loadingError = ref(false);
const roomTypeSelectBusy = ref(false);
const roomTypeSelectLoadingError = ref(false);

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

  // Set saving indicator
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
    // Disable saving indicator
    isBusy.value = false;
  });
}

function load () {
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
      isBusy.value = false;
    });
}

function createAccessCode () {
  settings.value.access_code = (Math.floor(Math.random() * (999999999 - 111111112)) + 111111111);
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

watch(settings, () => {
  if (!settings.value) { return; }

  if (settings.value.room_type && !settings.value.room_type.allow_listing && settings.value.access_code) {
    settings.value.listed = false;
  }

  if (settings.value.room_type && settings.value.room_type.require_access_code && !settings.value.access_code) {
    createAccessCode();
  }
}, { deep: true });

onMounted(() => {
  // Load all room settings
  load();
});
</script>
