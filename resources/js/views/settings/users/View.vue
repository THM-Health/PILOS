<template>
  <div>
    <h2>
      {{ viewOnly ? $t('settings.users.view', { firstname: firstname, lastname: lastname }) : $t('settings.users.edit', { firstname: firstname, lastname: lastname }) }}
    </h2>
    <div class="flex justify-content-between">
      <router-link
        class="p-button p-button-secondary"
        :to="{ name: 'settings.users' }"
      >
        <i class="fa-solid fa-arrow-left mr-2"/> {{$t('app.back')}}
      </router-link>
      <div v-if="user" class="flex gap-2">
        <router-link
          v-if="!viewOnly && userPermissions.can('view', user)"
          class="p-button p-button-secondary"
          :to="{ name: 'settings.users.view', params: { id: user.id }, query: { view: '1' } }"
        >
          <i class="fa-solid fa-times mr-2" /> {{$t('app.cancel_editing')}}
        </router-link>
        <router-link
          v-if="viewOnly && userPermissions.can('update', user)"
          class="p-button p-button-secondary"
          :to="{ name: 'settings.users.view', params: { id: user.id } }"
        >
          <i class="fa-solid fa-edit mr-2"/> {{$t('app.edit')}}
        </router-link>
        <SettingsUsersResetPasswordButton
          v-if="userPermissions.can('resetPassword', user) && settingsStore.getSetting('auth.local')"
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
          @deleted="$router.push({ name: 'settings.users' })"
        />
      </div>
    </div>
    <Divider/>

    <UserTabSection
      :id="id"
      :modal-static="false"
      :view-only="viewOnly"
      @update-user="updateUser"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useUserPermissions } from '@/composables/useUserPermission.js';
import { useSettingsStore } from '@/stores/settings';
import { useRouter } from 'vue-router';

const router = useRouter();
const userPermissions = useUserPermissions();
const settingsStore = useSettingsStore();

defineProps({
  id: {
    type: Number,
    required: true
  },
  viewOnly: {
    type: Boolean,
    required: true
  }
});

const user = ref(null);
const firstname = computed(() => {
  return user.value ? user.value.firstname : '';
});
const lastname = computed(() => {
  return user.value ? user.value.lastname : '';
});

function updateUser (newUser) {
  if (user.value) {
    router.push({ name: 'settings.users.view', params: { id: user.value.id }, query: { view: '1' } });
  }
  user.value = newUser;
}
</script>
