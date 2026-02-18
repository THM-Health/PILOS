<template>
  <!-- View file -->

  <Button
    v-if="requireTermsOfUseAcceptance"
    v-tooltip="$t('rooms.files.view')"
    :aria-label="$t('rooms.files.view')"
    :disabled="disabled"
    :loading="loading"
    icon="fa-solid fa-eye"
    data-test="room-files-view-button"
    @click="toggleTermsOfUsePopover"
  />

  <Button
    v-else
    v-tooltip="$t('rooms.files.view')"
    :aria-label="$t('rooms.files.view')"
    :disabled="disabled"
    target="_blank"
    rel="opener"
    :href="downloadUrl"
    :loading="loading"
    icon="fa-solid fa-eye"
    data-test="room-files-view-button"
    as="a"
  />

  <Popover ref="op" class="max-w-96" data-test="terms-of-use-required-info">
    <InlineNote severity="info">{{
      $t("rooms.files.terms_of_use.required")
    }}</InlineNote>
  </Popover>
</template>
<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  requireTermsOfUseAcceptance: {
    type: Boolean,
    required: false,
  },
  roomAuthToken: {
    type: Object,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
    required: false,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  roomId: {
    type: String,
    required: true,
  },
});

const loading = ref(false);
const op = ref();

const downloadUrl = computed(() => {
  let url = props.fileUrl;
  if (props.roomAuthToken) {
    url =
      url +
      "&room_auth_token=" +
      props.roomAuthToken.id +
      "&room_auth_token_type=" +
      props.roomAuthToken.type;
  }
  return url;
});

function toggleTermsOfUsePopover(event) {
  op.value.toggle(event);
}
</script>
