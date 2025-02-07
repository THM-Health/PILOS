<template>
  <div v-cloak class="container mb-8 mt-8">
    <!-- room token is invalid -->
    <div v-if="tokenInvalid" class="mt-20 flex justify-center">
      <!-- Show message that room can only be used by logged in users -->
      <Card
        style="width: 500px; max-width: 90vw"
        :pt="{ header: { class: 'flex justify-center' } }"
      >
        <template #header>
          <Badge
            severity="danger"
            class="-mt-8 flex h-16 w-16 items-center justify-center rounded-full"
          >
            <i class="fa-solid fa-unlink text-2xl text-white"></i>
          </Badge>
        </template>
        <template #content>
          <span class="font-bold">
            {{ $t("rooms.invalid_personal_link") }}
          </span>
        </template>
      </Card>
    </div>

    <!-- room is only for logged in users -->
    <div v-else-if="guestsNotAllowed" class="mt-20 flex justify-center">
      <Card
        style="width: 500px; max-width: 90vw"
        :pt="{ header: { class: 'flex justify-center' } }"
      >
        <template #header>
          <Badge
            severity="danger"
            class="-mt-8 flex h-16 w-16 items-center justify-center rounded-full"
          >
            <i class="fa-solid fa-lock text-2xl text-white"></i>
          </Badge>
        </template>
        <template #content>
          <span class="font-bold">
            {{ $t("rooms.only_used_by_authenticated_users") }}
          </span>
        </template>
        <template #footer>
          <div class="flex w-full justify-start">
            <!-- Reload page, in case the room settings changed -->
            <Button
              data-test="reload-room-button"
              :disabled="loading"
              :loading="loading"
              icon="fa-solid fa-sync"
              :label="$t('rooms.try_again')"
              @click="reload"
            />
          </div>
        </template>
      </Card>
    </div>

    <div v-else>
      <div v-if="!room">
        <div class="my-2 text-center" data-test="no-room-overlay">
          <i
            v-if="roomLoading"
            class="fa-solid fa-circle-notch fa-spin text-3xl"
          />
          <Button
            v-else
            icon="fa-solid fa-sync"
            :label="$t('app.reload')"
            :aria-label="$t('app.reload')"
            data-test="reload-button"
            @click="load()"
          />
        </div>
      </div>
      <div v-else>
        <div v-if="!room.authenticated" class="mt-20 flex justify-center">
          <Card
            style="width: 500px; max-width: 90vw"
            :pt="{ header: { class: 'flex justify-center' } }"
            data-test="room-access-code-overlay"
          >
            <template #header>
              <Badge
                severity="danger"
                class="-mt-8 flex h-16 w-16 items-center justify-center rounded-full"
              >
                <i class="fa-solid fa-lock text-2xl text-white"></i>
              </Badge>
            </template>
            <template #content>
              <RoomHeader
                :room="room"
                :loading="loading"
                :details-inline="false"
                :hide-favorites="true"
                :hide-membership="true"
                :disable-reload="authThrottledFor > 0"
                @reload="reload"
              />
              <Divider />

              <span class="font-bold">
                {{ $t("rooms.require_access_code") }}
              </span>

              <div
                class="mt-6 flex w-full flex-col gap-2"
                data-test="room-access-code"
              >
                <label for="access-code">{{ $t("rooms.access_code") }}</label>
                <InputGroup>
                  <InputMask
                    id="access-code"
                    v-model="accessCodeInput"
                    autofocus
                    mask="999-999-999"
                    placeholder="123-456-789"
                    :invalid="accessCodeInvalid"
                    :disabled="authThrottledFor > 0"
                    class="text-center"
                    @keydown.enter="login"
                  />
                  <Button
                    :loading="loading"
                    icon="fa-solid fa-lock"
                    :label="$t('rooms.login')"
                    data-test="room-login-button"
                    :disabled="authThrottledFor > 0"
                    @click="login"
                  />
                </InputGroup>
                <p
                  v-if="authThrottledFor > 0"
                  class="mt-1 text-red-500"
                  role="alert"
                >
                  {{
                    $t("rooms.auth_throttled", { try_again: authThrottledFor })
                  }}
                </p>

                <p
                  v-else-if="accessCodeInvalid"
                  class="mt-1 text-red-500"
                  role="alert"
                >
                  {{ $t("rooms.flash.access_code_invalid") }}
                </p>
              </div>
            </template>
          </Card>
        </div>
        <div v-else>
          <Card>
            <template #header>
              <RoomHeader
                class="mx-6 mt-6"
                :room="room"
                :loading="loading"
                :access-code="accessCode"
                :details-inline="true"
                @reload="reload"
                @invalid-code="handleInvalidCode"
                @joined-membership="
                  accessCode = null;
                  reload();
                "
              />
            </template>
            <template #content>
              <div v-if="room.can_start && room.room_type_invalid" class="mb-4">
                <Message
                  severity="warn"
                  icon="fa-solid fa-unlink"
                  :closable="false"
                >
                  {{
                    $t("rooms.room_type_invalid_alert", {
                      roomTypeName: room.type.name,
                    })
                  }}
                </Message>
              </div>
              <!-- Room join/start -->

              <div class="flex items-start justify-between gap-2">
                <div class="flex justify-start gap-2">
                  <RoomJoinButton
                    :room-id="room.id"
                    :running="running"
                    :disabled="room.room_type_invalid"
                    :can-start="room.can_start"
                    :token="props.token"
                    :access-code="accessCode"
                    @invalid-code="handleInvalidCode"
                    @invalid-token="handleInvalidToken"
                    @guests-not-allowed="handleGuestsNotAllowed"
                    @changed="reload"
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
import env from "../env.js";
import { useAuthStore } from "../stores/auth";
import { useSettingsStore } from "../stores/settings";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useToast } from "../composables/useToast.js";
import { useRouter } from "vue-router";
import { useApi } from "../composables/useApi.js";
import { useUserPermissions } from "../composables/useUserPermission.js";
import RoomHeader from "../components/RoomHeader.vue";
import RoomShareButton from "../components/RoomShareButton.vue";
import EventBus from "../services/EventBus.js";
import { EVENT_FORBIDDEN, EVENT_UNAUTHORIZED } from "../constants/events.js";

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    default: null,
  },
});

const reloadInterval = ref(null);
const loading = ref(false); // Room settings/details loading
const room = ref(null); // Room object
const accessCode = ref(null); // Access code to use for requests
const accessCodeInput = ref(""); // Access code input modal
const accessCodeInvalid = ref(null); // Is access code invalid
const roomLoading = ref(false); // Room loading indicator for initial load
const tokenInvalid = ref(false); // Room token is invalid
const guestsNotAllowed = ref(false); // Access to room was forbidden
const authThrottledFor = ref(0); // Throttled for authentication (seconds until next try)

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
    toast.info(t("app.flash.guests_only"));
    router.replace({ name: "home" });
    return;
  }

  EventBus.on(EVENT_FORBIDDEN, reload);
  EventBus.on(EVENT_UNAUTHORIZED, reload);

  load();
});

onUnmounted(() => {
  EventBus.off(EVENT_UNAUTHORIZED, reload);
  EventBus.off(EVENT_FORBIDDEN, reload);

  clearInterval(reloadInterval.value);
});

/**
 * Reload room details in a set interval, change in the .env
 */
function startAutoRefresh() {
  reloadInterval.value = setInterval(reload, getRandomRefreshInterval() * 1000);
}

/**
 * Get a random refresh interval for polling to prevent
 * simultaneous request from multiple clients
 * @returns {number} random refresh internal in seconds
 */
function getRandomRefreshInterval() {
  const base = Math.abs(settingsStore.getSetting("room.refresh_rate"));
  // 15% range to scatter the values around the base refresh rate
  const percentageRange = 0.15;
  const absoluteRange = base * percentageRange;
  // Calculate a random refresh internal between (base-range and base+range)
  return base - absoluteRange + Math.random() * absoluteRange * 2;
}

/**
 * Reset room access code and details
 */
function handleGuestsNotAllowed() {
  guestsNotAllowed.value = true;

  // Remove a potential access code
  accessCode.value = null;

  // Set current user to null, as the user is not logged in
  authStore.setCurrentUser(null);
}

/**
 * Reset access code due to errors, show error and reload room details
 */
function handleInvalidCode() {
  // Show access code is valid
  accessCodeInvalid.value = true;
  // Reset access code (not the form input) to load the general room details again
  accessCode.value = null;
  // Show error message
  toast.error(t("rooms.flash.access_code_invalid"));
  reload();
}

/**
 * Reset room due to token error
 */
function handleInvalidToken() {
  // Show error message
  tokenInvalid.value = true;
  toast.error(t("rooms.flash.token_invalid"));
  // Disable auto reload as this error is permanent and the removal of the room link cannot be undone
  clearInterval(reloadInterval.value);
}

/**
 * Initial loading of the room
 */
function load() {
  // Enable loading indicator
  roomLoading.value = true;

  // Build room api url, include access code if set
  const config = {};

  if (props.token) {
    config.headers = { Token: props.token };
  } else if (accessCode.value != null) {
    config.headers = { "Access-Code": accessCode.value };
  }

  const url = "rooms/" + props.id;

  // Load data
  api
    .call(url, config)
    .then((response) => {
      room.value = response.data.data;

      setPageTitle(room.value.name);

      startAutoRefresh();
    })
    .catch((error) => {
      if (error.response) {
        // Room not found
        if (error.response.status === env.HTTP_NOT_FOUND) {
          router.push({ name: "404" });
          return;
        }

        // Room token is invalid
        if (
          error.response.status === env.HTTP_UNAUTHORIZED &&
          error.response.data.message === "invalid_token"
        ) {
          tokenInvalid.value = true;
          return;
        }

        // Forbidden, guests not allowed
        if (
          error.response.status === env.HTTP_FORBIDDEN &&
          error.response.data.message === "guests_not_allowed"
        ) {
          guestsNotAllowed.value = true;
          startAutoRefresh();
          return;
        }
      }

      api.error(error, { redirectOnUnauthenticated: false });
    })
    .finally(() => {
      // Disable loading indicator
      roomLoading.value = false;
    });
}

watch(authThrottledFor, (value) => {
  if (value > 0) {
    setTimeout(() => {
      authThrottledFor.value = value - 1;
    }, 1000);
  }
});

/**
 * Reload the room details/settings
 */
function reload() {
  // Enable loading indicator
  loading.value = true;
  // Build room api url, include access code if set
  const config = {};

  if (props.token) {
    config.headers = { Token: props.token };
  } else if (accessCode.value != null) {
    config.headers = { "Access-Code": accessCode.value };
  }

  const url = "rooms/" + props.id;

  // Load data
  api
    .call(url, config)
    .then((response) => {
      room.value = response.data.data;
      // If logged in, reset the access code valid
      if (room.value.authenticated) {
        accessCodeInvalid.value = null;
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
          router.push({ name: "404" });
          return;
        }

        // Room auth rate limit reached (throttled)
        if (
          error.response.status === env.HTTP_TOO_MANY_REQUESTS &&
          error.response.data?.limit === "room_auth"
        ) {
          authThrottledFor.value = error.response.data.retry_after;
        }

        // Access code invalid
        if (
          error.response.status === env.HTTP_UNAUTHORIZED &&
          error.response.data.message === "invalid_code"
        ) {
          return handleInvalidCode();
        }

        // Room token is invalid
        if (
          error.response.status === env.HTTP_UNAUTHORIZED &&
          error.response.data.message === "invalid_token"
        ) {
          return handleInvalidToken();
        }

        // Forbidden, guests not allowed
        if (
          error.response.status === env.HTTP_FORBIDDEN &&
          error.response.data.message === "guests_not_allowed"
        ) {
          return handleGuestsNotAllowed();
        }
      }
      api.error(error, { redirectOnUnauthenticated: false });
    })
    .finally(() => {
      // Disable loading indicator
      loading.value = false;
    });
}

/**
 * Show room name in title
 * @param {string} roomName Name of the room
 */
function setPageTitle(roomName) {
  document.title = roomName + " - " + settingsStore.getSetting("general.name");
}

/**
 * Handle login with access code
 */
function login() {
  // Parse to int
  accessCode.value = parseInt(accessCodeInput.value.replace(/[-]/g, ""));
  // Reload the room with an access code
  reload();
}

const running = computed(() => {
  return (
    room.value.last_meeting != null &&
    room.value.last_meeting.end == null &&
    room.value.last_meeting.detached == null
  );
});

/**
 * Show invitation section only to users with the required permission
 */
const viewInvitation = computed(() => {
  return userPermissions.can("viewInvitation", room.value);
});
</script>
