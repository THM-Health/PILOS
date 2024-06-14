<template>
  <!-- If room is running, show join button -->
  <Button
    :label="$t('rooms.phone.join_by_phone')"
    icon="fa-solid fa-phone"
    severity="secondary"
    @click="toggle"
    class="flex-shrink-0"
  />
  <OverlayPanel ref="op" aria-labelledby="room-invitation-title">
    <div class="align-items-start flex min-w-min flex-col gap-3 p-2">
      <fieldset class="flex w-full flex-col gap-2">
        <legend
          id="room-invitation-title"
          class="white-space-nowrap block font-bold"
        >
          {{ $t("rooms.phone.title") }}
        </legend>
        <div class="flex-grow-1">
          <IconField iconPosition="left">
            <InputIcon>
              <i
                class="fa-solid fa-phone"
                v-tooltip="$t('rooms.phone.number')"
              />
            </InputIcon>
            <InputText
              class="text-overflow-ellipsis w-full border-0 shadow-none"
              id="invitationLink"
              :aria-label="$t('rooms.phone.number')"
              readonly
              :value="number"
            />
          </IconField>

          <IconField iconPosition="left">
            <InputIcon>
              <i class="fa-solid fa-lock" v-tooltip="$t('rooms.phone.pin')" />
            </InputIcon>
            <InputText
              class="w-full border-0 shadow-none"
              id="invitationCode"
              :aria-label="$t('rooms.phone.pin')"
              readonly
              :value="pin"
            />
          </IconField>
        </div>
      </fieldset>

      <div class="flex justify-center">
        <img :src="qrcode" :alt="$t('rooms.phone.qrcode')" />
      </div>

      <Button
        as="a"
        :href="link"
        class="p-button p-button-secondary"
        icon="fa-solid fa-phone"
        :label="$t('rooms.phone.call')"
      />
    </div>
  </OverlayPanel>
</template>
<script setup>
import { computed, ref } from "vue";
import { useQRCode } from "@vueuse/integrations/useQRCode";

const op = ref();
const toggle = (event) => {
  op.value.toggle(event);
};

const props = defineProps({
  number: {
    type: String,
    required: true,
  },
  pin: {
    type: Number,
    required: true,
  },
});

const link = computed(() => {
  // Remove all chars that are not digits or '+'
  const cleanNumber = props.number.replace(/[^0-9+]/g, "");
  return `tel:${cleanNumber},${props.pin}#`;
});
const qrcode = useQRCode(link);
</script>
