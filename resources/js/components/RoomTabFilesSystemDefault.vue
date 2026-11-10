<template>
  <div
    data-test="room-file-system-default"
    class="flex flex-col justify-between gap-4 rounded p-4 shadow outline-3 outline-surface-200 md:flex-row dark:outline-surface-700"
  >
    <div class="flex flex-col gap-2">
      <p class="text-word-break m-0 text-lg font-semibold">
        {{ $t("rooms.files.system_default") }}
      </p>
      <div v-if="preferAsStart">
        <Tag
          severity="info"
          icon="fa-solid fa-crown"
          :value="$t('rooms.files.start_file')"
        />
      </div>

      <div class="flex flex-col items-start gap-2">
        <div class="flex flex-row items-center gap-2">
          <i class="fa-solid fa-chalkboard-user"></i>
          <p class="m-0 flex flex-col gap-2 text-sm">
            <Tag
              severity="success"
              :value="$t('rooms.files.available_in_next_meeting')"
            />
          </p>
        </div>
      </div>
    </div>

    <div class="flex shrink-0 flex-row items-start justify-end gap-1">
      <RoomTabFilesStartFileButton
        v-if="!preferAsStart"
        :room-id="roomId"
        :file-id="null"
        :disabled="disabled"
        @edited="$emit('edited')"
        @system-default-presentation-not-set="
          $emit('systemDefaultPresentationNotSet')
        "
      />

      <!-- download -->
      <Button
        v-tooltip="$t('rooms.files.download')"
        :aria-label="$t('rooms.files.download')"
        target="_blank"
        :disabled="disabled"
        icon="fa-solid fa-download"
        data-test="room-files-download-system-default-button"
        :as="disabled ? 'button' : 'a'"
        :href="file"
      />
    </div>
  </div>

  <Divider />
</template>
<script setup>
defineProps({
  file: {
    type: String,
    default: null,
  },
  roomId: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  preferAsStart: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["edited", "systemDefaultPresentationNotSet"]);
</script>
