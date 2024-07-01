<template>
  <!-- If room is running, show join button -->
  <Button
    data-test="room-join-button"
    v-if="props.running"
    class="p-button-block"
    :disabled="isLoadingAction || disabled"
    @click="join"
    :loading="isLoadingAction"
    icon="fa-solid fa-door-open"
    :label="$t('rooms.join')"
  />

  <!-- If room is not running -->
  <Button
    v-else-if="canStart"
    class="p-button-block"
    :disabled="isLoadingAction || disabled"
    @click="join"
    :loading="isLoadingAction"
    icon="fa-solid fa-door-open"
    :label="$t('rooms.start')"
  />

  <!-- If user isn't allowed to start a new meeting, show message that meeting isn't running yet -->
  <Message v-else severity="info">{{ $t('rooms.not_running') }}</Message>

  <Dialog
    v-model:visible="showModal"
    modal
    :header="running ? $t('rooms.join_room') : $t('rooms.start_room')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :closeOnEscape="!isLoadingAction"
    :dismissableMask="false"
    :closable="!isLoadingAction"
  >
    <Message severity="warn" v-if="showRunningMessage">{{ $t('app.errors.room_already_running')}}</Message>

    <OverlayComponent :show="isLoadingAction" :opacity="0">
      <div v-if="!isLoadingAction">
        <!-- Ask guests for their first and lastname -->
        <div v-if="!authStore.isAuthenticated && !token" class="flex flex-col gap-2 mb-4" >
          <label for="guest-name">{{ $t('rooms.first_and_lastname') }}</label>
          <InputText
            autofocus
            v-model="name"
            :placeholder="$t('rooms.placeholder_name')"
            :invalid="formErrors.fieldInvalid('name')"
          />
          <p class="p-error" v-html="formErrors.fieldError('name')" />
        </div>

        <div class="mb-4 bg-surface-200 dark:bg-surface-600 p-4 rounded-border flex gap-2 flex-col" v-if="recordAttendance">
          <span class="font-semibold">{{ $t('rooms.recording_attendance_info') }}</span>
          <div class="flex items-center gap-2">
            <Checkbox
              inputId="record-attendance-agreement"
              v-model="recordAttendanceAgreement"
              binary
              :invalid="formErrors.fieldInvalid('record_attendance')"
            />
            <label for="record-attendance-agreement">{{ $t('rooms.recording_attendance_accept') }}</label>
          </div>
          <p class="p-error" v-html="formErrors.fieldError('record_attendance')" />
        </div>

        <div class="mb-4 bg-surface-200 dark:bg-surface-600 p-4 rounded-border flex gap-2 flex-col" v-if="record">
          <span class="font-semibold">{{ $t('rooms.recording_info') }}</span>
          <i>{{ $t('rooms.recording_hint') }}</i>
          <div class="flex items-center gap-2">
            <Checkbox
              inputId="record-agreement"
              v-model="recordAgreement"
              binary
              :class="{'p-invalid': formErrors.fieldInvalid('record')}"
            />
            <label for="record-agreement" class="required">{{ $t('rooms.recording_accept') }}</label>
          </div>
          <p class="p-error" v-html="formErrors.fieldError('record')" />
          <div class="flex items-center gap-2">
            <Checkbox
              inputId="record-video-agreement"
              v-model="recordVideoAgreement"
              binary
              :class="{'p-invalid': formErrors.fieldInvalid('record_video')}"
            />
            <label for="record-video-agreement">{{ $t('rooms.recording_video_accept') }}</label>
          </div>
          <p class="p-error" v-html="formErrors.fieldError('record_video')" />
        </div>
      </div>
    </OverlayComponent>

    <div class="flex items-center justify-end mt-6 gap-2">
      <Button :label="$t('app.cancel')" :disabled="isLoadingAction" @click="showModal = false" severity="secondary" size="small"/>
      <Button :label="$t('app.continue')" :disabled="isLoadingAction" @click="getJoinUrl" size="small"/>
    </div>
  </Dialog>

</template>
<script setup>

import { ref, computed } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { useFormErrors } from '../composables/useFormErrors.js';
import { useApi } from '../composables/useApi.js';
import env from '../env.js';
import { useToast } from '../composables/useToast.js';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  roomId: {
    type: String,
    required: true
  },
  canStart: {
    type: Boolean
  },
  running: {
    type: Boolean
  },
  disabled: {
    type: Boolean,
    default: false
  },
  token: {
    type: String,
    default: null
  },
  accessCode: {
    type: Number,
    required: false
  },
  recordAttendance: {
    type: Boolean
  },
  record: {
    type: Boolean
  }
});

const emit = defineEmits(['invalidCode', 'invalidToken', 'guestsNotAllowed', 'changed', 'forbidden']);

const authStore = useAuthStore();

const showModal = ref(false);
const isLoadingAction = ref(false);
const recordAttendanceAgreement = ref(false);
const showRunningMessage = ref(false);
const recordAgreement = ref(false);
const recordVideoAgreement = ref(false);
const name = ref(''); // Name of guest

const api = useApi();
const toast = useToast();
const { t } = useI18n();
const formErrors = useFormErrors();

async function join () {
  showRunningMessage.value = false;

  formErrors.clear();
  showModal.value = true;

  if (autoJoin.value) {
    getJoinUrl();
  }
}

const autoJoin = computed(() => {
  if (!authStore.isAuthenticated && !props.token) {
    return false;
  }

  if (props.recordAttendance) {
    return false;
  }

  if (props.record) {
    return false;
  }

  return true;
});

/**
 * Join/start
 */
function getJoinUrl () {
  // Enable start/join meeting indicator/spinner
  isLoadingAction.value = true;

  // Hide running message
  showRunningMessage.value = false;

  // Reset errors
  formErrors.clear();

  // Build url, add accessCode and token if needed
  const config = {
    params: {
      name: props.token ? null : name.value,
      record_attendance: recordAttendanceAgreement.value ? 1 : 0,
      record: recordAgreement.value ? 1 : 0,
      record_video: recordVideoAgreement.value ? 1 : 0
    }
  };

  if (props.token) {
    config.headers = { Token: props.token };
  } else if (props.accessCode != null) {
    config.headers = { 'Access-Code': props.accessCode };
  }

  const url = 'rooms/' + props.roomId + '/' + (props.running ? 'join' : 'start');

  // Join meeting request
  api.call(url, config)
    .then(response => {
      // Check if response has a join url, if yes redirect
      if (response.data.url !== undefined) {
        window.location = response.data.url;
      }
    })
    .catch((error) => {
      // Disable loading indicator
      isLoadingAction.value = false;

      if (error.response) {
        // Access code invalid
        if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_code') {
          emit('invalidCode');
          showModal.value = false;
          return;
        }

        // Access code invalid
        if (error.response.status === env.HTTP_FORBIDDEN && error.response.data.message === 'require_code') {
          emit('invalidCode');
          showModal.value = false;
          return;
        }

        // Room token is invalid
        if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_token') {
          emit('invalidToken');
          showModal.value = false;
          return;
        }

        // Forbidden, guests not allowed
        if (error.response.status === env.HTTP_FORBIDDEN && error.response.data.message === 'guests_not_allowed') {
          emit('guestsNotAllowed');
          showModal.value = false;
          return;
        }

        // Forbidden, use can't start the room
        if (error.response.status === env.HTTP_FORBIDDEN) {
          // Show error message
          toast.error(t('rooms.flash.start_forbidden'));
          emit('forbidden');
          showModal.value = false;
          return;
        }

        // Form validation error
        if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          formErrors.set(error.response.data.errors);
          return;
        }

        // Attendance logging agreement required but not accepted
        if (error.response.status === env.HTTP_ATTENDANCE_AGREEMENT_MISSING) {
          formErrors.set({ record_attendance: [error.response.data.message] });
          emit('changed');
          return;
        }

        // Record agreement required but not accepted
        if (error.response.status === env.HTTP_RECORD_AGREEMENT_MISSING) {
          formErrors.set({ record: [error.response.data.message] });
          emit('changed');
          return;
        }

        // Room is not running, update running status
        if (error.response.status === env.HTTP_ROOM_NOT_RUNNING) {
          toast.error(t('app.errors.not_running'));
          showModal.value = false;
          emit('changed');
          return;
        }

        // Room is running cannot be started a second time, update running status
        if (error.response.status === env.HTTP_ROOM_ALREADY_RUNNING) {
          emit('changed');
          showRunningMessage.value = true;
          return;
        }
      }

      api.error(error);
      showModal.value = false;
    });
}

</script>
