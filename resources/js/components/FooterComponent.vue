<template>
  <footer class="footer">
    <b-container class="border-top bg-white" v-if="!!settings('legal_notice_url') || !!settings('privacy_policy_url')" fluid>
      <b-row align-h="center" align-v="center">
        <a :href="settings('legal_notice_url')" v-if="!!settings('legal_notice_url')">
          <small>{{$t('app.footer.legalNotice')}}</small>
        </a>

        <a class="mr-2 ml-2" v-if="!!settings('legal_notice_url') && settings('privacy_policy_url')"><small>{{$t('app.footer.separator')}}</small></a>

        <a :href="settings('privacy_policy_url')" v-if="!!settings('privacy_policy_url')">
          <small>{{$t('app.footer.privacyPolicy')}}</small>
        </a>
      </b-row>
    </b-container>
  </footer>
</template>
<script>
import { mapGetters } from 'vuex';
export default {
  computed: {
    ...mapGetters({
      settings: 'session/settings'
    })
  }
};
</script>
