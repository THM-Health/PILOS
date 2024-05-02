<template>
  <Button
    v-tooltip="$t('rooms.recordings.view_recording')"
    :aria-label="$t('rooms.recordings.view_recording')"
    @click="showModal = true"
    icon="fa-solid fa-eye"
    :disabled="props.disabled"
  />

  <!-- view recording modal -->
  <Dialog
    v-model:visible="showModal"
    modal
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :closeOnEscape="!isLoadingAction"
    :dismissableMask="false"
    :closable="!isLoadingAction"
  >
    <template #header>
      <div>
      <span class="p-dialog-title">
        {{ props.description }}
      </span>
        <br/>
        <small>{{ $d(new Date(props.start),'datetimeShort') }} <raw-text>-</raw-text> {{ $d(new Date(props.end),'datetimeShort') }}</small>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <Button :label="$t('app.close')" severity="secondary" icon="fa-solid fa-times" @click="showModal = false" :disabled="isLoadingAction" />
      </div>
    </template>

    <OverlayComponent :show="isLoadingAction">
      <div class="flex flex-column gap-2">

          <!-- Hide disabled formats if disabled formats should be hidden -->
          <Button
            v-for="format in formats.filter(format => !(format.disabled && hideDisabledFormats))"
            :key="format.format"
            icon="fa-solid fa-play"
            @click="downloadFormat(format)"
            :disabled="isLoadingAction"
            :label="$t('rooms.recordings.format_types.'+format.format)"
          />
      </div>
    </OverlayComponent>

  </Dialog>

</template>
<script setup>

import { ref } from 'vue';
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
  recordingId: {
    required: true
  },
  hideDisabledFormats: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    required: true
  },
  start: {
    type: String,
    required: true
  },
  end: {
    type: String,
    required: true
  },
  formats: {
    type: Array,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['invalidCode', 'invalidToken', 'forbidden', 'notFound']);

const isLoadingAction = ref(false);
const showModal = ref(false);

const api = useApi();
const toast = useToast();
const { t } = useI18n();

function downloadFormat (format) {
  isLoadingAction.value = true;

  // Update value for the setting and the effected file
  const config = {};

  if (props.token) {
    config.headers = { Token: props.token };
  } else if (props.accessCode != null) {
    config.headers = { 'Access-Code': props.accessCode };
  }

  const url = 'rooms/' + props.roomId + '/recordings/' + props.recordingId + '/formats/' + format.id;

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

        // Forbidden, not allowed to view recording format
        if (error.response.status === env.HTTP_FORBIDDEN) {
        // Show error message
          toast.error(t('rooms.flash.recording_forbidden'));
          return emit('forbidden');
        }

        // Recording gone
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

</script>
