<template>
  <div>
    <div class="flex justify-end">
      <div v-if="user" class="flex gap-2">
        <Button
          v-if="!viewOnly && userPermissions.can('view', user)"
          as="router-link"
          :to="{ name: 'admin.users.view', params: { id: user.id } }"
          :label="$t('app.cancel_editing')"
          icon="fa-solid fa-times"
          severity="secondary"
          data-test="users-cancel-edit-button"
        />
        <Button
          v-if="viewOnly && userPermissions.can('update', user)"
          as="router-link"
          class="p-button p-button-secondary"
          :to="{ name: 'admin.users.edit', params: { id: user.id } }"
          :label="$t('app.edit')"
          icon="fa-solid fa-edit"
          severity="info"
          data-test="users-edit-button"
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
        />
        <SettingsUsersDeleteButton
          v-if="userPermissions.can('delete', user)"
          :id="user.id"
          :firstname="user.firstname"
          :lastname="user.lastname"
          @deleted="$router.push({ name: 'admin.users' })"
        />
      </div>
    </div>

    <UserTabSection :id="id" :view-only="viewOnly" @update-user="updateUser" />
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
const breakcrumbLabelData = inject("breakcrumbLabelData");

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

watch(
  () => firstname.value + " " + lastname.value,
  () => {
    breakcrumbLabelData.value = {
      firstname: firstname.value,
      lastname: lastname.value,
    };
  },
);

function updateUser(newUser) {
  if (user.value) {
    router.push({ name: "admin.users.view", params: { id: newUser.id } });
  }
  user.value = newUser;
}
</script>
