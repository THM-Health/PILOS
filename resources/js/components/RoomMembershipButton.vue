<template>
  <!-- If membership is enabled, allow user to become member -->
  <Button
    v-if="userPermissions.can('becomeMember', room)"
    id="join-membership-button"
    :disabled="isLoadingAction || disabled"
    @click="joinMembership"
    severity="secondary"
    icon="fa-solid fa-user"
    v-tooltip="$t('rooms.become_member')"
    :aria-label="$t('rooms.become_member')"
  />
  <!-- If user is member, allow user to end the membership -->
  <Button
    v-if="room.is_member && authStore.isAuthenticated"
    :disabled="isLoadingAction || disabled"
    @click="showModal = true"
    icon="fa-solid fa-user"
    v-tooltip="$t('rooms.end_membership.button')"
    :aria-label="$t('rooms.end_membership.button')"
  />

  <Dialog
    v-model:visible="showModal"
    modal
    :header="$t('rooms.end_membership.title')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :closeOnEscape="!isLoadingAction"
    :dismissableMask="false"
    :closable="!isLoadingAction"
  >
    {{ $t('rooms.end_membership.message') }}

    <template #footer>
      <div class="flex justify-content-end gap-2">
        <Button :label="$t('app.no')" severity="secondary" @click="showModal = false" :disabled="isLoadingAction" />
        <Button :label="$t('app.yes')" severity="danger" :loading="isLoadingAction" :disabled="isLoadingAction" @click="leaveMembership" />
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import env from '../env';
import { ref } from 'vue';
import { useUserPermissions } from '../composables/useUserPermission.js';
import { useApi } from '../composables/useApi.js';
import {useAuthStore} from "../stores/auth.js";

const props = defineProps({
  room: {
    type: Object,
    required: true
  },
  accessCode: {
    type: Number,
    required: false
  },
  disabled: {
    type: Boolean,
    default: false,
    required: false
  }
});

const emit = defineEmits(['added', 'removed', 'invalidCode', 'membershipDisabled']);

const isLoadingAction = ref(false);
const showModal = ref(false);

const userPermissions = useUserPermissions();
const api = useApi();
const authStore = useAuthStore();

/**
 * Become a room member
 */
function joinMembership () {
  // Enable loading indicator
  isLoadingAction.value = true;

  // Join room as member, send access code if needed
  const config = props.accessCode == null ? { method: 'post' } : { method: 'post', headers: { 'Access-Code': props.accessCode } };
  api.call('rooms/' + props.room.id + '/membership', config)
    .then(() => {
      emit('added');
    })
    .catch((error) => {
      // Access code invalid
      if (error.response.status === env.HTTP_UNAUTHORIZED && error.response.data.message === 'invalid_code') {
        return emit('invalidCode');
      }

      // Membership is disabled
      if (error.response.status === env.HTTP_FORBIDDEN) {
        emit('membershipDisabled');
      }

      api.error(error);
    }).finally(() => {
      isLoadingAction.value = false;
    });
}

/**
 * Leave room membership
 */
function leaveMembership () {
  // Enable loading indicator
  isLoadingAction.value = true;
  api.call('rooms/' + props.room.id + '/membership', {
    method: 'delete'
  }).then(() => {
    emit('removed');
    showModal.value = false;
  }).catch((error) => {
    api.error(error);
  }).finally(() => {
    isLoadingAction.value = false;
  });
}

</script>
<style scoped>

</style>
