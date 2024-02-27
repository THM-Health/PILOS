<template>
  <div>
    <p class="p-card-title">{{ props.title }}</p>
    <form @submit.prevent="submit">
      <div class="flex flex-column gap-2">
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
        <InlineMessage v-for="(error, index) in props.errors?.email" :key="index">
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
          aria-describedby="password-help-block"
          :state="props.errors !== null && props.errors.password && props.errors.password.length > 0 ? false: null"
        />
        <router-link
          id="password-help-block"
          v-if="settingsStore.getSetting('password_change_allowed')"
          class="link-color link"
          to="/forgot_password"
        >
          {{ $t('auth.forgot_password') }}
        </router-link>
        <InlineMessage v-for="(error, index) in props.errors?.password" :key="index">
          {{ error }}
        </InlineMessage>
      </div>
      <Button
        type="submit"
        class="mt-4"
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
import { useSettingsStore } from '@/stores/settings';

const settingsStore = useSettingsStore();

const emit = defineEmits(['submit']);
const props = defineProps([
  'errors',
  'id',
  'loading',
  'passwordLabel',
  'submitLabel',
  'title',
  'emailLabel'
]);

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
