<!--
SPDX-FileCopyrightText: 2026 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <h1 id="page-title" tabindex="-1" class="w-auto text-3xl font-medium">
    {{ title }}
  </h1>
</template>
