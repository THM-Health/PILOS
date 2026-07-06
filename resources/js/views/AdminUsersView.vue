<!--
SPDX-FileCopyrightText: 2020 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <div>
    <div class="flex justify-end">
      <div v-if="user" class="flex gap-2">
        <Button
          v-if="!viewOnly && userPermissions.can('view', user)"
          :as="isBusy || isLoadingAction ? 'button' : 'router-link'"
          :to="{
            name: 'admin.users.view',
            params: { id: user.id },
            hash: tabHash,
          }"
          :label="$t('app.cancel_editing')"
          icon="fa-solid fa-times"
          severity="secondary"
          data-test="users-cancel-edit-button"
          :disabled="isBusy || isLoadingAction"
        />
        <Button
          v-if="viewOnly && userPermissions.can('update', user)"
          :as="isBusy || isLoadingAction ? 'button' : 'router-link'"
          class="p-button p-button-secondary"
          :to="{
            name: 'admin.users.edit',
            params: { id: user.id },
            hash: tabHash,
          }"
          :label="$t('app.edit')"
          icon="fa-solid fa-edit"
          severity="info"
          data-test="users-edit-button"
          :disabled="isBusy || isLoadingAction"
        />
        <SettingsUsersResetPasswordButton
          v-if="
            userPermissions.can('resetPassword', user) &&
            settingsStore.getSetting('auth.local')
          "
          :id="user.id"
          :firstname="user.firstname"
          :lastname="user.lastname"
          :email="user.email"
          :disabled="isBusy || isLoadingAction"
          @not-found="$router.push({ name: 'admin.users' })"
        />
        <SettingsUsersDeleteButton
          v-if="userPermissions.can('delete', user)"
          :id="user.id"
          :firstname="user.firstname"
          :lastname="user.lastname"
          :disabled="isBusy || isLoadingAction"
          @deleted="$router.push({ name: 'admin.users' })"
          @not-found="$router.push({ name: 'admin.users' })"
        />
      </div>
    </div>

    <UserTabSection
      :id="id"
      :view-only="viewOnly"
      @update-user="updateUser"
      @busy="(state) => (isBusy = state)"
      @loading-action="(state) => (isLoadingAction = state)"
      @active-tab-changed="(tab) => (currentUserTab = tab)"
    />
  </div>
</template>

<script setup>
import { ref, computed, inject, watch } from "vue";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { useSettingsStore } from "../stores/settings";
import { useRouter } from "vue-router";

const router = useRouter();
const userPermissions = useUserPermissions();
const settingsStore = useSettingsStore();
const breadcrumbLabelData = inject("breadcrumbLabelData");
const isBusy = ref(false);
const isLoadingAction = ref(false);
const currentUserTab = ref("base");

defineProps({
  id: {
    type: Number,
    required: true,
  },
  viewOnly: {
    type: Boolean,
    required: true,
  },
});

const user = ref(null);
const firstname = computed(() => {
  return user.value ? user.value.firstname : "";
});
const lastname = computed(() => {
  return user.value ? user.value.lastname : "";
});

const tabHash = computed(() => {
  return "#tab=" + currentUserTab.value;
});

watch(
  () => firstname.value + " " + lastname.value,
  () => {
    breadcrumbLabelData.value = {
      firstname: firstname.value,
      lastname: lastname.value,
    };
  },
);

function updateUser(newUser) {
  if (user.value) {
    router.push({
      name: "admin.users.view",
      params: { id: newUser.id },
      hash: tabHash.value,
    });
  }
  user.value = newUser;
}
</script>
