<template>
  <div class="container pt-8 pb-8">
    <div class="row">
      <div class="col-md-12 col-sm-12 text-center">
        <img
          v-if="settingsStore.getSetting('logo')"
          class="logo"
          alt="Logo"
          :src="settingsStore.getSetting('logo')"
        >
        <h1 class="mb-6 text-color">
          {{ $t('home.title') }}
        </h1>
        <p class="text-color">
          {{ $t('home.subtitle') }}
        </p>
        <p class="text-color">
          {{ $t('home.description') }}
        </p>
        <p class="text-color">
          {{ $t('home.description_extended') }}
        </p>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useSettingsStore } from '../stores/settings';
const settingsStore = useSettingsStore();
</script>
<style scoped>
.logo {
  height: 80px;
  max-width: 100%;
  margin-bottom: 21px;
}
</style>
