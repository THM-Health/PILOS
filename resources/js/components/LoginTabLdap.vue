<template>
  <div>
    <h1 class="p-card-title">{{ props.title }}</h1>
    <Form :disabled="props.loading" @submit="submit">
      <div class="field flex flex-col gap-2" data-test="username-field">
        <label :for="`${props.id}-username`">{{ props.usernameLabel }}</label>
        <InputText
          :id="`${props.id}-username`"
          v-model="username"
          :disabled="props.loading"
          type="text"
          autocomplete="username"
          :placeholder="props.usernameLabel"
          aria-describedby="username-help-block"
          :invalid="formErrors.fieldInvalid('username')"
          required
        />
        <small id="username-help-block">{{
          $t("auth.ldap.username_help")
        }}</small>
        <FormError :errors="formErrors.fieldError('username')" />
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
          :invalid="formErrors.fieldInvalid('password')"
        />
        <FormError :errors="formErrors.fieldError('password')" />
      </div>
      <Button
        type="submit"
        data-test="login-button"
        class="mt-6"
        :loading="props.loading"
        icon="fa-solid fa-right-to-bracket"
        :label="props.submitLabel"
      />
    </Form>
  </div>
</template>

<script setup>
import { ref, toRaw, watch } from "vue";
import FormError from "./FormError.vue";
import { useFormErrors } from "../composables/useFormErrors.js";

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
  usernameLabel: {
    type: String,
    required: true,
  },
});

const username = ref("");
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
      username: username.value,
      password: password.value,
    },
  });
}
</script>
