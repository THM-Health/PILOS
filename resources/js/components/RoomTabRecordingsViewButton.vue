<template>
  <Button
    severity="secondary"
    :outlined="formatDisabled"
    @click="downloadFormat"
    :disabled="isLoadingAction"
    :aria-label="$t('rooms.recordings.format_types.'+format)"
    v-tooltip="$t('rooms.recordings.format_types.'+format)"
    :loading="isLoadingAction"
    :icon="formatIcon"
  />
</template>
<script setup>

import { computed, ref } from 'vue';
import { useApi } from '../composables/useApi.js';
import env from '../env.js';
import { useToast } from '../composables/useToast.js';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  accessCode: {
    type: Number,
    required: false
  },
  token: {
    type: String,
    required: false
  },
  roomId: {
    required: true
  },
  formatDisabled: {
    type: Boolean,
    default: false
  },
  format: {
    type: String,
    required: true
  },
  id: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['invalidCode', 'invalidToken', 'forbidden', 'notFound']);

const isLoadingAction = ref(false);

const api = useApi();
const toast = useToast();
const { t } = useI18n();

function downloadFormat () {
  isLoadingAction.value = true;

  // Update value for the setting and the effected file
  const config = {};

  if (props.token) {
    config.headers = { Token: props.token };
  } else if (props.accessCode != null) {
    config.headers = { 'Access-Code': props.accessCode };
  }

  const url = 'rooms/' + props.roomId + '/recordings/' + props.id;

  // Load data
  api.call(url, config)
    .then(response => {
      if (response.data.url !== undefined) {
        const viewWindow = window.open(response.data.url, '_blank');
        if (!viewWindow) {
          toast.error(t('app.flash.popup_blocked'));
        }
      }
    }).catch((error) => {
      if (error.response) {
      // Access code invalid
        if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_code') {
          return emit('invalidCode');
        }

        // Room token is invalid
        if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_token') {
          return emit('invalidToken');
        }

        // Forbidden, require access code
        if (error.response.status === env.HTTP_FORBIDDEN && error.response.data.message === 'require_code') {
          return emit('invalidCode');
        }

        // Forbidden, not allowed to download this file
        if (error.response.status === env.HTTP_FORBIDDEN) {
        // Show error message
          toast.error(t('rooms.flash.recording_forbidden'));
          return emit('forbidden');
        }

        // File gone
        if (error.response.status === env.HTTP_NOT_FOUND) {
        // Show error message
          toast.error(t('rooms.flash.recording_gone'));
          return emit('notFound');
        }
      }
      api.error(error);
    }).finally(() => {
      isLoadingAction.value = false;
    });
}

const formatIcon = computed(() => {
  switch (props.format) {
    case 'podcast':
      return 'fa-solid fa-volume-high';
    case 'screenshare':
      return 'fa-solid fa-display';
    case 'presentation':
      return 'fa-solid fa-person-chalkboard';
    case 'notes':
      return 'fa-solid fa-file-lines';
    case 'video':
      return 'fa-solid fa-video';
    default:
      return '';
  }
});

</script>
