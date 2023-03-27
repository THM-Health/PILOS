<template>
  <footer class="footer">
    <b-container ref="footer_container" class="border-top bg-white" fluid v-if="getSetting('legal_notice_url') || getSetting('privacy_policy_url') || getSetting('version')">
      <b-container>
      <div class="d-flex justify-content-between">
        <div>
          <a :href="getSetting('legal_notice_url')" v-if="getSetting('legal_notice_url')" class="d-inline">
            <small>{{$t('app.footer.legal_notice')}}</small>
          </a>

          <div class="mx-2 d-inline" v-if="getSetting('legal_notice_url') && getSetting('privacy_policy_url')"><small><raw-text>|</raw-text></small></div>
          <a :href="getSetting('privacy_policy_url')" v-if="getSetting('privacy_policy_url')" class="d-inline">
            <small>{{$t('app.footer.privacy_policy')}}</small>
          </a>
        </div>
        <small v-if="getSetting('version')">
          {{$t('app.version')}} {{getSetting('version')}}
        </small>
      </div>
    </b-container>
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
