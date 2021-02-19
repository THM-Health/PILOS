<template>
  <div class='container'>
    <div class='row mt-4 mb-5'>
      <div class='col-12 col-md-8 col-lg-6 offset-md-2 offset-lg-3'>
        <b-card no-body bg-variant='light'>
          <div class='m-3'>
            <h5>{{ $t('auth.inputNewPassword') }}</h5>
            <b-form @submit.prevent="submit">
              <b-form-group
                label-cols-sm='3'
                :label="$t('auth.password')"
                label-for='password'
                :state='fieldState("password")'
              >
                <b-form-input
                  id='password'
                  v-model='password'
                  type='password'
                  required
                  :state='fieldState("password")'
                  :disabled='loading'
                ></b-form-input>

                <template slot='invalid-feedback'><div v-html="fieldError('password')"></div></template>
              </b-form-group>
              <b-form-group
                label-cols-sm='3'
                :label="$t('settings.users.password_confirmation')"
                label-for='password_confirmation'
                :state='fieldState("password_confirmation")'
              >
                <b-form-input
                  id='password_confirmation'
                  v-model='password_confirmation'
                  type='password'
                  required
                  :state='fieldState("password_confirmation")'
                  :disabled='loading'
                ></b-form-input>

                <template slot='invalid-feedback'><div v-html="fieldError('password_confirmation')"></div></template>
              </b-form-group>

              <b-form-invalid-feedback  v-if='fieldState("email") === false'>
                <template>
                  {{ fieldError('email') }}
                </template>
              </b-form-invalid-feedback>

              <b-form-invalid-feedback  v-if='fieldState("token") === false'>
                <template>
                  {{ fieldError('token') }}
                </template>
              </b-form-invalid-feedback>

              <b-button type='submit' variant='success' :disabled="loading" block>
                <b-spinner v-if="loading" small></b-spinner>
                {{ $t('auth.resetPassword') }}
              </b-button>
            </b-form>
          </div>
        </b-card>
      </div>
    </div>
  </div>
</template>

<script>
import FieldErrors from '../mixins/FieldErrors';
import Base from '../api/base';
import env from '../env';
import { loadLanguageAsync } from '../i18n';

export default {
  mixins: [FieldErrors],

  props: {
    token: {
      type: String,
      default: null
    },

    email: {
      type: String,
      default: null
    }
  },

  data () {
    return {
      loading: false,
      errors: {},
      password: null,
      password_confirmation: null
    };
  },

  methods: {
    /**
     * Sends a request with a new password to set for the given email through the query parameters
     * in the url. If an error occurs a flash message will be shown. Otherwise if the reset is
     * successful, the current user is requested on the server and the locale of the frontend
     * gets updated with the locale of the current user.
     *
     * @return {Promise<void>}
     */
    async submit () {
      this.loading = true;
      const config = {
        method: 'post',
        data: {
          email: this.email,
          token: this.token,
          password: this.password,
          password_confirmation: this.password_confirmation
        }
      };

      try {
        const response = await Base.call('password/reset', config, true);

        this.flashMessage.success({
          title: response.data.message
        });

        await this.$store.dispatch('session/getCurrentUser');

        if (this.$store.state.session.currentUser.user_locale !== null) {
          await loadLanguageAsync(this.$store.state.session.currentUser.user_locale);
          this.$store.commit('session/setCurrentLocale', this.$store.state.session.currentUser.user_locale);
        }

        await this.$router.push({ name: 'home' });
      } catch (error) {
        if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          this.errors = error.response.data.errors;
        } else {
          Base.error(error, this.$root, error.message);
        }
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>

</style>
