<template>

  <Dialog
    v-model:visible="modalVisible"
    :header="$t('rooms.change_type.title')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :dismissableMask="false"
    modal
  >
    <div class="overflow-y-auto" style="max-height:300px">
      {{ $t('rooms.change_type.changing_settings') }}

      <!-- General settings (always shown) -->
      <h4 class="my-2">{{ $t('rooms.settings.general.title') }}</h4>

      <!-- Has access code setting (defines if the room should have an access code) -->
      <div class="field grid mx-0">
        <span class="col-12 mb-2">{{ $t('rooms.settings.general.has_access_code') }}</span>
        <!-- Current setting value -->
        <div class="col-3 flex align-items-center justify-content-center">
          <InputSwitch
            input-id="has-access-code-current"
            :model-value="currentSettings.access_code !== null"
            disabled
            :aria-label="currentSettings.room_type.has_access_code_enforced? $t('rooms.change_type.current_setting_enforced'): $t('rooms.change_type.current_setting')"
          />
        </div>
        <div class="col-2 flex align-items-center justify-content-center">
          <RoomSettingEnforcedIcon v-if="currentSettings.room_type.has_access_code_enforced"/>
        </div>
        <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
        <!-- Resulting setting value -->
        <div class="col-3 flex align-items-center justify-content-center">
          <InputSwitch
            input-id="has-access-code-resulting"
            :model-value="getResultingSetting('has_access_code')"
            disabled
            :aria-label="newRoomType.has_access_code_enforced? $t('rooms.change_type.resulting_setting_enforced'): $t('rooms.change_type.resulting_setting')"
          />
        </div>
        <div class="col-2 flex align-items-center justify-content-center">
          <RoomSettingEnforcedIcon v-if="newRoomType.has_access_code_enforced"/>
        </div>
      </div>

      <!-- Allow guests to access the room -->
      <div class="field grid mx-0">
        <span class="col-12 mb-2">{{$t('rooms.settings.general.allow_guests')}}</span>
        <!-- Current setting value -->
        <div class="col-3 flex justify-content-center align-items-center">
          <InputSwitch
            input-id="allow-guests-current"
            :model-value="currentSettings.allow_guests"
            disabled
            :aria-label="currentSettings.room_type.allow_guests_enforced? $t('rooms.change_type.current_setting_enforced'): $t('rooms.change_type.current_setting')"
          />
        </div>
        <div class="col-2 flex justify-content-center align-items-center">
          <RoomSettingEnforcedIcon v-if="currentSettings.room_type.allow_guests_enforced"/>
        </div>
        <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
        <!-- Resulting setting value -->
        <div class="col-3 flex justify-content-center align-items-center">
          <InputSwitch
            input-id="allow-guests-resulting"
            :model-value="getResultingSetting('allow_guests')"
            disabled
            :aria-label="newRoomType.allow_guests_enforced? $t('rooms.change_type.resulting_setting_enforced'): $t('rooms.change_type.resulting_setting')"
          />
        </div>
        <div class="col-2 flex justify-content-center align-items-center">
          <RoomSettingEnforcedIcon v-if="newRoomType.allow_guests_enforced"/>
        </div>
      </div>

      <!--
      Expert settings (only shown when expert mode is activated)
      When the expert mode is deactivated the default values from the room type will be used
      -->
      <div v-if="currentSettings.expert_mode">
        <!-- Video conference settings -->
        <h4 class="my-2">{{ $t('rooms.settings.video_conference.title') }}</h4>

        <!-- Everyone can start a new meeting, not only the moderator -->
        <div class="field grid mx-0">
          <!-- Current setting value -->
          <span class="col-12 mb-2">{{$t('rooms.settings.video_conference.everyone_can_start')}}</span>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="everyone-can-start-current"
              :model-value="currentSettings.everyone_can_start"
              disabled
              :aria-label="currentSettings.room_type.everyone_can_start_enforced? $t('rooms.change_type.current_setting_enforced'): $t('rooms.change_type.current_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.everyone_can_start_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <!-- Resulting setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="everyone-can-start-resulting"
              :model-value="getResultingSetting('everyone_can_start')"
              disabled
              :aria-label="newRoomType.everyone_can_start_enforced? $t('rooms.change_type.resulting_setting_enforced'): $t('rooms.change_type.resulting_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.everyone_can_start_enforced"/>
          </div>
        </div>

        <!-- Mute everyone's microphone on meeting join -->
        <div class="field grid mx-0">
          <span class="col-12 mb-2">{{$t('rooms.settings.video_conference.mute_on_start')}}</span>
          <!-- Current setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="mute-on-start-current"
              :model-value="currentSettings.mute_on_start"
              disabled
              :aria-label="currentSettings.room_type.mute_on_start_enforced? $t('rooms.change_type.current_setting_enforced'): $t('rooms.change_type.current_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.mute_on_start_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <!-- Resulting setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="mute-on-start-resulting"
              :model-value="getResultingSetting('mute_on_start')"
              disabled
              :aria-label="newRoomType.mute_on_start_enforced? $t('rooms.change_type.resulting_setting_enforced'): $t('rooms.change_type.resulting_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.mute_on_start_enforced"/>
          </div>
        </div>

        <!-- Usage of the waiting room/guest lobby -->
        <div class="field grid mx-0">
          <span class="col-12 mb-2">{{ $t('rooms.settings.video_conference.lobby.title') }}</span>
          <!-- Current setting value -->
          <div class="col-3 flex align-items-center justify-content-center text-center">
            <span v-if="currentSettings.lobby === 0"> {{ $t('app.disabled') }}</span>
            <span v-if="currentSettings.lobby === 1"> {{ $t('app.enabled') }}</span>
            <span v-if="currentSettings.lobby === 2"> {{ $t('rooms.settings.video_conference.lobby.only_for_guests_enabled') }}</span>
          </div>
          <div class="col-2 flex align-items-center justify-content-center">
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.lobby_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <!-- Resulting setting value -->
          <div class="col-3 flex justify-content-center align-items-center text-center">
            <span v-if="getResultingSetting('lobby') === 0"> {{ $t('app.disabled') }}</span>
            <span v-if="getResultingSetting('lobby') === 1"> {{ $t('app.enabled') }}</span>
            <span v-if="getResultingSetting('lobby') === 2"> {{ $t('rooms.settings.video_conference.lobby.only_for_guests_enabled') }}</span>
          </div>
          <div class="col-2 flex align-items-center justify-content-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.lobby_enforced"/>
          </div>
        </div>

        <!-- Recording settings -->
        <h4 class="my-2" >{{ $t('rooms.settings.recordings.title') }}</h4>

        <!-- Record attendance of users and guests -->
        <div class="field grid mx-0">
          <span class="col-12 mb-2">{{ $t('rooms.settings.recordings.record_attendance') }}</span>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="record-attendance-current"
              :model-value="currentSettings.record_attendance"
              disabled
              :aria-label="currentSettings.room_type.record_attendance_enforced? $t('rooms.change_type.current_setting_enforced'): $t('rooms.change_type.current_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.record_attendance_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <!-- Resulting setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="record-attendance-resulting"
              :model-value="getResultingSetting('record_attendance')"
              disabled
              :aria-label="newRoomType.record_attendance_enforced? $t('rooms.change_type.resulting_setting_enforced'): $t('rooms.change_type.resulting_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.record_attendance_enforced"/>
          </div>
        </div>

        <!-- Record video conference -->
        <div class="field grid mx-0">
          <span class="col-12 mb-2">{{ $t('rooms.settings.recordings.record_video_conference') }}</span>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="record-current"
              :model-value="currentSettings.record"
              disabled
              :aria-label="currentSettings.room_type.record_enforced? $t('rooms.change_type.current_setting_enforced'): $t('rooms.change_type.current_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.record_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <!-- Resulting setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="record-resulting"
              :model-value="getResultingSetting('record')"
              disabled
              :aria-label="newRoomType.record_enforced? $t('rooms.change_type.resulting_setting_enforced'): $t('rooms.change_type.resulting_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.record_enforced"/>
          </div>
        </div>

        <!-- Auto start recording video conference -->
        <div class="field grid mx-0">
          <span class="col-12 mb-2">{{ $t('rooms.settings.recordings.auto_start_recording') }}</span>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="auto-start-recording-current"
              :model-value="currentSettings.auto_start_recording"
              disabled
              :aria-label="currentSettings.room_type.auto_start_recording_enforced? $t('rooms.change_type.current_setting_enforced'): $t('rooms.change_type.current_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.auto_start_recording_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <!-- Resulting setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="auto-start-recording-resulting"
              :model-value="getResultingSetting('auto_start_recording')"
              disabled
              :aria-label="newRoomType.auto_start_recording_enforced? $t('rooms.change_type.resulting_setting_enforced'): $t('rooms.change_type.resulting_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.auto_start_recording_enforced"/>
          </div>
        </div>

        <!-- Restriction settings -->
        <h4 class="my-2" >{{ $t('rooms.settings.restrictions.title') }}</h4>

        <!-- Disable the ability to use the webcam for non moderator-uses, can be changed during the meeting -->
        <div class="field grid mx-0">
          <span class="col-12 mb-2">{{$t('rooms.settings.restrictions.lock_settings_disable_cam')}}</span>
          <!-- Current setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="disable-cam-current"
              :model-value="currentSettings.lock_settings_disable_cam"
              disabled
              :aria-label="currentSettings.room_type.lock_settings_disable_cam_enforced? $t('rooms.change_type.current_setting_enforced'): $t('rooms.change_type.current_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.lock_settings_disable_cam_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <!-- Resulting setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="disable-cam-resulting"
              :model-value="getResultingSetting('lock_settings_disable_cam')"
              disabled
              :aria-label="newRoomType.lock_settings_disable_cam_enforced? $t('rooms.change_type.resulting_setting_enforced'): $t('rooms.change_type.resulting_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.lock_settings_disable_cam_enforced"/>
          </div>
        </div>

        <!--
        Disable the ability to see the webcam of non moderator-users, moderators can see all webcams,
        can be changed during the meeting
        -->
        <div class="field grid mx-0">
          <span class="col-12 mb-2">{{$t('rooms.settings.restrictions.webcams_only_for_moderator')}}</span>
          <!-- Current setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="webcams-only-for-moderator-current"
              :model-value="currentSettings.webcams_only_for_moderator"
              disabled
              :aria-label="currentSettings.room_type.webcams_only_for_moderator_enforced? $t('rooms.change_type.current_setting_enforced'): $t('rooms.change_type.current_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.webcams_only_for_moderator_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <!-- Resulting setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="webcam-only-for-moderator-resulting"
              :model-value="getResultingSetting('webcams_only_for_moderator')"
              disabled
              :aria-label="newRoomType.webcams_only_for_moderator_enforced? $t('rooms.change_type.resulting_setting_enforced'): $t('rooms.change_type.resulting_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.webcams_only_for_moderator_enforced"/>
          </div>
        </div>

        <!-- Disable the ability to use the microphone for non moderator-uses, can be changed during the meeting -->
        <div class="field grid mx-0">
          <span class="col-12 mb-2">{{$t('rooms.settings.restrictions.lock_settings_disable_mic')}}</span>
          <!-- Current setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="disable-mic-current"
              :model-value="currentSettings.lock_settings_disable_mic"
              disabled
              :aria-label="currentSettings.room_type.lock_settings_disable_mic_enforced? $t('rooms.change_type.current_setting_enforced'): $t('rooms.change_type.current_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.lock_settings_disable_mic_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <!-- Resulting setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="disable-mic-resulting"
              :model-value="getResultingSetting('lock_settings_disable_mic')"
              disabled
              :aria-label="newRoomType.lock_settings_disable_mic_enforced? $t('rooms.change_type.resulting_setting_enforced'): $t('rooms.change_type.resulting_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.lock_settings_disable_mic_enforced"/>
          </div>
        </div>

        <!-- Disable the ability to send messages via the public chat for non moderator-uses, can be changed during the meeting -->
        <div class="field grid mx-0">
          <span class="col-12 mb-2">{{$t('rooms.settings.restrictions.lock_settings_disable_public_chat')}}</span>
          <!-- Current setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="disable-public-chat-current"
              :model-value="currentSettings.lock_settings_disable_public_chat"
              disabled
              :aria-label="currentSettings.room_type.lock_settings_disable_public_chat_enforced? $t('rooms.change_type.current_setting_enforced'): $t('rooms.change_type.current_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.lock_settings_disable_public_chat_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <!-- Resulting setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="disable-public-chat-resulting"
              :model-value="getResultingSetting('lock_settings_disable_public_chat')"
              disabled
              :aria-label="newRoomType.lock_settings_disable_public_chat_enforced? $t('rooms.change_type.resulting_setting_enforced'): $t('rooms.change_type.resulting_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.lock_settings_disable_public_chat_enforced"/>
          </div>
        </div>

        <!--
        Disable the ability to send messages via the private chat for non moderator-uses,
        private chats with the moderators is still possible
        can be changed during the meeting
        -->
        <div class="field grid mx-0">
          <span class="col-12 mb-2">{{$t('rooms.settings.restrictions.lock_settings_disable_private_chat')}}</span>
          <!-- Current setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="disable-private-chat-current"
              :model-value="currentSettings.lock_settings_disable_private_chat"
              disabled
              :aria-label="currentSettings.room_type.lock_settings_disable_private_chat_enforced? $t('rooms.change_type.current_setting_enforced'): $t('rooms.change_type.current_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.lock_settings_disable_private_chat_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <!-- Resulting setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="disable-private-chat-resulting"
              :model-value="getResultingSetting('lock_settings_disable_private_chat')"
              disabled
              :aria-label="newRoomType.lock_settings_disable_private_chat_enforced? $t('rooms.change_type.resulting_setting_enforced'): $t('rooms.change_type.resulting_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.lock_settings_disable_private_chat_enforced"/>
          </div>
        </div>

        <!-- Disable the ability to edit the notes for non moderator-uses, can be changed during the meeting -->
        <div class="field grid mx-0">
          <span class="col-12 mb-2">{{$t('rooms.settings.restrictions.lock_settings_disable_note')}}</span>
          <!-- Current setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="disable-note-current"
              :model-value="currentSettings.lock_settings_disable_note"
              disabled
              :aria-label="currentSettings.room_type.lock_settings_disable_note_enforced? $t('rooms.change_type.current_setting_enforced'): $t('rooms.change_type.current_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.lock_settings_disable_note_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <!-- Resulting setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="disable-note-resulting"
              :model-value="getResultingSetting('lock_settings_disable_note')"
              disabled
              :aria-label="newRoomType.lock_settings_disable_note_enforced? $t('rooms.change_type.resulting_setting_enforced'): $t('rooms.change_type.resulting_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.lock_settings_disable_note_enforced"/>
          </div>
        </div>

        <!-- Disable the ability to see a list of all participants for non moderator-uses, can be changed during the meeting -->
        <div class="field grid mx-0">
          <span class="col-12 mb-2">{{$t('rooms.settings.restrictions.lock_settings_hide_user_list')}}</span>
          <!-- Current setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="hide-user-list-current"
              :model-value="currentSettings.lock_settings_hide_user_list"
              disabled
              :aria-label="currentSettings.room_type.lock_settings_hide_user_list_enforced? $t('rooms.change_type.current_setting_enforced'): $t('rooms.change_type.current_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.lock_settings_hide_user_list_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <!-- Resulting setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="hide-user-list-resulting"
              :model-value="getResultingSetting('lock_settings_hide_user_list')"
              disabled
              :aria-label="newRoomType.lock_settings_hide_user_list_enforced? $t('rooms.change_type.resulting_setting_enforced'): $t('rooms.change_type.resulting_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.lock_settings_hide_user_list_enforced"/>
          </div>
        </div>

        <!-- Participants settings -->
        <h4 class="my-2">{{$t('rooms.settings.participants.title')}}</h4>

        <!-- Allow users to become room members -->
        <div class="field grid mx-0">
          <span class="col-12 mb-2">{{$t('rooms.settings.participants.allow_membership')}}</span>
          <!-- Current setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="allow-membership-current"
              :model-value="currentSettings.allow_membership"
              disabled
              :aria-label="currentSettings.room_type.allow_membership_enforced? $t('rooms.change_type.current_setting_enforced'): $t('rooms.change_type.current_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.allow_membership_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <!-- Resulting setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="allow-membership-resulting"
              :model-value="getResultingSetting('allow_membership')"
              disabled
              :aria-label="newRoomType.allow_membership_enforced? $t('rooms.change_type.resulting_setting_enforced'): $t('rooms.change_type.resulting_setting')"
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.allow_membership_enforced"/>
          </div>
        </div>

        <!-- Default user role for logged in users only -->
        <div class="field grid mx-0">
          <span class="col-12 mb-2">{{ $t('rooms.settings.participants.default_role.title') }} {{ $t('rooms.settings.participants.default_role.only_logged_in') }}</span>
          <!-- Current setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <RoomRoleBadge :role="currentSettings.default_role"/>
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.default_role_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <!-- Resulting setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <RoomRoleBadge :role="getResultingSetting('default_role')"/>
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.default_role_enforced"/>
          </div>
        </div>

        <!-- Advanced settings -->
        <h4 class="my-2">{{$t('rooms.settings.advanced.title')}}</h4>

        <!-- Room visibility setting -->
        <div class="field grid mx-0">
          <span class="col-12 mb-2">{{ $t('rooms.settings.advanced.visibility.title') }}</span>
          <!-- Default setting -->
          <div class="col-3 flex justify-content-center align-items-center">
            <span v-if="currentSettings.visibility === 0">{{ $t('rooms.settings.advanced.visibility.private') }}</span>
            <span v-if="currentSettings.visibility === 1"> {{ $t('rooms.settings.advanced.visibility.public') }} </span>
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.visibility_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <!-- Resulting setting value -->
          <div class="col-3 flex justify-content-center align-items-center">
            <span v-if="getResultingSetting('visibility') === 0"> {{ $t('rooms.settings.advanced.visibility.private') }} </span>
            <span v-if="getResultingSetting('visibility') === 1"> {{ $t('rooms.settings.advanced.visibility.public') }} </span>
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.visibility_enforced"/>
          </div>
        </div>
      </div>
    </div>

    <Divider class="mt-0"/>

    <div class="flex align-items-center gap-2">
      <InputSwitch
        input-id="reset-to-defaults"
        v-model="resetToDefaults"
      />
      <label for="reset-to-defaults"> {{$t('rooms.change_type.reset_to_default')}}</label>
    </div>
    <template #footer>
      <div class="flex  justify-content-end w-full gap-2">
        <Button :label="$t('app.cancel')" severity="secondary" @click="handleCancel" />
        <Button :label="$t('app.save')" @click="handleSave" />
      </div>
    </template>
  </Dialog>

</template>

<script setup>

import { ref } from 'vue';

const modalVisible = defineModel();

const emit = defineEmits('confirmedRoomTypeChange');
const props = defineProps({
  currentSettings: {
    type: Object,
    required: true
  },
  newRoomType: {
    type: Object,
    required: true
  }
});

const resetToDefaults = ref(false);

/**
 * Get the setting that will be applied if the room type is changed to the new room type
 * @param settingName setting name of the setting
 * @returns {*|boolean} resulting setting value for the given setting name
 */
function getResultingSetting (settingName) {
  // Check if setting will be changed to default value
  if (resetToDefaults.value || props.newRoomType[settingName + '_enforced']) {
    // Return default value
    return props.newRoomType[settingName + '_default'];
  } else {
    // Return current setting value
    if (settingName === 'has_access_code') {
      return props.currentSettings.access_code !== null;
    }
    return props.currentSettings[settingName];
  }
}

function handleSave () {
  emit('confirmedRoomTypeChange', resetToDefaults.value);
  resetToDefaults.value = false;
}

function handleCancel () {
  modalVisible.value = false;
  resetToDefaults.value = false;
}
</script>
