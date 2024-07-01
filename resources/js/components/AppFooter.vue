<template>
  <footer>
    <div
      v-if="settingsStore.getSetting('legal_notice_url') || settingsStore.getSetting('privacy_policy_url') || settingsStore.getSetting('version') || !settingsStore.getSetting('whitelabel')"
      ref="footer_container"
      class="border-t border-surface-300 dark:border-surface-500 bg-white p-2"
    >
      <div class="container">
        <div class="flex justify-between flex-col sm:flex-row text-center sm:text-left">
          <div>
            <a
              v-if="settingsStore.getSetting('legal_notice_url')"
              :href="settingsStore.getSetting('legal_notice_url')"
              class="link-color link"
            >
              <small>{{ $t('app.footer.legal_notice') }}</small>
            </a>

            <div
              v-if="settingsStore.getSetting('legal_notice_url') && settingsStore.getSetting('privacy_policy_url')"
              class="mx-2 inline"
            >
              <small><raw-text>|</raw-text></small>
            </div>
            <a
              rel="privacy-policy nofollow"
              v-if="settingsStore.getSetting('privacy_policy_url')"
              :href="settingsStore.getSetting('privacy_policy_url')"
              class="link-color link"
            >
              <small>{{ $t('app.footer.privacy_policy') }}</small>
            </a>
          </div>
          <div>
            <small v-if="!settingsStore.getSetting('whitelabel')">
              <a
                class="link-color link"
                href="https://github.com/THM-Health/PILOS"
                target="_blank"
              ><raw-text>PILOS</raw-text></a>
            </small>
            <small v-if="settingsStore.getSetting('version')" class="ml-2">
              {{ $t('app.version') }} {{ settingsStore.getSetting('version') }}
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
