<template>
    <div class="container">
    <div class="row mt-4 mb-5">
      <div class="col-12 col-md-8 col-lg-6 offset-md-2 offset-lg-3">
        <b-card v-if="error" :header="$t('auth.error.login_failed')" bg-variant="white" header-bg-variant="danger" >

          <strong>{{ $t('auth.error.reason') }}</strong>
          <p v-if="error == 'missing_attributes'">{{ $t('auth.error.missing_attributes') }}</p>
          <p v-if="error == 'shibboleth_session_duplicate_exception'">{{ $t('auth.error.shibboleth_session_duplicate_exception') }}</p>

          <template #footer>
            <b-button variant="dark" block :to="{ name: 'home'}">
              {{ $t('app.home') }}
          </b-button>
          </template>
        </b-card>
      </div>
    </div>
  </div>
</template>

<script>
export default {

  props: {
    error: {
      type: String,
      default: null
    }
  },

  mounted () {
    if (!this.error) {
      this.toastSuccess(this.$t('auth.flash.login'));
      // check if user should be redirected back after login
      if (this.$route.query.redirect !== undefined) {
        this.$router.push(this.$route.query.redirect);
      } else {
        this.$router.push({ name: 'rooms.own_index' });
      }
    }
  }
};
</script>
