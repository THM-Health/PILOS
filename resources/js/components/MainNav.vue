<template>
  <div class="border-surface bg-white dark:bg-surface-900 py-2 border-b">
    <div class="container flex flex-row justify-between">
      <Menubar
        :breakpoint="menuBreakpoint+'px'"
        :model="mainMenuItems"
        :pt="{
          root: 'm-0 border-0',
          menu: {
            class: 'gap-1 px-2'
          },
          action: {
            class: 'p-2'
          }
        }"
      >
        <template #start>
          <RouterLink v-if="settingsStore.getSetting('theme.logo')" :to="{ name: 'home' }" class="mr-12">
            <img
              style="height: 2rem;"
              :src="isDark ? settingsStore.getSetting('theme.logo_dark') : settingsStore.getSetting('theme.logo')"
              alt="Logo"
            />
          </RouterLink>
        </template>
        <template #item="{ item, props, hasSubmenu, root }">
          <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
            <a :href="href" v-bind="props.action" @click="navigate" class="flex items-center">
              <span>{{ item.label }}</span>
            </a>
          </router-link>
          <a v-else :href="item.url" :target="item.target" v-bind="props.action" class="flex items-center">
            <span>{{ item.label }}</span>
            <i v-if="hasSubmenu" :class="['fa-solid fa-chevron-down text-xs', { 'fa-chevron-down ml-2': root, 'fa-chevron-right ml-auto': !root }]"></i>
          </a>
        </template>
      </Menubar>
      <Menubar
        v-if="!isMobile"
        :model="userMenuItems"
        :pt="{
              root: 'main-menu-right shrink-0 m-0 border-0',
              menu: {
                class: 'gap-1 px-2',
              },
              item: {
                class: 'relative',
              },
              submenu: {
                class: 'right-0',
                'data-test': 'submenu'
              },
              itemLink: {
                'data-test': 'submenu-action'
              }
            }"
      >
        <template #item="{ item, props, hasSubmenu, root }">
          <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
            <a :href="href" v-bind="props.action" @click="navigate" class="flex items-center">
              <span v-if="!item.icon">{{ item.label }}</span>
            </a>
          </router-link>
          <a v-else :href="item.url" :target="item.target" v-bind="props.action" class="flex items-center">
            <i v-if="item.icon" :class="item.icon" />
            <UserAvatar data-test="user-avatar" v-if="item.userAvatar" :firstname="authStore.currentUser.firstname" :lastname="authStore.currentUser.lastname" :image="authStore.currentUser.image" class="bg-secondary" />
            <span v-if="!item.userAvatar && !item.icon">{{ item.label }}</span>
            <i v-if="hasSubmenu" :class="['fa-solid fa-chevron-down text-xs', { 'fa-chevron-down ml-2': root, 'fa-chevron-right ml-auto': !root }]"></i>
          </a>
        </template>
      </Menubar>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useSettingsStore } from '../stores/settings.js';
import { useAuthStore } from '../stores/auth.js';
import { useUserPermissions } from '../composables/useUserPermission.js';
import { useI18n } from 'vue-i18n';
import { useBreakpoints, useDark, useToggle } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';
import { useLoadingStore } from '../stores/loading.js';
import UserAvatar from './UserAvatar.vue';
import env from '../env.js';
import { useLocaleStore } from '../stores/locale.js';
import { useApi } from '../composables/useApi.js';
import { useToast } from '../composables/useToast.js';

const menuBreakpoint = 1023;

const breakpoints = useBreakpoints({
  desktop: menuBreakpoint
});

const isMobile = breakpoints.smallerOrEqual('desktop');

const settingsStore = useSettingsStore();
const authStore = useAuthStore();
const userPermissions = useUserPermissions();
const loadingStore = useLoadingStore();
const api = useApi();
const localeStore = useLocaleStore();
const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const toast = useToast();

const isDark = useDark();
const toggleDark = useToggle(isDark);

const mainMenuItems = computed(() => {
  const items = [];

  if (authStore.isAuthenticated) {
    items.push({
      label: t('app.rooms'),
      route: { name: 'rooms.index' }
    });

    if (userPermissions.can('viewAny', 'MeetingPolicy')) {
      items.push({
        label: t('meetings.currently_running'),
        route: { name: 'meetings.index' }
      });
    }

    if (userPermissions.can('view', 'AdminPolicy')) {
      items.push({
        label: t('admin.title'),
        route: { name: 'admin' }
      });
    }

    if (userPermissions.can('monitor', 'SystemPolicy')) {
      const menuItem = {
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
          }
        ]
      };

      if (settingsStore.getSetting('monitor.telescope')) {
        menuItem.items.push({
          label: t('system.monitor.telescope'),
          url: '/telescope',
          target: '_blank'
        });
      }

      items.push(menuItem);
    }
  }

  if (isMobile.value) {
    userMenuItems.value.forEach((item) => {
      items.push(item);
    });
  }

  return items;
});

const userMenuItems = computed(() => {
  const items = [];

  if (authStore.isAuthenticated) {
    items.push({
      class: 'user-avatar',
      userAvatar: true,
      label: authStore.currentUser.firstname + ' ' + authStore.currentUser.lastname,
      items: [
        {
          label: t('app.profile'),
          route: { name: 'profile' }
        },
        {
          label: t('auth.logout'),
          command: logout
        }
      ]
    });
  } else {
    items.push({
      label: t('auth.login'),
      route: loginRoute
    });
  }

  if (settingsStore.getSetting('general.help_url')) {
    items.push({
      icon: 'fa-solid fa-circle-question text-xl',
      label: t('app.help'),
      target: '_blank',
      url: settingsStore.getSetting('general.help_url')
    });
  }

  items.push({
    icon: 'fa-solid text-xl ' + (isDark.value ? ' fa-moon' : ' fa-sun'),
    label: isDark.value ? t('app.dark_mode_disable') : t('app.dark_mode_enable'),
    command: () => toggleDark()
  });

  const localeItem = {
    icon: 'fa-solid fa-language text-xl',
    label: t('app.change_locale'),
    items: []
  };

  locales.value.forEach((locale) => {
    localeItem.items.push({
      label: locale.label,
      command: () => changeLocale(locale.locale)
    });
  });

  items.push(localeItem);

  return items;
});

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
    toast.error(t('auth.flash.logout_error'));
    return;
  }

  if (response.data.redirect) {
    window.location = response.data.redirect;
    return;
  }

  const message = response.data.message || null;

  await router.push({ name: 'logout', query: { message } });

  loadingStore.setLoadingFinished();
}

const locales = computed(() => {
  const locales = settingsStore.getSetting('general.enabled_locales');
  if (!locales) {
    return [];
  }

  return Object.entries(locales).map(([locale, label]) => {
    return {
      label,
      locale
    };
  });
});

async function changeLocale (locale) {
  loadingStore.setOverlayLoading();
  try {
    await api.call('locale', {
      data: { locale },
      method: 'post'
    });

    await localeStore.setLocale(locale);
  } catch (error) {
    if (error.response !== undefined && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
      toast.error(error.response.data.errors.locale.join(' '));
    } else {
      loadingStore.setOverlayLoadingFinished();
      api.error(error);
    }
  } finally {
    loadingStore.setOverlayLoadingFinished();
  }
}
</script>
