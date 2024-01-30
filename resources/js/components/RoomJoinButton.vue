<template>
  <!-- If room is running, show join button -->
    <!-- If user is guest, join is only possible if a name is provided -->
    <Button
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
  <InlineMessage v-else severity="info" class="w-full"><span class="font-semibold">{{ $t('rooms.not_running') }}</span></InlineMessage>

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
    <!-- Ask guests for their first and lastname -->
    <div v-if="!authStore.isAuthenticated && !token" class="flex flex-column gap-2 mb-3" >
      <label for="guest-name">{{ $t('rooms.first_and_lastname') }}</label>
      <InputText
        autofocus
        v-model="name"
        :placeholder="$t('rooms.placeholder_name')"
        :class="{'p-invalid': formErrors.fieldInvalid('name')}"
      />
      <p class="p-error" v-html="formErrors.fieldError('name')" />
    </div>

    <div class="mb-3 surface-200 p-3 border-round flex gap-2 flex-column" v-if="recordAttendance">
      <span class="font-semibold">{{ $t('rooms.recording_attendance_info') }}</span>
      <div class="flex align-items-center gap-2">
        <Checkbox
          inputId="record-attendance-agreement"
          v-model="recordAttendanceAgreement"
          binary
          :class="{'p-invalid': formErrors.fieldInvalid('record_attendance')}"
        />
        <label for="record-attendance-agreement">{{ $t('rooms.recording_attendance_accept') }}</label>
      </div>
      <p class="p-error" v-html="formErrors.fieldError('record_attendance')" />
    </div>

    <div class="flex align-items-center justify-content-end mt-4 gap-2">
      <Button :label="$t('app.cancel')" :disabled="isLoadingAction" @click="showModal = false" severity="secondary" size="small"></Button>
      <Button :label="$t('app.continue')" :disabled="isLoadingAction" :loading="isLoadingAction" @click="getJoinUrl" size="small"></Button>
    </div>
  </Dialog>

</template>
<script setup>

import { ref, defineEmits, computed } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { useFormErrors } from '../composables/useFormErrors.js';
import { useApi } from '../composables/useApi.js';
import env from '../env.js';
import { useToast } from '../composables/useToast.js';
import { useI18n } from 'vue-i18n';

const props = defineProps([
  'roomId',
  'canStart',
  'running',
  'disabled',
  'token',
  'accessCode',
  'recordAttendance'
]);

const emit = defineEmits(['invalidCode', 'invalidToken', 'guestsNotAllowed']);

const authStore = useAuthStore();

const showModal = ref(false);
const isLoadingAction = ref(false);
const recordAttendanceAgreement = ref(false);
const name = ref(''); // Name of guest

const api = useApi();
const toast = useToast();
const { t } = useI18n();
const formErrors = useFormErrors();

async function join () {
  if (!showPopup.value) {
    getJoinUrl();
    return;
  }

  formErrors.clear();
  showModal.value = true;
}

const showPopup = computed(() => {
  if (!authStore.isAuthenticated && !props.token) {
    return true;
  }

  if (props.recordAttendance) {
    return true;
  }

  return false;
});

/**
 * Join/start
 */
function getJoinUrl () {
  // Enable start/join meeting indicator/spinner
  isLoadingAction.value = true;

  // Reset errors
  formErrors.clear();

  // Build url, add accessCode and token if needed
  const config = {
    params: {
      name: props.token ? null : name.value,
      record_attendance: recordAttendanceAgreement.value ? 1 : 0
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
        showModal.value = false;
      }
    })
    .catch((error) => {
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
          return;
        }

        // Room is not running, update running status
        if (error.response.status === env.HTTP_MEETING_NOT_RUNNING) {
          emit('notRunning');
          showModal.value = false;
          return;
        }
      }

      api.error(error);
      showModal.value = false;
    }).finally(() => {
      // Disable loading indicator
      isLoadingAction.value = false;
    });
}

</script>
