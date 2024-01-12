<template>
  <div>
    <h3>{{ props.title }}</h3>
    <form @submit.prevent="submit">
      <div class="flex flex-column gap-2">
        <label :for="`${props.id}-username`">{{ props.usernameLabel }}</label>
        <InputText
          :id="`${props.id}-username`"
          type="text"
          v-model="username"
          :placeholder="props.usernameLabel"
          aria-describedby="username-help-block"
          :class="{'p-invalid': props.errors !== null && props.errors.username && props.errors.username.length > 0}"
          required
        />
        <small id="username-help-block">{{ $t('auth.ldap.username_help') }}</small>
        <small v-if="props.errors !== null && props.errors.username.length > 0" class="text-red-500">
          <template v-for="error in props.errors.username">
            {{ error }}
          </template>
        </small>
      </div>

      <div class="flex flex-column gap-2 mt-4">
        <label :for="`${props.id}-password`">{{ props.passwordLabel }}</label>
        <InputText
          :id="`${props.id}-password`"
          v-model="password"
          type="password"
          required
          :placeholder="props.passwordLabel"
          :state="props.errors !== null && props.errors.password && props.errors.password.length > 0 ? false: null"
        />
        <small v-if="props.errors !== null && props.errors.password && props.errors.password.length > 0" class="text-red-500">
          <template v-for="error in props.errors.password">
            {{ error }}
          </template>
        </small>
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

const emit = defineEmits(['submit']);
const props = defineProps([
  'errors',
  'id',
  'loading',
  'passwordLabel',
  'submitLabel',
  'title',
  'usernameLabel'
]);

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
