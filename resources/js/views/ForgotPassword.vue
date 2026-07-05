<!--
SPDX-FileCopyrightText: 2021 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <div class="container">
    <div class="mt-6 mb-8 grid grid-cols-12 gap-4">
      <div
        class="col-span-12 md:col-span-8 md:col-start-3 lg:col-span-6 lg:col-start-4"
      >
        <Card>
          <template #title> {{ $t("auth.reset_password") }} </template>
          <template #content>
            <Form :disabled="loading" @submit="submit">
              <div class="field flex flex-col gap-2" data-test="email-field">
                <label for="email">{{ $t("app.email") }}</label>
                <InputText
                  id="email"
                  v-model="email"
                  type="email"
                  required
                  :disabled="loading"
                  class="w-full"
                  :invalid="formErrors.fieldInvalid('email')"
                />
                <FormError :errors="formErrors.fieldError('email')" />
              </div>

              <Button
                class="mt-6"
                type="submit"
                :loading="loading"
                :label="$t('auth.send_password_reset_link')"
                data-test="send-reset-link-button"
              />
            </Form>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFormErrors } from "../composables/useFormErrors.js";
import { useApi } from "../composables/useApi.js";
import { useRouter } from "vue-router";
import { ref } from "vue";
import { useToast } from "../composables/useToast.js";
import { HTTP_STATUS_UNPROCESSABLE_ENTITY } from "../constants/httpStatusCodes.js";

const email = ref(null);
const loading = ref(false);

const formErrors = useFormErrors();
const api = useApi();
const toast = useToast();
const router = useRouter();

/**
 * Sends a password reset request to the server for the given email.
 */
function submit() {
  loading.value = true;
  formErrors.clear();

  const config = {
    method: "post",
    data: {
      email: email.value,
    },
  };

  api
    .call("password/email", config, true)
    .then((response) => {
      toast.success(response.data.message);
      router.push({ name: "home" });
    })
    .catch((error) => {
      // failed due to form validation errors
      if (
        error.response &&
        error.response.status === HTTP_STATUS_UNPROCESSABLE_ENTITY
      ) {
        formErrors.set(error.response.data.errors);
        api.validationError(error);
        return;
      }
      api.error(error);
    })
    .finally(() => {
      loading.value = false;
    });
}
</script>
