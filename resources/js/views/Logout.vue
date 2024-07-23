<template>
  <div class="container">
    <div class="grid grid-cols-12 gap-4 mt-6 mb-8">
      <div class="col-span-12 md:col-span-8 lg:col-span-6 md:col-start-3 lg:col-start-4">
        <Card>
          <template #title> {{ $t('auth.logout') }} </template>
          <template #content>
            <Message v-if="props.message==null" severity="success" :closable="false" >{{ $t('auth.logout_success') }}</Message>
            <Message v-if="props.message === 'session_expired'" severity="warning" :closable="false">{{ $t('auth.session_expired') }}</Message>
          </template>
          <template #footer>
            <Button
              class="mt-4"
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
const props = defineProps({
  message: {
    type: String,
    default: null
  }
});
</script>
