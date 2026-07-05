<!--
SPDX-FileCopyrightText: 2025 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup>
import { useDark } from "@vueuse/core";
const isDark = useDark();
</script>
<template>
  <div class="flex items-center">
    <div class="relative h-[1.5em] w-[1.5em]">
      <Transition name="dark">
        <svg
          v-if="isDark"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="absolute"
          aria-hidden="true"
          data-test="navbar-dark-mode-enabled-icon"
        >
          <path
            fill-rule="evenodd"
            d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z"
            clip-rule="evenodd"
          />
        </svg>
      </Transition>
      <Transition name="light">
        <svg
          v-if="!isDark"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          class="absolute"
          aria-hidden="true"
          data-test="navbar-dark-mode-disabled-icon"
        >
          <path
            d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z"
          />
        </svg>
      </Transition>
    </div>
  </div>
  <div
    v-if="isDark"
    v-tooltip.bottom="$t('app.dark_mode_disable')"
    class="absolute inset-0 h-full w-full"
  />
  <div
    v-else
    v-tooltip.bottom="$t('app.dark_mode_enable')"
    class="absolute inset-0 h-full w-full"
  />
</template>
<style scoped>
.light-enter-active,
.light-leave-active,
.dark-enter-active,
.dark-leave-active {
  --transition-base: 0.5s ease;
  transition:
    var(--transition-base) opacity,
    var(--transition-base) transform;
}

.light-enter-from,
.light-leave-to {
  opacity: 0;
  transform: rotate(-90deg) scale(0.5);
}

.dark-enter-from,
.dark-leave-to {
  opacity: 0;
  transform: rotate(180deg);
}
</style>
