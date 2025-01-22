<template>
  <!-- View file -->
  <Button
    v-if="requireTermsOfUseAcceptance"
    v-tooltip="$t('rooms.files.view')"
    :aria-label="$t('rooms.files.view')"
    :disabled="disabled"
    target="_blank"
    data-test="room-files-view-button"
    icon="fa-solid fa-eye"
    @click="toggleTermsOfUseOverlay"
  />

  <Button
    v-else
    v-tooltip="$t('rooms.files.view')"
    :aria-label="$t('rooms.files.view')"
    :disabled="disabled"
    target="_blank"
    :href="downloadUrl"
    data-test="room-files-view-button"
    icon="fa-solid fa-eye"
    as="a"
  />

  <Popover
    ref="termsOfUseOverlay"
    class="max-w-96"
    data-test="terms-of-use-required-info"
  >
    <InlineNote severity="info">{{
      $t("rooms.files.terms_of_use.required")
    }}</InlineNote>
  </Popover>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { useApi } from "../composables/useApi.js";
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";
import { RoomGuestAuthenticationToken } from "../types/RoomGuestAuthenticationToken";

interface Props {
  requireTermsOfUseAcceptance?: boolean;
  token?: RoomGuestAuthenticationToken;
  disabled?: boolean;
  url: string;
}

const props = defineProps<Props>();

const api = useApi();
const toast = useToast();
const { t } = useI18n();

const loading = ref(false);
const termsOfUseOverlay = ref();

const downloadUrl = computed(() => {
  let url = props.url;
  if (props.token) {
    url += `&auth_token=${props.token.id}`;
  }
  return url;
});

const toggleTermsOfUseOverlay = (event) => {
  termsOfUseOverlay.value.toggle(event);
};
</script>
