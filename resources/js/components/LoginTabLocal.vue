<template>
  <div data-test="login-tab-local">
    <h1 class="p-card-title">{{ props.title }}</h1>
    <form @submit.prevent="submit">
      <div class="flex flex-col gap-2" data-test="email-field">
        <label :for="`${props.id}-email`">{{ props.emailLabel }}</label>
        <InputText
          :id="`${props.id}-email`"
          v-model="email"
          type="text"
          :disabled="props.loading"
          autocomplete="email"
          :placeholder="props.emailLabel"
          aria-describedby="email-help-block"
          :invalid="
            props.errors !== null &&
            props.errors.email &&
            props.errors.email.length > 0
          "
          required
        />
        <FormError :errors="props.errors?.email" />
      </div>

      <div class="mt-6 flex flex-col gap-2" data-test="password-field">
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
          :invalid="
            props.errors !== null &&
            props.errors.password &&
            props.errors.password.length > 0
          "
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
        <FormError :errors="props.errors?.password" />
      </div>
      <Button
        type="submit"
        data-test="login-button"
        class="mt-6"
        :disabled="props.loading"
        :loading="props.loading"
        :label="props.submitLabel"
        icon="fa-solid fa-right-to-bracket"
      />
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useSettingsStore } from "../stores/settings";
import FormError from "./FormError.vue";

const settingsStore = useSettingsStore();

const emit = defineEmits(["submit"]);
const props = defineProps({
  errors: {
    type: [Object, null],
    required: true,
    default: null,
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
