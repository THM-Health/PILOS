<!--
SPDX-FileCopyrightText: 2020 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <div class="mt-20 flex justify-center">
    <!-- Show 404 message -->
    <Card
      style="width: 500px; max-width: 90vw"
      :pt="{ header: { class: 'flex justify-center' } }"
    >
      <template #header>
        <Badge
          severity="danger"
          class="-mt-8 flex !h-16 !w-16 items-center justify-center rounded-full"
        >
          <i class="fa-solid fa-unlink text-2xl text-white"></i>
        </Badge>
      </template>
      <template #content>
        <PageTitle :title="$t('app.error')" class="mb-4 text-center" />
        <p class="text-center text-lg">{{ $t("app.not_found") }}</p>
      </template>
    </Card>
  </div>
</template>
<script setup lang="ts"></script>
