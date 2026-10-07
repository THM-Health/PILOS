<template>
  <Button
    data-test="room-join-by-phone-button"
    :label="$t('rooms.phone.join_by_phone')"
    icon="fa-solid fa-phone"
    severity="secondary"
    class="shrink-0"
    @click="toggle"
  />
  <OverlayPanel
    ref="op"
    data-test="room-join-by-phone-overlay"
    aria-labelledby="room-join-by-phone-title"
  >
    <div class="flex w-min max-w-full min-w-sm flex-col p-2">
      <div class="flex w-full justify-between gap-4">
        <h2
          id="room-join-by-phone-title"
          tabindex="-1"
          autofocus
          class="block font-bold whitespace-nowrap"
        >
          {{ $t("rooms.phone.title") }}
        </h2>
        <Button
          class="popover-close-button"
          data-test="popover-close-button"
          :aria-label="$t('app.close')"
          text
          rounded
          severity="secondary"
          icon="fas fa-xmark"
          @click="closePopover"
        />
      </div>
      <div class="grow">
        <div class="mt-2 flex flex-row items-center">
          <InputGroup>
            <InputGroupAddon
              class="min-w-5 border-none px-0 dark:bg-surface-900"
              aria-hidden="true"
            >
              <i
                v-tooltip="$t('rooms.phone.number')"
                class="fa-solid fa-phone"
              />
            </InputGroupAddon>
            <InputText
              id="phone-number"
              class="w-min border-none text-ellipsis shadow-none dark:bg-surface-900"
              :aria-label="$t('rooms.phone.number')"
              readonly
              :value="number"
              @focus="$event.target.select()"
            />
          </InputGroup>
        </div>

        <div class="mt-2 flex flex-row items-center">
          <InputGroup>
            <InputGroupAddon
              class="min-w-5 border-none px-0 dark:bg-surface-900"
              aria-hidden="true"
            >
              <i v-tooltip="$t('rooms.phone.pin')" class="fa-solid fa-lock" />
            </InputGroupAddon>
            <InputText
              id="phone-pin"
              class="w-full border-none shadow-none dark:bg-surface-900"
              :aria-label="$t('rooms.phone.pin')"
              readonly
              :value="pin"
              @focus="$event.target.select()"
            />
          </InputGroup>
        </div>

        <i>{{ $t("rooms.phone.note") }}</i>
      </div>
      <divider />

      <div class="flex flex-col items-center">
        <img
          :src="qrcode"
          data-test="join-by-phone-qr-code"
          :alt="$t('rooms.phone.qrcode')"
        />
        <p class="text-center">
          {{ $t("rooms.phone.scan_qr_code") }}
        </p>
      </div>

      <Button
        data-test="join-by-phone-call-button"
        as="a"
        :href="link"
        icon="fa-solid fa-phone"
        class="mt-4 w-full"
        :label="$t('rooms.phone.call')"
      />
    </div>
  </OverlayPanel>
</template>
<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useDark } from "@vueuse/core";
import QRCode from "qrcode";

const isDark = useDark();
const op = ref();
const triggerButton = ref(null);
const textColor = ref("#000");
const backgroundColor = ref("#FFF");
const qrcode = ref();

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

onMounted(() => {
  setColors();
});

const toggle = (event) => {
  triggerButton.value = event.currentTarget;
  op.value.toggle(event);
};

function closePopover() {
  op.value.hide();
  if (triggerButton.value != null) {
    triggerButton.value.focus();
  }
}

const link = computed(() => {
  // Remove all chars that are not digits or '+'
  const cleanNumber = props.number.replace(/[^0-9+]/g, "");
  return `tel:${cleanNumber},${props.pin}#`;
});

function setColors() {
  const style = getComputedStyle(document.body);
  textColor.value = style.getPropertyValue("--p-text-color");
  backgroundColor.value = style.getPropertyValue("--p-popover-background");
}

watch(
  [link, textColor, backgroundColor],
  async () => {
    qrcode.value = await QRCode.toDataURL(link.value, {
      color: {
        dark: textColor.value,
        light: backgroundColor.value,
      },
    });
  },
  { immediate: true },
);

watch(isDark, async () => {
  await nextTick();
  setColors();
});
</script>
