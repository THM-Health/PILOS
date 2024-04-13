<template>
  <div class="flex flex-column gap-2 w-full" style="height: 250px">
      <RoomTypeBadge :roomType="roomType" class="w-full text-base" />

      <div class="overflow-y-auto w-full">
      <div class="flex flex-column gap-2 border-1 border-200 border-round p-3">
        <span class="font-bold">{{ $t('app.description') }}</span>
        <div style="word-break: normal; overflow-wrap: anywhere;">{{roomType.description? roomType.description: $t('settings.room_types.missing_description')}}</div>

<!--        ToDo ??? Opening and closing sometimes slow????-->
        <!-- ToDo fix labels, ids ...-->
        <Accordion>
          <AccordionTab
            :header="$t('settings.room_types.default_room_settings.title')"
            :pt="{
              headerAction: {
                class: 'pl-0'
              }
            }"
          >

            <h4 class="my-2">{{ $t('rooms.settings.general.title') }}</h4>

            <div class="field grid">
              <div class="col-8 flex align-items-center gap-2">
                <span
                  v-if="roomType.has_access_code_enforced"
                  class="fa-solid fa-lock"
                  v-tooltip="$t('rooms.settings.general.enforced_setting')"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
                <label for="has_access_code_default">{{ $t('rooms.settings.general.has_access_code') }}</label>
              </div>
              <div class="col-4 justify-content-center flex align-items-center">
                <InputSwitch
                  input-id="has_access_code_default"
                  :model-value="roomType.has_access_code_default"
                  disabled
                />
              </div>
            </div>

            <div class="field grid">
              <div class="col-8 flex align-items-center gap-2">
                <span
                  v-if="roomType.allow_guests_enforced"
                  class="fa-solid fa-lock"
                  v-tooltip="$t('rooms.settings.general.enforced_setting')"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
                <label for="allow_guests_default">{{$t('rooms.settings.general.allow_guests')}}</label>
              </div>
              <div class="col-4 justify-content-center flex align-items-center">
                <InputSwitch
                  input-id="allow_guests_default"
                  :model-value="roomType.allow_guests_default"
                  disabled
                />
              </div>
            </div>

            <h4 class="my-2">{{ $t('rooms.settings.video_conference.title') }}</h4>

            <div class="field grid">
              <div class="col-8 flex align-items-center gap-2">
                <span
                  v-if="roomType.everyone_can_start_enforced"
                  class="fa-solid fa-lock"
                  v-tooltip="$t('rooms.settings.general.enforced_setting')"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
                <label for="everyone_can_start_default">{{$t('rooms.settings.video_conference.everyone_can_start')}}</label>
              </div>
              <div class="col-4 justify-content-center flex align-items-center">
                <InputSwitch
                  input-id="everyone_can_start_default"
                  :model-value="roomType.everyone_can_start_default"
                  disabled
                />
              </div>
            </div>

            <div class="field grid">
              <div class="col-8 flex align-items-center gap-2">
                <span
                  v-if="roomType.mute_on_start_enforced"
                  class="fa-solid fa-lock"
                  v-tooltip="$t('rooms.settings.general.enforced_setting')"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
                <label for="mute_on_start_default">{{$t('rooms.settings.video_conference.mute_on_start')}}</label>
              </div>
              <div class="col-4 justify-content-center flex align-items-center">
                <InputSwitch
                  input-id="mute_on_start_default"
                  :model-value="roomType.mute_on_start_default"
                  disabled
                />
              </div>
            </div>

            <div class="field grid">
              <div class="col-8 flex align-items-center gap-2">
                <span
                  v-if="roomType.lobby_enforced"
                  class="fa-solid fa-lock"
                  v-tooltip="$t('rooms.settings.general.enforced_setting')"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
                <label for="default_role_default">{{ $t('rooms.settings.video_conference.lobby.title') }}</label>
              </div>
              <div class="col-4 justify-content-center flex align-items-center text-center">
                <span v-if="roomType.lobby_default === 0"> {{ $t('app.disabled') }}</span>
                <span v-if="roomType.lobby_default === 1"> {{ $t('app.enabled') }}</span>
                <span v-if="roomType.lobby_default === 2"> {{ $t('rooms.settings.video_conference.lobby.only_for_guests_enabled') }}</span>
              </div>
            </div>
            <div class="field grid">
              <div class="col-8 flex align-items-center gap-2">
                 <span
                   v-if="roomType.record_attendance_enforced"
                   class="fa-solid fa-lock"
                   v-tooltip="$t('rooms.settings.general.enforced_setting')"
                   :aria-label="$t('rooms.settings.general.enforced_setting')"
                 />
                <label for="record_attendance_default">{{ $t('rooms.settings.video_conference.record_attendance') }}</label>
              </div>
              <div class="col-4 justify-content-center flex align-items-center">
                <InputSwitch
                  input-id="record_attendance_default"
                  :model-value="roomType.record_attendance_default"
                  disabled
                />
              </div>
            </div>

            <h4 class="my-2" >{{ $t('rooms.settings.restrictions.title') }}</h4>
            <div class="field grid">
              <div class="col-8 flex align-items-center gap-2">
                <span
                  v-if="roomType.lock_settings_disable_cam_enforced"
                  class="fa-solid fa-lock"
                  v-tooltip="$t('rooms.settings.general.enforced_setting')"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
                <label for="lock_settings_disable_cam_default">{{$t('rooms.settings.restrictions.lock_settings_disable_cam')}}</label>
              </div>
              <div class="col-4 justify-content-center flex align-items-center">
                <InputSwitch
                  input-id="lock_settings_disable_cam_default"
                  :model-value="roomType.lock_settings_disable_cam_default"
                  disabled
                />
              </div>
            </div>

            <div class="field grid">
              <div class="col-8 flex align-items-center gap-2">
                <span
                  v-if="roomType.webcams_only_for_moderator_enforced"
                  class="fa-solid fa-lock"
                  v-tooltip="$t('rooms.settings.general.enforced_setting')"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
                <label for="webcams_only_for_moderator_default">{{$t('rooms.settings.restrictions.webcams_only_for_moderator')}}</label>
              </div>
              <div class="col-4 justify-content-center flex align-items-center">
                <InputSwitch
                  input-id="webcams_only_for_moderator_default"
                  :model-value="roomType.webcams_only_for_moderator_default"
                  disabled
                />
              </div>
            </div>

            <div class="field grid">
              <div class="col-8 flex align-items-center gap-2">
                <span
                  v-if="roomType.lock_settings_disable_mic_enforced"
                  class="fa-solid fa-lock"
                  v-tooltip="$t('rooms.settings.general.enforced_setting')"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
                <label for="lock_settings_disable_mic_default">{{$t('rooms.settings.restrictions.lock_settings_disable_mic')}}</label>
              </div>
              <div class="col-4 justify-content-center flex align-items-center">
                <InputSwitch
                  input-id="lock_settings_disable_mic_default"
                  :model-value="roomType.lock_settings_disable_mic_default"
                  disabled
                />
              </div>
            </div>

            <div class="field grid">
              <div class="col-8 flex align-items-center gap-2">
                <span
                  v-if="roomType.lock_settings_disable_public_chat_enforced"
                  class="fa-solid fa-lock"
                  v-tooltip="$t('rooms.settings.general.enforced_setting')"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
                <label for="lock_settings_disable_public_chat_default">{{$t('rooms.settings.restrictions.lock_settings_disable_public_chat')}}</label>
              </div>
              <div class="col-4 justify-content-center flex align-items-center">
                <InputSwitch
                  input-id="lock_settings_disable_public_chat_default"
                  :model-value="roomType.lock_settings_disable_public_chat_default"
                  disabled
                />
              </div>
            </div>

            <div class="field grid">
              <div class="col-8 flex align-items-center gap-2">
                <span
                  v-if="roomType.lock_settings_disable_private_chat_enforced"
                  class="fa-solid fa-lock"
                  v-tooltip="$t('rooms.settings.general.enforced_setting')"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
                <label for="lock_settings_disable_private_chat_default">{{$t('rooms.settings.restrictions.lock_settings_disable_private_chat')}}</label>
              </div>
              <div class="col-4 justify-content-center flex align-items-center">
              <InputSwitch
                  input-id="lock_settings_disable_private_chat_default"
                  :model-value="roomType.lock_settings_disable_private_chat_default"
                  disabled
                />
              </div>
            </div>

            <div class="field grid">
              <div class="col-8 flex align-items-center gap-2">
                <span
                  v-if="roomType.lock_settings_disable_note_enforced"
                  class="fa-solid fa-lock"
                  v-tooltip="$t('rooms.settings.general.enforced_setting')"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
                <label for="lock_settings_disable_public_default">{{$t('rooms.settings.restrictions.lock_settings_disable_note')}}</label>
              </div>
              <div class="col-4 justify-content-center flex align-items-center">
                <InputSwitch
                  input-id="lock_settings_disable_public_default"
                  :model-value="roomType.lock_settings_disable_note_default"
                  disabled
                />
              </div>
            </div>

            <div class="field grid">
              <div class="col-8 flex align-items-center gap-2">
                <span
                  v-if="roomType.lock_settings_hide_user_list_enforced"
                  class="fa-solid fa-lock"
                  v-tooltip="$t('rooms.settings.general.enforced_setting')"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
                <label for="lock_settings_hide_user_list_default">{{$t('rooms.settings.restrictions.lock_settings_hide_user_list')}}</label>
              </div>
              <div class="col-4 justify-content-center flex align-items-center">
              <InputSwitch
                  input-id="lock_settings_hide_user_list_default"
                  :model-value="roomType.lock_settings_hide_user_list_default"
                  disabled
                />
              </div>
            </div>

            <h4 class="my-2">{{ $t('rooms.settings.participants.title') }}</h4>
            <div class="field grid">
              <div class="col-8 flex align-items-center gap-2">
                <span
                  v-if="roomType.allow_membership_enforced"
                  class="fa-solid fa-lock"
                  v-tooltip="$t('rooms.settings.general.enforced_setting')"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
                <label for="allow_membership_default">{{$t('rooms.settings.participants.allow_membership')}}</label>
              </div>
              <div class="col-4 justify-content-center flex align-items-center">
              <InputSwitch
                  input-id="allow_membership_default"
                  :model-value="roomType.allow_membership_default"
                  disabled
                />
              </div>
            </div>

            <div class="field grid">
              <div class="col-8 flex align-items-center gap-2">
                 <span
                   v-if="roomType.default_role_enforced"
                   class="fa-solid fa-lock"
                   v-tooltip="$t('rooms.settings.general.enforced_setting')"
                   :aria-label="$t('rooms.settings.general.enforced_setting')"
                 />
                <label for="default_role_default">{{ $t('rooms.settings.participants.default_role.title') }} {{ $t('rooms.settings.participants.default_role.only_logged_in') }}</label>
              </div>
              <div class="col-4 justify-content-center flex align-items-center">
                <RoomRoleBadge :role="roomType.default_role_default"/>
              </div>
            </div>

            <h4 class="my-2">{{ $t('rooms.settings.advanced.title') }}</h4>

            <div class="field grid">
              <div class="col-8 flex align-items-center gap-2">
                <span
                  v-if="roomType.visibility_enforced"
                  class="fa-solid fa-lock"
                  v-tooltip="$t('rooms.settings.general.enforced_setting')"
                  :aria-label="$t('rooms.settings.general.enforced_setting')"
                />
                <label for="visibility_default">{{ $t('rooms.settings.advanced.visibility.title') }}</label>
              </div>
              <div class="col-4 justify-content-center flex align-items-center">
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

<style scoped>

</style>
