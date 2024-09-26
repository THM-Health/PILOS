<template>
  <div class="container pt-8 mb-8">
    <Card>
      <template #title><h1 class="text-3xl">{{ $t('app.profile') }}</h1></template>
      <template #content>
        <OverlayComponent :show="!authStore.currentUser">
          <UserTabSection
            v-if="authStore.currentUser"
            :id="authStore.currentUser.id"
          />
        </OverlayComponent>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
</script>
