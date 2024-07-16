<template>
  <div class="flex flex-col gap-4">
    <AdminPanel :title="$t('admin.users.roles_and_permissions')">
      <UserTabSecurityRolesAndPermissionsSection
        :user="user"
        :view-only="viewOnly"
        @update-user="updateUser"
        @stale-error="handleStaleError"
        @not-found-error="handleNotFoundError"
      />
    </AdminPanel>

    <AdminPanel :title="$t('auth.change_password')"  v-if="!viewOnly && user.authenticator === 'local' && canChangePassword">
      <UserTabSecurityPasswordSection
        :user="user"
        @update-user="updateUser"
        @not-found-error="handleNotFoundError"
      />
    </AdminPanel>

    <AdminPanel :title="$t('auth.sessions.active')" v-if="isOwnUser">
      <UserTabSecuritySessionsSection />
    </AdminPanel>
  </div>
</template>

<script setup>
import { useSettingsStore } from '../stores/settings';
import { useAuthStore } from '../stores/auth';
import { computed } from 'vue';

const props = defineProps({
  user: {
    type: Object,
    required: true
  },
  viewOnly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['staleError', 'updateUser', 'notFoundError']);

const authStore = useAuthStore();
const settingsStore = useSettingsStore();

const isOwnUser = computed(() => {
  return authStore.currentUser?.id === props.user.id;
});

const canChangePassword = computed(() => {
  return !isOwnUser.value || settingsStore.getSetting('user.password_change_allowed');
});

function handleStaleError (error) {
  emit('staleError', error);
}

function updateUser (user) {
  emit('updateUser', user);
}

function handleNotFoundError (error) {
  emit('notFoundError', error);
}
</script>
