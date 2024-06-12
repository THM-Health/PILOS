<template>
  <div class="flex flex-column gap-2 w-full" style="height: 250px" data-test="room-type-details">
    <RoomTypeBadge :roomType="roomType" class="w-full text-base" />

    <div class="overflow-y-auto w-full">
      <div class="flex flex-column gap-2 border-1 border-200 border-round p-3">

        <!-- Description for the room type -->
        <span class="font-bold">{{ $t('app.description') }}</span>
        <div style="word-break: normal; overflow-wrap: anywhere;">{{roomType.description? roomType.description: $t('settings.room_types.missing_description')}}</div>

        <!-- Information about the default and enforced room settings for the room type -->
        <Accordion>
          <AccordionTab
            :header="$t('settings.room_types.default_room_settings.title')"
            :pt="{
              headerAction: {
                class: 'pl-0'
              }
            }"
          >

            <!-- Show all room setting grouped by category -->
            <div v-for="setting in settings" :key="setting.title">
              <h4 class="my-2">{{ setting.title }}</h4>
              <RoomTypeSettingsField
                v-for="field in setting.settings"
                :key="field.key"
                :id="field.key"
                :value="roomType[field.key+'_default']"
                :enforced="roomType[field.key+'_enforced']"
                :label="field.label"
                :roomType="roomType"
                :type="field.type"
                :options="field.options"
              />
            </div>

          </AccordionTab>
        </Accordion>
      </div>
    </div>

  </div>
</template>

<script setup>

import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps({
  roomType: {
    type: Object,
    required: true
  }
});

const settings = computed(() => {
  return [
    {
      title: t('rooms.settings.general.title'),
      settings: [
        {
          key: 'has_access_code',
          label: t('rooms.settings.general.has_access_code'),
          type: 'switch'
        },
        {
          key: 'allow_guests',
          label: t('rooms.settings.general.allow_guests'),
          type: 'switch'
        }
      ]
    },
    {
      title: t('rooms.settings.video_conference.title'),
      settings: [
        {
          key: 'everyone_can_start',
          label: t('rooms.settings.video_conference.everyone_can_start'),
          type: 'switch'
        },
        {
          key: 'mute_on_start',
          label: t('rooms.settings.video_conference.mute_on_start'),
          type: 'switch'
        },
        {
          key: 'lobby',
          label: t('rooms.settings.video_conference.lobby.title'),
          type: 'select',
          options: {
            0: t('app.disabled'),
            1: t('app.enabled'),
            2: t('rooms.settings.video_conference.lobby.only_for_guests_enabled')
          }
        }
      ]
    },
    {
      title: t('rooms.settings.recordings.title'),
      settings: [
        {
          key: 'record_attendance',
          label: t('rooms.settings.recordings.record_attendance'),
          type: 'switch'
        },
        {
          key: 'record',
          label: t('rooms.settings.recordings.record_video_conference'),
          type: 'switch'
        },
        {
          key: 'auto_start_recording',
          label: t('rooms.settings.recordings.auto_start_recording'),
          type: 'switch'
        }
      ]
    },
    {
      title: t('rooms.settings.restrictions.title'),
      settings: [
        {
          key: 'lock_settings_disable_cam',
          label: t('rooms.settings.restrictions.lock_settings_disable_cam'),
          type: 'switch'
        },
        {
          key: 'webcams_only_for_moderator',
          label: t('rooms.settings.restrictions.webcams_only_for_moderator'),
          type: 'switch'
        },
        {
          key: 'lock_settings_disable_mic',
          label: t('rooms.settings.restrictions.lock_settings_disable_mic'),
          type: 'switch'
        },
        {
          key: 'lock_settings_disable_public_chat',
          label: t('rooms.settings.restrictions.lock_settings_disable_public_chat'),
          type: 'switch'
        },
        {
          key: 'lock_settings_disable_private_chat',
          label: t('rooms.settings.restrictions.lock_settings_disable_private_chat'),
          type: 'switch'
        },
        {
          key: 'lock_settings_disable_note',
          label: t('rooms.settings.restrictions.lock_settings_disable_note'),
          type: 'switch'
        },
        {
          key: 'lock_settings_hide_user_list',
          label: t('rooms.settings.restrictions.lock_settings_hide_user_list'),
          type: 'switch'
        }
      ]
    },
    {
      title: t('rooms.settings.participants.title'),
      settings: [
        {
          key: 'allow_membership',
          label: t('rooms.settings.participants.allow_membership'),
          type: 'switch'
        },
        {
          key: 'default_role',
          label: t('rooms.settings.participants.default_role.title'),
          type: 'select',
          options: {
            1: t('rooms.roles.participant'),
            2: t('rooms.roles.moderator')
          }
        }
      ]
    },
    {
      title: t('rooms.settings.advanced.title'),
      settings: [
        {
          key: 'visibility',
          label: t('rooms.settings.advanced.visibility.title'),
          type: 'select',
          options: {
            0: t('rooms.settings.advanced.visibility.private'),
            1: t('rooms.settings.advanced.visibility.public')
          }
        }
      ]
    }
  ];
});

</script>
