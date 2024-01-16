<template>
  <div>
    <router-link v-if="!authStore.isAuthenticated"
                 :to="loginRoute" class="p-button p-button-text p-button-plain"> {{ $t('auth.login') }}
    </router-link>
    <div v-else>
    <Button plain text type="button" @click="toggle" aria-haspopup="true" aria-controls="overlay_menu">
      {{ authStore.currentUser.firstname }} {{ authStore.currentUser.lastname }}
      <span class="fa-solid fa-caret-down ml-2" />
    </Button>
    <Menu ref="userMenu" :model="userMenuItems" :popup="true">
      <template #item="{ item, props }">
        <router-link v-if="item.route" :to="item.route" v-bind="props.action">
          <span>{{ item.label }}</span>
        </router-link>
        <a v-else :href="item.url" :target="item.target" v-bind="props.action">
          <span>{{ item.label }}</span>
        </a>
      </template>
    </Menu>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useLoadingStore } from '@/stores/loading';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const authStore = useAuthStore();
const loadingStore = useLoadingStore();
const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const userMenu = ref();

const toggle = (event) => {
  userMenu.value.toggle(event);
};

// Add a redirect query parameter to the login route if the current route has the redirectBackAfterLogin meta set to true
// This ensures that the user is redirected to the page he is currently on after login
// By default the user is redirected to the home page after login (see comment in router.js)
const loginRoute = computed(() => {
  const loginRoute = { name: 'login' };
  if (route.meta.redirectBackAfterLogin === true) { loginRoute.query = { redirect: route.path }; }
  return loginRoute;
});

const userMenuItems = computed(() => {
  return [
    {
      label: t('app.profile'),
      route: { name: 'profile' }
    },
    {
      label: t('auth.logout'),
      command: logout
    }
  ];
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
}
</script>
