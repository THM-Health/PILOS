<template>
  <div class="container pt-5 pb-5">
    <div class="row">
      <div class="col-md-12 col-sm-12 text-center">
        <img
          v-if="settingsStore.getSetting('logo')"
          class="logo"
          :src="settingsStore.getSetting('logo')"
        >
        <h1
          id="main-text"
          class="mb-4"
        >
          {{ $t('home.title') }}
        </h1>
        <p class="lead col-sm-12">
          {{ $t('home.subtitle') }}
        </p>
        <p class="lead col-sm-12">
          {{ $t('home.description') }}
        </p>
        <p class="lead col-sm-12">
          {{ $t('home.description_extended') }}
        </p>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useSettingsStore } from '@/stores/settings';
const settingsStore = useSettingsStore();
</script>
<style scoped>
.logo {
  height: 80px;
  max-width: 100%;
  margin-bottom: 21px;
}
</style>
