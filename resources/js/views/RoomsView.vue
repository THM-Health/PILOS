<template>
  <div
    v-cloak
    class="container mt-8 mb-8"
  >
    <!-- room token is invalid -->
    <div
      v-if="tokenInvalid"
      class="flex justify-center mt-20"
    >
      <!-- Show message that room can only be used by logged in users -->
      <Card style="width: 500px; max-width: 90vw;" :pt="{ header: { class: 'flex justify-center'}}">
        <template #header>
          <Badge severity="danger" class="rounded-full flex justify-center items-center h-16 w-16 -mt-8">
            <i class="fa-solid fa-unlink text-2xl text-white"></i>
          </Badge>
        </template>
        <template #content>
          <span class="font-bold">
            {{ $t('rooms.invalid_personal_link') }}
          </span>
        </template>
      </Card>
    </div>

    <!-- room is only for logged in users -->
    <div
      v-else-if="guestsNotAllowed"
      class="flex justify-center mt-20"
    >
      <Card style="width: 500px; max-width: 90vw;" :pt="{ header: { class: 'flex justify-center'}}">
        <template #header>
          <Badge severity="danger" class="rounded-full flex justify-center items-center h-16 w-16 -mt-8">
            <i class="fa-solid fa-lock text-2xl text-white"></i>
          </Badge>
        </template>
        <template #content>
          <span class="font-bold">
            {{ $t('rooms.only_used_by_authenticated_users') }}
          </span>
        </template>
        <template #footer>
          <div class="flex justify-start w-full">
            <!-- Reload page, in case the room settings changed -->
            <Button
              data-test="try-again-button"
              :disabled="loading"
              @click="reload"
              :loading="loading"
              icon="fa-solid fa-sync"
              :label="$t('rooms.try_again')"
            />
          </div>
        </template>
      </Card>
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
            :aria-label="$t('app.reload')"
            data-test="reload-button"
          />
        </div>
      </div>
      <div v-else>
        <div v-if="!room.authenticated"
           class="flex justify-center mt-20"
        >
          <Card style="width: 500px; max-width: 90vw;" :pt="{ header: { class: 'flex justify-center'}}" data-test="room-access-code-overlay">
            <template #header>
              <Badge severity="danger" class="rounded-full flex justify-center items-center h-16 w-16 -mt-8">
                <i class="fa-solid fa-lock text-2xl text-white"></i>
              </Badge>
            </template>
            <template #content>
            <RoomHeader :room="room" :loading="loading" @reload="reload" :details-inline="false" :hide-favorites="true" :hide-membership="true" />
            <Divider/>

            <span class="font-bold">
              {{ $t('rooms.require_access_code') }}
            </span>

            <div class="flex flex-col w-full gap-2 mt-6" data-test="room-access-code">
              <label for="access-code">{{ $t('rooms.access_code') }}</label>
              <InputGroup>
                  <InputMask
                    autofocus
                    v-model="accessCodeInput"
                    mask="999-999-999"
                    placeholder="123-456-789"
                    :invalid="accessCodeInvalid"
                    @keydown.enter="login"
                    class="text-center"
                    id="access-code"
                  />
              <Button
                @click="login"
                :loading="loading"
                icon="fa-solid fa-lock"
                :label="$t('rooms.login')"
                data-test="room-login-button"
              />
              </InputGroup>
              <p class="text-red-500 mt-1" role="alert" v-if="accessCodeInvalid">{{ $t('rooms.flash.access_code_invalid') }}</p>
            </div>
            </template>
          </Card>
        </div>
        <div v-else>
          <Card>
          <template #header>
            <RoomHeader class="mx-6 mt-6" :room="room" :loading="loading" @reload="reload" :details-inline="true" />
          </template>
          <template #content>
            <div
            v-if="room.can_start && room.room_type_invalid"
          >
            <Message severity="warn" icon="fa-solid fa-unlink" :closable="false">
              {{ $t('rooms.room_type_invalid_alert', { roomTypeName: room.type.name }) }}
            </Message>
          </div>
          <!-- Room join/start -->

          <div class="flex justify-between items-start gap-2">
            <div class="flex justify-start gap-2">
              <RoomJoinButton
                :roomId="room.id"
                :running="running"
                :disabled="room.room_type_invalid"
                :record-attendance="room.record_attendance"
                :record="room.record"
                :can-start="room.can_start"
                :token="props.token"
                :access-code="accessCode"
                @invalidCode="handleInvalidCode"
                @invalidToken="handleInvalidToken"
                @guests-not-allowed="handleGuestsNotAllowed"
                @changed="reload"
                @forbidden="reload"
              />
              <RoomBrowserNotification
                :room-name="room.name"
                :running="running"
              />
            </div>

            <!-- Show invitation text/link to moderators and room owners -->
            <RoomShareButton v-if="viewInvitation" :room="room" />
          </div>

          </template>
          </Card>
          <!-- Show room tabs -->
          <RoomTabSection
            :access-code="accessCode"
            :token="token"
            :room="room"

            @invalid-code="handleInvalidCode"
            @invalid-token="handleInvalidToken"
            @guests-not-allowed="handleGuestsNotAllowed"
            @settings-changed="reload"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import env from '../env.js';
import { useAuthStore } from '../stores/auth';
import { useSettingsStore } from '../stores/settings';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from '../composables/useToast.js';
import { useRouter } from 'vue-router';
import { useApi } from '../composables/useApi.js';
import { useUserPermissions } from '../composables/useUserPermission.js';
import RoomHeader from '../components/RoomHeader.vue';
import RoomShareButton from '../components/RoomShareButton.vue';
import EventBus from '../services/EventBus.js';
import { EVENT_CURRENT_ROOM_CHANGED } from '../constants/events.js';
import _ from 'lodash';

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
const room = ref(null); // Room object
const accessCode = ref(null); // Access code to use for requests
const accessCodeInput = ref(''); // Access code input modal
const accessCodeInvalid = ref(null); // Is access code invalid
const roomLoading = ref(false); // Room loading indicator for initial load
const tokenInvalid = ref(false); // Room token is invalid
const guestsNotAllowed = ref(false); // Access to room was forbidden

const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const userPermissions = useUserPermissions();
const { t } = useI18n();
const toast = useToast();
const router = useRouter();
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
  const base = Math.abs(settingsStore.getSetting('room.refresh_rate'));
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
  accessCodeInvalid.value = true;
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
      const newRoomData = response.data.data;

      const roomDataChanged = !_.isEqual(room.value, newRoomData);

      room.value = newRoomData;
      // If logged in, reset the access code valid
      if (room.value.authenticated) {
        accessCodeInvalid.value = null;
      }

      if (roomDataChanged) { EventBus.emit(EVENT_CURRENT_ROOM_CHANGED, room.value); }

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
  * Show room name in title
  * @param {string} roomName Name of the room
  */
function setPageTitle (roomName) {
  document.title = roomName + ' - ' + settingsStore.getSetting('general.name');
}

/**
 * Handle login with access code
 */
function login () {
  // Parse to int
  accessCode.value = parseInt(accessCodeInput.value.replace(/[-]/g, ''));
  // Reload the room with an access code
  reload();
}

const running = computed(() => {
  return room.value.last_meeting != null && room.value.last_meeting.end == null && room.value.last_meeting.detached == null;
});

/**
 * Show invitation section only to users with the required permission
 */
const viewInvitation = computed(() => {
  return userPermissions.can('viewInvitation', room.value);
});

</script>
