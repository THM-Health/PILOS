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
          <RoomSettingEnforcedIcon v-if="currentSettings.room_type.has_access_code_enforced"/>
        </div>
        <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
        <div class="col-3 flex align-items-center justify-content-center">
          <InputSwitch
            input-id="has_access_code"
            :model-value="getResultingSetting('has_access_code')"
            disabled
          />
        </div>
        <div class="col-2 flex align-items-center justify-content-center">
          <RoomSettingEnforcedIcon v-if="newRoomType.has_access_code_enforced"/>
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
          <RoomSettingEnforcedIcon v-if="currentSettings.room_type.allow_guests_enforced"/>
        </div>
        <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
        <div class="col-3 flex justify-content-center align-items-center">
          <InputSwitch
            input-id="allow_guests_default"
            :model-value="getResultingSetting('allow_guests')"
            disabled
          />
        </div>
        <div class="col-2 flex justify-content-center align-items-center">
          <RoomSettingEnforcedIcon v-if="newRoomType.allow_guests_enforced"/>
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
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.everyone_can_start_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="everyone_can_start_default"
              :model-value="getResultingSetting('everyone_can_start')"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.everyone_can_start_enforced"/>
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
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.mute_on_start_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="mute_on_start_default"
              :model-value="getResultingSetting('mute_on_start')"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.mute_on_start_enforced"/>
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
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.lobby_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center text-center">
            <span v-if="getResultingSetting('lobby') === 0"> {{ $t('app.disabled') }}</span>
            <span v-if="getResultingSetting('lobby') === 1"> {{ $t('app.enabled') }}</span>
            <span v-if="getResultingSetting('lobby') === 2"> {{ $t('rooms.settings.video_conference.lobby.only_for_guests_enabled') }}</span>
          </div>
          <div class="col-2 flex align-items-center justify-content-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.lobby_enforced"/>
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
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.record_attendance_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="record_attendance"
              :model-value="getResultingSetting('record_attendance')"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.record_attendance_enforced"/>
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
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.lock_settings_disable_cam_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="lock_settings_disable_cam_default"
              :model-value="getResultingSetting('lock_settings_disable_cam')"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.lock_settings_disable_cam_enforced"/>
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
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.webcams_only_for_moderator_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="webcams_only_for_moderator_default"
              :model-value="getResultingSetting('webcams_only_for_moderator')"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.webcams_only_for_moderator_enforced"/>
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
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.lock_settings_disable_mic_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="lock_settings_disable_mic_default"
              :model-value="getResultingSetting('lock_settings_disable_mic')"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.lock_settings_disable_mic_enforced"/>
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
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.lock_settings_disable_public_chat_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="lock_settings_disable_public_chat_default"
              :model-value="getResultingSetting('lock_settings_disable_public_chat')"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.lock_settings_disable_public_chat_enforced"/>
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
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.lock_settings_disable_private_chat_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="lock_settings_disable_private_chat_default"
              :model-value="getResultingSetting('lock_settings_disable_private_chat')"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.lock_settings_disable_private_chat_enforced"/>
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
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.lock_settings_disable_note_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              :model-value="getResultingSetting('lock_settings_disable_note')"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.lock_settings_disable_note_enforced"/>
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
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.lock_settings_hide_user_list_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="lock_settings_hide_user_list_default"
              :model-value="getResultingSetting('lock_settings_hide_user_list')"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.lock_settings_hide_user_list_enforced"/>
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
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.allow_membership_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <InputSwitch
              input-id="allow_membership_default"
              :model-value="getResultingSetting('allow_membership')"
              disabled
            />
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.allow_membership_enforced"/>
          </div>
        </div>

        <div class="field grid mx-0">
          <label for="default_role_default" class="col-12">{{ $t('rooms.settings.participants.default_role.title') }} {{ $t('rooms.settings.participants.default_role.only_logged_in') }}</label>
          <div class="col-3 flex justify-content-center align-items-center">
            <RoomRoleBadge :role="currentSettings.default_role"/>
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.default_role_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <RoomRoleBadge :role="getResultingSetting('default_role')"/>
          </div>
          <div class="col-2 flex justify-content-center align-items-center">
            <RoomSettingEnforcedIcon v-if="newRoomType.default_role_enforced"/>
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
            <RoomSettingEnforcedIcon v-if="currentSettings.room_type.visibility_enforced"/>
          </div>
          <div class="col-2 fa-solid fa-arrow-right flex align-items-center justify-content-center"/>
          <div class="col-3 flex justify-content-center align-items-center">
            <span v-if="getResultingSetting('visibility') === 0"> {{ $t('rooms.settings.advanced.visibility.private') }} </span>
            <span v-if="getResultingSetting('visibility') === 1"> {{ $t('rooms.settings.advanced.visibility.public') }} </span>
          </div>
          <div class="col-2 flex justify-content-center align_items_center">
            <RoomSettingEnforcedIcon v-if="newRoomType.visibility_enforced"/>
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
      <div class="flex  justify-content-end w-full gap-2">
        <Button :label="$t('app.cancel')" severity="secondary" @click="modalVisible = false" />
        <Button :label="$t('app.save')" @click="emit('confirmedRoomTypeChange', resetToDefaults);" />
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

</script>
