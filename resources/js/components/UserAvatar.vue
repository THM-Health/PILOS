<!--
SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <Avatar v-if="props.image" :image="props.image" :size="size" :shape="shape" />
  <Avatar
    v-else
    :label="avatarLabel"
    class="select-none"
    :size="size"
    :shape="shape"
  />
</template>

<script setup>
import { computed } from "vue";
import * as _ from "lodash-es";

const props = defineProps({
  firstname: {
    type: String,
    default: "",
  },
  lastname: {
    type: String,
    default: "",
  },
  image: {
    type: [String, null],
    default: null,
  },
  size: {
    type: [String, null],
    default: null,
  },
  shape: {
    type: String,
    default: "circle",
  },
});

const avatarLabel = computed(() => {
  // Imported users only have a firstname
  if (props.firstname && !props.lastname) {
    return _.split(props.firstname?.toUpperCase(), "", 2).join("");
  }

  // If there is no firstname or lastname, return an empty string to avoid errors
  if (!props.firstname || !props.lastname) {
    return "";
  }

  // Avatar label consists of the first letter of the firstname and the first letter of the lastname, both in uppercase
  return (
    _.split(props.firstname?.toUpperCase(), "", 1)[0] +
    _.split(props.lastname?.toUpperCase(), "", 1)[0]
  );
});
</script>

<style scoped></style>
