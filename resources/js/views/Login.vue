<!--
SPDX-FileCopyrightText: 2020 Technische Hochschule Mittelhessen (THM) and PILOS contributors

SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
  <div class="container">
    <div class="mt-6 mb-8 grid grid-cols-12 gap-4">
      <div
        class="col-span-12 md:col-span-8 md:col-start-3 lg:col-span-6 lg:col-start-4"
      >
        <Card>
          <template #title>
            <PageTitle :title="$t('auth.login')" />
          </template>
          <template #content>
            <Tabs :lazy="true" :value="activeTab">
              <TabList>
                <Tab
                  v-if="settingsStore.getSetting('auth.ldap')"
                  data-test="login-tab-button-ldap"
                  value="ldap"
                  >{{ $t("auth.ldap.tab_title") }}</Tab
                >
                <Tab
                  v-if="settingsStore.getSetting('auth.shibboleth')"
                  data-test="login-tab-button-shibboleth"
                  value="shibboleth"
                  >{{ $t("auth.shibboleth.tab_title") }}</Tab
                >
                <Tab
                  v-if="settingsStore.getSetting('auth.oidc')"
                  data-test="login-tab-button-oidc"
                  value="oidc"
                  >{{ $t("auth.oidc.tab_title") }}</Tab
                >
                <Tab
                  v-if="settingsStore.getSetting('auth.local')"
                  data-test="login-tab-button-local"
                  value="local"
                  >{{ $t("auth.email.tab_title") }}</Tab
                >
              </TabList>
              <TabPanels>
                <TabPanel
                  v-if="settingsStore.getSetting('auth.ldap')"
                  value="ldap"
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
                  value="shibboleth"
                >
                  <LoginTabExternal
                    id="shibboleth"
                    :title="$t('auth.shibboleth.title')"
                    :redirect-label="$t('auth.shibboleth.redirect')"
                    :redirect-url="shibbolethRedirectUrl"
                  />
                </TabPanel>
                <TabPanel
                  v-if="settingsStore.getSetting('auth.oidc')"
                  value="oidc"
                >
                  <LoginTabExternal
                    id="oidc"
                    :title="$t('auth.oidc.title')"
                    :redirect-label="$t('auth.oidc.redirect')"
                    :redirect-url="oidcRedirectUrl"
                  />
                </TabPanel>
                <TabPanel
                  v-if="settingsStore.getSetting('auth.local')"
                  value="local"
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
              </TabPanels>
            </Tabs>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useSettingsStore } from "../stores/settings";
import { useAuthStore } from "../stores/auth";
import { computed, ref, reactive, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useApi } from "../composables/useApi";
import { useToast } from "../composables/useToast.js";
import {
  HTTP_STATUS_TOO_MANY_REQUESTS,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "../constants/httpStatusCodes.js";

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
  ldap: null,
});

const activeTab = ref("");

const normalizedRedirect = computed(() => {
  const value = route.query.redirect;
  const redirectValue = Array.isArray(value) ? value[0] : value;
  return redirectValue || undefined;
});

onMounted(() => {
  // Redirect already authenticated users
  // to their preferred redirect route
  // fallback to room overview
  if (authStore.isAuthenticated) {
    if (normalizedRedirect.value !== undefined) {
      router.push(normalizedRedirect.value);
    } else {
      router.push({ name: "rooms.index" });
    }
    return;
  }

  if (settingsStore.getSetting("auth.ldap")) {
    activeTab.value = "ldap";
  } else if (settingsStore.getSetting("auth.shibboleth")) {
    activeTab.value = "shibboleth";
  } else if (settingsStore.getSetting("auth.oidc")) {
    activeTab.value = "oidc";
  } else {
    activeTab.value = "local";
  }
});

const oidcRedirectUrl = computed(() => {
  const url = "/auth/oidc/redirect";
  return normalizedRedirect.value
    ? url + "?redirect=" + encodeURIComponent(normalizedRedirect.value)
    : url;
});

const shibbolethRedirectUrl = computed(() => {
  const url = "/auth/shibboleth/redirect";
  return normalizedRedirect.value
    ? url + "?redirect=" + encodeURIComponent(normalizedRedirect.value)
    : url;
});

/**
 * Handle login request
 * @param data Credentials with username/email and password
 * @param id ID of the login method (ldap or local)
 * @return {Promise<void>}
 */
async function handleLogin({ data, id }) {
  try {
    errors[id] = null;
    loading.value = true;
    await authStore.login(data, id);
    toast.success(t("auth.flash.login"));
    // check if user should be redirected back after login
    if (route.query.redirect !== undefined) {
      await router.push(route.query.redirect);
    } else {
      await router.push({ name: "rooms.index" });
    }
  } catch (error) {
    if (
      error.response !== undefined &&
      error.response.status === HTTP_STATUS_UNPROCESSABLE_ENTITY
    ) {
      errors[id] = error.response.data.errors;
    } else {
      if (
        error.response !== undefined &&
        error.response.status === HTTP_STATUS_TOO_MANY_REQUESTS
      ) {
        const retryAfter = error.response.headers["retry-after"];
        if (data.username) {
          errors[id] = {
            username: [t("auth.throttle", { seconds: retryAfter })],
          };
        } else {
          errors[id] = { email: [t("auth.throttle", { seconds: retryAfter })] };
        }
      } else {
        api.error(error);
      }
    }
  } finally {
    loading.value = false;
  }
}
</script>
