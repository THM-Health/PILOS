<template>
  <div class='container'>
    <div class='row mt-4 mb-5'>
      <div class='col-12 col-md-8 col-lg-6 offset-md-2 offset-lg-3'>
        <b-card no-body bg-variant='light'>
          <div class='m-3'>
            <h5>{{ $t('auth.resetPassword') }}</h5>
            <b-form @submit.prevent="submit">
              <b-form-group
                :label="$t('app.email')"
                label-for='email'
                :state='fieldState("email")'
              >
                <b-form-input
                  id='email'
                  v-model='email'
                  type='email'
                  required
                  :state='fieldState("email")'
                  :disabled='loading'
                ></b-form-input>

                <template slot='invalid-feedback'><div v-html="fieldError('email')"></div></template>
              </b-form-group>

              <b-button type='submit' variant='primary' :disabled="loading" block>
                <b-spinner v-if="loading" small></b-spinner>
                {{ $t('auth.sendPasswordResetLink') }}
              </b-button>
            </b-form>
          </div>
        </b-card>
      </div>
    </div>
  </div>
</template>

<script>
import store from '../store';
import FieldErrors from '../mixins/FieldErrors';
import Base from '../api/base';

export default {
  mixins: [FieldErrors],

  data () {
    return {
      email: null,
      loading: false,
      errors: {}
    };
  },

  /**
   * Calls the next callback if the password self reset page is enabled
   * otherwise the user gets redirected to a 404 route.
   */
  beforeRouteEnter (to, from, next) {
    if (!store.getters['session/settings']('password_self_reset_enabled')) {
      next('/404');
    } else {
      next();
    }
  },

  methods: {
    /**
     * Sends a password reset request to the server for the given email.
     */
    submit () {
      this.loading = true;
      const config = {
        method: 'post',
        data: {
          email: this.email
        }
      };

      Base.call('password/email', config, true).then(response => {
        this.flashMessage.success(response.data.message);
        this.$router.push({ name: 'home' });
      }).catch(error => {
        Base.error(error, this.$root, error.message);
      }).finally(() => {
        this.loading = false;
      });
    }
  }
};
</script>

<style scoped>

</style>
