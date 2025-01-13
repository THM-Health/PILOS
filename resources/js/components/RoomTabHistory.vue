<template>
  <div>
    <div
      class="flex flex-col items-start justify-between gap-2 px-2 lg:flex-row"
    >
      <div>
        <!-- Search field, currently not implemented -->
      </div>
      <div
        class="flex w-full grow flex-wrap items-start justify-between gap-2 lg:w-auto lg:grow-0"
      >
        <div class="flex gap-2">
          <InputGroup class="w-auto" data-test="sorting-type-inputgroup">
            <InputGroupAddon>
              <i class="fa-solid fa-sort"></i>
            </InputGroupAddon>
            <Select
              v-model="sortField"
              data-test="sorting-type-dropdown"
              :disabled="isBusy"
              :options="sortFields"
              option-label="name"
              option-value="value"
              :pt="{
                listContainer: {
                  'data-test': 'sorting-type-dropdown-items',
                },
                option: {
                  'data-test': 'sorting-type-dropdown-option',
                },
              }"
              @change="loadData(1)"
            />
            <InputGroupAddon class="p-0">
              <Button
                :disabled="isBusy"
                :icon="
                  sortOrder === 1
                    ? 'fa-solid fa-arrow-up-short-wide'
                    : 'fa-solid fa-arrow-down-wide-short'
                "
                severity="secondary"
                text
                class="rounded-l-none"
                @click="toggleSortOrder"
              />
            </InputGroupAddon>
          </InputGroup>
        </div>
        <!-- Reload -->
        <Button
          v-tooltip="$t('app.reload')"
          class="shrink-0"
          :aria-label="$t('app.reload')"
          severity="secondary"
          :disabled="isBusy"
          icon="fa-solid fa-sync"
          data-test="room-history-reload-button"
          @click="loadData()"
        />
      </div>
    </div>

    <!-- List of all meetings -->
    <OverlayComponent :show="isBusy || loadingError" :z-index="1">
      <template #overlay>
        <LoadingRetryButton :error="loadingError" @reload="loadData()" />
      </template>
      <DataView
        :total-records="paginator.getTotalRecords()"
        :rows="paginator.getRows()"
        :first="paginator.getFirst()"
        :value="meetings"
        lazy
        data-key="id"
        paginator
        :paginator-template="paginator.getTemplate()"
        :current-page-report-template="paginator.getCurrentPageReportTemplate()"
        row-hover
        class="mt-6"
        :pt="{
          pcPaginator: {
            page: {
              'data-test': 'paginator-page',
            },
            next: {
              'data-test': 'paginator-next-button',
            },
          },
        }"
        @update:first="paginator.setFirst($event)"
        @page="onPage"
      >
        <!-- Show message on empty list -->
        <template #empty>
          <div class="px-2">
            <InlineNote v-if="!isBusy && !loadingError">{{
              $t("meetings.no_historical_data")
            }}</InlineNote>
          </div>
        </template>

        <template #list="slotProps">
          <div class="px-2">
            <div v-for="item in slotProps.items" :key="item.id">
              <div
                data-test="room-history-item"
                class="flex flex-col justify-between gap-4 border-t py-4 border-surface md:flex-row"
              >
                <div class="flex flex-col gap-2">
                  <p class="m-0 text-lg font-semibold">
                    {{ $d(new Date(item.start), "datetimeShort") }}
                  </p>
                  <div class="flex flex-col items-start gap-2">
                    <div class="flex flex-row gap-2">
                      <i class="fa-solid fa-hourglass" />
                      <p
                        v-tooltip.bottom="
                          $d(new Date(item.start), 'datetimeShort') +
                          ' - ' +
                          (item.end == null
                            ? $t('meetings.now')
                            : $d(new Date(item.end), 'datetimeShort'))
                        "
                        class="m-0 text-sm"
                      >
                        {{
                          dateDiff.format(
                            new Date(item.start),
                            item.end == null ? new Date() : new Date(item.end),
                          )
                        }}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  class="flex shrink-0 flex-row items-start justify-end gap-1"
                >
                  <RoomTabHistoryStatisticButton
                    v-if="item.statistical"
                    :room-id="props.room.id"
                    :meeting-id="item.id"
                    :start="item.start"
                    :end="item.end"
                    :room-name="props.room.name"
                    @feature-disabled="loadData()"
                    @not-found="loadData()"
                  />
                  <RoomTabHistoryAttendanceButton
                    v-if="item.attendance && item.end != null"
                    :room-id="props.room.id"
                    :meeting-id="item.id"
                    :start="item.start"
                    :end="item.end"
                    :room-name="props.room.name"
                    @not-found="loadData()"
                    @not-ended="loadData()"
                    @attendance-disabled="loadData()"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </DataView>
    </OverlayComponent>

    <Message
      id="retentionPeriodInfo"
      class="mt-2"
      severity="secondary"
      aria-live="off"
      role="presentation"
      :pt="{
        content: {
          'data-test': 'retention-period-message',
        },
      }"
    >
      <div class="font-normal leading-3">
        <p class="text-xl font-semibold">
          {{ $t("meetings.retention_period") }}
        </p>
        <br />
        <span
          v-if="
            settingsStore.getSetting('recording.meeting_usage_enabled') &&
            settingsStore.getSetting(
              'recording.meeting_usage_retention_period',
            ) !== -1
          "
          >{{
            $t("meetings.stats.retention_period", {
              days: settingsStore.getSetting(
                "recording.meeting_usage_retention_period",
              ),
            })
          }}</span
        ><br />
        <span
          v-if="
            settingsStore.getSetting('recording.meeting_usage_enabled') &&
            settingsStore.getSetting(
              'recording.meeting_usage_retention_period',
            ) === -1
          "
          >{{ $t("meetings.stats.retention_period_unlimited") }}</span
        ><br />

        <span
          v-if="
            settingsStore.getSetting(
              'recording.attendance_retention_period',
            ) !== -1
          "
          >{{
            $t("meetings.attendance.retention_period", {
              days: settingsStore.getSetting(
                "recording.attendance_retention_period",
              ),
            })
          }}</span
        ><br />
        <span
          v-if="
            settingsStore.getSetting(
              'recording.attendance_retention_period',
            ) === -1
          "
          >{{ $t("meetings.attendance.retention_period_unlimited") }}</span
        ><br />
      </div>
    </Message>
  </div>
</template>

<script setup>
import { useSettingsStore } from "../stores/settings";
import { useApi } from "../composables/useApi.js";
import { computed, onMounted, ref } from "vue";
import { useDateDiff } from "../composables/useDateDiff.js";
import { useI18n } from "vue-i18n";
import { usePaginator } from "../composables/usePaginator.js";

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
});

const api = useApi();
const settingsStore = useSettingsStore();
const dateDiff = useDateDiff();
const { t } = useI18n();
const paginator = usePaginator();

const meetings = ref([]);
const isBusy = ref(false);
const loadingError = ref(false);
const sortField = ref("start");
const sortOrder = ref(0);

const sortFields = computed(() => [
  { name: t("meetings.start"), value: "start" },
]);

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 1 ? 0 : 1;
  loadData(1);
};

/**
 * Loads the current and previous meetings of a given room
 */
function loadData(page = null) {
  isBusy.value = true;
  loadingError.value = false;

  const config = {
    params: {
      page: page || paginator.getCurrentPage(),
      sort_by: sortField.value,
      sort_direction: sortOrder.value === 1 ? "asc" : "desc",
    },
  };

  api
    .call("rooms/" + props.room.id + "/meetings", config)
    .then((response) => {
      meetings.value = response.data.data;
      paginator.updateMeta(response.data.meta).then(() => {
        if (paginator.isOutOfRange()) {
          loadData(paginator.getLastPage());
        }
      });
    })
    .catch((error) => {
      paginator.revertFirst();
      api.error(error, { redirectOnUnauthenticated: false });
      loadingError.value = true;
    })
    .finally(() => {
      isBusy.value = false;
    });
}

function onPage(event) {
  loadData(event.page + 1);
}

onMounted(() => {
  loadData();
});
</script>
<style scoped></style>
