<template>
  <div>
    <form @submit="changePassword">

      <div class="field grid" v-if="isOwnUser">
        <label for="current_password" class="col-12 mb-2 md:col-3 md:mb-0">{{ $t('auth.current_password') }}</label>
        <div class="col-12 md:col-9">
          <InputText
            id="current_password"
            v-model="currentPassword"
            type="password"
            required
            :disabled="isBusy"
            class="w-full"
            :invalid="formErrors.fieldInvalid('current_password')"
          />
          <p class="p-error" v-html="formErrors.fieldError('current_password')" />
        </div>
      </div>

      <div class="field grid">
        <label for="new_password" class="col-12 mb-2 md:col-3 md:mb-0">{{ $t('auth.new_password') }}</label>
        <div class="col-12 md:col-9">
          <InputText
            id="new_password"
            v-model="newPassword"
            type="password"
            required
            :disabled="isBusy"
            class="w-full"
            :invalid="formErrors.fieldInvalid('new_password')"
          />
          <p class="p-error" v-html="formErrors.fieldError('new_password')" />
        </div>
      </div>

      <div class="field grid">
        <label for="new_password_confirmation" class="col-12 mb-2 md:col-3 md:mb-0">{{ $t('auth.new_password_confirmation') }}</label>
        <div class="col-12 md:col-9">
          <InputText
            id="new_password_confirmation"
            v-model="newPasswordConfirmation"
            type="password"
            required
            :disabled="isBusy"
            class="w-full"
            :invalid="formErrors.fieldInvalid('new_password_confirmation')"
          />
          <p class="p-error" v-html="formErrors.fieldError('new_password_confirmation')" />
        </div>
      </div>
      <div class="flex justify-content-end">
        <Button
          :disabled="isBusy"
          severity="success"
          type="submit"
          :loading="isBusy"
          :label="$t('auth.change_password')"
          icon="fa-solid fa-save"
        />
      </div>
    </form>
  </div>
</template>

<script setup>
import env from '../env';
import { useAuthStore } from '../stores/auth';
import { computed, ref } from 'vue';
import { useApi } from '../composables/useApi.js';
import { useFormErrors } from '../composables/useFormErrors.js';
import { useToast } from '../composables/useToast.js';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['updateUser', 'notFoundError']);

const api = useApi();
const formErrors = useFormErrors();
const authStore = useAuthStore();
const toast = useToast();
const { t } = useI18n();

const currentPassword = ref('');
const newPassword = ref('');
const newPasswordConfirmation = ref('');
const isBusy = ref(false);

const isOwnUser = computed(() => {
  return authStore.currentUser?.id === props.user.id;
});

function changePassword (event) {
  if (event) {
    event.preventDefault();
  }

  isBusy.value = true;
  formErrors.clear();

  const data = {
    new_password: newPassword.value,
    new_password_confirmation: newPasswordConfirmation.value
  };

  if (isOwnUser.value) {
    data.current_password = currentPassword.value;
  }

  api.call('users/' + props.user.id + '/password', {
    method: 'PUT',
    data
  })
    .then(response => {
      emit('updateUser', response.data.data);
      toast.success(t('auth.flash.password_changed'));
    })
    .catch(error => {
      if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
        emit('notFoundError', error);
      } else if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
        formErrors.set(error.response.data.errors);
      } else {
        api.error(error);
      }
    }).finally(() => {
      isBusy.value = false;
      currentPassword.value = null;
      newPassword.value = null;
      newPasswordConfirmation.value = null;
    });
}
</script>
