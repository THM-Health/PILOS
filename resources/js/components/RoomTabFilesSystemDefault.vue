<template>
  <div
    data-test="room-file-system-default"
    class="flex flex-col justify-between gap-4 rounded p-4 shadow outline-3 outline-surface-200 md:flex-row dark:outline-surface-700"
  >
    <div class="flex flex-col gap-2">
      <div class="flex flex-col gap-2 md:flex-row md:items-center">
        <p class="text-word-break m-0 text-lg font-semibold">
          {{ $t("rooms.files.system_default") }}
        </p>
        <div>
          <Tag
            v-if="preferAsDefault"
            severity="warn"
            :value="$t('rooms.files.default')"
          >
            <template #icon>
              <CircleNumberIcon
                :number="1"
                data-test="room-file-system-default-priority"
              />
            </template>
          </Tag>
          <Tag
            v-else-if="defaultFile === null"
            severity="info"
            :value="$t('rooms.files.default_automatic')"
          >
            <template #icon>
              <CircleNumberIcon
                :number="1"
                data-test="room-file-system-default-priority"
              />
            </template>
          </Tag>
        </div>
      </div>
      <div
        v-if="defaultFile === null && !preferAsDefault"
        class="flex flex-row items-center gap-2"
      >
        <i class="fa-solid fa-circle-info"></i>
        <p class="m-0 text-sm">
          {{ $t("rooms.files.system_default_fallback_description") }}
        </p>
      </div>

      <div class="flex flex-col items-start gap-2">
        <div class="flex flex-row items-center gap-2">
          <i class="fa-solid fa-chalkboard-user"></i>
          <p class="m-0 flex flex-col gap-2 text-sm">
            <Tag
              v-if="useInMeeting"
              severity="success"
              :value="$t('rooms.files.always_available_in_meeting')"
            />
            <Tag
              v-else-if="defaultFile === null"
              severity="info"
              :value="$t('rooms.files.available_in_next_meeting_automatic')"
            />
            <Tag
              v-else
              severity="secondary"
              :value="$t('rooms.files.not_available_in_next_meeting')"
            />
          </p>
        </div>
      </div>
    </div>

    <div class="flex shrink-0 flex-row items-start justify-end gap-1">
      <RoomTabFilesSystemDefaultDefaultButton
        :room-id="roomId"
        :use-in-meeting="useInMeeting"
        :prefer-as-default="preferAsDefault"
        :default-file="defaultFile"
        @edited="$emit('edited')"
        @system-default-presentation-not-set="
          $emit('systemDefaultPresentationNotSet')
        "
      />

      <!-- view -->
      <Button
        v-tooltip="$t('rooms.files.view')"
        :aria-label="$t('rooms.files.view')"
        target="_blank"
        icon="fa-solid fa-eye"
        data-test="room-files-view-system-default-button"
        as="a"
        :href="file"
      />

      <RoomTabFilesSystemDefaultConfigureButton
        :room-id="roomId"
        :use-in-meeting="useInMeeting"
        @edited="$emit('edited')"
        @system-default-presentation-not-set="
          $emit('systemDefaultPresentationNotSet')
        "
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
  useInMeeting: {
    type: Boolean,
    default: false,
  },
  preferAsDefault: {
    type: Boolean,
    default: false,
  },
  defaultFile: {
    type: Object,
    default: null,
  },
});

defineEmits(["edited", "systemDefaultPresentationNotSet"]);
</script>
