<template>
  <footer id="footer" tabindex="-1" :aria-label="$t('app.aria.footer')">
    <div
      v-if="
        settingsStore.getSetting('general.legal_notice_url') ||
        settingsStore.getSetting('general.privacy_policy_url') ||
        settingsStore.getSetting('general.accessibility_statement_url') ||
        settingsStore.getSetting('general.version') ||
        !settingsStore.getSetting('general.whitelabel')
      "
      ref="footer_container"
      class="border-t border-surface bg-white p-2 dark:bg-surface-900"
      data-test="app-footer"
    >
      <div class="container">
        <div
          class="flex flex-col justify-between text-center sm:flex-row sm:text-left"
        >
          <ul class="horizontal-divider flex gap-2">
            <li v-if="settingsStore.getSetting('general.legal_notice_url')">
              <Button
                as="a"
                link
                :href="settingsStore.getSetting('general.legal_notice_url')"
                class="p-0 text-sm"
                data-test="legal-notice-button"
              >
                {{ $t("app.footer.legal_notice") }}
              </Button>
            </li>
            <li v-if="settingsStore.getSetting('general.privacy_policy_url')">
              <Button
                as="a"
                link
                rel="privacy-policy nofollow"
                :href="settingsStore.getSetting('general.privacy_policy_url')"
                class="p-0 text-sm"
                data-test="privacy-policy-button"
              >
                {{ $t("app.footer.privacy_policy") }}
              </Button>
            </li>
            <li
              v-if="
                settingsStore.getSetting('general.accessibility_statement_url')
              "
            >
              <Button
                as="a"
                link
                :href="
                  settingsStore.getSetting(
                    'general.accessibility_statement_url',
                  )
                "
                class="p-0 text-sm"
                data-test="accessibility-button"
              >
                {{ $t("app.footer.accessibility") }}
              </Button>
            </li>
          </ul>
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
