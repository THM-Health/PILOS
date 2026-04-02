<script setup>
import { isMobile } from "../composables/useMenu.js";
</script>

<template>
  <ul
    class="border-rounded absolute top-0 left-[50%] z-50 flex translate-x-[-50%] -translate-y-full transform flex-col gap-2 border bg-surface-0 p-4 px-4 py-2 transition focus-within:translate-y-0 dark:bg-surface-950"
  >
    <li>
      <a href="#main">{{ $t("app.aria.main") }}</a>
    </li>
    <li>
      <a href="#mainmenu">{{ $t("app.aria.main_menu") }}</a>
    </li>
    <li v-if="!isMobile">
      <a href="#usermenu">{{ $t("app.aria.user_menu") }}</a>
    </li>
    <li>
      <a href="#footer">{{ $t("app.aria.footer") }}</a>
    </li>
  </ul>
</template>
