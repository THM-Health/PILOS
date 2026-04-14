<template>
  <Button
    v-tooltip="$t('rooms.recordings.view_recording')"
    :aria-label="$t('rooms.recordings.view_recording')"
    icon="fa-solid fa-eye"
    :disabled="props.disabled"
    data-test="room-recordings-view-button"
    @click="modalVisible = true"
  />

  <!-- view recording modal -->
  <Dialog
    v-model:visible="modalVisible"
    modal
    :style="{ width: '500px' }"
    :breakpoints="{ '575px': '90vw' }"
    :draggable="false"
    :dismissable-mask="false"
    data-test="room-recordings-view-dialog"
  >
    <template #header>
      <div>
        <span class="p-dialog-title">
          {{ props.description }}
        </span>
        <br />
        <small
          >{{ $d(new Date(props.start), "datetimeShort") }}
          <raw-text>-</raw-text>
          {{ $d(new Date(props.end), "datetimeShort") }}</small
        >
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          :label="$t('app.close')"
          severity="secondary"
          icon="fa-solid fa-times"
          data-test="dialog-close-button"
          @click="modalVisible = false"
        />
      </div>
    </template>

    <div class="flex flex-col gap-2">
      <!-- Hide disabled formats if disabled formats should be hidden -->
      <Button
        v-for="format in formats.filter(
          (format) => !(format.disabled && hideDisabledFormats),
        )"
        :key="format.format"
        icon="fa-solid fa-play"
        :label="$t('rooms.recordings.format_types.' + format.format)"
        :data-test="format.format + '-button'"
        target="_blank"
        rel="opener"
        :href="viewFormatUrl(format)"
        as="a"
      />
    </div>
  </Dialog>
</template>
<script setup>
import { ref } from "vue";

const props = defineProps({
  roomAuthToken: {
    type: Object,
    default: null,
  },
  roomId: {
    type: String,
    required: true,
  },
  recordingId: {
    type: String,
    required: true,
  },
  hideDisabledFormats: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    required: true,
  },
  start: {
    type: String,
    required: true,
  },
  end: {
    type: String,
    required: true,
  },
  formats: {
    type: Array,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const modalVisible = ref(false);

function viewFormatUrl(format) {
  const url = new URL(format.url);

  if (props.roomAuthToken) {
    url.searchParams.set("room_auth_token", props.roomAuthToken.id);
    url.searchParams.set("room_auth_token_type", props.roomAuthToken.type);
  }

  return url;
}
</script>
