<template>
  <InputGroup v-if="model">
    <InputText :value="model.name" readonly />
    <Button icon="fa-solid fa-edit" @click="editRoomType" :aria-label="$t('rooms.change_type.title')" />
  </InputGroup>

  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('rooms.change_type.title')"
    :style="{ width: '900px' }"
    :breakpoints="{ '975px': '90vw' }"
    :draggable="false"
    :dismissableMask="false"
  >
    <RoomTypeSelect
      ref="roomTypeSelect"
      v-model="newRoomType"
    />

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <Button :label="$t('app.cancel')" severity="secondary" @click="modalVisible = false" />
        <Button :label="$t('app.save')" :disabled="!newRoomType" @click="handleOk" />
      </div>
    </template>
  </Dialog>

<!--  ToDo move outside-->
  <Dialog
    v-model:visible="confirmationModalVisible"
    :header="$t('rooms.change_type.title')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :dismissableMask="false"
    modal
  >
    <div class="overflow-y-auto" style="max-height:300px">
      {{ $t('rooms.change_type.changing_settings') }} <!-- ToDo improve text -->
      <h4 class="my-2">{{ $t('rooms.settings.general.title') }}</h4>

      <!-- ToDo fix labels, ids ... (aria-labelledby)-->
      <div class="field grid mx-0">
        <label for="has_access_code" class="col-12">{{ $t('rooms.settings.general.has_access_code') }}</label>
        <div class="col-3 flex align-items-center justify-content-center">
          <InputSwitch
            input-id="has_access_code"
            :model-value="currentSettings.access_code !== null"
            disabled
          />
        </div>
        <div class="col-2 flex align-items-center justify-content-center">
          <span
            v-if="currentSettings.room_type.has_access_code_enforced"
            class="fa-solid fa-lock"
            v-tooltip="$t('rooms.settings.general.enforced_setting')"
            :aria-label="$t('rooms.settings.general.enforced_setting')"
          />
        </div>
        <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
        <div class="col-3 flex align-items-center justify-content-center">
          <InputSwitch
            input-id="has_access_code"
            :model-value="newRoomType.has_access_code_default"
            disabled
          />
        </div>
        <div class="col-2 flex align-items-center justify-content-center">
          <span
            v-if="newRoomType.has_access_code_enforced"
            class="fa-solid fa-lock"
            v-tooltip="$t('rooms.settings.general.enforced_setting')"
            :aria-label="$t('rooms.settings.general.enforced_setting')"
          />
        </div>

      </div>

      <div class="field grid mx-0">
        <label for="allow_guests_default" class="col-12">{{$t('rooms.settings.general.allow_guests')}}</label>
        <div class="col-3 flex justify-content-center align-items-center">
          <InputSwitch
            input-id="allow_guests_default"
            :model-value="currentSettings.allow_guests"
            disabled
          />
        </div>
        <div class="col-2 flex justify-content-center align-items-center">
          <span
            v-if="currentSettings.room_type.allow_guests_enforced"
            class="fa-solid fa-lock"
            v-tooltip="$t('rooms.settings.general.enforced_setting')"
            :aria-label="$t('rooms.settings.general.enforced_setting')"
          />
        </div>
        <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
        <div class="col-3 flex justify-content-center align-items-center">
          <InputSwitch
            input-id="allow_guests_default"
            :model-value="newRoomType.allow_guests_default"
            disabled
          />
        </div>
        <div class="col-2 flex justify-content-center align-items-center">
         <span
           v-if="newRoomType.allow_guests_enforced"
           class="fa-solid fa-lock"
           v-tooltip="$t('rooms.settings.general.enforced_setting')"
           :aria-label="$t('rooms.settings.general.enforced_setting')"
         />
        </div>
      </div>

      <div v-if="currentSettings.expert_mode">
        <h4 class="my-2">{{ $t('rooms.settings.video_conference.title') }}</h4>

        <div class="field grid mx-0">
          <label for="everyone_can_start_default" class="col-12">{{$t('rooms.settings.video_conference.everyone_can_start')}}</label>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="everyone_can_start_default"
              :model-value="currentSettings.everyone_can_start"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="currentSettings.room_type.everyone_can_start_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="everyone_can_start_default"
              :model-value="newRoomType.everyone_can_start_default"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="newRoomType.everyone_can_start_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
        </div>

        <div class="field grid mx-0">
          <label for="mute_on_start_default" class="col-12">{{$t('rooms.settings.video_conference.mute_on_start')}}</label>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="mute_on_start_default"
              :model-value="currentSettings.mute_on_start"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="currentSettings.room_type.mute_on_start_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="mute_on_start_default"
              :model-value="newRoomType.mute_on_start_default"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="newRoomType.mute_on_start_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
        </div>

        <div class="field grid mx-0">
          <label for="default_role_default" class="col-12">{{ $t('rooms.settings.video_conference.lobby.title') }}</label>
          <div class="col-3 flex align-items-center justify-content-center text-center">
            <span v-if="currentSettings.lobby === 0"> {{ $t('app.disabled') }}</span>
            <span v-if="currentSettings.lobby === 1"> {{ $t('app.enabled') }}</span>
            <span v-if="currentSettings.lobby === 2"> {{ $t('rooms.settings.video_conference.lobby.only_for_guests_enabled') }}</span>
          </div>
          <div class="col-2 flex align-items-center justify-content-center">
            <span
              v-if="currentSettings.room_type.lobby_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center text-center">
            <span v-if="newRoomType.lobby_default === 0"> {{ $t('app.disabled') }}</span>
            <span v-if="newRoomType.lobby_default === 1"> {{ $t('app.enabled') }}</span>
            <span v-if="newRoomType.lobby_default === 2"> {{ $t('rooms.settings.video_conference.lobby.only_for_guests_enabled') }}</span>
          </div>
          <div class="col-2 flex align-items-center justify-content-center">
            <span
              v-if="newRoomType.lobby_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
        </div>

        <div class="field grid mx-0">
          <label for="record_attendance" class="col-12">{{ $t('rooms.settings.video_conference.record_attendance') }}</label>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="record_attendance"
              :model-value="currentSettings.record_attendance"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="currentSettings.room_type.record_attendance_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="record_attendance"
              :model-value="newRoomType.record_attendance_default"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="newRoomType.record_attendance_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
        </div>

        <h4 class="my-2" >{{ $t('rooms.settings.restrictions.title') }}</h4>
        <div class="field grid mx-0">
          <label for="lock_settings_disable_cam_default" class="col-12">{{$t('rooms.settings.restrictions.lock_settings_disable_cam')}}</label>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="lock_settings_disable_cam_default"
              :model-value="currentSettings.lock_settings_disable_cam"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="currentSettings.room_type.lock_settings_disable_cam_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="lock_settings_disable_cam_default"
              :model-value="newRoomType.lock_settings_disable_cam_default"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="newRoomType.lock_settings_disable_cam_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
        </div>

        <div class="field grid mx-0">
          <label for="webcams_only_for_moderator_default" class="col-12">{{$t('rooms.settings.restrictions.webcams_only_for_moderator')}}</label>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="webcams_only_for_moderator_default"
              :model-value="currentSettings.webcams_only_for_moderator"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="currentSettings.room_type.webcams_only_for_moderator_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="webcams_only_for_moderator_default"
              :model-value="newRoomType.webcams_only_for_moderator_default"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="newRoomType.webcams_only_for_moderator_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
        </div>

        <div class="field grid mx-0">
          <label for="lock_settings_disable_mic_default" class="col-12">{{$t('rooms.settings.restrictions.lock_settings_disable_mic')}}</label>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="lock_settings_disable_mic_default"
              :model-value="currentSettings.lock_settings_disable_mic"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="currentSettings.room_type.lock_settings_disable_mic_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="lock_settings_disable_mic_default"
              :model-value="newRoomType.lock_settings_disable_mic_default"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="newRoomType.lock_settings_disable_mic_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
        </div>

        <div class="field grid mx-0">
          <label for="lock_settings_disable_public_chat_default" class="col-12">{{$t('rooms.settings.restrictions.lock_settings_disable_public_chat')}}</label>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="lock_settings_disable_public_chat_default"
              :model-value="currentSettings.lock_settings_disable_public_chat"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="currentSettings.room_type.lock_settings_disable_public_chat_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="lock_settings_disable_public_chat_default"
              :model-value="newRoomType.lock_settings_disable_public_chat_default"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="newRoomType.lock_settings_disable_public_chat_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
        </div>

        <div class="field grid mx-0">
          <label for="lock_settings_disable_private_chat_default" class="col-12">{{$t('rooms.settings.restrictions.lock_settings_disable_private_chat')}}</label>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="lock_settings_disable_private_chat_default"
              :model-value="currentSettings.lock_settings_disable_private_chat"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="currentSettings.room_type.lock_settings_disable_private_chat_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="lock_settings_disable_private_chat_default"
              :model-value="newRoomType.lock_settings_disable_private_chat_default"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="newRoomType.lock_settings_disable_private_chat_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
        </div>

        <div class="field grid mx-0">
          <label for="lock_settings_disable_public_default" class="col-12">{{$t('rooms.settings.restrictions.lock_settings_disable_note')}}</label>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="lock_settings_disable_public_default"
              :model-value="currentSettings.lock_settings_disable_note"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="currentSettings.room_type.lock_settings_disable_note_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="lock_settings_disable_public_default"
              :model-value="newRoomType.lock_settings_disable_note_default"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="newRoomType.lock_settings_disable_note_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
        </div>

        <div class="field grid mx-0">
          <label for="lock_settings_hide_user_list_default" class="col-12">{{$t('rooms.settings.restrictions.lock_settings_hide_user_list')}}</label>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="lock_settings_hide_user_list_default"
              :model-value="currentSettings.lock_settings_hide_user_list"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="currentSettings.room_type.lock_settings_hide_user_list_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="lock_settings_hide_user_list_default"
              :model-value="newRoomType.lock_settings_hide_user_list_default"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="newRoomType.lock_settings_hide_user_list_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
        </div>

        <h4 class="my-2">{{$t('rooms.settings.participants.title')}}</h4>
        <div class="field grid mx-0">
          <label for="allow_membership_default" class="col-12">{{$t('rooms.settings.participants.allow_membership')}}</label>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="allow_membership_default"
              :model-value="currentSettings.allow_membership"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="currentSettings.room_type.allow_membership_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="allow_membership_default"
              :model-value="newRoomType.allow_membership_default"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="newRoomType.allow_membership_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
        </div>

        <div class="field grid mx-0">
          <label for="default_role_default" class="col-12">{{ $t('rooms.settings.participants.default_role.title') }} {{ $t('rooms.settings.participants.default_role.only_logged_in') }}</label>
          <div class="col-3 flex justify-content-center align-items-center">
            <RoomRoleBadge :role="currentSettings.default_role"/>
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="currentSettings.room_type.default_role_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <RoomRoleBadge :role="newRoomType.default_role_default"/>
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="newRoomType.default_role_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
        </div>
        <h4 class="my-2">{{$t('rooms.settings.advanced.title')}}</h4>
        <div class="field grid mx-0">
          <label for="visibility" class="col-12">{{ $t('rooms.settings.advanced.visibility.title') }}</label>
          <div class="col-3 flex justify-content-center align-items-center">
            <span v-if="currentSettings.visibility === 0"> {{ $t('rooms.settings.advanced.visibility.private') }} </span>
            <span v-if="currentSettings.visibility === 1"> {{ $t('rooms.settings.advanced.visibility.public') }} </span>
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <span
              v-if="currentSettings.room_type.visibility_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <span v-if="newRoomType.visibility_default === 0"> {{ $t('rooms.settings.advanced.visibility.private') }} </span>
            <span v-if="newRoomType.visibility_default === 1"> {{ $t('rooms.settings.advanced.visibility.public') }} </span>
          </div>
          <div class="col-2 flex justify-content-center align_items_center">
            <span
              v-if="newRoomType.visibility_enforced"
              class="fa-solid fa-lock"
              v-tooltip="$t('rooms.settings.general.enforced_setting')"
              :aria-label="$t('rooms.settings.general.enforced_setting')"
            />
          </div>
        </div>
      </div>
    </div>
    <Divider class="mt-0"/>
    <div class="flex align-items-center gap-2">
      <InputSwitch
        input-id="reset_to_defaults"
        v-model="resetToDefaults"
      />
      <label for="reset_to_defaults"> {{$t('rooms.change_type.reset_to_default')}}</label>
    </div>
    <template #footer>
<!--      ToDo fix-->
      <div class="flex  justify-content-end w-full gap-2">
        <Button :label="$t('app.cancel')" severity="secondary" @click="confirmationModalVisible = false" />
        <Button :label="$t('app.save')" @click="changeRoomType(resetToDefaults)" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref } from 'vue';
import _ from 'lodash';
const model = defineModel();

const emit = defineEmits(['resetSettings']);
const props = defineProps({
  currentSettings: {
    type: Object,
    required: true
  }
});

const modalVisible = ref(false);
const confirmationModalVisible = ref(false);

const newRoomType = ref(null);
const resetToDefaults = ref(false);

function editRoomType () {
  newRoomType.value = _.cloneDeep(model.value);
  modalVisible.value = true;
}

function handleOk () {
  // ToDo only show if a setting changed
  if (props.currentSettings.expert_mode || roomSettingChanged('allow_guests')) {
    resetToDefaults.value = false;
    confirmationModalVisible.value = true;
  } else {
    changeRoomType();
  }
}

function roomSettingChanged (settingName) {
  if (props.currentSettings[settingName] !== newRoomType.value[settingName + '_default']) {
    return true;
  }
  if (props.currentSettings.room_type[settingName + '_enforced'] !== newRoomType.value[settingName + '_enforced']) {
    return true;
  }

  return false;
}

function changeRoomType (resetToDefaults = false) {
  model.value = _.cloneDeep(newRoomType.value);
  modalVisible.value = false;
  confirmationModalVisible.value = false;

  emit('resetSettings', resetToDefaults);
}

</script>
