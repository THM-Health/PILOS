<template>
  <div data-test="login-tab-ldap">
    <p class="p-card-title">{{ props.title }}</p>
    <form @submit.prevent="submit">
      <div class="flex flex-column gap-2">
        <label :for="`${props.id}-username`">{{ props.usernameLabel }}</label>
        <InputText
          :id="`${props.id}-username`"
          type="text"
          v-model="username"
          autocomplete="username"
          :placeholder="props.usernameLabel"
          aria-describedby="username-help-block"
          :invalid="props.errors !== null && props.errors.username && props.errors.username.length > 0"
          required
        />
        <small id="username-help-block">{{ $t('auth.ldap.username_help') }}</small>
        <InlineMessage v-for="(error, index) in props.errors?.username" :key="index">
          {{ error }}
        </InlineMessage>
      </div>

      <div class="flex flex-column gap-2 mt-4">
        <label :for="`${props.id}-password`">{{ props.passwordLabel }}</label>
        <Password
          :id="`${props.id}-password`"
          v-model="password"
          autocomplete="current-password"
          :feedback="false"
          toggleMask
          required
          :placeholder="props.passwordLabel"
          :state="props.errors !== null && props.errors.password && props.errors.password.length > 0 ? false: null"
        />
        <InlineMessage v-for="(error, index) in props.errors?.password" :key="index">
          {{ error }}
        </InlineMessage>
      </div>
      <Button
        type="submit"
        class="mt-4"
        :disabled="props.loading"
        :loading="props.loading"
        icon="fa-solid fa-right-to-bracket"
        :label="props.submitLabel"
      />
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['submit']);
const props = defineProps({
  errors: {
    type: Object
  },
  id: {
    type: String,
    required: true
  },
  loading: {
    type: Boolean
  },
  passwordLabel: {
    type: String,
    required: true
  },
  submitLabel: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  usernameLabel: {
    type: String,
    required: true
  }
});

const username = ref('');
const password = ref('');

function submit () {
  emit('submit', {
    id: props.id,
    data: {
      username: username.value,
      password: password.value
    }
  });
}
</script>
