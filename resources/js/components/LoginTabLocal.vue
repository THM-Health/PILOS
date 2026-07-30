<template>
  <div>
    <h1 class="p-card-title">{{ props.title }}</h1>
    <Form :disabled="props.loading" @submit="submit">
      <div class="field flex flex-col gap-2" data-test="email-field">
        <label :for="`${props.id}-email`">{{ props.emailLabel }}</label>
        <InputText
          :id="`${props.id}-email`"
          v-model="email"
          type="text"
          :disabled="props.loading"
          autocomplete="email"
          :placeholder="props.emailLabel"
          aria-describedby="email-help-block"
          :invalid="formErrors.fieldInvalid('email')"
          required
        />
        <FormError :errors="formErrors.fieldError('email')" />
      </div>

      <div class="field mt-6 flex flex-col gap-2" data-test="password-field">
        <label :for="`${props.id}-password`">{{ props.passwordLabel }}</label>
        <Password
          v-model="password"
          :input-id="`${props.id}-password`"
          autocomplete="current-password"
          :feedback="false"
          toggle-mask
          required
          fluid
          :disabled="props.loading"
          :placeholder="props.passwordLabel"
          aria-describedby="password-help-block"
          :invalid="formErrors.fieldInvalid('password')"
        />
        <Button
          v-if="settingsStore.getSetting('user.password_change_allowed')"
          id="password-help-block"
          as="router-link"
          link
          class="self-start p-0"
          to="/forgot_password"
          data-test="forgot-password-button"
        >
          {{ $t("auth.forgot_password") }}
        </Button>
        <FormError :errors="formErrors.fieldError('password')" />
      </div>
      <Button
        type="submit"
        data-test="login-button"
        class="mt-6"
        :loading="props.loading"
        :label="props.submitLabel"
        icon="fa-solid fa-right-to-bracket"
      />
    </Form>
  </div>
</template>

<script setup>
import { ref, toRaw, watch } from "vue";
import { useSettingsStore } from "../stores/settings";
import FormError from "./FormError.vue";
import { useFormErrors } from "../composables/useFormErrors.js";

const settingsStore = useSettingsStore();
const formErrors = useFormErrors();

const emit = defineEmits(["submit"]);
const props = defineProps({
  errors: {
    type: [Object, null],
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
  loading: {
    type: Boolean,
  },
  passwordLabel: {
    type: String,
    required: true,
  },
  submitLabel: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  emailLabel: {
    type: String,
    required: true,
  },
});

const email = ref("");
const password = ref("");

watch(
  () => props.errors,
  (newErrors) => {
    formErrors.set(toRaw(newErrors));
  },
  { deep: true, immediate: true },
);

function submit() {
  emit("submit", {
    id: props.id,
    data: {
      email: email.value,
      password: password.value,
    },
  });
}
</script>
