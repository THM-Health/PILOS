<template>
  <!-- button -->
  <Button
    v-tooltip="$t('rooms.tokens.copy')"
    :disabled="disabled"
    icon="fa-solid fa-link"
    :aria-label="$t('rooms.tokens.copy')"
    data-test="room-personalized-links-copy-button"
    @click="copyLink"
  />
</template>

<script setup>
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useSettingsStore } from "../stores/settings.js";

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const toast = useToast();
const { t } = useI18n();
const router = useRouter();
const settingsStore = useSettingsStore();

/**
 * Copies the room link for the personalized token to the users' clipboard.
 */
function copyLink() {
  const link =
    settingsStore.getSetting("general.base_url") +
    router.resolve({
      name: "rooms.view",
      params: { id: props.roomId, token: props.token },
    }).href;
  navigator.clipboard.writeText(link);
  toast.info(
    t("rooms.tokens.room_link_copied", {
      firstname: props.firstname,
      lastname: props.lastname,
    }),
  );
}
</script>
