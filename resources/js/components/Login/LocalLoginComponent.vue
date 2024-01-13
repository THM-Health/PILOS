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
          :placeholder="props.emailLabel"
          aria-describedby="email-help-block"
          :class="{'p-invalid': props.errors !== null && props.errors.email && props.errors.email.length > 0}"
          required
        />
        <InlineMessage v-for="(error, index) in props.errors?.email" :key="index">
          {{ error }}
        </InlineMessage>
      </div>

      <div class="flex flex-column gap-2 mt-4">
        <label :for="`${props.id}-password`">{{ props.passwordLabel }}</label>
        <InputText
          :id="`${props.id}-password`"
          v-model="password"
          type="password"
          required
          :placeholder="props.passwordLabel"
          aria-describedby="password-help-block"
          :state="props.errors !== null && props.errors.password && props.errors.password.length > 0 ? false: null"
        />
        <small id="password-help-block">
          <router-link
            v-if="settingsStore.getSetting('password_change_allowed')"
            class="text-primary"
            to="/forgot_password"
          >
            {{ $t('auth.forgot_password') }}
          </router-link>
        </small>
        <InlineMessage v-for="(error, index) in props.errors?.password" :key="index">
          {{ error }}
        </InlineMessage>
      </div>
      <Button
        type="submit"
        class="w-full justify-content-center mt-4"
        :disabled="props.loading"
      >
        <ProgressSpinner
          v-if="props.loading"
          class="w-1rem h-1rem mr-2 ml-0 my-0"
          stroke-width="6px"
          :pt="{circle: { style: { stroke: '#FFF !important'} } }"
        />
        <span>
          {{ props.submitLabel }}
        </span>
      </Button>
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
