<template>
  <Tag
    class="flex-shrink-1 text-break"
    style="white-space: normal"
    :pt="{
        root: { class: accessType.class }
    }"
  >
    {{ accessType.description }}
  </Tag>
</template>

<script setup>

import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps([
  'access'
]);

const accessType = computed(() => {
  switch (props.access) {
    case 0:
      return {
        description: t('rooms.recordings.access_types.everyone'),
        class: 'room-recording-access-badge room-access-everyone'
      };
    case 1:
      return {
        description: t('rooms.recordings.access_types.participant'),
        class: 'room-recording-access-badge room-access-participant'
      };
    case 2:
      return {
        description: t('rooms.recordings.access_types.moderator'),
        class: 'room-recording-access-badge room-access-moderator'
      };
    case 3:
      return {
        description: t('rooms.recordings.access_types.owner'),
        class: 'room-recording-access-badge room-access-owner'
      };
    default:
      return {
        description: '',
        class: ''
      };
  }
});

</script>
