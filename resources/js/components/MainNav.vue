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
        <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
          <a v-ripple :href="href" v-bind="props.action" @click="navigate">
            <span>{{ item.label }}</span>
          </a>
        </router-link>
        <a v-else v-ripple :href="item.url" :target="item.target" v-bind="props.action">
          <span>{{ item.label }}</span>
          <span v-if="hasSubmenu" class="fa-solid fa-caret-down ml-2" />
        </a>
      </template>

      <template #end>
        <div class="flex align-items-center gap-2">
          <router-link v-if="!authStore.isAuthenticated"
                       :to="loginRoute" class="p-button p-button-text p-button-plain no-underline"> {{ $t('auth.login') }}
          </router-link>

          <Button plain text  v-if="authStore.isAuthenticated" type="button" @click="$refs.userMenu?.toggle" aria-haspopup="true" aria-controls="overlay_menu">
            {{ authStore.currentUser.firstname }} {{ authStore.currentUser.lastname }}
            <span class="fa-solid fa-caret-down ml-2" />
          </Button>
          <Menu v-if="authStore.isAuthenticated" ref="userMenu" :model="userMenuItems" :popup="true">
            <template #item="{ item, props }">
              <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
                <a v-ripple :href="href" v-bind="props.action" @click="navigate">
                  <span>{{ item.label }}</span>
                </a>
              </router-link>
              <a v-else-if="item.action" v-ripple @click="item.action" v-bind="props.action">
                <span>{{ item.label }}</span>
              </a>
              <a v-else v-ripple :href="item.url" :target="item.target" v-bind="props.action">
                <span>{{ item.label }}</span>
              </a>
            </template>
          </Menu>

          <a
            target="_blank"
            :href="settingsStore.getSetting('help_url')"
            class="p-button p-button-icon-only p-button-rounded p-button-text no-underline"
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

import { useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth.js';
import { useLoadingStore } from '@/stores/loading.js';
import { useSettingsStore } from '@/stores/settings.js';
import PermissionService from '@/services/PermissionService';
import LocaleSelector from '@/components/LocaleSelector.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const authStore = useAuthStore();
const loadingStore = useLoadingStore();
const settingsStore = useSettingsStore();

const route = useRoute();
const router = useRouter();

// Add a redirect query parameter to the login route if the current route has the redirectBackAfterLogin meta set to true
// This ensures that the user is redirected to the page he is currently on after login
// By default the user is redirected to the home page after login (see comment in router.js)
const loginRoute = computed(() => {
  const loginRoute = { name: 'login' };
  if (route.meta.redirectBackAfterLogin === true) { loginRoute.query = { redirect: route.path }; }
  return loginRoute;
});

async function logout () {
  let response;
  try {
    loadingStore.setLoading();
    response = await authStore.logout();
  } catch (error) {
    loadingStore.setLoadingFinished();
    this.toastError(t('auth.flash.logout_error'));
    return;
  }

  if (response.data.redirect) {
    window.location = response.data.redirect;
    return;
  }

  await router.push({ name: 'logout' });

  loadingStore.setLoadingFinished();
};

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

const userMenuItems = computed(() => {
  return [
    {
      label: t('app.profile'),
      route: { name: 'profile' }
    },
    {
      label: t('auth.logout'),
      action: logout
    }
  ];
});

</script>
