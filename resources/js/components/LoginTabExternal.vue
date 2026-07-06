<!--
SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <div>
    <h1 class="p-card-title">{{ props.title }}</h1>
    <Button
      class="mt-4"
      data-test="login-button"
      as="a"
      :href="redirectUrl"
      icon="fa-solid fa-arrow-up-right-from-square"
      :label="redirectLabel"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  redirectLabel: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  redirectUrl: {
    type: String,
    required: true,
  },
});
</script>
