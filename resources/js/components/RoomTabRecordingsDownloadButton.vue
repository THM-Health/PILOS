<template>
  <a
    target="_blank"
    :href="downloadUrl"
    class="p-button p-button-icon-only p-button-info"
    :class="{ 'p-disabled': props.disabled}"
    :aria-label="$t('rooms.recordings.download')"
    v-tooltip:top="$t('rooms.recordings.download')"
  >
    <span class="p-button-icon fa-solid fa-download" />
    <span class="p-button-label" data-pc-section="label">&nbsp;</span>
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
  return settingsStore.getSetting('general.base_url') + '/download/recording/' + props.recordingId;
});

</script>
