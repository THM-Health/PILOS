<template>

  <div class="border-bottom-1 border-200 bg-white py-3 relative">
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

      <div id="mainNavDropdown" class="align-items-center flex-grow-1 justify-content-between hidden lg:flex">
      <ul class="list-none p-0 m-0 flex lg:align-items-center select-none flex-column lg:flex-row">
        <NavbarButton v-if="authStore.isAuthenticated" :to="{ name: 'rooms.index' }" :text="$t('app.rooms')" />
        <NavbarButton v-if="userPermissions.can('viewAny','MeetingPolicy')" :to="{ name: 'meetings.index' }" :text="$t('meetings.currently_running')" />
        <NavbarButton v-if="userPermissions.can('manage','SettingPolicy')" :to="{ name: 'settings' }" :text="$t('settings.title')" />
        <NavbarDropdownButton v-if="userPermissions.can('monitor','SystemPolicy')" :text="$t('system.monitor.title')">
            <NavbarDropdownItem
              href="/pulse"
              target="_blank"
              :text="$t('system.monitor.pulse')"
            />
            <NavbarDropdownItem
              href="/horizon"
              target="_blank"
              :text="$t('system.monitor.horizon')"
            />
            <NavbarDropdownItem
              v-if="settingsStore.getSetting('monitor.telescope')"
              href="/telescope"
              target="_blank"
              :text="$t('system.monitor.telescope')"
            />
          </NavbarDropdownButton>
      </ul>
      <ul class="list-none p-0 m-0 flex lg:align-items-center select-none flex-column lg:flex-row border-top-1 mt-2 lg:mt-0 pt-2 lg:pt-0 surface-border lg:border-top-none">
        <NavbarUserDropdown />
        <NavbarButton
          target="_blank"
          :href="settingsStore.getSetting('help_url')"
          v-if="!!settingsStore.getSetting('help_url')"
        >
          <i class="fa-solid fa-circle-question text-xl hidden lg:block" v-tooltip="$t('app.help')"></i>
          <span class="block lg:hidden">{{ $t('app.help') }}</span>
        </NavbarButton>

        <LocaleSelector />
      </ul>
    </div>
    </div>
  </div>
</template>
<script setup>

import { useAuthStore } from '@/stores/auth.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useUserPermissions } from '@/composables/useUserPermission.js';

const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const userPermissions = useUserPermissions();

</script>
