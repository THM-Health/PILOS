<!--
SPDX-FileCopyrightText: 2026 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<script setup>
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["submit"]);

function onSubmit() {
  if (props.disabled) return;
  emit("submit");
}
</script>

<template>
  <form novalidate class="form" @submit.prevent="onSubmit">
    <slot></slot>
  </form>
</template>

<style scoped></style>
