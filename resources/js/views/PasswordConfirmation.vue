<template>
  <b-container class='mt-3 mb-5'>
    <b-card class='p-3 border bg-white'>
      <h3>{{ $t('app.confirmPassword.title') }}</h3>
      <hr>

      <b-form @submit='confirm'>
        <b-container :fluid='true'>
          <b-form-group
            label-cols-lg='12'
            :label="$t('app.confirmPassword.description')"
            class='mb-0'
          >
            <b-form-group
              label-cols-sm='3'
              :label="$t('settings.users.password')"
              label-for='password'
              :state='fieldState("password")'
            >
              <b-form-input
                id='password'
                type='password'
                v-model='password'
                :state='fieldState("password")'
                :disabled="isBusy"
                class='col-md-6'
              ></b-form-input>
              <template slot='invalid-feedback'><div v-html="fieldError('password')"></div></template>
            </b-form-group>
          </b-form-group>
          <b-row class='my-1 float-right'>
            <b-col sm='12'>
              <b-button
                :disabled='isBusy'
                variant='success'
                type='submit'
                >
                {{ $t('app.confirmPassword.title') }}
              </b-button>
            </b-col>
          </b-row>
        </b-container>
      </b-form>
    </b-card>
  </b-container>
</template>

<script>
import FieldErrors from '../mixins/FieldErrors';
import Base from '../api/base';
import env from '../env';

export default {
  mixins: [FieldErrors],

  props: {
    next: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      isBusy: false,
      password: null,
      errors: {}
    };
  },

  methods: {
    confirm (evt) {
      if (evt) {
        evt.preventDefault();
      }

      this.isBusy = true;

      Base.call('password/confirm', {
        method: 'post',
        data: {
          password: this.password
        }
      }).then(() => {
        this.$router.push(this.next);
      }).catch(error => {
        if (error.response && error.response.status === env.HTTP_UNPROCESSABLE_ENTITY) {
          this.errors = error.response.data.errors;
        } else {
          Base.error(error, this.$root, error.message);
        }
      }).finally(() => {
        this.isBusy = false;
      });
    }
  }
};
</script>

<style scoped>

</style>
