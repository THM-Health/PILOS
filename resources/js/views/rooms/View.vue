<template>
  <div
    v-cloak
    class="container mt-5 mb-5"
  >
    <!-- room token is invalid -->
    <div v-if="tokenInvalid">
      <!-- Show message that room can only be used by logged in users -->
      <Message severity="error" icon="fa-solid fa-unlink" :closable="false">
        {{ $t('rooms.invalid_personal_link') }}
      </Message>
    </div>

    <!-- room is only for logged in users -->
    <div v-else-if="guestsNotAllowed">
      <!-- Show message that room can only be used by logged in users -->
      <Message severity="info" icon="fa-solid fa-exclamation-circle" :closable="false">
        {{ $t('rooms.only_used_by_authenticated_users') }}
      </Message>
        <!-- Reload page, in case the room settings changed -->
        <Button
          :disabled="loading"
          @click="reload"
          :loading="loading"
          icon="fa-solid fa-sync"
          :label="$t('rooms.try_again')"
        />
    </div>

    <div v-else>
      <div v-if="!room">
        <div class="text-center my-2">
          <i
            v-if="roomLoading"
            class="fa-solid fa-circle-notch fa-spin text-3xl"
          />
          <Button
            v-else
            @click="load()"
            icon="fa-solid fa-sync"
            :label="$t('app.reload')"
          />
        </div>
      </div>
      <div v-else>
        <div class="grid">
          <div class="col-12 md:col-10">
            <!-- Display room type, name and owner  -->
            <room-type-badge :room-type="room.type" />
            <h2 class="h2 mt-2 roomname">
              {{ room.name }}
            </h2>

            <room-details-component
              :room="room"
              :show-description="true"
            />
          </div>
          <div class="col-12 md:col-2 flex justify-content-end align-items-start">
            <span class="p-buttonset">
              <!-- Reload general room settings/details -->
              <Button
                v-tooltip="$t('app.reload')"
                severity="secondary"
                :disabled="loading"
                @click="reload"
                icon="fa-solid fa-sync"
                :loading="loading"
              />
              <RoomDropdownButton :room="room" @reload="reload()" @invalidCode="handleInvalidCode" />
            </span>
          </div>
        </div>
        <div
          v-if="room.authenticated && room.can_start && room.room_type_invalid"
          class="row pt-2"
        >
          <div class="col-lg-12 col-12">
            <Message severity="warn" icon="fa-solid fa-unlink" :closable="false">
              {{ $t('rooms.room_type_invalid_alert', { roomTypeName: room.type.name }) }}
            </Message>
          </div>
        </div>

        <Divider />

        <!-- room join/start, files, settings for logged in users -->
        <template v-if="room.authenticated">
          <!-- Room join/start -->

          <div class="grid">
            <!-- Show invitation text/link to moderators and room owners -->
            <div class="col-12 md:col-8 lg:col-6 flex-order-2 md:flex-order-1"
              v-if="viewInvitation"
            >
              <room-invitation :room="room" />
            </div>
            <div class="col-12 flex-order-1 md:flex-order-2" :class="{ 'md:col-4 lg:col-6': viewInvitation, 'md:col-6 lg:col-12': !viewInvitation}">
              <div class="grid">
                <!-- Ask guests for their first and lastname -->
                <div class="col-12 md:col-6"
                  v-if="!authStore.isAuthenticated"
                >
                  <div class="flex flex-column gap-2">
                    <label for="guest-name">{{ $t('rooms.first_and_lastname') }}</label>
                    <InputText
                      v-model="name"
                      :placeholder="$t('rooms.placeholder_name')"
                      :disabled="!!token"
                      :class="{'p-invalid': formErrors.fieldInvalid('name')}"
                    />
                    <p class="p-error" v-html="formErrors.fieldError('name')" />
                  </div>
                </div>
                <!-- Show room start or join button -->
                <div class="col-12" :class="{ 'md:col-12': authStore.isAuthenticated, 'md:col-6': !authStore.isAuthenticated}">
                  <InlineMessage
                    v-if="room.record_attendance"
                    severity="info"
                  >
                    {{ $t('rooms.recording_attendance_info') }}
                    <div class="flex align-items-center gap-2">
                      <Checkbox inputId="record-attendance-agreement" v-model="recordAttendanceAgreement" binary />
                      <label for="record-attendance-agreement">{{ $t('rooms.recording_attendance_accept') }}</label>
                    </div>
                  </InlineMessage>

                  <!-- If room is running, show join button -->
                  <template v-if="running">
                    <!-- If user is guest, join is only possible if a name is provided -->
                    <Button
                      class="p-button-block"
                      :disabled="(!authStore.isAuthenticated && name==='') || loadingJoinStart || room.room_type_invalid || (room.record_attendance && !recordAttendanceAgreement)"
                      @click="join"
                      :loading="loadingJoinStart"
                      icon="fa-solid fa-door-open"
                      :label="$t('rooms.join')"
                    />
                  </template>
                  <!-- If room is not running -->
                  <template v-else>
                    <Button
                      v-if="room.can_start"
                      class="p-button-block"
                      :disabled="(!authStore.isAuthenticated && name==='') || loadingJoinStart || room.room_type_invalid || (room.record_attendance && !recordAttendanceAgreement)"
                      @click="start"
                      :loading="loadingJoinStart"
                      icon="fa-solid fa-door-open"
                      :label="$t('rooms.start')"
                    />
                    <!-- If user isn't allowed to start a new meeting, show message that meeting isn't running yet -->
                    <Tag v-else severity="info" icon="fa-solid fa-circle-notch fa-spin text-base mr-2" class="w-full text-base" :value="$t('rooms.not_running')"></Tag>
                  </template>

                  <browser-notification
                    :running="running"
                    :name="room.name"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Show limited file list for guests, users, members and moderators-->
          <cannot
            method="viewSettings"
            :policy="room"
          >
            <Divider />
            <tabs-component
              :access-code="accessCode"
              :token="token"
              :room="room"

              @invalid-code="handleInvalidCode"
              @invalid-token="handleInvalidToken"
              @guests-not-allowed="handleGuestsNotAllowed"
            />
          </cannot>

          <!-- Show room settings (including members and files) for co-owners, owner and users with rooms.viewAll permission -->
          <can
            method="viewSettings"
            :policy="room"
          >
            <admin-tabs-component
              :room="room"
              @settings-changed="reload"
            />
          </can>
        </template>
        <!-- Ask for room access code -->
        <div v-else>
          <Message :closable="false">
            {{ $t('rooms.require_access_code') }}
          </Message>
          <InputGroup>
            <InputMask
              v-model="accessCodeInput"
              mask="999-999-999"
              :class="{ 'p-invalid': !accessCodeValid }"
              :placeholder="$t('rooms.access_code')"
              @keydown.enter="login"
            />
            <Button
                @click="login"
                :loading="loading"
                icon="fa-solid fa-lock"
                :label="$t('rooms.login')"
              />
          </InputGroup>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import env from '@/env.js';
import PermissionService from '@/services/PermissionService';
import { useAuthStore } from '@/stores/auth';
import { useSettingsStore } from '@/stores/settings';
import EventBus from '@/services/EventBus';
import { EVENT_CURRENT_ROOM_CHANGED } from '@/constants/events';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from '../../composables/useToast.js';
import { useRouter } from 'vue-router';
import { useFormErrors } from '../../composables/useFormErrors.js';
import { useApi } from '../../composables/useApi.js';

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  token: {
    type: String,
    default: null
  }
});

const reloadInterval = ref(null);
const loading = ref(false); // Room settings/details loading
const loadingJoinStart = ref(false); // Loading indicator on joining/starting a room
const name = ref(''); // Name of guest
const room = ref(null); // Room object
const accessCode = ref(null); // Access code to use for requests
const accessCodeInput = ref(''); // Access code input modal
const accessCodeValid = ref(null); // Is access code valid
const recordAttendanceAgreement = ref(false);
const roomLoading = ref(false); // Room loading indicator for initial load
const tokenInvalid = ref(false); // Room token is invalid
const guestsNotAllowed = ref(false); // Access to room was forbidden

const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const { t } = useI18n();
const toast = useToast();
const router = useRouter();
const formErrors = useFormErrors();
const api = useApi();

onMounted(() => {
  // Prevent authenticated users from using a room token
  if (props.token && authStore.isAuthenticated) {
    toast.info(t('app.flash.guests_only'));
    router.replace({ name: 'home' });
    return;
  }

  load();
});

onUnmounted(() => {
  clearInterval(reloadInterval.value);
});

/**
 * Reload room details in a set interval, change in the .env
 */
function startAutoRefresh () {
  reloadInterval.value = setInterval(reload, getRandomRefreshInterval() * 1000);
}

/**
 * Get a random refresh interval for polling to prevent
 * simultaneous request from multiple clients
 * @returns {number} random refresh internal in seconds
 */
function getRandomRefreshInterval () {
  const base = Math.abs(settingsStore.getSetting('room_refresh_rate'));
  // 15% range to scatter the values around the base refresh rate
  const percentageRange = 0.15;
  const absoluteRange = base * percentageRange;
  // Calculate a random refresh internal between (base-range and base+range)
  return (base - absoluteRange) + (Math.random() * absoluteRange * 2);
}

/**
 * Reset room access code and details
 */
function handleGuestsNotAllowed () {
  guestsNotAllowed.value = true;

  // Remove a potential access code
  accessCode.value = null;

  // Set current user to null, as the user is not logged in
  authStore.setCurrentUser(null);
}

/**
 * Reset access code due to errors, show error and reload room details
 */
function handleInvalidCode () {
  // Show access code is valid
  accessCodeValid.value = false;
  // Reset access code (not the form input) to load the general room details again
  accessCode.value = null;
  // Show error message
  toast.error(t('rooms.flash.access_code_invalid'));
  reload();
}

/**
 * Reset room due to token error
 */
function handleInvalidToken () {
  // Show error message
  tokenInvalid.value = true;
  toast.error(t('rooms.flash.token_invalid'));
  // Disable auto reload as this error is permanent and the removal of the room link cannot be undone
  clearInterval(reloadInterval.value);
}

/**
 * Initial loading of the room
 */
function load () {
  // Enable loading indicator
  roomLoading.value = true;

  // Build room api url, include access code if set
  const config = {};

  if (props.token) {
    config.headers = { Token: props.token };
  } else if (accessCode.value != null) {
    config.headers = { 'Access-Code': accessCode.value };
  }

  const url = 'rooms/' + props.id;

  // Load data
  api.call(url, config)
    .then(response => {
      room.value = response.data.data;

      if (room.value.username) {
        name.value = room.value.username;
      }

      setPageTitle(room.value.name);

      startAutoRefresh();
    })
    .catch((error) => {
      if (error.response) {
        // Room not found
        if (error.response.status === env.HTTP_NOT_FOUND) {
          router.push({ name: '404' });
          return;
        }

        // Room token is invalid
        if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_token') {
          tokenInvalid.value = true;
          return;
        }

        // Forbidden, guests not allowed
        if (error.response.status === env.HTTP_FORBIDDEN && error.response.data.message === 'guests_not_allowed') {
          guestsNotAllowed.value = true;
          startAutoRefresh();
          return;
        }
      }

      api.error(error);
    }).finally(() => {
      // Disable loading indicator
      roomLoading.value = false;
    });
}

/**
 * Reload the room details/settings
 */
function reload () {
  // Enable loading indicator
  loading.value = true;
  // Build room api url, include access code if set
  const config = {};

  if (props.token) {
    config.headers = { Token: props.token };
  } else if (accessCode.value != null) {
    config.headers = { 'Access-Code': accessCode.value };
  }

  const url = 'rooms/' + props.id;

  // Load data
  api.call(url, config)
    .then(response => {
      room.value = response.data.data;
      // If logged in, reset the access code valid
      if (room.value.authenticated) {
        accessCodeValid.value = null;
      }

      EventBus.emit(EVENT_CURRENT_ROOM_CHANGED, room.value);

      if (room.value.username) {
        name.value = room.value.username;
      }

      setPageTitle(room.value.name);

      // Update current user, if logged in/out in another tab or session expired
      // to have the can/cannot component use the correct state
      authStore.setCurrentUser(room.value.current_user);

      guestsNotAllowed.value = false;
    })
    .catch((error) => {
      if (error.response) {
        // Room not found
        if (error.response.status === env.HTTP_NOT_FOUND) {
          return;
        }

        // Access code invalid
        if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_code') {
          return handleInvalidCode();
        }

        // Room token is invalid
        if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_token') {
          return handleInvalidToken();
        }

        // Forbidden, guests not allowed
        if (error.response.status === env.HTTP_FORBIDDEN && error.response.data.message === 'guests_not_allowed') {
          return handleGuestsNotAllowed();
        }
      }
      api.error(error);
    }).finally(() => {
      // Disable loading indicator
      loading.value = false;
    });
}

/**
 * Start a new meeting
 */
function start () {
  // Enable start/join meeting indicator/spinner
  loadingJoinStart.value = true;
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
  } else if (accessCode.value != null) {
    config.headers = { 'Access-Code': accessCode.value };
  }

  const url = 'rooms/' + props.id + '/start';

  api.call(url, config)
    .then(response => {
      // Check if response has a join url, if yes redirect
      if (response.data.url !== undefined) {
        window.location = response.data.url;
      }
    })
    .catch((error) => {
      if (error.response) {
        // Access code invalid
        if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_code') {
          return handleInvalidCode();
        }

        // Access code invalid
        if (error.response.status === env.HTTP_FORBIDDEN && error.response.data.message === 'require_code') {
          return handleInvalidCode();
        }

        // Room token is invalid
        if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_token') {
          return handleInvalidToken();
        }

        // Forbidden, guests not allowed
        if (error.response.status === env.HTTP_FORBIDDEN && error.response.data.message === 'guests_not_allowed') {
          return handleGuestsNotAllowed();
        }

        // Forbidden, use can't start the room
        if (error.response.status === env.HTTP_FORBIDDEN) {
          // Show error message
          toast.error(t('rooms.flash.start_forbidden'));
          // Disable room start button and reload the room settings, as there was obviously
          // a different understanding of the users permission in this room
          room.value.can_start = false;
          reload();
          return;
        }

        // Form validation error
        if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          formErrors.set(error.response.data.errors);
          return;
        }

        // Attendance logging agreement required but not accepted
        if (error.response.status === env.HTTP_ATTENDANCE_AGREEMENT_MISSING) {
          room.value.record_attendance = true;
        }
      }
      api.error(error);
    }).finally(() => {
      // Disable loading indicator
      loadingJoinStart.value = false;
    });
}

/**
  * Show room name in title
  * @param {string} roomName Name of the room
  */
function setPageTitle (roomName) {
  document.title = roomName + ' - ' + settingsStore.getSetting('name');
}

/**
 * Join a running meeting
 */
function join () {
  // Enable start/join meeting indicator/spinner
  loadingJoinStart.value = true;
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
  } else if (accessCode.value != null) {
    config.headers = { 'Access-Code': accessCode.value };
  }

  const url = 'rooms/' + props.id + '/join';

  // Join meeting request
  api.call(url, config)
    .then(response => {
      // Check if response has a join url, if yes redirect
      if (response.data.url !== undefined) {
        window.location = response.data.url;
      }
    })
    .catch((error) => {
      if (error.response) {
        // Access code invalid
        if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_code') {
          return handleInvalidCode();
        }

        // Access code invalid
        if (error.response.status === env.HTTP_FORBIDDEN && error.response.data.message === 'require_code') {
          return handleInvalidCode();
        }

        // Room token is invalid
        if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_token') {
          return handleInvalidToken();
        }

        // Forbidden, guests not allowed
        if (error.response.status === env.HTTP_FORBIDDEN && error.response.data.message === 'guests_not_allowed') {
          return handleGuestsNotAllowed();
        }

        // Room is not running, update running status
        if (error.response.status === env.HTTP_MEETING_NOT_RUNNING) {
          reload();
        }

        // Form validation error
        if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          formErrors.set(error.response.data.errors);
          return;
        }

        // Attendance logging agreement required but not accepted
        if (error.response.status === env.HTTP_ATTENDANCE_AGREEMENT_MISSING) {
          room.value.record_attendance = true;
        }
      }
      api.error(error);
    }).finally(() => {
      // Disable loading indicator
      loadingJoinStart.value = false;
    });
}
/**
 * Handle login with access code
 */
function login () {
  // Remove all non-numeric or dash chars
  accessCodeInput.value = accessCodeInput.value.replace(/[^0-9-]/g, '');
  // Remove the dashes for storing the access code
  accessCode.value = parseInt(accessCodeInput.value.replace(/[-]/g, '')) || '';
  // Reload the room with an access code
  reload();
}

const running = computed(() => {
  return room.value.last_meeting != null && room.value.last_meeting.end == null;
});

/**
 * Show invitation section only to users with the required permission
 */
const viewInvitation = computed(() => {
  return PermissionService.can('viewInvitation', room.value);
});

</script>
