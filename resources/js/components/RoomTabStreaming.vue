<template>
  <div
    class="mb-4 flex flex-col-reverse items-start justify-between gap-2 sm:flex-row"
  >
    <div class="flex flex-col items-start gap-2">
      <div class="flex flex-row gap-2">
        <Tag
          v-if="streamingStatus != null"
          data-test="streaming-status"
          :severity="streamingStatus.severity"
          :value="streamingStatus.label"
        />

        <Tag
          v-if="fps && settingsStore.getSetting('streaming.show_fps')"
          data-test="streaming-fps-counter"
          severity="info"
          >{{ $t("rooms.streaming.fps", { fps }) }}</Tag
        >
      </div>

      <div
        v-if="userPermissions.can('manageSettings', props.room)"
        class="flex flex-row flex-wrap gap-2"
      >
        <ButtonGroup>
          <Button
            :label="$t('rooms.streaming.start')"
            icon="fa-solid fa-play"
            :disabled="
              !(
                (streamingState === null ||
                  streamingState === 'stopped' ||
                  streamingState === 'failed') &&
                running &&
                streamingEnabled
              )
            "
            severity="success"
            data-test="streaming-start-button"
            @click="streamingCommand('start')"
          />
          <Button
            :label="$t('rooms.streaming.stop')"
            icon="fa-solid fa-stop"
            :disabled="
              streamingState === null ||
              streamingState === 'starting' ||
              streamingState === 'stopping' ||
              streamingState === 'stopped' ||
              streamingState === 'failed' ||
              !running
            "
            severity="danger"
            data-test="streaming-stop-button"
            @click="streamingCommand('stop')"
          />
        </ButtonGroup>
        <ButtonGroup>
          <Button
            :label="$t('rooms.streaming.pause')"
            icon="fa-solid fa-pause"
            :disabled="streamingState !== 'running' || !running"
            severity="warn"
            data-test="streaming-pause-button"
            @click="streamingCommand('pause')"
          />
          <Button
            :label="$t('rooms.streaming.resume')"
            icon="fa-solid fa-play"
            :disabled="streamingState !== 'paused' || !running"
            severity="success"
            data-test="streaming-resume-button"
            @click="streamingCommand('resume')"
          />
        </ButtonGroup>
      </div>
    </div>
    <div class="flex gap-2 self-end sm:self-start">
      <RoomTabStreamingConfigButton :room="props.room" />
      <Button
        v-tooltip="$t('app.reload')"
        severity="secondary"
        icon="fa-solid fa-sync"
        :aria-label="$t('app.reload')"
        data-test="streaming-reload-button"
        @click="streamingCommand('status')"
      />
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useApi } from "../composables/useApi.js";
import RoomTabStreamingConfigButton from "./RoomTabStreamingConfigButton.vue";
import env from "../env.js";
import { useSettingsStore } from "../stores/settings.js";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { useI18n } from "vue-i18n";

const streamingState = ref("stopped");
const streamingEnabled = ref(false);
const fps = ref(0);

const api = useApi();
const settingsStore = useSettingsStore();
const userPermissions = useUserPermissions();
const { t } = useI18n();

const emit = defineEmits(["settingsChanged"]);

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
});

/**
 * Check if there is a running meeting for this room
 */
const running = computed(() => {
  return props.room.last_meeting != null && props.room.last_meeting.end == null;
});

async function streamingCommand(command) {
  let apiCommand;
  let apiMethod;

  switch (command) {
    case "start":
      apiCommand = "start";
      apiMethod = "POST";
      break;
    case "stop":
      apiCommand = "stop";
      apiMethod = "POST";
      break;
    case "pause":
      apiCommand = "pause";
      apiMethod = "POST";
      break;
    case "resume":
      apiCommand = "resume";
      apiMethod = "POST";
      break;
    case "status":
      apiCommand = "status";
      apiMethod = "GET";
      break;
    default:
      console.error("Unknown streaming command: " + command);
      return;
  }

  return api
    .call("rooms/" + props.room.id + "/streaming/" + apiCommand, {
      method: apiMethod,
    })
    .then((response) => {
      streamingState.value = response.data.data.status;
      fps.value = response.data.data.fps;
      streamingEnabled.value = response.data.data.enabled_for_current_meeting;
    })
    .catch((error) => {
      if (error.response.status === env.HTTP_PRECONDITION_FAILED) {
        emit("settingsChanged");
        streamingCommand("status");
      }
      if (error.response.status === env.HTTP_ROOM_NOT_RUNNING) {
        emit("settingsChanged");
      }
      api.error(error);
    })
    .finally(() => {
      autoReload();
    });
}

const reloadTimeout = ref(null);

// Call reload on mounted every 5 seconds
onMounted(() => {
  streamingCommand("status");
});

function autoReload() {
  if (reloadTimeout.value) {
    clearTimeout(reloadTimeout.value);
  }
  reloadTimeout.value = setTimeout(
    () => streamingCommand("status"),
    settingsStore.getSetting("streaming.refresh_interval") * 1000,
  );
}

// Stop the timeout when the component is unmounted
onUnmounted(() => {
  clearTimeout(reloadTimeout.value);
  reloadTimeout.value = null;
});

watch(running, () => {
  streamingCommand("status");
});

const streamingStatus = computed(() => {
  if (!running.value) {
    return {
      severity: "info",
      label: t("rooms.streaming.no_running_meeting"),
    };
  }

  if (!streamingEnabled.value) {
    return {
      severity: "warn",
      label: t("rooms.streaming.not_enabled_for_running_meeting"),
    };
  }

  switch (streamingState.value) {
    case "queued":
      return {
        severity: "info",
        label: t("rooms.streaming.queued"),
      };
    case "starting":
      return {
        severity: "success",
        label: t("rooms.streaming.starting"),
      };
    case "running":
      return {
        severity: "success",
        label: t("rooms.streaming.running"),
      };
    case "pausing":
      return {
        severity: "warning",
        label: t("rooms.streaming.pausing"),
      };
    case "paused":
      return {
        severity: "warning",
        label: t("rooms.streaming.paused"),
      };
    case "resuming":
      return {
        severity: "success",
        label: t("rooms.streaming.resuming"),
      };
    case "stopping":
      return {
        severity: "info",
        label: t("rooms.streaming.stopping"),
      };
    case "stopped":
      return {
        severity: "info",
        label: t("rooms.streaming.stopped"),
      };
    case "failed":
      return {
        severity: "danger",
        label: t("rooms.streaming.failed"),
      };
    default:
      return null;
  }
});
</script>
