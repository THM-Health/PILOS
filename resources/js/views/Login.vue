<template>
  <div class="container">
    <div class="grid grid-cols-12 gap-4 mt-6 mb-8">
      <div class="col-span-12 md:col-span-8 lg:col-span-6 md:col-start-3 lg:col-start-4">
        <Card>
          <template #content>
            <TabView
              :lazy="true"
              :pt="{
              navContent: {
                class: 'rounded-t'
              },
              }"
            >
              <TabPanel
                v-if="settingsStore.getSetting('auth.ldap')"
                :header="$t('auth.ldap.tab_title')"
              >
                <LoginTabLdap
                  id="ldap"
                  :title="$t('auth.ldap.title')"
                  :submit-label="$t('auth.login')"
                  :password-label="$t('auth.password')"
                  :username-label="$t('auth.ldap.username')"
                  :loading="loading"
                  :errors="errors.ldap"
                  @submit="handleLogin"
                />
              </TabPanel>
              <TabPanel
                v-if="settingsStore.getSetting('auth.shibboleth')"
                :header="$t('auth.shibboleth.tab_title')"
              >
                <LoginTabExternal
                  id="shibboleth"
                  :title="$t('auth.shibboleth.title')"
                  :redirect-label="$t('auth.shibboleth.redirect')"
                  :redirect-url="shibbolethRedirectUrl"
                />
              </TabPanel>
              <TabPanel
                v-if="settingsStore.getSetting('auth.local')"
                :header="$t('auth.email.tab_title')"
              >
                <LoginTabLocal
                  id="local"
                  :title="$t('auth.email.title')"
                  :submit-label="$t('auth.login')"
                  :password-label="$t('auth.password')"
                  :email-label="$t('app.email')"
                  :loading="loading"
                  :errors="errors.local"
                  @submit="handleLogin"
                />
              </TabPanel>
            </TabView>
          </template>

        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import env from '../env';
import { useSettingsStore } from '../stores/settings';
import { useAuthStore } from '../stores/auth';
import { computed, ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useApi } from '../composables/useApi';
import { useToast } from '../composables/useToast.js';

const settingsStore = useSettingsStore();
const router = useRouter();
const authStore = useAuthStore();
const route = useRoute();
const { t } = useI18n();
const toast = useToast();
const api = useApi();

const loading = ref(false);
const errors = reactive({
  local: null,
  ldap: null
});

const shibbolethRedirectUrl = computed(() => {
  const url = '/auth/shibboleth/redirect';
  return route.query.redirect ? url + '?redirect=' + encodeURIComponent(route.query.redirect) : url;
});

/**
* Handle login request
* @param data Credentials with username/email and password
* @param id ID of the login method (ldap or local)
* @return {Promise<void>}
*/
async function handleLogin ({ data, id }) {
  try {
    errors[id] = null;
    loading.value = true;
    await authStore.login(data, id);
    toast.success(t('auth.flash.login'));
    // check if user should be redirected back after login
    if (route.query.redirect !== undefined) {
      await router.push(route.query.redirect);
    } else {
      await router.push({ name: 'rooms.index' });
    }
  } catch (error) {
    if (error.response !== undefined && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
      errors[id] = error.response.data.errors;
    } else {
      if (error.response !== undefined && error.response.status === env.HTTP_TOO_MANY_REQUESTS) {
        errors[id] = error.response.data.errors;
      } else {
        api.error(error);
      }
    }
  } finally {
    loading.value = false;
  }
}
</script>
