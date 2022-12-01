<template>
  <footer class="footer">
    <b-container class="border-top bg-white" v-if="getSetting('legal_notice_url') || getSetting('privacy_policy_url')" fluid>
      <b-row align-h="center" align-v="center" ref="url_footer">
        <a :href="getSetting('legal_notice_url')" v-if="getSetting('legal_notice_url')">
          <small>{{$t('app.footer.legal_notice')}}</small>
        </a>

        <div class="mx-2" v-if="getSetting('legal_notice_url') && getSetting('privacy_policy_url')"><small><raw-text>|</raw-text></small></div>

        <a :href="getSetting('privacy_policy_url')" v-if="getSetting('privacy_policy_url')">
          <small>{{$t('app.footer.privacy_policy')}}</small>
        </a>
      </b-row>
    </b-container>
  </footer>
</template>
<script>
import RawText from './RawText.vue';
import { mapState } from 'pinia';
import { useSettingsStore } from '../stores/settings';

export default {
  components: { RawText },
  computed: {
    ...mapState(useSettingsStore, ['getSetting'])
  }
};
</script>
