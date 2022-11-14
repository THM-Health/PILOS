<template>
  <b-container class="mt-3 mb-5">
    <b-card class="p-3 border bg-white">
      <h3>
        {{ $t('app.verify_email.title') }}
      </h3>
      <hr>
      <div v-if="loading" class="text-center my-5">
        <b-spinner></b-spinner>
      </div>
      <div v-else >
        <div v-if="success">
          <b-alert variant="success" show><i class="fa-solid fa-envelope-circle-check"></i> {{ $t('app.verify_email.success') }}</b-alert>
        </div>
        <div v-else>
          <b-alert v-if="error === env.HTTP_TOO_MANY_REQUESTS" variant="danger" show><i class="fa-solid fa-triangle-exclamation"></i> {{ $t('app.verify_email.too_many') }}</b-alert>
          <b-alert v-else-if="error === env.HTTP_UNPROCESSABLE_ENTITY" variant="danger" show><i class="fa-solid fa-triangle-exclamation"></i> {{ $t('app.verify_email.invalid') }}</b-alert>
          <b-alert v-else  variant="danger" show><i class="fa-solid fa-triangle-exclamation"></i> {{ $t('app.verify_email.fail') }}</b-alert>
        </div>
      </div>
    </b-card>
  </b-container>
</template>

<script>
import Base from '../api/base';
import env from '../env';

export default {
  name: 'ConfirmEmailChange.vue',
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
      loading: true,
      success: true,
      error: null,
      env
    };
  },
  mounted () {
    this.verifyEmail();
  },
  methods: {
    verifyEmail () {
      this.loading = true;
      Base.call('email/verify', {
        method: 'POST',
        data: {
          email: this.email,
          token: this.token
        }
      })
        .then(response => {
          this.success = true;
        })
        .catch((error) => {
          if (error.response) {
            this.error = error.response.status;
          }
          this.success = false;
        }).finally(() => {
          this.loading = false;
        });
    }
  }
};
</script>
