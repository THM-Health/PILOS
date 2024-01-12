<template>
  <BlockUI
    :blocked="blockUI"
    fullScreen
  >
  </BlockUI>
  <div v-if="blockUI" class="overlay-spinner">
      <ProgressSpinner
        class="w-4rem h-4rem"
        stroke-width="4px"
        :pt="{circle: { style: { stroke: '#FFF !important'} } }"
      />
  </div>

  <div v-if="loadingStore.loadingCounter == 0" class="app">
    <header>
      <banner
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

      <main-nav/>

    </header>
    <main>
      <router-view />
    </main>
    <footer-component />
  </div>
</template>

<script setup>
import Banner from '@/components/Banner.vue';
import MainNav from '@/components/MainNav.vue';
import {computed, onMounted} from 'vue';
import { useLoadingStore } from '@/stores/loading';
import { useSettingsStore } from '@/stores/settings';
import { useRouter } from 'vue-router';

const FooterComponent = Object.values(import.meta.glob(['../../custom/js/components/FooterComponent.vue', '@/components/FooterComponent.vue'], { eager: true }))[0].default;

const loadingStore = useLoadingStore();
const settingsStore = useSettingsStore();
const router = useRouter();

onMounted(() => {
  router.app = this;
});

const blockUI = computed(() => {
  return loadingStore.loadingCounter > 0 || loadingStore.overlayLoadingCounter > 0;
});

</script>
