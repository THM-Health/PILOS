<template>
    <div class="container">
        <div class="row mt-4">
            <div class="col-6 offset-3">
              <b-card no-body bg-variant="light">
                <b-tabs content-class="m-3" align="center" fill active-nav-item-class="bg-success text-white">
                  <b-tab title="THM" active>
                    <ldap-login-component
                      id="ldap"
                      title="Mit einem LDAP-Account anmelden"
                      @submit="handleLogin"
                      submit-label="Anmelden"
                      password-label="Passwort"
                      username-label="Benutzerkennung"
                      :loading="loading"
                      :errors="errors.ldap"
                    ></ldap-login-component>
                  </b-tab>
                  <b-tab title="Externe">
                    <email-login-component
                      id="default"
                      title="Mit einem normalen Account anmelden"
                      @submit="handleLogin"
                      submit-label="Anmelden"
                      password-label="Passwort"
                      email-label="Email"
                      :loading="loading"
                      :errors="errors.default"
                    ></email-login-component>
                  </b-tab>
                </b-tabs>
              </b-card>
            </div>
        </div>
    </div>
</template>

<script>
import EmailLoginComponent from './EmailLoginComponent'
import LdapLoginComponent from './LdapLoginComponent'

export default {
  components: {
    EmailLoginComponent,
    LdapLoginComponent
  },
  data () {
    return {
      loading: false,
      errors: {
        default: null,
        ldap: null
      }
    }
  },
  methods: {
    async handleLogin ({ data, id }) {
      try {
        this.errors[id] = null
        this.loading = true
        await this.$store.dispatch('session/login', { credentials: data, method: id })
      } catch (error) {
        this.errors[id] = error.response.data.errors
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>

</style>
