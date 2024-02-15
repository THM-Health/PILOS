<template>
  <div class="container pt-4 mb-5">
    <Card>
      <template #title> {{ $t('app.profile') }} </template>
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
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
</script>
