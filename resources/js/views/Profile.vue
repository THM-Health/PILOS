<!--
SPDX-FileCopyrightText: 2023 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <div class="container mb-8 pt-8">
    <Card data-test="user-profile">
      <template #title><PageTitle :title="$t('app.profile')" /></template>
      <template #content>
        <OverlayComponent :show="!authStore.currentUser">
          <UserTabSection
            v-if="authStore.currentUser"
            :id="authStore.currentUser.id"
          />
        </OverlayComponent>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { useAuthStore } from "../stores/auth";

const authStore = useAuthStore();
</script>
