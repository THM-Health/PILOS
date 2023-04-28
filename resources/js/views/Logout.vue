<template>
  <div class="container">
    <div class="row mt-4 mb-5">
      <div class="col-12 col-md-8 col-lg-6 offset-md-2 offset-lg-3">
        <b-card :title="$t('auth.logout')" bg-variant="white">
          <b-alert variant="success" show>{{ $t('auth.logout_success') }}</b-alert>

          <b-alert variant="warning" v-if="incompleteWarning === 'oidc'" show>
            {{ $t('auth.oidc.logout_incomplete') }}
          </b-alert>
          <b-alert variant="warning" v-if="incompleteWarning === 'saml2'" show>
            {{ $t('auth.saml2.logout_incomplete') }}
          </b-alert>

          <template #footer>
            <b-button variant="success" block :to="{ name: 'home'}">
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
    incompleteWarning: {
      type: String,
      default: null
    }
  }
};
</script>

