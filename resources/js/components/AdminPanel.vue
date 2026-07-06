<!--
SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors

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
  <Panel
    :header="$props.title"
    :pt="{
      title: {
        class: 'text-xl font-medium',
      },
      content: {
        class: 'flex flex-col gap-4',
      },
    }"
  >
    <slot></slot>
  </Panel>
</template>

<style scoped></style>
