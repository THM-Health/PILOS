<template>
  <div class="container">
    <div class="row mt-4 mb-5">
      <div class="col-12 col-md-8 col-lg-6 offset-md-2 offset-lg-3">
        <b-card no-body bg-variant="light">
          <b-tabs content-class="m-3" align="center" fill active-nav-item-class="bg-primary">
            <b-tab :title="$t('auth.ldap.tab_title')" v-if="getSetting('auth.ldap')" >
              <ldap-login-component
                id="ldap"
                :title="$t('auth.ldap.title')"
                @submit="handleLogin"
                :submit-label="$t('auth.login')"
                :password-label="$t('auth.password')"
                :username-label="$t('auth.ldap.username')"
                :loading="loading"
                :errors="errors.ldap"
              ></ldap-login-component>
            </b-tab>
            <b-tab :title="$t('auth.shibboleth.tab_title')" v-if="getSetting('auth.shibboleth')" >
              <external-login-component
                id="shibboleth"
                :title="$t('auth.shibboleth.title')"
                :redirect-label="$t('auth.shibboleth.redirect')"
                :redirect-url="shibbolethRedirectUrl"
              ></external-login-component>
            </b-tab>
            <b-tab :title="$t('auth.email.tab_title')" v-if="getSetting('auth.local')">
              <local-login-component
                id="local"
                :title="$t('auth.email.title')"
                @submit="handleLogin"
                :submit-label="$t('auth.login')"
                :password-label="$t('auth.password')"
                :email-label="$t('app.email')"
                :loading="loading"
                :errors="errors.local"
              ></local-login-component>
            </b-tab>
          </b-tabs>
        </b-card>
      </div>
    </div>
  </div>
</template>

<script>
import LocalLoginComponent from '../components/Login/LocalLoginComponent.vue';
import LdapLoginComponent from '../components/Login/LdapLoginComponent.vue';
import env from '../env';
import Base from '../api/base';
import { mapState, mapActions } from 'pinia';
import { useSettingsStore } from '../stores/settings';
import { useAuthStore } from '../stores/auth';
import ExternalLoginComponent from '../components/Login/ExternalLoginComponent.vue';

export default {
  components: {
    ExternalLoginComponent,
    LocalLoginComponent,
    LdapLoginComponent
  },
  data () {
    return {
      loading: false,
      errors: {
        local: null,
        ldap: null
      }
    };
  },
  computed: {

    ...mapState(useSettingsStore, ['getSetting']),

    shibbolethRedirectUrl () {
      const url = '/auth/shibboleth/redirect';
      return this.$route.query.redirect ? url + '?redirect=' + encodeURIComponent(this.$route.query.redirect) : url;
    }
  },
  methods: {

    ...mapActions(useAuthStore, ['login']),

    /**
     * Handle login request
     * @param data Credentials with username/email and password
     * @param id ID of the login method (ldap or local)
     * @return {Promise<void>}
     */
    async handleLogin ({ data, id }) {
      try {
        this.errors[id] = null;
        this.loading = true;
        await this.login(data, id);
        this.toastSuccess(this.$t('auth.flash.login'));
        // check if user should be redirected back after login
        if (this.$route.query.redirect !== undefined) {
          await this.$router.push(this.$route.query.redirect);
        } else {
          await this.$router.push({ name: 'rooms.index' });
        }
      } catch (error) {
        if (error.response !== undefined && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          this.errors[id] = error.response.data.errors;
        } else {
          if (error.response !== undefined && error.response.status === env.HTTP_TOO_MANY_REQUESTS) {
            this.errors[id] = error.response.data.errors;
          } else {
            Base.error(error, this.$root, error.message);
          }
        }
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
