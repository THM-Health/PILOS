<template>

  <div class="border-bottom-1 border-200 bg-white">
    <Menubar
      :model="menuItems"
      :pt="{ root: { class: 'container border-none' } }"
      breakpoint="1200px"
    >
      <template #start  >
        <router-link :to="{ name: 'home' }" class="mr-5">
          <img
            v-if="settingsStore.getSetting('logo')"
            style="height: 2rem;"
            :src="settingsStore.getSetting('logo')"
            alt="Logo"
          />
        </router-link>
      </template>

      <template #item="{ item, props, hasSubmenu }">
        <router-link v-if="item.route" :to="item.route" v-bind="props.action">
         <span>{{ item.label }}</span>
        </router-link>
        <a v-else :href="item.url" :target="item.target" v-bind="props.action">
          <span>{{ item.label }}</span>
          <span v-if="hasSubmenu" class="fa-solid fa-caret-down ml-2" />
        </a>
      </template>

      <template #end>
        <div class="flex align-items-center gap-2">
          <user-menu />

          <a
            target="_blank"
            :href="settingsStore.getSetting('help_url')"
            class="p-button p-button-icon-only p-button-rounded p-button-text"
            v-if="!!settingsStore.getSetting('help_url')"
            v-b-tooltip.hover
            :title="$t('app.help')"
          >
            <i class="fa-solid fa-circle-question text-xl"></i>
          </a>

          <locale-selector />

        </div>
      </template>
    </Menubar>
  </div>
</template>
<script setup>

import { useRoute } from 'vue-router';
import { computed, ref } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { useSettingsStore } from '@/stores/settings.js';
import PermissionService from '@/services/PermissionService';
import LocaleSelector from './LocaleSelector.vue';
import UserMenu from './UserMenu.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const userMenu = ref();

const authStore = useAuthStore();
const settingsStore = useSettingsStore();

const menuItems = computed(() => {
  if (!authStore.isAuthenticated) { return []; }

  const items = [
    {
      label: t('app.rooms'),
      route: { name: 'rooms.index' }
    }
  ];

  if (PermissionService.can('viewAny', 'MeetingPolicy')) {
    items.push({
      label: t('meetings.currently_running'),
      route: { name: 'meetings.index' }
    });
  }

  if (PermissionService.can('manage', 'SettingPolicy')) {
    items.push({
      label: t('settings.title'),
      route: { name: 'settings' }
    });
  }

  if (PermissionService.can('monitor', 'SystemPolicy')) {
    items.push({
      label: t('system.monitor.title'),
      items: [
        {
          label: t('system.monitor.pulse'),
          url: '/pulse',
          target: '_blank'
        },
        {
          label: t('system.monitor.horizon'),
          url: '/horizon',
          target: '_blank'
        },
        {
          label: t('system.monitor.telescope'),
          url: '/telescope',
          target: '_blank'
        }
      ]
    });
  }

  return items;
});

</script>
