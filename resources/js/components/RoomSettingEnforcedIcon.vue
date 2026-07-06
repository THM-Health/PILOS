<!--
SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <span
    v-tooltip="$t('rooms.settings.general.enforced_setting')"
    data-test="room-setting-enforced-icon"
    class="fa-solid fa-lock"
    :aria-label="$t('rooms.settings.general.enforced_setting')"
  />
</template>
