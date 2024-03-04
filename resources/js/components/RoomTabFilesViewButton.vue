<template>
  <!-- View file -->
  <Button
    v-tooltip="$t('rooms.files.view')"
    :disabled="disabled"
    target="_blank"
    @click="downloadFile"
    :loading="loading"
    icon="fa-solid fa-eye"
  />
</template>
<script setup>
import env from '../env.js';
import { ref } from 'vue';
import { useApi } from '../composables/useApi.js';
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
  disabled: {
    type: Boolean,
    default: false,
    required: false
  },
  fileId: {
    type: Number,
    required: true
  },
  roomId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['invalidCode', 'invalidToken', 'fileNotFound']);

const api = useApi();
const toast = useToast();
const { t } = useI18n();

const loading = ref(false);

/**
 * Request file download url
 * @param file file object
 * @return string url
 */
function downloadFile () {
  loading.value = true;
  // Update value for the setting and the effected file
  const config = {};

  if (props.token) {
    config.headers = { Token: props.token };
  } else if (props.accessCode != null) {
    config.headers = { 'Access-Code': props.accessCode };
  }

  const url = 'rooms/' + props.roomId + '/files/' + props.fileId;

  // Load data
  api.call(url, config)
    .then(response => {
      if (response.data.url !== undefined) {
        window.open(response.data.url, '_blank');
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
          toast.error(t('rooms.flash.file_forbidden'));
          emit('fileNotFound');
          return;
        }

        // File gone
        if (error.response.status === env.HTTP_NOT_FOUND) {
        // Show error message
          toast.error(t('rooms.flash.file_gone'));
          // Remove file from list
          emit('fileNotFound');
          return;
        }
      }
      api.error(error);
    }).finally(() => {
      loading.value = null;
    });
}

</script>
