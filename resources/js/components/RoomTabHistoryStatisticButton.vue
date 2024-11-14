<template>
  <Button
    v-tooltip="$t('meetings.view_meeting_stats')"
    :aria-label="$t('meetings.view_meeting_stats')"
    :disabled="disabled"
    icon="fa-solid fa-chart-line"
    @click="showModal"
  />

  <!-- edit user role modal -->
  <Dialog
    v-model:visible="modalVisible"
    modal
    :header="$t('meetings.stats.modal_title', { room: props.roomName })"
    :style="{ width: '1200px' }"
    :breakpoints="{ '1270px': '90vw' }"
    :draggable="false"
    :close-on-escape="!isLoadingAction"
    :dismissable-mask="!isLoadingAction"
    :closable="!isLoadingAction"
  >
    <template #header>
      <div>
        <span class="p-dialog-title">
          {{ $t("meetings.stats.modal_title", { room: props.roomName }) }}
        </span>
        <br />
        <small
          >{{ $d(new Date(props.start), "datetimeShort") }}
          <raw-text>-</raw-text>
          {{
            props.end == null
              ? $t("meetings.now")
              : $d(new Date(props.end), "datetimeShort")
          }}</small
        >
      </div>
    </template>

    <InlineNote class="w-full">
      {{ $t("meetings.stats.no_breakout_support") }}
    </InlineNote>

    <OverlayComponent
      :show="isLoadingAction"
      style="min-height: 100px"
      class="mt-6"
    >
      <Chart
        v-if="!isLoadingAction"
        type="line"
        :data="chartData"
        :options="chartOptions"
        class="h-64 lg:h-96 xl:h-[35rem]"
      />
    </OverlayComponent>
  </Dialog>
</template>
<script setup>
import { computed, ref } from "vue";
import { useApi } from "../composables/useApi.js";
import { useI18n } from "vue-i18n";
import "chartjs-adapter-date-fns";
import { useColors } from "../composables/useColors.js";
import { useCssVar } from "@vueuse/core";

const props = defineProps({
  roomId: {
    type: String,
    required: true,
  },
  meetingId: {
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
  roomName: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const modalVisible = ref(false);
const isLoadingAction = ref(false);
const chartDataRows = ref({
  participants: [],
  voices: [],
  videos: [],
});

const api = useApi();
const { t, d } = useI18n();
const colors = useColors();

function showModal() {
  modalVisible.value = true;
  loadData();
}

function loadData() {
  isLoadingAction.value = true;

  api
    .call("meetings/" + props.meetingId + "/stats")
    .then((response) => {
      // parse statistical data to format that can be used by the computed property chartData
      chartDataRows.value = {
        participants: [],
        voices: [],
        videos: [],
      };

      response.data.data.forEach((stat) => {
        const datetime = stat.created_at;
        chartDataRows.value.participants.push({
          x: datetime,
          y: stat.participant_count,
        });
        chartDataRows.value.voices.push({
          x: datetime,
          y: stat.voice_participant_count,
        });
        chartDataRows.value.videos.push({ x: datetime, y: stat.video_count });
      });
    })
    .catch((error) => {
      // error during stats loading
      api.error(error, { noRedirectOnUnauthenticated: true });
    })
    .finally(() => {
      // disable loading indicator
      isLoadingAction.value = false;
    });
}

const textColor = computed(() => {
  return useCssVar("--p-text-color").value;
});
const surfaceBorder = computed(() => {
  return useCssVar("--p-content-border-color").value;
});

// chart options for chart.js display of meeting statistics
const chartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: {
        type: "time",
        time: {
          round: true,
          unit: "minute",
          displayFormats: {
            second: "MMM YYYY",
          },
        },
        display: true,
        title: {
          display: true,
          text: t("meetings.stats.time"),
        },
        grid: {
          color: surfaceBorder.value,
        },
        ticks: {
          major: {
            enabled: true,
          },
          color: textColor.value,
          font: function (context) {
            if (context.tick && context.tick.major) {
              return {
                weight: "bold",
              };
            }
          },
          /**
           * Callback to set the ticks label of the x-axes
           * @param label the tick value in the internal data format of the associated scale
           * @param index the tick index in the ticks array
           * @param ticks the array containing all the tick objects
           * @return {string} Localised human-readable string with the timezone of the user
           */
          callback: (label, index, ticks) => {
            // get value of the current tick that is the unix timestamp chart-js parsed from the ISO 8601 datetime string
            return d(ticks[index].value, "time");
          },
        },
      },
      y: {
        title: {
          display: true,
          text: t("meetings.stats.amount"),
        },
        grid: {
          color: surfaceBorder.value,
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          /**
           * Callback to set the title of the tooltip (hover on datapoint)
           * @param data Array with charts x-y data of this datapoint
           * @return {string} Localised human-readable string with the timezone of the user
           */
          title: (data) => {
            // get x-coordinate of the first dataset (all have the same label) that is the unix timestamp
            return d(data[0].parsed.x, "datetimeShort");
          },
        },
      },
    },
  };
});

// chart datasets for chart.js display of meeting statistics
const chartData = computed(() => {
  return {
    datasets: [
      {
        label: t("meetings.stats.participants"),
        backgroundColor: colors.getColor("red"),
        borderColor: colors.getColor("red"),
        fill: false,
        cubicInterpolationMode: "monotone",
        data: chartDataRows.value.participants,
      },
      {
        label: t("meetings.stats.voices"),
        backgroundColor: colors.getColor("blue"),
        borderColor: colors.getColor("blue"),
        fill: false,
        cubicInterpolationMode: "monotone",
        data: chartDataRows.value.voices,
      },
      {
        label: t("meetings.stats.videos"),
        backgroundColor: colors.getColor("green"),
        borderColor: colors.getColor("green"),
        fill: false,
        cubicInterpolationMode: "monotone",
        data: chartDataRows.value.videos,
      },
    ],
  };
});
</script>
