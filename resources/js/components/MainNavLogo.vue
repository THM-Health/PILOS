<!--
SPDX-FileCopyrightText: 2026 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup>
import { useSettingsStore } from "../stores/settings.js";
import { useDark } from "@vueuse/core";

const settingsStore = useSettingsStore();
const isDark = useDark();
</script>

<template>
  <RouterLink
    v-if="settingsStore.getSetting('theme.logo')"
    :to="{ name: 'home' }"
    class="mr-12"
    data-test="navbar-home"
    :aria-label="$t('app.home')"
  >
    <img
      style="height: 2rem"
      aria-hidden="true"
      :src="
        isDark
          ? settingsStore.getSetting('theme.logo_dark')
          : settingsStore.getSetting('theme.logo')
      "
      alt="Logo"
    />
  </RouterLink>
</template>

<style scoped></style>
