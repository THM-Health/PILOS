<template>
  <div>
    <div class="flex flex-col-reverse justify-between gap-2 px-2 lg:flex-row">
      <div class="flex grow flex-col justify-between gap-2 lg:flex-row">
        <div>
          <InputGroup data-test="room-recordings-search">
            <InputText
              v-model="search"
              :disabled="isBusy"
              :placeholder="$t('app.search')"
              @keyup.enter="loadData(1)"
            />
            <Button
              v-tooltip="$t('app.search')"
              :disabled="isBusy"
              :aria-label="$t('app.search')"
              icon="fa-solid fa-magnifying-glass"
              @click="loadData(1)"
            />
          </InputGroup>
        </div>
        <div class="flex flex-col gap-2 lg:flex-row">
          <InputGroup v-if="userPermissions.can('manageSettings', props.room)">
            <InputGroupAddon>
              <i class="fa-solid fa-filter"></i>
            </InputGroupAddon>
            <Select
              v-model="filter"
              :disabled="isBusy"
              :options="filterOptions"
              option-label="name"
              option-value="value"
              data-test="filter-dropdown"
              :pt="{
                listContainer: {
                  'data-test': 'filter-dropdown-items',
                },
                option: {
                  'data-test': 'filter-dropdown-option',
                },
              }"
              @change="loadData(1)"
            />
          </InputGroup>

          <InputGroup data-test="sorting-type-inputgroup">
            <InputGroupAddon>
              <i class="fa-solid fa-sort"></i>
            </InputGroupAddon>
            <Select
              v-model="sortField"
              :disabled="isBusy"
              :options="sortFields"
              option-label="name"
              option-value="value"
              data-test="sorting-type-dropdown"
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
      </div>
      <div class="flex justify-end gap-2">
        <!-- Reload list -->
        <Button
          v-tooltip="$t('app.reload')"
          data-test="room-recordings-reload-button"
          class="shrink-0"
          :aria-label="$t('app.reload')"
          severity="secondary"
          :disabled="isBusy"
          icon="fa-solid fa-sync"
          @click="loadData()"
        />
      </div>
    </div>

    <OverlayComponent :show="isBusy || loadingError" :z-index="1">
      <template #overlay>
        <LoadingRetryButton :error="loadingError" @reload="loadData()" />
      </template>

      <!-- Display recordings -->
      <DataView
        :total-records="paginator.getTotalRecords()"
        :rows="paginator.getRows()"
        :first="paginator.getFirst()"
        :value="recordings"
        lazy
        data-key="id"
        paginator
        :paginator-template="paginator.getTemplate()"
        :current-page-report-template="paginator.getCurrentPageReportTemplate()"
        :loading="isBusy"
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
        <!-- Show message on empty recording list -->
        <template #empty>
          <div>
            <div v-if="!isBusy && !loadingError" class="px-2">
              <InlineNote v-if="paginator.isEmptyUnfiltered()">{{
                $t("rooms.recordings.nodata")
              }}</InlineNote>
              <InlineNote v-else>{{ $t("app.filter_no_results") }}</InlineNote>
            </div>
          </div>
        </template>

        <template #list="slotProps">
          <div class="px-2">
            <div v-for="item in slotProps.items" :key="item.id">
              <div
                data-test="room-recording-item"
                class="flex flex-col justify-between gap-4 border-t py-4 border-surface md:flex-row"
              >
                <div class="flex flex-col gap-2">
                  <p class="m-0 text-lg font-semibold">
                    {{ item.description }}
                  </p>
                  <div class="flex flex-col items-start gap-2">
                    <div class="flex flex-row gap-2">
                      <i class="fa-solid fa-clock" />
                      <p class="m-0 text-sm">
                        {{ $d(new Date(item.start), "datetimeShort") }}
                      </p>
                    </div>
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
                            new Date(item.end),
                          )
                        }}
                      </p>
                    </div>
                    <div
                      v-if="userPermissions.can('manageSettings', props.room)"
                      class="flex flex-row gap-2"
                    >
                      <i class="fa-solid fa-lock"></i>
                      <RoomRecordingAccessBadge :access="item.access" />
                    </div>
                  </div>
                  <div
                    v-if="userPermissions.can('manageSettings', props.room)"
                    class="flex flex-row flex-wrap gap-1"
                  >
                    <Tag
                      v-for="format in item.formats"
                      :key="format.id"
                      :value="
                        $t('rooms.recordings.format_types.' + format.format)
                      "
                      :icon="format.disabled ? 'fa-solid fa-eye-slash' : ''"
                      :data-test="
                        format.disabled
                          ? 'recording-format-disabled'
                          : 'recording-format-enabled'
                      "
                    />
                  </div>
                </div>
                <div
                  class="flex shrink-0 flex-row items-start justify-end gap-1"
                >
                  <RoomTabRecordingsViewButton
                    :room-id="props.room.id"
                    :recording-id="item.id"
                    :formats="item.formats"
                    :hide-disabled-formats="
                      !userPermissions.can('manageSettings', room)
                    "
                    :token="props.token"
                    :start="item.start"
                    :end="item.end"
                    :description="item.description"
                    :access-code="props.accessCode"
                    :disabled="isBusy"
                    @invalid-code="$emit('invalidCode')"
                    @invalid-token="$emit('invalidToken')"
                    @not-found="loadData()"
                  />

                  <RoomTabRecordingsDownloadButton
                    v-if="userPermissions.can('manageSettings', props.room)"
                    :recording-id="item.id"
                    :disabled="isBusy"
                  />

                  <!-- Edit button -->
                  <RoomTabRecordingsEditButton
                    v-if="userPermissions.can('manageSettings', props.room)"
                    :room-id="props.room.id"
                    :recording-id="item.id"
                    :description="item.description"
                    :start="item.start"
                    :end="item.end"
                    :formats="item.formats"
                    :access="item.access"
                    :disabled="isBusy"
                    @edited="loadData()"
                    @not-found="loadData()"
                  />

                  <!-- Delete file -->
                  <RoomTabRecordingsDeleteButton
                    v-if="userPermissions.can('manageSettings', props.room)"
                    :room-id="props.room.id"
                    :recording-id="item.id"
                    :disabled="isBusy"
                    @deleted="loadData()"
                    @not-found="loadData()"
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
          {{ $t("rooms.recordings.retention_period.title") }}
        </p>
        <br />
        <span
          v-if="
            settingsStore.getSetting('recording.recording_retention_period') !==
            -1
          "
          >{{
            $t("rooms.recordings.retention_period.days", {
              days: settingsStore.getSetting(
                "recording.recording_retention_period",
              ),
            })
          }}</span
        ><br />
        <span
          v-if="
            settingsStore.getSetting('recording.recording_retention_period') ===
            -1
          "
          >{{ $t("rooms.recordings.retention_period.unlimited") }}</span
        ><br />
      </div>
    </Message>
  </div>
</template>
<script setup>
import { computed, onMounted, ref } from "vue";
import { useApi } from "../composables/useApi.js";
import { useUserPermissions } from "../composables/useUserPermission.js";
import RoomTabRecordingsDownloadButton from "./RoomTabRecordingsDownloadButton.vue";
import { useSettingsStore } from "../stores/settings.js";
import { usePaginator } from "../composables/usePaginator.js";
import { useDateDiff } from "../composables/useDateDiff.js";
import { useI18n } from "vue-i18n";
import env from "../env.js";
import { onRoomHasChanged } from "../composables/useRoomHelpers.js";

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
  accessCode: {
    type: Number,
    default: null,
  },
  token: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["invalidCode", "invalidToken"]);

const api = useApi();
const userPermissions = useUserPermissions();
const settingsStore = useSettingsStore();
const paginator = usePaginator();
const dateDiff = useDateDiff();
const { t } = useI18n();

const isBusy = ref(false);
const loadingError = ref(false);

const recordings = ref([]);
const sortField = ref("start");
const sortOrder = ref(0);

const search = ref("");
const filter = ref("all");

const sortFields = computed(() => [
  { name: t("rooms.recordings.sort.description"), value: "description" },
  { name: t("rooms.recordings.sort.start"), value: "start" },
]);

const filterOptions = computed(() => [
  { name: t("rooms.recordings.filter.all"), value: "all" },
  {
    name: t("rooms.recordings.filter.everyone_access"),
    value: "everyone_access",
  },
  {
    name: t("rooms.recordings.filter.participant_access"),
    value: "participant_access",
  },
  {
    name: t("rooms.recordings.filter.moderator_access"),
    value: "moderator_access",
  },
  { name: t("rooms.recordings.filter.owner_access"), value: "owner_access" },
]);

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 1 ? 0 : 1;
  loadData(1);
};

/**
 * reload recordings list from api
 */
function loadData(page = null) {
  // enable data loading indicator
  isBusy.value = true;
  loadingError.value = false;

  // make request to load recordings
  const config = {
    params: {
      page: page || paginator.getCurrentPage(),
      sort_by: sortField.value,
      sort_direction: sortOrder.value === 1 ? "asc" : "desc",
      search: search.value === "" ? null : search.value,
      filter: filter.value === "all" ? null : filter.value,
    },
  };

  if (props.token) {
    config.headers = { Token: props.token };
  } else if (props.accessCode != null) {
    config.headers = { "Access-Code": props.accessCode };
  }

  api
    .call("rooms/" + props.room.id + "/recordings", config)
    .then((response) => {
      // fetching successful
      recordings.value = response.data.data;
      paginator.updateMeta(response.data.meta).then(() => {
        if (paginator.isOutOfRange()) {
          loadData(paginator.getLastPage());
        }
      });
    })
    .catch((error) => {
      if (error.response) {
        // Access code invalid
        if (
          error.response.status === env.HTTP_UNAUTHORIZED &&
          error.response.data.message === "invalid_code"
        ) {
          return emit("invalidCode");
        }

        // Room token is invalid
        if (
          error.response.status === env.HTTP_UNAUTHORIZED &&
          error.response.data.message === "invalid_token"
        ) {
          return emit("invalidToken");
        }

        // Forbidden, require access code
        if (
          error.response.status === env.HTTP_FORBIDDEN &&
          error.response.data.message === "require_code"
        ) {
          return emit("invalidCode");
        }
      }
      loadingError.value = true;
      paginator.revertFirst();
      api.error(error, { redirectOnUnauthenticated: false });
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

onRoomHasChanged(
  () => props.room,
  () => loadData(),
);
</script>
