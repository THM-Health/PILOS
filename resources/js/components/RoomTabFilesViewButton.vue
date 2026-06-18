<template>
  <!-- View file -->

  <Button
    v-if="requireTermsOfUseAcceptance"
    v-tooltip="$t('rooms.files.view')"
    :aria-label="$t('rooms.files.view')"
    :disabled="disabled"
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
    icon="fa-solid fa-eye"
    data-test="room-files-view-button"
    :as="disabled ? 'button' : 'a'"
  />

  <Popover ref="op" class="max-w-96" data-test="terms-of-use-required-info">
    <div class="flex w-full justify-between gap-4">
    <InlineNote tabindex="-1" autofocus severity="info">{{
      $t("rooms.files.terms_of_use.required")
    }}</InlineNote>
      <Button
        class="popover-close-button"
        @click="closePopover"
        :aria-label="$t('app.close')"
        text
        rounded
        severity="secondary"
        icon="fas fa-xmark"
      />
    </div>
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

const op = ref();
const triggerButton = ref(null);

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
  triggerButton.value = event.target;
  op.value.toggle(event);
}

function closePopover() {
  op.value.hide();
  if (triggerButton.value != null) {
    triggerButton.value.focus();
  }
}
</script>
