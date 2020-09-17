<template>
  <div>
    <b-container>
      <b-row class="mt-4" align-h="center">
        <b-col cols="8">
          <b-card
            header-bg-variant="success">
            <template v-slot:header>
              <b-card-text class="h3 text-white text-center">{{ $t('auth.register') }}</b-card-text>
            </template>
            <b-card-body>
              <b-form @submit.stop.prevent="onSubmit()">
                <div id="invitation-register">
                  <b-form-group id="register-email"
                                label-for="register-input-email">
                    <b-input-group>
                      <b-input-group-prepend v-b-tooltip.hover :title="$t('auth.email.email')">
                        <b-input-group-text class="bg-success text-white">
                          <b-icon icon="envelope"></b-icon>
                        </b-input-group-text>
                      </b-input-group-prepend>
                      <b-form-input id="register-input-email"
                                    v-model="email"
                                    :placeholder="$t('auth.email.email')"
                                    required
                                    :disabled="isBusy"
                                    :state="errors !== null && errors.email && errors.email.length > 0 ? false: null">
                      </b-form-input>
                    </b-input-group>
                    <b-form-invalid-feedback
                      :state="errors !== null && errors.email && errors.email.length > 0 ? false: null">
                      <template v-for="error in errors.email">
                        {{ error }}
                      </template>
                    </b-form-invalid-feedback>
                  </b-form-group>
                  <b-form-group id="register-username"
                                label-for="register-input-username">
                    <b-input-group>
                      <b-input-group-prepend v-b-tooltip.hover :title="$t('auth.username')">
                        <b-input-group-text class="bg-success text-white">
                          <b-icon icon="person-circle"></b-icon>
                        </b-input-group-text>
                      </b-input-group-prepend>
                      <b-form-input id="register-input-username"
                                    v-model="username"
                                    :placeholder="$t('auth.username')"
                                    required
                                    :disabled="isBusy"
                                    :state="errors !== null && errors.username && errors.username.length > 0 ? false: null">
                      </b-form-input>
                    </b-input-group>
                    <b-form-invalid-feedback
                      :state="errors !== null && errors.username && errors.username.length > 0 ? false: null">
                      <template v-for="error in errors.username">
                        {{ error }}
                      </template>
                    </b-form-invalid-feedback>
                  </b-form-group>
                  <b-form-group id="register-password"
                                label-for="register-input-password">
                    <b-input-group>
                      <b-input-group-prepend v-b-tooltip.hover :title="$t('auth.password')">
                        <b-input-group-text class="bg-success text-white">
                          <b-icon icon="shield-lock"></b-icon>
                        </b-input-group-text>
                      </b-input-group-prepend>
                      <b-form-input id="register-input-password"
                                    v-model="password"
                                    :placeholder="$t('auth.password')"
                                    type="password"
                                    required
                                    :disabled="isBusy"
                                    :state="errors !== null && errors.password && errors.password.length > 0 ? false: null">
                      </b-form-input>
                    </b-input-group>
                    <b-form-invalid-feedback
                      :state="errors !== null && errors.password && errors.password.length > 0 ? false: null">
                      <template v-for="error in errors.password">
                        {{ error }}
                      </template>
                    </b-form-invalid-feedback>
                  </b-form-group>
                  <b-form-group id="register-password-confirmation"
                                label-for="register-input-password-confirmation">
                    <b-input-group>
                      <b-input-group-prepend v-b-tooltip.hover :title="$t('auth.passwordConfirmation')">
                        <b-input-group-text class="bg-success text-white">
                          <b-icon icon="shield-lock-fill"></b-icon>
                        </b-input-group-text>
                      </b-input-group-prepend>
                      <b-form-input id="register-input-password-confirmation"
                                    v-model="passwordConfirmation"
                                    :placeholder="$t('auth.passwordConfirmation')"
                                    type="password"
                                    required
                                    :disabled="isBusy"
                                    :state="errors !== null && errors.password_confirmation && errors.password_confirmation.length > 0 ? false: null">
                      </b-form-input>
                    </b-input-group>
                    <b-form-invalid-feedback
                      :state="errors !== null && errors.password_confirmation && errors.password_confirmation.length > 0 ? false: null">
                      <template v-for="error in errors.password_confirmation">
                        {{ error }}
                      </template>
                    </b-form-invalid-feedback>
                  </b-form-group>
                  <b-form-group id="register-firstname"
                                label-for="register-input-firstname">
                    <b-input-group>
                      <b-input-group-prepend v-b-tooltip.hover :title="$t('auth.firstname')">
                        <b-input-group-text class="bg-success text-white">
                          <b-icon icon="tag"></b-icon>
                        </b-input-group-text>
                      </b-input-group-prepend>
                      <b-form-input id="register-input-firstname"
                                    v-model="firstname"
                                    :placeholder="$t('auth.firstname')"
                                    required
                                    :disabled="isBusy"
                                    :state="errors !== null && errors.firstname && errors.firstname.length > 0 ? false: null">
                      </b-form-input>
                    </b-input-group>
                    <b-form-invalid-feedback
                      :state="errors !== null && errors.firstname && errors.firstname.length > 0 ? false: null">
                      <template v-for="error in errors.firstname">
                        {{ error }}
                      </template>
                    </b-form-invalid-feedback>
                  </b-form-group>
                  <b-form-group id="register-lastname"
                                label-for="register-input-lastname">
                    <b-input-group>
                      <b-input-group-prepend v-b-tooltip.hover :title="$t('auth.lastname')">
                        <b-input-group-text class="bg-success text-white">
                          <b-icon icon="tag-fill"></b-icon>
                        </b-input-group-text>
                      </b-input-group-prepend>
                      <b-form-input id="register-input-lastname"
                                    v-model="lastname"
                                    :placeholder="$t('auth.lastname')"
                                    required
                                    :disabled="isBusy"
                                    :state="errors !== null && errors.lastname && errors.lastname.length > 0 ? false: null">
                      </b-form-input>
                    </b-input-group>
                    <b-form-invalid-feedback
                      :state="errors !== null && errors.lastname && errors.lastname.length > 0 ? false: null">
                      <template v-for="error in errors.lastname">
                        {{ error }}
                      </template>
                    </b-form-invalid-feedback>
                  </b-form-group>
                </div>

                <b-button
                  id="register-submit"
                  class="mt-3"
                  block
                  type="submit"
                  variant="success"
                  :disabled="isBusy">
                  {{ $t('auth.register') }}
                </b-button>
              </b-form>
            </b-card-body>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import Base from '../api/base';
import { mapGetters } from 'vuex';

export default {
  data () {
    return {
      email: null,
      password: null,
      passwordConfirmation: null,
      firstname: null,
      lastname: null,
      username: null,
      invitationToken: null,
      isBusy: false,
      isPublicRegistration: null,
      errors: []
    };
  },
  methods: {
    onSubmit () {
      this.register();
    },
    register () {
      this.isBusy = true;

      Base.call('register', {
        headers: {
          'content-type': 'application/json'
        },
        method: 'post',
        data: {
          firstname: this.firstname,
          lastname: this.lastname,
          email: this.email,
          username: this.username,
          password: this.password,
          password_confirmation: this.passwordConfirmation,
          invitation_token: this.invitationToken
        }
      }).then(response => {
        this.flashMessage.success(this.$t('settings.users.createSuccess'));

        this.$bvModal.hide(this.modalId);

        this.errors = [];

        this.$router.push('/login');
      }).catch((error) => {
        // TODO error handling
        this.errors = error.response.data.errors;

        this.flashMessage.error(this.$t('settings.users.createFailed'));

        throw error;
      }).finally(() => {
        this.isBusy = false;
      });
    },
    checkInvitationToken () {
      this.isBusy = true;
      this.invitationToken = this.$route.query.invitation_token;

      Base.call('invitation/checktoken', {
        params: {
          invitation_token: this.invitationToken
        }
      }).then(response => {
        this.errors = [];
      }).catch((error) => {
        // TODO error handling
        this.errors = error.response.data.errors;

        this.flashMessage.error(this.$t('auth.flash.invitationTokenFailed'));

        this.$router.push('/login');

        throw error;
      }).finally(() => {
        this.isBusy = false;
      });
    }
  },
  mounted () {
    this.isPublicRegistration = this.settings('open_registration');

    if (!this.isPublicRegistration) {
      this.checkInvitationToken();
    }
  },
  computed: {
    ...mapGetters({
      settings: 'session/settings'
    })
  }
};
</script>

<style scoped>

</style>
