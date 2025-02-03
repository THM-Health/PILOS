<template>
  <footer>
    <div
      v-if="
        settingsStore.getSetting('general.legal_notice_url') ||
        settingsStore.getSetting('general.privacy_policy_url') ||
        settingsStore.getSetting('general.version') ||
        !settingsStore.getSetting('general.whitelabel')
      "
      ref="footer_container"
      class="border-t bg-white p-2 border-surface dark:bg-surface-900"
      data-test="app-footer"
    >
      <div class="container">
        <div
          class="flex flex-col justify-between text-center sm:flex-row sm:text-left"
        >
          <div>
            <Button
              v-if="settingsStore.getSetting('general.legal_notice_url')"
              as="a"
              link
              :href="settingsStore.getSetting('general.legal_notice_url')"
              class="p-0 text-sm"
              data-test="legal-notice-button"
            >
              {{ $t("app.footer.legal_notice") }}
            </Button>

            <div
              v-if="
                settingsStore.getSetting('general.legal_notice_url') &&
                settingsStore.getSetting('general.privacy_policy_url')
              "
              class="mx-2 inline"
            >
              <raw-text>|</raw-text>
            </div>
            <Button
              v-if="settingsStore.getSetting('general.privacy_policy_url')"
              as="a"
              link
              rel="privacy-policy nofollow"
              :href="settingsStore.getSetting('general.privacy_policy_url')"
              class="p-0 text-sm"
              data-test="privacy-policy-button"
            >
              {{ $t("app.footer.privacy_policy") }}
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
              data-test="github-button"
              ><raw-text>PILOS</raw-text></Button
            >
            <span
              v-if="settingsStore.getSetting('general.version')"
              class="ml-2 text-sm"
              data-test="version"
            >
              {{ $t("app.version") }}
              {{ settingsStore.getSetting("general.version") }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
<script setup>
import RawText from "./RawText.vue";
import { useSettingsStore } from "../stores/settings";

const settingsStore = useSettingsStore();
</script>
