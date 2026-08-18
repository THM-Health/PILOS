<script setup>
import { useRouteStore } from "../stores/route.js";
import { ref, watch } from "vue";

const routeStore = useRouteStore();

const title = ref(null);
const initialLoad = ref(null);

watch(
  () => routeStore.pageTitle,
  function (newPageTitle) {
    initialLoad.value = initialLoad.value === null;
    title.value = newPageTitle;
  },
);
</script>

<template>
  <div aria-live="polite" aria-atomic="true" class="sr-only">
    <span v-if="title && initialLoad === false">{{
      $t("app.aria.navigated_to_page", { page: title })
    }}</span>
  </div>
</template>

<style scoped></style>
