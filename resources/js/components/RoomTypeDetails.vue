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
            <div v-for="settingGroup in roomTypeSettings" :key="settingGroup.title">
              <h4 class="my-2">{{ settingGroup.title }}</h4>
              <RoomTypeSettingsField
                v-for="setting in settingGroup.settings"
                :key="setting.key"
                :value="roomType[setting.key+'_default']"
                :enforced="roomType[setting.key+'_enforced']"
                :label="setting.label"
                :type="setting.type"
                :options="setting.options"
              />
            </div>

          </AccordionTab>
        </Accordion>
      </div>
    </div>

  </div>
</template>

<script setup>
import { useRoomTypeSettings } from '../composables/useRoomTypeSettings.js';

const roomTypeSettings = useRoomTypeSettings();

defineProps({
  roomType: {
    type: Object,
    required: true
  }
});
</script>
