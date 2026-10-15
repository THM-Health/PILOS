<template>
  <Button
    ref="joinByPhoneButtonRef"
    data-test="room-join-by-phone-button"
    :label="$t('rooms.phone.join_by_phone')"
    icon="fa-solid fa-phone"
    severity="secondary"
    class="shrink-0"
    @click="showDrawer = true"
  />
  <Drawer
    v-model:visible="showDrawer"
    :position="isMobile ? 'bottom' : 'left'"
    data-test="room-join-by-phone-overlay"
    :header="$t('rooms.phone.title')"
    :aria-label="$t('rooms.phone.title')"
    block-scroll
    :class="{ 'h-auto! max-h-[90dvh]': isMobile }"
    @hide="closeDrawer"
  >
    <div class="flex flex-col">
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
  </Drawer>
</template>
<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { breakpointsTailwind, useBreakpoints, useDark } from "@vueuse/core";
import QRCode from "qrcode";

const isDark = useDark();

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.smaller("sm");

const textColor = ref("#000");
const backgroundColor = ref("#FFF");
const qrcode = ref();
const showDrawer = ref(false);
const joinByPhoneButtonRef = ref(null);

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

async function closeDrawer() {
  await nextTick();

  joinByPhoneButtonRef.value?.$el?.focus();
}

const link = computed(() => {
  // Remove all chars that are not digits or '+'
  const cleanNumber = props.number.replace(/[^0-9+]/g, "");
  return `tel:${cleanNumber},${props.pin}#`;
});

function setColors() {
  const style = getComputedStyle(document.body);
  textColor.value = style.getPropertyValue("--p-text-color");
  backgroundColor.value = style.getPropertyValue("--p-drawer-background");
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
