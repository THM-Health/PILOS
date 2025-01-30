<template>
  <div class="container">
    <div class="mb-8 mt-6 grid grid-cols-12 gap-4">
      <div
        class="col-span-12 md:col-span-8 md:col-start-3 lg:col-span-6 lg:col-start-4"
      >
        <Card>
          <template #title>
            {{
              welcome
                ? $t("auth.input_new_password_new_user")
                : $t("auth.input_new_password")
            }}
          </template>
          <template #content>
            <form @submit.prevent="submit">
              <div class="flex flex-col gap-2" data-test="new-password-field">
                <label for="new_password">{{ $t("auth.new_password") }}</label>
                <InputText
                  id="new_password"
                  v-model="password"
                  type="password"
                  required
                  :disabled="loading"
                  class="w-full"
                  :invalid="formErrors.fieldInvalid('password')"
                />
                <FormError :errors="formErrors.fieldError('password')" />
              </div>

              <div
                class="flex flex-col gap-2"
                data-test="password-confirmation-field"
              >
                <label for="password_confirmation">{{
                  $t("auth.new_password_confirmation")
                }}</label>
                <InputText
                  id="password_confirmation"
                  v-model="passwordConfirmation"
                  type="password"
                  required
                  :disabled="loading"
                  class="w-full"
                  :invalid="formErrors.fieldInvalid('password_confirmation')"
                />
                <FormError
                  :errors="formErrors.fieldError('password_confirmation')"
                />
              </div>

              <FormError :errors="formErrors.fieldError('email')" />
              <FormError :errors="formErrors.fieldError('token')" />

              <Button
                type="submit"
                :disabled="loading"
                :loading="loading"
                :label="
                  welcome ? $t('auth.set_password') : $t('auth.change_password')
                "
                data-test="reset-password-button"
              />
            </form>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import env from "../env";
import { useAuthStore } from "../stores/auth";
import { ref } from "vue";
import { useApi } from "../composables/useApi.js";
import { useFormErrors } from "../composables/useFormErrors.js";
import { useToast } from "../composables/useToast.js";
import { useRouter } from "vue-router";

const props = defineProps({
  token: {
    type: String,
    default: null,
  },

  email: {
    type: String,
    default: null,
  },

  welcome: {
    type: Boolean,
    default: false,
  },
});

const loading = ref(false);
const password = ref(null);
const passwordConfirmation = ref(null);

const api = useApi();
const formErrors = useFormErrors();
const authStore = useAuthStore();
const toast = useToast();
const router = useRouter();

/**
 * Sends a request with a new password to set for the given email through the query parameters
 * in the url. If an error occurs a flash message will be shown. Otherwise if the reset is
 * successful, the current user is requested on the server and the locale of the frontend
 * gets updated with the locale of the current user.
 */
function submit() {
  loading.value = true;
  formErrors.clear();

  const config = {
    method: "post",
    data: {
      email: props.email,
      token: props.token,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    },
  };

  api
    .call("password/reset", config, true)
    .then(async (response) => {
      toast.success(response.data.message);
      await authStore.getCurrentUser();
      await router.push({ name: "home" });
    })
    .catch((error) => {
      if (
        error.response &&
        error.response.status === env.HTTP_UNPROCESSABLE_ENTITY
      ) {
        formErrors.set(error.response.data.errors);
      } else {
        api.error(error);
      }
    })
    .finally(() => {
      loading.value = false;
    });
}
</script>
