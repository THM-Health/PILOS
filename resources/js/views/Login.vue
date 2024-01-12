<template>
  <div class="container">
    <div class="grid mt-4 mb-5">
      <div class="col-12 md:col-8 lg:col-6 md:col-offset-2 lg:col-offset-3">

        <Card
          :pt="{ body: { class: 'p-0' }, content: { class : 'p-0'} }"
        >

          <template #content>
            <TabView
              :lazy="true"
              :pt="{
              navContent: {
                class: 'border-round-top'
              },
              }"
            >
              <TabPanel
                v-if="settingsStore.getSetting('auth.ldap')"
                :header="$t('auth.ldap.tab_title')"
                :pt="{
                  header: {
                    class: 'flex-1 flex align-items-center justify-content-center'
                  },
                  headerAction: ({ context }) => ({
                      class: panelClass(context)
                  })
                }"
              >
                <ldap-login-component
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
                :pt="{
                  header: {
                    class: 'flex-1 flex align-items-center justify-content-center'
                  },
                  headerAction: ({ context }) => ({
                      class: panelClass(context)
                  })
                }"
              >
                <external-login-component
                  id="shibboleth"
                  :title="$t('auth.shibboleth.title')"
                  :redirect-label="$t('auth.shibboleth.redirect')"
                  :redirect-url="shibbolethRedirectUrl"
                />
              </TabPanel>
              <TabPanel
                v-if="settingsStore.getSetting('auth.local')"
                :header="$t('auth.email.tab_title')"
                :pt="{
                  header: {
                    class: 'flex-1 flex align-items-center justify-content-center'
                  },
                  headerAction: ({ context }) => ({
                      class: panelClass(context)
                  })
                }"
              >
                <local-login-component
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
import LocalLoginComponent from '@/components/Login/LocalLoginComponent.vue';
import LdapLoginComponent from '@/components/Login/LdapLoginComponent.vue';
import env from '@/env';
import Base from '@/api/base';
import { mapState, mapActions } from 'pinia';
import { useSettingsStore } from '@/stores/settings';
import { useAuthStore } from '@/stores/auth';
import ExternalLoginComponent from '@/components/Login/ExternalLoginComponent.vue';
import { computed, ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const settingsStore = useSettingsStore();

const loading = ref(false);
const errors = reactive({
  local: null,
  ldap: null
});

const route = useRoute();
const shibbolethRedirectUrl = computed(() => {
  const url = '/auth/shibboleth/redirect';
  return route.query.redirect ? url + '?redirect=' + encodeURIComponent(route.query.redirect) : url;
});

const authStore = useAuthStore();
const router = useRouter();

const panelClass = (context) => {
  return [
    {
      'w-full': true,
      'border-noround': true,
      'justify-content-center': true,
      'p-3': true,
      'bg-primary': context.active
    }
  ];
};

/**
* Handle login request
* @param data Credentials with username/email and password
* @param id ID of the login method (ldap or local)
* @return {Promise<void>}
*/
async function handleLogin ({ data, id }) {
  console.log('handleLogin', data, id);
  try {
    errors[id] = null;
    loading.value = true;
    await authStore.login(data, id);
    // @TODO: fix toast
    // this.toastSuccess(t('auth.flash.login'));
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
        // @TODO: fix base error
      // Base.error(error, this.$root, error.message);
      }
    }
  } finally {
    loading.value = false;
  }
}
</script>
