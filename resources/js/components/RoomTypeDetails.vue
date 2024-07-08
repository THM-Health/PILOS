<template>
  <div class="flex flex-col gap-2 w-full" style="height: 250px" data-test="room-type-details">
    <RoomTypeBadge :roomType="roomType" class="w-full text-base" />

    <div class="overflow-y-auto w-full">
      <div class="flex flex-col gap-2 border border-surface-200 dark:border-surface-600 rounded-border p-4">

        <!-- Description for the room type -->
        <span class="font-bold">{{ $t('app.description') }}</span>
        <div style="word-break: normal; overflow-wrap: anywhere;">{{roomType.description? roomType.description: $t('admin.room_types.missing_description')}}</div>

        <!-- Information about the default and enforced room settings for the room type -->
        <Accordion>
          <AccordionTab
            :header="$t('admin.room_types.default_room_settings.title')"
            :pt="{
              headerAction: {
                class: 'pl-0'
              }
            }"
          >

            <!-- General settings -->
            <h4 class="my-2">{{ $t('rooms.settings.general.title') }}</h4>

            <!-- Has access code setting (defines if the room should have an access code) -->
            <div class="field grid grid-cols-12 gap-4">
              <label for="has-access-code-default" class="col-span-8 flex items-center gap-2">
                <RoomSettingEnforcedIcon v-if="roomType.has_access_code_enforced"/>
                {{ $t('rooms.settings.general.has_access_code') }}
              </label>

              <div class="col-span-4 justify-center flex items-center">
                <InputSwitch
                  input-id="has-access-code-default"
                  :model-value="roomType.has_access_code_default"
                  disabled
                />
              </div>
            </div>

            <!-- Allow guests to access the room -->
            <div class="field grid grid-cols-12 gap-4">
              <label for="allow-guests-default" class="col-span-8 flex items-center gap-2">
                <RoomSettingEnforcedIcon v-if="roomType.allow_guests_enforced"/>
                {{$t('rooms.settings.general.allow_guests')}}
              </label>

              <div class="col-span-4 justify-center flex items-center">
                <InputSwitch
                  input-id="allow-guests-default"
                  :model-value="roomType.allow_guests_default"
                  disabled
                />
              </div>
            </div>

            <!-- Expert settings -->
            <!-- Video conference settings -->
            <h4 class="my-2">{{ $t('rooms.settings.video_conference.title') }}</h4>

            <!-- Everyone can start a new meeting, not only the moderator -->
            <div class="field grid grid-cols-12 gap-4">
                <label for="everyone-can-start-default" class="col-span-8 flex items-center gap-2">
                  <RoomSettingEnforcedIcon v-if="roomType.everyone_can_start_enforced"/>
                  {{$t('rooms.settings.video_conference.everyone_can_start')}}
                </label>

              <div class="col-span-4 justify-center flex items-center">
                <InputSwitch
                  input-id="everyone-can-start-default"
                  :model-value="roomType.everyone_can_start_default"
                  disabled
                />
              </div>
            </div>

            <!-- Mute everyone's microphone on meeting join -->
            <div class="field grid grid-cols-12 gap-4">
              <label for="mute-on-start-default" class="col-span-8 flex items-center gap-2">
                <RoomSettingEnforcedIcon v-if="roomType.mute_on_start_enforced"/>
                {{$t('rooms.settings.video_conference.mute_on_start')}}
              </label>
              <div class="col-span-4 justify-center flex items-center">
                <InputSwitch
                  input-id="mute-on-start-default"
                  :model-value="roomType.mute_on_start_default"
                  disabled
                />
              </div>
            </div>

            <!-- Usage of the waiting room/guest lobby -->
            <div class="field grid grid-cols-12 gap-4">
              <span class="col-span-8 flex items-center gap-2">
                <RoomSettingEnforcedIcon v-if="roomType.lobby_enforced"/>
                {{ $t('rooms.settings.video_conference.lobby.title') }}
              </span>

              <div class="col-span-4 justify-center flex items-center text-center">
                <span v-if="roomType.lobby_default === 0"> {{ $t('app.disabled') }}</span>
                <span v-if="roomType.lobby_default === 1"> {{ $t('app.enabled') }}</span>
                <span v-if="roomType.lobby_default === 2"> {{ $t('rooms.settings.video_conference.lobby.only_for_guests_enabled') }}</span>
              </div>
            </div>

            <!-- Recording settings -->
            <h4 class="my-2" >{{ $t('rooms.settings.recordings.title') }}</h4>

            <!-- Record attendance of users and guests -->
            <div class="field grid grid-cols-12 gap-4">
              <label for="record-attendance-default" class="col-span-8 flex items-center gap-2">
                <RoomSettingEnforcedIcon v-if="roomType.record_attendance_enforced"/>
                {{ $t('rooms.settings.recordings.record_attendance') }}
              </label>

              <div class="col-span-4 justify-center flex items-center">
                <InputSwitch
                  input-id="record-attendance-default"
                  :model-value="roomType.record_attendance_default"
                  disabled
                />
              </div>
            </div>

            <!-- Record video conference -->
            <div class="field grid grid-cols-12 gap-4">
              <label for="record-default" class="col-span-8 flex items-center gap-2">
                <RoomSettingEnforcedIcon v-if="roomType.record_enforced"/>
                {{ $t('rooms.settings.recordings.record_video_conference') }}
              </label>

              <div class="col-span-4 justify-center flex items-center">
                <InputSwitch
                  input-id="record-default"
                  :model-value="roomType.record_default"
                  disabled
                />
              </div>
            </div>

            <!-- Auto start recording video conference -->
            <div class="field grid grid-cols-12 gap-4">
              <label for="auto-start-recording-default" class="col-span-8 flex items-center gap-2">
                <RoomSettingEnforcedIcon v-if="roomType.auto_start_recording_enforced"/>
                {{ $t('rooms.settings.recordings.auto_start_recording') }}
              </label>

              <div class="col-span-4 justify-center flex items-center">
                <InputSwitch
                  input-id="auto-start-recording-default"
                  :model-value="roomType.auto_start_recording_default"
                  disabled
                />
              </div>
            </div>

            <!-- Restriction settings -->
            <h4 class="my-2" >{{ $t('rooms.settings.restrictions.title') }}</h4>

            <!-- Disable the ability to use the webcam for non moderator-uses, can be changed during the meeting -->
            <div class="field grid grid-cols-12 gap-4">
              <label for="disable-cam-default" class="col-span-8 flex items-center gap-2">
                <RoomSettingEnforcedIcon v-if="roomType.lock_settings_disable_cam_enforced"/>
                {{$t('rooms.settings.restrictions.lock_settings_disable_cam')}}
              </label>

              <div class="col-span-4 justify-center flex items-center">
                <InputSwitch
                  input-id="disable-cam-default"
                  :model-value="roomType.lock_settings_disable_cam_default"
                  disabled
                />
              </div>
            </div>

            <!--
            Disable the ability to see the webcam of non moderator-users, moderators can see all webcams,
            can be changed during the meeting
            -->
            <div class="field grid grid-cols-12 gap-4">
              <label for="webcams-only-for-moderator-default" class="col-span-8 flex items-center gap-2">
                <RoomSettingEnforcedIcon v-if="roomType.webcams_only_for_moderator_enforced"/>
                {{$t('rooms.settings.restrictions.webcams_only_for_moderator')}}
              </label>

              <div class="col-span-4 justify-center flex items-center">
                <InputSwitch
                  input-id="webcams-only-for-moderator-default"
                  :model-value="roomType.webcams_only_for_moderator_default"
                  disabled
                />
              </div>
            </div>

            <!-- Disable the ability to use the microphone for non moderator-uses, can be changed during the meeting -->
            <div class="field grid grid-cols-12 gap-4">
              <label for="disable-mic-default" class="col-span-8 flex items-center gap-2">
                <RoomSettingEnforcedIcon v-if="roomType.lock_settings_disable_mic_enforced"/>
                {{$t('rooms.settings.restrictions.lock_settings_disable_mic')}}
              </label>

              <div class="col-span-4 justify-center flex items-center">
                <InputSwitch
                  input-id="disable-mic-default"
                  :model-value="roomType.lock_settings_disable_mic_default"
                  disabled
                />
              </div>
            </div>

            <!-- Disable the ability to send messages via the public chat for non moderator-uses, can be changed during the meeting -->
            <div class="field grid grid-cols-12 gap-4">
              <label for="disable-public-chat-default" class="col-span-8 flex items-center gap-2">
                <RoomSettingEnforcedIcon v-if="roomType.lock_settings_disable_public_chat_enforced"/>
                {{$t('rooms.settings.restrictions.lock_settings_disable_public_chat')}}
              </label>

              <div class="col-span-4 justify-center flex items-center">
                <InputSwitch
                  input-id="disable-public-chat-default"
                  :model-value="roomType.lock_settings_disable_public_chat_default"
                  disabled
                />
              </div>
            </div>

            <!--
            Disable the ability to send messages via the private chat for non moderator-uses,
            private chats with the moderators is still possible
            can be changed during the meeting
            -->
            <div class="field grid grid-cols-12 gap-4">
              <label for="disable-private-chat-default" class="col-span-8 flex items-center gap-2">
                <RoomSettingEnforcedIcon v-if="roomType.lock_settings_disable_private_chat_enforced"/>
                {{$t('rooms.settings.restrictions.lock_settings_disable_private_chat')}}
              </label>

              <div class="col-span-4 justify-center flex items-center">
                <InputSwitch
                  input-id="disable-private-chat-default"
                  :model-value="roomType.lock_settings_disable_private_chat_default"
                  disabled
                />
              </div>
            </div>

            <!-- Disable the ability to edit the notes for non moderator-uses, can be changed during the meeting -->
            <div class="field grid grid-cols-12 gap-4">
              <label for="disable-note-default" class="col-span-8 flex items-center gap-2">
                <RoomSettingEnforcedIcon v-if="roomType.lock_settings_disable_note_enforced"/>
                {{$t('rooms.settings.restrictions.lock_settings_disable_note')}}
              </label>

              <div class="col-span-4 justify-center flex items-center">
                <InputSwitch
                  input-id="disable-note-default"
                  :model-value="roomType.lock_settings_disable_note_default"
                  disabled
                />
              </div>
            </div>

            <!-- Disable the ability to see a list of all participants for non moderator-uses, can be changed during the meeting -->
            <div class="field grid grid-cols-12 gap-4">
              <label for="hide-user-list-default" class="col-span-8 flex items-center gap-2">
                <RoomSettingEnforcedIcon v-if="roomType.lock_settings_hide_user_list_enforced"/>
                {{$t('rooms.settings.restrictions.lock_settings_hide_user_list')}}
              </label>

              <div class="col-span-4 justify-center flex items-center">
              <InputSwitch
                  input-id="hide-user-list-default"
                  :model-value="roomType.lock_settings_hide_user_list_default"
                  disabled
                />
              </div>
            </div>

            <!-- Participants settings -->
            <h4 class="my-2">{{ $t('rooms.settings.participants.title') }}</h4>

            <!-- Allow users to become room members -->
            <div class="field grid grid-cols-12 gap-4">
              <label for="allow-membership-default" class="col-span-8 flex items-center gap-2">
                <RoomSettingEnforcedIcon v-if="roomType.allow_membership_enforced"/>
                {{$t('rooms.settings.participants.allow_membership')}}
              </label>

              <div class="col-span-4 justify-center flex items-center">
              <InputSwitch
                  input-id="allow-membership-default"
                  :model-value="roomType.allow_membership_default"
                  disabled
                />
              </div>
            </div>

            <!-- Default user role for logged in users only -->
            <div class="field grid grid-cols-12 gap-4">
              <span class="col-span-8 flex items-center gap-2">
                <RoomSettingEnforcedIcon v-if="roomType.default_role_enforced"/>
                {{ $t('rooms.settings.participants.default_role.title') }} {{ $t('rooms.settings.participants.default_role.only_logged_in') }}
              </span>

              <div class="col-span-4 justify-center flex items-center">
                <RoomRoleBadge :role="roomType.default_role_default"/>
              </div>
            </div>

            <!-- Advanced settings -->
            <h4 class="my-2">{{ $t('rooms.settings.advanced.title') }}</h4>

            <!-- Room visibility setting -->
            <div class="field grid grid-cols-12 gap-4">
              <span class="col-span-8 flex items-center gap-2">
                <RoomSettingEnforcedIcon v-if="roomType.visibility_enforced"/>
                {{ $t('rooms.settings.advanced.visibility.title') }}
              </span>

              <div class="col-span-4 justify-center flex items-center">
                <span v-if="roomType.visibility_default === 0"> {{ $t('rooms.settings.advanced.visibility.private') }} </span>
                <span v-if="roomType.visibility_default === 1"> {{ $t('rooms.settings.advanced.visibility.public') }} </span>
              </div>
            </div>

          </AccordionTab>
        </Accordion>
      </div>
    </div>

  </div>
</template>

<script setup>

defineProps({
  roomType: {
    type: Object,
    required: true
  }
});

</script>
