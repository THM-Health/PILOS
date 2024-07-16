<template>
  <div class="flex flex-col gap-4 w-full"  data-test="room-type-details">
    <RoomTypeBadge :roomType="roomType" class="w-full text-base" />

    <div class="w-full">
      <div class="flex flex-col gap-2 border border-surface-200 dark:border-surface-600 rounded-border p-4  md:overflow-y-auto md:max-h-64">

        <!-- Description for the room type -->
        <span class="font-bold">{{ $t('app.description') }}</span>
        <div style="word-break: normal; overflow-wrap: anywhere;">{{roomType.description? roomType.description: $t('admin.room_types.missing_description')}}</div>

        <!-- Information about the default and enforced room settings for the room type -->
        <Accordion>
          <AccordionPanel value="0" class="border-0">
            <AccordionHeader class="px-0">{{ $t('admin.room_types.default_room_settings.title') }}</AccordionHeader>
            <AccordionContent class="border-surface border rounded-border">

              <!-- Show all room setting grouped by category -->
              <div v-for="settingGroup in roomTypeSettings" :key="settingGroup.title" >
                <h4 class="my-2 font-bold">{{ settingGroup.title }}</h4>
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
            </AccordionContent>
          </AccordionPanel>
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
