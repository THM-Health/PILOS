<template>
  <Button
    v-if="notificationSupport && !running"
    v-tooltip="
      notificationEnabled
        ? $t('rooms.notification.disable')
        : $t('rooms.notification.enable')
    "
    :severity="notificationEnabled ? 'contrast' : 'secondary'"
    icon="fa-solid fa-bell"
    :aria-label="
      notificationEnabled
        ? $t('rooms.notification.disable')
        : $t('rooms.notification.enable')
    "
    data-test="room-notification-button"
    @click="notificationEnabled ? disableNotification() : enableNotification()"
  />
</template>

<script setup>
import { useToast } from "../composables/useToast.js";
import { useI18n } from "vue-i18n";
import { onMounted, ref, watch } from "vue";
import { useSettingsStore } from "../stores/settings.js";
import notificationSound from "../../audio/notification.mp3";

const props = defineProps({
  roomName: {
    type: String,
    required: true,
  },
  running: {
    type: Boolean,
    required: true,
  },
});

const toast = useToast();
const { t, d } = useI18n();

const notificationSupport = ref(false);
const notificationEnabled = ref(false);
const notification = ref(null);

const settingsStore = useSettingsStore();

watch(
  () => props.running,
  (running, wasRunning) => {
    if (notificationEnabled.value) {
      if (wasRunning === false && running === true) {
        clearNotification();
        sendNotification();
      }
      if (wasRunning === true && running === false) {
        clearNotification();
      }
    }
  },
);

onMounted(() => {
  if (!("Notification" in window)) {
    noSupportHandler();
  } else if (
    Notification.permission === "granted" ||
    Notification.permission === "denied"
  ) {
    notificationSupport.value = true;
  } else {
    try {
      const testNotification = new Notification("");
      testNotification.close();
      notificationSupport.value = true;
    } catch (e) {
      if (e.name === "TypeError") {
        noSupportHandler();
      }
    }
  }
});

const clearNotification = () => {
  if (notification.value != null) {
    notification.value.close();
    notification.value = null;
  }
};

const noSupportHandler = (showToast = false) => {
  notificationEnabled.value = false;
  notificationSupport.value = false;
  if (showToast) {
    toast.error(t("rooms.notification.browser_support"));
  }
};

const sendNotification = () => {
  const options = {
    body: t("rooms.notification.body", { time: d(new Date(), "time") }),
    icon: settingsStore.getSetting("theme.favicon"),
  };
  try {
    notification.value = new Notification(props.roomName, options);
    notification.value.addEventListener("click", () => {
      window.focus();
      clearNotification();
    });

    const audio = new Audio(notificationSound);
    audio.play();
  } catch (e) {
    if (e.name === "TypeError") {
      noSupportHandler(true);
    }
  }
};

const enableNotification = () => {
  if (Notification.permission === "granted") {
    notificationEnabled.value = true;
    toast.info(t("rooms.notification.enabled"));
  } else if (Notification.permission === "denied") {
    notificationEnabled.value = false;
    toast.error(t("rooms.notification.denied"));
  } else {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        notificationEnabled.value = true;
        toast.info(t("rooms.notification.enabled"));
      } else {
        notificationEnabled.value = false;
        toast.error(t("rooms.notification.denied"));
      }
    });
  }
};

function disableNotification() {
  notificationEnabled.value = false;
  toast.info(t("rooms.notification.disabled"));
}
</script>
