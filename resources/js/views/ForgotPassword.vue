<template>
  <div class="container">
    <div class="grid mt-4 mb-5">
      <div class="col-12 md:col-8 lg:col-6 md:col-offset-2 lg:col-offset-3">
        <Card>
          <template #title> {{ $t('auth.reset_password') }} </template>
          <template #content>
            <form @submit.prevent="submit">
              <div class="flex flex-column gap-2">
                <label for="email">{{ $t('app.email') }}</label>
                <InputText
                  id="email"
                  v-model="email"
                  type="email"
                  required
                  :disabled="loading"
                  class="w-full"
                  :invalid="formErrors.fieldInvalid('email')"
                />
                <p class="p-error" v-html="formErrors.fieldError('email')" />
              </div>

              <Button
                type="submit"
                :disabled="loading"
                :loading="loading"
                :label="$t('auth.send_password_reset_link')"
              />
            </form>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFormErrors } from '../composables/useFormErrors.js';
import { useApi } from '../composables/useApi.js';
import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { useToast } from '../composables/useToast.js';

const email = ref(null);
const loading = ref(false);

const formErrors = useFormErrors();
const api = useApi();
const toast = useToast();
const router = useRouter();

/**
 * Sends a password reset request to the server for the given email.
 */
function submit () {
  loading.value = true;
  const config = {
    method: 'post',
    data: {
      email: email.value
    }
  };

  api.call('password/email', config, true).then(response => {
    toast.success(response.data.message);
    router.push({ name: 'home' });
  }).catch(error => {
    api.error(error);
  }).finally(() => {
    loading.value = false;
  });
}
</script>
