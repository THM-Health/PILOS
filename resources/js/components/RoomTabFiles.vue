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

    <div class="flex flex-col-reverse justify-between gap-2 px-2 lg:flex-row">
      <div class="flex grow flex-col justify-between gap-2 lg:flex-row">
        <div>
          <InputGroup data-test="room-files-search">
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
          :aria-label="$t('app.reload')"
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
            <div v-if="!isBusy && !loadingError" class="px-2">
              <InlineNote v-if="paginator.isEmptyUnfiltered()">{{
                $t("rooms.files.nodata")
              }}</InlineNote>
              <InlineNote v-else>{{ $t("app.filter_no_results") }}</InlineNote>
            </div>
          </div>
        </template>

        <template #list="slotProps">
          <div class="px-2">
            <div v-for="item in slotProps.items" :key="item.id">
              <div
                data-test="room-file-item"
                class="flex flex-col justify-between gap-4 border-t py-4 md:flex-row"
              >
                <div class="flex flex-col gap-2">
                  <p class="text-word-break m-0 text-lg font-semibold">
                    {{ item.filename }}
                  </p>
                  <div class="flex flex-col items-start gap-2">
                    <div class="flex flex-row gap-2">
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
                    <div class="flex flex-row gap-2">
                      <i class="fa-solid fa-download" />
                      <p class="m-0 text-sm">
                        <Tag v-if="item.download" severity="success">{{
                          $t("rooms.files.download_visible")
                        }}</Tag>
                        <Tag v-else severity="danger">{{
                          $t("rooms.files.download_hidden")
                        }}</Tag>
                      </p>
                    </div>
                  </div>
                  <div
                    v-if="userPermissions.can('manageSettings', props.room)"
                    class="flex flex-col items-start gap-2"
                  >
                    <div class="flex flex-row gap-2">
                      <i
                        v-if="item.use_in_meeting"
                        class="fa-solid fa-circle-check"
                      ></i>
                      <i v-else class="fa-solid fa-circle-xmark"></i>
                      <p class="m-0 flex flex-row gap-2 text-sm">
                        <Tag v-if="item.use_in_meeting" severity="success">{{
                          $t("rooms.files.use_in_next_meeting")
                        }}</Tag>
                        <Tag v-else severity="danger">{{
                          $t("rooms.files.use_in_next_meeting_disabled")
                        }}</Tag>
                        <Tag
                          v-if="defaultFile?.id === item.id"
                          class="flex flex-row items-start gap-2"
                        >
                          <i class="fa-solid fa-star"></i>
                          {{ $t("rooms.files.default") }}
                        </Tag>
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  class="flex shrink-0 flex-row items-start justify-end gap-1"
                >
                  <RoomTabFilesViewButton
                    :room-id="props.room.id"
                    :file-id="item.id"
                    :token="props.token"
                    :access-code="props.accessCode"
                    :disabled="isBusy"
                    :require-terms-of-use-acceptance="
                      !downloadAgreement && requireAgreement
                    "
                    @file-not-found="loadData()"
                    @invalid-code="emit('invalidCode')"
                    @invalid-token="emit('invalidToken')"
                  />
                  <RoomTabFilesEditButton
                    v-if="userPermissions.can('manageSettings', props.room)"
                    :room-id="props.room.id"
                    :file-id="item.id"
                    :filename="item.filename"
                    :use-in-meeting="item.use_in_meeting"
                    :download="item.download"
                    :default="defaultFile?.id === item.id"
                    :disabled="isBusy"
                    @edited="loadData()"
                    @deleted="loadData()"
                  />
                  <RoomTabFilesDeleteButton
                    v-if="userPermissions.can('manageSettings', props.room)"
                    :room-id="props.room.id"
                    :file-id="item.id"
                    :filename="item.filename"
                    :disabled="isBusy"
                    @deleted="loadData()"
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
import env from "../env.js";
import { computed, onMounted, ref } from "vue";
import { useUserPermissions } from "../composables/useUserPermission.js";
import { useApi } from "../composables/useApi.js";
import { usePaginator } from "../composables/usePaginator.js";
import { useI18n } from "vue-i18n";
import { onRoomHasChanged } from "../composables/useRoomHelpers.js";
import { useSettingsStore } from "../stores/settings.js";

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
const paginator = usePaginator();
const { t } = useI18n();
const settingsStore = useSettingsStore();

const files = ref([]);
const defaultFile = ref(null);
const isBusy = ref(false);
const loadingError = ref(false);
const sortField = ref("uploaded");
const sortOrder = ref(0);
const showTermsOfUse = ref(true);

const search = ref("");
const filter = ref("all");

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
    .call("rooms/" + props.room.id + "/files", config)
    .then((response) => {
      // Fetch successful
      files.value = response.data.data;
      defaultFile.value = response.data.default;
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

onMounted(() => {
  loadData();
});

onRoomHasChanged(
  () => props.room,
  () => loadData(),
);
</script>
