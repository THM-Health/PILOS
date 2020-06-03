<template>
    <div class="container">
        <div class="row mt-4">
            <div class="col-6 offset-3">
              <b-card no-body>
                <b-tabs content-class="m-3" align="center" fill>
                  <b-tab title="LDAP" active>
                    <credentials-input-component
                      id="ldap"
                      title="Mit einem LDAP-Account anmelden"
                      @submit="handleLogin"
                      submit-label="Anmelden"
                      password-label="Passwort"
                      username-label="Benutzerkennung"
                      :loading="loading"
                      :errors="errors.ldap"
                    ></credentials-input-component>
                  </b-tab>
                  <b-tab title="Standard">
                    <credentials-input-component
                      id="default"
                      title="Mit einem normalen Account anmelden"
                      @submit="handleLogin"
                      submit-label="Anmelden"
                      password-label="Passwort"
                      username-label="Benutzerkennung"
                      :loading="loading"
                      :errors="errors.default"
                    ></credentials-input-component>
                  </b-tab>
                </b-tabs>
              </b-card>
            </div>
        </div>
    </div>
</template>

<script>
import CredentialsInputComponent from './CredentialsInputComponent'

export default {
  components: {
    CredentialsInputComponent
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
