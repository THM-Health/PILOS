<template>
  <div data-test="login-tab-local">
    <p class="p-card-title">{{ props.title }}</p>
    <form @submit.prevent="submit">
      <div class="flex flex-col gap-2">
        <label :for="`${props.id}-email`">{{ props.emailLabel }}</label>
        <InputText
          :id="`${props.id}-email`"
          type="text"
          v-model="email"
          autocomplete="email"
          :placeholder="props.emailLabel"
          aria-describedby="email-help-block"
          :invalid="props.errors !== null && props.errors.email && props.errors.email.length > 0"
          required
        />
        <Message severity="error" v-for="(error, index) in props.errors?.email" :key="index">
          {{ error }}
        </Message>
      </div>

      <div class="flex flex-col gap-2 mt-6">
        <label :for="`${props.id}-password`">{{ props.passwordLabel }}</label>
        <Password
          :id="`${props.id}-password`"
          v-model="password"
          autocomplete="current-password"
          :feedback="false"
          toggleMask
          required
          fluid
          :placeholder="props.passwordLabel"
          aria-describedby="password-help-block"
          :state="props.errors !== null && props.errors.password && props.errors.password.length > 0 ? false: null"
        />
        <router-link
          id="password-help-block"
          v-if="settingsStore.getSetting('users.password_change_allowed')"
          class="link-color link"
          to="/forgot_password"
        >
          {{ $t('auth.forgot_password') }}
        </router-link>
        <Message severity="error" v-for="(error, index) in props.errors?.password" :key="index">
          {{ error }}
        </Message>
      </div>
      <Button
        type="submit"
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
import { ref } from 'vue';
import { useSettingsStore } from '../stores/settings';

const settingsStore = useSettingsStore();

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
  emailLabel: {
    type: String,
    required: true
  }
});

const email = ref('');
const password = ref('');

function submit () {
  emit('submit', {
    id: props.id,
    data: {
      email: email.value,
      password: password.value
    }
  });
}
</script>
