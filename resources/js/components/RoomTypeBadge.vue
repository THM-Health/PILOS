<!--
SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <Tag
    class="text-break room-type-badge shrink"
    style="word-break: normal; overflow-wrap: anywhere"
    :pt="{
      root: { style: { background: roomType.color } },
    }"
    data-test="room-type-badge"
  >
    <span class="sr-only"
      >{{ $t("rooms.index.room_component.room_type") }}<raw-text>:</raw-text>
    </span>
    <span>{{ roomType.name }}</span>
  </Tag>
</template>

<script setup>
import RawText from "./RawText.vue";

defineProps({
  roomType: {
    type: Object,
    required: true,
  },
});
</script>
