<template>
  <div class="container">
    <div class="grid grid-cols-12 gap-4 mt-6 mb-8">
      <div class="col-span-12 md:col-span-8 lg:col-span-6 md:col-start-3 lg:col-start-4">
        <Card v-if="error">
          <template #title> {{ $t('auth.error.login_failed') }} </template>
          <template #content>
            <Message v-if="props.error === 'invalid_configuration'" severity="error" :closable="false" >{{ $t('auth.error.invalid_configuration') }}</Message>
            <Message v-if="props.error === 'invalid_state'" severity="error" :closable="false" >{{ $t('auth.error.invalid_state') }}</Message>
            <Message v-if="props.error === 'network_issue'" severity="error" :closable="false" >{{ $t('auth.error.network_issue') }}</Message>
            <Message v-if="props.error === 'missing_attributes'" severity="error" :closable="false" >{{ $t('auth.error.missing_attributes') }}</Message>
            <Message v-if="props.error === 'shibboleth_session_duplicate_exception'" severity="error" :closable="false">{{ $t('auth.error.shibboleth_session_duplicate_exception') }}</Message>
          </template>
          <template #footer>
            <Button
              as="router-link"
              :to="{ name: 'home'}"
              :label="$t('app.home')"
            />
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>

import { onMounted } from 'vue';
import { useToast } from '../composables/useToast.js';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  error: {
    type: String,
    default: null
  }
});

const toast = useToast();
const { t } = useI18n();
const router = useRouter();
const route = useRoute();

onMounted(() => {
  // Successfully login via external provider
  if (!props.error) {
    // show toast message
    toast.success(t('auth.flash.login'));
    // check if user should be redirected back after login,
    // otherwise redirect to own rooms (dashboard)
    if (route.query.redirect !== undefined) {
      router.push(route.query.redirect);
    } else {
      router.push({ name: 'rooms.index' });
    }
  }
});
</script>
