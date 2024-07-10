<template>
  <footer>
    <div
      v-if="settingsStore.getSetting('general.legal_notice_url') || settingsStore.getSetting('general.privacy_policy_url') || settingsStore.getSetting('general.version') || !settingsStore.getSetting('general.whitelabel')"
      ref="footer_container"
      class="border-t border-surface bg-white dark:bg-surface-900 p-2"
    >
      <div class="container">
        <div class="flex justify-between flex-col sm:flex-row text-center sm:text-left">
          <div>
            <a
              v-if="settingsStore.getSetting('general.legal_notice_url')"
              :href="settingsStore.getSetting('general.legal_notice_url')"
              class="link-color link"
            >
              <small>{{ $t('app.footer.legal_notice') }}</small>
            </a>

            <div
              v-if="settingsStore.getSetting('general.legal_notice_url') && settingsStore.getSetting('general.privacy_policy_url')"
              class="mx-2 inline"
            >
              <small><raw-text>|</raw-text></small>
            </div>
            <a
              rel="privacy-policy nofollow"
              v-if="settingsStore.getSetting('general.privacy_policy_url')"
              :href="settingsStore.getSetting('general.privacy_policy_url')"
              class="link-color link"
            >
              <small>{{ $t('app.footer.privacy_policy') }}</small>
            </a>
          </div>
          <div>
            <small v-if="!settingsStore.getSetting('general.whitelabel')">
              <a
                class="link-color link"
                href="https://github.com/THM-Health/PILOS"
                target="_blank"
              ><raw-text>PILOS</raw-text></a>
            </small>
            <small v-if="settingsStore.getSetting('general.version')" class="ml-2">
              {{ $t('app.version') }} {{ settingsStore.getSetting('general.version') }}
            </small>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
<script setup>
import RawText from './RawText.vue';
import { useSettingsStore } from '../stores/settings';

const settingsStore = useSettingsStore();
</script>
