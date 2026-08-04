<template>
  <Button
    v-tooltip:top="$t('rooms.recordings.download')"
    :as="props.disabled ? 'button' : 'a'"
    target="_blank"
    :href="downloadUrl"
    severity="help"
    icon="fa-solid fa-download"
    :disabled="props.disabled"
    :aria-label="
      $t('rooms.recordings.download_aria', { description: props.description })
    "
    data-test="room-recordings-download-button"
  />
</template>
<script setup>
import { useSettingsStore } from "../stores/settings.js";
import { computed } from "vue";

const settingsStore = useSettingsStore();

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  recordingId: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

const downloadUrl = computed(() => {
  return (
    settingsStore.getSetting("general.base_url") +
    "/download/recording/" +
    props.recordingId
  );
});
</script>
