<template>
  <a
    target="_blank"
    :href="downloadUrl"
    class="p-button p-button-icon-only p-button-info"
    :class="{ 'p-disabled': props.disabled}"
    :aria-label="$t('rooms.recordings.download')"
    v-tooltip:top="$t('rooms.recordings.download')"
  >
    <i class="fa-solid fa-download" />
  </a>
</template>
<script setup>

import { useSettingsStore } from '../stores/settings.js';
import { computed } from 'vue';

const settingsStore = useSettingsStore();

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  recordingId: {
    type: String,
    required: true
  }
});

const downloadUrl = computed(() => {
  if (props.disabled) { return null; }
  return settingsStore.getSetting('base_url') + '/download/recording/' + props.recordingId;
});

</script>
