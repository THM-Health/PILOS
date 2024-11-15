<template>
  <div>
    <form :aria-hidden="loadingError" @submit="save">
      <OverlayComponent :show="isBusy || loadingError">
        <template #overlay>
          <LoadingRetryButton :error="loadingError" @reload="load" />
        </template>

        <div class="grid grid-cols-12 gap-4">
          <!-- General settings (always shown) -->
          <div class="col-span-12">
            <h4 class="m-0 text-lg font-semibold">
              {{ $t("rooms.settings.general.title") }}
            </h4>
          </div>

          <!-- Room type setting -->
          <div
            class="col-span-12 flex flex-col md:col-span-6 xl:col-span-3"
            data-test="room-type-setting"
          >
            <label for="room-type" class="mb-2">{{
              $t("rooms.settings.general.type")
            }}</label>

            <RoomTypeChangeButton
              v-model="settings.room_type"
              input-id="room-type"
              :disabled="disabled"
              :invalid="formErrors.fieldInvalid('room_type')"
              :current-settings="settings"
              @room-type-changed="
                (resetToDefaults) => resetToRoomTypeSettings(resetToDefaults)
              "
            />
            <FormError :errors="formErrors.fieldError('room_type')" />
          </div>

          <!-- Room name -->
          <div
            class="col-span-12 flex flex-col md:col-span-6 xl:col-span-3"
            data-test="room-name-setting"
          >
            <label for="room-name" class="mb-2">{{ $t("rooms.name") }}</label>
            <InputText
              id="room-name"
              v-model="settings.name"
              class="w-full"
              :disabled="disabled"
              :invalid="formErrors.fieldInvalid('name')"
            />
            <FormError :errors="formErrors.fieldError('name')" />
          </div>

          <!-- Access code -->
          <div
            class="col-span-12 flex flex-col gap-2 md:col-span-6 xl:col-span-3"
            data-test="access-code-setting"
          >
            <label for="access-code" class="flex items-center gap-2">
              <RoomSettingEnforcedIcon
                v-if="settings.room_type.has_access_code_enforced"
              />
              {{ $t("rooms.access_code") }}
            </label>

            <InputGroup>
              <!-- Generate random access code -->
              <Button
                v-if="!disabled"
                v-tooltip="$t('rooms.settings.general.generate_access_code')"
                data-test="generate-access-code-button"
                :aria-label="$t('rooms.settings.general.generate_access_code')"
                icon="fa-solid fa-dice"
                @click="createAccessCode"
              />
              <!-- Access code -->
              <InputText
                id="access-code"
                v-model.number="settings.access_code"
                :disabled="disabled"
                :invalid="formErrors.fieldInvalid('access_code')"
                :placeholder="
                  $t('rooms.settings.general.unprotected_placeholder')
                "
                readonly="readonly"
                type="number"
              />
              <!-- Clear access code -->
              <Button
                v-if="settings.access_code && !disabled"
                v-tooltip="$t('rooms.settings.general.delete_access_code')"
                :aria-label="$t('rooms.settings.general.delete_access_code')"
                icon="fa-solid fa-trash"
                data-test="clear-access-code-button"
                @click="settings.access_code = null"
              />
            </InputGroup>
            <small v-if="settings.room_type.has_access_code_enforced">
              {{
                settings.room_type.has_access_code_default
                  ? $t("rooms.settings.general.access_code_enforced")
                  : $t("rooms.settings.general.access_code_prohibited")
              }}
            </small>
            <FormError :errors="formErrors.fieldError('access_code')" />
          </div>

          <!-- Checkbox allow guests to access the room -->
          <div
            class="col-span-12 flex flex-col gap-2 md:col-span-6 xl:col-span-3"
            data-test="allow-guests-setting"
          >
            <label for="allow-guests" class="flex items-center gap-2">
              <RoomSettingEnforcedIcon
                v-if="settings.room_type.allow_guests_enforced"
              />
              {{ $t("rooms.settings.general.access_by_guests") }}
            </label>

            <div class="flex items-center gap-2">
              <ToggleSwitch
                v-model="settings.allow_guests"
                :disabled="disabled || settings.room_type.allow_guests_enforced"
                :invalid="formErrors.fieldInvalid('allow_guests')"
                class="shrink-0"
                input-id="allow-guests"
              />
              <label for="allow-guests">{{
                $t("rooms.settings.general.allow")
              }}</label>
            </div>
            <FormError :errors="formErrors.fieldError('allow_guests')" />
          </div>

          <!-- Short description-->
          <div
            class="col-span-12 flex flex-col gap-2"
            data-test="short-description-setting"
          >
            <label for="short-description">{{
              $t("rooms.settings.general.short_description")
            }}</label>

            <Textarea
              id="short-description"
              v-model="settings.short_description"
              class="w-full"
              :disabled="disabled"
              :invalid="formErrors.fieldInvalid('short_description')"
              :placeholder="$t('rooms.settings.none_placeholder')"
              rows="3"
            />
            <small>
              {{
                $t("rooms.settings.general.chars", {
                  chars: charactersLeftShortDescription,
                })
              }}
            </small>
            <FormError :errors="formErrors.fieldError('short_description')" />
          </div>
        </div>

        <!--
        Expert settings (only shown when expert mode is activated)
        When the expert mode is deactivated the default values from the room type will be used
        -->
        <div v-if="settings.expert_mode" class="grid grid-cols-12 gap-4">
          <Divider class="col-span-12" />

          <!-- Video conference settings -->
          <div class="col-span-12">
            <h4 class="m-0 text-lg font-semibold">
              {{ $t("rooms.settings.video_conference.title") }}
            </h4>
          </div>

          <!-- Everyone can start a new meeting, not only the moderator -->
          <div
            class="col-span-12 flex flex-col gap-2 md:col-span-6 xl:col-span-3"
            data-test="everyone-can-start-setting"
          >
            <label for="everyone-can-start" class="items-center gap-2">
              <RoomSettingEnforcedIcon
                v-if="settings.room_type.everyone_can_start_enforced"
              />
              {{ $t("rooms.settings.video_conference.allow_starting") }}
            </label>

            <div class="flex items-center gap-2">
              <ToggleSwitch
                v-model="settings.everyone_can_start"
                :disabled="
                  disabled || settings.room_type.everyone_can_start_enforced
                "
                :invalid="formErrors.fieldInvalid('everyone_can_start')"
                class="shrink-0"
                input-id="everyone-can-start"
              />
              <label for="everyone-can-start">{{
                $t("rooms.settings.general.allow_everyone")
              }}</label>
            </div>
            <FormError :errors="formErrors.fieldError('everyone_can_start')" />
          </div>

          <!-- Mute everyone's microphone on meeting join -->
          <div
            class="col-span-12 flex flex-col gap-2 md:col-span-6 xl:col-span-3"
            data-test="mute-on-start-setting"
          >
            <label for="mute-on-start" class="flex items-center gap-2">
              <RoomSettingEnforcedIcon
                v-if="settings.room_type.mute_on_start_enforced"
              />
              {{ $t("rooms.settings.video_conference.microphone") }}
            </label>

            <div class="flex items-center gap-2">
              <ToggleSwitch
                v-model="settings.mute_on_start"
                :disabled="
                  disabled || settings.room_type.mute_on_start_enforced
                "
                :invalid="formErrors.fieldInvalid('mute_on_start')"
                class="shrink-0"
                input-id="mute-on-start"
              />
              <label for="mute-on-start">{{
                $t("rooms.settings.video_conference.mute_on_start")
              }}</label>
            </div>
            <FormError :errors="formErrors.fieldError('mute_on_start')" />
          </div>

          <!-- Radio usage of the waiting room/guest lobby -->
          <div
            class="col-span-12 md:col-span-6 xl:col-span-3"
            data-test="lobby-setting"
          >
            <fieldset class="flex flex-col gap-2">
              <legend class="flex items-center gap-2">
                <RoomSettingEnforcedIcon
                  v-if="settings.room_type.lobby_enforced"
                />
                {{ $t("rooms.settings.video_conference.lobby.title") }}
              </legend>

              <div class="flex items-center gap-2">
                <RadioButton
                  v-model.number="settings.lobby"
                  :disabled="disabled || settings.room_type.lobby_enforced"
                  :value="0"
                  name="lobby"
                  input-id="lobby-disabled"
                />
                <label for="lobby-disabled">{{ $t("app.disabled") }}</label>
              </div>
              <div class="flex items-center gap-2">
                <RadioButton
                  v-model.number="settings.lobby"
                  :disabled="disabled || settings.room_type.lobby_enforced"
                  :value="1"
                  input-id="lobby-enabled"
                  name="lobby"
                />
                <label for="lobby-enabled">{{ $t("app.enabled") }}</label>
              </div>
              <div class="flex items-center gap-2">
                <RadioButton
                  v-model.number="settings.lobby"
                  :disabled="disabled || settings.room_type.lobby_enforced"
                  :value="2"
                  input-id="lobby-only-for-guests"
                  name="lobby"
                />
                <label for="lobby-only-for-guests">{{
                  $t(
                    "rooms.settings.video_conference.lobby.only_for_guests_enabled",
                  )
                }}</label>
              </div>
              <FormError :errors="formErrors.fieldError('lobby')" />
            </fieldset>

            <!-- Alert shown when default role is moderator and waiting room is active -->
            <InlineNote v-if="showLobbyAlert" severity="warn">
              {{ $t("rooms.settings.video_conference.lobby.alert") }}
            </InlineNote>
          </div>

          <!-- Welcome message -->
          <div class="col-span-12 flex flex-col" data-test="welcome-setting">
            <label for="welcome-message" class="mb-2">{{
              $t("rooms.settings.video_conference.welcome_message")
            }}</label>
            <Textarea
              id="welcome-message"
              v-model="settings.welcome"
              class="w-full"
              :disabled="disabled"
              :invalid="formErrors.fieldInvalid('welcome')"
              :placeholder="$t('rooms.settings.none_placeholder')"
              rows="3"
            />
            <small>
              {{
                $t("rooms.settings.general.chars", {
                  chars: charactersLeftWelcomeMessage,
                })
              }}
            </small>
            <FormError :errors="formErrors.fieldError('welcome')" />
          </div>

          <Divider class="col-span-12" />

          <!-- Recording settings -->
          <div class="col-span-12">
            <h4 class="m-0 text-lg font-semibold text-color">
              {{ $t("rooms.settings.recordings.title") }}
            </h4>
          </div>

          <!-- Checkbox record attendance of users and guests -->
          <div
            class="col-span-12 flex flex-col gap-2 md:col-span-6 xl:col-span-3"
            data-test="record-attendance-setting"
          >
            <div class="flex items-center gap-2">
              <ToggleSwitch
                v-model="settings.record_attendance"
                :disabled="
                  disabled || settings.room_type.record_attendance_enforced
                "
                :invalid="formErrors.fieldInvalid('record_attendance')"
                class="shrink-0"
                input-id="record-attendance"
              />
              <label for="record-attendance" class="flex items-center gap-2">
                <RoomSettingEnforcedIcon
                  v-if="settings.room_type.record_attendance_enforced"
                />
                {{ $t("rooms.settings.recordings.record_attendance") }}
              </label>
            </div>
            <FormError :errors="formErrors.fieldError('record_attendance')" />
          </div>

          <!-- Checkbox record video conference -->
          <div
            class="col-span-12 flex flex-col gap-2 md:col-span-6 xl:col-span-3"
            data-test="record-setting"
          >
            <div class="flex items-center gap-2">
              <ToggleSwitch
                v-model="settings.record"
                :disabled="disabled || settings.room_type.record_enforced"
                :invalid="formErrors.fieldInvalid('record')"
                class="shrink-0"
                input-id="record"
              />
              <label for="record" class="flex items-center gap-2">
                <RoomSettingEnforcedIcon
                  v-if="settings.room_type.record_enforced"
                />
                {{ $t("rooms.settings.recordings.record_video_conference") }}
              </label>
            </div>
            <FormError :errors="formErrors.fieldError('record')" />
          </div>

          <!-- Checkbox auto start recording of video conference -->
          <div
            class="col-span-12 flex flex-col gap-2 md:col-span-6 xl:col-span-3"
            data-test="auto-start-recording-setting"
          >
            <div class="flex items-center gap-2">
              <ToggleSwitch
                v-model="settings.auto_start_recording"
                :disabled="
                  disabled || settings.room_type.auto_start_recording_enforced
                "
                :invalid="formErrors.fieldInvalid('auto_start_recording')"
                class="shrink-0"
                input-id="auto-start-recording"
              />
              <label for="auto-start-recording" class="flex items-center gap-2">
                <RoomSettingEnforcedIcon
                  v-if="settings.room_type.auto_start_recording_enforced"
                />
                {{ $t("rooms.settings.recordings.auto_start_recording") }}
              </label>
            </div>
            <FormError
              :errors="formErrors.fieldError('auto_start_recording')"
            />
          </div>

          <Divider class="col-span-12" />

          <!-- Restriction settings -->
          <div class="col-span-12">
            <h4 class="m-0 text-lg font-semibold text-color">
              {{ $t("rooms.settings.restrictions.title") }}
            </h4>
          </div>

          <!-- Disable the ability to use the webcam for non moderator-uses, can be changed during the meeting -->
          <div
            class="col-span-12 md:col-span-6 xl:col-span-3"
            data-test="lock-settings-disable-cam-setting"
          >
            <div class="flex h-full items-center gap-2">
              <ToggleSwitch
                v-model="settings.lock_settings_disable_cam"
                :disabled="
                  disabled ||
                  settings.room_type.lock_settings_disable_cam_enforced
                "
                :invalid="formErrors.fieldInvalid('lock_settings_disable_cam')"
                class="shrink-0"
                input-id="disable-cam"
              />
              <label for="disable-cam" class="flex items-center gap-2">
                <RoomSettingEnforcedIcon
                  v-if="settings.room_type.lock_settings_disable_cam_enforced"
                />
                {{
                  $t("rooms.settings.restrictions.lock_settings_disable_cam")
                }}
              </label>
            </div>
            <FormError
              :errors="formErrors.fieldError('lock_settings_disable_cam')"
            />
          </div>

          <!--
          Disable the ability to see the webcam of non moderator-users, moderators can see all webcams,
          can be changed during the meeting
          -->
          <div
            class="col-span-12 md:col-span-6 xl:col-span-3"
            data-test="webcams-only-for-moderator-setting"
          >
            <div class="flex h-full items-center gap-2">
              <ToggleSwitch
                v-model="settings.webcams_only_for_moderator"
                :disabled="
                  disabled ||
                  settings.room_type.webcams_only_for_moderator_enforced
                "
                :invalid="formErrors.fieldInvalid('webcams_only_for_moderator')"
                class="shrink-0"
                input-id="webcams-only-for-moderator"
              />
              <label
                for="webcams-only-for-moderator"
                class="flex items-center gap-2"
              >
                <RoomSettingEnforcedIcon
                  v-if="settings.room_type.webcams_only_for_moderator_enforced"
                />
                {{
                  $t("rooms.settings.restrictions.webcams_only_for_moderator")
                }}
              </label>
            </div>
            <FormError
              :errors="formErrors.fieldError('webcams_only_for_moderator')"
            />
          </div>

          <!-- Disable the ability to use the microphone for non moderator-uses, can be changed during the meeting -->
          <div
            class="col-span-12 md:col-span-6 xl:col-span-3"
            data-test="lock-settings-disable-mic-setting"
          >
            <div class="flex h-full items-center gap-2">
              <ToggleSwitch
                v-model="settings.lock_settings_disable_mic"
                :disabled="
                  disabled ||
                  settings.room_type.lock_settings_disable_mic_enforced
                "
                :invalid="formErrors.fieldInvalid('lock_settings_disable_mic')"
                class="shrink-0"
                input-id="disable-mic"
              />
              <label for="disable-mic" class="flex items-center gap-2">
                <RoomSettingEnforcedIcon
                  v-if="settings.room_type.lock_settings_disable_mic_enforced"
                />
                {{
                  $t("rooms.settings.restrictions.lock_settings_disable_mic")
                }}
              </label>
            </div>
            <FormError
              :errors="formErrors.fieldError('lock_settings_disable_mic')"
            />
          </div>

          <!-- Disable the ability to send messages via the public chat for non moderator-uses, can be changed during the meeting -->
          <div
            class="col-span-12 md:col-span-6 xl:col-span-3"
            data-test="lock-settings-disable-public-chat-setting"
          >
            <div class="flex h-full items-center gap-2">
              <ToggleSwitch
                v-model="settings.lock_settings_disable_public_chat"
                :disabled="
                  disabled ||
                  settings.room_type.lock_settings_disable_public_chat_enforced
                "
                :invalid="
                  formErrors.fieldInvalid('lock_settings_disable_public_chat')
                "
                class="shrink-0"
                input-id="disable-public-chat"
              />
              <label for="disable-public-chat" class="flex items-center gap-2">
                <RoomSettingEnforcedIcon
                  v-if="
                    settings.room_type
                      .lock_settings_disable_public_chat_enforced
                  "
                />
                {{
                  $t(
                    "rooms.settings.restrictions.lock_settings_disable_public_chat",
                  )
                }}
              </label>
            </div>
            <FormError
              :errors="
                formErrors.fieldError('lock_settings_disable_public_chat')
              "
            />
          </div>

          <!--
          Disable the ability to send messages via the private chat for non moderator-uses,
          private chats with the moderators is still possible
          can be changed during the meeting
          -->
          <div
            class="col-span-12 md:col-span-6 xl:col-span-3"
            data-test="lock-settings-disable-private-chat-setting"
          >
            <div class="flex h-full items-center gap-2">
              <ToggleSwitch
                v-model="settings.lock_settings_disable_private_chat"
                :disabled="
                  disabled ||
                  settings.room_type.lock_settings_disable_private_chat_enforced
                "
                :invalid="
                  formErrors.fieldInvalid('lock_settings_disable_private_chat')
                "
                class="shrink-0"
                input-id="disable-private-chat"
              />
              <label for="disable-private-chat" class="flex items-center gap-2">
                <RoomSettingEnforcedIcon
                  v-if="
                    settings.room_type
                      .lock_settings_disable_private_chat_enforced
                  "
                />
                {{
                  $t(
                    "rooms.settings.restrictions.lock_settings_disable_private_chat",
                  )
                }}
              </label>
            </div>
            <FormError
              :errors="
                formErrors.fieldError('lock_settings_disable_private_chat')
              "
            />
          </div>

          <!-- Disable the ability to edit the notes for non moderator-uses, can be changed during the meeting -->
          <div
            class="col-span-12 md:col-span-6 xl:col-span-3"
            data-test="lock-settings-disable-note-setting"
          >
            <div class="flex h-full items-center gap-2">
              <ToggleSwitch
                v-model="settings.lock_settings_disable_note"
                :disabled="
                  disabled ||
                  settings.room_type.lock_settings_disable_note_enforced
                "
                :invalid="formErrors.fieldInvalid('lock_settings_disable_note')"
                class="shrink-0"
                input-id="disable-note"
              />
              <label for="disable-note" class="flex items-center gap-2">
                <RoomSettingEnforcedIcon
                  v-if="settings.room_type.lock_settings_disable_note_enforced"
                />
                {{
                  $t("rooms.settings.restrictions.lock_settings_disable_note")
                }}
              </label>
            </div>
            <FormError
              :errors="formErrors.fieldError('lock_settings_disable_note')"
            />
          </div>

          <!-- Disable the ability to see a list of all participants for non moderator-uses, can be changed during the meeting -->
          <div
            class="col-span-12 md:col-span-6 xl:col-span-3"
            data-test="lock-settings-hide-user-list-setting"
          >
            <div class="flex h-full items-center gap-2">
              <ToggleSwitch
                v-model="settings.lock_settings_hide_user_list"
                :disabled="
                  disabled ||
                  settings.room_type.lock_settings_hide_user_list_enforced
                "
                :invalid="
                  formErrors.fieldInvalid('lock_settings_hide_user_list')
                "
                class="shrink-0"
                input-id="hide-user-list"
              />
              <label for="hide-user-list" class="flex items-center gap-2">
                <RoomSettingEnforcedIcon
                  v-if="
                    settings.room_type.lock_settings_hide_user_list_enforced
                  "
                />
                {{
                  $t("rooms.settings.restrictions.lock_settings_hide_user_list")
                }}
              </label>
            </div>
            <FormError
              :errors="formErrors.fieldError('lock_settings_hide_user_list')"
            />
          </div>

          <Divider class="col-span-12" />

          <!-- Participants settings -->
          <div class="col-span-12">
            <h4 class="m-0 text-lg font-semibold text-color">
              {{ $t("rooms.settings.participants.title") }}
            </h4>
          </div>

          <!-- Checkbox allow users to become room members -->
          <div
            class="col-span-12 md:col-span-6 xl:col-span-3"
            data-test="allow-membership-setting"
          >
            <div class="flex items-center gap-2">
              <ToggleSwitch
                v-model="settings.allow_membership"
                :disabled="
                  disabled || settings.room_type.allow_membership_enforced
                "
                :invalid="formErrors.fieldInvalid('allow_membership')"
                class="shrink-0"
                input-id="allow-membership"
              />
              <label for="allow-membership" class="flex items-center gap-2">
                <RoomSettingEnforcedIcon
                  v-if="settings.room_type.allow_membership_enforced"
                />
                {{ $t("rooms.settings.participants.allow_membership") }}
              </label>
            </div>
            <FormError :errors="formErrors.fieldError('allow_membership')" />
          </div>

          <!-- Default user role for logged in users only -->
          <div
            class="col-span-12 flex flex-col md:col-span-6 xl:col-span-3"
            data-test="default-role-setting"
          >
            <label id="default-role-label" class="flex items-center gap-2">
              <RoomSettingEnforcedIcon
                v-if="settings.room_type.default_role_enforced"
              />
              {{ $t("rooms.settings.participants.default_role.title") }}
            </label>
            <small>
              {{
                $t("rooms.settings.participants.default_role.only_logged_in")
              }}
            </small>

            <div class="flex">
              <SelectButton
                v-model="settings.default_role"
                :allow-empty="false"
                :disabled="disabled || settings.room_type.default_role_enforced"
                :invalid="formErrors.fieldInvalid('default_role')"
                :options="[
                  { role: 1, label: $t('rooms.roles.participant') },
                  { role: 2, label: $t('rooms.roles.moderator') },
                ]"
                class="shrink-0"
                data-key="role"
                aria-labelledby="default-role-label"
                option-label="label"
                option-value="role"
                :pt="{
                  pcToggleButton: {
                    root: {
                      'data-test': 'room-settings-default-role-button',
                    },
                  },
                }"
              />
            </div>
            <FormError :errors="formErrors.fieldError('default_role')" />
          </div>

          <Divider class="col-span-12" />

          <!-- Advanced settings -->
          <div class="col-span-12">
            <h4 class="m-0 text-lg font-semibold text-color">
              {{ $t("rooms.settings.advanced.title") }}
            </h4>
          </div>

          <!-- Room visibility setting -->
          <div
            class="col-span-12 flex flex-col gap-2 md:col-span-6 xl:col-span-3"
            data-test="visibility-setting"
          >
            <label id="visibility-label" class="flex items-center gap-2">
              <RoomSettingEnforcedIcon
                v-if="settings.room_type.visibility_enforced"
              />
              {{ $t("rooms.settings.advanced.visibility.title") }}
            </label>

            <div class="flex">
              <SelectButton
                v-model="settings.visibility"
                :allow-empty="false"
                :disabled="disabled || settings.room_type.visibility_enforced"
                :invalid="formErrors.fieldInvalid('visibility_default')"
                :options="[
                  {
                    visibility: 0,
                    label: $t('rooms.settings.advanced.visibility.private'),
                  },
                  {
                    visibility: 1,
                    label: $t('rooms.settings.advanced.visibility.public'),
                  },
                ]"
                class="shrink-0"
                data-key="visibility"
                aria-labelledby="visibility-label"
                option-label="label"
                option-value="visibility"
                :pt="{
                  pcToggleButton: {
                    root: {
                      'data-test': 'room-settings-visibility-button',
                    },
                  },
                }"
              />
            </div>
            <FormError :errors="formErrors.fieldError('visibility')" />
          </div>
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
const saveButton = ref(null);
const saveButtonIsVisible = useElementVisibility(saveButton);

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
