<template>
  <div>
    <AdminPanel :title="$t('admin.users.email')">
      <form @submit.prevent="save" class="flex flex-col gap-4">
        <div class="field grid grid-cols-12 gap-4" v-if="!viewOnly && isOwnUser && userPermissions.can('updateAttributes', user)">
          <label for="current_password" class="col-span-12 mb-2 md:col-span-3 md:mb-0">{{ $t('auth.current_password') }}</label>
          <div class="col-span-12 md:col-span-9">
            <InputText
              id="current_password"
              v-model="currentPassword"
              type="password"
              required
              :disabled="isBusy"
              class="w-full"
              :invalid="formErrors.fieldInvalid('current_password')"
            />
            <FormError :errors="formErrors.fieldError('current_password')" />
          </div>
        </div>

        <div class="field grid grid-cols-12 gap-4">
          <label for="email" class="col-span-12 mb-2 md:col-span-3 md:mb-0">{{ $t('app.email') }}</label>
          <div class="col-span-12 md:col-span-9">
            <InputText
              id="email"
              v-model="email"
              type="email"
              required
              :disabled="isBusy || viewOnly || !userPermissions.can('updateAttributes', user)"
              class="w-full"
              :invalid="formErrors.fieldInvalid('email')"
            />
            <FormError :errors="formErrors.fieldError('email')" />
          </div>
        </div>

        <div class="flex justify-end">
          <Button
            v-if="!viewOnly && userPermissions.can('updateAttributes', user)"
            :disabled="isBusy"
            type="submit"
            :loading="isBusy"
            :label="$t('auth.change_email')"
            icon="fa-solid fa-save"
          />
        </div>

        <div v-if="validationRequiredEmail">
          <Message
            severity="success"
            class="mt-4"
          >
            {{ $t('auth.send_email_confirm_mail', {email: validationRequiredEmail}) }}
          </Message>
        </div>

      </form>
    </AdminPanel>
  </div>
</template>

<script setup>
import env from '../env';
import { useAuthStore } from '../stores/auth';
import { computed, onMounted, ref } from 'vue';
import { useApi } from '../composables/useApi.js';
import { useUserPermissions } from '../composables/useUserPermission.js';
import { useFormErrors } from '../composables/useFormErrors.js';
import { useToast } from '../composables/useToast.js';
import { useI18n } from 'vue-i18n';
import AdminPanel from './AdminPanel.vue';

const props = defineProps({
  user: {
    type: Object,
    required: true
  },
  viewOnly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['updateUser', 'notFoundError']);

const api = useApi();
const userPermissions = useUserPermissions();
const formErrors = useFormErrors();
const authStore = useAuthStore();
const toast = useToast();
const { t } = useI18n();

const currentPassword = ref('');
const email = ref('');
const isBusy = ref(false);
const validationRequiredEmail = ref(null);

const isOwnUser = computed(() => {
  return authStore.currentUser.id === props.user.id;
});

onMounted(() => {
  email.value = props.user.email;
  validationRequiredEmail.value = null;
});

function save (event) {
  if (event) {
    event.preventDefault();
  }

  isBusy.value = true;
  formErrors.clear();
  validationRequiredEmail.value = null;

  const data = {
    email: email.value
  };

  if (isOwnUser.value) {
    data.current_password = currentPassword.value;
  }

  api.call(`users/${props.user.id}/email`, {
    method: 'PUT',
    data
  })
    .then(response => {
      if (response.status === 200) {
        emit('updateUser', response.data.data);
      }
      if (response.status === 202) {
        validationRequiredEmail.value = email.value;
        email.value = props.user.email;
      }
    })
    .catch(error => {
      if (error.response && error.response.status === env.HTTP_NOT_FOUND) {
        emit('notFoundError', error);
      } else if (error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
        formErrors.set(error.response.data.errors);
      } else if (error.response.status === env.HTTP_EMAIL_CHANGE_THROTTLE) {
        toast.error(t('auth.throttle_email'));
      } else {
        api.error(error);
      }
    })
    .finally(() => {
      currentPassword.value = null;
      isBusy.value = false;
    });
}
</script>
