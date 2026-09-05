<template>
  <div>
    <Message
      v-if="requireAgreement && files.length > 0"
      data-test="terms-of-use-message"
      severity="info"
      :closable="false"
      class="mx-2 mb-4"
      :pt="{
        text: 'w-full',
      }"
    >
      <Accordion
        :value="showTermsOfUse"
        expand-icon="fa-solid fa-plus"
        collapse-icon="fa-solid fa-minus"
        @update:value="showTermsOfUse = $event"
      >
        <AccordionPanel :value="true" class="border-0">
          <AccordionHeader class="bg-transparent p-0 pr-2 text-blue-600">
            {{ $t("rooms.files.terms_of_use.title") }}
          </AccordionHeader>
          <AccordionContent unstyled>
            <div
              class="mt-2 max-h-32 w-full overflow-y-auto whitespace-pre-wrap"
            >
              {{ settingsStore.getSetting("room.file_terms_of_use") }}
            </div>
            <Divider />
            <div class="mb-2 flex items-center">
              <Checkbox
                v-model="downloadAgreement"
                input-id="terms_of_use"
                :binary="true"
                @update:model-value="(checked) => (showTermsOfUse = !checked)"
              />
              <label for="terms_of_use" class="ml-2">{{
                $t("rooms.files.terms_of_use.accept")
              }}</label>
            </div>
          </AccordionContent>
        </AccordionPanel>
      </Accordion>
    </Message>

    <RoomTabFilesSystemDefault
      v-if="
        userPermissions.can('manageSettings', props.room) &&
        systemDefault.file != null
      "
      :room-id="props.room.id"
      :file="systemDefault.file"
      :use-in-meeting="systemDefault.use_in_meeting"
      :prefer-as-default="systemDefault.prefer_as_default"
      :default-file="defaultFile"
      :disabled="isBusy"
      @edited="loadData()"
    />

    <div class="flex flex-col-reverse justify-between gap-2 lg:flex-row">
      <div class="flex grow flex-col justify-between gap-2 lg:flex-row">
        <search>
          <InputGroup data-test="room-files-search">
            <InputText
              v-model="search"
              :disabled="isBusy"
              type="search"
              :placeholder="$t('app.search')"
              @keyup.enter="loadData(1)"
            />
            <Button
              v-tooltip="$t('app.search')"
              :disabled="isBusy"
              :aria-label="$t('rooms.files.search_aria')"
              icon="fa-solid fa-magnifying-glass"
              @click="loadData(1)"
            />
          </InputGroup>
        </search>
        <div class="flex flex-col gap-2 lg:flex-row">
          <InputGroup v-if="userPermissions.can('manageSettings', props.room)">
            <InputGroupAddon aria-hidden="true">
              <i class="fa-solid fa-filter"></i>
            </InputGroupAddon>
            <Select
              v-model="filter"
              :disabled="isBusy"
              :options="filterOptions"
              option-label="name"
              option-value="value"
              data-test="filter-dropdown"
              :aria-label="$t('rooms.files.filter_aria')"
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
            <InputGroupAddon aria-hidden="true">
              <i class="fa-solid fa-sort"></i>
            </InputGroupAddon>
            <Select
              v-model="sortField"
              :disabled="isBusy"
              :options="sortFields"
              option-label="name"
              option-value="value"
              data-test="sorting-type-dropdown"
              :aria-label="$t('rooms.files.sort_by')"
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
                :aria-label="
                  sortOrder === 1
                    ? $t('rooms.files.sort_ascending')
                    : $t('rooms.files.sort_descending')
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
        <RoomTabFilesUploadButton
          v-if="userPermissions.can('manageSettings', props.room)"
          :room-id="props.room.id"
          :disabled="isBusy"
          @uploaded="loadData()"
        />

        <!-- Reload file list -->
        <Button
          v-tooltip="$t('app.reload')"
          data-test="room-files-reload-button"
          class="shrink-0"
          :aria-label="$t('rooms.files.reload_aria')"
          severity="secondary"
          :disabled="isBusy"
          icon="fa-solid fa-sync"
          @click="loadData()"
        />
      </div>
    </div>

    <!-- Display files -->
    <OverlayComponent :show="isBusy || loadingError" :z-index="1">
      <template #overlay>
        <LoadingRetryButton :error="loadingError" @reload="loadData()" />
      </template>
      <DataView
        :total-records="paginator.getTotalRecords()"
        :rows="paginator.getRows()"
        :first="paginator.getFirst()"
        :value="files"
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
          <div>
            <div v-if="!isBusy && !loadingError">
              <InlineNote v-if="paginator.isEmptyUnfiltered()">{{
                $t("rooms.files.nodata")
              }}</InlineNote>
              <InlineNote v-else>{{ $t("app.filter_no_results") }}</InlineNote>
            </div>
          </div>
        </template>

        <template #list="slotProps">
          <div>
            <div v-for="item in slotProps.items" :key="item.id">
              <div
                data-test="room-file-item"
                class="flex flex-col justify-between gap-4 border-t border-surface py-4 md:flex-row"
              >
                <div class="flex flex-col gap-2">
                  <div class="flex flex-col gap-2 md:flex-row md:items-center">
                    <p class="text-word-break m-0 text-lg font-semibold">
                      {{ item.filename }}
                    </p>
                    <div>
                      <Tag
                        v-if="
                          defaultFile?.id === item.id &&
                          userPermissions.can('manageSettings', props.room) &&
                          systemDefault.file !== null &&
                          systemDefault.prefer_as_default
                        "
                        severity="secondary"
                        value="Default presentation fallback"
                      >
                        <template #icon>
                          <CircleNumberIcon
                            :number="2"
                            data-test="room-file-default-priority"
                          />
                        </template>
                      </Tag>
                      <Tag
                        v-else-if="
                          defaultFile?.id === item.id &&
                          userPermissions.can('manageSettings', props.room)
                        "
                        severity="warn"
                        :value="$t('rooms.files.default')"
                      >
                        <template #icon>
                          <CircleNumberIcon
                            :number="1"
                            data-test="room-file-default-priority"
                          />
                        </template>
                      </Tag>
                    </div>
                  </div>

                  <div
                    v-if="
                      defaultFile?.id === item.id &&
                      userPermissions.can('manageSettings', props.room) &&
                      systemDefault.file !== null &&
                      systemDefault.prefer_as_default
                    "
                    class="flex flex-col items-start gap-2"
                  >
                    <div class="flex flex-row items-center gap-2">
                      <i class="fa-solid fa-info" />
                      <p class="m-0 text-sm">
                        Will be used as the default presentation if no
                        system-wide presentation is available.
                      </p>
                    </div>
                  </div>
                  <div class="flex flex-col items-start gap-2">
                    <div class="flex flex-row items-center gap-2">
                      <i class="fa-solid fa-clock" />
                      <p class="m-0 text-sm">
                        {{ $d(new Date(item.uploaded), "datetimeLong") }}
                      </p>
                    </div>
                  </div>
                  <div
                    v-if="userPermissions.can('manageSettings', props.room)"
                    class="flex flex-col items-start gap-2"
                  >
                    <div class="flex flex-row items-center gap-2">
                      <i class="fa-solid fa-chalkboard-user"></i>
                      <p class="m-0 flex flex-row gap-2 text-sm">
                        <Tag
                          v-if="item.use_in_meeting"
                          severity="success"
                          :value="$t('rooms.files.available_in_next_meeting')"
                        />
                        <Tag
                          v-else
                          severity="secondary"
                          :value="
                            $t('rooms.files.not_available_in_next_meeting')
                          "
                        />
                      </p>
                    </div>
                  </div>
                  <div
                    v-if="userPermissions.can('manageSettings', props.room)"
                    class="flex flex-col items-start gap-2"
                  >
                    <div class="flex flex-row items-center gap-2">
                      <i class="fa-solid fa-download" />
                      <p class="m-0 text-sm">
                        <Tag
                          v-if="item.download"
                          severity="success"
                          :value="$t('rooms.files.download_allowed')"
                        />
                        <Tag
                          v-else
                          severity="secondary"
                          :value="$t('rooms.files.download_not_allowed')"
                        />
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  class="flex shrink-0 flex-row items-start justify-end gap-1"
                >
                  <RoomTabFilesDefaultButton
                    v-if="userPermissions.can('manageSettings', props.room)"
                    :room-id="props.room.id"
                    :file-id="item.id"
                    :filename="item.filename"
                    :use-in-meeting="item.use_in_meeting"
                    :default="defaultFile?.id === item.id"
                    :prefer-system-default="systemDefault.prefer_as_default"
                    :disabled="isBusy"
                    @edited="loadData()"
                    @not-found="loadData()"
                  />
                  <RoomTabFilesViewButton
                    :room-id="props.room.id"
                    :file-url="item.url"
                    :filename="item.filename"
                    :room-auth-token="props.roomAuthToken"
                    :disabled="isBusy"
                    :require-terms-of-use-acceptance="
                      !downloadAgreement && requireAgreement
                    "
                  />
                  <RoomTabFilesConfigureButton
                    v-if="userPermissions.can('manageSettings', props.room)"
                    :room-id="props.room.id"
                    :file-id="item.id"
                    :filename="item.filename"
                    :use-in-meeting="item.use_in_meeting"
                    :download="item.download"
                    :disabled="isBusy"
                    @edited="loadData()"
                    @not-found="loadData()"
                  />

                  <RoomTabFilesDeleteButton
                    v-if="userPermissions.can('manageSettings', props.room)"
                    :room-id="props.room.id"
                    :file-id="item.id"
                    :filename="item.filename"
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
  </div>
</template>
<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { useApi } from "../composables/useApi.js";
import { usePaginator } from "../composables/usePaginator.js";
import { useI18n } from "vue-i18n";
import { onRoomHasChanged } from "../composables/useRoomHelpers.js";
import { useSettingsStore } from "../stores/settings.js";
import { useToast } from "../composables/useToast.js";
import { EVENT_FORBIDDEN } from "../constants/events.js";
import EventBus from "../services/EventBus.js";
import {
  HTTP_ERROR_FORBIDDEN,
  HTTP_ERROR_FILE_NOT_FOUND,
  HTTP_ERROR_GUESTS_NOT_ALLOWED,
  HTTP_ERROR_GUESTS_ONLY,
  HTTP_ERROR_ROOM_INVALID_AUTH_TOKEN,
  HTTP_ERROR_ROOM_REQUIRE_CODE,
  HTTP_ERROR_NOT_FOUND,
} from "../constants/httpCustomErrorMessages.js";
import {
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_UNAUTHORIZED,
} from "../constants/httpStatusCodes.js";

const props = defineProps({
  room: {
    type: Object,
    required: true,
  },
  roomAuthToken: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits([
  "invalidRoomAuthToken",
  "requireCode",
  "guestsNotAllowed",
]);

const api = useApi();
const userPermissions = useUserPermissions();
const paginator = usePaginator();
const { t } = useI18n();
const settingsStore = useSettingsStore();
const toast = useToast();

const files = ref([]);
const defaultFile = ref(null);
const isBusy = ref(false);
const loadingError = ref(false);
const sortField = ref("uploaded");
const sortOrder = ref(0);
const showTermsOfUse = ref(true);

const search = ref("");
const filter = ref("all");

const systemDefault = ref({
  file: null,
  use_in_meeting: false,
  prefer_as_default: false,
});

const sortFields = computed(() => [
  { name: t("rooms.files.sort.filename"), value: "filename" },
  { name: t("rooms.files.sort.uploaded_at"), value: "uploaded" },
]);

const filterOptions = computed(() => [
  { name: t("rooms.files.filter.all"), value: "all" },
  { name: t("rooms.files.filter.downloadable"), value: "downloadable" },
  { name: t("rooms.files.filter.use_in_meeting"), value: "use_in_meeting" },
]);

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 1 ? 0 : 1;
  loadData(1);
};

const downloadAgreement = ref(false);

const requireAgreement = computed(() => {
  return (
    !userPermissions.can("manageSettings", props.room) &&
    settingsStore.getSetting("room.file_terms_of_use") !== null
  );
});

/**
 * (Re)load file list
 */
function loadData(page = null) {
  // Change table to busy state
  isBusy.value = true;
  loadingError.value = false;

  // Fetch file list
  const config = {
    params: {
      page: page || paginator.getCurrentPage(),
      sort_by: sortField.value,
      sort_direction: sortOrder.value === 1 ? "asc" : "desc",
      query: search.value === "" ? null : search.value,
      filter: filter.value === "all" ? null : filter.value,
    },
  };

  if (props.roomAuthToken) {
    config.params.room_auth_token = props.roomAuthToken.id;
    config.params.room_auth_token_type = props.roomAuthToken.type;
  }

  api
    .call("rooms/" + props.room.id + "/files", config)
    .then((response) => {
      // Fetch successful
      files.value = response.data.data;
      defaultFile.value = response.data.default;
      systemDefault.value = response.data.system_default;
      paginator.updateMeta(response.data.meta).then(() => {
        if (paginator.isOutOfRange()) {
          loadData(paginator.getLastPage());
        }
      });
    })
    .catch((error) => {
      if (error.response) {
        // Room auth token is invalid
        if (
          error.response.status === HTTP_STATUS_UNAUTHORIZED &&
          error.response.data.message === HTTP_ERROR_ROOM_INVALID_AUTH_TOKEN
        ) {
          return emit("invalidRoomAuthToken");
        }

        // Forbidden, require access code
        if (
          error.response.status === HTTP_STATUS_FORBIDDEN &&
          error.response.data.message === HTTP_ERROR_ROOM_REQUIRE_CODE
        ) {
          return emit("requireCode");
        }
      }
      api.error(error, { redirectOnUnauthenticated: false });
      paginator.revertFirst();
      loadingError.value = true;
    })
    .finally(() => {
      isBusy.value = false;
    });
}

function onPage(event) {
  loadData(event.page + 1);
}

/**
 * Handle file error messages
 */
function handleFileErrorMessages(event) {
  // Check origin
  if (event.origin !== settingsStore.getSetting("general.base_url")) return;
  if (event.data?.type === null || event.data?.type === undefined) return;
  if (
    event.data.type === HTTP_ERROR_FILE_NOT_FOUND ||
    event.data.type === HTTP_ERROR_NOT_FOUND
  ) {
    // File not found
    toast.error(t("rooms.flash.file_gone"));
    loadData();
  } else if (event.data.type === HTTP_ERROR_ROOM_INVALID_AUTH_TOKEN) {
    // Room auth token is invalid
    emit("invalidRoomAuthToken");
  } else if (event.data.type === HTTP_ERROR_ROOM_REQUIRE_CODE) {
    // Forbidden, require access code
    emit("requireCode");
  } else if (event.data.type === HTTP_ERROR_FORBIDDEN) {
    // Forbidden, not allowed to view file
    toast.error(t("rooms.flash.file_forbidden"));
    EventBus.emit(EVENT_FORBIDDEN);
    // Reload file to reflect changes to file visibility (e.g. download no longer allowed)
    // This can result in multiple reloads in some cases, but ensures the file list stays up to date
    loadData();
  } else if (event.data.type === HTTP_ERROR_GUESTS_NOT_ALLOWED) {
    // Guests are not allowed
    emit("guestsNotAllowed");
  } else if (event.data.type === HTTP_ERROR_GUESTS_ONLY) {
    api.handleGuestsOnly();
  }
}

onMounted(() => {
  loadData();
  // Listen for messages from file viewer window
  window.addEventListener("message", handleFileErrorMessages);
});

onUnmounted(() => {
  window.removeEventListener("message", handleFileErrorMessages);
});

onRoomHasChanged(
  () => props.room,
  () => loadData(),
);
</script>
