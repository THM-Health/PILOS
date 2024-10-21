<template>
  <div class="flex w-full flex-col gap-4" data-test="room-type-details">
    <h3><RoomTypeBadge :room-type="roomType" class="w-full text-base" /></h3>

    <div class="w-full">
      <div
        class="flex flex-col gap-2 border border-surface-200 p-4 rounded-border md:max-h-64 md:overflow-y-auto dark:border-surface-600"
      >
        <!-- Description for the room type -->
        <span class="font-bold">{{ $t("app.description") }}</span>
        <div style="word-break: normal; overflow-wrap: anywhere">
          {{
            roomType.description
              ? roomType.description
              : $t("admin.room_types.missing_description")
          }}
        </div>

        <!-- Information about the default and enforced room settings for the room type -->
        <Accordion
          class="mt-4"
          expand-icon="fa-solid fa-plus"
          collapse-icon="fa-solid fa-minus"
        >
          <AccordionPanel value="0" class="border-0">
            <AccordionHeader
              class="bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700"
              data-test="show-default-settings-button"
              >{{
                $t("admin.room_types.default_room_settings.title")
              }}</AccordionHeader
            >
            <AccordionContent
              class="rounded-b border-x border-b border-surface"
            >
              <!-- Show all room setting grouped by category -->
              <div
                v-for="settingGroup in roomTypeSettings"
                :key="settingGroup.title"
              >
                <h4 class="my-2 font-bold">{{ settingGroup.title }}</h4>
                <RoomTypeSettingsField
                  v-for="setting in settingGroup.settings"
                  :key="setting.key"
                  :data-test="'room-type-' + setting.key + '-setting'"
                  :value="roomType[setting.key + '_default']"
                  :enforced="roomType[setting.key + '_enforced']"
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
import { useRoomTypeSettings } from "../composables/useRoomTypeSettings.js";

const roomTypeSettings = useRoomTypeSettings();

defineProps({
  roomType: {
    type: Object,
    required: true,
  },
});
</script>
