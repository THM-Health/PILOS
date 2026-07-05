<!--
SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <Message
    data-test="app-banner"
    :style="{
      'border-color': background,
      'background-color': background,
      color: color,
    }"
    class="m-0 rounded-none py-4"
    :closable="false"
    :pt="{
      icon: {
        class: 'hidden',
      },
      wrapper: {
        class: 'p-4 container',
      },
    }"
    :unstyled="true"
  >
    <template #messageicon> </template>

    <div class="container flex flex-col gap-2">
      <p v-if="title" class="m-0 text-lg font-bold" data-test="banner-title">
        <i v-if="icon" :class="`${icon}`" data-test="banner-icon" />
        {{ title }}
      </p>
      <p class="m-0 whitespace-pre-wrap" data-test="banner-message">
        {{ message }}
      </p>
      <div>
        <Button
          v-if="link"
          as="a"
          data-test="banner-link-button"
          :href="link"
          :target="`_${linkTarget}`"
          :link="linkStyle === 'link'"
          :style="buttonStyle"
          :class="buttonClass"
          :severity="linkStyle"
          :label="linkText ? linkText : link"
        />
      </div>
    </div>
  </Message>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  background: {
    type: String,
    default: null,
  },

  color: {
    type: String,
    default: null,
  },

  icon: {
    type: String,
    default: null,
  },

  link: {
    type: String,
    default: null,
  },

  linkStyle: {
    type: String,
    default: "primary",
  },

  linkTarget: {
    type: String,
    default: "_self",
  },

  linkText: {
    type: String,
    default: null,
  },

  message: {
    type: String,
    default: null,
  },

  title: {
    type: String,
    default: null,
  },
});

const buttonClass = computed(() => {
  return props.linkStyle === "link" ? "p-0 underline" : "";
});

const buttonStyle = computed(() => {
  return props.linkStyle === "link" ? { color: props.color } : {};
});
</script>
<style scoped>
.banner-message {
  white-space: pre-wrap;
}
</style>
