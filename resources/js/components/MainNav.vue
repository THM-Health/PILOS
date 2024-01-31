<template>

  <div class="border-bottom-1 border-200 bg-white py-1 relative">
    <div class="container flex lg:flex-row flex-column justify-content-between">
      <div class="flex align-items-center justify-content-between">
        <RouterLink v-if="settingsStore.getSetting('logo')" :to="{ name: 'home' }" class="mr-6">
          <img
            style="height: 2rem;"
            :src="settingsStore.getSetting('logo')"
            alt="Logo"
          />
        </RouterLink>
        <a class="lg:hidden flex p-3 align-items-center text-600 hover:text-900 hover:surface-100 font-medium border-round cursor-pointer transition-colors transition-duration-150"
           v-styleclass="{ selector: '#mainNavDropdown', enterClass: 'hidden', leaveToClass: 'hidden', hideOnOutsideClick: true }">
          <i class="fa-solid fa-bars"></i>
        </a>
      </div>

      <div ref="mainNavDropdownRef" id="mainNavDropdown" class="align-items-center flex-grow-1 justify-content-between hidden lg:flex">
      <ul class="list-none p-0 m-0 flex lg:align-items-center select-none flex-column lg:flex-row gap-3">
        <NavbarButton @item-clicked="closeMainMenu" v-if="authStore.isAuthenticated" :to="{ name: 'rooms.index' }" :text="$t('app.rooms')" />
        <NavbarButton @item-clicked="closeMainMenu" v-if="userPermissions.can('viewAny','MeetingPolicy')" :to="{ name: 'meetings.index' }" :text="$t('meetings.currently_running')" />
        <NavbarButton @item-clicked="closeMainMenu" v-if="userPermissions.can('manage','SettingPolicy')" :to="{ name: 'settings' }" :text="$t('settings.title')" />
        <NavbarDropdownButton v-if="userPermissions.can('monitor','SystemPolicy')" :text="$t('system.monitor.title')">
          <template v-slot="slotProps">
            <NavbarDropdownItem
              @item-clicked="slotProps.closeCallback(); closeMainMenu()"
              href="/pulse"
              target="_blank"
              :text="$t('system.monitor.pulse')"
            />
            <NavbarDropdownItem
              @item-clicked="slotProps.closeCallback(); closeMainMenu()"
              href="/horizon"
              target="_blank"
              :text="$t('system.monitor.horizon')"
            />
            <NavbarDropdownItem
              @item-clicked="slotProps.closeCallback(); closeMainMenu()"
              v-if="settingsStore.getSetting('monitor.telescope')"
              href="/telescope"
              target="_blank"
              :text="$t('system.monitor.telescope')"
            />
          </template>
        </NavbarDropdownButton>
      </ul>
      <ul class="list-none p-0 m-0 flex lg:align-items-center select-none flex-column lg:flex-row border-top-1 mt-2 lg:mt-0 pt-2 lg:pt-0 surface-border lg:border-top-none gap-3">
        <NavbarUserDropdown @item-clicked="closeMainMenu" />
        <NavbarButton
          @item-clicked="closeMainMenu"
          target="_blank"
          :href="settingsStore.getSetting('help_url')"
          v-if="!!settingsStore.getSetting('help_url')"
        >
          <i class="fa-solid fa-circle-question text-xl hidden lg:block" v-tooltip="$t('app.help')"></i>
          <span class="block lg:hidden">{{ $t('app.help') }}</span>
        </NavbarButton>
        <NavbarLocaleDropdown @item-clicked="closeMainMenu" />
      </ul>
    </div>
    </div>
  </div>
</template>
<script setup>

import { useAuthStore } from '@/stores/auth.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useUserPermissions } from '@/composables/useUserPermission.js';
import { ref } from 'vue';
import NavbarLocaleDropdown from "./NavbarLocaleDropdown.vue";

const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const userPermissions = useUserPermissions();

const mainNavDropdownRef = ref();

function closeMainMenu () {
  console.log('closeMainMenu');
  mainNavDropdownRef.value.classList.add('hidden');
}

</script>
