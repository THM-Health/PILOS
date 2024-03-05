<template>
  <a
    target="_blank"
    :href="downloadUrl"
    class="p-button p-button-icon-only"
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

const props = defineProps([
  'recordingId'
]);

const downloadUrl = computed(() => {
  return settingsStore.getSetting('base_url') + '/download/recording/' + props.recordingId;
});

</script>
