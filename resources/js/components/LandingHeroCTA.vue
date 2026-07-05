<!--
SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <div class="mt-10 flex items-center gap-x-6">
    <Button
      size="large"
      as="router-link"
      :to="{ name: 'rooms.index' }"
      class="px-5 py-3 text-xl font-semibold"
    >
      {{ $t("home.title.get_started") }}
    </Button>
  </div>
</template>
