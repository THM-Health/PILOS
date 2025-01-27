<template>
  <div data-test="login-tab-ldap">
    <h1 class="p-card-title">{{ props.title }}</h1>
    <form @submit.prevent="submit">
      <div class="flex flex-col gap-2" data-test="username-field">
        <label :for="`${props.id}-username`">{{ props.usernameLabel }}</label>
        <InputText
          :id="`${props.id}-username`"
          v-model="username"
          :disabled="props.loading"
          type="text"
          autocomplete="username"
          :placeholder="props.usernameLabel"
          aria-describedby="username-help-block"
          :invalid="
            props.errors !== null &&
            props.errors.username &&
            props.errors.username.length > 0
          "
          required
        />
        <small id="username-help-block">{{
          $t("auth.ldap.username_help")
        }}</small>
        <FormError :errors="props.errors?.username" />
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
          :state="
            props.errors !== null &&
            props.errors.password &&
            props.errors.password.length > 0
              ? false
              : null
          "
        />
        <FormError :errors="props.errors?.password" />
      </div>
      <Button
        type="submit"
        data-test="login-button"
        class="mt-6"
        :disabled="props.loading"
        :loading="props.loading"
        icon="fa-solid fa-right-to-bracket"
        :label="props.submitLabel"
      />
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import FormError from "./FormError.vue";

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
  usernameLabel: {
    type: String,
    required: true,
  },
});

const username = ref("");
const password = ref("");

function submit() {
  emit("submit", {
    id: props.id,
    data: {
      username: username.value,
      password: password.value,
    },
  });
}
</script>
