<template>
  <footer class="footer">
    <b-container class="border-top bg-white" v-if="settings('legal_notice_url') || settings('privacy_policy_url')" fluid>
      <b-row align-h="center" align-v="center" ref="url_footer">
        <a :href="settings('legal_notice_url')" v-if="settings('legal_notice_url')">
          <small>{{$t('app.footer.legal_notice')}}</small>
        </a>

        <div class="mx-2" v-if="settings('legal_notice_url') && settings('privacy_policy_url')"><small><raw-text>|</raw-text></small></div>

        <a :href="settings('privacy_policy_url')" v-if="settings('privacy_policy_url')">
          <small>{{$t('app.footer.privacy_policy')}}</small>
        </a>
      </b-row>
    </b-container>
  </footer>
</template>
<script>
import { mapGetters } from 'vuex';
import RawText from './RawText.vue';
export default {
  components: { RawText },
  computed: {
    ...mapGetters({
      settings: 'session/settings'
    })
  }
};
</script>
