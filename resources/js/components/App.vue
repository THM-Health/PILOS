<template>
  <Toast />
  <OverlayComponent :show="loadingStore.loadingCounter > 0 || loadingStore.overlayLoadingCounter > 0" z-index="10000">
    <div v-if="loadingStore.loadingCounter == 0" class="app">
      <header>
        <AppBanner
          v-if="settingsStore.getSetting('banner.enabled')"
          :background="settingsStore.getSetting('banner.background')"
          :color="settingsStore.getSetting('banner.color')"
          :icon="settingsStore.getSetting('banner.icon')"
          :link="settingsStore.getSetting('banner.link')"
          :message="settingsStore.getSetting('banner.message')"
          :title="settingsStore.getSetting('banner.title')"
          :link-style="settingsStore.getSetting('banner.link_style')"
          :link-text="settingsStore.getSetting('banner.link_text')"
          :link-target="settingsStore.getSetting('banner.link_target')"
        />

        <MainNav />

      </header>
      <main>
        <router-view />
      </main>
      <AppFooter />
    </div>
  </OverlayComponent>

</template>

<script setup>
import { useLoadingStore } from '../stores/loading';
import { useSettingsStore } from '../stores/settings';
import Toast from 'primevue/toast';

const loadingStore = useLoadingStore();
const settingsStore = useSettingsStore();
</script>
