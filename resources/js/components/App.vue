<template>
  <Toast />
  <OverlayComponent
    :show="
      loadingStore.loadingCounter > 0 || loadingStore.overlayLoadingCounter > 0
    "
    fixed
    :z-index="10000"
  >
    <RouteAnnouncer />
    <div
      v-if="loadingStore.loadingCounter == 0"
      ref="app"
      tabindex="-1"
      class="app"
    >
      <SkipLinks />
      <div>
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
        <header>
          <MainNav @route-changed="onRouteChanged()" />
        </header>
      </div>
      <main id="main" tabindex="-1" :class="routeClass">
        <router-view />
      </main>
      <AppFooter />
    </div>
  </OverlayComponent>
</template>

<script setup>
import { useLoadingStore } from "../stores/loading";
import { useSettingsStore } from "../stores/settings";
import Toast from "primevue/toast";
import { useRoute } from "vue-router";
import { computed, nextTick, ref, watch } from "vue";

const loadingStore = useLoadingStore();
const settingsStore = useSettingsStore();

const route = useRoute();
const app = ref();

/**
 * Route-specific CSS class for each route/view
 */
const routeClass = computed(() => {
  return route.name
    ? `route-${route.name.toString().replace(/\./g, "-").toLowerCase()}`
    : "";
});

watch(
  () => route.path,
  () => {
    onRouteChanged();
  },
);

async function onRouteChanged() {
  await nextTick();
  app.value.focus();
}
</script>
