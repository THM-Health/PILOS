<template>
  <Button
    :id="'resetPassword' + props.id"
    v-tooltip="$t('admin.users.reset_password.item', { firstname: props.firstname, lastname: props.lastname })"
    :aria-label="$t('admin.users.reset_password.item', { firstname: props.firstname, lastname: props.lastname })"
    :disabled="isBusy"
    severity="warning"
    @click="showResetPasswordModal"
    icon="fa-solid fa-key"
  />

  <Dialog
    v-model:visible="showModal"
    modal
    :header="$t('admin.users.reset_password.title')"
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :closeOnEscape="!isBusy"
    :dismissableMask="!isBusy"
    :closeable="!isBusy"
    :draggable = false
  >
    <span>
      {{ $t('admin.users.reset_password.confirm', { firstname: props.firstname, lastname: props.lastname }) }}
    </span>
    <template #footer>
      <Button :label="$t('app.no')" severity="secondary" @click="showModal = false"/>
      <Button :label="$t('app.yes')" severity="danger" :loading="isBusy" @click="resetPassword"/>
    </template>
  </Dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useApi } from '../composables/useApi.js';
import { useToast } from '../composables/useToast.js';
import { useI18n } from 'vue-i18n';

const api = useApi();
const toast = useToast();
const { t } = useI18n();

const props = defineProps({
  id: {
    type: Number,
    required: true
  },
  firstname: {
    type: String,
    required: true
  },
  lastname: {
    type: String,
    required: true
  },
  email: {
    required: true
  }
});

const showModal = ref(false);
const isBusy = ref(false);

/**
 * Shows the reset password modal
 *
 */
function showResetPasswordModal () {
  showModal.value = true;
}
/**
  * Resets the password for the given user.
  */
function resetPassword () {
  isBusy.value = true;
  api.call(`users/${props.id}/resetPassword`, {
    method: 'post'
  }).then(() => {
    showModal.value = false;
    toast.success(t('admin.users.password_reset_success', { mail: props.email }));
  }).catch(error => {
    api.error(error);
  }).finally(() => {
    isBusy.value = false;
  });
}
</script>
