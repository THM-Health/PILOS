<template>
  <footer>
    <div
      v-if="getSetting('legal_notice_url') || getSetting('privacy_policy_url') || getSetting('version') || !getSetting('whitelabel')"
      ref="footer_container"
      class="border-top-1 border-200 bg-white p-2"
    >
      <div class="container">
        <div class="flex justify-content-between flex-column sm:flex-row text-center sm:text-left">
          <div>
            <a
              v-if="getSetting('legal_notice_url')"
              :href="getSetting('legal_notice_url')"
              class="text-primary"
            >
              <small>{{ $t('app.footer.legal_notice') }}</small>
            </a>

            <div
              v-if="getSetting('legal_notice_url') && getSetting('privacy_policy_url')"
              class="mx-2 inline"
            >
              <small><raw-text>|</raw-text></small>
            </div>
            <a
              v-if="getSetting('privacy_policy_url')"
              :href="getSetting('privacy_policy_url')"
              class="text-primary"
            >
              <small>{{ $t('app.footer.privacy_policy') }}</small>
            </a>
          </div>
          <div>
            <small v-if="!getSetting('whitelabel')">
              <a
                class="text-primary"
                href="https://github.com/THM-Health/PILOS"
                target="_blank"
              ><raw-text>PILOS</raw-text></a>
            </small>
            <small v-if="getSetting('version')" class="ml-2">
              {{ $t('app.version') }} {{ getSetting('version') }}
            </small>
          </div>
        </div>
      </div>
    </div>
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
