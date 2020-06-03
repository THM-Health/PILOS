<template>
    <div class="container">
        <!-- login form -->
        <div class="row mt-4">
            <div class="col-6 offset-3">

              <b-card no-body>
                <b-tabs card content-class="mt-3" align="center" fill>
                  <b-tab title="THM" active>

                    <h4 class="mb-0">In Ihr THM-Benutzerkonto einloggen</h4>


                    <b-form @submit.prevent="handleLogin" >
                      <b-form-group
                        id="input-group-ldap-email"
                        label="THM Benutzerkennung"
                        label-for="ldap-username"
                      >
                        <b-form-input
                          id="ldap-username"
                          v-model="form.ldap.username"
                          type="text"
                          required
                          :state="errors.username && errors.username.length > 0 ? false: null"
                          placeholder="THM Benutzerkennung"
                        ></b-form-input>

                        <b-form-invalid-feedback id="input-live-feedback">
                          <template v-for="error in errors.username">
                            @{{ error }}
                          </template>
                        </b-form-invalid-feedback>
                      </b-form-group>

                      <b-form-group id="input-group-ldap-password" label="Passwort" label-for="ldap-password">
                        <b-form-input
                          id="ldap-password"
                          v-model="form.ldap.password"
                          type="password"
                          required
                          :state="errors.password && errors.password.length > 0 ? false: null"
                          placeholder="Enter name"
                        ></b-form-input>

                        <b-form-invalid-feedback id="input-live-feedback">
                          <template v-for="error in errors.password">
                            @{{ error }}
                          </template>
                        </b-form-invalid-feedback>
                      </b-form-group>

                      <b-button type="submit" variant="success">
                        <b-spinner v-if="loading" small></b-spinner>
                        Login</b-button>

                    </b-form>
                  </b-tab>
                  <b-tab title="Gäste">
                    <b-card-text>Gäste</b-card-text>
                  </b-tab>
                </b-tabs>
              </b-card>


            </div>
        </div>
    </div>
</template>

<script>

export default {
  data() {
    return {
      form: {
        ldap: {
          username: '',
          password: '',
        },
        checked: []
      },
      show: true,
      loading: false,
      errors: {
        username: null,
        password: null,
      },
    }
  },
  methods: {
    handleLogin () {
      this.$store.dispatch('session/login', {
        password: this.form.ldap.password,
        username: this.form.ldap.username
      })
    }
  }
}
</script>

<style scoped>

</style>
