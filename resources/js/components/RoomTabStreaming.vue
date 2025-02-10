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
        <Tag v-else severity="info" :value="streamingState" />

        <Tag v-if="streamingState === 'running' && fps">{{
          $t("rooms.streaming.stats", { fps, bitrate })
        }}</Tag>
      </div>

      <div class="flex flex-row flex-wrap gap-2">
        <ButtonGroup>
          <Button
            :label="$t('rooms.streaming.start')"
            icon="fa-solid fa-play"
            :disabled="streamingState !== 'stopped' || !running"
            severity="success"
            @click="startStream"
          />
          <Button
            :label="$t('rooms.streaming.stop')"
            icon="fa-solid fa-stop"
            :disabled="
              !(
                streamingState === 'running' ||
                streamingState === 'paused' ||
                streamingState === 'pausing' ||
                streamingState === 'resuming'
              ) || !running
            "
            severity="danger"
            @click="stopStream"
          />
        </ButtonGroup>
        <ButtonGroup>
          <Button
            :label="$t('rooms.streaming.pause')"
            icon="fa-solid fa-pause"
            :disabled="streamingState !== 'running' || !running"
            severity="warn"
            @click="pauseStream"
          />
          <Button
            :label="$t('rooms.streaming.resume')"
            icon="fa-solid fa-play"
            :disabled="streamingState !== 'paused' || !running"
            severity="success"
            @click="resumeStream"
          />
        </ButtonGroup>
      </div>
    </div>
    <div class="flex gap-2 self-end sm:self-start">
      <RoomTabStreamingConfigButton :room-id="props.room.id" />
      <Button severity="secondary" icon="fa-solid fa-rotate" @click="reload" />
    </div>
  </div>
</template>
<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useApi } from "../composables/useApi.js";
import RoomTabStreamingConfigButton from "./RoomTabStreamingConfigButton.vue";

const streamingState = ref("stopped");
const streamingEnabled = ref(false);
const fps = ref(0);
const bitrate = ref(0);

const api = useApi();

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

// queued
// starting
// running
// pausing
// paused
// resuming
// stopping
// stopped

function startStream() {
  api
    .call("rooms/" + props.room.id + "/streaming/start", {
      method: "POST",
    })
    .then((response) => {
      handleStreamingActionResponse(response);
    });
}

function stopStream() {
  api
    .call("rooms/" + props.room.id + "/streaming/stop", {
      method: "POST",
    })
    .then((response) => {
      handleStreamingActionResponse(response);
    });
}

function pauseStream() {
  api
    .call("rooms/" + props.room.id + "/streaming/pause", {
      method: "POST",
    })
    .then((response) => {
      handleStreamingActionResponse(response);
    });
}

function resumeStream() {
  api
    .call("rooms/" + props.room.id + "/streaming/resume", {
      method: "POST",
    })
    .then((response) => {
      handleStreamingActionResponse(response);
    });
}

function handleStreamingActionResponse(response) {
  streamingState.value = response.data.data.status;
  fps.value = response.data.data.fps;
  bitrate.value = response.data.data.bitrate;
}

function reload() {
  api.call("rooms/" + props.room.id + "/streaming/status").then((response) => {
    streamingState.value = response.data.data.status;
    fps.value = response.data.data.fps;
    bitrate.value = response.data.data.bitrate;
    streamingEnabled.value = response.data.data.enabled_for_current_meeting;
  });
}

const reloadInterval = ref(null);

// Call reload on mounted every 5 seconds
onMounted(() => {
  reload();
});

// Stop the interval when the component is unmounted
onUnmounted(() => {
  clearInterval(reloadInterval.value);
  reloadInterval.value = null;
});

watch(streamingState, () => {
  if (streamingState.value !== "stopped" && reloadInterval.value == null) {
    reloadInterval.value = setInterval(reload, 5000);
  }

  if (streamingState.value === "stopped" && reloadInterval.value != null) {
    clearInterval(reloadInterval.value);
    reloadInterval.value = null;
  }
});

watch(running, () => {
  reload();
});
</script>
