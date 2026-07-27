<template>
  <!-- If membership is enabled, allow user to become member -->
  <Button
    v-if="userPermissions.can('becomeMember', room)"
    id="join-membership-button"
    v-tooltip="$t('rooms.become_member')"
    :disabled="isLoadingAction || disabled"
    severity="secondary"
    icon="fa-solid fa-user"
    :aria-label="$t('rooms.become_member')"
    data-test="room-join-membership-button"
    @click="joinMembership"
  />
  <!-- If user is member, allow user to end the membership -->
  <Button
    v-if="room.is_member"
    v-tooltip="$t('rooms.end_membership.button')"
    :disabled="isLoadingAction || disabled"
    severity="contrast"
    icon="fa-solid fa-user"
    :aria-label="$t('rooms.end_membership.button')"
    data-test="room-end-membership-button"
    @click="modalVisible = true"
  />

  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('rooms.end_membership.title')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="false"
    :closable="!isLoadingAction"
    data-test="end-membership-dialog"
  >
    {{ $t("rooms.end_membership.message") }}

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          :label="$t('app.no')"
          severity="secondary"
          :disabled="isLoadingAction"
          data-test="dialog-cancel-button"
          @click="modalVisible = false"
        />
        <Button
          :label="$t('app.yes')"
          severity="danger"
          :loading="isLoadingAction"
          data-test="dialog-continue-button"
          @click="leaveMembership"
        />
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import { ref } from "vue";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { useApi } from "../composables/useApi.js";
import { HTTP_ERROR_ROOM_INVALID_AUTH_TOKEN } from "../constants/httpCustomErrorMessages.js";
import {
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_UNAUTHORIZED,
} from "../constants/httpStatusCodes.js";

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
  roomAuthToken: {
    type: Object,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
    required: false,
  },
});

const emit = defineEmits([
  "joinedMembership",
  "leftMembership",
  "invalidRoomAuthToken",
  "membershipDisabled",
]);

const isLoadingAction = ref(false);
const modalVisible = ref(false);

const userPermissions = useUserPermissions();
const api = useApi();

/**
 * Become a room member
 */
function joinMembership() {
  // Enable loading indicator
  isLoadingAction.value = true;

  // Join room as member, send room auth token if needed
  const config = {
    method: "post",
  };

  if (props.roomAuthToken) {
    config.params = {
      room_auth_token: props.roomAuthToken.id,
      room_auth_token_type: props.roomAuthToken.type,
    };
  }

  api
    .call("rooms/" + props.room.id + "/membership", config)
    .then(() => {
      emit("joinedMembership");
    })
    .catch((error) => {
      // Access code invalid
      if (
        error.response.status === HTTP_STATUS_UNAUTHORIZED &&
        error.response.data.message === HTTP_ERROR_ROOM_INVALID_AUTH_TOKEN
      ) {
        return emit("invalidRoomAuthToken");
      }

      // Membership is disabled
      if (error.response.status === HTTP_STATUS_FORBIDDEN) {
        emit("membershipDisabled");
      }

      api.error(error, { redirectOnUnauthenticated: false });
    })
    .finally(() => {
      isLoadingAction.value = false;
    });
}

/**
 * Leave room membership
 */
function leaveMembership() {
  // Enable loading indicator
  isLoadingAction.value = true;
  api
    .call("rooms/" + props.room.id + "/membership", {
      method: "delete",
    })
    .then(() => {
      emit("leftMembership");
      modalVisible.value = false;
    })
    .catch((error) => {
      api.error(error, { redirectOnUnauthenticated: false });
    })
    .finally(() => {
      isLoadingAction.value = false;
    });
}
</script>
