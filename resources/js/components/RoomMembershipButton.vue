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
          :disabled="isLoadingAction"
          data-test="dialog-continue-button"
          @click="leaveMembership"
        />
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import env from "../env";
import { ref } from "vue";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { useApi } from "../composables/useApi.js";

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
  accessCode: {
    type: Number,
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
  "invalidCode",
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

  // Join room as member, send access code if needed
  const config =
    props.accessCode == null
      ? { method: "post" }
      : { method: "post", headers: { "Access-Code": props.accessCode } };
  api
    .call("rooms/" + props.room.id + "/membership", config)
    .then(() => {
      emit("joinedMembership");
    })
    .catch((error) => {
      // Access code invalid
      if (
        error.response.status === env.HTTP_UNAUTHORIZED &&
        error.response.data.message === "invalid_code"
      ) {
        return emit("invalidCode");
      }

      // Membership is disabled
      if (error.response.status === env.HTTP_FORBIDDEN) {
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
