<template>
  <div
    class="mb-4 flex flex-col-reverse items-start justify-between gap-2 sm:flex-row"
  >
    <div class="flex flex-col items-start gap-2">
      <div class="flex flex-row gap-2">
        <Tag
          v-if="!running"
          severity="info"
          :value="$t('rooms.streaming.no_running_meeting')"
        />
        <Tag
          v-else-if="!streamingEnabled"
          severity="warn"
          :value="$t('rooms.streaming.not_enabled_for_running_meeting')"
        />
        <Tag
          v-else-if="streamingState === 'queued'"
          severity="info"
          :value="$t('rooms.streaming.queued')"
        />
        <Tag
          v-else-if="streamingState === 'starting'"
          severity="success"
          :value="$t('rooms.streaming.starting')"
        />
        <Tag
          v-else-if="streamingState === 'running'"
          severity="success"
          :value="$t('rooms.streaming.running')"
        />

        <Tag
          v-else-if="streamingState === 'pausing'"
          severity="warning"
          :value="$t('rooms.streaming.pausing')"
        />
        <Tag
          v-else-if="streamingState === 'paused'"
          severity="warning"
          :value="$t('rooms.streaming.paused')"
        />

        <Tag
          v-else-if="streamingState === 'resuming'"
          severity="success"
          :value="$t('rooms.streaming.resuming')"
        />
        <Tag
          v-else-if="streamingState === 'stopping'"
          severity="info"
          :value="$t('rooms.streaming.stopping')"
        />
        <Tag
          v-else-if="streamingState === 'stopped'"
          severity="info"
          :value="$t('rooms.streaming.stopped')"
        />
        <Tag
          v-else-if="streamingState === 'failed'"
          severity="danger"
          :value="$t('rooms.streaming.failed')"
        />

        <Tag
          severity="info"
          v-if="fps && settingsStore.getSetting('streaming.show_fps')"
          >{{ $t("rooms.streaming.fps", { fps }) }}</Tag
        >
      </div>

      <div
        class="flex flex-row flex-wrap gap-2"
        v-if="userPermissions.can('manageSettings', props.room)"
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
                running
              )
            "
            severity="success"
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
              !running
            "
            severity="danger"
            @click="streamingCommand('stop')"
          />
        </ButtonGroup>
        <ButtonGroup>
          <Button
            :label="$t('rooms.streaming.pause')"
            icon="fa-solid fa-pause"
            :disabled="streamingState !== 'running' || !running"
            severity="warn"
            @click="streamingCommand('pause')"
          />
          <Button
            :label="$t('rooms.streaming.resume')"
            icon="fa-solid fa-play"
            :disabled="streamingState !== 'paused' || !running"
            severity="success"
            @click="streamingCommand('resume')"
          />
        </ButtonGroup>
      </div>
    </div>
    <div class="flex gap-2 self-end sm:self-start">
      <RoomTabStreamingConfigButton :room="props.room" />
      <Button
        severity="secondary"
        icon="fa-solid fa-sync"
        v-tooltip="$t('app.reload')"
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

const streamingState = ref("stopped");
const streamingEnabled = ref(false);
const fps = ref(0);

const api = useApi();
const settingsStore = useSettingsStore();
const userPermissions = useUserPermissions();

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
      console.log(error.response.status);
      if (error.response.status === env.HTTP_ROOM_NOT_RUNNING) {
        emit("settingsChanged");
      }
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
</script>
