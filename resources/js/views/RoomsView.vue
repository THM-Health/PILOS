<template>
  <div v-cloak class="container mt-8 mb-8">
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
            class="-mt-8 flex !h-16 !w-16 items-center justify-center rounded-full"
          >
            <i class="fa-solid fa-unlink text-2xl text-white"></i>
          </Badge>
        </template>
        <template #content>
          <h1 class="font-bold">
            {{ $t("rooms.invalid_personalized_link") }}
          </h1>
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
            class="-mt-8 flex !h-16 !w-16 items-center justify-center rounded-full"
          >
            <i class="fa-solid fa-lock text-2xl text-white"></i>
          </Badge>
        </template>
        <template #content>
          <RoomBBBMessage :reason="bbbReason" :errors="bbbErrors" />

          <h1 class="font-bold">
            {{ $t("rooms.only_used_by_authenticated_users") }}
          </h1>
        </template>
        <template #footer>
          <div class="mt-4 flex w-full justify-start">
            <Button
              data-test="login-room-button"
              icon="fa-solid fa-lock"
              :label="$t('auth.login')"
              as="router-link"
              :to="{ name: 'login', query: { redirect: $route.fullPath } }"
            />
          </div>
        </template>
      </Card>
    </div>

    <div v-else>
      <div v-if="!room">
        <div class="my-2 text-center" data-test="no-room-overlay">
          <i
            v-if="roomLoading || authLoading"
            class="fa-solid fa-circle-notch fa-spin text-3xl"
            data-test="room-loading-spinner"
          />
          <Button
            v-else
            icon="fa-solid fa-sync"
            :label="$t('app.reload')"
            :aria-label="$t('app.reload')"
            data-test="reload-button"
            @click="initializeRoomView"
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
                class="-mt-8 flex !h-16 !w-16 items-center justify-center rounded-full"
              >
                <i class="fa-solid fa-lock text-2xl text-white"></i>
              </Badge>
            </template>
            <template #content>
              <RoomHeader
                :room="room"
                :loading="loading || authLoading"
                :details-inline="false"
                :hide-favorites="true"
                :hide-membership="true"
                :disable-reload="authThrottledFor > 0"
                :bbb-errors="bbbErrors"
                :bbb-reason="bbbReason"
                @reload="reload(true)"
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
                    :mask="room.legacy_code ? '******' : '999-999-999'"
                    :placeholder="room.legacy_code ? '123abc' : '123-456-789'"
                    :invalid="
                      accessCodeInvalid ||
                      formErrors.fieldInvalid('access_code')
                    "
                    :disabled="authThrottledFor > 0"
                    class="text-center"
                    @keydown.enter="login"
                  />
                  <Button
                    :loading="loading || authLoading"
                    icon="fa-solid fa-lock"
                    :label="$t('rooms.login')"
                    data-test="room-login-button"
                    :disabled="authThrottledFor > 0 || loading || authLoading"
                    @click="login"
                  />
                </InputGroup>
                <FormError :errors="formErrors.fieldError('access_code')" />
                <p
                  v-if="authThrottledFor > 0"
                  class="mt-1 text-red-500"
                  role="alert"
                >
                  {{ $t("rooms.auth_throttled", authThrottledFor) }}
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
                :room-auth-token="roomAuthToken"
                :details-inline="true"
                :bbb-errors="bbbErrors"
                :bbb-reason="bbbReason"
                @reload="reload(true)"
                @invalid-room-auth-token="handleInvalidRoomAuthToken"
                @joined-membership="
                  roomAuthToken = null;
                  reload(true);
                "
                @left-membership="reload"
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
                    :room-auth-token="roomAuthToken"
                    @invalid-room-auth-token="handleInvalidRoomAuthToken"
                    @require-code="
                      handleRequireCode();
                      reload();
                    "
                    @guests-not-allowed="handleGuestsNotAllowed"
                    @changed="reload(true)"
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
            :room-auth-token="roomAuthToken"
            :room="room"
            @invalid-room-auth-token="handleInvalidRoomAuthToken"
            @require-code="
              handleRequireCode();
              reload();
            "
            @guests-not-allowed="handleGuestsNotAllowed"
            @settings-changed="reload(true)"
            @transferred-ownership="reload"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
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
import {
  ROOM_AUTH_TOKEN_TYPE_CODE,
  ROOM_AUTH_TOKEN_TYPE_PERSONALIZED_LINK,
} from "../constants/roomAuthTokenTypes.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import {
  HTTP_ERROR_GUESTS_NOT_ALLOWED,
  HTTP_ERROR_ROOM_INVALID_CODE,
  HTTP_ERROR_ROOM_INVALID_PERSONALIZED_LINK,
  HTTP_ERROR_ROOM_INVALID_AUTH_TOKEN,
} from "../constants/httpCustomErrorMessages.js";
import {
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_TOO_MANY_REQUESTS,
  HTTP_STATUS_UNAUTHORIZED,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "../constants/httpStatusCodes.js";
import { useRouteStore } from "../stores/route.js";

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    default: null,
  },
  bbbReason: {
    type: String,
    default: null,
  },
  bbbErrors: {
    type: String,
    default: null,
  },
});

const reloadInterval = ref(null);
const loading = ref(false); // Room settings/details loading
const room = ref(null); // Room object
const roomAuthToken = ref(null); // Room authentication token
const authLoading = ref(false); // Room authentication loading
const accessCodeInput = ref(""); // Access code input modal
const accessCodeInvalid = ref(null); // Is access code invalid
const roomLoading = ref(false); // Room loading indicator for initial load
const tokenInvalid = ref(false); // Room token is invalid
const guestsNotAllowed = ref(false); // Access to room was forbidden
const authThrottledFor = ref(0); // Throttled for authentication (seconds until next try)

const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const routeStore = useRouteStore();
const userPermissions = useUserPermissions();
const formErrors = useFormErrors();
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

  initializeRoomView();
});

onUnmounted(() => {
  EventBus.off(EVENT_UNAUTHORIZED, reload);
  EventBus.off(EVENT_FORBIDDEN, reload);

  stopAutoRefresh();
});

/**
 * Reload room details in a set interval, change in the .env
 */
function startAutoRefresh() {
  if (reloadInterval.value === null) {
    reloadInterval.value = setInterval(
      reload,
      getRandomRefreshInterval() * 1000,
      true,
    );
  }
}

function stopAutoRefresh() {
  if (reloadInterval.value === null) {
    return;
  }
  clearInterval(reloadInterval.value);
  reloadInterval.value = null;
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

  // Remove potential room auth token
  roomAuthToken.value = null;

  // Set current user to null, as the user is not logged in
  authStore.setCurrentUser(null);

  // Disable auto reload as this error is permanent until the room settings are changed
  // or the user logs in
  stopAutoRefresh();
}

/**
 * Handle invalid room authentication token error
 * based on the token type (access code or personal link)
 */
function handleInvalidRoomAuthToken() {
  const tokenType = roomAuthToken.value?.type;
  roomAuthToken.value = null;
  if (!tokenType || tokenType === ROOM_AUTH_TOKEN_TYPE_CODE) {
    // Access code is invalid or missing
    return handleInvalidCode();
  } else if (tokenType === ROOM_AUTH_TOKEN_TYPE_PERSONALIZED_LINK) {
    // Personal link token is invalid or session expired
    window.location.reload();
  }
}

/**
 * Reset access code due to errors, show error and reload room details
 */
function handleInvalidCode() {
  // Show access code is invalid
  accessCodeInvalid.value = true;

  // Show error message
  toast.error(t("rooms.flash.access_code_invalid"));
  reload();
}

/**
 * Reset access code error states and access code input and display error message
 */
function handleRequireCode() {
  // Reset access code error states to prevent confusing error state
  accessCodeInvalid.value = null;
  formErrors.clear();

  // Reset access code input
  accessCodeInput.value = "";

  // Show error message
  toast.error(t("rooms.require_access_code"));
}

/**
 * Reset room due to personalized link error
 */
function handleInvalidPersonalizedLink() {
  // Show error message
  tokenInvalid.value = true;
  toast.error(t("rooms.flash.personalized_link_invalid"));
  // Disable auto reload as this error is permanent and the removal of the room link cannot be undone
  stopAutoRefresh();
}

/**
 * Initial loading of the room
 */
function load() {
  // Enable loading indicator
  roomLoading.value = true;

  // Build room api url, include access code if set
  const config = {};

  if (roomAuthToken.value) {
    config.params = {
      room_auth_token: roomAuthToken.value.id,
      room_auth_token_type: roomAuthToken.value.type,
    };
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
        // Room auth token is invalid
        if (
          error.response.status === HTTP_STATUS_UNAUTHORIZED &&
          error.response.data.message === HTTP_ERROR_ROOM_INVALID_AUTH_TOKEN
        ) {
          return handleInvalidRoomAuthToken();
        }

        // Forbidden, guests not allowed
        if (
          error.response.status === HTTP_STATUS_FORBIDDEN &&
          error.response.data.message === HTTP_ERROR_GUESTS_NOT_ALLOWED
        ) {
          guestsNotAllowed.value = true;
          return;
        }
      }

      api.error(error, {
        redirectOnUnauthenticated: false,
      });
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
 * @param {boolean} [checkForRequireCodeError=false]
 */
function reload(checkForRequireCodeError = false) {
  // Enable loading indicator
  loading.value = true;
  // Build room api url, include access code if set
  const config = {};

  if (roomAuthToken.value) {
    config.params = {
      room_auth_token: roomAuthToken.value.id,
      room_auth_token_type: roomAuthToken.value.type,
    };
  }

  const url = "rooms/" + props.id;

  // Load data
  api
    .call(url, config)
    .then((response) => {
      // Room was authenticated but now requires an access code
      if (
        checkForRequireCodeError &&
        room.value?.authenticated &&
        !response.data.data.authenticated
      ) {
        handleRequireCode();
      }

      room.value = response.data.data;

      setPageTitle(room.value.name, false);

      startAutoRefresh();

      // Update current user, if logged in/out in another tab or session expired
      // to have the can/cannot component use the correct state
      authStore.setCurrentUser(room.value.current_user);

      guestsNotAllowed.value = false;
    })
    .catch((error) => {
      if (error.response) {
        // Room auth token is invalid
        if (
          error.response.status === HTTP_STATUS_UNAUTHORIZED &&
          error.response.data.message === HTTP_ERROR_ROOM_INVALID_AUTH_TOKEN
        ) {
          return handleInvalidRoomAuthToken();
        }

        // Forbidden, guests not allowed
        if (
          error.response.status === HTTP_STATUS_FORBIDDEN &&
          error.response.data.message === HTTP_ERROR_GUESTS_NOT_ALLOWED
        ) {
          return handleGuestsNotAllowed();
        }
      }
      api.error(error, {
        redirectOnUnauthenticated: false,
      });
    })
    .finally(() => {
      // Disable loading indicator
      loading.value = false;
    });
}

/**
 * Initialize room view, authenticate if personalized link is provided and initial
 * loading of the room
 */
function initializeRoomView() {
  if (props.token && !roomAuthToken.value) {
    authenticate(ROOM_AUTH_TOKEN_TYPE_PERSONALIZED_LINK, props.token).then(
      (success) => {
        if (success) {
          load();
        }
      },
    );
  } else {
    load();
  }
}

/**
 * Show room name in title
 * @param {string} roomName Name of the room
 * @param announce
 */
function setPageTitle(roomName, announce = true) {
  routeStore.setPageTitle(roomName, announce);
}

/**
 * Handle login with access code
 */
function login() {
  // Remove dashes from the access code
  const accessCode = accessCodeInput.value.replace(/[-]/g, "");

  // Retrieve room auth token
  authenticate(ROOM_AUTH_TOKEN_TYPE_CODE, accessCode).then((success) => {
    if (success) {
      // Reload room details after authentication
      reload(true);
    }
  });
}

/**
 * Authenticate using access code or personal link token to retrieve room auth token
 *
 * @param type
 * @param codeOrToken
 * @returns {Promise<boolean>}
 */
function authenticate(type, codeOrToken) {
  return new Promise((resolve) => {
    authLoading.value = true;
    let data;

    if (type === ROOM_AUTH_TOKEN_TYPE_PERSONALIZED_LINK) {
      data = {
        type: ROOM_AUTH_TOKEN_TYPE_PERSONALIZED_LINK,
        personalized_link_token: codeOrToken,
      };
    } else if (type === ROOM_AUTH_TOKEN_TYPE_CODE) {
      data = {
        type: ROOM_AUTH_TOKEN_TYPE_CODE,
        access_code: codeOrToken,
      };
    }

    formErrors.clear();
    accessCodeInvalid.value = null;

    // Retrieve room auth token
    const url = "rooms/" + props.id + "/auth";

    api
      .call(url, {
        method: "POST",
        data: data,
      })
      .then((response) => {
        if (response.status !== 204) {
          // Set room auth token for further requests if response is not empty
          roomAuthToken.value = response.data.data;
        }

        resolve(true);
      })
      .catch((error) => {
        resolve(false);
        if (error.response) {
          // Validation errors
          if (error.response.status === HTTP_STATUS_UNPROCESSABLE_ENTITY) {
            if (type === ROOM_AUTH_TOKEN_TYPE_PERSONALIZED_LINK) {
              handleInvalidPersonalizedLink();
            } else if (type === ROOM_AUTH_TOKEN_TYPE_CODE) {
              formErrors.set(error.response.data.errors);
            }
            return;
          }
          // Room auth rate limit reached (throttled)
          if (
            error.response.status === HTTP_STATUS_TOO_MANY_REQUESTS &&
            error.response.data?.limit === "room_auth"
          ) {
            authThrottledFor.value = error.response.data.retry_after;
          }
          // Room token is invalid
          if (
            error.response.status === HTTP_STATUS_UNAUTHORIZED &&
            error.response.data.message ===
              HTTP_ERROR_ROOM_INVALID_PERSONALIZED_LINK
          ) {
            handleInvalidPersonalizedLink();
            return;
          }
          // Access code is invalid
          if (
            error.response.status === HTTP_STATUS_UNAUTHORIZED &&
            error.response.data.message === HTTP_ERROR_ROOM_INVALID_CODE
          ) {
            handleInvalidCode();
            return;
          }
          // Forbidden, guests not allowed
          if (
            error.response.status === HTTP_STATUS_FORBIDDEN &&
            error.response.data.message === HTTP_ERROR_GUESTS_NOT_ALLOWED
          ) {
            handleGuestsNotAllowed();
            return;
          }
        }
        api.error(error, {
          redirectOnUnauthenticated: false,
        });
      })
      .finally(() => {
        authLoading.value = false;
      });
  });
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
