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
            <Button
              as="a"
              link
              v-if="settingsStore.getSetting('general.legal_notice_url')"
              :href="settingsStore.getSetting('general.legal_notice_url')"
              class="p-0 text-sm"
            >
              {{ $t('app.footer.legal_notice') }}
            </Button>

            <div
              v-if="settingsStore.getSetting('general.legal_notice_url') && settingsStore.getSetting('general.privacy_policy_url')"
              class="mx-2 inline"
            >
              <raw-text>|</raw-text>
            </div>
            <Button
              as="a"
              link
              rel="privacy-policy nofollow"
              v-if="settingsStore.getSetting('general.privacy_policy_url')"
              :href="settingsStore.getSetting('general.privacy_policy_url')"
              class="p-0 text-sm"
            >
             {{ $t('app.footer.privacy_policy') }}
            </Button>
          </div>
          <div>
            <Button
              v-if="!settingsStore.getSetting('general.whitelabel')"
              as="a"
              link
              class="p-0 text-sm"
              href="https://github.com/THM-Health/PILOS"
              target="_blank"
            ><raw-text>PILOS</raw-text></Button>
            <span v-if="settingsStore.getSetting('general.version')" class="ml-2 text-sm">
              {{ $t('app.version') }} {{ settingsStore.getSetting('general.version') }}
            </span>
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
