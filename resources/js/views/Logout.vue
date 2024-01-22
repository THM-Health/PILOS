<template>
  <div class="container">
    <div class="grid mt-4 mb-5">
      <div class="col-12 md:col-8 lg:col-6 md:col-offset-2 lg:col-offset-3">
        <Card>
          <template #title> {{ $t('auth.logout') }} </template>
          <template #content>
            <Message v-if="props.message==null" severity="success" :closable="false" >{{ $t('auth.logout_success') }}</Message>
            <Message v-if="props.message === 'session_expired'" severity="warning" :closable="false">{{ $t('auth.session_expired') }}</Message>
          </template>
          <template #footer>
            <router-link
              :to="{ name: 'home'}"
              class="p-button"
            >
              {{ $t('app.home') }}
            </router-link>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  message: {
    type: String,
    default: null
  }
});
</script>
