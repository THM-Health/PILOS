<template>
  <NavbarButton v-if="!authStore.isAuthenticated" :to="loginRoute" :text="$t('auth.login')" />
  <div v-else>

    <NavbarDropdownButton :text="authStore.currentUser.firstname+' '+authStore.currentUser.lastname">
      <template v-slot="slotProps">
        <NavbarDropdownItem
          @click="slotProps.closeCallback(); $emit('itemClicked');"
          :to="{ name: 'profile' }"
          :text="$t('app.profile')"
        />
        <NavbarDropdownItem
          @click="slotProps.closeCallback(); $emit('itemClicked'); logout()"
          :text="$t('auth.logout')"
        />
      </template>
    </NavbarDropdownButton>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useLoadingStore } from '@/stores/loading';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const authStore = useAuthStore();
const loadingStore = useLoadingStore();
const router = useRouter();
const route = useRoute();
const { t } = useI18n();

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
}
</script>
