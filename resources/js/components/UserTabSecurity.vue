<!--
SPDX-FileCopyrightText: 2024 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <div class="flex flex-col gap-4">
    <AdminPanel :title="$t('admin.users.roles_and_permissions')">
      <UserTabSecurityRolesAndPermissionsSection
        :user="user"
        :view-only="viewOnly"
        :disabled="isBusy"
        @update-user="updateUser"
        @stale-error="handleStaleError"
        @not-found-error="handleNotFoundError"
        @busy="(state) => (isBusy = state)"
      />
    </AdminPanel>

    <AdminPanel
      v-if="!viewOnly && user.authenticator === 'local' && canChangePassword"
      :title="$t('auth.change_password')"
    >
      <UserTabSecurityPasswordSection
        :user="user"
        :disabled="isBusy"
        @update-user="updateUser"
        @not-found-error="handleNotFoundError"
        @busy="(state) => (isBusy = state)"
      />
    </AdminPanel>

    <AdminPanel v-if="isOwnUser" :title="$t('auth.sessions.active')">
      <UserTabSecuritySessionsSection
        :disabled="isBusy"
        @busy="(state) => (isBusy = state)"
      />
    </AdminPanel>
  </div>
</template>

<script setup>
import { useSettingsStore } from "../stores/settings";
import { useAuthStore } from "../stores/auth";
import { computed, ref, watch } from "vue";

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  viewOnly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["staleError", "updateUser", "notFoundError", "busy"]);

const authStore = useAuthStore();
const settingsStore = useSettingsStore();

const isBusy = ref(false);

const isOwnUser = computed(() => {
  return authStore.currentUser?.id === props.user.id;
});

const canChangePassword = computed(() => {
  return (
    !isOwnUser.value || settingsStore.getSetting("user.password_change_allowed")
  );
});

watch(isBusy, () => {
  emit("busy", isBusy.value);
});

function handleStaleError(error) {
  emit("staleError", error);
}

function updateUser(user) {
  emit("updateUser", user);
}

function handleNotFoundError(error) {
  emit("notFoundError", error);
}
</script>
